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
  if (!VAPID_PUBLIC_KEY) {
    console.warn('[Push Notification] ⚠️ VAPID public key not configured');
    console.warn('[Push Notification] Please add VITE_VAPID_PUBLIC_KEY to your .env.local file');
    console.warn('[Push Notification] You can generate VAPID keys by running: npx web-push generate-vapid-keys');
    // Don't return null - still try to save subscription to database even without VAPID key
    // The subscription might be created by another device/browser that has VAPID key configured
  }

  try {
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    // Save subscription to Supabase
    await saveSubscriptionToSupabase(memberId, subscription);

    // Successfully subscribed (no need to log)
    return subscription;
  } catch (error) {
    console.error('[Push Notification] Subscription failed:', error);
    throw error;
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
      await subscription.unsubscribe();
      await deleteSubscriptionFromSupabase(memberId, subscription.endpoint);
      // Successfully unsubscribed (no need to log)
    }
    
    // Also delete all subscriptions for this member from Supabase (in case there are multiple)
    // This ensures we clean up any orphaned subscriptions
    await deleteAllSubscriptionsFromSupabase(memberId);
    
    return true;
  } catch (error) {
    console.error('[Push Notification] Unsubscribe failed:', error);
    throw error;
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

