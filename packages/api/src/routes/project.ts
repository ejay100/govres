/**
 * GOVRES — Government Project Routes
 * Real DB integration for project budgets, approvals, contractor payments.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { UserRole } from '@govres/shared';
import { requireRole } from '../middleware/auth';
import { query } from '../database/connection';
import { AppError } from '../middleware/error-handler';

const router = Router();

/** POST /api/v1/projects — Submit a new project */
router.post('/', requireRole(UserRole.GOVT_AGENCY), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectName, description, budgetGBDC, contractors, milestones } = req.body;
    if (!projectName || !budgetGBDC) throw new AppError('projectName and budgetGBDC required', 400, 'VALIDATION');

    const projectId = `PROJ-${Date.now().toString(36).toUpperCase()}`;
    const result = await query(
      `INSERT INTO government_projects (project_id, agency_id, project_name, description, budget_gbdc, status, contractors)
       VALUES ($1, $2, $3, $4, $5, 'SUBMITTED', $6)
       RETURNING *`,
      [projectId, req.user?.organizationId, projectName, description, budgetGBDC, JSON.stringify(contractors || [])]
    );

    // Insert milestones
    if (milestones && Array.isArray(milestones)) {
      for (let i = 0; i < milestones.length; i++) {
        const m = milestones[i];
        const milestoneId = `MILE-${projectId}-${i + 1}`;
        await query(
          `INSERT INTO project_milestones (milestone_id, project_id, description, amount_gbdc, contractor_id, status)
           VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
          [milestoneId, projectId, m.description, m.amountGBDC, m.contractorId]
        );
      }
    }

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

/** PUT /api/v1/projects/:projectId/approve */
router.put('/:projectId/approve', requireRole(UserRole.BOG_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `UPDATE government_projects SET status = 'APPROVED', approved_by = $1, approved_at = NOW(), updated_at = NOW()
       WHERE project_id = $2 RETURNING *`,
      [req.user?.userId, req.params.projectId]
    );
    if (result.rows.length === 0) throw new AppError('Project not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

/** POST /api/v1/projects/:projectId/disburse */
router.post('/:projectId/disburse', requireRole(UserRole.BOG_ADMIN, UserRole.GOVT_AGENCY), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { milestoneId, contractorId, amountGBDC } = req.body;
    const txId = `TX-${Date.now().toString(36).toUpperCase()}`;

    await query(
      `INSERT INTO ledger_transactions (tx_id, tx_type, instrument_type, instrument_id, from_account, to_account, amount_cedi, status, description)
       VALUES ($1, 'TRANSFER', 'GBDC', $2, 'BOG_TREASURY', $3, $4, 'CONFIRMED', $5)`,
      [txId, req.params.projectId, contractorId, amountGBDC, `Disbursement for ${milestoneId}`]
    );

    await query(`UPDATE project_milestones SET status = 'COMPLETED', completed_at = NOW() WHERE milestone_id = $1`, [milestoneId]);
    await query(`UPDATE government_projects SET disbursed_gbdc = disbursed_gbdc + $1, updated_at = NOW() WHERE project_id = $2`, [amountGBDC, req.params.projectId]);

    res.json({ success: true, data: { projectId: req.params.projectId, milestoneId, contractorId, amountGBDC, txId, status: 'DISBURSED' } });
  } catch (error) { next(error); }
});

/** GET /api/v1/projects/:projectId */
router.get('/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await query('SELECT * FROM government_projects WHERE project_id = $1', [req.params.projectId]);
    if (project.rows.length === 0) throw new AppError('Project not found', 404, 'NOT_FOUND');
    const milestones = await query('SELECT * FROM project_milestones WHERE project_id = $1 ORDER BY created_at', [req.params.projectId]);
    res.json({ success: true, data: { ...project.rows[0], milestones: milestones.rows } });
  } catch (error) { next(error); }
});

/** GET /api/v1/projects */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;

    const projects = await query('SELECT * FROM government_projects ORDER BY created_at DESC LIMIT $1 OFFSET $2', [pageSize, offset]);
    const count = await query('SELECT COUNT(*) as total FROM government_projects');

    res.json({ success: true, data: { projects: projects.rows, meta: { page, pageSize, total: Number(count.rows[0].total), timestamp: new Date() } } });
  } catch (error) { next(error); }
});

export { router as projectRoutes };
