import { supabase, isSupabaseAvailable } from '../lib/supabaseClient';
import { Tournament, BlindLevel } from '../types';
import type { Database } from '../supabase';

type TournamentWaitlistRow = Database['public']['Tables']['tournament_waitlist']['Row'];
type BlindStructureRow = Database['public']['Tables']['blind_structure']['Row'];
type ReservationRow = Database['public']['Tables']['reservation']['Row'];

/**
 * Parse blind levels JSON to BlindLevel[]
 * Supports various JSON formats from Supabase blind_levels field
 * (Reused from supabaseTournament.ts)
 */
function parseBlindLevels(blindLevelsJson: any): BlindLevel[] {
  if (!blindLevelsJson || typeof blindLevelsJson !== 'object') {
    return [];
  }
  
  // If it's an array, map each level
  if (Array.isArray(blindLevelsJson)) {
    return blindLevelsJson.map((level: any) => {
      // Check if this is a break entry - support multiple formats
      const hasBreakFlag = 
        level.isBreak === true || 
        level.is_break === true || 
        level.break === true ||
        level.type === 'break' ||
        level.type === 'Break' ||
        level.level_type === 'break';
      
      const smallBlind = level.smallBlind || level.small_blind || level.sb || 0;
      const bigBlind = level.bigBlind || level.big_blind || level.bb || 0;
      const levelNum = level.level || level.level_number || level.levelNumber || 0;
      const hasDuration = (level.duration > 0 || level.breakDuration > 0 || level.break_duration > 0);
      
      const looksLikeBreak = 
        (levelNum === 0 || levelNum === null) &&
        smallBlind === 0 &&
        bigBlind === 0 &&
        hasDuration;
      
      const isBreak = hasBreakFlag || looksLikeBreak;
      
      if (isBreak) {
        const breakDuration = 
          (level.durationMinutes !== undefined && level.durationMinutes !== null) ? level.durationMinutes :
          (level.duration_minutes !== undefined && level.duration_minutes !== null) ? level.duration_minutes :
          (level.duration !== undefined && level.duration !== null) ? level.duration :
          (level.breakDuration !== undefined && level.breakDuration !== null) ? level.breakDuration :
          (level.break_duration !== undefined && level.break_duration !== null) ? level.break_duration :
          0;
        
        const parsedDuration = typeof breakDuration === 'number' ? breakDuration : (parseInt(String(breakDuration)) || 0);
        
        return {
          level: level.level || 0,
          smallBlind: 0,
          bigBlind: 0,
          ante: 0,
          duration: parsedDuration,
          isBreak: true,
          breakDuration: parsedDuration,
        };
      }
      
      // Regular blind level
      let anteValue = 0;
      if ('ante' in level && level.ante !== undefined && level.ante !== null) {
        anteValue = typeof level.ante === 'number' ? level.ante : (parseInt(String(level.ante)) || 0);
      } else if ('ante_amount' in level && level.ante_amount !== undefined && level.ante_amount !== null) {
        anteValue = typeof level.ante_amount === 'number' ? level.ante_amount : (parseInt(String(level.ante_amount)) || 0);
      } else if ('anteAmount' in level && level.anteAmount !== undefined && level.anteAmount !== null) {
        anteValue = typeof level.anteAmount === 'number' ? level.anteAmount : (parseInt(String(level.anteAmount)) || 0);
      }
      
      return {
        level: level.level || level.level_number || level.levelNumber || 0,
        smallBlind: level.smallBlind || level.small_blind || level.sb || 0,
        bigBlind: level.bigBlind || level.big_blind || level.bb || 0,
        ante: anteValue,
        duration: level.duration || level.duration_minutes || level.durationMinutes || 0,
        isBreak: false,
      };
    });
  }
  
  // If it's an object, try to extract levels array
  if (blindLevelsJson.levels && Array.isArray(blindLevelsJson.levels)) {
    return parseBlindLevels(blindLevelsJson.levels);
  }
  
  // If it's an object with level keys
  if (typeof blindLevelsJson === 'object' && !Array.isArray(blindLevelsJson)) {
    const levels: BlindLevel[] = [];
    for (const key in blindLevelsJson) {
      const level = blindLevelsJson[key];
      if (level && typeof level === 'object') {
        const parsed = parseBlindLevels([level]);
        if (parsed.length > 0) {
          levels.push(parsed[0]);
        }
      }
    }
    return levels.sort((a, b) => a.level - b.level);
  }
  
  return [];
}

/**
 * Map tournament_waitlist_status to frontend tournament status
 */
function mapWaitlistStatus(status: Database['public']['Enums']['tournament_waitlist_status']): {
  isLateRegEnded: boolean;
} {
  // scheduled, registration, completed, cancelled
  // registration means open for registration
  // completed and cancelled should be filtered out
  return {
    isLateRegEnded: status === 'completed' || status === 'cancelled',
  };
}

/**
 * Convert tournament_waitlist row to Tournament type
 */
function tournamentWaitlistRowToTournament(
  row: TournamentWaitlistRow,
  blindStructure: BlindStructureRow | null,
  reservedCount: number,
  mockDescription?: string,
  mockType?: '錦標賽' | '限時錦標賽' | '衛星賽' | '賞金賽' | '豪克系列賽',
  mockPromotionNote?: string
): Tournament | null {
  // Filter out completed and cancelled tournaments
  if (row.status === 'completed' || row.status === 'cancelled') {
    return null;
  }
  
  // If no blind structure, cannot create tournament
  if (!blindStructure) {
    console.warn(`Tournament waitlist ${row.id} has no blind structure`);
    return null;
  }
  
  // Calculate total buy-in: buyin_amount + registration_fee
  const totalBuyIn = row.buyin_amount + row.registration_fee;
  
  // Parse blind structure
  const structure = parseBlindLevels(blindStructure.blind_levels);
  
  // Calculate isLateRegEnded based on status and registration_end_time
  const statusInfo = mapWaitlistStatus(row.status);
  const isLateRegEnded = row.registration_end_time 
    ? new Date(row.registration_end_time) < new Date() 
    : statusInfo.isLateRegEnded;
  
  return {
    id: row.id.toString(),
    clubId: row.club_id.toString(),
    name: row.name || '未命名賽事',
    buyIn: totalBuyIn, // Frontend buyIn = buyin_amount + registration_fee
    fee: row.registration_fee, // Keep fee field, but frontend displays total as buyIn
    startingChips: blindStructure.starting_chips,
    startTime: row.scheduled_start_time,
    maxCap: row.max_players,
    reservedCount: reservedCount, // Count from reservation table where status = 'waiting'
    isLateRegEnded: isLateRegEnded,
    lateRegLevel: blindStructure.last_buyin_level || 0,
    maxRebuy: blindStructure.max_buyin_entries || undefined,
    structure: structure,
    clockUrl: undefined, // tournament_waitlist doesn't have clock_url
    durationMinutes: row.duration_minutes || undefined,
    // Mock data fields (waiting for backend to add)
    description: mockDescription,
    type: mockType || '錦標賽',
    promotionNote: mockPromotionNote,
  };
}

/**
 * Get tournament waitlists for a specific club from Supabase
 */
export async function getTournamentWaitlistsFromSupabase(
  clubId: string
): Promise<Tournament[]> {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error('Supabase is not configured');
  }
  
  const clubIdNum = parseInt(clubId);
  if (isNaN(clubIdNum)) {
    throw new Error('Invalid club ID');
  }
  
  try {
    // 1. Fetch tournament_waitlist for this club (excluding completed and cancelled)
    const { data: tournamentWaitlists, error: waitlistError } = await supabase
      .from('tournament_waitlist')
      .select('*')
      .eq('club_id', clubIdNum)
      .in('status', ['scheduled', 'registration']) // Only active tournaments
      .order('scheduled_start_time', { ascending: true });
    
    if (waitlistError) {
      throw new Error(`Failed to fetch tournament waitlists: ${waitlistError.message}`);
    }
    
    if (!tournamentWaitlists || tournamentWaitlists.length === 0) {
      return [];
    }
    
    // 2. Fetch blind structures for all tournament waitlists
    const blindStructureIds = Array.from(new Set(tournamentWaitlists.map(t => t.blind_structure_id)));
    const { data: blindStructures, error: blindStructuresError } = await supabase
      .from('blind_structure')
      .select('*')
      .in('id', blindStructureIds);
    
    if (blindStructuresError) {
      throw new Error(`Failed to fetch blind structures: ${blindStructuresError.message}`);
    }
    
    // Create a map for quick lookup
    const blindStructureMap = new Map(
      (blindStructures || []).map(bs => [bs.id, bs])
    );
    
    // 3. Fetch reservation counts for each tournament_waitlist
    const waitlistIds = tournamentWaitlists.map(t => t.id);
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservation')
      .select('tournament_waitlist_id, status')
      .in('tournament_waitlist_id', waitlistIds)
      .eq('status', 'waiting'); // Only count waiting reservations
    
    if (reservationsError) {
      console.warn(`Failed to fetch reservations: ${reservationsError.message}`);
    }
    
    // Count waiting reservations per tournament_waitlist
    const reservedCountMap = new Map<number, number>();
    
    (reservations || []).forEach(res => {
      reservedCountMap.set(
        res.tournament_waitlist_id, 
        (reservedCountMap.get(res.tournament_waitlist_id) || 0) + 1
      );
    });
    
    // 4. Convert to frontend Tournament format
    const result: Tournament[] = [];
    
    for (const waitlist of tournamentWaitlists) {
      const blindStructure = blindStructureMap.get(waitlist.blind_structure_id);
      if (!blindStructure) {
        console.warn(`Tournament waitlist ${waitlist.id} has invalid blind_structure_id: ${waitlist.blind_structure_id}`);
        continue;
      }
      
      const reservedCount = reservedCountMap.get(waitlist.id) || 0;
      
      const converted = tournamentWaitlistRowToTournament(
        waitlist,
        blindStructure,
        reservedCount
        // Mock data for description, type, promotionNote will be added later
      );
      
      if (converted) {
        result.push(converted);
      }
    }
    
    return result;
  } catch (error: any) {
    console.error('Error fetching tournament waitlists from Supabase:', error);
    throw error;
  }
}

