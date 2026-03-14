// Vercel Serverless Function Entry Point
// This creates a lightweight Express app specifically for Vercel
import express from 'express';
import cors from 'cors';

import authRoutes from '../server/routes/auth.routes.js';
import aspirasiRoutes from '../server/routes/aspirasi.routes.js';
import dashboardRoutes from '../server/routes/dashboard.routes.js';
import exportRoutes from '../server/routes/export.routes.js';
import usersRoutes from '../server/routes/users.routes.js';
import dprdRoutes from '../server/routes/dprd.routes.js';
import { errorHandler } from '../server/middleware/error-handler.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Temporary debug endpoint to diagnose Supabase connection
app.get('/api/debug', async (req, res) => {
  try {
    const { supabase } = await import('../server/database/init.js');
    const config = (await import('../server/config.js')).default;

    const { data, error } = await supabase
      .from('dprd_members')
      .select('id, name')
      .limit(1);

    res.json({
      env: {
        SUPABASE_URL: config.SUPABASE_URL ? '✅ Set' : '❌ Missing',
        SUPABASE_KEY: config.SUPABASE_KEY ? `✅ Set (starts with ${config.SUPABASE_KEY.substring(0, 10)}...)` : '❌ Missing',
        JWT_SECRET: config.JWT_SECRET ? '✅ Set' : '❌ Missing',
        VERCEL: process.env.VERCEL || 'not set'
      },
      supabase_test: error ? { error: error.message, code: error.code, details: error.details } : { success: true, data }
    });
  } catch (err) {
    res.json({ crash: err.message, stack: err.stack?.substring(0, 500) });
  }
});

app.use(errorHandler);

export default app;
