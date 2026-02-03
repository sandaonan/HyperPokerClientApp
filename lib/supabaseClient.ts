import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';

// Create Supabase client
export const supabase =
  supabaseUrl && supabaseKey
    ? createClient<Database>(supabaseUrl, supabaseKey)
    : null;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// Helper function to check if Supabase is available
export function isSupabaseAvailable(): boolean {
  return supabase !== null;
}

