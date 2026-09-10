import { Router } from 'express';
import { db } from '../db';

export const campsRouter = Router();

// GET /api/camps - list all camps (conforms to existing Railway schema)
campsRouter.get('/', (req, res) => {
  const camps = db.getCamps();
  res.json(camps);
});

// GET /api/camps/:id
campsRouter.get('/:id', (req, res) => {
  const numId = Number(String(req.params.id).replace(/\D/g, ''));
  const camp = db.getCampById(numId);
  if (!camp) {
    return res.status(404).json({ error: 'Camp not found' });
  }
  res.json(camp);
});

// POST /api/camps - create camp
campsRouter.post('/', (req, res) => {
  const {
    name,
    location,
    venue,
    address,
    city,
    camp_date,
    date,
    start_time,
    startTime,
    end_time,
    endTime,
    capacity,
    registrationLimit,
    required_blood_group,
    partner_blood_bank,
    partnerBloodBank,
    contact,
    description
  } = req.body;

  const campLoc = location || venue || address || 'Regional Hall';
  const campDate = camp_date || date || new Date().toISOString().split('T')[0];

  const created = db.addCamp({
    name: name || `Blood Donation Camp - ${campLoc}`,
    location: campLoc,
    venue: venue || campLoc,
    address: address || campLoc,
    city: city || 'Pune',
    camp_date: campDate,
    start_time: start_time || startTime || '09:00:00',
    end_time: end_time || endTime || '17:00:00',
    capacity: capacity ? Number(capacity) : registrationLimit ? Number(registrationLimit) : 50,
    registration_limit: registrationLimit ? Number(registrationLimit) : 50,
    required_blood_group: required_blood_group || 'All Groups',
    partner_blood_bank: partner_blood_bank || partnerBloodBank || 'Sahyadri Blood Bank',
    contact: contact || '',
    description: description || 'Community donation camp'
  });

  res.status(201).json({
    message: 'Camp created successfully',
    camp_id: created.camp_id,
    camp: created
  });
});

// POST /api/camps/:id/register - register attendee slot
campsRouter.post('/:id/register', (req, res) => {
  const numId = Number(String(req.params.id).replace(/\D/g, ''));
  const camp = db.getCampById(numId);
  if (!camp) {
    return res.status(404).json({ error: 'Camp not found' });
  }

  const {
    donor_id,
    donorId,
    donor_name,
    donorName,
    donor_phone,
    donorPhone,
    donor_blood_group,
    donorBloodGroup,
    slot_time,
    slotTime
  } = req.body;

  const attendee = db.addCampAttendee({
    camp_id: numId,
    camp_name: camp.name || camp.location,
    donor_id: donor_id || donorId || 'DONOR-GUEST',
    donor_name: donor_name || donorName || 'Donor',
    donor_phone: donor_phone || donorPhone || '',
    donor_blood_group: donor_blood_group || donorBloodGroup || 'O+',
    slot_time: slot_time || slotTime || '10:00 AM'
  });

  res.status(201).json({
    message: 'Registered successfully for camp',
    registration: attendee,
    updated_registered_count: camp.registered_count
  });
});

// GET /api/camps/:id/attendees
campsRouter.get('/:id/attendees', (req, res) => {
  const numId = Number(String(req.params.id).replace(/\D/g, ''));
  const attendees = db.getCampAttendees(numId);
  res.json(attendees);
});

// GET /api/organizers
campsRouter.get('/organizers/all', (req, res) => {
  res.json(db.getOrganizers());
});

// POST /api/organizers
campsRouter.post('/organizers/register', (req, res) => {
  const { organization_name, organizationName, organizer_name, organizerName, email, phone, contact, tax_or_reg_id, taxOrRegId } = req.body;
  const org = db.addOrganizer({
    organization_name: organization_name || organizationName,
    organizer_name: organizer_name || organizerName,
    email,
    phone,
    contact: contact || phone,
    tax_or_reg_id: tax_or_reg_id || taxOrRegId
  });
  res.status(201).json({ message: 'Organizer registered successfully', organizer: org });
});
