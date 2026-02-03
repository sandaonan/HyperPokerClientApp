import { supabase, isSupabaseAvailable } from '../lib/supabaseClient';
import type { Database } from '../supabase';

export interface TournamentPaidData {
  tournamentId: number;
  tournamentName: string;
  playerCount: number;
  maxPlayers?: number; // Maximum players for this tournament
  startTime?: string | null; // Optional start time for display
}

/**
 * Get paid players data for tournaments created from a specific tournament_waitlist
 * @param tournamentWaitlistId - The ID of the tournament_waitlist
 * @param clubId - The club ID
 * @returns Array of tournament data with player counts
 */
export async function getPaidPlayersByWaitlistId(
  tournamentWaitlistId: number,
  clubId: number
): Promise<TournamentPaidData[]> {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error('Supabase is not configured');
  }

  try {
    // 1. Find all tournaments created from this waitlist
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournament')
      .select('id, name, scheduled_start_time, max_players')
      .eq('from_waitlist_id', tournamentWaitlistId)
      .eq('club_id', clubId);

    if (tournamentsError) {
      console.error('Error fetching tournaments:', tournamentsError);
      throw new Error(`取得賽事資料失敗：${tournamentsError.message}`);
    }

    if (!tournaments || tournaments.length === 0) {
      return [];
    }

    // 2. For each tournament, count players with active status
    // Note: tournament_player_status enum only has: "active", "eliminated", "cancelled"
    const tournamentIds = tournaments.map(t => t.id);
    const { data: tournamentPlayers, error: playersError } = await supabase
      .from('tournament_player')
      .select('tournament_id, status')
      .in('tournament_id', tournamentIds)
      .eq('status', 'active'); // Only count active players (paid players are active)

    if (playersError) {
      console.error('Error fetching tournament players:', playersError);
      throw new Error(`取得參賽者資料失敗：${playersError.message}`);
    }

    // 3. Count players per tournament
    const playerCountMap = new Map<number, number>();
    (tournamentPlayers || []).forEach(tp => {
      playerCountMap.set(
        tp.tournament_id,
        (playerCountMap.get(tp.tournament_id) || 0) + 1
      );
    });

    // 4. Map to TournamentPaidData format
    const result: TournamentPaidData[] = tournaments.map(t => ({
      tournamentId: t.id,
      tournamentName: t.name || `賽事 #${t.id}`,
      playerCount: playerCountMap.get(t.id) || 0,
      maxPlayers: t.max_players || undefined,
      startTime: t.scheduled_start_time || null,
    }));

    return result;
  } catch (error: any) {
    console.error('Error fetching paid players by waitlist ID:', error);
    throw error;
  }
}

/**
 * Get total paid players count for a tournament waitlist
 * @param tournamentWaitlistId - The ID of the tournament_waitlist
 * @param clubId - The club ID
 * @returns Total number of paid players across all tournaments
 */
export async function getTotalPaidPlayersCount(
  tournamentWaitlistId: number,
  clubId: number
): Promise<number> {
  const tournaments = await getPaidPlayersByWaitlistId(tournamentWaitlistId, clubId);
  return tournaments.reduce((sum, t) => sum + t.playerCount, 0);
}

