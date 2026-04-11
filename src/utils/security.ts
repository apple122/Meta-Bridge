import bcrypt from 'bcryptjs';

/**
 * UTILITY: Security Utilities
 * Handles password hashing and comparison using bcryptjs.
 */

const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) return "";
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a plaintext password with a hashed password.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

/**
 * Checks if a string looks like a bcrypt hash.
 * This is used for lazy migration from plaintext to hashed passwords.
 */
export function isHashed(str: string): boolean {
  // Bcrypt hashes typically start with $2a$, $2b$, or $2y$ and are 60 chars long
  return typeof str === 'string' && /^\$2[ayb]\$.{56}$/.test(str);
}
