import { supabase, isSupabaseAvailable } from '../lib/supabaseClient';
import { hashPassword, verifyPassword } from '../lib/passwordUtils';
import { User } from '../types';
import type { Tables } from '../supabase';

type Member = Tables<'member'>;

/**
 * Convert Supabase member to User type
 */
function memberToUser(member: Member): User {
  // Map gender from DB to User type
  let gender: 'male' | 'female' | 'other' | undefined = undefined;
  if (member.gender === 'male' || member.gender === 'female' || member.gender === 'other') {
    gender = member.gender;
  }

  return {
    id: member.id.toString(),
    username: member.account || '',
    name: member.full_name || undefined,
    nationalId: member.id_number || undefined,
    nickname: member.nick_name || member.account || undefined, // Use nick_name from DB
    mobile: member.mobile_phone || undefined,
    email: member.email || undefined, // Added email field
    mobileVerified: false, // TODO: Add mobile verification field to member table
    birthday: member.date_of_birth || undefined,
    gender: gender,
    nationality: undefined, // TODO: Add nationality field to member table if needed
    isProfileComplete: !!(member.full_name && member.id_number && member.date_of_birth),
    kycUploaded: !!member.id_url,
    avatarUrl: undefined, // TODO: Add avatar_url to member table if needed
  };
}

/**
 * Register a new user
 */
export async function registerUser(
  account: string,
  password: string,
  mobile?: string
): Promise<User> {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error('Supabase is not configured');
  }

  // Check if account already exists
  const { data: existingMember, error: checkError } = await supabase
    .from('member')
    .select('id, account')
    .eq('account', account)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 is "not found" error, which is expected for new users
    throw new Error('檢查帳號時發生錯誤');
  }

  if (existingMember) {
    throw new Error('此帳號已被使用');
  }

  // Hash the password
  const passwordHash = await hashPassword(password);

  // Create new member record
  const { data: newMember, error: insertError } = await supabase
    .from('member')
    .insert({
      account,
      password_hash: passwordHash,
      full_name: null, // Don't use account as initial full_name
      id_number: '', // Empty initially, user will fill later
      mobile_phone: mobile || null,
      email: null,
      date_of_birth: null,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Registration error:', insertError);
    throw new Error('註冊失敗：' + insertError.message);
  }

  if (!newMember) {
    throw new Error('註冊失敗：無法創建用戶');
  }

  return memberToUser(newMember);
}

/**
 * Login user
 */
export async function loginUser(account: string, password: string): Promise<User> {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error('Supabase is not configured');
  }

  // Find member by account
  const { data: member, error } = await supabase
    .from('member')
    .select('*')
    .eq('account', account)
    .single();

  if (error || !member) {
    throw new Error('帳號或密碼錯誤');
  }

  // Verify password
  if (!member.password_hash) {
    throw new Error('此帳號尚未設置密碼');
  }

  const isValid = await verifyPassword(password, member.password_hash);
  if (!isValid) {
    throw new Error('帳號或密碼錯誤');
  }

  return memberToUser(member);
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  if (!isSupabaseAvailable() || !supabase) {
    return null;
  }

  const memberId = parseInt(userId);
  if (isNaN(memberId)) {
    return null;
  }

  const { data: member, error } = await supabase
    .from('member')
    .select('*')
    .eq('id', memberId)
    .single();

  if (error || !member) {
    return null;
  }

  return memberToUser(member);
}

/**
 * Update user profile in Supabase
 */
export async function updateUserProfile(user: User): Promise<User> {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error('Supabase is not configured');
  }

  const memberId = parseInt(user.id);
  if (isNaN(memberId)) {
    throw new Error('Invalid user ID');
  }

  const updateData: Partial<Member> = {
    full_name: user.name || null,
    id_number: user.nationalId || null,
    mobile_phone: user.mobile || null,
    email: user.email || null, // Added email field
    date_of_birth: user.birthday || null,
    nick_name: user.nickname || null, // Update nickname field
    gender: user.gender || null, // Update gender field
    id_url: user.kycUploaded ? 'uploaded' : null, // TODO: Store actual URL if needed
    // Note: nationality field would need to be added to member table schema
  };

  const { data: updatedMember, error } = await supabase
    .from('member')
    .update(updateData)
    .eq('id', memberId)
    .select()
    .single();

  if (error) {
    console.error('Update user error:', error);
    throw new Error('更新失敗：' + error.message);
  }

  if (!updatedMember) {
    throw new Error('更新失敗：無法找到用戶');
  }

  return memberToUser(updatedMember);
}

