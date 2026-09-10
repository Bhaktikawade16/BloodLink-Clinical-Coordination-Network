import { Router } from 'express';
import { db } from '../db';

export const inventoryRouter = Router();

// GET /api/inventory - list all inventory (conforms to existing Railway schema)
inventoryRouter.get('/', (req, res) => {
  const items = db.getInventory();
  res.json(items);
});

// POST /api/inventory - add blood inventory unit
inventoryRouter.post('/', (req, res) => {
  const {
    bank_name,
    blood_group,
    bloodGroup,
    component,
    units_available,
    volume,
    collection_date,
    collectionDate,
    expire_date,
    expiryDate
  } = req.body;

  const bGroup = blood_group || bloodGroup;
  if (!bGroup) {
    return res.status(400).json({ error: 'blood_group is required' });
  }

  const created = db.addInventoryUnit({
    bank_name: bank_name || 'Sahyadri Blood Bank',
    blood_group: bGroup,
    component: (component || 'whole_blood').toLowerCase().replace(/ /g, '_'),
    units_available: units_available ? Number(units_available) : 1,
    volume: volume ? Number(volume) : 450,
    collection_date: collection_date || collectionDate,
    expire_date: expire_date || expiryDate
  });

  res.status(201).json({
    message: 'Blood inventory unit logged successfully',
    inventory_id: created.inventory_id,
    unit: created
  });
});

// DELETE /api/inventory/:id
inventoryRouter.delete('/:id', (req, res) => {
  const removed = db.removeInventoryUnit(req.params.id);
  if (!removed) {
    return res.status(404).json({ error: 'Inventory unit not found' });
  }
  res.json({ message: 'Inventory unit removed successfully' });
});

// PATCH /api/inventory/:id/status
inventoryRouter.patch('/:id/status', (req, res) => {
  const updated = db.toggleInventoryStatus(req.params.id);
  if (!updated) {
    return res.status(404).json({ error: 'Inventory unit not found' });
  }
  res.json({ message: 'Unit status updated', unit: updated });
});
