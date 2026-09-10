import fs from 'fs';
import path from 'path';
import { hashPasswordServer } from './authUtils';

export const DEFAULT_RAILWAY_DATABASE_URL =
  process.env.VITE_BLOODLINK_API_URL || 'https://bloodlink-api-production.up.railway.app';

// Local backup path to ensure durability
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'bloodlink-store.json');

/**
 * 1. USERS TABLE
 * Common authentication table for all portal users.
 */
export interface DbUser {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: 'donor' | 'hospital' | 'blood_bank' | 'blood_camp' | 'admin';
  city: string;
  latitude: number | string;
  longitude: number | string;
  created_at: string;
}

/**
 * 2. DONORS TABLE
 * Extended donor profile referencing users.user_id
 */
export interface DbDonor {
  donor_id: number;
  user_id: number;
  blood_group: string;
  date_of_birth: string;
  gender: string;
  last_donation_date: string | null;
  eligibility_status: 'Eligible' | 'Not Eligible' | 'Pending Verification' | string;
  verification_status: 'Pending' | 'Verified' | 'Rejected' | string;
  weight_kg: number;
  // Extended & compatibility fields
  name?: string;
  phone?: string;
  city?: string;
  email?: string;
  age?: number;
  area?: string;
  state?: string;
  donation_count?: number;
  is_available?: boolean;
  available_for_emergency?: boolean;
  history?: any[];
}

/**
 * 3. HOSPITALS TABLE
 * Referencing users.user_id
 */
export interface DbHospital {
  hospital_id: number;
  user_id: number;
  hospital_name: string;
  registration_number: string;
  address: string;
  verification_status: 'Pending' | 'Verified' | 'Rejected' | string;
  // Extended & compatibility fields
  contact_person?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  licence_document_name?: string;
  created_at?: string;
  verified_at?: string;
}

/**
 * 4. BLOOD BANKS TABLE
 * Referencing users.user_id
 */
export interface DbBloodBank {
  blood_bank_id: number;
  user_id: number;
  bank_name: string;
  license_number: string;
  address: string;
  verification_status: 'Pending' | 'Verified' | 'Rejected' | string;
  // Extended & compatibility fields
  contact_person?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  licence_document_name?: string;
  created_at?: string;
  verified_at?: string;
}

/**
 * 5. BLOOD CAMPS TABLE
 * Referencing users.user_id
 */
export interface DbBloodCamp {
  camp_id: number;
  user_id: number;
  camp_name: string;
  organizer_name: string;
  registration_number: string;
  address: string;
  city: string;
  camp_date: string;
  verification_status: 'Pending' | 'Verified' | 'Rejected' | string;
  created_at: string;
  // Extended compatibility fields
  location?: string;
  venue?: string;
  start_time?: string;
  end_time?: string;
  capacity?: number;
  required_blood_group?: string;
  partner_blood_bank?: string;
  status?: string;
  registered_count?: number;
  description?: string;
  contact?: string;
  registration_limit?: number;
}

export interface DbCamp extends DbBloodCamp {
  organiser_id?: number;
  blood_bank_id?: number;
  latitude?: string;
  longitude?: string;
  name?: string;
}

export interface DbInventory {
  inventory_id: number;
  bank_name: string;
  blood_group: string;
  component: string;
  units_available: number;
  units_reserved: number;
  expire_date: string;
  // Extended fields
  unit_id_str?: string;
  volume?: number;
  collection_date?: string;
  status?: 'Available' | 'Reserved' | 'Expired';
}

export interface DbBloodRequest {
  request_id: number;
  request_user_id: number;
  hospital_id: number;
  patient_name: string;
  blood_group: string;
  component: string;
  units_required: number;
  urgency_level: string;
  required_by: string;
  location: string;
  latitude: string;
  longitude: string;
  verification_status: string;
  request_status: string;
  created_at: string;
  requested_by_name?: string;
  hospital_name?: string;
  // Extended workflow tracking
  assigned_blood_bank_id?: string;
  assigned_blood_bank_name?: string;
  rejected_by_blood_bank_ids?: string[];
  allocated_units?: number;
  delivery_status?: string;
  tracking_number?: string;
  patient_diagnosis?: string;
}

export interface DbCampAttendee {
  id: string;
  camp_id: number;
  camp_name: string;
  donor_id: string;
  donor_name: string;
  donor_phone: string;
  donor_blood_group: string;
  slot_time: string;
  registered_at: string;
}

export interface DbOrganizer {
  id: string;
  organization_name: string;
  organizer_name: string;
  email: string;
  phone: string;
  contact: string;
  tax_or_reg_id?: string;
  created_at: string;
}

export interface DbNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  is_urgent?: boolean;
  type?: 'alert' | 'info' | 'success';
}

class BloodLinkDatabase {
  private railwayBaseUrl: string = DEFAULT_RAILWAY_DATABASE_URL;
  private users: DbUser[] = [];
  private donors: DbDonor[] = [];
  private hospitals: DbHospital[] = [];
  private bloodBanks: DbBloodBank[] = [];
  private bloodCamps: DbBloodCamp[] = [];
  private camps: DbCamp[] = [];
  private inventory: DbInventory[] = [];
  private bloodRequests: DbBloodRequest[] = [];
  private campAttendees: DbCampAttendee[] = [];
  private organizers: DbOrganizer[] = [];
  private notifications: DbNotification[] = [];

  private isConnected: boolean = false;
  private lastSyncedAt: string | null = null;
  private syncError: string | null = null;
  private lastLatencyMs: number = 0;

  constructor() {
    this.ensureDataDir();
    this.loadFromDisk();
    this.ensureInitialSeed();
  }

  private ensureDataDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (e) {
      console.warn('Could not create data dir:', e);
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.users)) this.users = data.users;
        if (Array.isArray(data.donors)) this.donors = data.donors;
        if (Array.isArray(data.hospitals)) this.hospitals = data.hospitals;
        if (Array.isArray(data.bloodBanks)) this.bloodBanks = data.bloodBanks;
        if (Array.isArray(data.bloodCamps)) this.bloodCamps = data.bloodCamps;
        if (Array.isArray(data.camps)) this.camps = data.camps;
        if (Array.isArray(data.inventory)) this.inventory = data.inventory;
        if (Array.isArray(data.bloodRequests)) this.bloodRequests = data.bloodRequests;
        if (Array.isArray(data.campAttendees)) this.campAttendees = data.campAttendees;
        if (Array.isArray(data.organizers)) this.organizers = data.organizers;
        if (Array.isArray(data.notifications)) this.notifications = data.notifications;
      }
    } catch (e) {
      console.warn('Failed to load local database snapshot:', e);
    }
  }

  private ensureInitialSeed() {
    // If users table is empty, seed demo accounts for each role with secure password hashes
    if (this.users.length === 0) {
      const defaultHash = hashPasswordServer('password123');
      const now = new Date().toISOString();

      const seedUsers: DbUser[] = [
        {
          user_id: 1,
          name: 'Aarav Deshmukh',
          email: 'aarav.donor@bloodlink.org',
          phone: '+91 98220 12345',
          password_hash: defaultHash,
          role: 'donor',
          city: 'Pune',
          latitude: 18.5204,
          longitude: 73.8567,
          created_at: now
        },
        {
          user_id: 2,
          name: 'Dr. Radhika Sen',
          email: 'admin@rubyhall.org',
          phone: '+91 20 6645 5100',
          password_hash: defaultHash,
          role: 'hospital',
          city: 'Pune',
          latitude: 18.5312,
          longitude: 73.8765,
          created_at: now
        },
        {
          user_id: 3,
          name: 'Vikram Joshi',
          email: 'contact@sahyadribank.org',
          phone: '+91 20 6721 5000',
          password_hash: defaultHash,
          role: 'blood_bank',
          city: 'Pune',
          latitude: 18.5089,
          longitude: 73.8344,
          created_at: now
        },
        {
          user_id: 4,
          name: 'Meera Patil',
          email: 'organizer@redcrosscamp.org',
          phone: '+91 94220 54321',
          password_hash: defaultHash,
          role: 'blood_camp',
          city: 'Pune',
          latitude: 18.5298,
          longitude: 73.8476,
          created_at: now
        },
        {
          user_id: 5,
          name: 'Rohan Mehta',
          email: 'rohan.new@donor.org',
          phone: '+91 98221 99999',
          password_hash: defaultHash,
          role: 'donor',
          city: 'Pune',
          latitude: 18.5204,
          longitude: 73.8567,
          created_at: now
        }
      ];

      this.users = seedUsers;

      // Seed matching donors
      if (this.donors.length === 0) {
        this.donors = [
          {
            donor_id: 1,
            user_id: 1,
            blood_group: 'O+',
            date_of_birth: '1998-05-14',
            gender: 'Male',
            last_donation_date: '2026-05-10',
            eligibility_status: 'Eligible',
            verification_status: 'Verified',
            weight_kg: 68,
            name: 'Aarav Deshmukh',
            email: 'aarav.donor@bloodlink.org',
            phone: '+91 98220 12345',
            city: 'Pune',
            donation_count: 3,
            is_available: true,
            available_for_emergency: true
          },
          {
            donor_id: 2,
            user_id: 5,
            blood_group: 'B+',
            date_of_birth: '2001-08-20',
            gender: 'Male',
            last_donation_date: null,
            eligibility_status: 'Pending Verification',
            verification_status: 'Pending',
            weight_kg: 62,
            name: 'Rohan Mehta',
            email: 'rohan.new@donor.org',
            phone: '+91 98221 99999',
            city: 'Pune',
            donation_count: 0,
            is_available: true,
            available_for_emergency: true
          }
        ];
      }

      // Seed matching hospitals
      if (this.hospitals.length === 0) {
        this.hospitals = [
          {
            hospital_id: 1,
            user_id: 2,
            hospital_name: 'Ruby Hall Clinic Multi-Specialty',
            registration_number: 'MH-PUN-HOSP-2024-88',
            address: '40 Sassoon Road, Sangamvadi, Pune 411001',
            verification_status: 'Verified',
            contact_person: 'Dr. Radhika Sen',
            email: 'admin@rubyhall.org',
            phone: '+91 20 6645 5100',
            city: 'Pune',
            state: 'Maharashtra',
            created_at: now,
            verified_at: now
          }
        ];
      }

      // Seed matching blood banks
      if (this.bloodBanks.length === 0) {
        this.bloodBanks = [
          {
            blood_bank_id: 1,
            user_id: 3,
            bank_name: 'Sahyadri Blood Bank & Component Lab',
            license_number: 'BB-LIC-MH-PUN-0412',
            address: 'Plot 33-C, Karve Road, Deccan Gymkhana, Pune 411004',
            verification_status: 'Verified',
            contact_person: 'Vikram Joshi',
            email: 'contact@sahyadribank.org',
            phone: '+91 20 6721 5000',
            city: 'Pune',
            state: 'Maharashtra',
            created_at: now,
            verified_at: now
          }
        ];
      }

      // Seed matching blood camps
      if (this.bloodCamps.length === 0) {
        this.bloodCamps = [
          {
            camp_id: 1,
            user_id: 4,
            camp_name: 'City Youth Blood Donation Drive 2026',
            organizer_name: 'Meera Patil',
            registration_number: 'ORG-RED-CROSS-PUN-77',
            address: 'Shivaji Nagar Community Hall, Pune',
            city: 'Pune',
            camp_date: '2026-10-15',
            verification_status: 'Verified',
            created_at: now,
            start_time: '09:00:00',
            end_time: '17:00:00',
            capacity: 100,
            required_blood_group: 'All Groups',
            partner_blood_bank: 'Sahyadri Blood Bank & Component Lab',
            registered_count: 24,
            description: 'Annual mega blood drive in partnership with Indian Red Cross Society.'
          }
        ];
      }

      this.saveToDisk();
    }
  }

  public saveToDisk() {
    try {
      this.ensureDataDir();
      const payload = {
        users: this.users,
        donors: this.donors,
        hospitals: this.hospitals,
        bloodBanks: this.bloodBanks,
        bloodCamps: this.bloodCamps,
        camps: this.camps,
        inventory: this.inventory,
        bloodRequests: this.bloodRequests,
        campAttendees: this.campAttendees,
        organizers: this.organizers,
        notifications: this.notifications,
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Failed to save database snapshot to disk:', e);
    }
  }

  public getRailwayUrl(): string {
    return this.railwayBaseUrl;
  }

  public setRailwayUrl(url: string) {
    this.railwayBaseUrl = url.trim().replace(/\/+$/, '');
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      railwayBaseUrl: this.railwayBaseUrl,
      lastSyncedAt: this.lastSyncedAt,
      syncError: this.syncError,
      latencyMs: this.lastLatencyMs,
      tableCounts: {
        donors: this.donors.length,
        hospitals: this.hospitals.length,
        bloodBanks: this.bloodBanks.length,
        camps: this.camps.length,
        inventory: this.inventory.length,
        bloodRequests: this.bloodRequests.length,
        campAttendees: this.campAttendees.length,
        organizers: this.organizers.length,
        notifications: this.notifications.length
      }
    };
  }

  /**
   * Synchronize all collections with Railway PostgreSQL Database
   */
  public async syncWithRailway(): Promise<boolean> {
    const start = performance.now();
    try {
      const fetchEndpoint = async (path: string) => {
        const res = await fetch(`${this.railwayBaseUrl}${path}`, {
          headers: { Accept: 'application/json' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} from ${path}`);
        return res.json();
      };

      const [rDonors, rHospitals, rBloodBanks, rCamps, rInventory, rRequests] =
        await Promise.all([
          fetchEndpoint('/api/donors').catch(() => null),
          fetchEndpoint('/api/hospitals').catch(() => null),
          fetchEndpoint('/api/blood-banks').catch(() => null),
          fetchEndpoint('/api/camps').catch(() => null),
          fetchEndpoint('/api/inventory').catch(() => null),
          fetchEndpoint('/api/blood-requests').catch(() => null)
        ]);

      this.lastLatencyMs = Math.round(performance.now() - start);

      // Merge remote donors with local
      if (Array.isArray(rDonors)) {
        for (const rd of rDonors) {
          const idx = this.donors.findIndex((d) => d.donor_id === rd.donor_id);
          if (idx >= 0) {
            this.donors[idx] = { ...this.donors[idx], ...rd };
          } else {
            this.donors.push({
              ...rd,
              is_available: true,
              available_for_emergency: true,
              donation_count: rd.last_donation_date ? 1 : 0
            });
          }
        }
      }

      // Merge remote hospitals
      if (Array.isArray(rHospitals)) {
        for (const rh of rHospitals) {
          const idx = this.hospitals.findIndex((h) => h.hospital_id === rh.hospital_id);
          if (idx >= 0) {
            this.hospitals[idx] = { ...this.hospitals[idx], ...rh };
          } else {
            this.hospitals.push(rh);
          }
        }
      }

      // Merge remote blood banks
      if (Array.isArray(rBloodBanks)) {
        for (const rb of rBloodBanks) {
          const idx = this.bloodBanks.findIndex((b) => b.blood_bank_id === rb.blood_bank_id);
          if (idx >= 0) {
            this.bloodBanks[idx] = { ...this.bloodBanks[idx], ...rb };
          } else {
            this.bloodBanks.push(rb);
          }
        }
      }

      // Merge remote camps
      if (Array.isArray(rCamps)) {
        for (const rc of rCamps) {
          const idx = this.camps.findIndex((c) => c.camp_id === rc.camp_id);
          if (idx >= 0) {
            this.camps[idx] = { ...this.camps[idx], ...rc };
          } else {
            this.camps.push(rc);
          }
        }
      }

      // Merge remote inventory
      if (Array.isArray(rInventory)) {
        for (const ri of rInventory) {
          const idx = this.inventory.findIndex((i) => i.inventory_id === ri.inventory_id);
          if (idx >= 0) {
            this.inventory[idx] = { ...this.inventory[idx], ...ri };
          } else {
            this.inventory.push(ri);
          }
        }
      }

      // Merge remote blood requests
      if (Array.isArray(rRequests)) {
        for (const rr of rRequests) {
          const idx = this.bloodRequests.findIndex((r) => r.request_id === rr.request_id);
          if (idx >= 0) {
            this.bloodRequests[idx] = { ...this.bloodRequests[idx], ...rr };
          } else {
            this.bloodRequests.push(rr);
          }
        }
      }

      this.isConnected = true;
      this.lastSyncedAt = new Date().toISOString();
      this.syncError = null;
      this.saveToDisk();
      return true;
    } catch (err: any) {
      this.isConnected = false;
      this.syncError = err.message || 'Railway sync failed';
      this.lastLatencyMs = Math.round(performance.now() - start);
      return false;
    }
  }

  // --- USERS TABLE (COMMON AUTHENTICATION TABLE) ---
  public getUsers() {
    return this.users;
  }

  public getUserById(id: number) {
    return this.users.find((u) => u.user_id === id);
  }

  public findUserByAuth(identifier: string) {
    const norm = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');
    return this.users.find((u) => {
      const matchEmail = u.email && u.email.toLowerCase() === norm;
      const matchPhone = u.phone && u.phone.replace(/\D/g, '') === cleanDigits;
      const matchName = u.name && u.name.toLowerCase() === norm;
      return matchEmail || matchPhone || matchName;
    });
  }

  public addUser(data: Partial<DbUser>): DbUser {
    const nextId =
      this.users.length > 0 ? Math.max(...this.users.map((u) => u.user_id)) + 1 : 1;
    const newUser: DbUser = {
      user_id: nextId,
      name: data.name || 'BloodLink User',
      email: data.email || `user${nextId}@bloodlink.org`,
      phone: data.phone || '0000000000',
      password_hash: data.password_hash || hashPasswordServer('password123'),
      role: data.role || 'donor',
      city: data.city || 'Pune',
      latitude: data.latitude || 18.5204,
      longitude: data.longitude || 73.8567,
      created_at: new Date().toISOString()
    };
    this.users.unshift(newUser);
    this.saveToDisk();
    return newUser;
  }

  public updateUser(id: number, updates: Partial<DbUser>) {
    const target = this.getUserById(id);
    if (target) {
      Object.assign(target, updates);
      this.saveToDisk();
      return target;
    }
    return null;
  }

  // --- DONORS ---
  public getDonors() {
    return this.donors;
  }

  public getDonorById(id: number) {
    return this.donors.find((d) => d.donor_id === id);
  }

  public getDonorByUserId(userId: number) {
    return this.donors.find((d) => d.user_id === userId);
  }

  public findDonorByAuth(identifier: string) {
    const norm = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');
    return this.donors.find((d) => {
      const matchName = d.name && d.name.toLowerCase() === norm;
      const matchEmail = d.email && d.email.toLowerCase() === norm;
      const matchPhone = d.phone && d.phone.replace(/\D/g, '') === cleanDigits;
      return matchName || matchEmail || matchPhone;
    });
  }

  public addDonor(data: Partial<DbDonor>): DbDonor {
    const nextId =
      this.donors.length > 0 ? Math.max(...this.donors.map((d) => d.donor_id)) + 1 : 1;
    const newDonor: DbDonor = {
      donor_id: nextId,
      user_id: data.user_id || 1,
      name: data.name || 'Anonymous Donor',
      phone: data.phone || '0000000000',
      city: data.city || 'Pune',
      blood_group: data.blood_group || 'O+',
      date_of_birth: data.date_of_birth || '1998-01-01',
      gender: data.gender || 'Not specified',
      weight_kg: Number(data.weight_kg) || 60,
      eligibility_status: data.eligibility_status || 'Pending Verification',
      verification_status: data.verification_status || 'Pending',
      last_donation_date: data.last_donation_date || null,
      email: data.email || '',
      age: data.age || 25,
      area: data.area || '',
      state: data.state || 'Maharashtra',
      donation_count: data.donation_count || 0,
      is_available: data.is_available !== false,
      available_for_emergency: data.available_for_emergency !== false,
      history: data.history || []
    };
    this.donors.unshift(newDonor);
    this.saveToDisk();
    return newDonor;
  }

  public updateDonorAvailability(id: number, isAvailable: boolean) {
    const target = this.donors.find((d) => d.donor_id === id);
    if (target) {
      target.is_available = isAvailable;
      this.saveToDisk();
      return target;
    }
    return null;
  }

  // --- HOSPITALS ---
  public getHospitals() {
    return this.hospitals;
  }

  public getHospitalById(id: number) {
    return this.hospitals.find((h) => h.hospital_id === id);
  }

  public findHospitalByAuth(identifier: string) {
    const norm = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');
    return this.hospitals.find((h) => {
      const matchName = h.hospital_name.toLowerCase() === norm;
      const matchReg = h.registration_number.toLowerCase() === norm;
      const matchEmail = h.email && h.email.toLowerCase() === norm;
      const matchPhone = h.phone && h.phone.replace(/\D/g, '') === cleanDigits;
      return matchName || matchReg || matchEmail || matchPhone;
    });
  }

  public addHospital(data: Partial<DbHospital>): DbHospital {
    const nextId =
      this.hospitals.length > 0 ? Math.max(...this.hospitals.map((h) => h.hospital_id)) + 1 : 1;
    const newHosp: DbHospital = {
      hospital_id: nextId,
      user_id: data.user_id || 10 + nextId,
      hospital_name: data.hospital_name || 'Hospital',
      registration_number: data.registration_number || `REG-${Date.now()}`,
      address: data.address || '',
      verification_status: data.verification_status || 'unverified',
      contact_person: data.contact_person || '',
      email: data.email || '',
      phone: data.phone || '',
      city: data.city || '',
      state: data.state || '',
      licence_document_name: data.licence_document_name || '',
      created_at: new Date().toISOString()
    };
    this.hospitals.unshift(newHosp);
    this.saveToDisk();
    return newHosp;
  }

  public updateHospitalStatus(id: number, status: 'verified' | 'rejected' | 'unverified') {
    const target = this.hospitals.find((h) => h.hospital_id === id);
    if (target) {
      target.verification_status = status;
      if (status === 'verified') {
        target.verified_at = new Date().toISOString();
      }
      this.saveToDisk();
      return target;
    }
    return null;
  }

  // --- BLOOD BANKS ---
  public getBloodBanks() {
    return this.bloodBanks;
  }

  public getBloodBankById(id: number) {
    return this.bloodBanks.find((b) => b.blood_bank_id === id);
  }

  public findBloodBankByAuth(identifier: string) {
    const norm = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');
    return this.bloodBanks.find((b) => {
      const matchName = b.bank_name.toLowerCase() === norm;
      const matchLic = b.license_number.toLowerCase() === norm;
      const matchEmail = b.email && b.email.toLowerCase() === norm;
      const matchPhone = b.phone && b.phone.replace(/\D/g, '') === cleanDigits;
      return matchName || matchLic || matchEmail || matchPhone;
    });
  }

  public addBloodBank(data: Partial<DbBloodBank>): DbBloodBank {
    const nextId =
      this.bloodBanks.length > 0 ? Math.max(...this.bloodBanks.map((b) => b.blood_bank_id)) + 1 : 1;
    const newBank: DbBloodBank = {
      blood_bank_id: nextId,
      user_id: data.user_id || 20 + nextId,
      bank_name: data.bank_name || 'Blood Bank',
      license_number: data.license_number || `LIC-${Date.now()}`,
      address: data.address || '',
      verification_status: data.verification_status || 'unverified',
      contact_person: data.contact_person || '',
      email: data.email || '',
      phone: data.phone || '',
      city: data.city || '',
      state: data.state || '',
      licence_document_name: data.licence_document_name || '',
      created_at: new Date().toISOString()
    };
    this.bloodBanks.unshift(newBank);
    this.saveToDisk();
    return newBank;
  }

  public updateBloodBankStatus(id: number, status: 'verified' | 'rejected' | 'unverified') {
    const target = this.bloodBanks.find((b) => b.blood_bank_id === id);
    if (target) {
      target.verification_status = status;
      if (status === 'verified') {
        target.verified_at = new Date().toISOString();
      }
      this.saveToDisk();
      return target;
    }
    return null;
  }

  // --- BLOOD CAMPS TABLE (REFERENCING USERS.USER_ID) ---
  public getBloodCamps() {
    return this.bloodCamps;
  }

  public getBloodCampById(id: number) {
    return this.bloodCamps.find((c) => c.camp_id === id);
  }

  public getBloodCampByUserId(userId: number) {
    return this.bloodCamps.find((c) => c.user_id === userId);
  }

  public findBloodCampByAuth(identifier: string) {
    const norm = identifier.trim().toLowerCase();
    return this.bloodCamps.find((c) => {
      const matchName = c.camp_name && c.camp_name.toLowerCase() === norm;
      const matchOrg = c.organizer_name && c.organizer_name.toLowerCase() === norm;
      const matchReg = c.registration_number && c.registration_number.toLowerCase() === norm;
      return matchName || matchOrg || matchReg;
    });
  }

  public addBloodCamp(data: Partial<DbBloodCamp> & { name?: string }): DbBloodCamp {
    const nextId =
      this.bloodCamps.length > 0 ? Math.max(...this.bloodCamps.map((c) => c.camp_id)) + 1 : 1;
    const newCamp: DbBloodCamp = {
      camp_id: nextId,
      user_id: data.user_id || 4,
      camp_name: data.camp_name || (data as any).name || `Blood Donation Camp #${nextId}`,
      organizer_name: data.organizer_name || 'Camp Organizer',
      registration_number: data.registration_number || `REG-CAMP-${Date.now()}`,
      address: data.address || 'Central Community Hall',
      city: data.city || 'Pune',
      camp_date: data.camp_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      verification_status: data.verification_status || 'Pending',
      created_at: new Date().toISOString(),
      location: data.address || data.venue || 'Regional Venue',
      start_time: data.start_time || '09:00:00',
      end_time: data.end_time || '17:00:00',
      capacity: data.capacity || 100,
      required_blood_group: data.required_blood_group || 'All Groups',
      partner_blood_bank: data.partner_blood_bank || 'Sahyadri Blood Bank',
      status: data.verification_status === 'Verified' ? 'Active Booking' : 'Pending Verification',
      registered_count: data.registered_count || 0,
      description: data.description || 'Community blood donation drive organized under BloodLink safety guidelines.'
    };
    this.bloodCamps.unshift(newCamp);

    // Also mirror into legacy camps array for unified backward-compatibility
    this.camps.unshift({
      ...newCamp,
      organiser_id: newCamp.user_id,
      blood_bank_id: 1,
      latitude: '18.5204',
      longitude: '73.8567',
      name: newCamp.camp_name,
      venue: newCamp.address,
      contact: newCamp.organizer_name,
      registration_limit: newCamp.capacity
    });

    this.saveToDisk();
    return newCamp;
  }

  public updateBloodCampStatus(id: number, status: 'Pending' | 'Verified' | 'Rejected') {
    const target = this.bloodCamps.find((c) => c.camp_id === id);
    if (target) {
      target.verification_status = status;
      target.status = status === 'Verified' ? 'Active Booking' : status === 'Pending' ? 'Pending Verification' : 'Suspended';
      // Sync legacy camps
      const legacyTarget = this.camps.find((c) => c.camp_id === id);
      if (legacyTarget) {
        legacyTarget.verification_status = status;
        legacyTarget.status = target.status;
      }
      this.saveToDisk();
      return target;
    }
    return null;
  }

  // --- UNIFIED VERIFICATION STATUS CONTROLLER ---
  public updateVerificationStatus(
    role: 'donor' | 'hospital' | 'blood_bank' | 'blood_camp' | string,
    id: number | string,
    status: 'Pending' | 'Verified' | 'Rejected'
  ) {
    const numId = Number(String(id).replace(/\D/g, ''));
    if (role === 'donor') {
      const target = this.donors.find((d) => d.donor_id === numId || d.user_id === numId);
      if (target) {
        target.verification_status = status;
        if (status === 'Verified') {
          // If clinical parameters pass, mark Eligible
          const lastDonationDays = target.last_donation_date
            ? Math.floor((Date.now() - new Date(target.last_donation_date).getTime()) / (1000 * 86400))
            : 999;
          const isEligible = (target.weight_kg ? target.weight_kg >= 50 : true) && lastDonationDays >= 90;
          target.eligibility_status = isEligible ? 'Eligible' : 'Not Eligible';
        } else if (status === 'Rejected') {
          target.eligibility_status = 'Not Eligible';
        } else {
          target.eligibility_status = 'Pending Verification';
        }
        this.saveToDisk();
        return { success: true, target };
      }
    } else if (role === 'hospital') {
      const target = this.hospitals.find((h) => h.hospital_id === numId || h.user_id === numId);
      if (target) {
        target.verification_status = status;
        if (status === 'Verified') target.verified_at = new Date().toISOString();
        this.saveToDisk();
        return { success: true, target };
      }
    } else if (role === 'blood_bank' || role === 'blood-bank') {
      const target = this.bloodBanks.find((b) => b.blood_bank_id === numId || b.user_id === numId);
      if (target) {
        target.verification_status = status;
        if (status === 'Verified') target.verified_at = new Date().toISOString();
        this.saveToDisk();
        return { success: true, target };
      }
    } else if (role === 'blood_camp' || role === 'blood-camp' || role === 'camp') {
      const target = this.updateBloodCampStatus(numId, status);
      if (target) {
        return { success: true, target };
      }
    }
    return { success: false, error: 'Entity not found' };
  }

  public getPortalRecordForUser(user: DbUser) {
    if (user.role === 'donor') {
      return this.getDonorByUserId(user.user_id) || this.donors.find((d) => d.email === user.email);
    }
    if (user.role === 'hospital') {
      return this.hospitals.find((h) => h.user_id === user.user_id || h.email === user.email);
    }
    if (user.role === 'blood_bank') {
      return this.bloodBanks.find((b) => b.user_id === user.user_id || b.email === user.email);
    }
    if (user.role === 'blood_camp') {
      return this.bloodCamps.find((c) => c.user_id === user.user_id);
    }
    return null;
  }

  // --- CAMPS & ORGANIZERS ---
  public getCamps() {
    return this.camps;
  }

  public getCampById(id: number) {
    return this.camps.find((c) => c.camp_id === id);
  }

  public addCamp(data: Partial<DbCamp>): DbCamp {
    const nextId =
      this.camps.length > 0 ? Math.max(...this.camps.map((c) => c.camp_id)) + 1 : 1;
    const newCamp: DbCamp = {
      camp_id: nextId,
      user_id: data.user_id || data.organiser_id || 4,
      camp_name: data.camp_name || data.name || `Blood Donation Camp #${nextId}`,
      organizer_name: data.organizer_name || data.contact || 'Camp Organizer',
      registration_number: data.registration_number || `REG-CAMP-${Date.now()}`,
      address: data.address || data.venue || data.location || 'Central Community Hall',
      city: data.city || 'Pune',
      verification_status: data.verification_status || 'Verified',
      created_at: data.created_at || new Date().toISOString(),
      organiser_id: data.organiser_id || 3,
      blood_bank_id: data.blood_bank_id || 1,
      location: data.location || data.venue || 'Regional Venue',
      latitude: data.latitude || '18.5204',
      longitude: data.longitude || '73.8567',
      camp_date: data.camp_date || new Date().toISOString().split('T')[0],
      start_time: data.start_time || '09:00:00',
      end_time: data.end_time || '17:00:00',
      capacity: data.capacity || 50,
      required_blood_group: data.required_blood_group || 'All Groups',
      status: data.status || 'upcoming',
      partner_blood_bank: data.partner_blood_bank || 'Sahyadri Blood Bank',
      name: data.name || data.camp_name || `Blood Donation Camp #${nextId}`,
      venue: data.venue || data.location || '',
      contact: data.contact || '',
      registration_limit: data.registration_limit || data.capacity || 50,
      registered_count: 0,
      description: data.description || 'Community blood donation camp'
    };
    this.camps.unshift(newCamp);
    this.saveToDisk();
    return newCamp;
  }

  public addCampAttendee(attendee: Omit<DbCampAttendee, 'id' | 'registered_at'>): DbCampAttendee {
    const newReg: DbCampAttendee = {
      ...attendee,
      id: `REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      registered_at: new Date().toISOString()
    };
    this.campAttendees.unshift(newReg);

    // Increment camp registered_count
    const camp = this.camps.find((c) => c.camp_id === Number(attendee.camp_id));
    if (camp) {
      camp.registered_count = (camp.registered_count || 0) + 1;
    }

    this.saveToDisk();
    return newReg;
  }

  public getCampAttendees(campId?: number) {
    if (campId) {
      return this.campAttendees.filter((a) => a.camp_id === campId);
    }
    return this.campAttendees;
  }

  public getOrganizers() {
    return this.organizers;
  }

  public addOrganizer(org: Partial<DbOrganizer>): DbOrganizer {
    const newOrg: DbOrganizer = {
      id: `ORG-${Math.floor(1000 + Math.random() * 9000)}`,
      organization_name: org.organization_name || 'Organizer Organization',
      organizer_name: org.organizer_name || 'Organizer Lead',
      email: org.email || '',
      phone: org.phone || '',
      contact: org.contact || org.phone || '',
      tax_or_reg_id: org.tax_or_reg_id || '',
      created_at: new Date().toISOString()
    };
    this.organizers.unshift(newOrg);
    this.saveToDisk();
    return newOrg;
  }

  public findOrganizerByAuth(identifier: string) {
    const norm = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');
    return this.organizers.find((o) => {
      const matchEmail = o.email.toLowerCase() === norm;
      const matchPhone = o.phone.replace(/\D/g, '') === cleanDigits;
      const matchOrg = o.organization_name.toLowerCase() === norm;
      return matchEmail || matchPhone || matchOrg;
    });
  }

  // --- INVENTORY ---
  public getInventory() {
    return this.inventory;
  }

  public addInventoryUnit(data: Partial<DbInventory>): DbInventory {
    const nextId =
      this.inventory.length > 0 ? Math.max(...this.inventory.map((i) => i.inventory_id)) + 1 : 1;
    const newUnit: DbInventory = {
      inventory_id: nextId,
      bank_name: data.bank_name || 'Sahyadri Blood Bank',
      blood_group: data.blood_group || 'O+',
      component: data.component || 'whole_blood',
      units_available: data.units_available ?? 1,
      units_reserved: data.units_reserved ?? 0,
      expire_date:
        data.expire_date ||
        new Date(Date.now() + 35 * 24 * 3600 * 1000).toISOString().split('T')[0],
      unit_id_str: data.unit_id_str || `UNIT-${Math.floor(10000 + Math.random() * 90000)}`,
      volume: data.volume || 450,
      collection_date: data.collection_date || new Date().toISOString().split('T')[0],
      status: 'Available'
    };
    this.inventory.unshift(newUnit);
    this.saveToDisk();
    return newUnit;
  }

  public removeInventoryUnit(id: number | string) {
    const initialLen = this.inventory.length;
    this.inventory = this.inventory.filter(
      (i) => i.inventory_id !== Number(id) && i.unit_id_str !== String(id)
    );
    const removed = this.inventory.length < initialLen;
    if (removed) this.saveToDisk();
    return removed;
  }

  public toggleInventoryStatus(id: number | string) {
    const target = this.inventory.find(
      (i) => i.inventory_id === Number(id) || i.unit_id_str === String(id)
    );
    if (target) {
      if (target.status === 'Available') {
        target.status = 'Reserved';
        target.units_reserved = (target.units_reserved || 0) + 1;
        target.units_available = Math.max(0, (target.units_available || 1) - 1);
      } else {
        target.status = 'Available';
        target.units_available = (target.units_available || 0) + 1;
        target.units_reserved = Math.max(0, (target.units_reserved || 1) - 1);
      }
      this.saveToDisk();
      return target;
    }
    return null;
  }

  // --- BLOOD REQUESTS & REQUISITIONS ---
  public getBloodRequests() {
    return this.bloodRequests;
  }

  public getBloodRequestById(id: number | string) {
    const numId = Number(String(id).replace(/\D/g, ''));
    return this.bloodRequests.find(
      (r) => r.request_id === numId || `REQ-${r.request_id}` === String(id)
    );
  }

  public async addBloodRequest(payload: any): Promise<DbBloodRequest> {
    const nextId =
      this.bloodRequests.length > 0
        ? Math.max(...this.bloodRequests.map((r) => r.request_id)) + 1
        : 1;

    const newReq: DbBloodRequest = {
      request_id: nextId,
      request_user_id: payload.request_user_id || 2,
      hospital_id: payload.hospital_id || 1,
      patient_name: payload.patient_name || 'Emergency Patient',
      blood_group: payload.blood_group || 'O+',
      component: payload.component || 'whole_blood',
      units_required: Number(payload.units_required || 1),
      urgency_level: payload.urgency_level || 'urgent',
      required_by:
        payload.required_by ||
        new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' '),
      location: payload.location || 'Hospital Trauma Center',
      latitude: String(payload.latitude || 18.5204),
      longitude: String(payload.longitude || 73.8567),
      verification_status: 'verified',
      request_status: 'searching',
      created_at: new Date().toISOString(),
      requested_by_name: payload.requested_by_name || 'Duty Medical Officer',
      hospital_name: payload.hospital_name || 'Ruby Hall Clinic',
      patient_diagnosis: payload.patient_diagnosis || 'Acute blood loss'
    };

    this.bloodRequests.unshift(newReq);
    this.saveToDisk();

    // Forward to Railway PostgreSQL database asynchronously
    try {
      const railwayBody = {
        request_user_id: newReq.request_user_id,
        hospital_id: newReq.hospital_id,
        patient_name: newReq.patient_name,
        blood_group: newReq.blood_group,
        component: newReq.component.toLowerCase().replace(/ /g, '_'),
        units_required: newReq.units_required,
        urgency_level: newReq.urgency_level.toLowerCase(),
        required_by: newReq.required_by.includes(' ')
          ? newReq.required_by
          : `${newReq.required_by} 18:00:00`,
        location: newReq.location,
        latitude: parseFloat(newReq.latitude),
        longitude: parseFloat(newReq.longitude)
      };

      const res = await fetch(`${this.railwayBaseUrl}/api/blood-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(railwayBody)
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.request_id) {
          newReq.request_id = data.request_id;
          this.saveToDisk();
        }
      }
    } catch (e: any) {
      console.warn('Could not forward request to Railway DB:', e.message);
    }

    return newReq;
  }

  public updateBloodRequest(id: number | string, updates: Partial<DbBloodRequest>) {
    const target = this.getBloodRequestById(id);
    if (target) {
      Object.assign(target, updates);
      this.saveToDisk();
      return target;
    }
    return null;
  }

  public acceptBloodRequest(id: number | string, bloodBankId: string, bloodBankName: string) {
    const target = this.getBloodRequestById(id);
    if (target) {
      target.request_status = 'confirmed';
      target.assigned_blood_bank_id = bloodBankId;
      target.assigned_blood_bank_name = bloodBankName;
      target.delivery_status = 'Accepted';
      target.allocated_units = target.units_required;
      this.saveToDisk();
      return target;
    }
    return null;
  }

  public rejectBloodRequest(id: number | string, bloodBankId: string) {
    const target = this.getBloodRequestById(id);
    if (target) {
      const rejected = target.rejected_by_blood_bank_ids || [];
      if (!rejected.includes(bloodBankId)) {
        target.rejected_by_blood_bank_ids = [...rejected, bloodBankId];
      }
      this.saveToDisk();
      return target;
    }
    return null;
  }

  public allocateBloodUnits(id: number | string, units: number) {
    const target = this.getBloodRequestById(id);
    if (target) {
      target.request_status = 'reserved';
      target.delivery_status = 'Units Allocated';
      target.allocated_units = units;
      this.saveToDisk();
      return target;
    }
    return null;
  }

  public dispatchBloodSupply(id: number | string, trackingNumber?: string) {
    const target = this.getBloodRequestById(id);
    if (target) {
      target.request_status = 'dispatched';
      target.delivery_status = 'In Transit';
      target.tracking_number =
        trackingNumber || `TRK-COLD-${Math.floor(100000 + Math.random() * 900000)}`;
      this.saveToDisk();
      return target;
    }
    return null;
  }

  public receiveBloodSupply(id: number | string) {
    const target = this.getBloodRequestById(id);
    if (target) {
      target.request_status = 'fulfilled';
      target.delivery_status = 'Supplied';
      this.saveToDisk();
      return target;
    }
    return null;
  }

  // --- NOTIFICATIONS ---
  public getNotifications() {
    return this.notifications;
  }

  public addNotification(notif: Omit<DbNotification, 'id'>): DbNotification {
    const newNotif: DbNotification = {
      ...notif,
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    this.notifications.unshift(newNotif);
    this.saveToDisk();
    return newNotif;
  }

  public clearNotifications() {
    this.notifications = [];
    this.saveToDisk();
  }
}

export const db = new BloodLinkDatabase();
