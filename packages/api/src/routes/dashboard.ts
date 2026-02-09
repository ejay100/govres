/**
 * GOVRES — Public Dashboard Routes
 * Real database queries for sovereign asset transparency.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../database/connection';

const router = Router();

/** GET /api/v1/dashboard/reserves — Public reserve summary */
router.get('/reserves', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const gold = await query(`SELECT COALESCE(SUM(weight_grams), 0) as total_grams, COUNT(*) as total_bars FROM gold_bars WHERE status = 'ACTIVE'`);
    const cocoa = await query(`SELECT COALESCE(SUM(weight_kg), 0) as total_kg, COALESCE(SUM(bags_count), 0) as total_bags FROM cocoa_deliveries`);
    const gbdc = await query(`
      SELECT COALESCE(SUM(amount_cedi) FILTER (WHERE status IN ('MINTED','CIRCULATING')), 0) as outstanding,
             COALESCE(SUM(amount_cedi) FILTER (WHERE status = 'REDEEMED'), 0) as redeemed,
             COALESCE(SUM(gold_backing_grams), 0) as gold_backing
      FROM gbdc_instruments`);
    const crdn = await query(`
      SELECT COALESCE(SUM(amount_cedi) FILTER (WHERE status NOT IN ('CONVERTED','CANCELLED','EXPIRED')), 0) as outstanding,
             COALESCE(SUM(amount_cedi) FILTER (WHERE status = 'CONVERTED'), 0) as converted
      FROM crdn_instruments`);

    const goldRow = gold.rows[0];
    const cocoaRow = cocoa.rows[0];
    const gbdcRow = gbdc.rows[0];
    const crdnRow = crdn.rows[0];

    const totalAssets = Number(goldRow.total_grams) * 71.80 + Number(cocoaRow.total_kg) * 99.89; // approximate GHS values
    const totalOutstanding = Number(gbdcRow.outstanding) + Number(crdnRow.outstanding);

    res.json({
      success: true,
      data: {
        goldReserves: { totalWeightGrams: Number(goldRow.total_grams), totalBars: Number(goldRow.total_bars), lastVerifiedAt: new Date() },
        cocoaReserves: { totalWeightKg: Number(cocoaRow.total_kg), totalBags: Number(cocoaRow.total_bags), seasonYear: '2025/2026' },
        circulation: {
          totalGBDCOutstanding: Number(gbdcRow.outstanding),
          totalCRDNOutstanding: Number(crdnRow.outstanding),
          totalGBDCRedeemed: Number(gbdcRow.redeemed),
          totalCRDNConverted: Number(crdnRow.converted),
        },
        monetaryMetrics: {
          moneyMultiplier: 2.5,
          reserveBackingRatio: totalOutstanding > 0 ? totalAssets / totalOutstanding : 1,
        },
        lastUpdated: new Date(),
      },
    });
  } catch (error) { next(error); }
});

/** GET /api/v1/dashboard/gold */
router.get('/gold', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const bars = await query(`SELECT bar_id, weight_grams, purity, vault_id, status, last_verified_at FROM gold_bars ORDER BY created_at DESC LIMIT 50`);
    const totals = await query(`SELECT COALESCE(SUM(weight_grams), 0) as total, COUNT(*) as count FROM gold_bars WHERE status = 'ACTIVE'`);
    res.json({ success: true, data: { totalWeightGrams: Number(totals.rows[0].total), totalBars: Number(totals.rows[0].count), bars: bars.rows } });
  } catch (error) { next(error); }
});

/** GET /api/v1/dashboard/cocoa */
router.get('/cocoa', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`
      SELECT region, COUNT(*) as deliveries, SUM(bags_count) as bags, SUM(weight_kg) as weight_kg
      FROM cocoa_deliveries GROUP BY region ORDER BY weight_kg DESC`);
    const totals = await query(`SELECT SUM(weight_kg) as total_kg, SUM(bags_count) as total_bags FROM cocoa_deliveries`);
    res.json({ success: true, data: { seasonYear: '2025/2026', totalKg: Number(totals.rows[0]?.total_kg || 0), totalBags: Number(totals.rows[0]?.total_bags || 0), regionBreakdown: result.rows } });
  } catch (error) { next(error); }
});

/** GET /api/v1/dashboard/circulation */
router.get('/circulation', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const gbdc = await query(`SELECT COALESCE(SUM(amount_cedi) FILTER (WHERE status IN ('MINTED','CIRCULATING')), 0) as circulating, COALESCE(SUM(amount_cedi) FILTER (WHERE status = 'REDEEMED'), 0) as redeemed, COUNT(*) as minted FROM gbdc_instruments`);
    const crdn = await query(`SELECT COUNT(*) as issued, COALESCE(SUM(amount_cedi) FILTER (WHERE status NOT IN ('CONVERTED','CANCELLED')), 0) as outstanding, COALESCE(SUM(amount_cedi) FILTER (WHERE status = 'CONVERTED'), 0) as converted FROM crdn_instruments`);
    res.json({ success: true, data: { gbdc: gbdc.rows[0], crdn: crdn.rows[0], timestamp: new Date() } });
  } catch (error) { next(error); }
});

/** GET /api/v1/dashboard/metrics */
router.get('/metrics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const blocks = await query('SELECT COALESCE(MAX(block_height), 0) as height FROM ledger_blocks');
    const txs = await query('SELECT COUNT(*) as total FROM ledger_transactions');
    const accts = await query('SELECT COUNT(*) as total FROM user_accounts');
    const settlements = await query('SELECT COUNT(*) as total FROM bank_settlements');
    res.json({
      success: true,
      data: {
        ledgerHeight: Number(blocks.rows[0].height),
        totalTransactions: Number(txs.rows[0].total),
        totalAccounts: Number(accts.rows[0].total),
        totalSettlements: Number(settlements.rows[0].total),
        systemUptime: process.uptime(),
        timestamp: new Date(),
      },
    });
  } catch (error) { next(error); }
});

export { router as dashboardRoutes };
