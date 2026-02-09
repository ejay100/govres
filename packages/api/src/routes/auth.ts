/**
 * GOVRES — Auth Routes
 * 
 * Authentication and user management for all GOVRES user groups.
 */

import { Router, Request, Response } from 'express';
import { UserRole } from '@govres/shared';
import { generateToken, AuthPayload } from '../middleware/auth';

const router = Router();

/**
 * POST /api/v1/auth/login
 * Authenticate a user and return JWT token
 */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // TODO: Validate against database
  // Placeholder: Generate token for testing
  const payload: AuthPayload = {
    userId: 'user-001',
    accountId: 'ACC-001',
    role: UserRole.BOG_ADMIN,
    organizationId: 'BOG',
    permissions: ['*'],
  };

  const token = generateToken(payload);

  res.json({
    success: true,
    data: {
      token,
      user: {
        userId: payload.userId,
        role: payload.role,
        organizationId: payload.organizationId,
      },
      expiresIn: '8h',
    },
  });
});

/**
 * POST /api/v1/auth/register
 * Register a new user (BoG admin only in production)
 */
router.post('/register', async (req: Request, res: Response) => {
  const { email, fullName, phone, role, organizationId, organizationName } = req.body;

  res.status(201).json({
    success: true,
    data: {
      userId: `USER-${Date.now().toString(36)}`,
      accountId: `ACC-${Date.now().toString(36)}`,
      email,
      fullName,
      role,
      organizationId,
      organizationName,
      kycVerified: false,
      isActive: true,
      createdAt: new Date(),
    },
  });
});

/**
 * POST /api/v1/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  
  // TODO: Validate refresh token
  res.json({
    success: true,
    data: {
      token: '',
      expiresIn: '8h',
    },
  });
});

export { router as authRoutes };
