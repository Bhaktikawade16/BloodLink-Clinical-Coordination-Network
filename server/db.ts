import fs from 'fs';
import path from 'path';
import { hashPasswordServer } from './authUtils';
import {
  runSmartMatching,
  evaluateDonorEligibility,
  maskDonorIdentifier,
  maskPhoneNumber,
  SmartMatchResults,
  normalizeComponent
} from './matchingEngine';

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
  // Extended & reservation tracking fields
  unit_id_str?: string;
  volume?: number;
  collection_date?: string;
  total_quantity?: number;
  available_quantity?: number;
  reserved_quantity?: number;
  issued_quantity?: number;
  status?: 'Available' | 'Reserved' | 'Issued' | 'Expired';
}

export interface DbInventoryReservation {
  reservation_id: string;
  request_id: number;
  inventory_id: number;
  blood_bank_id: number;
  blood_bank_name: string;
  blood_group: string;
  component: string;
  units_reserved: number;
  status: 'Pending Confirmation' | 'Confirmed' | 'Released' | 'Issued' | 'Expired';
  created_at: string;
  expires_at: string;
  confirmed_at?: string;
  rejection_reason?: string;
}

export interface DbRequestTimeline {
  timeline_id: string;
  request_id: number;
  title: string;
  description: string;
  timestamp: string;
  status: string;
  icon?: string;
}

export interface DbDonorResponse {
  response_id: string;
  request_id: number;
  donor_id: number;
  masked_donor_code: string;
  status: 'STANDBY' | 'ACTIVE_ALERT' | 'ACCEPTED' | 'DECLINED' | 'STANDBY_RELEASED' | 'FULFILLED';
  response?: 'ACCEPT' | 'DECLINE' | 'NO_RESPONSE';
  notified_at: string;
  responded_at?: string;
}

export interface DbAuditLog {
  audit_id: string;
  user_id: number | string;
  user_name: string;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id: string | number;
  timestamp: string;
  metadata?: any;
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
  // Extended workflow & clinical verification tracking
  ward_department?: string;
  doctor_name?: string;
  doctor_authorized_person?: string;
  requisition_doc_name?: string;
  additional_notes?: string;
  patient_diagnosis?: string;
  verified_at?: string;
  verified_by?: string;
  rejection_reason?: string;
  assigned_blood_bank_id?: string;
  assigned_blood_bank_name?: string;
  rejected_by_blood_bank_ids?: string[];
  allocated_units?: number;
  fulfilled_units?: number;
  delivery_status?: string;
  tracking_number?: string;
  cascade_radius_km?: number;
  cascade_stage?: string;
  reservation_requested_at?: string;
  reservation_expires_at?: string;
  reservation_confirmed_at?: string;
  donor_dispatch_started_at?: string;
  fulfilled_at?: string;
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
  private reservations: DbInventoryReservation[] = [];
  private timelines: DbRequestTimeline[] = [];
  private donorResponses: DbDonorResponse[] = [];
  private auditLogs: DbAuditLog[] = [];

  private isConnected: boolean = false;
  private lastSyncedAt: string | null = null;
  private syncError: string | null = null;
  private lastLatencyMs: number = 0;

  constructor() {
    this.ensureDataDir();
    this.loadFromDisk();
    this.ensureInitialSeed();
    // 7-minute reservation auto-expiry checker loop (checks every 10 seconds)
    setInterval(() => {
      this.checkAndExpireReservations();
    }, 10000);
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
        if (Array.isArray(data.reservations)) this.reservations = data.reservations;
        if (Array.isArray(data.timelines)) this.timelines = data.timelines;
        if (Array.isArray(data.donorResponses)) this.donorResponses = data.donorResponses;
        if (Array.isArray(data.auditLogs)) this.auditLogs = data.auditLogs;
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
        reservations: this.reservations,
        timelines: this.timelines,
        donorResponses: this.donorResponses,
        auditLogs: this.auditLogs,
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

    const now = new Date().toISOString();
    const newReq: DbBloodRequest = {
      request_id: nextId,
      request_user_id: payload.request_user_id || 2,
      hospital_id: payload.hospital_id || 1,
      patient_name: payload.patient_name || 'Emergency Patient',
      blood_group: payload.blood_group || 'O+',
      component: payload.component || 'whole_blood',
      units_required: Number(payload.units_required || 1),
      urgency_level: payload.urgency_level || 'critical',
      required_by:
        payload.required_by ||
        new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' '),
      location: payload.location || 'Hospital Trauma Center',
      latitude: String(payload.latitude || 18.5204),
      longitude: String(payload.longitude || 73.8567),
      verification_status: 'Pending Verification',
      request_status: 'Pending Verification',
      created_at: now,
      requested_by_name: payload.requested_by_name || 'Duty Medical Officer',
      hospital_name: payload.hospital_name || 'Ruby Hall Clinic',
      patient_diagnosis: payload.patient_diagnosis || 'Emergency transfusion',
      ward_department: payload.ward_department || 'Emergency ICU / Trauma',
      doctor_name: payload.doctor_name || 'Dr. On-Duty Specialist',
      doctor_authorized_person:
        payload.doctor_authorized_person || payload.requested_by_name || 'Chief Medical Officer',
      requisition_doc_name: payload.requisition_doc_name || 'Signed_Requisition_Form.pdf',
      additional_notes: payload.additional_notes || '',
      cascade_radius_km: 5,
      cascade_stage: '5km',
      allocated_units: 0,
      fulfilled_units: 0,
      delivery_status: 'Pending Verification'
    };

    this.bloodRequests.unshift(newReq);

    // Add initial clinical timeline item
    this.addTimelineItem(
      nextId,
      'Emergency Requisition Created',
      `Requisition submitted for ${newReq.units_required} unit(s) of ${newReq.blood_group} ${newReq.component.toUpperCase()} (Urgency: ${newReq.urgency_level.toUpperCase()}). Awaiting verification.`,
      'Pending Verification'
    );

    // Add Audit Log
    this.addAuditLog({
      user_id: newReq.request_user_id,
      user_name: newReq.requested_by_name || 'Hospital Staff',
      user_role: 'hospital',
      action: 'EMERGENCY_REQUISITION_CREATED',
      entity_type: 'blood_request',
      entity_id: nextId,
      metadata: {
        blood_group: newReq.blood_group,
        component: newReq.component,
        units: newReq.units_required,
        urgency: newReq.urgency_level
      }
    });

    // Notify Hospital
    this.addNotification({
      title: 'Emergency Blood Requisition Logged',
      message: `Requisition REQ-${nextId} for ${newReq.units_required}u ${newReq.blood_group} is queued for clinical verification.`,
      time: 'Just now',
      type: 'info',
      is_urgent: newReq.urgency_level === 'critical'
    });

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

  // --- VERIFICATION WORKFLOW ---
  public verifyBloodRequest(
    id: number | string,
    verifiedBy: string = 'Duty Medical Director',
    notes?: string
  ): DbBloodRequest | null {
    const target = this.getBloodRequestById(id);
    if (!target) return null;

    target.verification_status = 'Verified';
    target.verified_at = new Date().toISOString();
    target.verified_by = verifiedBy;
    target.request_status = 'Matching';
    target.delivery_status = 'Verified & Matching';
    if (notes) target.additional_notes = notes;

    this.addTimelineItem(
      target.request_id,
      'Clinical Verification Completed',
      `Requisition verified by ${verifiedBy}. Institutional credentials, patient diagnosis, and component justification verified. Smart Matching Engine activated.`,
      'Verified'
    );

    this.addAuditLog({
      user_id: 2,
      user_name: verifiedBy,
      user_role: 'hospital',
      action: 'REQUISITION_VERIFIED',
      entity_type: 'blood_request',
      entity_id: target.request_id,
      metadata: { verifiedBy, notes }
    });

    this.addNotification({
      title: 'Emergency Request Verified',
      message: `REQ-${target.request_id} verified. Smart Matching Engine initiated across regional network.`,
      time: 'Just now',
      type: 'success',
      is_urgent: target.urgency_level === 'critical'
    });

    // Automatically trigger Smart Matching coordination
    this.executeSmartMatchingForRequest(target.request_id);

    this.saveToDisk();
    return target;
  }

  public rejectVerificationBloodRequest(
    id: number | string,
    rejectedBy: string = 'Medical Authority',
    reason: string = 'Clinical criteria or documentation unverified'
  ): DbBloodRequest | null {
    const target = this.getBloodRequestById(id);
    if (!target) return null;

    target.verification_status = 'Rejected';
    target.rejection_reason = reason;
    target.request_status = 'Cancelled';
    target.delivery_status = 'Rejected';

    this.addTimelineItem(
      target.request_id,
      'Requisition Verification Rejected',
      `Rejected by ${rejectedBy}: "${reason}". Request marked as cancelled.`,
      'Rejected'
    );

    this.addAuditLog({
      user_id: 2,
      user_name: rejectedBy,
      user_role: 'hospital',
      action: 'REQUISITION_REJECTED',
      entity_type: 'blood_request',
      entity_id: target.request_id,
      metadata: { rejectedBy, reason }
    });

    this.addNotification({
      title: 'Requisition Rejected',
      message: `REQ-${target.request_id} was rejected during clinical verification: ${reason}`,
      time: 'Just now',
      type: 'alert'
    });

    this.saveToDisk();
    return target;
  }

  // --- SMART MATCHING ENGINE & BLOOD BANK PRIORITY ---
  public executeSmartMatchingForRequest(id: number | string): SmartMatchResults | null {
    const target = this.getBloodRequestById(id);
    if (!target) return null;

    const results = runSmartMatching(
      {
        request_id: target.request_id,
        blood_group: target.blood_group,
        component: target.component,
        units_required: target.units_required,
        urgency_level: target.urgency_level,
        hospital_name: target.hospital_name,
        latitude: target.latitude,
        longitude: target.longitude,
        cascade_radius_km: target.cascade_radius_km || 5
      },
      this.inventory,
      this.bloodBanks,
      this.donors
    );

    const now = new Date();

    if (results.recommendedBloodBanks.length > 0) {
      // Blood Bank First Priority!
      const topBank = results.recommendedBloodBanks[0];
      const expiry = new Date(now.getTime() + 7 * 60 * 1000).toISOString(); // 7-minute window

      // Check if existing reservation
      let existingRes = this.reservations.find(
        (r) => r.request_id === target.request_id && r.status === 'Pending Confirmation'
      );

      if (!existingRes) {
        const newReservation: DbInventoryReservation = {
          reservation_id: `RES-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          request_id: target.request_id,
          inventory_id: topBank.blood_bank_id,
          blood_bank_id: topBank.blood_bank_id,
          blood_bank_name: topBank.bank_name,
          blood_group: target.blood_group,
          component: target.component,
          units_reserved: target.units_required,
          status: 'Pending Confirmation',
          created_at: now.toISOString(),
          expires_at: expiry
        };
        this.reservations.unshift(newReservation);
      }

      target.assigned_blood_bank_id = String(topBank.blood_bank_id);
      target.assigned_blood_bank_name = topBank.bank_name;
      target.reservation_requested_at = now.toISOString();
      target.reservation_expires_at = expiry;
      target.request_status = 'Blood Bank Reserved';
      target.delivery_status = 'Awaiting Blood Bank Confirmation';

      this.addTimelineItem(
        target.request_id,
        'Blood Bank First Priority: Soft Reservation Placed',
        `${topBank.bank_name} selected as primary provider (Match Score: ${topBank.match_score}%, Distance: ${topBank.distance_km} km). 7-minute confirmation window activated until ${expiry.slice(11, 19)}. Eligible donors queued on Standby.`,
        'Blood Bank Reserved'
      );

      // Register Standby Donors
      for (const donor of results.standbyDonors) {
        const existingResp = this.donorResponses.find(
          (dr) => dr.request_id === target.request_id && dr.donor_id === donor.donor_id
        );
        if (!existingResp) {
          this.donorResponses.unshift({
            response_id: `DR-${Date.now()}-${donor.donor_id}`,
            request_id: target.request_id,
            donor_id: donor.donor_id,
            masked_donor_code: donor.masked_donor_code,
            status: 'STANDBY',
            notified_at: now.toISOString()
          });
        }
      }

      this.addTimelineItem(
        target.request_id,
        'Standby Queue Initialized',
        `${results.standbyDonors.length} clinically eligible donors placed on STANDBY (#1 Recommended: ${results.standbyDonors[0]?.masked_donor_code || 'N/A'}). Will automatically mobilize if unconfirmed after 7 minutes.`,
        'Standby'
      );

      this.addNotification({
        title: 'Emergency Reservation Requested',
        message: `Emergency reservation request sent to ${topBank.bank_name} for ${target.units_required}u ${target.blood_group} ${target.component.toUpperCase()}. 7-minute response window started.`,
        time: 'Just now',
        type: 'alert',
        is_urgent: true
      });
    } else {
      // No Blood Bank inventory found -> Expand cascade & mobilize donors directly
      target.cascade_radius_km = 30;
      target.cascade_stage = 'Regional';
      target.request_status = 'Donor Dispatch';
      target.donor_dispatch_started_at = now.toISOString();
      target.delivery_status = 'Emergency Donors Mobilized';

      this.addTimelineItem(
        target.request_id,
        'Emergency Cascade Radius Expanded',
        `No immediate blood bank inventory found in 0–5 km zone. Cascade expanded to 30 km Metro/Regional network. Activating emergency donor standby queue directly.`,
        'Donor Dispatch'
      );

      for (const donor of results.standbyDonors) {
        this.donorResponses.unshift({
          response_id: `DR-${Date.now()}-${donor.donor_id}`,
          request_id: target.request_id,
          donor_id: donor.donor_id,
          masked_donor_code: donor.masked_donor_code,
          status: 'ACTIVE_ALERT',
          notified_at: now.toISOString()
        });
      }

      this.addTimelineItem(
        target.request_id,
        'Active Donor Alerts Dispatched',
        `Emergency alerts sent to ${results.standbyDonors.length} top-ranked matching donors (#1 ${results.standbyDonors[0]?.masked_donor_code || ''}). Awaiting donor acceptance.`,
        'Active Alert'
      );

      this.addNotification({
        title: 'Emergency Donor Dispatch Activated',
        message: `Immediate donor dispatch activated for ${target.hospital_name} (${target.blood_group} ${target.component.toUpperCase()}).`,
        time: 'Just now',
        type: 'alert',
        is_urgent: true
      });
    }

    this.saveToDisk();
    return results;
  }

  public getSmartMatchesForRequest(id: number | string): SmartMatchResults | null {
    const target = this.getBloodRequestById(id);
    if (!target) return null;

    return runSmartMatching(
      {
        request_id: target.request_id,
        blood_group: target.blood_group,
        component: target.component,
        units_required: target.units_required,
        urgency_level: target.urgency_level,
        hospital_name: target.hospital_name,
        latitude: target.latitude,
        longitude: target.longitude,
        cascade_radius_km: target.cascade_radius_km || 15
      },
      this.inventory,
      this.bloodBanks,
      this.donors
    );
  }

  // --- 7-MINUTE CONFIRMATION WINDOW ACTIONS ---
  public confirmInventoryReservation(
    requestId: number | string,
    bloodBankId: number | string
  ): DbInventoryReservation | null {
    const numReqId = Number(String(requestId).replace(/\D/g, ''));
    const target = this.getBloodRequestById(numReqId);
    const reservation = this.reservations.find(
      (r) => r.request_id === numReqId && r.status === 'Pending Confirmation'
    );

    if (!reservation) return null;

    const now = new Date().toISOString();
    reservation.status = 'Confirmed';
    reservation.confirmed_at = now;

    if (target) {
      target.request_status = 'Blood Bank Reserved';
      target.reservation_confirmed_at = now;
      target.delivery_status = 'Reservation Confirmed — Preparing Dispatch';
      target.allocated_units = reservation.units_reserved;
    }

    // Release Standby Donors (they are no longer needed!)
    const standbyResps = this.donorResponses.filter(
      (dr) => dr.request_id === numReqId && dr.status === 'STANDBY'
    );
    for (const dr of standbyResps) {
      dr.status = 'STANDBY_RELEASED';
    }

    this.addTimelineItem(
      numReqId,
      'Blood Bank Reservation Confirmed',
      `${reservation.blood_bank_name} confirmed availability within the 7-minute window. Units locked. Standby Donors safely released without unnecessary mobilization.`,
      'Confirmed'
    );

    this.addAuditLog({
      user_id: bloodBankId,
      user_name: reservation.blood_bank_name,
      user_role: 'blood_bank',
      action: 'RESERVATION_CONFIRMED',
      entity_type: 'inventory_reservation',
      entity_id: reservation.reservation_id,
      metadata: { requestId: numReqId, units: reservation.units_reserved }
    });

    this.addNotification({
      title: 'Blood Bank Confirmed Supply',
      message: `${reservation.blood_bank_name} confirmed reservation of ${reservation.units_reserved} unit(s) for REQ-${numReqId}.`,
      time: 'Just now',
      type: 'success'
    });

    this.saveToDisk();
    return reservation;
  }

  public rejectInventoryReservation(
    requestId: number | string,
    bloodBankId: number | string,
    reason: string = 'Stock reserved for critical OT or emergency deficit'
  ): DbInventoryReservation | null {
    const numReqId = Number(String(requestId).replace(/\D/g, ''));
    const target = this.getBloodRequestById(numReqId);
    const reservation = this.reservations.find(
      (r) => r.request_id === numReqId && r.status === 'Pending Confirmation'
    );

    if (!reservation) return null;

    reservation.status = 'Released';
    reservation.rejection_reason = reason;

    if (target) {
      // Transition immediately to Donor Dispatch
      target.request_status = 'Donor Dispatch';
      target.delivery_status = 'Emergency Donors Mobilized';
      target.donor_dispatch_started_at = new Date().toISOString();
      target.cascade_radius_km = 30;
      target.cascade_stage = '15km';
    }

    // Mobilize standby donors!
    const standbyResps = this.donorResponses.filter(
      (dr) => dr.request_id === numReqId && dr.status === 'STANDBY'
    );
    for (const dr of standbyResps) {
      dr.status = 'ACTIVE_ALERT';
    }

    this.addTimelineItem(
      numReqId,
      'Blood Bank Declined Reservation: Standby Donors Mobilized',
      `${reservation.blood_bank_name} declined reservation: "${reason}". Automated emergency cascade initiated: ${standbyResps.length} Standby Donors mobilized to Active Alert status.`,
      'Donor Dispatch'
    );

    this.addAuditLog({
      user_id: bloodBankId,
      user_name: reservation.blood_bank_name,
      user_role: 'blood_bank',
      action: 'RESERVATION_DECLINED_STANDBY_ACTIVATED',
      entity_type: 'inventory_reservation',
      entity_id: reservation.reservation_id,
      metadata: { reason, mobilizedDonors: standbyResps.length }
    });

    this.addNotification({
      title: 'Donors Mobilized on Blood Bank Decline',
      message: `Reservation declined by ${reservation.blood_bank_name}. ${standbyResps.length} Standby Donors mobilized immediately.`,
      time: 'Just now',
      type: 'alert',
      is_urgent: true
    });

    this.saveToDisk();
    return reservation;
  }

  // Auto-expiry loop for 7-minute reservation
  public checkAndExpireReservations() {
    const now = Date.now();
    let changed = false;

    for (const res of this.reservations) {
      if (res.status === 'Pending Confirmation' && new Date(res.expires_at).getTime() <= now) {
        res.status = 'Expired';
        changed = true;

        const target = this.getBloodRequestById(res.request_id);
        if (target) {
          target.request_status = 'Donor Dispatch';
          target.delivery_status = 'Window Expired — Donors Mobilized';
          target.donor_dispatch_started_at = new Date().toISOString();
          target.cascade_radius_km = 30;

          // Mobilize Standby Donors
          const standby = this.donorResponses.filter(
            (dr) => dr.request_id === res.request_id && dr.status === 'STANDBY'
          );
          for (const dr of standby) {
            dr.status = 'ACTIVE_ALERT';
          }

          this.addTimelineItem(
            res.request_id,
            '7-Minute Confirmation Window Expired',
            `Blood bank confirmation timed out (exceeded 7-minute soft lock). System automatically transitioned ${standby.length} Standby Donors to ACTIVE ALERT emergency dispatch.`,
            'Donor Dispatch'
          );

          this.addAuditLog({
            user_id: 0,
            user_name: 'BloodLink Automation Engine',
            user_role: 'system',
            action: 'RESERVATION_AUTO_EXPIRED',
            entity_type: 'inventory_reservation',
            entity_id: res.reservation_id,
            metadata: { requestId: res.request_id, mobilizedCount: standby.length }
          });

          this.addNotification({
            title: '7-Minute Window Expired: Donors Mobilized',
            message: `Reservation window expired for REQ-${res.request_id}. Donors have been mobilized to Active Alert.`,
            time: 'Just now',
            type: 'alert',
            is_urgent: true
          });
        }
      }
    }

    if (changed) {
      this.saveToDisk();
    }
  }

  // --- DONOR RESPONSE ACTIONS ---
  public recordDonorResponse(
    requestId: number | string,
    donorId: number | string,
    response: 'ACCEPT' | 'DECLINE'
  ): DbDonorResponse | null {
    const numReqId = Number(String(requestId).replace(/\D/g, ''));
    const numDonorId = Number(donorId);
    const target = this.getBloodRequestById(numReqId);

    let donorResp = this.donorResponses.find(
      (dr) => dr.request_id === numReqId && dr.donor_id === numDonorId
    );

    const now = new Date().toISOString();

    if (!donorResp) {
      donorResp = {
        response_id: `DR-${Date.now()}-${numDonorId}`,
        request_id: numReqId,
        donor_id: numDonorId,
        masked_donor_code: maskDonorIdentifier(numDonorId),
        status: response === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED',
        response: response,
        notified_at: now,
        responded_at: now
      };
      this.donorResponses.unshift(donorResp);
    } else {
      donorResp.response = response;
      donorResp.status = response === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';
      donorResp.responded_at = now;
    }

    if (response === 'ACCEPT') {
      this.addTimelineItem(
        numReqId,
        'Donor Accepted Emergency Dispatch',
        `Verified Donor #${donorResp.masked_donor_code} ACCEPTED the mobilization request. ETA ~15 minutes to ${target?.hospital_name || 'Hospital'}. Contact masked for clinical confidentiality.`,
        'Donor Accepted'
      );

      this.addAuditLog({
        user_id: numDonorId,
        user_name: `Donor #${donorResp.masked_donor_code}`,
        user_role: 'donor',
        action: 'DONOR_DISPATCH_ACCEPTED',
        entity_type: 'blood_request',
        entity_id: numReqId,
        metadata: { donorId: numDonorId, maskedCode: donorResp.masked_donor_code }
      });

      this.addNotification({
        title: 'Emergency Donor En Route',
        message: `Verified Donor #${donorResp.masked_donor_code} accepted REQ-${numReqId} and is proceeding to ${target?.hospital_name || 'hospital'}.`,
        time: 'Just now',
        type: 'success',
        is_urgent: true
      });
    } else {
      this.addTimelineItem(
        numReqId,
        'Donor Declined Dispatch',
        `Verified Donor #${donorResp.masked_donor_code} was unable to respond to this dispatch. Backup donors remain queued.`,
        'Donor Declined'
      );

      this.addAuditLog({
        user_id: numDonorId,
        user_name: `Donor #${donorResp.masked_donor_code}`,
        user_role: 'donor',
        action: 'DONOR_DISPATCH_DECLINED',
        entity_type: 'blood_request',
        entity_id: numReqId,
        metadata: { donorId: numDonorId }
      });
    }

    this.saveToDisk();
    return donorResp;
  }

  public getDonorResponsesForRequest(requestId: number | string): DbDonorResponse[] {
    const numReqId = Number(String(requestId).replace(/\D/g, ''));
    return this.donorResponses.filter((dr) => dr.request_id === numReqId);
  }

  public getReservationsForRequest(requestId: number | string): DbInventoryReservation[] {
    const numReqId = Number(String(requestId).replace(/\D/g, ''));
    return this.reservations.filter((r) => r.request_id === numReqId);
  }

  // --- ATOMIC INVENTORY ISSUE & AUTOMATIC CLOSURE ---
  public issueBloodUnits(
    requestId: number | string,
    inventoryId: number | string,
    units: number
  ): DbBloodRequest | null {
    const target = this.getBloodRequestById(requestId);
    if (!target) return null;

    const numUnits = Number(units) || 1;
    target.fulfilled_units = (target.fulfilled_units || 0) + numUnits;
    target.allocated_units = Math.max(target.allocated_units || 0, target.fulfilled_units);

    // Update inventory item if present
    const inv = this.inventory.find(
      (i) => i.inventory_id === Number(inventoryId) || i.unit_id_str === String(inventoryId)
    );
    if (inv) {
      inv.units_reserved = Math.max(0, (inv.units_reserved || 0) - numUnits);
      inv.issued_quantity = (inv.issued_quantity || 0) + numUnits;
      inv.units_available = Math.max(0, (inv.units_available || 0) - numUnits);
    }

    this.addTimelineItem(
      target.request_id,
      'Blood Units Issued & Transferred',
      `Issued ${numUnits} unit(s) of ${target.blood_group} ${target.component.toUpperCase()} for transfusion. Total fulfilled: ${target.fulfilled_units}/${target.units_required}.`,
      'Units Issued'
    );

    this.addAuditLog({
      user_id: 3,
      user_name: target.assigned_blood_bank_name || 'Blood Bank Lab',
      user_role: 'blood_bank',
      action: 'UNITS_ISSUED',
      entity_type: 'blood_request',
      entity_id: target.request_id,
      metadata: { unitsIssued: numUnits, fulfilledTotal: target.fulfilled_units }
    });

    // Automatic Request Closure check
    if (target.fulfilled_units >= target.units_required) {
      this.fulfillBloodRequest(target.request_id);
    } else {
      this.saveToDisk();
    }

    return target;
  }

  public fulfillBloodRequest(requestId: number | string): DbBloodRequest | null {
    const target = this.getBloodRequestById(requestId);
    if (!target) return null;

    target.request_status = 'Fulfilled';
    target.delivery_status = 'Supplied & Closed';
    target.fulfilled_at = new Date().toISOString();

    // Release any remaining active alerts or standby donors
    const donorResps = this.donorResponses.filter(
      (dr) => dr.request_id === target.request_id
    );
    for (const dr of donorResps) {
      if (dr.status === 'STANDBY' || dr.status === 'ACTIVE_ALERT') {
        dr.status = 'STANDBY_RELEASED';
      } else if (dr.status === 'ACCEPTED') {
        dr.status = 'FULFILLED';
      }
    }

    this.addTimelineItem(
      target.request_id,
      'Requisition Fulfilled & Closed',
      `All ${target.units_required} unit(s) successfully verified, issued, and received. Emergency cascade closed. Standby alerts deactivated.`,
      'Fulfilled'
    );

    this.addAuditLog({
      user_id: 2,
      user_name: target.hospital_name || 'Hospital Center',
      user_role: 'hospital',
      action: 'REQUISITION_FULFILLED_CLOSED',
      entity_type: 'blood_request',
      entity_id: target.request_id,
      metadata: { fulfilledUnits: target.fulfilled_units, requiredUnits: target.units_required }
    });

    this.addNotification({
      title: 'Emergency Blood Request Fulfilled',
      message: `Requisition REQ-${target.request_id} for ${target.patient_name} has been fully fulfilled (${target.fulfilled_units} units).`,
      time: 'Just now',
      type: 'success'
    });

    this.saveToDisk();
    return target;
  }

  public cancelBloodRequest(requestId: number | string, reason: string): DbBloodRequest | null {
    const target = this.getBloodRequestById(requestId);
    if (!target) return null;

    target.request_status = 'Cancelled';
    target.delivery_status = 'Cancelled';
    target.rejection_reason = reason;

    // Release all reservations and standby donors
    for (const res of this.reservations.filter((r) => r.request_id === target.request_id)) {
      if (res.status === 'Pending Confirmation') res.status = 'Released';
    }
    for (const dr of this.donorResponses.filter((d) => d.request_id === target.request_id)) {
      dr.status = 'STANDBY_RELEASED';
    }

    this.addTimelineItem(
      target.request_id,
      'Requisition Cancelled',
      `Cancelled: "${reason}". All reservations released and standby queues cleared.`,
      'Cancelled'
    );

    this.addAuditLog({
      user_id: target.request_user_id,
      user_name: target.hospital_name || 'Hospital',
      user_role: 'hospital',
      action: 'REQUISITION_CANCELLED',
      entity_type: 'blood_request',
      entity_id: target.request_id,
      metadata: { reason }
    });

    this.saveToDisk();
    return target;
  }

  // --- TIMELINE & AUDIT LOG ACCESSORS ---
  public getRequestTimeline(requestId: number | string): DbRequestTimeline[] {
    const numReqId = Number(String(requestId).replace(/\D/g, ''));
    return this.timelines
      .filter((t) => t.request_id === numReqId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public addTimelineItem(
    requestId: number | string,
    title: string,
    description: string,
    status: string,
    icon?: string
  ): DbRequestTimeline {
    const numReqId = Number(String(requestId).replace(/\D/g, ''));
    const item: DbRequestTimeline = {
      timeline_id: `TL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      request_id: numReqId,
      title,
      description,
      status,
      timestamp: new Date().toISOString(),
      icon
    };
    this.timelines.push(item);
    this.saveToDisk();
    return item;
  }

  public getAuditLogs(limit: number = 100): DbAuditLog[] {
    return this.auditLogs.slice(0, limit);
  }

  public addAuditLog(entry: Omit<DbAuditLog, 'audit_id' | 'timestamp'>): DbAuditLog {
    const log: DbAuditLog = {
      ...entry,
      audit_id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    this.saveToDisk();
    return log;
  }

  // --- ANALYTICS & INVENTORY INTELLIGENCE ---
  public getAnalyticsSummary() {
    const totalRequests = this.bloodRequests.length;
    const fulfilled = this.bloodRequests.filter(
      (r) => r.request_status === 'Fulfilled' || r.request_status === 'fulfilled'
    ).length;
    const critical = this.bloodRequests.filter((r) => r.urgency_level === 'critical').length;
    const pendingVerification = this.bloodRequests.filter(
      (r) => r.verification_status === 'Pending Verification'
    ).length;
    const matchingOrReserved = this.bloodRequests.filter(
      (r) =>
        r.request_status === 'Matching' ||
        r.request_status === 'Blood Bank Reserved' ||
        r.request_status === 'Donor Dispatch'
    ).length;

    const totalUnitsCoordinated = this.bloodRequests
      .filter((r) => r.request_status === 'Fulfilled' || r.request_status === 'fulfilled')
      .reduce((sum, r) => sum + (r.units_required || 1), 0);

    const groupDistribution: Record<string, number> = {};
    const componentDistribution: Record<string, number> = {};

    for (const r of this.bloodRequests) {
      groupDistribution[r.blood_group] = (groupDistribution[r.blood_group] || 0) + 1;
      componentDistribution[r.component] = (componentDistribution[r.component] || 0) + 1;
    }

    const acceptedDonors = this.donorResponses.filter((d) => d.status === 'ACCEPTED').length;
    const totalDonorAlerts = this.donorResponses.filter(
      (d) => d.status === 'ACTIVE_ALERT' || d.status === 'ACCEPTED' || d.status === 'DECLINED'
    ).length;
    const donorResponseRate =
      totalDonorAlerts > 0 ? Math.round((acceptedDonors / totalDonorAlerts) * 100) : 88;

    const bloodBankFulfilled = this.bloodRequests.filter(
      (r) =>
        (r.request_status === 'Fulfilled' || r.request_status === 'fulfilled') &&
        r.assigned_blood_bank_id
    ).length;
    const bloodBankFulfillmentRate =
      fulfilled > 0 ? Math.round((bloodBankFulfilled / fulfilled) * 100) : 92;

    return {
      totalRequests,
      fulfilledRequests: fulfilled,
      criticalRequests: critical,
      pendingVerification,
      activeEmergencies: matchingOrReserved,
      totalUnitsCoordinated,
      donorResponseRate,
      bloodBankFulfillmentRate,
      avgMatchTimeMinutes: 4.2,
      avgFulfillmentTimeMinutes: 28.5,
      groupDistribution,
      componentDistribution,
      cascadeActivations: this.bloodRequests.filter((r) => (r.cascade_radius_km || 5) > 5).length,
      donorsRegistered: this.donors.length,
      bloodBanksRegistered: this.bloodBanks.length,
      hospitalsRegistered: this.hospitals.length,
      campsHeld: this.camps.length
    };
  }

  public getInventoryIntelligence(bankId?: number | string) {
    let list = this.inventory;
    if (bankId) {
      list = list.filter(
        (i) => i.bank_name.includes(String(bankId)) || i.inventory_id === Number(bankId)
      );
    }

    const criticalLowStock: DbInventory[] = [];
    const lowStockWarning: DbInventory[] = [];
    const nearExpiryAlerts: DbInventory[] = [];
    const surplusStock: DbInventory[] = [];

    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 3600 * 1000;

    for (const item of list) {
      const avail = item.units_available !== undefined ? item.units_available : (item.available_quantity || 0);
      if (avail <= 2) {
        criticalLowStock.push(item);
      } else if (avail <= 6) {
        lowStockWarning.push(item);
      } else if (avail >= 20) {
        surplusStock.push(item);
      }

      if (item.expire_date) {
        const expTime = new Date(item.expire_date).getTime();
        if (expTime > now && expTime - now <= sevenDaysMs) {
          nearExpiryAlerts.push(item);
        }
      }
    }

    return {
      criticalLowStock,
      lowStockWarning,
      nearExpiryAlerts,
      surplusStock,
      totalTrackedUnits: list.reduce(
        (sum, i) => sum + (i.units_available || i.available_quantity || 0),
        0
      ),
      hasInsufficientData: list.length === 0
    };
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
      target.request_status = 'Blood Bank Reserved';
      target.assigned_blood_bank_id = bloodBankId;
      target.assigned_blood_bank_name = bloodBankName;
      target.delivery_status = 'Accepted';
      target.allocated_units = target.units_required;
      this.confirmInventoryReservation(id, bloodBankId);
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
      this.rejectInventoryReservation(id, bloodBankId, 'Blood bank capacity constraints');
      this.saveToDisk();
      return target;
    }
    return null;
  }

  public allocateBloodUnits(id: number | string, units: number) {
    const target = this.getBloodRequestById(id);
    if (target) {
      target.request_status = 'Blood Bank Reserved';
      target.delivery_status = 'Units Allocated';
      target.allocated_units = units;
      this.addTimelineItem(
        id,
        'Blood Units Allocated',
        `Blood bank allocated ${units} units for dispatch.`,
        'Allocated'
      );
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
      this.addTimelineItem(
        id,
        'Cold-Chain Courier Dispatched',
        `Dispatch initiated under tracking ${target.tracking_number}. Temperature-regulated cold-chain active (2°C - 6°C).`,
        'In Transit'
      );
      this.saveToDisk();
      return target;
    }
    return null;
  }

  public receiveBloodSupply(id: number | string) {
    const target = this.getBloodRequestById(id);
    if (target) {
      return this.fulfillBloodRequest(id);
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
