/**
 * GOVRES API — Server Entry Point
 * 
 * Express-based REST API for the Government Reserve & Settlement Ledger.
 * Handles all financial flows between BoG, banks, contractors, farmers,
 * and diaspora investors.
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { SYSTEM } from '@govres/shared';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { authMiddleware } from './middleware/auth';
import { testConnection } from './database/connection';

// Routes
import { ledgerRoutes } from './routes/ledger';
import { gbdcRoutes } from './routes/gbdc';
import { crdnRoutes } from './routes/crdn';
import { oracleRoutes } from './routes/oracle';
import { settlementRoutes } from './routes/settlement';
import { dashboardRoutes } from './routes/dashboard';
import { projectRoutes } from './routes/project';
import { cbdcRoutes } from './routes/cbdc';
import { authRoutes } from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || process.env.PORT || 4000;

// ─── Security Middleware ────────────────────────────────────────

app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: true,
  xssFilter: true,
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting per Payment Systems Act 987 security requirements
app.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: SYSTEM.API_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
}));

// ─── Health Check ───────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'govres-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Public Routes ──────────────────────────────────────────────

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes); // Public read-only dashboard

// ─── Authenticated Routes ───────────────────────────────────────

app.use('/api/v1/ledger', authMiddleware, ledgerRoutes);
app.use('/api/v1/gbdc', authMiddleware, gbdcRoutes);
app.use('/api/v1/crdn', authMiddleware, crdnRoutes);
app.use('/api/v1/oracle', authMiddleware, oracleRoutes);
app.use('/api/v1/settlement', authMiddleware, settlementRoutes);
app.use('/api/v1/projects', authMiddleware, projectRoutes);
app.use('/api/v1/cbdc', authMiddleware, cbdcRoutes);

// ─── Error Handling ─────────────────────────────────────────────

app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────

app.listen(PORT, async () => {
  logger.info(`GOVRES API server running on port ${PORT}`);
  logger.info('Government Reserve & Settlement Ledger — Bank of Ghana');
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test database connection
  const dbConnected = await testConnection();
  if (dbConnected) {
    logger.info('Database connected successfully');
  } else {
    logger.warn('Database not available — API routes will return errors for DB-dependent operations');
  }
});

export default app;
