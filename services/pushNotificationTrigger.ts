/**
 * Trigger push notification via Supabase Edge Function
 * This service is used to send push notifications when events occur
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_KEY || '';

/**
 * Send push notification via Edge Function
 * Note: We use anon key as Bearer token since our app doesn't use Supabase Auth
 * The Edge Function should be configured to allow anonymous access in Supabase Dashboard
 */
export async function sendPushNotification(params: {
  memberId: number;
  notificationType: 'reservation_created' | 'registration_confirmed' | 'tournament_starting';
  tournamentId?: number;
  tournamentName?: string;
  startTime?: string;
}): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[Push Notification] Supabase not configured, skipping push notification');
    return;
  }

  const functionUrl = `${SUPABASE_URL}/functions/v1/send-push-notification`;

  try {
    // Use anon key as Bearer token
    // The Edge Function should be configured to allow anonymous access
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY // Required for Edge Functions
      },
      body: JSON.stringify({
        member_id: params.memberId,
        notification_type: params.notificationType,
        tournament_id: params.tournamentId,
        tournament_name: params.tournamentName,
        start_time: params.startTime
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Push Notification] Failed to send notification:', response.status, errorText);
      // Don't throw error - notification failure shouldn't break the main flow
    } else {
      // Success - no need to log
    }
  } catch (error) {
    console.error('[Push Notification] Error sending notification:', error);
    // Don't throw error - notification failure shouldn't break the main flow
  }
}

