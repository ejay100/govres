/**
 * GOVRES — Auth Routes
 * 
 * Authentication and user management for all GOVRES user groups.
 * Real database integration with bcrypt password verification.
 */

import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { UserRole } from '@govres/shared';
import { generateToken, AuthPayload, authMiddleware } from '../middleware/auth';
import { query } from '../database/connection';
import { AppError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/v1/auth/login
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('Email and password are required', 400, 'AUTH_001');
    }

    const result = await query(
      `SELECT ua.id, ua.account_id, ua.role, ua.full_name, ua.email, ua.password_hash,
              ua.is_active, ua.kyc_verified, ua.permissions,
              o.id as org_id, o.org_code, o.org_name
       FROM user_accounts ua
       LEFT JOIN organizations o ON ua.organization_id = o.id
       WHERE ua.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401, 'AUTH_001');
    }

    const user = result.rows[0];
    if (!user.is_active) {
      throw new AppError('Account is deactivated', 403, 'AUTH_002');
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw new AppError('Invalid email or password', 401, 'AUTH_001');
    }

    const payload: AuthPayload = {
      userId: user.id,
      accountId: user.account_id,
      role: user.role as UserRole,
      organizationId: user.org_code || '',
      permissions: user.permissions || [],
    };

    const token = generateToken(payload);
    await query('UPDATE user_accounts SET last_login_at = NOW() WHERE id = $1', [user.id]);
    logger.info('User logged in', { accountId: user.account_id, role: user.role });

    res.json({
      success: true,
      data: {
        token,
        user: {
          userId: user.id,
          accountId: user.account_id,
          role: user.role,
          fullName: user.full_name,
          email: user.email,
          organizationId: user.org_code,
          organizationName: user.org_name,
          kycVerified: user.kyc_verified,
        },
        expiresIn: '8h',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/register
 */
router.post('/register', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, fullName, phone, role, organizationCode, password } = req.body;
    if (!email || !fullName || !role || !password) {
      throw new AppError('Missing required fields', 400, 'VALIDATION');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const accountId = `${role.substring(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    let orgId = null;
    if (organizationCode) {
      const orgResult = await query('SELECT id FROM organizations WHERE org_code = $1', [organizationCode]);
      if (orgResult.rows.length > 0) orgId = orgResult.rows[0].id;
    }

    const result = await query(
      `INSERT INTO user_accounts (account_id, organization_id, role, full_name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, account_id, role, full_name, email, is_active, kyc_verified, created_at`,
      [accountId, orgId, role, fullName, email, phone, passwordHash]
    );

    await query('INSERT INTO account_balances (account_id) VALUES ($1) ON CONFLICT DO NOTHING', [accountId]);
    logger.info('User registered', { accountId, role });

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/auth/me
 */
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT ua.id, ua.account_id, ua.role, ua.full_name, ua.email, ua.phone,
              ua.is_active, ua.kyc_verified, ua.permissions, ua.last_login_at,
              o.org_code, o.org_name, o.org_type,
              ab.gbdc_balance, ab.crdn_balance
       FROM user_accounts ua
       LEFT JOIN organizations o ON ua.organization_id = o.id
       LEFT JOIN account_balances ab ON ua.account_id = ab.account_id
       WHERE ua.id = $1`,
      [req.user?.userId]
    );

    if (result.rows.length === 0) throw new AppError('User not found', 404, 'AUTH_001');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };
