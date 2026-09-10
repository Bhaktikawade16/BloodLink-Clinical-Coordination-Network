import { Router } from 'express';
import { db } from '../db';

export const bloodBanksRouter = Router();

// GET /api/blood-banks - list all blood banks (conforms to existing Railway schema)
bloodBanksRouter.get('/', (req, res) => {
  const banks = db.getBloodBanks();
  res.json(banks);
});

// GET /api/blood-banks/:id
bloodBanksRouter.get('/:id', (req, res) => {
  const numId = Number(String(req.params.id).replace(/\D/g, ''));
  const bank = db.getBloodBankById(numId);
  if (!bank) {
    return res.status(404).json({ error: 'Blood bank not found' });
  }
  res.json(bank);
});

// POST /api/blood-banks - register blood bank
bloodBanksRouter.post('/', (req, res) => {
  const {
    bank_name,
    name,
    license_number,
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

  const bankName = bank_name || name;
  const licNumber = license_number || licenceNumber;

  if (!bankName || !licNumber) {
    return res.status(400).json({
      error: 'bank_name and license_number are required'
    });
  }

  const created = db.addBloodBank({
    bank_name: bankName,
    license_number: licNumber,
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
    message: 'Blood bank registered successfully. Verification pending.',
    blood_bank_id: created.blood_bank_id,
    bloodBank: created
  });
});

// PATCH /api/blood-banks/:id/status - admin approve/reject
bloodBanksRouter.patch('/:id/status', (req, res) => {
  const numId = Number(String(req.params.id).replace(/\D/g, ''));
  const { status } = req.body;

  if (!status || !['verified', 'rejected', 'unverified'].includes(status.toLowerCase())) {
    return res.status(400).json({ error: 'Status must be verified, rejected, or unverified' });
  }

  const updated = db.updateBloodBankStatus(numId, status.toLowerCase() as any);
  if (!updated) {
    return res.status(404).json({ error: 'Blood bank not found' });
  }

  res.json({ message: `Blood bank marked as ${status}`, bloodBank: updated });
});
