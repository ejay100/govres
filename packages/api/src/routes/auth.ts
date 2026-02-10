/**
 * GOVRES — Auth Routes
 * 
 * Authentication and user management for all GOVRES user groups.
 * Real database integration with bcrypt password verification.
 *
 * Public endpoints:
 *   POST /login         — authenticate any user
 *   POST /signup        — self-register as FARMER, CONTRACTOR, or DIASPORA
 *
 * Protected endpoints:
 *   GET  /me            — current user profile + balances
 *   POST /register      — admin-only: create privileged accounts (BOG/BANK/AGENCY/LBC)
 */

import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { UserRole } from '@govres/shared';
import { generateToken, AuthPayload, authMiddleware, requireRole } from '../middleware/auth';
import { query } from '../database/connection';
import { AppError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

const router = Router();

// Roles that anyone can self-register as
const SELF_REGISTER_ROLES: string[] = [
  UserRole.FARMER,
  UserRole.CONTRACTOR,
  UserRole.DIASPORA,
];

// ── POST /api/v1/auth/login ─────────────────────────────────────

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
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401, 'AUTH_001');
    }

    const user = result.rows[0];
    if (!user.is_active) {
      throw new AppError('Account is deactivated. Contact support.', 403, 'AUTH_002');
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

// ── POST /api/v1/auth/signup (PUBLIC self-registration) ─────────

router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, fullName, phone, role, password, confirmPassword } = req.body;

    // Validation
    if (!email || !fullName || !role || !password) {
      throw new AppError('Full name, email, role, and password are required', 400, 'VALIDATION');
    }
    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400, 'VALIDATION');
    }
    if (password !== confirmPassword) {
      throw new AppError('Passwords do not match', 400, 'VALIDATION');
    }
    if (!SELF_REGISTER_ROLES.includes(role)) {
      throw new AppError(
        `Self-registration is only available for: ${SELF_REGISTER_ROLES.join(', ')}. Contact BoG for institutional accounts.`,
        403,
        'AUTH_ROLE_DENIED'
      );
    }

    // Check duplicate email
    const existing = await query('SELECT id FROM user_accounts WHERE email = $1', [email.trim().toLowerCase()]);
    if (existing.rows.length > 0) {
      throw new AppError('An account with this email already exists', 409, 'AUTH_DUPLICATE');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const accountId = `${role.substring(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const result = await query(
      `INSERT INTO user_accounts (account_id, role, full_name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, account_id, role, full_name, email, is_active, kyc_verified, created_at`,
      [accountId, role, fullName.trim(), email.trim().toLowerCase(), phone?.trim() || null, passwordHash]
    );

    // Initialize balances
    await query('INSERT INTO account_balances (account_id, gbdc_balance, crdn_balance) VALUES ($1, 0, 0) ON CONFLICT DO NOTHING', [accountId]);

    // Auto-login: issue token
    const newUser = result.rows[0];
    const payload: AuthPayload = {
      userId: newUser.id,
      accountId: newUser.account_id,
      role: newUser.role as UserRole,
      organizationId: '',
      permissions: [],
    };
    const token = generateToken(payload);

    logger.info('New user registered', { accountId, role, email: email.trim().toLowerCase() });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          userId: newUser.id,
          accountId: newUser.account_id,
          role: newUser.role,
          fullName: newUser.full_name,
          email: newUser.email,
          organizationId: null,
          organizationName: null,
          kycVerified: newUser.kyc_verified,
        },
        expiresIn: '8h',
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/v1/auth/register (ADMIN-ONLY — privileged roles) ──

router.post(
  '/register',
  authMiddleware,
  requireRole(UserRole.BOG_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, fullName, phone, role, organizationCode, password } = req.body;
      if (!email || !fullName || !role || !password) {
        throw new AppError('Missing required fields', 400, 'VALIDATION');
      }

      // Duplicate check
      const existing = await query('SELECT id FROM user_accounts WHERE email = $1', [email.trim().toLowerCase()]);
      if (existing.rows.length > 0) {
        throw new AppError('An account with this email already exists', 409, 'AUTH_DUPLICATE');
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
        [accountId, orgId, role, fullName.trim(), email.trim().toLowerCase(), phone?.trim() || null, passwordHash]
      );

      await query('INSERT INTO account_balances (account_id) VALUES ($1) ON CONFLICT DO NOTHING', [accountId]);
      logger.info('Admin registered user', { accountId, role, by: req.user?.accountId });

      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

// ── GET /api/v1/auth/me ─────────────────────────────────────────

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
