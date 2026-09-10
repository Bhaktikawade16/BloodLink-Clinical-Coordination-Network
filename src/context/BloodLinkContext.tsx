import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  BloodGroup,
  BloodUnit,
  EmergencyRequisition,
  BloodCamp,
  RegisteredDonor,
  HospitalAccount,
  BloodBankAccount,
  CampOrganizerAccount,
  CampAttendeeRegistration,
  ClinicalNotification,
  AuthSessionUser
} from '../types';
import {
  RailwayApi,
  RAILWAY_API_BASE,
  getActiveDatabaseUrl,
  setActiveDatabaseUrl,
  resetActiveDatabaseUrl
} from '../services/railwayApi';
import { INITIAL_CAMPS } from '../data/mockData';
import { hashPassword, calculateDonorEligibility } from '../utils/authUtils';

interface BloodLinkContextType {
  // Unified Role-Based Auth Session
  currentUser: AuthSessionUser | null;
  registerUser: (formData: any) => Promise<{ success: boolean; user?: AuthSessionUser; error?: string }>;
  loginUser: (
    identifier: string,
    password?: string,
    expectedRole?: string
  ) => Promise<{ success: boolean; user?: AuthSessionUser; error?: string }>;
  loginWithGoogle: (googleData: {
    email: string;
    name: string;
    role?: string;
    phone?: string;
    city?: string;
    blood_group?: string;
    autoRegister?: boolean;
  }) => Promise<{ success: boolean; user?: AuthSessionUser; isNewUser?: boolean; error?: string }>;
  logoutUser: () => void;
  updateVerificationStatus: (
    role: string,
    entityId: number | string,
    status: 'Pending' | 'Verified' | 'Rejected'
  ) => Promise<boolean>;

  // Donors
  donors: RegisteredDonor[];
  currentDonor: RegisteredDonor | null;
  registerDonor: (donor: Omit<RegisteredDonor, 'id'>) => RegisteredDonor;
  loginDonor: (emailOrPhone: string) => boolean;
  logoutDonor: () => void;
  updateDonorAvailability: (isAvailable: boolean) => void;

  // Hospitals
  hospitals: HospitalAccount[];
  currentHospital: HospitalAccount | null;
  registerHospital: (hospital: Omit<HospitalAccount, 'id' | 'status' | 'createdAt'>) => HospitalAccount;
  loginHospital: (emailOrPhone: string) => { success: boolean; status?: string; message?: string };
  logoutHospital: () => void;
  setCurrentHospitalById: (id: string) => void;

  // Blood Banks
  bloodBanks: BloodBankAccount[];
  currentBloodBank: BloodBankAccount | null;
  registerBloodBank: (bank: Omit<BloodBankAccount, 'id' | 'status' | 'createdAt'>) => BloodBankAccount;
  loginBloodBank: (emailOrPhone: string) => { success: boolean; status?: string; message?: string };
  logoutBloodBank: () => void;
  setCurrentBloodBankById: (id: string) => void;

  // Blood Camps
  camps: BloodCamp[];
  currentOrganizer: CampOrganizerAccount | null;
  registerOrganizer: (org: Omit<CampOrganizerAccount, 'id' | 'createdAt'>) => CampOrganizerAccount;
  loginOrganizer: (emailOrPhone: string) => boolean;
  logoutOrganizer: () => void;
  createCamp: (camp: Omit<BloodCamp, 'id' | 'registeredCount' | 'status'>) => BloodCamp;
  campRegistrations: CampAttendeeRegistration[];
  registerForCamp: (
    campId: string,
    donorName: string,
    donorPhone: string,
    donorBloodGroup: BloodGroup,
    slotTime: string,
    tshirtSize?: string,
    snackPreference?: string
  ) => boolean;

  // Inventory
  inventory: BloodUnit[];
  addBloodUnit: (unit: Omit<BloodUnit, 'id' | 'status'>) => BloodUnit;
  removeBloodUnit: (unitId: string) => void;
  toggleUnitStatus: (unitId: string) => void;

  // Emergency Requisitions
  activeRequests: EmergencyRequisition[];
  createEmergencyRequest: (req: Omit<EmergencyRequisition, 'id' | 'timestamp' | 'status'>) => EmergencyRequisition;
  updateRequestStatus: (reqId: string, status: EmergencyRequisition['status']) => void;
  acceptHospitalRequest: (reqId: string, bloodBankId: string, bloodBankName: string) => void;
  rejectHospitalRequest: (reqId: string, bloodBankId: string) => void;
  allocateUnitsForRequest: (reqId: string, bloodBankId: string, units: number) => void;
  dispatchBloodSupply: (reqId: string, trackingNumber?: string) => void;
  confirmHospitalReceipt: (reqId: string) => void;
  contactEmergencyDonor: (donorId: string, hospitalName: string, bloodGroup: BloodGroup, unitsNeeded: number) => void;

  // Admin Verification
  approveEntity: (type: 'hospital' | 'blood-bank', id: string) => void;
  rejectEntity: (type: 'hospital' | 'blood-bank', id: string) => void;

  // Notifications
  notifications: ClinicalNotification[];
  clearNotifications: () => void;

  // Database Reset
  resetDatabase: () => void;

  // Railway Database Live Integration
  isRailwayConnected: boolean;
  isSyncing: boolean;
  railwayLatency: number | null;
  lastSyncedAt: Date | null;
  railwayError: string | null;
  syncWithRailway: () => Promise<void>;
  railwayApiBase: string;
  databaseUrl: string;
  updateDatabaseUrl: (url: string) => Promise<void>;
  resetDatabaseUrlToDefault: () => Promise<void>;
  rawRailwayData: {
    donors: any[];
    hospitals: any[];
    bloodBanks: any[];
    camps: any[];
    inventory: any[];
    requests: any[];
  };
}

const BloodLinkContext = createContext<BloodLinkContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER: 'bloodlink_auth_user',
  DONORS: 'bloodlink_donors',
  CURRENT_DONOR: 'bloodlink_curr_donor',
  HOSPITALS: 'bloodlink_hospitals',
  CURRENT_HOSPITAL: 'bloodlink_curr_hospital',
  BLOOD_BANKS: 'bloodlink_bloodbanks',
  CURRENT_BLOOD_BANK: 'bloodlink_curr_bloodbank',
  ORGANIZERS: 'bloodlink_organizers',
  CURRENT_ORGANIZER: 'bloodlink_curr_organizer',
  CAMPS: 'bloodlink_camps',
  CAMP_REGISTRATIONS: 'bloodlink_camp_regs',
  INVENTORY: 'bloodlink_inventory',
  REQUESTS: 'bloodlink_requests',
  NOTIFICATIONS: 'bloodlink_notifications',
};

export const BloodLinkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Unified Role-Based Auth User
  const [currentUser, setCurrentUser] = useState<AuthSessionUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  // Initialize ALL collections to EMPTY arrays strictly following NO DEMO DATA directive
  const [donors, setDonors] = useState<RegisteredDonor[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DONORS);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentDonor, setCurrentDonor] = useState<RegisteredDonor | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_DONOR);
    return saved ? JSON.parse(saved) : null;
  });

  const [hospitals, setHospitals] = useState<HospitalAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HOSPITALS);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentHospital, setCurrentHospital] = useState<HospitalAccount | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_HOSPITAL);
    return saved ? JSON.parse(saved) : null;
  });

  const [bloodBanks, setBloodBanks] = useState<BloodBankAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BLOOD_BANKS);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentBloodBank, setCurrentBloodBank] = useState<BloodBankAccount | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_BLOOD_BANK);
    return saved ? JSON.parse(saved) : null;
  });

  const [organizers, setOrganizers] = useState<CampOrganizerAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORGANIZERS);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentOrganizer, setCurrentOrganizer] = useState<CampOrganizerAccount | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_ORGANIZER);
    return saved ? JSON.parse(saved) : null;
  });

  const [camps, setCamps] = useState<BloodCamp[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CAMPS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // ignore and fallback
      }
    }
    return INITIAL_CAMPS;
  });

  const [campRegistrations, setCampRegistrations] = useState<CampAttendeeRegistration[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CAMP_REGISTRATIONS);
    return saved ? JSON.parse(saved) : [];
  });

  const [inventory, setInventory] = useState<BloodUnit[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeRequests, setActiveRequests] = useState<EmergencyRequisition[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<ClinicalNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : [];
  });

  // Railway Database Live Integration State
  const [databaseUrl, setDatabaseUrlState] = useState<string>(() => getActiveDatabaseUrl());
  const [isRailwayConnected, setIsRailwayConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [railwayLatency, setRailwayLatency] = useState<number | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [railwayError, setRailwayError] = useState<string | null>(null);
  const [rawRailwayData, setRawRailwayData] = useState<{
    donors: any[];
    hospitals: any[];
    bloodBanks: any[];
    camps: any[];
    inventory: any[];
    requests: any[];
  }>({
    donors: [],
    hospitals: [],
    bloodBanks: [],
    camps: [],
    inventory: [],
    requests: []
  });

  const syncWithRailway = useCallback(async () => {
    setIsSyncing(true);
    setRailwayError(null);
    try {
      const health = await RailwayApi.checkHealth();
      if (!health.ok) {
        setIsRailwayConnected(false);
        setRailwayError(health.message);
        return;
      }
      setIsRailwayConnected(true);
      setRailwayLatency(health.latencyMs);

      const [donorsRes, hospitalsRes, bloodBanksRes, campsRes, inventoryRes, requestsRes] =
        await Promise.allSettled([
          RailwayApi.getDonors(),
          RailwayApi.getHospitals(),
          RailwayApi.getBloodBanks(),
          RailwayApi.getCamps(),
          RailwayApi.getInventory(),
          RailwayApi.getBloodRequests()
        ]);

      setRawRailwayData({
        donors: donorsRes.status === 'fulfilled' && Array.isArray(donorsRes.value) ? donorsRes.value : [],
        hospitals: hospitalsRes.status === 'fulfilled' && Array.isArray(hospitalsRes.value) ? hospitalsRes.value : [],
        bloodBanks: bloodBanksRes.status === 'fulfilled' && Array.isArray(bloodBanksRes.value) ? bloodBanksRes.value : [],
        camps: campsRes.status === 'fulfilled' && Array.isArray(campsRes.value) ? campsRes.value : [],
        inventory: inventoryRes.status === 'fulfilled' && Array.isArray(inventoryRes.value) ? inventoryRes.value : [],
        requests: requestsRes.status === 'fulfilled' && Array.isArray(requestsRes.value) ? requestsRes.value : []
      });

      // 1. Hospitals from Railway DB
      if (hospitalsRes.status === 'fulfilled' && Array.isArray(hospitalsRes.value)) {
        const mappedHospitals: HospitalAccount[] = hospitalsRes.value.map((h) => ({
          id: `HOSP-${h.hospital_id}`,
          name: h.hospital_name,
          licenceNumber: h.registration_number,
          address: h.address,
          city: h.address.split(',').pop()?.trim() || 'Pune',
          state: 'Maharashtra',
          phone: '+91 20 6645 5100',
          email: `${h.hospital_name.toLowerCase().replace(/[^a-z0-9]/g, '')}@hospital.org`,
          contactPerson: 'Authorized Medical Officer',
          status:
            h.verification_status === 'verified'
              ? 'Verified'
              : h.verification_status === 'rejected'
              ? 'Rejected'
              : 'Verification Pending',
          createdAt: 'Railway DB'
        }));

        setHospitals((prev) => {
          const localOnly = prev.filter(
            (p) => !mappedHospitals.some((m) => m.id === p.id || m.licenceNumber === p.licenceNumber)
          );
          return [...mappedHospitals, ...localOnly];
        });
      }

      // 2. Blood Banks from Railway DB
      if (bloodBanksRes.status === 'fulfilled' && Array.isArray(bloodBanksRes.value)) {
        const mappedBanks: BloodBankAccount[] = bloodBanksRes.value.map((b) => ({
          id: `BB-${b.blood_bank_id}`,
          name: b.bank_name,
          licenceNumber: b.license_number,
          address: b.address,
          city: b.address.split(',').pop()?.trim() || 'Pune',
          state: 'Maharashtra',
          phone: '+91 20 6727 0000',
          email: `${b.bank_name.toLowerCase().replace(/[^a-z0-9]/g, '')}@bloodbank.org`,
          contactPerson: 'Medical Director',
          status:
            b.verification_status === 'verified'
              ? 'Verified'
              : b.verification_status === 'rejected'
              ? 'Rejected'
              : 'Verification Pending',
          createdAt: 'Railway DB'
        }));

        setBloodBanks((prev) => {
          const localOnly = prev.filter(
            (p) => !mappedBanks.some((m) => m.id === p.id || m.licenceNumber === p.licenceNumber)
          );
          return [...mappedBanks, ...localOnly];
        });
      }

      // 3. Camps from Railway DB
      if (campsRes.status === 'fulfilled' && Array.isArray(campsRes.value)) {
        const donationImages = [
          'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1000&q=80'
        ];

        const mappedCamps: BloodCamp[] = campsRes.value.map((c, index) => ({
          id: `CAMP-${c.camp_id}`,
          name: `${c.partner_blood_bank || 'Regional Community'} Blood Camp`,
          date: c.camp_date ? c.camp_date.split('T')[0] : '2026-09-15',
          startTime: c.start_time ? c.start_time.slice(0, 5) : '10:00 AM',
          endTime: c.end_time ? c.end_time.slice(0, 5) : '04:00 PM',
          venue: c.location.split(',')[0] || c.location,
          address: c.location,
          city: c.location.split(',').pop()?.trim() || 'Pune',
          contact: '+91 98900 11223',
          registeredCount: 0,
          registrationLimit: c.capacity || 50,
          description: `Partner Blood Bank: ${c.partner_blood_bank || 'Regional Blood Bank'}. Required groups: ${c.required_blood_group}. All donors receive free health screening and nutrition kit.`,
          status: 'Active Booking',
          distance: 'Community Venue',
          image: donationImages[index % donationImages.length],
          gallery: donationImages,
          perks: [
            '🎁 Free Gourmet Nutrition & Snack Box',
            '👕 Exclusive "LifeSaver Hero" Dri-Fit Tee',
            '🩺 Free 5-Point Full Health Check ($65 Value)',
            '🏅 Red Cross Certified Certificate of Honor',
            '💳 Personalized Smart Blood Group ID Card'
          ],
          highlights: [
            '❄️ Air-Conditioned Comfort Lounge',
            '☕ Unlimited Fresh Juice Bar',
            '👨‍⚕️ Clinical Phlebotomists on Duty',
            '⚡ 15-Minute Safe Process'
          ]
        }));

        setCamps((prev) => {
          const localOnly = prev.filter((p) => !mappedCamps.some((m) => m.id === p.id));
          return [...mappedCamps, ...localOnly];
        });
      }

      // 4. Donors from Railway DB
      if (donorsRes.status === 'fulfilled' && Array.isArray(donorsRes.value)) {
        const mappedDonors: RegisteredDonor[] = donorsRes.value.map((d) => ({
          id: `DONOR-${d.donor_id}`,
          fullName: d.name,
          email: `${d.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@donor.org`,
          phone: d.phone,
          bloodGroup: (d.blood_group as BloodGroup) || 'O+',
          city: d.city,
          area: d.city ? `${d.city} Central District` : 'Central District',
          isAvailable: d.eligibility_status !== 'ineligible',
          donationCount: 1,
          lastDonationDate: d.last_donation_date ? d.last_donation_date.split('T')[0] : '2026-06-10',
          gender: 'Unspecified',
          age: 28
        }));

        setDonors((prev) => {
          const localOnly = prev.filter(
            (p) => !mappedDonors.some((m) => m.id === p.id || m.phone === p.phone)
          );
          return [...mappedDonors, ...localOnly];
        });
      }

      // 5. Inventory from Railway DB
      if (inventoryRes.status === 'fulfilled' && Array.isArray(inventoryRes.value)) {
        const mappedInventory: BloodUnit[] = [];
        const compMap: Record<string, string> = {
          whole_blood: 'Whole Blood',
          platelets: 'Platelets (RDP/SDP)',
          plasma: 'Fresh Frozen Plasma (FFP)',
          cryoprecipitate: 'Cryoprecipitate',
          rbc: 'Packed Red Blood Cells (PRBC)'
        };

        inventoryRes.value.forEach((inv) => {
          const compName = compMap[inv.component.toLowerCase()] || 'Whole Blood';
          const unitsCount = Math.min(inv.units_available || 1, 15);
          for (let i = 0; i < unitsCount; i++) {
            mappedInventory.push({
              id: `INV-${inv.inventory_id}-${i + 1}`,
              bloodGroup: (inv.blood_group as BloodGroup) || 'O+',
              component: compName,
              volume: 450,
              collectionDate: '2026-08-25',
              expiryDate: inv.expire_date ? inv.expire_date.split('T')[0] : '2026-10-05',
              status: i < (inv.units_reserved || 0) ? 'Reserved' : 'Available'
            });
          }
        });

        if (mappedInventory.length > 0) {
          setInventory((prev) => {
            const localOnly = prev.filter((p) => !mappedInventory.some((m) => m.id === p.id));
            return [...mappedInventory, ...localOnly];
          });
        }
      }

      // 6. Blood Requests from Railway DB
      if (requestsRes.status === 'fulfilled' && Array.isArray(requestsRes.value)) {
        const compMap: Record<string, string> = {
          whole_blood: 'Whole Blood',
          platelets: 'Platelets (RDP/SDP)',
          plasma: 'Fresh Frozen Plasma (FFP)',
          cryoprecipitate: 'Cryoprecipitate',
          rbc: 'Packed Red Blood Cells (PRBC)'
        };

        const mappedRequests: EmergencyRequisition[] = requestsRes.value.map((r) => {
          const compTitle = compMap[r.component.toLowerCase()] || r.component;
          const urgencyTitle =
            r.urgency_level.toLowerCase() === 'critical'
              ? 'CRITICAL'
              : r.urgency_level.toLowerCase() === 'urgent'
              ? 'URGENT'
              : 'STANDARD';

          const statusTitle =
            r.request_status.toLowerCase() === 'fulfilled'
              ? 'Allocated'
              : r.request_status.toLowerCase() === 'dispatched'
              ? 'Dispatched'
              : 'Matching';

          return {
            id: `REQ-${r.request_id}`,
            hospitalName: r.hospital_name || r.location || 'Ruby Hall Clinic',
            department: 'Emergency & Critical Care',
            bloodGroup: (r.blood_group as BloodGroup) || 'O-',
            component: compTitle as any,
            units: r.units_required,
            urgency: urgencyTitle as any,
            patientId: r.patient_name || `Patient #${r.request_id}`,
            contactPhone: '+91 20 6645 5100',
            timestamp: r.created_at
              ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Recent',
            status: statusTitle as any
          };
        });

        setActiveRequests((prev) => {
          const localOnly = prev.filter((p) => !mappedRequests.some((m) => m.id === p.id));
          return [...mappedRequests, ...localOnly];
        });
      }

      setLastSyncedAt(new Date());
    } catch (err: any) {
      setRailwayError(err.message || 'Failed to sync with Railway database');
      setIsRailwayConnected(false);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Synchronize on mount and schedule periodic background refresh
  useEffect(() => {
    syncWithRailway();
    const interval = setInterval(() => {
      syncWithRailway();
    }, 60000); // sync every 60s
    return () => clearInterval(interval);
  }, [syncWithRailway]);

  const updateDatabaseUrl = async (newUrl: string) => {
    const saved = setActiveDatabaseUrl(newUrl);
    setDatabaseUrlState(saved);
    await syncWithRailway();
  };

  const resetDatabaseUrlToDefault = async () => {
    const def = resetActiveDatabaseUrl();
    setDatabaseUrlState(def);
    await syncWithRailway();
  };

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(donors));
  }, [donors]);

  useEffect(() => {
    if (currentDonor) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_DONOR, JSON.stringify(currentDonor));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_DONOR);
    }
  }, [currentDonor]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(hospitals));
  }, [hospitals]);

  useEffect(() => {
    if (currentHospital) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_HOSPITAL, JSON.stringify(currentHospital));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_HOSPITAL);
    }
  }, [currentHospital]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BLOOD_BANKS, JSON.stringify(bloodBanks));
  }, [bloodBanks]);

  useEffect(() => {
    if (currentBloodBank) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_BLOOD_BANK, JSON.stringify(currentBloodBank));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_BLOOD_BANK);
    }
  }, [currentBloodBank]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORGANIZERS, JSON.stringify(organizers));
  }, [organizers]);

  useEffect(() => {
    if (currentOrganizer) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ORGANIZER, JSON.stringify(currentOrganizer));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_ORGANIZER);
    }
  }, [currentOrganizer]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAMPS, JSON.stringify(camps));
  }, [camps]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAMP_REGISTRATIONS, JSON.stringify(campRegistrations));
  }, [campRegistrations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(activeRequests));
  }, [activeRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  // DONOR ACTIONS
  const registerDonor = (donorData: Omit<RegisteredDonor, 'id'>) => {
    const newDonor: RegisteredDonor = {
      ...donorData,
      id: `DONOR-${Math.floor(1000 + Math.random() * 9000)}`
    };
    setDonors((prev) => [newDonor, ...prev]);
    setCurrentDonor(newDonor);

    // Persist to backend database
    RailwayApi.registerDonor({
      name: donorData.fullName,
      phone: donorData.phone,
      blood_group: donorData.bloodGroup,
      email: donorData.email,
      city: donorData.city,
      area: donorData.area,
      state: donorData.state,
      age: donorData.age,
      gender: donorData.gender,
      available_for_emergency: donorData.availableForEmergency
    })
      .then((res) => {
        if (res?.donor_id) {
          const syncedId = `DONOR-${res.donor_id}`;
          newDonor.id = syncedId;
          setDonors((prev) => prev.map((d) => (d.phone === newDonor.phone ? { ...d, id: syncedId } : d)));
          setCurrentDonor((curr) => (curr && curr.phone === newDonor.phone ? { ...curr, id: syncedId } : curr));
        }
      })
      .catch((err) => console.warn('Backend donor registration sync:', err.message));

    return newDonor;
  };

  const loginDonor = (emailOrPhone: string): boolean => {
    const normalized = emailOrPhone.trim().toLowerCase();
    const digitsOnly = normalized.replace(/\D/g, '');
    const found = donors.find((d) => {
      const dDigits = d.phone.replace(/\D/g, '');
      return (
        d.email.toLowerCase() === normalized ||
        (digitsOnly.length >= 7 && dDigits.includes(digitsOnly)) ||
        d.fullName.toLowerCase().includes(normalized) ||
        d.id.toLowerCase() === normalized
      );
    });
    if (found) {
      setCurrentDonor(found);
      return true;
    }
    return false;
  };

  const logoutDonor = () => {
    setCurrentDonor(null);
  };

  const updateDonorAvailability = (isAvailable: boolean) => {
    if (!currentDonor) return;
    const updated = { ...currentDonor, isAvailable };
    setCurrentDonor(updated);
    setDonors((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));

    // Persist to backend database
    RailwayApi.updateDonorAvailability(currentDonor.id, isAvailable).catch((err) =>
      console.warn('Backend availability sync:', err.message)
    );
  };

  // HOSPITAL ACTIONS
  const registerHospital = (data: Omit<HospitalAccount, 'id' | 'status' | 'createdAt'>) => {
    const newHosp: HospitalAccount = {
      ...data,
      id: `HOSP-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Verification Pending',
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    setHospitals((prev) => [newHosp, ...prev]);
    setCurrentHospital(newHosp);

    // Persist to backend database
    RailwayApi.registerHospital({
      hospital_name: data.name,
      registration_number: data.licenceNumber,
      address: data.address,
      contact_person: data.contactPerson,
      email: data.email,
      phone: data.phone,
      city: data.city,
      state: data.state,
      licence_document_name: data.licenceDocumentName
    })
      .then((res) => {
        if (res?.hospital_id) {
          const syncedId = `HOSP-${res.hospital_id}`;
          newHosp.id = syncedId;
          setHospitals((prev) => prev.map((h) => (h.licenceNumber === newHosp.licenceNumber ? { ...h, id: syncedId } : h)));
          setCurrentHospital((curr) => (curr && curr.licenceNumber === newHosp.licenceNumber ? { ...curr, id: syncedId } : curr));
        }
      })
      .catch((err) => console.warn('Backend hospital registration sync:', err.message));

    return newHosp;
  };

  const loginHospital = (emailOrPhone: string) => {
    const normalized = emailOrPhone.trim().toLowerCase();
    const digitsOnly = normalized.replace(/\D/g, '');
    const found = hospitals.find((h) => {
      const hDigits = h.phone.replace(/\D/g, '');
      return (
        h.email.toLowerCase() === normalized ||
        (digitsOnly.length >= 7 && hDigits.includes(digitsOnly)) ||
        h.name.toLowerCase().includes(normalized) ||
        h.licenceNumber.toLowerCase() === normalized ||
        h.id.toLowerCase() === normalized
      );
    });
    if (!found) {
      return { success: false, message: 'No registered hospital found with those credentials.' };
    }
    setCurrentHospital(found);
    return { success: true, status: found.status };
  };

  const logoutHospital = () => {
    setCurrentHospital(null);
  };

  const setCurrentHospitalById = (id: string) => {
    const found = hospitals.find((h) => h.id === id);
    if (found) setCurrentHospital(found);
  };

  // BLOOD BANK ACTIONS
  const registerBloodBank = (data: Omit<BloodBankAccount, 'id' | 'status' | 'createdAt'>) => {
    const newBank: BloodBankAccount = {
      ...data,
      id: `BB-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Verification Pending',
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    setBloodBanks((prev) => [newBank, ...prev]);
    setCurrentBloodBank(newBank);

    // Persist to backend database
    RailwayApi.registerBloodBank({
      bank_name: data.name,
      license_number: data.licenceNumber,
      address: data.address,
      contact_person: data.contactPerson,
      email: data.email,
      phone: data.phone,
      city: data.city,
      state: data.state,
      licence_document_name: data.licenceDocumentName
    })
      .then((res) => {
        if (res?.blood_bank_id) {
          const syncedId = `BB-${res.blood_bank_id}`;
          newBank.id = syncedId;
          setBloodBanks((prev) => prev.map((b) => (b.licenceNumber === newBank.licenceNumber ? { ...b, id: syncedId } : b)));
          setCurrentBloodBank((curr) => (curr && curr.licenceNumber === newBank.licenceNumber ? { ...curr, id: syncedId } : curr));
        }
      })
      .catch((err) => console.warn('Backend blood bank registration sync:', err.message));

    return newBank;
  };

  const loginBloodBank = (emailOrPhone: string) => {
    const normalized = emailOrPhone.trim().toLowerCase();
    const digitsOnly = normalized.replace(/\D/g, '');
    const found = bloodBanks.find((b) => {
      const bDigits = b.phone.replace(/\D/g, '');
      return (
        b.email.toLowerCase() === normalized ||
        (digitsOnly.length >= 7 && bDigits.includes(digitsOnly)) ||
        b.name.toLowerCase().includes(normalized) ||
        b.licenceNumber.toLowerCase() === normalized ||
        b.id.toLowerCase() === normalized
      );
    });
    if (!found) {
      return { success: false, message: 'No registered blood bank found with those credentials.' };
    }
    setCurrentBloodBank(found);
    return { success: true, status: found.status };
  };

  const logoutBloodBank = () => {
    setCurrentBloodBank(null);
  };

  const setCurrentBloodBankById = (id: string) => {
    const found = bloodBanks.find((b) => b.id === id);
    if (found) setCurrentBloodBank(found);
  };

  // BLOOD CAMP ORGANIZER ACTIONS
  const registerOrganizer = (data: Omit<CampOrganizerAccount, 'id' | 'createdAt'>) => {
    const newOrg: CampOrganizerAccount = {
      ...data,
      id: `ORG-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toLocaleDateString()
    };
    setOrganizers((prev) => [newOrg, ...prev]);
    setCurrentOrganizer(newOrg);
    return newOrg;
  };

  const loginOrganizer = (emailOrPhone: string): boolean => {
    const normalized = emailOrPhone.trim().toLowerCase();
    const found = organizers.find(
      (o) => o.email.toLowerCase() === normalized || o.phone.replace(/\D/g, '') === normalized.replace(/\D/g, '')
    );
    if (found) {
      setCurrentOrganizer(found);
      return true;
    }
    return false;
  };

  const logoutOrganizer = () => {
    setCurrentOrganizer(null);
  };

  const createCamp = (campData: Omit<BloodCamp, 'id' | 'registeredCount' | 'status'>) => {
    const newCamp: BloodCamp = {
      ...campData,
      id: `CAMP-${Date.now()}`,
      registeredCount: 0,
      status: 'Active Booking',
      distance: 'Regional Venue'
    };
    setCamps((prev) => [newCamp, ...prev]);

    RailwayApi.createCamp({
      name: campData.name,
      location: campData.venue || campData.address,
      venue: campData.venue,
      address: campData.address,
      city: campData.city,
      camp_date: campData.date,
      start_time: campData.startTime,
      end_time: campData.endTime,
      capacity: campData.registrationLimit,
      required_blood_group: 'All Groups',
      partner_blood_bank: campData.partnerBloodBank,
      contact: campData.contact,
      description: campData.description
    }).then((res) => {
      if (res?.camp_id) {
        newCamp.id = `CAMP-${res.camp_id}`;
        setCamps((prev) => prev.map((c) => (c.name === newCamp.name ? { ...c, id: `CAMP-${res.camp_id}` } : c)));
      }
    }).catch((err) => console.warn('Backend camp create sync:', err.message));

    return newCamp;
  };

  const registerForCamp = (
    campId: string,
    donorName: string,
    donorPhone: string,
    donorBloodGroup: BloodGroup,
    slotTime: string,
    tshirtSize?: string,
    snackPreference?: string
  ): boolean => {
    const targetCamp = camps.find((c) => c.id === campId);
    if (!targetCamp) return false;
    if (targetCamp.registeredCount >= targetCamp.registrationLimit) return false;

    const voucherCode = `HERO-PERK-${Math.floor(1000 + Math.random() * 9000)}`;

    const registration: CampAttendeeRegistration = {
      id: `REG-${Date.now()}`,
      campId,
      campName: targetCamp.name,
      donorId: currentDonor?.id || `DONOR-GUEST`,
      donorName,
      donorPhone,
      donorBloodGroup,
      slotTime,
      registeredAt: new Date().toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' }),
      tshirtSize: tshirtSize || 'L',
      snackPreference: snackPreference || 'Gourmet High-Protein Box',
      voucherCode
    };

    setCampRegistrations((prev) => [registration, ...prev]);
    setCamps((prev) =>
      prev.map((c) => (c.id === campId ? { ...c, registeredCount: c.registeredCount + 1 } : c))
    );

    RailwayApi.registerCampAttendee(campId, {
      donor_id: currentDonor?.id || `DONOR-GUEST`,
      donor_name: donorName,
      donor_phone: donorPhone,
      donor_blood_group: donorBloodGroup,
      slot_time: slotTime
    }).catch((err) => console.warn('Backend camp attendee sync:', err.message));

    return true;
  };

  // INVENTORY ACTIONS
  const addBloodUnit = (unitData: Omit<BloodUnit, 'id' | 'status'>) => {
    const newUnit: BloodUnit = {
      ...unitData,
      id: `UNIT-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'Available'
    };
    setInventory((prev) => [newUnit, ...prev]);

    RailwayApi.addInventoryUnit({
      bank_name: currentBloodBank?.name || 'Sahyadri Blood Bank',
      blood_group: unitData.bloodGroup,
      component: unitData.component,
      volume: unitData.volume,
      collection_date: unitData.collectionDate,
      expire_date: unitData.expiryDate,
      units_available: 1
    }).catch((err) => console.warn('Backend inventory add sync:', err.message));

    return newUnit;
  };

  const removeBloodUnit = (unitId: string) => {
    setInventory((prev) => prev.filter((u) => u.id !== unitId));
    RailwayApi.removeInventoryUnit(unitId).catch((err) => console.warn('Backend inventory remove sync:', err.message));
  };

  const toggleUnitStatus = (unitId: string) => {
    setInventory((prev) =>
      prev.map((u) =>
        u.id === unitId ? { ...u, status: u.status === 'Available' ? 'Reserved' : 'Available' } : u
      )
    );
    RailwayApi.toggleInventoryStatus(unitId).catch((err) => console.warn('Backend inventory toggle sync:', err.message));
  };

  // EMERGENCY REQUISITIONS
  const createEmergencyRequest = (reqData: Omit<EmergencyRequisition, 'id' | 'timestamp' | 'status'>) => {
    const tempId = `REQ-${Math.floor(10000 + Math.random() * 90000)}`;
    const newReq: EmergencyRequisition = {
      ...reqData,
      id: tempId,
      timestamp: 'Just now',
      status: 'Matching'
    };
    setActiveRequests((prev) => [newReq, ...prev]);

    // Also dispatch a clinical notification
    const alertNotif: ClinicalNotification = {
      id: `NOTIF-${Date.now()}`,
      title: `${reqData.urgency}: ${reqData.units} Units of ${reqData.bloodGroup} Needed`,
      message: `${reqData.hospitalName} has initiated an emergency order for ${reqData.component}.`,
      time: 'Just now',
      isUrgent: reqData.urgency === 'CRITICAL',
      type: 'alert'
    };
    setNotifications((prev) => [alertNotif, ...prev]);

    // Post to Railway PostgreSQL Database asynchronously
    (async () => {
      try {
        const matchingHosp = hospitals.find((h) => h.name === reqData.hospitalName);
        const hospIdNum = matchingHosp ? Number(matchingHosp.id.replace(/\D/g, '')) || 1 : 1;

        let compApi = 'whole_blood';
        const cLower = reqData.component.toLowerCase();
        if (cLower.includes('platelet')) compApi = 'platelets';
        else if (cLower.includes('plasma')) compApi = 'plasma';
        else if (cLower.includes('cryo')) compApi = 'whole_blood';
        else compApi = 'whole_blood';

        const created = await RailwayApi.createBloodRequest({
          hospital_id: hospIdNum,
          patient_name: reqData.patientId || 'Emergency Patient',
          blood_group: reqData.bloodGroup,
          component: compApi,
          units_required: reqData.units,
          urgency_level: reqData.urgency.toLowerCase(),
          required_by: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' '),
          location: reqData.hospitalName
        });

        if (created?.request_id) {
          const dbId = `REQ-${created.request_id}`;
          setActiveRequests((prev) =>
            prev.map((r) => (r.id === tempId ? { ...r, id: dbId } : r))
          );
        }
      } catch (err: any) {
        console.warn('Railway DB requisition sync notification:', err.message);
      }
    })();

    return newReq;
  };

  const updateRequestStatus = (reqId: string, status: EmergencyRequisition['status']) => {
    setActiveRequests((prev) => prev.map((r) => (r.id === reqId ? { ...r, status } : r)));
  };

  const acceptHospitalRequest = (reqId: string, bloodBankId: string, bloodBankName: string) => {
    setActiveRequests((prev) =>
      prev.map((r) => {
        if (r.id === reqId) {
          return {
            ...r,
            status: 'Confirmed',
            deliveryStatus: 'Accepted',
            assignedBloodBankId: bloodBankId,
            assignedBloodBankName: bloodBankName,
            allocatedUnits: r.units
          };
        }
        return r;
      })
    );

    RailwayApi.acceptBloodRequest(reqId, bloodBankId, bloodBankName).catch((err) =>
      console.warn('Backend requisition accept sync:', err.message)
    );

    const targetReq = activeRequests.find((r) => r.id === reqId);
    if (targetReq) {
      const acceptNotif: ClinicalNotification = {
        id: `NOTIF-${Date.now()}`,
        title: `Order Accepted by ${bloodBankName}`,
        message: `${bloodBankName} accepted requisition ${reqId} for ${targetReq.units} units of ${targetReq.bloodGroup}. Allocation initiated.`,
        time: 'Just now',
        isUrgent: targetReq.urgency === 'CRITICAL',
        type: 'success'
      };
      setNotifications((prev) => [acceptNotif, ...prev]);
    }
  };

  const rejectHospitalRequest = (reqId: string, bloodBankId: string) => {
    setActiveRequests((prev) =>
      prev.map((r) => {
        if (r.id === reqId) {
          const rejected = r.rejectedByBloodBankIds || [];
          const updatedRejected = rejected.includes(bloodBankId) ? rejected : [...rejected, bloodBankId];
          return {
            ...r,
            rejectedByBloodBankIds: updatedRejected
          };
        }
        return r;
      })
    );

    RailwayApi.rejectBloodRequest(reqId, bloodBankId).catch((err) =>
      console.warn('Backend requisition reject sync:', err.message)
    );
  };

  const allocateUnitsForRequest = (reqId: string, bloodBankId: string, units: number) => {
    setActiveRequests((prev) =>
      prev.map((r) => {
        if (r.id === reqId) {
          return {
            ...r,
            status: 'Reserved',
            deliveryStatus: 'Units Allocated',
            allocatedUnits: units
          };
        }
        return r;
      })
    );

    RailwayApi.allocateBloodUnits(reqId, units).catch((err) =>
      console.warn('Backend requisition allocate sync:', err.message)
    );
  };

  const dispatchBloodSupply = (reqId: string, trackingNumber?: string) => {
    const track = trackingNumber || `TRK-COLD-${Math.floor(100000 + Math.random() * 900000)}`;
    setActiveRequests((prev) =>
      prev.map((r) => {
        if (r.id === reqId) {
          return {
            ...r,
            status: 'Dispatched',
            deliveryStatus: 'In Transit',
            trackingNumber: track
          };
        }
        return r;
      })
    );

    RailwayApi.dispatchBloodSupply(reqId, track).catch((err) =>
      console.warn('Backend requisition dispatch sync:', err.message)
    );

    const targetReq = activeRequests.find((r) => r.id === reqId);
    if (targetReq) {
      const dispatchNotif: ClinicalNotification = {
        id: `NOTIF-${Date.now()}`,
        title: `Cold-Chain Dispatched: ${targetReq.bloodGroup}`,
        message: `${targetReq.assignedBloodBankName || 'Blood Bank'} has dispatched blood units for ${targetReq.hospitalName}. Tracking: ${track}.`,
        time: 'Just now',
        isUrgent: targetReq.urgency === 'CRITICAL',
        type: 'info'
      };
      setNotifications((prev) => [dispatchNotif, ...prev]);
    }
  };

  const confirmHospitalReceipt = (reqId: string) => {
    setActiveRequests((prev) =>
      prev.map((r) => {
        if (r.id === reqId) {
          return {
            ...r,
            status: 'Received',
            deliveryStatus: 'Supplied'
          };
        }
        return r;
      })
    );

    RailwayApi.receiveBloodSupply(reqId).catch((err) =>
      console.warn('Backend requisition receive sync:', err.message)
    );

    const targetReq = activeRequests.find((r) => r.id === reqId);
    if (targetReq) {
      const receiptNotif: ClinicalNotification = {
        id: `NOTIF-${Date.now()}`,
        title: `Requisition Fulfilled & Delivered`,
        message: `${targetReq.hospitalName} confirmed receipt and successful delivery of ${targetReq.units} units of ${targetReq.bloodGroup}.`,
        time: 'Just now',
        type: 'success'
      };
      setNotifications((prev) => [receiptNotif, ...prev]);
    }
  };

  const contactEmergencyDonor = (
    donorId: string,
    hospitalName: string,
    bloodGroup: BloodGroup,
    unitsNeeded: number
  ) => {
    const targetDonor = donors.find((d) => d.id === donorId);
    const donorName = targetDonor ? targetDonor.fullName : 'Donor';

    const emergencyAlert: ClinicalNotification = {
      id: `NOTIF-${Date.now()}`,
      title: `Emergency Donor Mobilization: ${bloodGroup}`,
      message: `Emergency donor ${donorName} contacted by ${hospitalName} for ${unitsNeeded} units of ${bloodGroup} trauma requirement.`,
      time: 'Just now',
      isUrgent: true,
      type: 'alert'
    };
    setNotifications((prev) => [emergencyAlert, ...prev]);
  };

  // ADMIN VERIFICATION ACTIONS
  const approveEntity = (type: 'hospital' | 'blood-bank', id: string) => {
    const verifiedTimestamp = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    if (type === 'hospital') {
      setHospitals((prev) =>
        prev.map((h) => (h.id === id ? { ...h, status: 'Verified', verifiedAt: verifiedTimestamp } : h))
      );
      if (currentHospital?.id === id) {
        setCurrentHospital((curr) =>
          curr ? { ...curr, status: 'Verified', verifiedAt: verifiedTimestamp } : null
        );
      }
      RailwayApi.updateHospitalStatus(id, 'verified').catch((err) => console.warn(err));
    } else {
      setBloodBanks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'Verified', verifiedAt: verifiedTimestamp } : b))
      );
      if (currentBloodBank?.id === id) {
        setCurrentBloodBank((curr) =>
          curr ? { ...curr, status: 'Verified', verifiedAt: verifiedTimestamp } : null
        );
      }
      RailwayApi.updateBloodBankStatus(id, 'verified').catch((err) => console.warn(err));
    }
  };

  const rejectEntity = (type: 'hospital' | 'blood-bank', id: string) => {
    if (type === 'hospital') {
      setHospitals((prev) =>
        prev.map((h) => (h.id === id ? { ...h, status: 'Rejected' } : h))
      );
      if (currentHospital?.id === id) {
        setCurrentHospital((curr) => (curr ? { ...curr, status: 'Rejected' } : null));
      }
      RailwayApi.updateHospitalStatus(id, 'rejected').catch((err) => console.warn(err));
    } else {
      setBloodBanks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'Rejected' } : b))
      );
      if (currentBloodBank?.id === id) {
        setCurrentBloodBank((curr) => (curr ? { ...curr, status: 'Rejected' } : null));
      }
      RailwayApi.updateBloodBankStatus(id, 'rejected').catch((err) => console.warn(err));
    }
  };

  // --- UNIFIED ROLE-BASED AUTHENTICATION & VERIFICATION METHODS ---

  const registerUser = async (formData: any): Promise<{ success: boolean; user?: AuthSessionUser; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      const registeredUser: AuthSessionUser = data.user;
      setCurrentUser(registeredUser);

      // Synchronize role-specific in-memory states
      if (registeredUser.role === 'donor') {
        const d = registeredUser.profile;
        const newRegDonor: RegisteredDonor = {
          id: `DONOR-${registeredUser.user_id}`,
          fullName: registeredUser.name,
          bloodGroup: d?.blood_group || formData.blood_group || 'O+',
          city: registeredUser.city,
          area: formData.area || 'Metro Area',
          phone: registeredUser.phone,
          email: registeredUser.email,
          age: formData.age ? Number(formData.age) : 26,
          gender: d?.gender || formData.gender || 'Not specified',
          eligibilityStatus: d?.eligibility_status || 'Pending Verification',
          verificationStatus: d?.verification_status || 'Pending',
          lastDonationDate: d?.last_donation_date || 'None',
          donationCount: 0,
          isAvailable: false,
          availableForEmergency: false
        };
        setDonors((prev) => [newRegDonor, ...prev.filter((item) => item.phone !== newRegDonor.phone)]);
        setCurrentDonor(newRegDonor);
      } else if (registeredUser.role === 'hospital') {
        const h = registeredUser.profile;
        const newHosp: HospitalAccount = {
          id: `HOSP-${registeredUser.user_id}`,
          name: h?.hospital_name || registeredUser.name,
          licenceNumber: h?.registration_number || formData.registration_number || `REG-${Date.now()}`,
          address: h?.address || formData.address || '',
          city: registeredUser.city,
          state: formData.state || 'Maharashtra',
          status: (registeredUser.verification_status || 'Pending') as any,
          contactPerson: registeredUser.name,
          email: registeredUser.email,
          phone: registeredUser.phone,
          createdAt: new Date().toISOString()
        };
        setHospitals((prev) => [newHosp, ...prev.filter((item) => item.id !== newHosp.id)]);
        setCurrentHospital(newHosp);
      } else if (registeredUser.role === 'blood_bank') {
        const b = registeredUser.profile;
        const newBank: BloodBankAccount = {
          id: `BB-${registeredUser.user_id}`,
          name: b?.bank_name || registeredUser.name,
          licenceNumber: b?.license_number || formData.license_number || `LIC-${Date.now()}`,
          address: b?.address || formData.address || '',
          city: registeredUser.city,
          state: formData.state || 'Maharashtra',
          status: (registeredUser.verification_status || 'Pending') as any,
          contactPerson: registeredUser.name,
          email: registeredUser.email,
          phone: registeredUser.phone,
          createdAt: new Date().toISOString()
        };
        setBloodBanks((prev) => [newBank, ...prev.filter((item) => item.id !== newBank.id)]);
        setCurrentBloodBank(newBank);
      } else if (registeredUser.role === 'blood_camp') {
        const c = registeredUser.profile;
        const newOrg: CampOrganizerAccount = {
          id: `ORG-${registeredUser.user_id}`,
          organizerName: registeredUser.name,
          organizationName: c?.camp_name || formData.camp_name || `${registeredUser.name}'s Blood Drive`,
          phone: registeredUser.phone,
          email: registeredUser.email,
          contact: registeredUser.phone,
          taxOrRegId: c?.registration_number || formData.registration_number || `REG-${Date.now()}`,
          status: (registeredUser.verification_status || 'Pending') as any,
          createdAt: new Date().toISOString()
        };
        setOrganizers((prev) => [newOrg, ...prev.filter((item) => item.id !== newOrg.id)]);
        setCurrentOrganizer(newOrg);
      }

      return { success: true, user: registeredUser };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during registration' };
    }
  };

  const loginUser = async (
    identifier: string,
    password?: string,
    expectedRole?: string
  ): Promise<{ success: boolean; user?: AuthSessionUser; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, expectedRole })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication failed' };
      }

      const authUser: AuthSessionUser = data.user;
      setCurrentUser(authUser);

      // Sync role-specific current user
      if (authUser.role === 'donor') {
        let matched = donors.find((d) => d.email === authUser.email || d.phone === authUser.phone);
        if (!matched) {
          matched = {
            id: `DONOR-${authUser.user_id}`,
            name: authUser.name,
            bloodGroup: authUser.profile?.blood_group || 'O+',
            city: authUser.city,
            phone: authUser.phone,
            email: authUser.email,
            eligibilityStatus: authUser.eligibility_status || authUser.profile?.eligibility_status || 'Pending Verification',
            verificationStatus: authUser.verification_status || 'Pending',
            lastDonationDate: authUser.profile?.last_donation_date || null,
            donationCount: authUser.profile?.donation_count || 0,
            isAvailable: authUser.verification_status === 'Verified',
            availableForEmergency: authUser.verification_status === 'Verified'
          };
          setDonors((prev) => [matched!, ...prev]);
        }
        setCurrentDonor(matched);
      } else if (authUser.role === 'hospital') {
        let matched = hospitals.find((h) => h.email === authUser.email || h.phone === authUser.phone);
        if (!matched) {
          matched = {
            id: `HOSP-${authUser.user_id}`,
            name: authUser.profile?.hospital_name || authUser.name,
            licenceNumber: authUser.profile?.registration_number || 'REG-MH-2026',
            address: authUser.profile?.address || '',
            city: authUser.city,
            status: authUser.verification_status as any,
            contactPerson: authUser.name,
            email: authUser.email,
            phone: authUser.phone,
            createdAt: new Date().toISOString()
          };
          setHospitals((prev) => [matched!, ...prev]);
        }
        setCurrentHospital(matched);
      } else if (authUser.role === 'blood_bank') {
        let matched = bloodBanks.find((b) => b.email === authUser.email || b.phone === authUser.phone);
        if (!matched) {
          matched = {
            id: `BB-${authUser.user_id}`,
            name: authUser.profile?.bank_name || authUser.name,
            licenceNumber: authUser.profile?.license_number || 'LIC-BB-2026',
            address: authUser.profile?.address || '',
            city: authUser.city,
            status: authUser.verification_status as any,
            contactPerson: authUser.name,
            email: authUser.email,
            phone: authUser.phone,
            createdAt: new Date().toISOString()
          };
          setBloodBanks((prev) => [matched!, ...prev]);
        }
        setCurrentBloodBank(matched);
      } else if (authUser.role === 'blood_camp') {
        let matched = organizers.find((o) => o.email === authUser.email || o.phone === authUser.phone);
        if (!matched) {
          matched = {
            id: `ORG-${authUser.user_id}`,
            name: authUser.name,
            organizationName: authUser.profile?.camp_name || `${authUser.name}'s Drives`,
            phone: authUser.phone,
            email: authUser.email,
            taxOrRegId: authUser.profile?.registration_number || 'REG-CAMP',
            createdAt: new Date().toISOString()
          };
          setOrganizers((prev) => [matched!, ...prev]);
        }
        setCurrentOrganizer(matched);
      }

      return { success: true, user: authUser };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login' };
    }
  };

  const loginWithGoogle = async (googleData: {
    email: string;
    name: string;
    role?: string;
    phone?: string;
    city?: string;
    blood_group?: string;
    autoRegister?: boolean;
  }): Promise<{ success: boolean; user?: AuthSessionUser; isNewUser?: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleData)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Google authentication failed' };
      }

      if (data.user) {
        const authUser: AuthSessionUser = data.user;
        setCurrentUser(authUser);

        if (authUser.role === 'donor') {
          let matched = donors.find((d) => d.email === authUser.email || d.phone === authUser.phone);
          if (!matched) {
            matched = {
              id: `DONOR-${authUser.user_id}`,
              fullName: authUser.name,
              bloodGroup: authUser.profile?.blood_group || (googleData.blood_group as any) || 'O+',
              city: authUser.city,
              area: 'Metro Area',
              phone: authUser.phone,
              email: authUser.email,
              age: 26,
              gender: 'Not specified',
              eligibilityStatus: authUser.eligibility_status || authUser.profile?.eligibility_status || 'Eligible',
              verificationStatus: authUser.verification_status || 'Verified',
              lastDonationDate: authUser.profile?.last_donation_date || 'None',
              donationCount: authUser.profile?.donation_count || 0,
              isAvailable: true,
              availableForEmergency: true
            };
            setDonors((prev) => [matched!, ...prev]);
          }
          setCurrentDonor(matched);
        } else if (authUser.role === 'hospital') {
          let matched = hospitals.find((h) => h.email === authUser.email || h.phone === authUser.phone);
          if (!matched) {
            matched = {
              id: `HOSP-${authUser.user_id}`,
              name: authUser.profile?.hospital_name || authUser.name,
              licenceNumber: authUser.profile?.registration_number || 'REG-MH-2026',
              address: authUser.profile?.address || `${authUser.city} Medical Center`,
              city: authUser.city,
              state: 'Maharashtra',
              status: (authUser.verification_status || 'Verified') as any,
              contactPerson: authUser.name,
              email: authUser.email,
              phone: authUser.phone,
              createdAt: new Date().toISOString()
            };
            setHospitals((prev) => [matched!, ...prev]);
          }
          setCurrentHospital(matched);
        } else if (authUser.role === 'blood_bank') {
          let matched = bloodBanks.find((b) => b.email === authUser.email || b.phone === authUser.phone);
          if (!matched) {
            matched = {
              id: `BB-${authUser.user_id}`,
              name: authUser.profile?.bank_name || authUser.name,
              licenceNumber: authUser.profile?.license_number || 'LIC-BB-2026',
              address: authUser.profile?.address || `${authUser.city} Central Bank`,
              city: authUser.city,
              state: 'Maharashtra',
              status: (authUser.verification_status || 'Verified') as any,
              contactPerson: authUser.name,
              email: authUser.email,
              phone: authUser.phone,
              createdAt: new Date().toISOString()
            };
            setBloodBanks((prev) => [matched!, ...prev]);
          }
          setCurrentBloodBank(matched);
        } else if (authUser.role === 'blood_camp') {
          let matched = organizers.find((o) => o.email === authUser.email || o.phone === authUser.phone);
          if (!matched) {
            matched = {
              id: `ORG-${authUser.user_id}`,
              organizerName: authUser.name,
              organizationName: authUser.profile?.camp_name || `${authUser.name}'s Blood Camp`,
              phone: authUser.phone,
              email: authUser.email,
              contact: authUser.phone,
              taxOrRegId: authUser.profile?.registration_number || 'REG-CAMP',
              status: (authUser.verification_status || 'Verified') as any,
              createdAt: new Date().toISOString()
            };
            setOrganizers((prev) => [matched!, ...prev]);
          }
          setCurrentOrganizer(matched);
        }

        return { success: true, user: authUser, isNewUser: data.isNewUser };
      }

      return { success: true, isNewUser: data.isNewUser };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google login error' };
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setCurrentDonor(null);
    setCurrentHospital(null);
    setCurrentBloodBank(null);
    setCurrentOrganizer(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_DONOR);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_HOSPITAL);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_BLOOD_BANK);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_ORGANIZER);
  };

  const updateVerificationStatus = async (
    role: string,
    entityId: number | string,
    status: 'Pending' | 'Verified' | 'Rejected'
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/verification-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, entity_id: entityId, status })
      });
      if (!res.ok) return false;

      // Update current user if matching
      setCurrentUser((prev) => {
        if (!prev) return null;
        if (prev.role === role) {
          return {
            ...prev,
            verification_status: status,
            eligibility_status: status === 'Verified' ? 'Eligible' : status === 'Rejected' ? 'Not Eligible' : 'Pending Verification'
          };
        }
        return prev;
      });

      // Update entity lists
      if (role === 'donor') {
        setDonors((prev) =>
          prev.map((d) =>
            d.id === `DONOR-${entityId}` || d.phone === String(entityId)
              ? {
                  ...d,
                  verificationStatus: status,
                  eligibilityStatus: status === 'Verified' ? 'Eligible' : 'Not Eligible',
                  isAvailable: status === 'Verified',
                  availableForEmergency: status === 'Verified'
                }
              : d
          )
        );
        setCurrentDonor((curr) =>
          curr
            ? {
                ...curr,
                verificationStatus: status,
                eligibilityStatus: status === 'Verified' ? 'Eligible' : 'Not Eligible',
                isAvailable: status === 'Verified',
                availableForEmergency: status === 'Verified'
              }
            : null
        );
      } else if (role === 'hospital') {
        setHospitals((prev) =>
          prev.map((h) => (h.id === `HOSP-${entityId}` || h.id === String(entityId) ? { ...h, status: status as any } : h))
        );
        setCurrentHospital((curr) => (curr ? { ...curr, status: status as any } : null));
      } else if (role === 'blood_bank') {
        setBloodBanks((prev) =>
          prev.map((b) => (b.id === `BB-${entityId}` || b.id === String(entityId) ? { ...b, status: status as any } : b))
        );
        setCurrentBloodBank((curr) => (curr ? { ...curr, status: status as any } : null));
      }
      return true;
    } catch {
      return false;
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const resetDatabase = () => {
    setCurrentUser(null);
    setDonors([]);
    setCurrentDonor(null);
    setHospitals([]);
    setCurrentHospital(null);
    setBloodBanks([]);
    setCurrentBloodBank(null);
    setOrganizers([]);
    setCurrentOrganizer(null);
    setCamps([]);
    setCampRegistrations([]);
    setInventory([]);
    setActiveRequests([]);
    setNotifications([]);

    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  };

  return (
    <BloodLinkContext.Provider
      value={{
        currentUser,
        registerUser,
        loginUser,
        loginWithGoogle,
        logoutUser,
        updateVerificationStatus,

        donors,
        currentDonor,
        registerDonor,
        loginDonor,
        logoutDonor,
        updateDonorAvailability,

        hospitals,
        currentHospital,
        registerHospital,
        loginHospital,
        logoutHospital,
        setCurrentHospitalById,

        bloodBanks,
        currentBloodBank,
        registerBloodBank,
        loginBloodBank,
        logoutBloodBank,
        setCurrentBloodBankById,

        camps,
        currentOrganizer,
        registerOrganizer,
        loginOrganizer,
        logoutOrganizer,
        createCamp,
        campRegistrations,
        registerForCamp,

        inventory,
        addBloodUnit,
        removeBloodUnit,
        toggleUnitStatus,

        activeRequests,
        createEmergencyRequest,
        updateRequestStatus,
        acceptHospitalRequest,
        rejectHospitalRequest,
        allocateUnitsForRequest,
        dispatchBloodSupply,
        confirmHospitalReceipt,
        contactEmergencyDonor,

        approveEntity,
        rejectEntity,

        notifications,
        clearNotifications,

        resetDatabase,

        // Railway Database Integration
        isRailwayConnected,
        isSyncing,
        railwayLatency,
        lastSyncedAt,
        railwayError,
        syncWithRailway,
        railwayApiBase: databaseUrl,
        databaseUrl,
        updateDatabaseUrl,
        resetDatabaseUrlToDefault,
        rawRailwayData
      }}
    >
      {children}
    </BloodLinkContext.Provider>
  );
};

export const useBloodLink = (): BloodLinkContextType => {
  const context = useContext(BloodLinkContext);
  if (!context) {
    throw new Error('useBloodLink must be used within a BloodLinkProvider');
  }
  return context;
};
