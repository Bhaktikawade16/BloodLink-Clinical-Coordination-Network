import { Router } from 'express';
import { db } from '../db';

export const hospitalsRouter = Router();

// GET /api/hospitals - list all hospitals (conforms to existing Railway schema)
hospitalsRouter.get('/', (req, res) => {
  const hospitals = db.getHospitals();
  res.json(hospitals);
});

// GET /api/hospitals/:id
hospitalsRouter.get('/:id', (req, res) => {
  const numId = Number(String(req.params.id).replace(/\D/g, ''));
  const hospital = db.getHospitalById(numId);
  if (!hospital) {
    return res.status(404).json({ error: 'Hospital not found' });
  }
  res.json(hospital);
});

// POST /api/hospitals - register hospital
hospitalsRouter.post('/', (req, res) => {
  const {
    hospital_name,
    name,
    registration_number,
    licenceNumber,
    address,
    contact_person,
    contactPerson,
    email,
    phone,
    city,
    state,
    licence_document_name,
    licenceDocumentName
  } = req.body;

  const hospName = hospital_name || name;
  const regNumber = registration_number || licenceNumber;

  if (!hospName || !regNumber) {
    return res.status(400).json({
      error: 'hospital_name and registration_number are required'
    });
  }

  const created = db.addHospital({
    hospital_name: hospName,
    registration_number: regNumber,
    address: address || '',
    verification_status: 'unverified',
    contact_person: contact_person || contactPerson || '',
    email: email || '',
    phone: phone || '',
    city: city || 'Pune',
    state: state || 'Maharashtra',
    licence_document_name: licence_document_name || licenceDocumentName || ''
  });

  res.status(201).json({
    message: 'Hospital registered successfully. Verification pending.',
    hospital_id: created.hospital_id,
    hospital: created
  });
});

// PATCH /api/hospitals/:id/status - admin approve/reject
hospitalsRouter.patch('/:id/status', (req, res) => {
  const numId = Number(String(req.params.id).replace(/\D/g, ''));
  const { status } = req.body;

  if (!status || !['verified', 'rejected', 'unverified'].includes(status.toLowerCase())) {
    return res.status(400).json({ error: 'Status must be verified, rejected, or unverified' });
  }

  const updated = db.updateHospitalStatus(numId, status.toLowerCase() as any);
  if (!updated) {
    return res.status(404).json({ error: 'Hospital not found' });
  }

  res.json({ message: `Hospital marked as ${status}`, hospital: updated });
});
