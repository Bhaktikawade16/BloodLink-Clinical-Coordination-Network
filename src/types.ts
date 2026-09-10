export type PortalRoute =
  | 'landing'
  | 'portal-selection'
  | 'donor-portal'
  | 'hospital-portal'
  | 'blood-bank-portal'
  | 'blood-camp-portal'
  | 'admin-portal';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type BloodComponent =
  | 'Packed Red Blood Cells (PRBC)'
  | 'Whole Blood'
  | 'Platelets (RDP/SDP)'
  | 'Fresh Frozen Plasma (FFP)'
  | 'Cryoprecipitate';

export type UrgencyLevel = 'CRITICAL' | 'URGENT' | 'ROUTINE';

export type RequisitionStatus =
  | 'Submitted'
  | 'Matching'
  | 'Confirmed'
  | 'Reserved'
  | 'Approved'
  | 'Dispatched'
  | 'Received';

export type DeliverySupplyStatus =
  | 'Awaiting Acceptance'
  | 'Accepted'
  | 'Units Allocated'
  | 'In Transit'
  | 'Supplied'
  | 'Withdrawn';

export interface BloodUnit {
  id: string;
  bloodGroup: BloodGroup;
  component: string;
  volume: number;
  collectionDate: string;
  expiryDate: string;
  status: 'Available' | 'Reserved' | 'Expired';
}

export interface EmergencyRequisition {
  id: string;
  hospitalName: string;
  bloodGroup: BloodGroup;
  component: string;
  units: number;
  urgency: UrgencyLevel;
  timestamp: string;
  status: RequisitionStatus;
  patientId?: string;
  location?: string;
  assignedBloodBankId?: string;
  assignedBloodBankName?: string;
  rejectedByBloodBankIds?: string[];
  allocatedUnits?: number;
  deliveryStatus?: DeliverySupplyStatus;
  trackingNumber?: string;
  patientDiagnosis?: string;
}

export interface BloodCamp {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  address: string;
  city: string;
  contact: string;
  registrationLimit: number;
  registeredCount: number;
  description: string;
  status: 'Active Booking' | 'Scheduled Drive' | 'Completed';
  distance?: string;
  partnerBloodBank?: string;
  image?: string;
  gallery?: string[];
  perks?: string[];
  highlights?: string[];
  specialBadge?: string;
}

export interface DonorHistoryItem {
  id: string;
  date: string;
  location: string;
  component: string;
  volumeMl: number;
  certificateId: string;
}

export interface RegisteredDonor {
  id: string;
  donor_id?: number | string;
  user_id?: number | string;
  fullName: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  bloodGroup: BloodGroup;
  blood_group?: BloodGroup;
  city: string;
  area: string;
  state?: string;
  date_of_birth?: string;
  weight_kg?: number;
  lastDonationDate: string;
  last_donation_date?: string | null;
  eligibility_status?: EligibilityStatus;
  eligibilityStatus?: EligibilityStatus;
  verification_status?: VerificationStatus;
  verificationStatus?: VerificationStatus;
  donationCount: number;
  totalDonations?: number;
  isAvailable: boolean;
  availableForEmergency?: boolean;
  history?: DonorHistoryItem[];
}

export type UserRole = 'donor' | 'hospital' | 'blood_bank' | 'blood_camp' | 'admin';

export type VerificationStatus = 'Pending' | 'Verified' | 'Rejected';

export type EligibilityStatus = 'Eligible' | 'Not Eligible' | 'Pending Verification';

/**
 * 1. USERS TABLE
 * Common authentication table for all portal users.
 */
export interface UserRecord {
  user_id: string | number;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: 'donor' | 'hospital' | 'blood_bank' | 'blood_camp';
  city: string;
  latitude?: number | string;
  longitude?: number | string;
  created_at: string;
}

/**
 * 2. DONORS TABLE
 * Extended profile for donors.
 */
export interface DonorRecord {
  donor_id: string | number;
  user_id: string | number;
  blood_group: BloodGroup;
  date_of_birth: string;
  gender: string;
  last_donation_date: string | null;
  eligibility_status: EligibilityStatus;
  verification_status: VerificationStatus;
  weight_kg: number;
}

/**
 * 3. HOSPITALS TABLE
 */
export interface HospitalRecord {
  hospital_id: string | number;
  user_id: string | number;
  hospital_name: string;
  registration_number: string;
  address: string;
  verification_status: VerificationStatus;
}

/**
 * 4. BLOOD BANKS TABLE
 */
export interface BloodBankRecord {
  blood_bank_id: string | number;
  user_id: string | number;
  bank_name: string;
  license_number: string;
  address: string;
  verification_status: VerificationStatus;
}

/**
 * 5. BLOOD CAMPS TABLE
 */
export interface BloodCampRecord {
  camp_id: string | number;
  user_id: string | number;
  camp_name: string;
  organizer_name: string;
  registration_number: string;
  address: string;
  city: string;
  camp_date: string;
  verification_status: VerificationStatus;
  created_at: string;
}

/**
 * Unified Session State for Logged-In User
 */
export interface AuthSessionUser {
  user_id: string | number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  city: string;
  verification_status: VerificationStatus;
  eligibility_status?: EligibilityStatus;
  token?: string;
  profile?: any;
}


export interface VerifiedBloodBank {
  id: string;
  name: string;
  accreditation: string;
  distance: string;
  availableUnits: number;
  status: 'Primary Match' | 'Standby' | 'Backup Reserve';
  tier: string;
  contact: string;
}

export interface HospitalAccount {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  licenceNumber: string;
  licenceDocumentName?: string;
  status: 'Verification Pending' | 'Verified' | 'Rejected';
  createdAt: string;
  verifiedAt?: string;
}

export interface BloodBankAccount {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  licenceNumber: string;
  licenceDocumentName?: string;
  status: 'Verification Pending' | 'Verified' | 'Rejected';
  createdAt: string;
  verifiedAt?: string;
}

export interface CampOrganizerAccount {
  id: string;
  organizationName: string;
  organizerName: string;
  email: string;
  phone: string;
  contact: string;
  taxOrRegId?: string;
  status?: 'Verification Pending' | 'Verified' | 'Rejected';
  createdAt: string;
}

export interface CampAttendeeRegistration {
  id: string;
  campId: string;
  campName: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  donorBloodGroup: BloodGroup;
  slotTime: string;
  registeredAt: string;
  tshirtSize?: string;
  snackPreference?: string;
  voucherCode?: string;
}

export interface ClinicalNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  isUrgent?: boolean;
  type?: 'alert' | 'info' | 'success';
}

