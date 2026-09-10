import crypto from 'crypto';

const SALT = 'bloodlink_secure_salt_2026';

export function hashPasswordServer(password: string): string {
  const salted = `${password}::${SALT}`;
  return crypto.createHash('sha256').update(salted).digest('hex');
}

export function verifyPasswordServer(password: string, storedHash: string): boolean {
  return hashPasswordServer(password) === storedHash;
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).trim());
}

export function validatePhone(phone: string): boolean {
  const digits = String(phone).replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}
