import { Router } from 'express';
import { db } from '../db';

export const donorsRouter = Router();

// GET /api/donors - list all donors (conforms to existing Railway schema)
donorsRouter.get('/', (req, res) => {
  const donors = db.getDonors();
  res.json(donors);
});

// GET /api/donors/:id
donorsRouter.get('/:id', (req, res) => {
  const numId = Number(String(req.params.id).replace(/\D/g, ''));
  const donor = db.getDonorById(numId);
  if (!donor) {
    return res.status(404).json({ error: 'Donor not found' });
  }
  res.json(donor);
});

// POST /api/donors - register donor
donorsRouter.post('/', (req, res) => {
  const {
    name,
    fullName,
    phone,
    city,
    blood_group,
    bloodGroup,
    email,
    age,
    gender,
    area,
    state,
    available_for_emergency,
    availableForEmergency
  } = req.body;

  const donorName = name || fullName;
  const donorGroup = blood_group || bloodGroup;

  if (!donorName || !phone || !donorGroup) {
    return res.status(400).json({
      error: 'Missing required donor registration fields: name, phone, and blood_group are required'
    });
  }

  // Check if donor already registered by phone
  const existing = db.findDonorByAuth(phone);
  if (existing) {
    return res.status(409).json({
      error: 'A donor with this phone number is already registered',
      donor_id: existing.donor_id
    });
  }

  const created = db.addDonor({
    name: donorName,
    phone,
    city: city || 'Pune',
    blood_group: donorGroup,
    email: email || '',
    age: age ? Number(age) : 25,
    gender: gender || 'Not specified',
    area: area || '',
    state: state || 'Maharashtra',
    eligibility_status: 'eligible',
    verification_status: 'verified',
    available_for_emergency: available_for_emergency ?? availableForEmergency ?? true,
    is_available: true
  });

  res.status(201).json({
    message: 'Donor registered successfully',
    donor_id: created.donor_id,
    donor: created
  });
});

// PATCH /api/donors/:id/availability
donorsRouter.patch('/:id/availability', (req, res) => {
  const numId = Number(String(req.params.id).replace(/\D/g, ''));
  const { is_available, isAvailable } = req.body;
  const targetAvailable = is_available ?? isAvailable;

  if (typeof targetAvailable !== 'boolean') {
    return res.status(400).json({ error: 'is_available boolean field is required' });
  }

  const updated = db.updateDonorAvailability(numId, targetAvailable);
  if (!updated) {
    return res.status(404).json({ error: 'Donor not found' });
  }

  res.json({ message: 'Availability updated', donor: updated });
});
