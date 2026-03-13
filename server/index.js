import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import { initDatabase } from './database/init.js';
import { errorHandler } from './middleware/error-handler.js';

import authRoutes from './routes/auth.routes.js';
import aspirasiRoutes from './routes/aspirasi.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import exportRoutes from './routes/export.routes.js';
import usersRoutes from './routes/users.routes.js';
import dprdRoutes from './routes/dprd.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure DB is initialized sync for Vercel
initDatabase();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/aspirasi', aspirasiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dprd-members', dprdRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend (production local)
app.use(express.static(path.join(__dirname, '..', 'dist')));

// SPA fallback - semua route non-API diarahkan ke index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
});

app.use(errorHandler);

// Only listen locally, Vercel will use the exported app
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(config.PORT, () => {
    console.log(`\n🏛️  Aspirasi DPRD Server`);
    console.log(`📡 API: http://localhost:${config.PORT}`);
    console.log(`💾 DB: Supabase Postgres\n`);
  });
}

export default app;
