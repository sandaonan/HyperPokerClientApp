import { supabase, isSupabaseAvailable } from '../lib/supabaseClient';
import type { Tables } from '../supabase';

type ClubMember = Tables<'club_member'>;

/**
 * Join a club by creating a club_member record
 */
export async function joinClubInSupabase(
  memberId: number,
  clubId: number,
  nickname: string | null
): Promise<ClubMember> {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error('Supabase is not configured');
  }

  // Check if club_member already exists
  const { data: existingMembers, error: checkError } = await supabase
    .from('club_member')
    .select('member_id, club_id, member_status')
    .eq('member_id', memberId)
    .eq('club_id', clubId);

  if (checkError) {
    console.error('Check existing membership error:', checkError);
    throw new Error('檢查會員狀態時發生錯誤：' + checkError.message);
  }

  if (existingMembers && existingMembers.length > 0) {
    const existing = existingMembers[0];
    if (existing.member_status === 'activated') {
      throw new Error('您已是該協會會員');
    } else {
      throw new Error('您已申請加入該協會，審核中');
    }
  }

  // Create new club_member record
  const { data: newClubMember, error: insertError } = await supabase
    .from('club_member')
    .insert({
      member_id: memberId,
      club_id: clubId,
      member_status: 'pending_approval',
      kyc_status: 'unverified',
      nickname: nickname || null,
      balance: 0,
      joined_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error('Join club error:', insertError);
    throw new Error('申請加入失敗：' + insertError.message);
  }

  if (!newClubMember) {
    throw new Error('申請加入失敗：無法創建會員記錄');
  }

  return newClubMember;
}

/**
 * Get all club memberships for a user from Supabase
 */
export async function getUserClubMemberships(memberId: number): Promise<ClubMember[]> {
  if (!isSupabaseAvailable() || !supabase) {
    return [];
  }

  const { data: memberships, error } = await supabase
    .from('club_member')
    .select('*')
    .eq('member_id', memberId);

  if (error) {
    console.error('Get club memberships error:', error);
    return [];
  }

  return memberships || [];
}

/**
 * Get club_member_code for a specific member and club
 * @param memberId - The member ID
 * @param clubId - The club ID
 * @returns The club_member_code or null if not found
 */
export async function getClubMemberCode(
  memberId: number,
  clubId: number
): Promise<string | null> {
  if (!isSupabaseAvailable() || !supabase) {
    return null;
  }

  const { data: clubMember, error } = await supabase
    .from('club_member')
    .select('club_member_code')
    .eq('member_id', memberId)
    .eq('club_id', clubId)
    .single();

  if (error || !clubMember) {
    console.warn('Get club_member_code error:', error);
    return null;
  }

  return clubMember.club_member_code;
}

/**
 * Update KYC status to unverified for all clubs a member has joined
 * This is called when user updates sensitive information in profile
 */
export async function resetKycStatusForAllClubs(memberId: number): Promise<void> {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase
    .from('club_member')
    .update({ 
      kyc_status: 'unverified',
      updated_at: new Date().toISOString()
    })
    .eq('member_id', memberId);

  if (error) {
    console.error('Reset KYC status error:', error);
    throw new Error('更新 KYC 狀態失敗：' + error.message);
  }
}
