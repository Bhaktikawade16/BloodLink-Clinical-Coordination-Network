import { Router } from 'express';
import { db } from '../db';

export const adminRouter = Router();

// GET /api/admin/stats
adminRouter.get('/stats', (req, res) => {
  res.json(db.getStatus());
});

// POST /api/admin/verify - approve or reject entity
adminRouter.post('/verify', (req, res) => {
  const { type, id, status } = req.body;

  if (!type || !id || !status) {
    return res.status(400).json({ error: 'type (hospital|blood-bank), id, and status are required' });
  }

  const numId = Number(String(id).replace(/\D/g, ''));
  const normStatus = status.toLowerCase() === 'approve' || status.toLowerCase() === 'verified'
    ? 'verified'
    : 'rejected';

  if (type === 'hospital') {
    const updated = db.updateHospitalStatus(numId, normStatus);
    if (!updated) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    return res.json({ message: `Hospital ${normStatus}`, hospital: updated });
  } else if (type === 'blood-bank' || type === 'blood_bank') {
    const updated = db.updateBloodBankStatus(numId, normStatus);
    if (!updated) {
      return res.status(404).json({ error: 'Blood bank not found' });
    }
    return res.json({ message: `Blood bank ${normStatus}`, bloodBank: updated });
  }

  return res.status(400).json({ error: 'Invalid entity type' });
});

// POST /api/admin/sync - trigger Railway DB sync
adminRouter.post('/sync', async (req, res) => {
  const success = await db.syncWithRailway();
  const status = db.getStatus();
  res.json({
    success,
    message: success
      ? 'Synchronized successfully with Railway PostgreSQL database'
      : `Sync warning: ${status.syncError}`,
    status
  });
});

// POST /api/admin/config-url - change Railway database URL
adminRouter.post('/config-url', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Valid url is required' });
  }

  db.setRailwayUrl(url);
  const success = await db.syncWithRailway();
  res.json({
    success,
    databaseUrl: db.getRailwayUrl(),
    message: success ? 'URL updated and synced' : 'URL updated but sync failed',
    status: db.getStatus()
  });
});
