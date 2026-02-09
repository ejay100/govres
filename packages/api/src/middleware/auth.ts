/**
 * GOVRES — Authentication Middleware
 * 
 * JWT-based authentication for the GOVRES API.
 * Enforces role-based access control per whitepaper user groups.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@govres/shared';
import { AppError } from './error-handler';

const JWT_SECRET = process.env.JWT_SECRET || 'govres-dev-secret-change-in-production';

export interface AuthPayload {
  userId: string;
  accountId: string;
  role: UserRole;
  organizationId: string;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * Verify JWT token and attach user to request
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401, 'AUTH_001');
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    throw new AppError('Invalid or expired token', 401, 'AUTH_003');
  }
}

/**
 * Role-based access control middleware
 * Restricts endpoints to specified user roles
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTH_001');
    }
    if (!roles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403, 'AUTH_002');
    }
    next();
  };
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}
