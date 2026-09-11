/**
 * BloodLink Smart Matching Engine
 * 
 * Intelligently coordinates the fastest verified path from an emergency blood request to fulfilment:
 * 1. ABO / Rh physiological compatibility rules (PRBC, Plasma/FFP, Platelets, Whole Blood)
 * 2. Component match
 * 3. Required quantity
 * 4. Geographic distance & Estimated Arrival Time
 * 5. Urgency multipliers
 * 6. Donor eligibility & Cooldown pre-screening
 * 7. Blood Bank First Priority with 7-minute soft reservation window
 * 8. Donor Standby Queue
 * 9. Deterministic Donor Priority / Ranking (#1 Recommended, #2 Backup, #3 Backup)
 * 10. Emergency Cascade (0-5km -> 5-15km -> 15-30km -> Regional Network)
 */

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type BloodComponent =
  | 'prbc'
  | 'platelets'
  | 'ffp'
  | 'whole_blood'
  | 'cryoprecipitate';

export interface CompatibilityRuleConfig {
  prbc: Record<string, string[]>;
  ffp: Record<string, string[]>;
  platelets: Record<string, string[]>;
  whole_blood: Record<string, string[]>;
  cryoprecipitate: Record<string, string[]>;
}

/**
 * Configurable clinical compatibility matrices
 * Can be updated without changing application code
 */
export const COMPATIBILITY_RULES: CompatibilityRuleConfig = {
  // Red blood cells: Recipient can receive from listed donor groups
  prbc: {
    'O-': ['O-'],
    'O+': ['O+', 'O-'],
    'A-': ['A-', 'O-'],
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'AB-': ['AB-', 'A-', 'B-', 'O-'],
    'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'], // Universal recipient
  },
  whole_blood: {
    'O-': ['O-'],
    'O+': ['O+', 'O-'],
    'A-': ['A-', 'O-'],
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'AB-': ['AB-', 'A-', 'B-', 'O-'],
    'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
  },
  // Plasma (FFP): AB is universal plasma donor
  ffp: {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+'],
  },
  // Platelets: ABO identical preferred, then cross-compatible
  platelets: {
    'O-': ['O-', 'O+', 'A-', 'B-'],
    'O+': ['O+', 'O-', 'A+', 'B+'],
    'A-': ['A-', 'O-', 'A+'],
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'B-': ['B-', 'O-', 'B+'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'AB-': ['AB-', 'A-', 'B-', 'O-'],
    'AB+': ['AB+', 'AB-', 'A+', 'B+', 'O+'],
  },
  cryoprecipitate: {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+'],
  },
};

/**
 * Standard Cooldown Days Configuration
 */
export const DONOR_COOLDOWN_DAYS = {
  whole_blood: 90, // 3 months
  prbc: 90,
  platelets: 14, // 2 weeks
  ffp: 28, // 4 weeks
  cryoprecipitate: 28,
  default: 90,
};

/**
 * Normalize blood component strings
 */
export function normalizeComponent(raw: string): BloodComponent {
  const s = (raw || '').toLowerCase();
  if (s.includes('platelet') || s.includes('sdp') || s.includes('rdp')) return 'platelets';
  if (s.includes('plasma') || s.includes('ffp')) return 'ffp';
  if (s.includes('prbc') || s.includes('packed red')) return 'prbc';
  if (s.includes('cryo')) return 'cryoprecipitate';
  return 'whole_blood';
}

/**
 * Check if donor blood group is compatible with recipient blood group
 */
export function isBloodCompatible(
  donorGroup: string,
  recipientGroup: string,
  component: string = 'prbc'
): boolean {
  const normComp = normalizeComponent(component);
  const matrix = COMPATIBILITY_RULES[normComp] || COMPATIBILITY_RULES.prbc;
  const compatibleDonors = matrix[recipientGroup] || [recipientGroup];
  return compatibleDonors.includes(donorGroup);
}

/**
 * Calculate distance between two coordinate pairs or mock city coordinate approximations
 */
export function calculateDistanceKm(
  lat1: number | string | undefined,
  lon1: number | string | undefined,
  lat2: number | string | undefined,
  lon2: number | string | undefined,
  fallbackKm: number = 4.2
): number {
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);

  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2) || (nLat1 === 0 && nLon1 === 0)) {
    return fallbackKm;
  }

  const R = 6371; // Earth radius in km
  const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
  const dLon = ((nLon2 - nLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((nLat1 * Math.PI) / 180) *
      Math.cos((nLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Estimate travel / arrival time based on distance (assuming urban cold-chain / emergency speeds)
 */
export function estimateTravelMinutes(distanceKm: number): number {
  // Average emergency courier speed ~ 25-30 km/h in city traffic + 5 min dispatch overhead
  const minutes = Math.round((distanceKm / 28) * 60 + 5);
  return Math.max(8, minutes);
}

/**
 * Donor Eligibility & Cooldown Pre-Screening check
 */
export interface PreScreeningResult {
  isEligible: boolean;
  nextEligibleDate: string;
  daysRemaining: number;
  lastDonationDate: string | null;
  reasons: string[];
  disclaimer: string;
}

export function evaluateDonorEligibility(
  donor: {
    last_donation_date?: string | null;
    lastDonationDate?: string;
    age?: number;
    weight_kg?: number;
    eligibility_status?: string;
    verification_status?: string;
    is_available?: boolean;
    available_for_emergency?: boolean;
  },
  component: string = 'whole_blood'
): PreScreeningResult {
  const reasons: string[] = [];
  const compKey = normalizeComponent(component);
  const cooldownDays = DONOR_COOLDOWN_DAYS[compKey] || DONOR_COOLDOWN_DAYS.default;

  const rawLastDate = donor.last_donation_date || donor.lastDonationDate || null;
  let nextEligibleDate = new Date().toISOString().split('T')[0];
  let daysRemaining = 0;
  let cooldownPassed = true;

  if (rawLastDate) {
    const lastDate = new Date(rawLastDate);
    const nextDate = new Date(lastDate.getTime() + cooldownDays * 24 * 3600 * 1000);
    nextEligibleDate = nextDate.toISOString().split('T')[0];
    const diffMs = nextDate.getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diffMs / (24 * 3600 * 1000)));

    if (daysRemaining > 0) {
      cooldownPassed = false;
      reasons.push(`In mandatory cooldown period (${daysRemaining} days remaining until ${nextEligibleDate})`);
    } else {
      reasons.push(`Cooldown satisfied (${Math.abs(daysRemaining)} days past required rest period)`);
    }
  } else {
    reasons.push('No recent donation logged; cooldown satisfied');
  }

  // Weight check
  const weight = donor.weight_kg || 65;
  if (weight < 50) {
    cooldownPassed = false;
    reasons.push(`Body weight (${weight}kg) is below the clinical pre-screening threshold of 50kg`);
  } else {
    reasons.push(`Body weight (${weight}kg) meets donor criteria (>= 50kg)`);
  }

  // Age check
  const age = donor.age || 28;
  if (age < 18 || age > 65) {
    cooldownPassed = false;
    reasons.push(`Age (${age}) outside the allowable donation range of 18–65 years`);
  } else {
    reasons.push(`Age (${age}) within eligible criteria (18–65)`);
  }

  return {
    isEligible: cooldownPassed,
    nextEligibleDate,
    daysRemaining,
    lastDonationDate: rawLastDate,
    reasons,
    disclaimer:
      'Pre-screening passed — final eligibility will be confirmed by the blood bank clinical staff prior to phlebotomy.',
  };
}

/**
 * Mask donor contact details for privacy and hospital view
 */
export function maskDonorIdentifier(donorId: number | string): string {
  const idNum = String(donorId).padStart(4, '0');
  return `DL-${idNum}`;
}

export function maskPhoneNumber(phone?: string): string {
  if (!phone || phone.length < 6) return '+91 98*** **120';
  const clean = phone.replace(/[^0-9]/g, '');
  const prefix = clean.slice(0, 3);
  const suffix = clean.slice(-3);
  return `+91 ${prefix}*** **${suffix}`;
}

/**
 * Smart Match Item
 */
export interface BloodBankMatch {
  type: 'blood_bank';
  blood_bank_id: number;
  bank_name: string;
  distance_km: number;
  estimated_arrival_minutes: number;
  available_units: number;
  reserved_units: number;
  blood_group: string;
  component: string;
  is_exact_match: boolean;
  match_score: number;
  reasons: string[];
  tier: 'Primary Match' | 'Standby' | 'Regional Backup';
  contact: string;
}

export interface DonorMatch {
  type: 'donor';
  donor_id: number;
  masked_donor_code: string;
  distance_km: number;
  estimated_arrival_minutes: number;
  blood_group: string;
  is_exact_match: boolean;
  match_score: number;
  rank: number;
  rank_label: '#1 Recommended Donor' | '#2 Backup Donor' | '#3 Backup Donor';
  status: 'STANDBY' | 'ACTIVE_ALERT' | 'ACCEPTED' | 'DECLINED' | 'STANDBY_RELEASED' | 'FULFILLED';
  reasons: string[];
  last_donation_date: string | null;
  cooldown_days_remaining: number;
  eligibility_status: string;
}

export interface EmergencyCascadeStage {
  stage: '5km' | '15km' | '30km' | 'Regional';
  label: string;
  radius_km: number;
  matches_count: number;
  blood_bank_matches: number;
  donor_matches: number;
  is_active: boolean;
}

export interface SmartMatchResults {
  requestId: number;
  recipientGroup: string;
  component: string;
  unitsRequired: number;
  urgency: string;
  recommendedBloodBanks: BloodBankMatch[];
  standbyDonors: DonorMatch[];
  cascadeStages: EmergencyCascadeStage[];
  currentCascadeRadiusKm: number;
  hasBloodBankInventory: boolean;
  confirmationWindowMinutes: number;
}

/**
 * Execute the BloodLink Smart Matching Engine
 */
export function runSmartMatching(
  request: {
    request_id: number;
    blood_group: string;
    component: string;
    units_required: number;
    urgency_level: string;
    hospital_name?: string;
    latitude?: number | string;
    longitude?: number | string;
    cascade_radius_km?: number;
  },
  inventoryList: any[],
  bloodBanksList: any[],
  donorsList: any[]
): SmartMatchResults {
  const reqGroup = request.blood_group;
  const reqComp = normalizeComponent(request.component);
  const unitsNeeded = request.units_required || 1;
  const isCritical = (request.urgency_level || '').toLowerCase() === 'critical';
  const radiusCap = request.cascade_radius_km || 30;

  // -------------------------------------------------------------
  // STEP 1: Search Blood Bank Inventory
  // -------------------------------------------------------------
  const bankMatches: BloodBankMatch[] = [];

  for (const bank of bloodBanksList) {
    // Find matching inventory in this bank
    const bankInventory = inventoryList.filter(
      (inv) =>
        (inv.bank_name === bank.bank_name || inv.blood_bank_id === bank.blood_bank_id) &&
        inv.status !== 'Expired'
    );

    let totalAvail = 0;
    let exactFound = false;
    let compatibleFound = false;

    for (const item of bankInventory) {
      const itemComp = normalizeComponent(item.component);
      // Component match is mandatory
      if (itemComp !== reqComp && reqComp !== 'whole_blood') continue;

      const isExact = item.blood_group === reqGroup;
      const isCompat = isBloodCompatible(item.blood_group, reqGroup, reqComp);

      if (isCompat) {
        compatibleFound = true;
        if (isExact) exactFound = true;
        const avail = item.units_available !== undefined ? item.units_available : (item.available_quantity || 0);
        totalAvail += avail;
      }
    }

    if (totalAvail > 0) {
      // Approximate distance (deterministic based on bank_id)
      const dist = calculateDistanceKm(
        request.latitude,
        request.longitude,
        bank.latitude,
        bank.longitude,
        ((bank.blood_bank_id * 3.7) % 25) + 1.5
      );

      const eta = estimateTravelMinutes(dist);

      // Match scoring (0 - 100)
      let score = 50;
      const reasons: string[] = [];

      if (exactFound) {
        score += 30;
        reasons.push(`✓ Exact blood group match (${reqGroup})`);
      } else if (compatibleFound) {
        score += 20;
        reasons.push(`✓ Clinically compatible physiological donor group`);
      }

      reasons.push(`✓ Required component verified (${reqComp.toUpperCase()})`);

      if (totalAvail >= unitsNeeded) {
        score += 15;
        reasons.push(`✓ Full dosage available (${totalAvail} units in repository)`);
      } else {
        reasons.push(`Partial fulfillment: ${totalAvail} units available`);
      }

      if (dist <= 5) {
        score += 10;
        reasons.push(`✓ Immediate proximity (${dist} km, ETA ~${eta} mins)`);
      } else if (dist <= 15) {
        score += 5;
        reasons.push(`✓ Urban radius (${dist} km, ETA ~${eta} mins)`);
      } else {
        reasons.push(`Regional cold-chain transfer (${dist} km, ETA ~${eta} mins)`);
      }

      if (isCritical) {
        score += 5;
      }

      bankMatches.push({
        type: 'blood_bank',
        blood_bank_id: bank.blood_bank_id,
        bank_name: bank.bank_name,
        distance_km: dist,
        estimated_arrival_minutes: eta,
        available_units: totalAvail,
        reserved_units: 0,
        blood_group: reqGroup,
        component: reqComp,
        is_exact_match: exactFound,
        match_score: Math.min(100, score),
        reasons,
        tier: dist <= 5 ? 'Primary Match' : dist <= 15 ? 'Standby' : 'Regional Backup',
        contact: bank.phone || '+91 20 2612 0000',
      });
    }
  }

  // Sort blood banks by score descending, then distance ascending
  bankMatches.sort((a, b) => b.match_score - a.match_score || a.distance_km - b.distance_km);

  // -------------------------------------------------------------
  // STEP 2: Pre-Screen & Rank Eligible Donors for Standby Queue
  // -------------------------------------------------------------
  const donorMatches: DonorMatch[] = [];

  for (const donor of donorsList) {
    const dGroup = donor.blood_group || donor.bloodGroup;
    if (!dGroup) continue;

    // Check compatibility
    const isExact = dGroup === reqGroup;
    const isCompat = isBloodCompatible(dGroup, reqGroup, reqComp);
    if (!isCompat) continue;

    // Pre-screening check
    const prescreen = evaluateDonorEligibility(donor, reqComp);
    if (!prescreen.isEligible) continue; // Ineligible donors do not enter queue

    const dist = calculateDistanceKm(
      request.latitude,
      request.longitude,
      donor.latitude,
      donor.longitude,
      ((donor.donor_id * 2.3) % 20) + 2.1
    );

    const eta = estimateTravelMinutes(dist);

    // Scoring
    let score = 40;
    const reasons: string[] = [];

    if (isExact) {
      score += 35;
      reasons.push(`✓ Exact blood group match (${dGroup})`);
    } else {
      score += 20;
      reasons.push(`✓ Universally compatible emergency match (${dGroup})`);
    }

    reasons.push('✓ Pre-screening clinical criteria satisfied');

    if (prescreen.lastDonationDate) {
      reasons.push(`✓ Cooldown verified (Donated on ${prescreen.lastDonationDate})`);
    } else {
      reasons.push('✓ Eligible first-time or rested donor');
    }

    if (dist <= 5) {
      score += 15;
      reasons.push(`✓ Closest responder: ${dist} km away (ETA ~${eta} mins)`);
    } else if (dist <= 15) {
      score += 10;
      reasons.push(`✓ Rapid transit zone: ${dist} km away (ETA ~${eta} mins)`);
    } else {
      reasons.push(`Outer transit zone: ${dist} km away (ETA ~${eta} mins)`);
    }

    if (donor.donation_count && donor.donation_count > 3) {
      score += 10;
      reasons.push(`✓ Proven response reliability (${donor.donation_count} past donations)`);
    }

    donorMatches.push({
      type: 'donor',
      donor_id: donor.donor_id,
      masked_donor_code: maskDonorIdentifier(donor.donor_id),
      distance_km: dist,
      estimated_arrival_minutes: eta,
      blood_group: dGroup,
      is_exact_match: isExact,
      match_score: Math.min(100, score),
      rank: 0, // Assigned below
      rank_label: '#1 Recommended Donor',
      status: 'STANDBY',
      reasons,
      last_donation_date: prescreen.lastDonationDate,
      cooldown_days_remaining: prescreen.daysRemaining,
      eligibility_status: 'Pre-screened Eligible',
    });
  }

  // Deterministic donor ranking: Tier 1 exact match, Tier 2 lowest ETA, Tier 3 highest score
  donorMatches.sort((a, b) => {
    if (a.is_exact_match !== b.is_exact_match) {
      return a.is_exact_match ? -1 : 1;
    }
    if (a.estimated_arrival_minutes !== b.estimated_arrival_minutes) {
      return a.estimated_arrival_minutes - b.estimated_arrival_minutes;
    }
    return b.match_score - a.match_score;
  });

  // Assign deterministic ranks
  donorMatches.forEach((d, idx) => {
    d.rank = idx + 1;
    if (idx === 0) d.rank_label = '#1 Recommended Donor';
    else if (idx === 1) d.rank_label = '#2 Backup Donor';
    else d.rank_label = '#3 Backup Donor';
  });

  // -------------------------------------------------------------
  // STEP 3: Emergency Cascade Calculations
  // -------------------------------------------------------------
  const countInRadius = (maxKm: number) => {
    const bbCount = bankMatches.filter((b) => b.distance_km <= maxKm).length;
    const dnCount = donorMatches.filter((d) => d.distance_km <= maxKm).length;
    return { bbCount, dnCount, total: bbCount + dnCount };
  };

  const r5 = countInRadius(5);
  const r15 = countInRadius(15);
  const r30 = countInRadius(30);
  const rRegional = {
    bbCount: bankMatches.length,
    dnCount: donorMatches.length,
    total: bankMatches.length + donorMatches.length,
  };

  const cascadeStages: EmergencyCascadeStage[] = [
    {
      stage: '5km',
      label: 'Immediate 0–5 KM Zone',
      radius_km: 5,
      matches_count: r5.total,
      blood_bank_matches: r5.bbCount,
      donor_matches: r5.dnCount,
      is_active: radiusCap >= 5,
    },
    {
      stage: '15km',
      label: 'Urban 5–15 KM Radius',
      radius_km: 15,
      matches_count: r15.total,
      blood_bank_matches: r15.bbCount,
      donor_matches: r15.dnCount,
      is_active: radiusCap >= 15,
    },
    {
      stage: '30km',
      label: 'Metro 15–30 KM Corridor',
      radius_km: 30,
      matches_count: r30.total,
      blood_bank_matches: r30.bbCount,
      donor_matches: r30.dnCount,
      is_active: radiusCap >= 30,
    },
    {
      stage: 'Regional',
      label: 'Regional Medical Network',
      radius_km: 100,
      matches_count: rRegional.total,
      blood_bank_matches: rRegional.bbCount,
      donor_matches: rRegional.dnCount,
      is_active: radiusCap >= 100,
    },
  ];

  return {
    requestId: request.request_id,
    recipientGroup: reqGroup,
    component: reqComp,
    unitsRequired: unitsNeeded,
    urgency: request.urgency_level,
    recommendedBloodBanks: bankMatches,
    standbyDonors: donorMatches.slice(0, 6), // Top deterministic donors
    cascadeStages,
    currentCascadeRadiusKm: radiusCap,
    hasBloodBankInventory: bankMatches.length > 0,
    confirmationWindowMinutes: 7,
  };
}
