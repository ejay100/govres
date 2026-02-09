/**
 * GOVRES — CRDN Routes (Cocoa Receipt Digital Note)
 * Real database integration for CRDN lifecycle.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { UserRole } from '@govres/shared';
import { requireRole } from '../middleware/auth';
import { query } from '../database/connection';
import { AppError } from '../middleware/error-handler';

const router = Router();

/** POST /api/v1/crdn/issue — Issue CRDN at farm-gate delivery */
router.post('/issue', requireRole(UserRole.LBC, UserRole.BOG_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { farmerId, lbcId, cocoaWeightKg, pricePerKgGHS, warehouseReceiptId, seasonYear, qualityGrade } = req.body;
    if (!farmerId || !cocoaWeightKg || !pricePerKgGHS) throw new AppError('Missing required fields', 400, 'VALIDATION');

    const amountCedi = cocoaWeightKg * pricePerKgGHS;
    const instrumentId = `CRDN-${Date.now().toString(36).toUpperCase()}`;

    const result = await query(
      `INSERT INTO crdn_instruments (instrument_id, amount_cedi, cocoa_weight_kg, price_per_kg_ghs, farmer_id, lbc_id, warehouse_receipt_id, quality_grade, season_year, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ISSUED')
       RETURNING *`,
      [instrumentId, amountCedi, cocoaWeightKg, pricePerKgGHS, farmerId, lbcId || req.user?.accountId, warehouseReceiptId, qualityGrade, seasonYear || '2025/2026']
    );

    const txId = `TX-${Date.now().toString(36).toUpperCase()}`;
    await query(
      `INSERT INTO ledger_transactions (tx_id, tx_type, instrument_type, instrument_id, from_account, to_account, amount_cedi, status)
       VALUES ($1, 'MINT', 'CRDN', $2, $3, $4, $5, 'CONFIRMED')`,
      [txId, instrumentId, lbcId || req.user?.accountId, farmerId, amountCedi]
    );

    // Update farmer balance
    await query('UPDATE account_balances SET crdn_balance = crdn_balance + $1, last_updated = NOW() WHERE account_id = $2', [amountCedi, farmerId]);

    res.status(201).json({ success: true, data: { ...result.rows[0], txId } });
  } catch (error) { next(error); }
});

/** POST /api/v1/crdn/convert — Convert CRDN to GBDC or cash */
router.post('/convert', requireRole(UserRole.FARMER, UserRole.LBC, UserRole.COMMERCIAL_BANK), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { instrumentId, targetInstrument, settlementChannel, momoPhone } = req.body;

    await query(`UPDATE crdn_instruments SET status = 'CONVERTING', updated_at = NOW() WHERE instrument_id = $1`, [instrumentId]);

    const txId = `TX-${Date.now().toString(36).toUpperCase()}`;
    const crdn = await query('SELECT * FROM crdn_instruments WHERE instrument_id = $1', [instrumentId]);
    if (crdn.rows.length === 0) throw new AppError('CRDN not found', 404, 'NOT_FOUND');

    await query(
      `INSERT INTO ledger_transactions (tx_id, tx_type, instrument_type, instrument_id, from_account, to_account, amount_cedi, status, channel)
       VALUES ($1, 'CONVERT', 'CRDN', $2, $3, $4, $5, 'CONFIRMED', $6)`,
      [txId, instrumentId, crdn.rows[0].farmer_id, req.user?.accountId, crdn.rows[0].amount_cedi, settlementChannel]
    );

    await query(`UPDATE crdn_instruments SET status = 'CONVERTED', converted_at = NOW(), updated_at = NOW() WHERE instrument_id = $1`, [instrumentId]);

    res.json({ success: true, data: { txId, instrumentId, targetInstrument, settlementChannel, status: 'CONVERTED' } });
  } catch (error) { next(error); }
});

/** GET /api/v1/crdn/farmer/:farmerId — Get all CRDNs for a farmer */
router.get('/farmer/:farmerId', requireRole(UserRole.FARMER, UserRole.LBC, UserRole.BOG_ADMIN, UserRole.BOG_AUDITOR), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const instruments = await query('SELECT * FROM crdn_instruments WHERE farmer_id = $1 ORDER BY created_at DESC', [req.params.farmerId]);
    const totals = await query(
      `SELECT COALESCE(SUM(amount_cedi) FILTER (WHERE status != 'CONVERTED' AND status != 'CANCELLED'), 0) as outstanding,
              COALESCE(SUM(amount_cedi) FILTER (WHERE status = 'CONVERTED'), 0) as converted
       FROM crdn_instruments WHERE farmer_id = $1`,
      [req.params.farmerId]
    );
    res.json({ success: true, data: { farmerId: req.params.farmerId, instruments: instruments.rows, ...totals.rows[0] } });
  } catch (error) { next(error); }
});

/** GET /api/v1/crdn/season/:seasonYear — Season summary */
router.get('/season/:seasonYear', requireRole(UserRole.BOG_ADMIN, UserRole.BOG_AUDITOR, UserRole.GOVT_AGENCY), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT COUNT(*) as total_issued,
              COALESCE(SUM(amount_cedi), 0) as total_value,
              COALESCE(SUM(amount_cedi) FILTER (WHERE status = 'CONVERTED'), 0) as total_converted,
              COALESCE(SUM(amount_cedi) FILTER (WHERE status NOT IN ('CONVERTED','CANCELLED','EXPIRED')), 0) as total_outstanding,
              COALESCE(SUM(cocoa_weight_kg), 0) as total_cocoa_kg
       FROM crdn_instruments WHERE season_year = $1`,
      [req.params.seasonYear]
    );
    res.json({ success: true, data: { seasonYear: req.params.seasonYear, ...result.rows[0] } });
  } catch (error) { next(error); }
});

/** GET /api/v1/crdn/:instrumentId */
router.get('/:instrumentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM crdn_instruments WHERE instrument_id = $1', [req.params.instrumentId]);
    if (result.rows.length === 0) throw new AppError('CRDN not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

export { router as crdnRoutes };
