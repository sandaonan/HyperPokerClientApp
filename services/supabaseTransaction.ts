import { supabase, isSupabaseAvailable } from '../lib/supabaseClient';
import type { Database } from '../supabase';

export interface Transaction {
  id: number;
  amount: number;
  type: 'deposit' | 'withdraw';
  completed_at: string | null;
  description?: string | null;
}

/**
 * Get transactions for a specific member in a specific club
 * Only returns deposit and withdraw transactions with completed status
 * @param clubId - The club ID
 * @param memberId - The member ID (from parseInt(userId))
 * @returns Array of transactions ordered by completed_at DESC
 */
export async function getTransactionsByMember(
  clubId: string,
  memberId: number
): Promise<Transaction[]> {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error('Supabase is not configured');
  }

  const clubIdNum = parseInt(clubId);
  if (isNaN(clubIdNum)) {
    throw new Error('Invalid club ID');
  }

  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('id, amount, type, completed_at, description')
      .eq('club_id', clubIdNum)
      .eq('member_id', memberId)
      .in('type', ['deposit', 'withdraw'])
      .eq('status', 'completed')
      .order('completed_at', { ascending: false }); // Most recent first

    if (error) {
      console.error('Error fetching transactions:', error);
      throw new Error(`取得交易記錄失敗：${error.message}`);
    }

    // Map to Transaction interface
    return (transactions || []).map(t => ({
      id: t.id,
      amount: t.amount,
      type: t.type as 'deposit' | 'withdraw',
      completed_at: t.completed_at,
      description: t.description || undefined,
    }));
  } catch (error: any) {
    console.error('Error fetching transactions from Supabase:', error);
    throw error;
  }
}

