/**
 * GOVRES — Ledger Routes
 * Real DB integration for chain status, blocks, transactions, audit.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { UserRole } from '@govres/shared';
import { requireRole } from '../middleware/auth';
import { query } from '../database/connection';
import { AppError } from '../middleware/error-handler';

const router = Router();

/** GET /api/v1/ledger/status */
router.get('/status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const blocks = await query('SELECT COALESCE(MAX(block_height), 0) as height, COUNT(*) as count FROM ledger_blocks');
    const txs = await query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'PENDING') as pending FROM ledger_transactions");
    const accounts = await query('SELECT COUNT(*) as total FROM user_accounts');

    res.json({
      success: true,
      data: {
        chainHeight: Number(blocks.rows[0].height),
        totalBlocks: Number(blocks.rows[0].count),
        totalTransactions: Number(txs.rows[0].total),
        pendingTransactions: Number(txs.rows[0].pending),
        totalAccounts: Number(accounts.rows[0].total),
        uptime: process.uptime(),
        timestamp: new Date(),
      },
    });
  } catch (error) { next(error); }
});

/** GET /api/v1/ledger/block/:height */
router.get('/block/:height', requireRole(UserRole.BOG_ADMIN, UserRole.BOG_AUDITOR), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const height = parseInt(req.params.height, 10);
    const block = await query('SELECT * FROM ledger_blocks WHERE block_height = $1', [height]);
    if (block.rows.length === 0) throw new AppError('Block not found', 404, 'NOT_FOUND');
    const txs = await query('SELECT * FROM ledger_transactions WHERE block_height = $1', [height]);
    res.json({ success: true, data: { ...block.rows[0], transactions: txs.rows } });
  } catch (error) { next(error); }
});

/** GET /api/v1/ledger/transaction/:txId */
router.get('/transaction/:txId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM ledger_transactions WHERE tx_id = $1', [req.params.txId]);
    if (result.rows.length === 0) throw new AppError('Transaction not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

/** GET /api/v1/ledger/transactions/recent */
router.get('/transactions/recent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await query('SELECT * FROM ledger_transactions ORDER BY created_at DESC LIMIT $1', [limit]);
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
});

/** GET /api/v1/ledger/account/:accountId/history */
router.get('/account/:accountId/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;
    const offset = (page - 1) * pageSize;

    const txs = await query(
      'SELECT * FROM ledger_transactions WHERE from_account = $1 OR to_account = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.params.accountId, pageSize, offset]
    );
    const count = await query('SELECT COUNT(*) as total FROM ledger_transactions WHERE from_account = $1 OR to_account = $1', [req.params.accountId]);

    res.json({ success: true, data: { accountId: req.params.accountId, transactions: txs.rows, meta: { page, pageSize, total: Number(count.rows[0].total) } } });
  } catch (error) { next(error); }
});

/** GET /api/v1/ledger/audit-trail */
router.get('/audit-trail', requireRole(UserRole.BOG_AUDITOR), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, type } = req.query;
    let sql = 'SELECT * FROM audit_log WHERE 1=1';
    const params: any[] = [];

    if (from) { params.push(from); sql += ` AND created_at >= $${params.length}`; }
    if (to) { params.push(to); sql += ` AND created_at <= $${params.length}`; }
    if (type) { params.push(type); sql += ` AND action = $${params.length}`; }

    sql += ' ORDER BY created_at DESC LIMIT 100';
    const result = await query(sql, params);
    res.json({ success: true, data: { entries: result.rows, filters: { from, to, type } } });
  } catch (error) { next(error); }
});

export { router as ledgerRoutes };
