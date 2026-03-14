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

// Temporary debug endpoint using inline Supabase client
app.get('/api/debug', async (req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.SUPABASE_URL || 'https://hhbtrwrllydowupqwrku.supabase.co';
    const key = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYnRyd3JsbHlkb3d1cHF3cmt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MjU5NTQsImV4cCI6MjA4OTAwMTk1NH0.NrNnqmwzjFHbWndCzcOEGybasAVV5g_UKEQtxkjC0r0';
    const sb = createClient(url, key);

    const { data, error } = await sb
      .from('dprd_members')
      .select('id, name')
      .limit(1);

    res.json({
      env: {
        SUPABASE_URL_set: !!process.env.SUPABASE_URL,
        SUPABASE_KEY_set: !!process.env.SUPABASE_KEY,
        SUPABASE_KEY_starts: key.substring(0, 10),
        JWT_SECRET_set: !!process.env.JWT_SECRET,
        VERCEL: process.env.VERCEL || 'not set'
      },
      supabase_test: error ? { error: error.message, code: error.code, details: error.details, hint: error.hint } : { success: true, data }
    });
  } catch (err) {
    res.json({ crash: err.message, stack: err.stack?.substring(0, 500) });
  }
});

app.use(errorHandler);

export default app;
