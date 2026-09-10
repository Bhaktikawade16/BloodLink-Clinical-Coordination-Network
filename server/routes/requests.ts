import { Router } from 'express';
import { db } from '../db';

export const requestsRouter = Router();

// GET /api/blood-requests - list all blood requests (conforms to existing Railway schema)
requestsRouter.get('/', (req, res) => {
  const requests = db.getBloodRequests();
  res.json(requests);
});

// GET /api/blood-requests/:id
requestsRouter.get('/:id', (req, res) => {
  const request = db.getBloodRequestById(req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Blood request not found' });
  }
  res.json(request);
});

// POST /api/blood-requests - create emergency blood requisition
requestsRouter.post('/', async (req, res) => {
  const {
    hospital_id,
    patient_name,
    patientId,
    blood_group,
    bloodGroup,
    component,
    units_required,
    units,
    urgency_level,
    urgency,
    required_by,
    location,
    latitude,
    longitude,
    hospital_name,
    hospitalName,
    patient_diagnosis,
    patientDiagnosis
  } = req.body;

  const bGroup = blood_group || bloodGroup;
  const patient = patient_name || patientId || 'Emergency Patient';
  const hospName = hospital_name || hospitalName || 'Hospital';

  if (!bGroup) {
    return res.status(400).json({ error: 'blood_group is required' });
  }

  const created = await db.addBloodRequest({
    hospital_id: hospital_id || 1,
    patient_name: patient,
    blood_group: bGroup,
    component: (component || 'whole_blood').toLowerCase().replace(/ /g, '_'),
    units_required: units_required || units || 1,
    urgency_level: (urgency_level || urgency || 'urgent').toLowerCase(),
    required_by: required_by || new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
    location: location || hospName,
    latitude,
    longitude,
    hospital_name: hospName,
    patient_diagnosis: patient_diagnosis || patientDiagnosis
  });

  // Also dispatch a clinical notification
  db.addNotification({
    title: `Emergency Requisition #${created.request_id}`,
    message: `${hospName} requested ${created.units_required} units of ${created.blood_group} (${created.urgency_level.toUpperCase()})`,
    time: 'Just now',
    is_urgent: created.urgency_level.toLowerCase() === 'critical',
    type: 'alert'
  });

  res.status(201).json({
    message: 'Emergency requisition created successfully',
    request_id: created.request_id,
    request: created
  });
});

// PATCH /api/blood-requests/:id - update blood request
requestsRouter.patch('/:id', (req, res) => {
  const updated = db.updateBloodRequest(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Blood request not found' });
  }
  res.json({ message: 'Blood request updated', request: updated });
});

// POST /api/blood-requests/:id/accept
requestsRouter.post('/:id/accept', (req, res) => {
  const { blood_bank_id, bloodBankId, blood_bank_name, bloodBankName } = req.body;
  const bId = blood_bank_id || bloodBankId || 'BANK-1';
  const bName = blood_bank_name || bloodBankName || 'Sahyadri Blood Bank';

  const updated = db.acceptBloodRequest(req.params.id, bId, bName);
  if (!updated) {
    return res.status(404).json({ error: 'Blood request not found' });
  }

  db.addNotification({
    title: `Order Accepted by ${bName}`,
    message: `${bName} accepted requisition #${updated.request_id} for ${updated.units_required} units of ${updated.blood_group}`,
    time: 'Just now',
    type: 'success'
  });

  res.json({ message: 'Blood request accepted', request: updated });
});

// POST /api/blood-requests/:id/reject
requestsRouter.post('/:id/reject', (req, res) => {
  const { blood_bank_id, bloodBankId } = req.body;
  const bId = blood_bank_id || bloodBankId || 'BANK-1';

  const updated = db.rejectBloodRequest(req.params.id, bId);
  if (!updated) {
    return res.status(404).json({ error: 'Blood request not found' });
  }
  res.json({ message: 'Blood request rejected by this blood bank', request: updated });
});

// POST /api/blood-requests/:id/allocate
requestsRouter.post('/:id/allocate', (req, res) => {
  const { units } = req.body;
  const updated = db.allocateBloodUnits(req.params.id, Number(units) || 1);
  if (!updated) {
    return res.status(404).json({ error: 'Blood request not found' });
  }
  res.json({ message: 'Units allocated for request', request: updated });
});

// POST /api/blood-requests/:id/dispatch
requestsRouter.post('/:id/dispatch', (req, res) => {
  const { tracking_number, trackingNumber } = req.body;
  const track = tracking_number || trackingNumber;
  const updated = db.dispatchBloodSupply(req.params.id, track);
  if (!updated) {
    return res.status(404).json({ error: 'Blood request not found' });
  }

  db.addNotification({
    title: `Cold-Chain Dispatched: ${updated.blood_group}`,
    message: `Blood supply for ${updated.hospital_name} is in transit. Tracking #${updated.tracking_number}`,
    time: 'Just now',
    type: 'info'
  });

  res.json({ message: 'Blood supply dispatched in cold-chain transit', request: updated });
});

// POST /api/blood-requests/:id/receive
requestsRouter.post('/:id/receive', (req, res) => {
  const updated = db.receiveBloodSupply(req.params.id);
  if (!updated) {
    return res.status(404).json({ error: 'Blood request not found' });
  }

  db.addNotification({
    title: `Requisition Fulfilled & Delivered`,
    message: `${updated.hospital_name} confirmed receipt and cold-chain integrity for ${updated.units_required} units of ${updated.blood_group}`,
    time: 'Just now',
    type: 'success'
  });

  res.json({ message: 'Hospital receipt confirmed. Requisition fulfilled.', request: updated });
});
