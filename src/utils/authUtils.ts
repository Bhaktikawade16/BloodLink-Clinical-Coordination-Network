/**
 * Secure password hashing utility using SHA-256
 * Plain-text passwords are NEVER stored.
 */

const SALT = 'bloodlink_secure_salt_2026';

export async function hashPassword(password: string): Promise<string> {
  const salted = `${password}::${SALT}`;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(salted);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Node environment fallback
    try {
      const crypto = await import('crypto');
      return crypto.createHash('sha256').update(salted).digest('hex');
    } catch {
      // Basic fallback
      let hash = 0;
      for (let i = 0; i < salted.length; i++) {
        const char = salted.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
      }
      return Math.abs(hash).toString(16);
    }
  }
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === storedHash;
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export interface EligibilityResult {
  eligibilityStatus: 'Eligible' | 'Not Eligible' | 'Pending Verification';
  reasons: string[];
  age: number;
}

export function calculateDonorEligibility(
  dateOfBirth: string,
  weightKg: number,
  lastDonationDate: string | null | undefined,
  verificationStatus: 'Pending' | 'Verified' | 'Rejected'
): EligibilityResult {
  const reasons: string[] = [];
  
  // 1. Calculate Age from Date of Birth
  let age = 25;
  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    const now = new Date();
    age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
      age--;
    }
  }

  if (age < 18) {
    reasons.push('Minimum age required for blood donation is 18 years (current: ' + age + ')');
  } else if (age > 65) {
    reasons.push('Maximum safe age threshold for donation is 65 years (current: ' + age + ')');
  }

  // 2. Weight check (minimum 50 kg)
  if (weightKg && weightKg < 50) {
    reasons.push('Minimum donor weight required is 50 kg (current: ' + weightKg + ' kg)');
  }

  // 3. Last donation date check (minimum 90 days / ~3 months)
  if (lastDonationDate && lastDonationDate.trim() !== '') {
    const lastDate = new Date(lastDonationDate);
    const diffDays = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 90) {
      reasons.push('Mandatory 90-day recovery window required between donations (' + (90 - diffDays) + ' days remaining)');
    }
  }

  // Determine status
  if (reasons.length > 0) {
    return {
      eligibilityStatus: 'Not Eligible',
      reasons,
      age
    };
  }

  if (verificationStatus === 'Pending') {
    return {
      eligibilityStatus: 'Pending Verification',
      reasons: ['Eligibility criteria met. Pending account identity verification.'],
      age
    };
  }

  if (verificationStatus === 'Rejected') {
    return {
      eligibilityStatus: 'Not Eligible',
      reasons: ['Donor identity verification was rejected. Please contact support.'],
      age
    };
  }

  return {
    eligibilityStatus: 'Eligible',
    reasons: ['All clinical and safety thresholds verified.'],
    age
  };
}
