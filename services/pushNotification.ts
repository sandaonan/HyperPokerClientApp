import { supabase, isSupabaseAvailable } from '../lib/supabaseClient';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

/**
 * Convert VAPID public key from base64url to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('此瀏覽器不支援通知功能');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    throw new Error('通知權限已被拒絕，請在瀏覽器設定中啟用');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Register Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Push Notification] Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    // Service Worker registered successfully (no need to log)
    return registration;
  } catch (error) {
    console.error('[Push Notification] Service Worker registration failed:', error);
    throw error;
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(
  memberId: number,
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  // Log VAPID key status for debugging
  console.log('[Push Notification] VAPID Public Key:', VAPID_PUBLIC_KEY ? `Configured (${VAPID_PUBLIC_KEY.substring(0, 20)}...)` : 'Missing');
  
  if (!VAPID_PUBLIC_KEY) {
    const errorMsg = 'VAPID 公鑰未配置，請檢查環境變數 VITE_VAPID_PUBLIC_KEY';
    console.error('[Push Notification] ⚠️', errorMsg);
    throw new Error(errorMsg);
  }

  try {
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create new subscription
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      } catch (subscribeError: any) {
        console.error('[Push Notification] Failed to create push subscription:', subscribeError);
        if (subscribeError.name === 'NotAllowedError') {
          throw new Error('瀏覽器拒絕了推播訂閱請求，請檢查通知權限');
        } else if (subscribeError.name === 'InvalidStateError') {
          throw new Error('訂閱狀態無效，請重新整理頁面後再試');
        } else if (subscribeError.message?.includes('VAPID') || subscribeError.message?.includes('key')) {
          throw new Error('VAPID 金鑰格式錯誤，請檢查環境變數設定');
        } else {
          throw new Error(`建立訂閱失敗：${subscribeError.message || subscribeError.name}`);
        }
      }
    }

    // Save subscription to Supabase
    try {
      await saveSubscriptionToSupabase(memberId, subscription);
    } catch (saveError: any) {
      console.error('[Push Notification] Failed to save subscription to database:', saveError);
      // 如果保存失敗，但訂閱已建立，我們仍然拋出錯誤讓用戶知道
      if (saveError.message?.includes('權限') || saveError.message?.includes('permission') || saveError.message?.includes('policy')) {
        throw new Error('無法保存訂閱到資料庫：權限錯誤，請檢查 RLS 策略');
      } else {
        throw new Error(`無法保存訂閱到資料庫：${saveError.message || '未知錯誤'}`);
      }
    }

    // Successfully subscribed
    return subscription;
  } catch (error: any) {
    console.error('[Push Notification] Subscription failed:', error);
    // 如果錯誤已經有詳細訊息，直接拋出；否則包裝成更友好的訊息
    if (error.message && !error.message.includes('訂閱')) {
      throw error;
    } else {
      throw new Error(`訂閱失敗：${error.message || '未知錯誤'}`);
    }
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(
  memberId: number,
  registration: ServiceWorkerRegistration
): Promise<boolean> {
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      try {
        await subscription.unsubscribe();
      } catch (unsubError: any) {
        console.error('[Push Notification] Failed to unsubscribe from push manager:', unsubError);
        // 即使 unsubscribe 失敗，我們仍然嘗試從資料庫刪除
      }
      
      try {
        await deleteSubscriptionFromSupabase(memberId, subscription.endpoint);
      } catch (deleteError: any) {
        console.error('[Push Notification] Failed to delete subscription from database:', deleteError);
        // 如果刪除失敗，繼續嘗試刪除所有訂閱
      }
    }
    
    // Also delete all subscriptions for this member from Supabase (in case there are multiple)
    // This ensures we clean up any orphaned subscriptions
    try {
      await deleteAllSubscriptionsFromSupabase(memberId);
    } catch (deleteAllError: any) {
      console.error('[Push Notification] Failed to delete all subscriptions:', deleteAllError);
      // 不拋出錯誤，因為這只是清理操作
    }
    
    return true;
  } catch (error: any) {
    console.error('[Push Notification] Unsubscribe failed:', error);
    throw new Error(`取消訂閱失敗：${error.message || '未知錯誤'}`);
  }
}

/**
 * Save push subscription to Supabase
 */
async function saveSubscriptionToSupabase(
  memberId: number,
  subscription: PushSubscription
): Promise<void> {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error('Supabase is not configured');
  }

  const subscriptionData = subscription.toJSON();
  if (!subscriptionData.keys) {
    throw new Error('Invalid subscription data');
  }

  const payload = {
    member_id: memberId,
    endpoint: subscription.endpoint,
    p256dh: subscriptionData.keys.p256dh,
    auth: subscriptionData.keys.auth,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('push_subscriptions')
    .upsert(payload, {
      onConflict: 'member_id,endpoint'
    })
    .select();

  if (error) {
    // Only log errors, not success cases
    console.error('[Push Notification] Failed to save subscription:', error);
    
    // Check if it's a permission error
    if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
      throw new Error(`權限錯誤：無法寫入資料庫。請檢查 RLS 策略或表權限。錯誤：${error.message}`);
    }
    
    throw new Error(`保存訂閱失敗：${error.message}`);
  }

  if (!data || data.length === 0) {
    console.warn('[Push Notification] Subscription upsert completed but no data returned');
  }
}

/**
 * Delete push subscription from Supabase
 */
async function deleteSubscriptionFromSupabase(
  memberId: number,
  endpoint: string
): Promise<void> {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('member_id', memberId)
    .eq('endpoint', endpoint);

  if (error) {
    console.error('[Push Notification] Failed to delete subscription:', error);
    throw new Error(`刪除訂閱失敗：${error.message}`);
  }
}

/**
 * Delete all push subscriptions for a member from Supabase
 */
async function deleteAllSubscriptionsFromSupabase(
  memberId: number
): Promise<void> {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('member_id', memberId);

  if (error) {
    console.error('[Push Notification] Failed to delete all subscriptions:', error);
    // Don't throw - this is a cleanup operation, not critical
  } else {
    // Successfully deleted subscriptions (no need to log)
  }
}

/**
 * Check if user has active push subscription in database
 */
export async function hasPushSubscriptionInDatabase(memberId: number): Promise<boolean> {
  if (!isSupabaseAvailable() || !supabase) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('member_id', memberId)
      .limit(1);

    if (error) {
      // Only log errors, not normal operations
      console.error('[Push Notification] Error checking subscription:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('[Push Notification] Exception checking subscription in database:', error);
    return false;
  }
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

