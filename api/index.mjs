// Vercel Serverless Function Entry Point
// Standalone Express app - does NOT import server/index.js to avoid
// crashes from express.static, __dirname, and initDatabase() calls
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

app.use(errorHandler);

export default app;
