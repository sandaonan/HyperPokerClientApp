import { supabase, isSupabaseAvailable } from '../lib/supabaseClient';
import { Tournament, BlindLevel } from '../types';
import type { Database } from '../supabase';

type TournamentRow = Database['public']['Tables']['tournament']['Row'];
type BlindStructureRow = Database['public']['Tables']['blind_structure']['Row'];
type TournamentPlayerRow = Database['public']['Tables']['tournament_player']['Row'];

/**
 * Parse blind levels JSON to BlindLevel[]
 * Supports various JSON formats from Supabase blind_levels field
 */
function parseBlindLevels(blindLevelsJson: any): BlindLevel[] {
  if (!blindLevelsJson || typeof blindLevelsJson !== 'object') {
    return [];
  }
  
  // If it's an array, map each level
  if (Array.isArray(blindLevelsJson)) {
    return blindLevelsJson.map((level: any) => {
      // Check if this is a break entry - support multiple formats
      // Check for explicit break flags
      const hasBreakFlag = 
        level.isBreak === true || 
        level.is_break === true || 
        level.break === true ||
        level.type === 'break' ||
        level.type === 'Break' ||
        level.level_type === 'break';
      
      // Check if it's a break by having zero blinds and level 0/null
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
        console.log('[parseBlindLevels] Found break entry:', level);
        // Parse break duration - use durationMinutes field from Supabase
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
      // Parse ante - support multiple field names and handle null/undefined/0 properly
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
  
  // If it's an object with level keys (e.g., { "1": {...}, "2": {...} })
  if (typeof blindLevelsJson === 'object' && !Array.isArray(blindLevelsJson)) {
    const levels: BlindLevel[] = [];
    for (const key in blindLevelsJson) {
      const level = blindLevelsJson[key];
      if (level && typeof level === 'object') {
        const parsed = parseBlindLevels([level]);
        if (parsed.length > 0) {
          levels.push(...parsed);
        }
      }
    }
    // Sort by level number
    return levels.sort((a, b) => a.level - b.level);
  }
  
  return [];
}

/**
 * Calculate duration from blind structure
 */
function calculateDurationFromStructure(structure: BlindLevel[]): number {
  return structure.reduce((acc, level) => acc + level.duration, 0);
}

/**
 * Convert Supabase tournament row to frontend Tournament type
 */
function tournamentRowToTournament(
  row: TournamentRow,
  blindStructure: BlindStructureRow | null,
  reservedCount: number,
  confirmedCount: number,
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
    console.warn(`Tournament ${row.id} has no blind structure`);
    return null;
  }
  
  // Calculate total buy-in: buyin_amount + registration_fee
  const totalBuyIn = row.buyin_amount + row.registration_fee;
  
  // Parse blind structure
  console.log('[tournamentRowToTournament] Tournament ID:', row.id);
  console.log('[tournamentRowToTournament] Raw blind_levels JSON:', JSON.stringify(blindStructure.blind_levels, null, 2));
  const structure = parseBlindLevels(blindStructure.blind_levels);
  console.log('[tournamentRowToTournament] Parsed structure (length:', structure.length, '):', structure.map(s => ({
    level: s.level,
    isBreak: s.isBreak,
    smallBlind: s.smallBlind,
    bigBlind: s.bigBlind,
    ante: s.ante,
    duration: s.duration
  })));
  
  // Calculate isLateRegEnded
  const isLateRegEnded = row.registration_end_time 
    ? new Date(row.registration_end_time) < new Date() 
    : false;
  
  return {
    id: row.id.toString(),
    clubId: row.club_id.toString(),
    name: row.name,
    buyIn: totalBuyIn, // Frontend buyIn = buyin_amount + registration_fee
    fee: row.registration_fee, // Keep fee field, but frontend displays total as buyIn
    startingChips: blindStructure.starting_chips,
    startTime: row.scheduled_start_time,
    maxCap: row.max_players,
    reservedCount: reservedCount + confirmedCount, // pending_review (reserved) + confirmed (registered)
    isLateRegEnded: isLateRegEnded,
    lateRegLevel: blindStructure.last_buyin_level || 0,
    maxRebuy: blindStructure.max_buyin_entries || undefined,
    structure: structure, // Used to display blind structure table in tournament details
    clockUrl: row.clock_url || undefined,
    durationMinutes: row.duration_minutes || undefined, // Tournament duration in minutes
    // Mock data fields (waiting for backend to add)
    description: mockDescription,
    type: mockType || '錦標賽',
    promotionNote: mockPromotionNote,
  };
}

/**
 * Get tournaments for a specific club from Supabase
 */
export async function getTournamentsFromSupabase(
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
    // 1. Fetch tournaments for this club (excluding completed and cancelled)
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournament')
      .select('*')
      .eq('club_id', clubIdNum)
      .in('status', ['scheduled', 'registration', 'in_progress']) // Only active tournaments
      .order('scheduled_start_time', { ascending: true });
    
    if (tournamentsError) {
      throw new Error(`Failed to fetch tournaments: ${tournamentsError.message}`);
    }
    
    if (!tournaments || tournaments.length === 0) {
      return [];
    }
    
    // 2. Fetch blind structures for all tournaments
    const blindStructureIds = Array.from(new Set(tournaments.map(t => t.blind_structure_id)));
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
    
    // 3. Fetch reserved players from reservation table (waiting status)
    const tournamentWaitlistIds = tournaments.map(t => t.from_waitlist_id).filter(id => id !== null);
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservation')
      .select('tournament_waitlist_id, status')
      .in('tournament_waitlist_id', tournamentWaitlistIds)
      .eq('status', 'waiting'); // Only count waiting reservations
    
    if (reservationsError) {
      console.warn(`Failed to fetch reservations: ${reservationsError.message}`);
    }
    
    // 4. Fetch confirmed/paid players from tournament_player table (active status)
    // Note: tournament_player_status enum only has: "active", "eliminated", "cancelled"
    const tournamentIds = tournaments.map(t => t.id);
    const { data: tournamentPlayers, error: playersError } = await supabase
      .from('tournament_player')
      .select('tournament_id, status')
      .in('tournament_id', tournamentIds)
      .eq('status', 'active'); // Only count active players (paid players are active)
    
    if (playersError) {
      console.warn(`Failed to fetch tournament players: ${playersError.message}`);
    }
    
    // Count reserved players per tournament (via waitlist_id mapping)
    const reservedCountMap = new Map<number, number>();
    const tournamentWaitlistMap = new Map(
      tournaments.map(t => [t.from_waitlist_id, t.id])
    );
    
    (reservations || []).forEach(res => {
      const tournamentId = tournamentWaitlistMap.get(res.tournament_waitlist_id);
      if (tournamentId) {
        reservedCountMap.set(tournamentId, (reservedCountMap.get(tournamentId) || 0) + 1);
      }
    });
    
    // Count confirmed/paid players per tournament
    const confirmedCountMap = new Map<number, number>();
    (tournamentPlayers || []).forEach(tp => {
      confirmedCountMap.set(tp.tournament_id, (confirmedCountMap.get(tp.tournament_id) || 0) + 1);
    });
    
    // 4. Convert to frontend Tournament format
    const result: Tournament[] = [];
    
    for (const tournament of tournaments) {
      const blindStructure = blindStructureMap.get(tournament.blind_structure_id);
      if (!blindStructure) {
        console.warn(`Tournament ${tournament.id} has invalid blind_structure_id: ${tournament.blind_structure_id}`);
        continue;
      }
      
      const reservedCount = reservedCountMap.get(tournament.id) || 0;
      const confirmedCount = confirmedCountMap.get(tournament.id) || 0;
      
      const converted = tournamentRowToTournament(
        tournament,
        blindStructure,
        reservedCount,
        confirmedCount
        // Mock data for description, type, promotionNote will be added later
      );
      
      if (converted) {
        result.push(converted);
      }
    }
    
    return result;
  } catch (error: any) {
    console.error('Error fetching tournaments from Supabase:', error);
    throw error;
  }
}

/**
 * Get a single tournament by ID from Supabase
 */
export async function getTournamentByIdFromSupabase(
  tournamentId: string
): Promise<Tournament | null> {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error('Supabase is not configured');
  }
  
  const tournamentIdNum = parseInt(tournamentId);
  if (isNaN(tournamentIdNum)) {
    throw new Error('Invalid tournament ID');
  }
  
  try {
    // Fetch tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournament')
      .select('*')
      .eq('id', tournamentIdNum)
      .single();
    
    if (tournamentError) {
      throw new Error(`Failed to fetch tournament: ${tournamentError.message}`);
    }
    
    if (!tournament) {
      return null;
    }
    
    // Fetch blind structure
    const { data: blindStructure, error: blindStructureError } = await supabase
      .from('blind_structure')
      .select('*')
      .eq('id', tournament.blind_structure_id)
      .single();
    
    if (blindStructureError) {
      throw new Error(`Failed to fetch blind structure: ${blindStructureError.message}`);
    }
    
    if (!blindStructure) {
      return null;
    }
    
    // Fetch reserved players from reservation table (waiting status)
    const tournamentWaitlistId = tournament.from_waitlist_id;
    let reservedCount = 0;
    if (tournamentWaitlistId) {
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservation')
        .select('id, status')
        .eq('tournament_waitlist_id', tournamentWaitlistId)
        .eq('status', 'waiting'); // Only count waiting reservations
      
      if (reservationsError) {
        console.warn(`Failed to fetch reservations: ${reservationsError.message}`);
      } else {
        reservedCount = (reservations || []).length;
      }
    }
    
    // Fetch confirmed/paid players from tournament_player table (active status)
    // Note: tournament_player_status enum only has: "active", "eliminated", "cancelled"
    const { data: tournamentPlayers, error: playersError } = await supabase
      .from('tournament_player')
      .select('status')
      .eq('tournament_id', tournamentIdNum)
      .eq('status', 'active'); // Only count active players (paid players are active)
    
    if (playersError) {
      console.warn(`Failed to fetch tournament players: ${playersError.message}`);
    }
    
    const confirmedCount = (tournamentPlayers || []).length;
    
    return tournamentRowToTournament(
      tournament,
      blindStructure,
      reservedCount,
      confirmedCount
    );
  } catch (error: any) {
    console.error('Error fetching tournament from Supabase:', error);
    throw error;
  }
}

