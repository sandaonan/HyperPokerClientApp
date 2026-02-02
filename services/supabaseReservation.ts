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
    .in('status', ['waiting', 'confirmed']); // Check for active reservations

  if (checkError) {
    console.error('Error checking existing reservations:', checkError);
    throw new Error(`檢查預約記錄時發生錯誤：${checkError.message}`);
  }

  if (existingReservations && existingReservations.length > 0) {
    throw new Error('您已經預約過此賽事');
  }

  // Calculate queue_position: find max queue_position for this tournament_waitlist_id and add 1
  const { data: maxQueueData, error: maxQueueError } = await supabase
    .from('reservation')
    .select('queue_position')
    .eq('tournament_waitlist_id', tournamentWaitlistId)
    .in('status', ['waiting', 'confirmed']) // Only count active reservations
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

  // Verify the reservation belongs to this member
  const { data: reservation, error: fetchError } = await supabase
    .from('reservation')
    .select('id, member_id, status')
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

  // Update reservation status to 'cancelled'
  const { error: updateError } = await supabase
    .from('reservation')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
    .eq('member_id', memberId);

  if (updateError) {
    console.error('Error cancelling reservation:', updateError);
    throw new Error(`取消預約失敗：${updateError.message}`);
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
    .in('status', ['waiting', 'confirmed'])
    .order('queue_position', { ascending: true, nullsFirst: false }) // Order by queue_position first
    .order('requested_at', { ascending: true }); // Then by requested_at as fallback

  if (error) {
    console.error('Error fetching reservations:', error);
    throw new Error(`取得預約記錄失敗：${error.message}`);
  }

  return reservations || [];
}

