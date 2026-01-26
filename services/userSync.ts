import type { IdTokenClaims } from '@logto/react';
import { User } from '../types';

const STORAGE_KEYS = {
  USERS: 'hp_users',
  SESSION_USER_ID: 'hp_session_user_id',
};

/**
 * Synchronizes Logto user claims to localStorage
 * Maps Logto 'sub' to user.id and merges with existing app-specific fields
 */
export function syncLogtoUserToLocalStorage(claims: IdTokenClaims): User {
  const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');

  // Logto's unique user ID
  const logtoUserId = claims.sub;

  // Find existing user by Logto ID
  const existingUserIndex = users.findIndex(u => u.id === logtoUserId);

  if (existingUserIndex !== -1) {
    // Update existing user - merge Logto claims with existing app data
    const existingUser = users[existingUserIndex];
    const updatedUser: User = {
      ...existingUser,
      id: logtoUserId,
      username: claims.email || claims.phone_number || claims.username || logtoUserId,
      name: existingUser.name || claims.name,
      mobile: existingUser.mobile || claims.phone_number,
      // Preserve app-specific fields
      nationalId: existingUser.nationalId,
      birthday: existingUser.birthday,
      kycUploaded: existingUser.kycUploaded,
      isProfileComplete: existingUser.isProfileComplete,
      nickname: existingUser.nickname,
      mobileVerified: existingUser.mobileVerified,
      isForeigner: existingUser.isForeigner,
      avatarUrl: existingUser.avatarUrl || claims.picture,
    };

    users[existingUserIndex] = updatedUser;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.SESSION_USER_ID, logtoUserId);

    return updatedUser;
  } else {
    // Create new user from Logto claims
    const newUser: User = {
      id: logtoUserId,
      username: claims.email || claims.phone_number || claims.username || logtoUserId,
      name: claims.name,
      mobile: claims.phone_number,
      mobileVerified: !!claims.phone_number,
      isProfileComplete: false, // New users need to complete profile
      nickname: claims.name || claims.username,
      avatarUrl: claims.picture,
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.SESSION_USER_ID, logtoUserId);

    return newUser;
  }
}

/**
 * Gets the current logged-in user from localStorage
 */
export function getCurrentUser(): User | null {
  const sessionUserId = localStorage.getItem(STORAGE_KEYS.SESSION_USER_ID);
  if (!sessionUserId) return null;

  const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  const user = users.find(u => u.id === sessionUserId);

  return user || null;
}

/**
 * Clears the current session from localStorage
 */
export function clearCurrentSession(): void {
  localStorage.removeItem(STORAGE_KEYS.SESSION_USER_ID);
}
