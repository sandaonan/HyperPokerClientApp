// Supabase Edge Function: Send Push Notification
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@hyperpoker.com';

interface PushNotificationRequest {
  member_id: number;
  notification_type: 'reservation_created' | 'registration_confirmed' | 'tournament_starting';
  tournament_id?: number;
  tournament_name?: string;
  start_time?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  // Note: We don't verify JWT or apikey here because:
  // 1. This Edge Function uses service role key internally, which has sufficient permissions
  // 2. The function requires member_id to send notifications, limiting abuse potential
  // 3. Our app doesn't use Supabase Auth, so JWT validation would always fail
  // 4. The apikey header is still sent from client for Supabase infrastructure compatibility

  try {
    // Parse request body
    const body: PushNotificationRequest = await req.json();
    const { member_id, notification_type, tournament_id, tournament_name, start_time } = body;

    if (!member_id) {
      return new Response(
        JSON.stringify({ error: 'member_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('member_id', member_id);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for member_id: ${member_id}`);
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', sent: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare notification payload based on type
    let notificationTitle = 'HyperPoker';
    let notificationBody = '您有新的通知';

    switch (notification_type) {
      case 'reservation_created':
        notificationTitle = '預約成功';
        // Format start time if available
        let timeStr = '';
        if (start_time) {
          try {
            const startDate = new Date(start_time);
            const month = (startDate.getMonth() + 1).toString().padStart(2, '0');
            const day = startDate.getDate().toString().padStart(2, '0');
            const hours = startDate.getHours().toString().padStart(2, '0');
            const minutes = startDate.getMinutes().toString().padStart(2, '0');
            timeStr = `${month}/${day} ${hours}:${minutes}`;
          } catch (e) {
            console.error('Error formatting start time:', e);
          }
        }
        notificationBody = timeStr 
          ? `${tournament_name || '賽事'} 預約成功\n開始時間：${timeStr}`
          : `${tournament_name || '賽事'} 預約成功，請準時參賽`;
        break;
      case 'registration_confirmed':
        notificationTitle = '報名成功';
        notificationBody = `${tournament_name || '賽事'} 報名完成，請準時參賽`;
        break;
      case 'tournament_starting':
        notificationTitle = '賽事即將開始';
        notificationBody = `${tournament_name || '賽事'} 將在 5 分鐘後開始`;
        break;
    }

    // Validate VAPID keys
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error('VAPID keys are not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID keys are not configured' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    const notificationPayload = JSON.stringify({
      title: notificationTitle,
      body: notificationBody,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: `tournament-${tournament_id || 'unknown'}`,
      data: {
        url: tournament_id ? `/club/${tournament_id}` : '/',
        tournament_id,
        notification_type
      }
    });

    // Import web-push library - try multiple methods for Deno compatibility
    // Method priority: npm: > esm.sh with target=deno > jspm.dev
    let webPush: any;
    let lastError: any = null;
    
    // Method 1: npm: specifier (Deno 1.28+, recommended)
    try {
      console.log('Attempting to import web-push using npm: specifier...');
      const webPushModule = await import('npm:web-push@3.6.6');
      webPush = webPushModule.default || webPushModule;
      
      if (webPush && typeof webPush.sendNotification === 'function') {
        console.log('Successfully imported web-push using npm: specifier');
      } else {
        throw new Error('web-push.sendNotification is not a function');
      }
    } catch (npmError: any) {
      console.error('npm: import failed:', npmError.message);
      lastError = npmError;
      
      // Method 2: esm.sh with explicit Deno target
      try {
        console.log('Attempting to import web-push using esm.sh with target=deno...');
        const webPushModule2 = await import('https://esm.sh/web-push@3.6.6?target=deno');
        webPush = webPushModule2.default || webPushModule2;
        
        if (webPush && typeof webPush.sendNotification === 'function') {
          console.log('Successfully imported web-push using esm.sh');
        } else {
          throw new Error('esm.sh import: sendNotification is not a function');
        }
      } catch (esmError: any) {
        console.error('esm.sh import failed:', esmError.message);
        lastError = esmError;
        
        // Method 3: jspm.dev (alternative CDN)
        try {
          console.log('Attempting to import web-push using jspm.dev...');
          const webPushModule3 = await import('https://jspm.dev/web-push@3.6.6');
          webPush = webPushModule3.default || webPushModule3;
          
          if (webPush && typeof webPush.sendNotification === 'function') {
            console.log('Successfully imported web-push using jspm.dev');
          } else {
            throw new Error('jspm.dev import: sendNotification is not a function');
          }
        } catch (jspmError: any) {
          console.error('All import methods failed:', {
            npm: npmError.message,
            esm: esmError.message,
            jspm: jspmError.message
          });
          
          return new Response(
            JSON.stringify({ 
              error: 'Failed to initialize web-push library',
              details: `All import methods failed. Last error: ${jspmError.message}`,
              suggestions: [
                'Check Deno version (npm: requires Deno 1.28+)',
                'Verify network connectivity to CDN services',
                'Check Supabase Edge Functions Deno runtime version',
                'Consider using alternative push notification service'
              ],
              attempted_methods: ['npm:', 'esm.sh?target=deno', 'jspm.dev']
            }),
            { 
              status: 500, 
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              } 
            }
          );
        }
      }
    }

    // Send notification to each subscription
    let sentCount = 0;
    const failedSubscriptions: number[] = [];

    for (const subscription of subscriptions) {
      try {
        // Validate subscription data
        if (!subscription.endpoint || !subscription.p256dh || !subscription.auth) {
          console.error(`Invalid subscription data for subscription ${subscription.id}`);
          failedSubscriptions.push(subscription.id);
          continue;
        }

        // Validate and format all parameters before calling webPush
        if (!subscription.endpoint || !subscription.p256dh || !subscription.auth) {
          throw new Error(`Invalid subscription data: missing required fields`);
        }
        
        if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
          throw new Error(`VAPID keys are missing`);
        }
        
        // Ensure all parameters are properly formatted strings
        const pushSubscription = {
          endpoint: String(subscription.endpoint).trim(),
          keys: {
            p256dh: String(subscription.p256dh).trim(),
            auth: String(subscription.auth).trim()
          }
        };
        
        // Validate VAPID keys are not empty after trimming
        const publicKey = String(VAPID_PUBLIC_KEY).trim();
        const privateKey = String(VAPID_PRIVATE_KEY).trim();
        const subject = String(VAPID_SUBJECT).trim();
        
        if (!publicKey || !privateKey || !subject) {
          throw new Error(`VAPID keys are empty after formatting`);
        }
        
        const vapidOptions = {
          vapidDetails: {
            subject: subject,
            publicKey: publicKey,
            privateKey: privateKey
          }
        };
        
        // Ensure notificationPayload is a string
        const payloadString = typeof notificationPayload === 'string' 
          ? notificationPayload 
          : JSON.stringify(notificationPayload);
        
        // Validate webPush object before calling
        if (!webPush || typeof webPush.sendNotification !== 'function') {
          throw new Error(`webPush.sendNotification is not a function. webPush type: ${typeof webPush}`);
        }
        
        // Log the call for debugging
        console.log(`[${subscription.id}] Attempting to send notification to endpoint: ${pushSubscription.endpoint.substring(0, 60)}...`);
        console.log(`[${subscription.id}] Payload length: ${payloadString.length} bytes`);
        console.log(`[${subscription.id}] VAPID subject: ${vapidOptions.vapidDetails.subject}`);
        
        try {
          const result = await webPush.sendNotification(
            pushSubscription,
            payloadString,
            vapidOptions
          );
          console.log(`[${subscription.id}] ✅ Successfully sent notification`, {
            statusCode: result?.statusCode,
            headers: result?.headers
          });
          sentCount++;
        } catch (sendError: any) {
          // Re-throw to be caught by outer catch
          throw sendError;
        }
      } catch (error: any) {
        console.error(`[${subscription.id}] ❌ Failed to send notification:`, {
          error: error.message || error,
          statusCode: error.statusCode,
          name: error.name,
          code: error.code,
          endpoint: subscription.endpoint?.substring(0, 60)
        });
        
        // If subscription is invalid (410 Gone or 404 Not Found), mark for deletion
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`[${subscription.id}] Marking subscription for deletion (status: ${error.statusCode})`);
          failedSubscriptions.push(subscription.id);
        }
      }
    }

    // Delete invalid subscriptions
    if (failedSubscriptions.length > 0) {
      console.log(`🗑️ Deleting ${failedSubscriptions.length} invalid subscriptions:`, failedSubscriptions);
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', failedSubscriptions);
      
      if (deleteError) {
        console.error('❌ Failed to delete invalid subscriptions:', deleteError);
      } else {
        console.log(`✅ Successfully deleted ${failedSubscriptions.length} invalid subscriptions`);
      }
    }

    // Log final summary
    console.log(`📊 Notification Summary:`, {
      total: subscriptions.length,
      sent: sentCount,
      failed: failedSubscriptions.length,
      success: sentCount > 0 ? '✅' : '❌'
    });

    return new Response(
      JSON.stringify({
        message: 'Notifications sent',
        sent: sentCount,
        total: subscriptions.length,
        failed: failedSubscriptions.length
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in send-push-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

