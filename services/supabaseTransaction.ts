import { supabase, isSupabaseAvailable } from '../lib/supabaseClient';
import type { Database } from '../supabase';

export type TransactionType = 
  | 'deposit'    // 充值
  | 'prize'      // 獎金
  | 'refund'     // 退款
  | 'bonus'      // 紅利
  | 'withdraw'   // 提現
  | 'entry_fee'  // 報名費
  | 'buyin'      // 首次買入
  | 'rebuy'      // 重購
  | 'addon'      // 加購
  | 'adjustment'; // 人工調整

export interface Transaction {
  id: number;
  amount: number;
  type: TransactionType;
  completed_at: string | null;
  description?: string | null;
}

// 交易類型分類和符號映射
export const TRANSACTION_CATEGORIES = {
  inflow: ['deposit', 'prize', 'refund', 'bonus'] as TransactionType[],
  outflow: ['withdraw', 'entry_fee', 'buyin', 'rebuy', 'addon'] as TransactionType[],
  flexible: ['adjustment'] as TransactionType[],
};

export function getTransactionSymbol(type: TransactionType): '+' | '-' | '+/-' {
  if (TRANSACTION_CATEGORIES.inflow.includes(type)) return '+';
  if (TRANSACTION_CATEGORIES.outflow.includes(type)) return '-';
  return '+/-';
}

export function getTransactionTypeName(type: TransactionType): string {
  const names: Record<TransactionType, string> = {
    deposit: '充值',
    prize: '獎金',
    refund: '退款',
    bonus: '紅利',
    withdraw: '提現',
    entry_fee: '報名費',
    buyin: '首次報名費',
    rebuy: '重購',
    addon: '加購',
    adjustment: '人工調整',
  };
  return names[type] || type;
}

/**
 * Get transactions for a specific member in a specific club
 * Only returns transactions with payment_method = 'balance' and status = 'completed'
 * Includes all transaction types: deposit, prize, refund, bonus, withdraw, entry_fee, buyin, rebuy, addon, adjustment
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
      .eq('payment_method', 'balance') // 只過濾 payment_method = 'balance'
      .eq('status', 'completed')
      .order('completed_at', { ascending: false }); // Most recent first

    if (error) {
      console.error('Error fetching transactions:', error);
      throw new Error(`取得交易記錄失敗：${error.message}`);
    }

    // Map to Transaction interface - 支援所有交易類型
    return (transactions || []).map(t => ({
      id: t.id,
      amount: t.amount,
      type: t.type as TransactionType,
      completed_at: t.completed_at,
      description: t.description || undefined,
    }));
  } catch (error: any) {
    console.error('Error fetching transactions from Supabase:', error);
    throw error;
  }
}

/**
 * Calculate balance from transactions
 * Sum all transactions with payment_method = 'balance' to get current balance
 * @param clubId - The club ID
 * @param memberId - The member ID
 * @returns Current balance
 */
export async function getBalanceFromTransactions(
  clubId: number,
  memberId: number
): Promise<number> {
  if (!isSupabaseAvailable() || !supabase) {
    return 0;
  }

  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('club_id', clubId)
      .eq('member_id', memberId)
      .eq('payment_method', 'balance')
      .eq('status', 'completed');

    if (error) {
      console.error('Error fetching transactions for balance:', error);
      return 0;
    }

    // Calculate balance from transactions
    let balance = 0;
    (transactions || []).forEach(t => {
      const symbol = getTransactionSymbol(t.type as TransactionType);
      if (symbol === '+') {
        balance += t.amount;
      } else if (symbol === '-') {
        balance -= t.amount;
      } else {
        // For adjustment, amount can be positive or negative
        balance += t.amount;
      }
    });

    return balance;
  } catch (error) {
    console.error('Error calculating balance from transactions:', error);
    return 0;
  }
}

