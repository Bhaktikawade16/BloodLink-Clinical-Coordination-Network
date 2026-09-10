import { Router } from 'express';
import { db } from '../db';

export const notificationsRouter = Router();

// GET /api/notifications
notificationsRouter.get('/', (req, res) => {
  res.json(db.getNotifications());
});

// POST /api/notifications
notificationsRouter.post('/', (req, res) => {
  const { title, message, time, is_urgent, isUrgent, type } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'title and message are required' });
  }

  const created = db.addNotification({
    title,
    message,
    time: time || 'Just now',
    is_urgent: is_urgent ?? isUrgent ?? false,
    type: type || 'info'
  });

  res.status(201).json(created);
});

// DELETE /api/notifications
notificationsRouter.delete('/', (req, res) => {
  db.clearNotifications();
  res.json({ message: 'Notifications cleared' });
});
