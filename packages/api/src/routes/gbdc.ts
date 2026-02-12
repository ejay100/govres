/**
 * GOVRES — GBDC Routes (Gold-Backed Digital Cedi)
 * Real database integration for GBDC lifecycle management.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { UserRole } from '@govres/shared';
import { requireRole } from '../middleware/auth';
import { query } from '../database/connection';
import { AppError } from '../middleware/error-handler';

const router = Router();

/** POST /api/v1/gbdc/mint — Mint GBDC against gold reserves (BoG only) */
router.post('/mint', requireRole(UserRole.BOG_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amountCedi, goldBackingGrams, goldPricePerGramUSD, exchangeRateUSDGHS } = req.body;
    if (!amountCedi || !goldBackingGrams) throw new AppError('amountCedi and goldBackingGrams required', 400, 'VALIDATION');

    const instrumentId = `GBDC-${Date.now().toString(36).toUpperCase()}`;
    const issuanceId = `ISS-${Date.now().toString(36).toUpperCase()}`;

    const result = await query(
      `INSERT INTO gbdc_instruments (instrument_id, amount_cedi, gold_backing_grams, gold_price_per_gram_usd, exchange_rate_usd_ghs, issued_by, holder_id, status, issuance_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'MINTED', $8)
       RETURNING *`,
      [instrumentId, amountCedi, goldBackingGrams, goldPricePerGramUSD || 0, exchangeRateUSDGHS || 0, req.user?.accountId, 'BOG_TREASURY', issuanceId]
    );

    // Record transaction
    const txId = `TX-${Date.now().toString(36).toUpperCase()}`;
    await query(
      `INSERT INTO ledger_transactions (tx_id, tx_type, instrument_type, instrument_id, from_account, to_account, amount_cedi, status)
       VALUES ($1, 'MINT', 'GBDC', $2, 'BOG_TREASURY', 'BOG_TREASURY', $3, 'CONFIRMED')`,
      [txId, instrumentId, amountCedi]
    );

    res.status(201).json({ success: true, data: { ...result.rows[0], txId } });
  } catch (error) { next(error); }
});

/** POST /api/v1/gbdc/transfer — Transfer GBDC between accounts */
router.post('/transfer', requireRole(UserRole.BOG_ADMIN, UserRole.COMMERCIAL_BANK, UserRole.GOVT_AGENCY), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { instrumentId, toAccount, amountCedi, description } = req.body;
    if (!instrumentId || !toAccount || !amountCedi) throw new AppError('Missing required fields', 400, 'VALIDATION');

    const txId = `TX-${Date.now().toString(36).toUpperCase()}`;
    await query(
      `INSERT INTO ledger_transactions (tx_id, tx_type, instrument_type, instrument_id, from_account, to_account, amount_cedi, status, description)
       VALUES ($1, 'TRANSFER', 'GBDC', $2, $3, $4, $5, 'CONFIRMED', $6)`,
      [txId, instrumentId, req.user?.accountId, toAccount, amountCedi, description]
    );

    // Update holder
    await query(`UPDATE gbdc_instruments SET holder_id = $1, status = 'CIRCULATING', updated_at = NOW() WHERE instrument_id = $2`, [toAccount, instrumentId]);

    res.json({ success: true, data: { txId, instrumentId, fromAccount: req.user?.accountId, toAccount, amountCedi, status: 'CONFIRMED' } });
  } catch (error) { next(error); }
});

/** POST /api/v1/gbdc/redeem — Redeem GBDC (Banks only) */
router.post('/redeem', requireRole(UserRole.COMMERCIAL_BANK), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { instrumentId, amountCedi } = req.body;
    const txId = `TX-${Date.now().toString(36).toUpperCase()}`;

    await query(`UPDATE gbdc_instruments SET status = 'REDEEMED', updated_at = NOW() WHERE instrument_id = $1`, [instrumentId]);
    await query(
      `INSERT INTO ledger_transactions (tx_id, tx_type, instrument_type, instrument_id, from_account, to_account, amount_cedi, status)
       VALUES ($1, 'REDEEM', 'GBDC', $2, $3, 'BOG_TREASURY', $4, 'CONFIRMED')`,
      [txId, instrumentId, req.user?.accountId, amountCedi]
    );

    res.json({ success: true, data: { txId, instrumentId, amountCedi, status: 'REDEEMED' } });
  } catch (error) { next(error); }
});

/** GET /api/v1/gbdc/circulation/summary — GBDC circulation metrics */
router.get('/circulation/summary', requireRole(UserRole.BOG_ADMIN, UserRole.BOG_AUDITOR, UserRole.COMMERCIAL_BANK), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`
      SELECT
        COALESCE(SUM(amount_cedi) FILTER (WHERE status = 'MINTED'), 0) AS total_minted,
        COALESCE(SUM(amount_cedi) FILTER (WHERE status = 'CIRCULATING'), 0) AS total_circulating,
        COALESCE(SUM(amount_cedi) FILTER (WHERE status = 'REDEEMED'), 0) AS total_redeemed,
        COALESCE(SUM(amount_cedi) FILTER (WHERE status = 'LOCKED'), 0) AS total_locked,
        COALESCE(SUM(gold_backing_grams), 0) AS total_gold_backing
      FROM gbdc_instruments
    `);
    res.json({ success: true, data: { ...result.rows[0], timestamp: new Date() } });
  } catch (error) { next(error); }
});

/** GET /api/v1/gbdc/:instrumentId — GBDC details */
router.get('/:instrumentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM gbdc_instruments WHERE instrument_id = $1', [req.params.instrumentId]);
    if (result.rows.length === 0) throw new AppError('GBDC instrument not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

export { router as gbdcRoutes };
