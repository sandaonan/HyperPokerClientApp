/**
 * Password hashing utility
 * Uses Web Crypto API for secure password hashing
 */

/**
 * Hash a password using SHA-256
 * Note: In production, you should use a more secure method like bcrypt or Argon2
 * For now, we'll use a simple SHA-256 hash with a salt
 */
export async function hashPassword(password: string): Promise<string> {
  // Create a simple salt (in production, use a random salt per user)
  const salt = 'hyperpoker_salt_2024';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

