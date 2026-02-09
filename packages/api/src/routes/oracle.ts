/**
 * GOVRES — Oracle Routes
 * Real DB integration for gold vault, cocoa warehouse, GoldBod feeds.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { UserRole } from '@govres/shared';
import { requireRole } from '../middleware/auth';
import { query } from '../database/connection';

const router = Router();

/** GET /api/v1/oracle/gold/vault/:vaultId */
router.get('/gold/vault/:vaultId', requireRole(UserRole.BOG_ADMIN, UserRole.BOG_AUDITOR), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bars = await query('SELECT * FROM gold_bars WHERE vault_id = $1', [req.params.vaultId]);
    const sensors = await query('SELECT * FROM vault_sensors WHERE vault_id = $1', [req.params.vaultId]);
    const latestReading = await query(
      `SELECT sr.* FROM sensor_readings sr JOIN vault_sensors vs ON sr.sensor_id = vs.sensor_id WHERE vs.vault_id = $1 ORDER BY sr.recorded_at DESC LIMIT 1`,
      [req.params.vaultId]
    );
    const totals = await query('SELECT SUM(weight_grams) as total_grams, COUNT(*) as total_bars FROM gold_bars WHERE vault_id = $1', [req.params.vaultId]);
    res.json({ success: true, data: { vaultId: req.params.vaultId, totalBars: Number(totals.rows[0]?.total_bars || 0), totalWeightGrams: Number(totals.rows[0]?.total_grams || 0), bars: bars.rows, sensors: sensors.rows, lastReading: latestReading.rows[0] || null } });
  } catch (error) { next(error); }
});

/** POST /api/v1/oracle/gold/attestation */
router.post('/gold/attestation', requireRole(UserRole.BOG_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vaultId, data: attestData } = req.body;
    const attestationId = `GOLD-ATT-${Date.now().toString(36).toUpperCase()}`;
    const hash = require('crypto').createHash('sha256').update(JSON.stringify(attestData || {})).digest('hex');

    await query(
      `INSERT INTO oracle_attestations (attestation_id, source_type, source_id, data, hash, signature, verified, verified_at, expires_at)
       VALUES ($1, 'GOLD_VAULT', $2, $3, $4, 'BOG-SYSTEM', true, NOW(), NOW() + INTERVAL '24 hours')`,
      [attestationId, vaultId, JSON.stringify(attestData || {}), hash]
    );

    res.status(201).json({ success: true, data: { attestationId, vaultId, hash, status: 'VERIFIED' } });
  } catch (error) { next(error); }
});

/** GET /api/v1/oracle/cocoa/warehouse/:warehouseId */
router.get('/cocoa/warehouse/:warehouseId', requireRole(UserRole.BOG_ADMIN, UserRole.BOG_AUDITOR, UserRole.GOVT_AGENCY), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entries = await query('SELECT * FROM warehouse_entries WHERE warehouse_id = $1 ORDER BY stored_at DESC', [req.params.warehouseId]);
    const totals = await query('SELECT SUM(total_bags) as bags, SUM(total_weight_kg) as kg FROM warehouse_entries WHERE warehouse_id = $1', [req.params.warehouseId]);
    res.json({ success: true, data: { warehouseId: req.params.warehouseId, totalBags: Number(totals.rows[0]?.bags || 0), totalWeightKg: Number(totals.rows[0]?.kg || 0), entries: entries.rows } });
  } catch (error) { next(error); }
});

/** POST /api/v1/oracle/cocoa/delivery */
router.post('/cocoa/delivery', requireRole(UserRole.LBC), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { farmerId, farmerName, region, district, community, bagsCount, weightKg, qualityGrade, moistureContent, seasonYear, gpsLat, gpsLng } = req.body;
    const deliveryId = `DEL-${Date.now().toString(36).toUpperCase()}`;
    const hash = require('crypto').createHash('sha256').update(JSON.stringify(req.body)).digest('hex');

    await query(
      `INSERT INTO cocoa_deliveries (delivery_id, farmer_id, farmer_name, lbc_id, lbc_name, region, district, community, bags_count, weight_kg, quality_grade, moisture_content, delivery_date, gps_lat, gps_lng, season_year, verification_hash)
       VALUES ($1, $2, $3, $4, '', $5, $6, $7, $8, $9, $10, $11, CURRENT_DATE, $12, $13, $14, $15)`,
      [deliveryId, farmerId, farmerName, req.user?.accountId, region, district, community, bagsCount, weightKg, qualityGrade, moistureContent, gpsLat, gpsLng, seasonYear || '2025/2026', hash]
    );

    res.status(201).json({ success: true, data: { deliveryId, farmerId, weightKg, status: 'RECORDED' } });
  } catch (error) { next(error); }
});

/** GET /api/v1/oracle/goldbod/royalties */
router.get('/goldbod/royalties', requireRole(UserRole.BOG_ADMIN, UserRole.BOG_AUDITOR, UserRole.GOVT_AGENCY), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM gold_production_reports ORDER BY period_year DESC, period_quarter DESC LIMIT 20');
    const totals = await query('SELECT COALESCE(SUM(royalty_amount_usd), 0) as total_usd, COALESCE(SUM(royalty_amount_ghs), 0) as total_ghs FROM gold_production_reports');
    res.json({ success: true, data: { ...totals.rows[0], reports: result.rows } });
  } catch (error) { next(error); }
});

/** POST /api/v1/oracle/goldbod/production-report */
router.post('/goldbod/production-report', requireRole(UserRole.BOG_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { periodYear, periodQuarter, producerId, producerName, mineId, mineName, region, productionOunces, goldPricePerOunceUSD, exchangeRateUSDGHS } = req.body;
    const reportId = `PROD-${Date.now().toString(36).toUpperCase()}`;
    const productionGrams = (productionOunces || 0) * 31.1035;
    const grossRevenue = (productionOunces || 0) * (goldPricePerOunceUSD || 0);
    const royaltyUSD = grossRevenue * 0.05;
    const royaltyGHS = royaltyUSD * (exchangeRateUSDGHS || 15);

    await query(
      `INSERT INTO gold_production_reports (report_id, period_year, period_quarter, producer_id, producer_name, mine_id, mine_name, region, production_ounces, production_grams, gold_price_per_ounce_usd, gross_revenue_usd, royalty_amount_usd, royalty_amount_ghs, exchange_rate_usd_ghs, report_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, CURRENT_DATE)`,
      [reportId, periodYear, periodQuarter, producerId, producerName, mineId, mineName, region, productionOunces, productionGrams, goldPricePerOunceUSD, grossRevenue, royaltyUSD, royaltyGHS, exchangeRateUSDGHS]
    );

    res.status(201).json({ success: true, data: { reportId, royaltyUSD, royaltyGHS, status: 'RECORDED' } });
  } catch (error) { next(error); }
});

export { router as oracleRoutes };
