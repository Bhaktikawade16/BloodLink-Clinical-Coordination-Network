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
    patientDiagnosis,
    ward_department,
    wardDepartment,
    doctor_name,
    doctorName,
    doctor_authorized_person,
    doctorAuthorizedPerson,
    requisition_doc_name,
    requisitionDocName,
    additional_notes,
    additionalNotes,
    requested_by_name,
    requestedByName
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
    urgency_level: (urgency_level || urgency || 'critical').toLowerCase(),
    required_by: required_by || new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
    location: location || hospName,
    latitude,
    longitude,
    hospital_name: hospName,
    patient_diagnosis: patient_diagnosis || patientDiagnosis || 'Emergency transfusion',
    ward_department: ward_department || wardDepartment || 'Emergency / Trauma OT',
    doctor_name: doctor_name || doctorName || 'Dr. On-Duty Specialist',
    doctor_authorized_person:
      doctor_authorized_person || doctorAuthorizedPerson || requested_by_name || requestedByName || 'Medical Director',
    requisition_doc_name: requisition_doc_name || requisitionDocName || 'Signed_Requisition_Form.pdf',
    additional_notes: additional_notes || additionalNotes || '',
    requested_by_name: requested_by_name || requestedByName || 'Clinical Desk'
  });

  res.status(201).json({
    message: 'Emergency requisition created successfully (Pending Verification)',
    request_id: created.request_id,
    request: created
  });
});

// POST /api/blood-requests/:id/verify - Clinical verification step
requestsRouter.post('/:id/verify', (req, res) => {
  const { verified_by, verifiedBy, notes } = req.body;
  const verifier = verified_by || verifiedBy || 'Duty Medical Director';
  const updated = db.verifyBloodRequest(req.params.id, verifier, notes);
  if (!updated) {
    return res.status(404).json({ error: 'Blood request not found' });
  }
  res.json({ message: 'Requisition clinically verified and smart matching initiated', request: updated });
});

// POST /api/blood-requests/:id/reject-verification - Reject clinical verification
requestsRouter.post('/:id/reject-verification', (req, res) => {
  const { rejected_by, rejectedBy, reason } = req.body;
  const rejecter = rejected_by || rejectedBy || 'Medical Authority';
  const rReason = reason || 'Documentation or clinical indication incomplete';
  const updated = db.rejectVerificationBloodRequest(req.params.id, rejecter, rReason);
  if (!updated) {
    return res.status(404).json({ error: 'Blood request not found' });
  }
  res.json({ message: 'Requisition verification rejected', request: updated });
});

// GET /api/blood-requests/:id/matches - Smart Matching Engine results
requestsRouter.get('/:id/matches', (req, res) => {
  const matches = db.getSmartMatchesForRequest(req.params.id);
  if (!matches) {
    return res.status(404).json({ error: 'Blood request not found' });
  }
  res.json(matches);
});

// POST /api/blood-requests/:id/confirm-reservation - Blood bank confirms 7-min reservation
requestsRouter.post('/:id/confirm-reservation', (req, res) => {
  const { blood_bank_id, bloodBankId } = req.body;
  const bId = blood_bank_id || bloodBankId || 1;
  const confirmed = db.confirmInventoryReservation(req.params.id, bId);
  if (!confirmed) {
    return res.status(404).json({ error: 'Reservation not found or already processed' });
  }
  const request = db.getBloodRequestById(req.params.id);
  res.json({ message: 'Blood bank reservation confirmed', reservation: confirmed, request });
});

// POST /api/blood-requests/:id/reject-reservation - Blood bank declines 7-min reservation
requestsRouter.post('/:id/reject-reservation', (req, res) => {
  const { blood_bank_id, bloodBankId, reason } = req.body;
  const bId = blood_bank_id || bloodBankId || 1;
  const rejected = db.rejectInventoryReservation(req.params.id, bId, reason);
  if (!rejected) {
    return res.status(404).json({ error: 'Reservation not found or already processed' });
  }
  const request = db.getBloodRequestById(req.params.id);
  res.json({ message: 'Blood bank reservation declined. Standby donors mobilized.', reservation: rejected, request });
});

// POST /api/blood-requests/:id/donor-response - Donor accepts or declines emergency alert
requestsRouter.post('/:id/donor-response', (req, res) => {
  const { donor_id, donorId, response } = req.body;
  const dId = donor_id || donorId;
  const dResp = (response || 'ACCEPT').toUpperCase() as 'ACCEPT' | 'DECLINE';
  if (!dId) {
    return res.status(400).json({ error: 'donor_id is required' });
  }
  const recorded = db.recordDonorResponse(req.params.id, dId, dResp);
  const request = db.getBloodRequestById(req.params.id);
  res.json({ message: `Donor response recorded: ${dResp}`, response: recorded, request });
});

// GET /api/blood-requests/:id/donor-responses - List donor responses
requestsRouter.get('/:id/donor-responses', (req, res) => {
  const responses = db.getDonorResponsesForRequest(req.params.id);
  res.json(responses);
});

// GET /api/blood-requests/:id/reservations - List reservations
requestsRouter.get('/:id/reservations', (req, res) => {
  const reservations = db.getReservationsForRequest(req.params.id);
  res.json(reservations);
});

// GET /api/blood-requests/:id/timeline - Clinical tracking timeline
requestsRouter.get('/:id/timeline', (req, res) => {
  const timeline = db.getRequestTimeline(req.params.id);
  res.json(timeline);
});

// POST /api/blood-requests/:id/issue-units - Issue blood units from bank
requestsRouter.post('/:id/issue-units', (req, res) => {
  const { inventory_id, inventoryId, units } = req.body;
  const invId = inventory_id || inventoryId || 1;
  const updated = db.issueBloodUnits(req.params.id, invId, Number(units) || 1);
  if (!updated) {
    return res.status(404).json({ error: 'Blood request not found' });
  }
  res.json({ message: 'Blood units issued', request: updated });
});

// POST /api/blood-requests/:id/cancel - Cancel blood requisition
requestsRouter.post('/:id/cancel', (req, res) => {
  const { reason } = req.body;
  const updated = db.cancelBloodRequest(req.params.id, reason || 'Cancelled by requesting hospital');
  if (!updated) {
    return res.status(404).json({ error: 'Blood request not found' });
  }
  res.json({ message: 'Requisition cancelled', request: updated });
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
