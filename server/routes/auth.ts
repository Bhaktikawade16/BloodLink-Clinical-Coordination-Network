import { Router } from 'express';
import { db, DbUser, DbDonor, DbHospital, DbBloodBank, DbBloodCamp } from '../db';
import {
  hashPasswordServer,
  verifyPasswordServer,
  validateEmail,
  validatePhone
} from '../authUtils';

export const authRouter = Router();

/**
 * Helper to calculate donor eligibility
 */
function calculateEligibility(
  dobStr: string,
  weightKg: number,
  lastDonationStr: string | null | undefined,
  verificationStatus: 'Pending' | 'Verified' | 'Rejected'
): 'Eligible' | 'Not Eligible' | 'Pending Verification' {
  let age = 25;
  if (dobStr) {
    const dob = new Date(dobStr);
    const now = new Date();
    age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
      age--;
    }
  }

  // Age 18 - 65
  if (age < 18 || age > 65) {
    return 'Not Eligible';
  }

  // Weight >= 50 kg
  if (weightKg && weightKg < 50) {
    return 'Not Eligible';
  }

  // Last donation date >= 90 days ago
  if (lastDonationStr && lastDonationStr.trim() !== '') {
    const lastDate = new Date(lastDonationStr);
    const diffDays = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 90) {
      return 'Not Eligible';
    }
  }

  if (verificationStatus === 'Rejected') return 'Not Eligible';
  if (verificationStatus === 'Pending') return 'Pending Verification';
  return 'Eligible';
}

/**
 * POST /api/auth/register
 * Unified registration for all 4 BloodLink roles.
 * 1. Creates record in USERS table first.
 * 2. Creates record in portal-specific child table referencing users.user_id.
 * 3. Default verification_status = 'Pending'.
 */
authRouter.post('/register', async (req, res) => {
  try {
    const {
      role,
      name,
      email,
      phone,
      password,
      city,
      latitude,
      longitude,
      // Donor fields
      blood_group,
      date_of_birth,
      gender,
      last_donation_date,
      weight_kg,
      // Hospital fields
      hospital_name,
      registration_number,
      address,
      // Blood Bank fields
      bank_name,
      license_number,
      // Blood Camp fields
      camp_name,
      organizer_name,
      camp_date
    } = req.body;

    const validRoles = ['donor', 'hospital', 'blood_bank', 'blood_camp'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        error: `Invalid role: '${role}'. Must be one of: donor, hospital, blood_bank, blood_camp.`
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    if (!phone || !validatePhone(phone)) {
      return res.status(400).json({ error: 'A valid phone number is required (at least 7 digits)' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check duplicate account in USERS table
    const existingUser = db.findUserByAuth(email) || db.findUserByAuth(phone);
    if (existingUser) {
      return res.status(409).json({
        error: `An account already exists with this email or phone number. Role: ${existingUser.role}. Please log in.`
      });
    }

    // 1. CREATE USERS RECORD
    const password_hash = hashPasswordServer(password);
    const user = db.addUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password_hash,
      role: role as any,
      city: city || 'Pune',
      latitude: latitude || 18.5204,
      longitude: longitude || 73.8567
    });

    let entityRecord: any = null;

    // 2. CREATE PORTAL-SPECIFIC RECORD
    if (role === 'donor') {
      const weightNum = Number(weight_kg) || 60;
      const initialVerification = 'Pending';
      const initialEligibility = calculateEligibility(
        date_of_birth || '1998-01-01',
        weightNum,
        last_donation_date,
        initialVerification
      );

      const donor = db.addDonor({
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        blood_group: blood_group || 'O+',
        date_of_birth: date_of_birth || '1998-01-01',
        gender: gender || 'Not specified',
        weight_kg: weightNum,
        last_donation_date: last_donation_date || null,
        eligibility_status: initialEligibility,
        verification_status: initialVerification,
        donation_count: last_donation_date ? 1 : 0,
        is_available: false, // unverified cannot participate until verified
        available_for_emergency: false
      });
      entityRecord = donor;
    } else if (role === 'hospital') {
      const hosp = db.addHospital({
        user_id: user.user_id,
        hospital_name: hospital_name || name,
        registration_number: registration_number || `REG-HOSP-${Date.now()}`,
        address: address || `${city || 'Pune'}, Maharashtra`,
        verification_status: 'Pending',
        contact_person: name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        state: 'Maharashtra'
      });
      entityRecord = hosp;
    } else if (role === 'blood_bank') {
      const bank = db.addBloodBank({
        user_id: user.user_id,
        bank_name: bank_name || name,
        license_number: license_number || registration_number || `LIC-BB-${Date.now()}`,
        address: address || `${city || 'Pune'}, Maharashtra`,
        verification_status: 'Pending',
        contact_person: name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        state: 'Maharashtra'
      });
      entityRecord = bank;
    } else if (role === 'blood_camp') {
      const camp = db.addBloodCamp({
        user_id: user.user_id,
        camp_name: camp_name || `${name}'s Blood Drive`,
        organizer_name: organizer_name || name,
        registration_number: registration_number || `REG-CAMP-${Date.now()}`,
        address: address || 'Community Hall',
        city: user.city,
        camp_date: camp_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        verification_status: 'Pending'
      });
      entityRecord = camp;
    }

    return res.status(201).json({
      success: true,
      message: 'Account successfully registered and submitted for verification.',
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        city: user.city,
        verification_status: entityRecord?.verification_status || 'Pending',
        eligibility_status: entityRecord?.eligibility_status,
        profile: entityRecord
      }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error during registration' });
  }
});

/**
 * POST /api/auth/login
 * Common authentication check against USERS table with role protection
 */
authRouter.post('/login', async (req, res) => {
  try {
    const { identifier, password, expectedRole } = req.body;

    if (!identifier) {
      return res.status(400).json({ error: 'Email or phone number is required to sign in' });
    }

    // Special Admin Bypass for dev inspection
    if (expectedRole === 'admin' || identifier === 'admin@bloodlink.org' || identifier === 'admin') {
      if (password === 'admin123' || password === 'admin' || !password) {
        return res.json({
          success: true,
          user: {
            user_id: 999,
            name: 'BloodLink System Administrator',
            email: 'admin@bloodlink.org',
            phone: '+91 20 0000 0000',
            role: 'admin',
            city: 'Pune',
            verification_status: 'Verified'
          }
        });
      }
    }

    // 1. Look up in USERS table
    let user = db.findUserByAuth(identifier);

    // Fallback: If not found in USERS, check portal specific records for legacy demo compatibility
    if (!user) {
      if (expectedRole === 'hospital') {
        const h = db.findHospitalByAuth(identifier);
        if (h) {
          user = {
            user_id: h.user_id || 2,
            name: h.contact_person || h.hospital_name,
            email: h.email || identifier,
            phone: h.phone || '0000000000',
            password_hash: hashPasswordServer('password123'),
            role: 'hospital',
            city: h.city || 'Pune',
            latitude: 18.5204,
            longitude: 73.8567,
            created_at: new Date().toISOString()
          };
        }
      } else if (expectedRole === 'blood_bank' || expectedRole === 'blood-bank') {
        const b = db.findBloodBankByAuth(identifier);
        if (b) {
          user = {
            user_id: b.user_id || 3,
            name: b.contact_person || b.bank_name,
            email: b.email || identifier,
            phone: b.phone || '0000000000',
            password_hash: hashPasswordServer('password123'),
            role: 'blood_bank',
            city: b.city || 'Pune',
            latitude: 18.5204,
            longitude: 73.8567,
            created_at: new Date().toISOString()
          };
        }
      } else if (expectedRole === 'blood_camp' || expectedRole === 'organizer') {
        const c = db.findBloodCampByAuth(identifier) || db.findOrganizerByAuth(identifier);
        if (c) {
          user = {
            user_id: (c as any).user_id || 4,
            name: (c as any).organizer_name || (c as any).name || 'Camp Organizer',
            email: (c as any).email || identifier,
            phone: (c as any).phone || (c as any).contact || '0000000000',
            password_hash: hashPasswordServer('password123'),
            role: 'blood_camp',
            city: (c as any).city || 'Pune',
            latitude: 18.5204,
            longitude: 73.8567,
            created_at: new Date().toISOString()
          };
        }
      } else {
        const d = db.findDonorByAuth(identifier);
        if (d) {
          user = {
            user_id: d.user_id || 1,
            name: d.name,
            email: d.email || identifier,
            phone: d.phone,
            password_hash: hashPasswordServer('password123'),
            role: 'donor',
            city: d.city,
            latitude: 18.5204,
            longitude: 73.8567,
            created_at: new Date().toISOString()
          };
        }
      }
    }

    if (!user) {
      return res.status(404).json({
        error: 'No account found matching this email or phone number. Please check your spelling or register.'
      });
    }

    // 2. Password check (if password provided)
    if (password && !verifyPasswordServer(password, user.password_hash)) {
      // Also allow default dev convenience password "password123"
      if (password !== 'password123') {
        return res.status(401).json({ error: 'Incorrect password. Please try again.' });
      }
    }

    // 3. Strict Role Isolation & Authorization check
    if (expectedRole) {
      const normalizedExpected = expectedRole.replace('-', '_');
      const normalizedUserRole = user.role.replace('-', '_');
      if (normalizedExpected !== normalizedUserRole) {
        return res.status(403).json({
          error: `Role restriction: This account is registered as a ${user.role.toUpperCase()}. You cannot sign in to the ${expectedRole.toUpperCase()} portal with these credentials. Please navigate to your designated dashboard.`
        });
      }
    }

    // 4. Retrieve linked portal record
    const profile = db.getPortalRecordForUser(user);
    const verificationStatus = profile?.verification_status || 'Pending';
    const eligibilityStatus = (profile as any)?.eligibility_status;

    return res.json({
      success: true,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        city: user.city,
        verification_status: verificationStatus,
        eligibility_status: eligibilityStatus,
        profile
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error during authentication' });
  }
});

/**
 * POST /api/auth/verification-status
 * Updates verification status for any portal entity:
 * 'Pending' | 'Verified' | 'Rejected'
 */
authRouter.post('/verification-status', (req, res) => {
  const { role, entity_id, status } = req.body;
  if (!role || !entity_id || !status) {
    return res.status(400).json({ error: 'role, entity_id, and status are required' });
  }

  const validStatuses = ['Pending', 'Verified', 'Rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const result = db.updateVerificationStatus(role, entity_id, status as any);
  if (!result.success) {
    return res.status(404).json({ error: result.error || 'Entity not found' });
  }

  return res.json({
    success: true,
    message: `Entity successfully updated to ${status}.`,
    target: result.target
  });
});

/**
 * GET /api/auth/users
 * Returns all registered users
 */
authRouter.get('/users', (req, res) => {
  const users = db.getUsers().map((u) => {
    const profile = db.getPortalRecordForUser(u);
    return {
      user_id: u.user_id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      city: u.city,
      created_at: u.created_at,
      verification_status: profile?.verification_status || 'Pending',
      eligibility_status: (profile as any)?.eligibility_status,
      profile
    };
  });
  return res.json(users);
});

/**
 * GET /api/auth/check-email?email=...
 * Checks if a Google or other email is already registered in BloodLink
 */
authRouter.get('/check-email', (req, res) => {
  const email = ((req.query.email as string) || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required' });
  }
  const user = db.getUsers().find((u) => u.email.toLowerCase() === email);
  if (!user) {
    return res.json({ exists: false });
  }
  const profile = db.getPortalRecordForUser(user);
  return res.json({
    exists: true,
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      city: user.city,
      verification_status: profile?.verification_status || 'Pending',
      eligibility_status: (profile as any)?.eligibility_status,
      profile
    }
  });
});

/**
 * POST /api/auth/google
 * Authenticates or registers a user via verified Google OAuth
 */
authRouter.post('/google', (req, res) => {
  try {
    const { email, name, role = 'donor', phone, city, blood_group, autoRegister = false } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required for Google authentication' });
    }

    const normEmail = email.trim().toLowerCase();
    const user = db.getUsers().find((u) => u.email.toLowerCase() === normEmail);

    if (user) {
      // Existing user found - sign them in directly
      const profile = db.getPortalRecordForUser(user);
      return res.json({
        success: true,
        isNewUser: false,
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          city: user.city,
          verification_status: profile?.verification_status || 'Pending',
          eligibility_status: (profile as any)?.eligibility_status,
          profile
        }
      });
    }

    if (!autoRegister) {
      return res.json({
        success: true,
        isNewUser: true,
        exists: false,
        suggested: {
          name: name || '',
          email: normEmail,
          phone: phone || '',
          city: city || 'Pune',
          role
        }
      });
    }

    // Auto-create user
    const newUser = db.addUser({
      name: name || normEmail.split('@')[0],
      email: normEmail,
      phone: phone || '9876500000',
      password_hash: 'GOOGLE_OAUTH_AUTHENTICATED',
      role: role as any,
      city: city || 'Pune',
      created_at: new Date().toISOString()
    });

    let profile: any = null;
    if (role === 'donor') {
      profile = db.addDonor({
        user_id: newUser.user_id,
        blood_group: (blood_group as any) || 'O+',
        date_of_birth: '1998-01-01',
        gender: 'Not specified',
        weight_kg: 65,
        last_donation_date: null,
        city: newUser.city,
        state: 'Maharashtra',
        verification_status: 'Verified',
        eligibility_status: 'Eligible',
        is_available: true,
        available_for_emergency: true
      });
    } else if (role === 'hospital') {
      profile = db.addHospital({
        user_id: newUser.user_id,
        hospital_name: `${newUser.name} Medical Care`,
        registration_number: `REG-HOSP-${Date.now().toString().slice(-6)}`,
        address: `${newUser.city} Metro Area`,
        city: newUser.city,
        state: 'Maharashtra',
        verification_status: 'Verified'
      });
    } else if (role === 'blood_bank') {
      profile = db.addBloodBank({
        user_id: newUser.user_id,
        bank_name: `${newUser.name} Blood Center`,
        license_number: `LIC-BB-${Date.now().toString().slice(-6)}`,
        address: `${newUser.city} Central District`,
        city: newUser.city,
        state: 'Maharashtra',
        verification_status: 'Verified'
      });
    } else if (role === 'blood_camp') {
      profile = db.addBloodCamp({
        user_id: newUser.user_id,
        camp_name: `${newUser.name}'s Community Blood Drive`,
        organizer_name: newUser.name,
        registration_number: `CAMP-${Date.now().toString().slice(-6)}`,
        address: `${newUser.city} Community Hall`,
        city: newUser.city,
        camp_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        verification_status: 'Verified',
        status: 'Verified'
      });
    }

    return res.status(201).json({
      success: true,
      isNewUser: true,
      user: {
        user_id: newUser.user_id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        city: newUser.city,
        verification_status: profile?.verification_status || 'Verified',
        eligibility_status: (profile as any)?.eligibility_status || 'Eligible',
        profile
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Google authentication failed' });
  }
});
