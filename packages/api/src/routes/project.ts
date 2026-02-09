/**
 * GOVRES — Government Project Routes
 * 
 * Manages government project budgets, approvals, and contractor payments.
 * Aligned with whitepaper Section 7 and Layer 3 user flows.
 */

import { Router, Request, Response } from 'express';
import { UserRole } from '@govres/shared';
import { requireRole } from '../middleware/auth';

const router = Router();

/**
 * POST /api/v1/projects
 * Submit a new government project
 */
router.post('/', requireRole(UserRole.GOVT_AGENCY), async (req: Request, res: Response) => {
  const { projectName, description, budgetGBDC, contractors, milestones } = req.body;

  res.status(201).json({
    success: true,
    data: {
      projectId: `PROJ-${Date.now().toString(36)}`,
      agencyId: req.user?.organizationId,
      projectName,
      description,
      budgetGBDC,
      disbursedGBDC: 0,
      status: 'SUBMITTED',
      contractors,
      milestones: milestones?.map((m: any, i: number) => ({
        milestoneId: `MILE-${i + 1}`,
        ...m,
        status: 'PENDING',
      })),
      submittedAt: new Date(),
    },
  });
});

/**
 * PUT /api/v1/projects/:projectId/approve
 * Approve a project (BoG/Treasury only)
 */
router.put('/:projectId/approve', requireRole(UserRole.BOG_ADMIN), async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      projectId: req.params.projectId,
      status: 'APPROVED',
      approvedBy: req.user?.userId,
      approvedAt: new Date(),
    },
  });
});

/**
 * POST /api/v1/projects/:projectId/disburse
 * Disburse GBDC for a project milestone
 */
router.post('/:projectId/disburse', requireRole(
  UserRole.BOG_ADMIN, UserRole.GOVT_AGENCY
), async (req: Request, res: Response) => {
  const { milestoneId, contractorId, amountGBDC } = req.body;

  res.json({
    success: true,
    data: {
      projectId: req.params.projectId,
      milestoneId,
      contractorId,
      amountGBDC,
      status: 'DISBURSED',
      txId: `TX-${Date.now().toString(36)}`,
      timestamp: new Date(),
    },
  });
});

/**
 * GET /api/v1/projects/:projectId
 * Get project details
 */
router.get('/:projectId', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      projectId: req.params.projectId,
    },
  });
});

/**
 * GET /api/v1/projects
 * List projects (filtered by user role)
 */
router.get('/', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      projects: [],
      meta: { page: 1, pageSize: 20, total: 0, timestamp: new Date() },
    },
  });
});

export { router as projectRoutes };
