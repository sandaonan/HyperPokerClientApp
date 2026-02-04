import { supabase, isSupabaseAvailable } from '../lib/supabaseClient';
import type { Database } from '../supabase';

type ReservationInsert = Database['public']['Tables']['reservation']['Insert'];

/**
 * Create a reservation for a tournament waitlist
 * @param tournamentWaitlistId - The ID of the tournament_waitlist
 * @param memberId - The member ID (from parseInt(userId))
 * @param clubId - The club ID
 * @returns The created reservation
 */
export async function createReservation(
  tournamentWaitlistId: number,
  memberId: number,
  clubId: number
): Promise<Database['public']['Tables']['reservation']['Row']> {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error('Supabase is not configured');
  }

  // Check if reservation already exists
  const { data: existingReservations, error: checkError } = await supabase
    .from('reservation')
    .select('id, status')
    .eq('tournament_waitlist_id', tournamentWaitlistId)
    .eq('member_id', memberId)
    .eq('club_id', clubId)
    .eq('status', 'waiting'); // Only treat 'waiting' as an active reservation for "already reserved?"

  if (checkError) {
    console.error('Error checking existing reservations:', checkError);
    throw new Error(`檢查預約記錄時發生錯誤：${checkError.message}`);
  }

  if (existingReservations && existingReservations.length > 0) {
    throw new Error('您已經預約過此賽事');
  }

  // Calculate queue_position: find max queue_position for this tournament_waitlist_id (waiting only) and add 1
  const { data: maxQueueData, error: maxQueueError } = await supabase
    .from('reservation')
    .select('queue_position')
    .eq('tournament_waitlist_id', tournamentWaitlistId)
    .eq('status', 'waiting') // Only count waiting reservations for queue ordering
    .not('queue_position', 'is', null) // Exclude null values
    .order('queue_position', { ascending: false })
    .limit(1);

  if (maxQueueError) {
    console.error('Error fetching max queue_position:', maxQueueError);
    // Continue with queue_position = 1 if query fails
  }

  // Calculate new queue_position
  const maxQueuePosition = maxQueueData && maxQueueData.length > 0 && maxQueueData[0].queue_position !== null
    ? maxQueueData[0].queue_position
    : 0;
  
  const newQueuePosition = maxQueuePosition + 1;

  // Create new reservation
  const reservationData: ReservationInsert = {
    tournament_waitlist_id: tournamentWaitlistId,
    member_id: memberId,
    club_id: clubId,
    status: 'waiting',
    requested_at: new Date().toISOString(),
    queue_position: newQueuePosition, // Calculate: max + 1
    // Other fields left as null/undefined
    cancelled_at: null,
    confirmed_at: null,
    expired_at: null,
    notes: null,
  };

  const { data: newReservation, error: insertError } = await supabase
    .from('reservation')
    .insert(reservationData)
    .select()
    .single();

  if (insertError) {
    console.error('Error creating reservation:', insertError);
    throw new Error(`建立預約失敗：${insertError.message}`);
  }

  if (!newReservation) {
    throw new Error('建立預約失敗：無法創建預約記錄');
  }

  // // Trigger push notification for reservation created
  // try {
  //   // Get tournament name for notification
  //   const { data: tournamentData } = await supabase
  //     .from('tournament_waitlist')
  //     .select('name, scheduled_start_time')
  //     .eq('id', tournamentWaitlistId)
  //     .single();

  //   const { sendPushNotification } = await import('./pushNotificationTrigger');
  //   await sendPushNotification({
  //     memberId,
  //     notificationType: 'reservation_created',
  //     tournamentId: tournamentWaitlistId,
  //     tournamentName: tournamentData?.name || '賽事',
  //     startTime: tournamentData?.scheduled_start_time
  //   });
  //   // Don't fail reservation creation if notification fails
  //   console.error('[createReservation] Failed to send push notification:', error);
  // }

  return newReservation;
}

/**
 * Cancel a reservation
 * @param reservationId - The ID of the reservation to cancel
 * @param memberId - The member ID (to verify ownership)
 */
export async function cancelReservation(
  reservationId: number,
  memberId: number
): Promise<void> {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error('Supabase is not configured');
  }

  // Verify the reservation belongs to this member and get queue_position
  const { data: reservation, error: fetchError } = await supabase
    .from('reservation')
    .select('id, member_id, status, tournament_waitlist_id, queue_position')
    .eq('id', reservationId)
    .eq('member_id', memberId)
    .single();

  if (fetchError || !reservation) {
    throw new Error('找不到預約記錄');
  }

  // Only allow cancellation if status is 'waiting'
  if (reservation.status !== 'waiting') {
    throw new Error('此預約無法取消');
  }

  const cancelledQueuePosition = reservation.queue_position;
  const tournamentWaitlistId = reservation.tournament_waitlist_id;

  // Update reservation status to 'cancelled' (preserve history)
  const { error: updateError } = await supabase
    .from('reservation')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      queue_position: null, // Clear queue_position since it's cancelled
    })
    .eq('id', reservationId)
    .eq('member_id', memberId);

  if (updateError) {
    console.error('Error cancelling reservation:', updateError);
    throw new Error(`取消預約失敗：${updateError.message}`);
  }

  // Update queue_position for all reservations after the cancelled one
  // Decrease queue_position by 1 for all reservations with queue_position > cancelledQueuePosition
  if (cancelledQueuePosition !== null && tournamentWaitlistId !== null) {
    // Get all reservations with queue_position > cancelledQueuePosition for the same tournament_waitlist_id
    const { data: laterReservations, error: fetchLaterError } = await supabase
      .from('reservation')
      .select('id, queue_position')
      .eq('tournament_waitlist_id', tournamentWaitlistId)
      .in('status', ['waiting', 'confirmed'])
      .gt('queue_position', cancelledQueuePosition)
      .order('queue_position', { ascending: true });

    if (fetchLaterError) {
      console.error('Error fetching later reservations:', fetchLaterError);
      // Don't throw error - reservation is already cancelled, just log the warning
    } else if (laterReservations && laterReservations.length > 0) {
      // Update each reservation's queue_position by decreasing by 1
      for (const laterReservation of laterReservations) {
        const newQueuePosition = (laterReservation.queue_position || 0) - 1;
        const { error: updateQueueError } = await supabase
          .from('reservation')
          .update({ queue_position: newQueuePosition })
          .eq('id', laterReservation.id);

        if (updateQueueError) {
          console.error(`Error updating queue_position for reservation ${laterReservation.id}:`, updateQueueError);
          // Continue with other updates even if one fails
        }
      }
    }
  }
}

/**
 * Get reservations for a specific tournament waitlist
 * @param tournamentWaitlistId - The ID of the tournament_waitlist
 * @returns Array of reservations
 */
export async function getReservationsByTournamentWaitlist(
  tournamentWaitlistId: number
): Promise<Database['public']['Tables']['reservation']['Row'][]> {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data: reservations, error } = await supabase
    .from('reservation')
    .select('*')
    .eq('tournament_waitlist_id', tournamentWaitlistId)
    .eq('status', 'waiting')
    .order('queue_position', { ascending: true, nullsFirst: false }) // Order by queue_position first
    .order('requested_at', { ascending: true }); // Then by requested_at as fallback

  if (error) {
    console.error('Error fetching reservations:', error);
    throw new Error(`取得預約記錄失敗：${error.message}`);
  }

  return reservations || [];
}

/**
 * Get all reservations for a specific member
 * @param memberId - The member ID
 * @param clubId - Optional club ID to filter by club
 * @returns Array of reservations
 */
export async function getReservationsByMember(
  memberId: number,
  clubId?: number
): Promise<Database['public']['Tables']['reservation']['Row'][]> {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error('Supabase is not configured');
  }

  let query = supabase
    .from('reservation')
    .select('*')
    .eq('member_id', memberId)
    .eq('status', 'waiting'); // Only show waiting reservations as "reserved"

  if (clubId) {
    query = query.eq('club_id', clubId);
  }

  const { data: reservations, error } = await query
    .order('requested_at', { ascending: false });

  if (error) {
    console.error('Error fetching member reservations:', error);
    throw new Error(`取得預約記錄失敗：${error.message}`);
  }

  return reservations || [];
}

