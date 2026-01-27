import { supabase, isSupabaseAvailable } from '../lib/supabaseClient';
import type { Tables } from '../supabase';
import { Club } from '../types';

type ClubRow = Tables<'club'>;

/**
 * Convert Supabase club to Club type
 */
function clubRowToClub(club: ClubRow): Club {
  // Parse location if available (format: "lat,lng" or similar)
  let latitude: number | undefined = undefined;
  let longitude: number | undefined = undefined;
  
  if (club.location) {
    try {
      // Try to parse location string (could be JSON, comma-separated, etc.)
      const coords = club.location.split(',').map(Number);
      if (coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        latitude = coords[0];
        longitude = coords[1];
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  return {
    id: club.id.toString(),
    name: club.name,
    description: club.description || undefined,
    bannerUrl: club.logo_url || undefined,
    tier: 'Platinum', // Default tier, or map from club data if available
    localId: club.name.substring(0, 3).toUpperCase() + '-' + club.id, // Generate localId
    currency: 'USD', // Default currency
    latitude: latitude,
    longitude: longitude,
  };
}

/**
 * Get all clubs from Supabase
 */
export async function getAllClubsFromSupabase(): Promise<Club[]> {
  if (!isSupabaseAvailable() || !supabase) {
    return [];
  }

  const { data: clubs, error } = await supabase
    .from('club')
    .select('*')
    .eq('status', 'activated'); // Only get activated clubs

  if (error) {
    console.error('Get clubs error:', error);
    return [];
  }

  // Debug: Log raw club data from Supabase
  console.log('[getAllClubsFromSupabase] Raw clubs from Supabase:', clubs);
  if (clubs && clubs.length > 0) {
    clubs.forEach(club => {
      console.log(`[getAllClubsFromSupabase] Club - id: ${club.id}, name: ${club.name}, description: ${club.description?.substring(0, 50)}...`);
    });
  }

  return (clubs || []).map(clubRowToClub);
}

/**
 * Get a single club by ID from Supabase
 */
export async function getClubByIdFromSupabase(clubId: number): Promise<Club | null> {
  if (!isSupabaseAvailable() || !supabase) {
    return null;
  }

  const { data: club, error } = await supabase
    .from('club')
    .select('*')
    .eq('id', clubId)
    .eq('status', 'activated')
    .single();

  if (error || !club) {
    return null;
  }

  return clubRowToClub(club);
}

