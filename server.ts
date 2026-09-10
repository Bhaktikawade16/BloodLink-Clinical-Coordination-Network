import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { authRouter } from './server/routes/auth';
import { donorsRouter } from './server/routes/donors';
import { hospitalsRouter } from './server/routes/hospitals';
import { bloodBanksRouter } from './server/routes/bloodBanks';
import { campsRouter } from './server/routes/camps';
import { inventoryRouter } from './server/routes/inventory';
import { requestsRouter } from './server/routes/requests';
import { adminRouter } from './server/routes/admin';
import { notificationsRouter } from './server/routes/notifications';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // CORS Headers for API requests
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Health and Root status
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: db.getStatus()
    });
  });

  app.get('/api', (req, res) => {
    res.json({
      message: 'BloodLink Full-Stack API is running',
      version: '1.0.0',
      database: db.getStatus()
    });
  });

  // Mount API Routers
  app.use('/api/auth', authRouter);
  app.use('/api/donors', donorsRouter);
  app.use('/api/hospitals', hospitalsRouter);
  app.use('/api/blood-banks', bloodBanksRouter);
  app.use('/api/camps', campsRouter);
  app.use('/api/inventory', inventoryRouter);
  app.use('/api/blood-requests', requestsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/notifications', notificationsRouter);

  // Background sync with Railway PostgreSQL on boot
  db.syncWithRailway()
    .then((success) => {
      console.log(`[Database] Initial Railway sync completed: ${success ? 'OK' : 'Warning'}`);
    })
    .catch((err) => {
      console.warn('[Database] Initial sync caught exception:', err.message);
    });

  // Periodic synchronization with Railway database every 60 seconds
  setInterval(() => {
    db.syncWithRailway().catch(() => {});
  }, 60000);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BloodLink Full-Stack Server running on http://localhost:${PORT}`);
  });
}

startServer();
