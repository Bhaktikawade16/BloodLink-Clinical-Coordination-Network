/**
 * Railway Database Integration Service for BloodLink
 * Backend Database URL: https://bloodlink-api-production.up.railway.app
 */

export const DEFAULT_DATABASE_URL = 'https://bloodlink-api-production.up.railway.app';

export const getActiveDatabaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('bloodlink_railway_api_url');
    // If the saved URL is a custom remote URL that isn't the production Railway root, use it;
    // Otherwise use relative '' which connects directly to our full-stack Express backend
    // which synchronizes with the Railway database and supports all CRUD operations.
    if (saved && saved.trim() && saved !== DEFAULT_DATABASE_URL) {
      return saved.trim().replace(/\/+$/, '');
    }
  }
  return '';
};

export const setActiveDatabaseUrl = (url: string): string => {
  const clean = url.trim().replace(/\/+$/, '');
  if (typeof window !== 'undefined') {
    localStorage.setItem('bloodlink_railway_api_url', clean);
  }
  return clean;
};

export const resetActiveDatabaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bloodlink_railway_api_url');
  }
  return DEFAULT_DATABASE_URL;
};

export const RAILWAY_API_BASE = getActiveDatabaseUrl();

export interface RailwayDonor {
  donor_id: number;
  name: string;
  phone: string;
  city: string;
  blood_group: string;
  eligibility_status: string;
  verification_status: string;
  last_donation_date: string;
}

export interface RailwayHospital {
  hospital_id: number;
  user_id: number;
  hospital_name: string;
  registration_number: string;
  address: string;
  verification_status: string;
}

export interface RailwayBloodBank {
  blood_bank_id: number;
  user_id: number;
  bank_name: string;
  license_number: string;
  address: string;
  verification_status: string;
}

export interface RailwayCamp {
  camp_id: number;
  organiser_id: number;
  blood_bank_id: number;
  location: string;
  latitude: string;
  longitude: string;
  camp_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  required_blood_group: string;
  status: string;
  partner_blood_bank: string;
}

export interface RailwayInventory {
  inventory_id: number;
  bank_name: string;
  blood_group: string;
  component: string;
  units_available: number;
  units_reserved: number;
  expire_date: string;
}

export interface RailwayBloodRequest {
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
}

export interface CreateBloodRequestPayload {
  request_user_id?: number;
  hospital_id?: number;
  patient_name: string;
  blood_group: string;
  component: string;
  units_required: number;
  urgency_level: string;
  required_by: string;
  location: string;
  latitude?: number;
  longitude?: number;
}

export const RailwayApi = {
  /**
   * Healthcheck the Railway database server
   */
  async checkHealth(): Promise<{ ok: boolean; message: string; latencyMs: number }> {
    const baseUrl = getActiveDatabaseUrl();
    const start = performance.now();
    try {
      const res = await fetch(`${baseUrl}/`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });
      const latencyMs = Math.round(performance.now() - start);
      if (res.ok) {
        const data = await res.json();
        return { ok: true, message: data.message || 'Connected', latencyMs };
      }
      return { ok: false, message: `HTTP ${res.status}`, latencyMs };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      return { ok: false, message: err.message || 'Connection failed', latencyMs };
    }
  },

  /**
   * Fetch all donors registered in the Railway database
   */
  async getDonors(): Promise<RailwayDonor[]> {
    const baseUrl = getActiveDatabaseUrl();
    const res = await fetch(`${baseUrl}/api/donors`);
    if (!res.ok) throw new Error(`Failed to fetch donors: ${res.statusText}`);
    return res.json();
  },

  /**
   * Fetch all hospitals in the Railway database
   */
  async getHospitals(): Promise<RailwayHospital[]> {
    const baseUrl = getActiveDatabaseUrl();
    const res = await fetch(`${baseUrl}/api/hospitals`);
    if (!res.ok) throw new Error(`Failed to fetch hospitals: ${res.statusText}`);
    return res.json();
  },

  /**
   * Fetch all blood banks in the Railway database
   */
  async getBloodBanks(): Promise<RailwayBloodBank[]> {
    const baseUrl = getActiveDatabaseUrl();
    const res = await fetch(`${baseUrl}/api/blood-banks`);
    if (!res.ok) throw new Error(`Failed to fetch blood banks: ${res.statusText}`);
    return res.json();
  },

  /**
   * Fetch all camps in the Railway database
   */
  async getCamps(): Promise<RailwayCamp[]> {
    const baseUrl = getActiveDatabaseUrl();
    const res = await fetch(`${baseUrl}/api/camps`);
    if (!res.ok) throw new Error(`Failed to fetch camps: ${res.statusText}`);
    return res.json();
  },

  /**
   * Fetch blood inventory from the Railway database
   */
  async getInventory(): Promise<RailwayInventory[]> {
    const baseUrl = getActiveDatabaseUrl();
    const res = await fetch(`${baseUrl}/api/inventory`);
    if (!res.ok) throw new Error(`Failed to fetch inventory: ${res.statusText}`);
    return res.json();
  },

  /**
   * Fetch emergency blood requests from the Railway database
   */
  async getBloodRequests(): Promise<RailwayBloodRequest[]> {
    const baseUrl = getActiveDatabaseUrl();
    const res = await fetch(`${baseUrl}/api/blood-requests`);
    if (!res.ok) throw new Error(`Failed to fetch blood requests: ${res.statusText}`);
    return res.json();
  },

  /**
   * Post a new emergency blood requisition directly to the Railway database
   */
  async createBloodRequest(payload: CreateBloodRequestPayload): Promise<{ request_id: number; message: string }> {
    const baseUrl = getActiveDatabaseUrl();
    // Fill required defaults if not supplied
    const body = {
      request_user_id: payload.request_user_id || 2,
      hospital_id: payload.hospital_id || 1,
      patient_name: payload.patient_name || 'Emergency Patient',
      blood_group: payload.blood_group,
      component: payload.component.toLowerCase().replace(/ /g, '_'),
      units_required: Number(payload.units_required),
      urgency_level: payload.urgency_level.toLowerCase(),
      required_by: payload.required_by.includes(' ')
        ? payload.required_by
        : `${payload.required_by} 18:00:00`,
      location: payload.location || 'Pune Regional Hospital',
      latitude: payload.latitude ?? 18.5308,
      longitude: payload.longitude ?? 73.8747
    };

    const res = await fetch(`${baseUrl}/api/blood-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP error ${res.status}`);
    }

    return res.json();
  },

  /**
   * Register a new donor on the backend
   */
  async registerDonor(data: any): Promise<any> {
    const baseUrl = getActiveDatabaseUrl();
    const res = await fetch(`${baseUrl}/api/donors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to register donor: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Update donor emergency availability
   */
  async updateDonorAvailability(donorId: number | string, isAvailable: boolean): Promise<any> {
    const baseUrl = getActiveDatabaseUrl();
    const numId = Number(String(donorId).replace(/\D/g, ''));
    const res = await fetch(`${baseUrl}/api/donors/${numId}/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ is_available: isAvailable })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update availability: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Register a new hospital on the backend
   */
  async registerHospital(data: any): Promise<any> {
    const baseUrl = getActiveDatabaseUrl();
    const res = await fetch(`${baseUrl}/api/hospitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to register hospital: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Admin verify/reject hospital
   */
  async updateHospitalStatus(hospitalId: number | string, status: 'verified' | 'rejected' | 'unverified'): Promise<any> {
    const baseUrl = getActiveDatabaseUrl();
    const numId = Number(String(hospitalId).replace(/\D/g, ''));
    const res = await fetch(`${baseUrl}/api/hospitals/${numId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update hospital status: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Register a new blood bank on the backend
   */
  async registerBloodBank(data: any): Promise<any> {
    const baseUrl = getActiveDatabaseUrl();
    const res = await fetch(`${baseUrl}/api/blood-banks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to register blood bank: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Admin verify/reject blood bank
   */
  async updateBloodBankStatus(bankId: number | string, status: 'verified' | 'rejected' | 'unverified'): Promise<any> {
    const baseUrl = getActiveDatabaseUrl();
    const numId = Number(String(bankId).replace(/\D/g, ''));
    const res = await fetch(`${baseUrl}/api/blood-banks/${numId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update blood bank status: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Add a blood inventory unit
   */
  async addInventoryUnit(data: any): Promise<any> {
    const baseUrl = getActiveDatabaseUrl();
    const res = await fetch(`${baseUrl}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to add inventory unit: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Remove a blood inventory unit
   */
  async removeInventoryUnit(unitId: string | number): Promise<any> {
    const baseUrl = getActiveDatabaseUrl();
    const res = await fetch(`${baseUrl}/api/inventory/${unitId}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to delete unit: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Toggle inventory unit status
   */
  async toggleInventoryStatus(unitId: string | number): Promise<any> {
    const baseUrl = getActiveDatabaseUrl();
    const res = await fetch(`${baseUrl}/api/inventory/${unitId}/status`, {
      method: 'PATCH',
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to toggle unit: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Create camp on backend
   */
  async createCamp(campData: any): Promise<any> {
    const baseUrl = getActiveDatabaseUrl();
    const res = await fetch(`${baseUrl}/api/camps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(campData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to create camp: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Register attendee for camp
   */
  async registerCampAttendee(campId: string | number, attendeeData: any): Promise<any> {
    const baseUrl = getActiveDatabaseUrl();
    const numId = Number(String(campId).replace(/\D/g, ''));
    const res = await fetch(`${baseUrl}/api/camps/${numId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(attendeeData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to register for camp: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Blood bank accepts requisition
   */
  async acceptBloodRequest(requestId: string | number, bloodBankId: string, bloodBankName: string): Promise<any> {
    const baseUrl = getActiveDatabaseUrl();
    const numId = Number(String(requestId).replace(/\D/g, ''));
    const res = await fetch(`${baseUrl}/api/blood-requests/${numId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ blood_bank_id: bloodBankId, blood_bank_name: bloodBankName })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to accept blood request: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Blood bank rejects requisition
   */
  async rejectBloodRequest(requestId: string | number, bloodBankId: string): Promise<any> {
    const baseUrl = getActiveDatabaseUrl();
    const numId = Number(String(requestId).replace(/\D/g, ''));
    const res = await fetch(`${baseUrl}/api/blood-requests/${numId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ blood_bank_id: bloodBankId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to reject blood request: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Blood bank allocates units
   */
  async allocateBloodUnits(requestId: string | number, units: number): Promise<any> {
    const baseUrl = getActiveDatabaseUrl();
    const numId = Number(String(requestId).replace(/\D/g, ''));
    const res = await fetch(`${baseUrl}/api/blood-requests/${numId}/allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ units })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to allocate units: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Blood bank dispatches blood supply
   */
  async dispatchBloodSupply(requestId: string | number, trackingNumber?: string): Promise<any> {
    const baseUrl = getActiveDatabaseUrl();
    const numId = Number(String(requestId).replace(/\D/g, ''));
    const res = await fetch(`${baseUrl}/api/blood-requests/${numId}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ tracking_number: trackingNumber })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to dispatch blood supply: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Hospital confirms receipt
   */
  async receiveBloodSupply(requestId: string | number): Promise<any> {
    const baseUrl = getActiveDatabaseUrl();
    const numId = Number(String(requestId).replace(/\D/g, ''));
    const res = await fetch(`${baseUrl}/api/blood-requests/${numId}/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({})
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to confirm receipt: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Universal Login API
   */
  async login(role: string, identifier: string, password?: string): Promise<any> {
    const baseUrl = getActiveDatabaseUrl();
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ role, identifier, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Authentication failed: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Trigger Railway Database Sync
   */
  async triggerAdminSync(): Promise<any> {
    const baseUrl = getActiveDatabaseUrl();
    const res = await fetch(`${baseUrl}/api/admin/sync`, {
      method: 'POST',
      headers: { Accept: 'application/json' }
    });
    return res.json();
  },

  /**
   * Get Server & Database Status
   */
  async getAdminStats(): Promise<any> {
    const baseUrl = getActiveDatabaseUrl();
    const res = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Accept: 'application/json' }
    });
    return res.json();
  }
};
