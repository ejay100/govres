/**
 * GOVRES — Public Dashboard Routes
 * Real database queries for sovereign asset transparency.
 * Includes historical 5-year data feed and simulation endpoints.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../database/connection';
import {
  getHistoricalFeed,
  getCocoaByYear,
  getGoldByYear,
  getMacroByYear,
  getCocoaAnnualSummary,
  getGoldAnnualSummary,
  FINANCIAL,
  UserRole,
} from '@govres/shared';

const router = Router();

/* GET /api/v1/dashboard/reserves — Public reserve summary */
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

/* GET /api/v1/dashboard/gold */
router.get('/gold', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const bars = await query(`SELECT bar_id, weight_grams, purity, vault_id, status, last_verified_at FROM gold_bars ORDER BY created_at DESC LIMIT 50`);
    const totals = await query(`SELECT COALESCE(SUM(weight_grams), 0) as total, COUNT(*) as count FROM gold_bars WHERE status = 'ACTIVE'`);
    res.json({ success: true, data: { totalWeightGrams: Number(totals.rows[0].total), totalBars: Number(totals.rows[0].count), bars: bars.rows } });
  } catch (error) { next(error); }
});

/* GET /api/v1/dashboard/cocoa */
router.get('/cocoa', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`
      SELECT region, COUNT(*) as deliveries, SUM(bags_count) as bags, SUM(weight_kg) as weight_kg
      FROM cocoa_deliveries GROUP BY region ORDER BY weight_kg DESC`);
    const totals = await query(`SELECT SUM(weight_kg) as total_kg, SUM(bags_count) as total_bags FROM cocoa_deliveries`);
    res.json({ success: true, data: { seasonYear: '2025/2026', totalKg: Number(totals.rows[0]?.total_kg || 0), totalBags: Number(totals.rows[0]?.total_bags || 0), regionBreakdown: result.rows } });
  } catch (error) { next(error); }
});

/* GET /api/v1/dashboard/circulation */
router.get('/circulation', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const gbdc = await query(`SELECT COALESCE(SUM(amount_cedi) FILTER (WHERE status IN ('MINTED','CIRCULATING')), 0) as circulating, COALESCE(SUM(amount_cedi) FILTER (WHERE status = 'REDEEMED'), 0) as redeemed, COUNT(*) as minted FROM gbdc_instruments`);
    const crdn = await query(`SELECT COUNT(*) as issued, COALESCE(SUM(amount_cedi) FILTER (WHERE status NOT IN ('CONVERTED','CANCELLED')), 0) as outstanding, COALESCE(SUM(amount_cedi) FILTER (WHERE status = 'CONVERTED'), 0) as converted FROM crdn_instruments`);
    res.json({ success: true, data: { gbdc: gbdc.rows[0], crdn: crdn.rows[0], timestamp: new Date() } });
  } catch (error) { next(error); }
});

/* GET /api/v1/dashboard/metrics */
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

// ─── Historical Data Feed ───────────────────────────────────────

/* GET /api/v1/dashboard/historical — Full 5-year data feed */
router.get('/historical', (_req: Request, res: Response) => {
  const feed = getHistoricalFeed();
  res.json({ success: true, data: feed });
});

/* GET /api/v1/dashboard/historical/cocoa/:year */
router.get('/historical/cocoa/:year', (req: Request, res: Response) => {
  const year = parseInt(req.params.year, 10);
  if (isNaN(year) || year < 2020 || year > 2025) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_YEAR', message: 'Year must be 2020-2025' } });
  }
  res.json({ success: true, data: getCocoaByYear(year) });
});

/* GET /api/v1/dashboard/historical/gold/:year */
router.get('/historical/gold/:year', (req: Request, res: Response) => {
  const year = parseInt(req.params.year, 10);
  if (isNaN(year) || year < 2020 || year > 2025) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_YEAR', message: 'Year must be 2020-2025' } });
  }
  res.json({ success: true, data: getGoldByYear(year) });
});

/* GET /api/v1/dashboard/historical/macro/:year */
router.get('/historical/macro/:year', (req: Request, res: Response) => {
  const year = parseInt(req.params.year, 10);
  if (isNaN(year) || year < 2020 || year > 2025) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_YEAR', message: 'Year must be 2020-2025' } });
  }
  res.json({ success: true, data: getMacroByYear(year) });
});

/* GET /api/v1/dashboard/historical/annual-cocoa */
router.get('/historical/annual-cocoa', (_req: Request, res: Response) => {
  res.json({ success: true, data: getCocoaAnnualSummary() });
});

/* GET /api/v1/dashboard/historical/annual-gold */
router.get('/historical/annual-gold', (_req: Request, res: Response) => {
  res.json({ success: true, data: getGoldAnnualSummary() });
});

// ─── Simulation Demo Endpoint ───────────────────────────────────

/* GET /api/v1/dashboard/simulation — Run in-memory simulation demo */
router.get('/simulation', async (_req: Request, res: Response) => {
  try {
    // Import LedgerEngine dynamically for simulation
    const { LedgerEngine } = await import('@govres/ledger');

    const engine = new LedgerEngine('simulation-demo-validator');
    engine.initialize();

    // Register reserves
    engine.registerGoldReserve(5_000_000, 'sim-gold-attest');    // 5M grams (~161k oz)
    engine.registerCocoaReserve(500_000, 'sim-cocoa-attest');     // 500k kg

    // Register participants
    engine.registerAccount('TREASURY', UserRole.GOVT_AGENCY);
    engine.registerAccount('SIM_BOG_ADMIN', UserRole.BOG_ADMIN);
    ['GCB', 'ECOBANK', 'STANBIC', 'ABSA'].forEach(b =>
      engine.registerAccount(b, UserRole.COMMERCIAL_BANK)
    );

    // ── Phase 1: Money Printing (GBDC Minting) ──
    const mintResults: Array<{ id: string; amount: number; label: string }> = [];
    const mintingSchedule = [
      { label: 'Infrastructure Budget', amount: 500_000_000, backing: 50_000 },
      { label: 'Education Fund', amount: 200_000_000, backing: 20_000 },
      { label: 'Health Sector', amount: 150_000_000, backing: 15_000 },
      { label: 'Agriculture Support', amount: 100_000_000, backing: 10_000 },
      { label: 'Digital Economy', amount: 50_000_000, backing: 5_000 },
    ];

    for (const mint of mintingSchedule) {
      const id = engine.mintGBDC({
        amountCedi: mint.amount,
        goldBackingGrams: mint.backing,
        goldPricePerGramUSD: 105,
        exchangeRateUSDGHS: 14.5,
        issuanceId: `SIM-${mint.label.replace(/\s/g, '-')}`,
        issuedBy: 'BOG_TREASURY',
      });
      mintResults.push({ id, amount: mint.amount, label: mint.label });
    }

    // ── Phase 2: Contractor Payments ──
    const projects = [
      { name: 'Accra-Tema Motorway Extension', amount: 120_000_000, contractor: 'JULIUS_BERGER' },
      { name: 'Tamale Teaching Hospital', amount: 45_000_000, contractor: 'CHINA_STATE' },
      { name: 'Bui Solar Plant Phase II', amount: 28_000_000, contractor: 'AMERI_ENERGY' },
      { name: 'Kumasi Water Supply Upgrade', amount: 18_500_000, contractor: 'AQUA_VITENS' },
    ];

    const projectResults: Array<{ name: string; amount: number; txId: string }> = [];
    for (const p of projects) {
      engine.registerAccount(p.contractor, UserRole.CONTRACTOR);
      const txId = engine.transferGBDC({
        instrumentId: mintResults[0].id,
        fromAccount: 'BOG_TREASURY',
        toAccount: p.contractor,
        amountCedi: p.amount,
        description: `Disbursement: ${p.name}`,
      });
      projectResults.push({ name: p.name, amount: p.amount, txId });
    }

    // ── Phase 3: Cocoa Season (CRDN) ──
    const farmers = Array.from({ length: 20 }, (_, i) => {
      const farmerId = `FARMER_SIM_${i}`;
      engine.registerAccount(farmerId, UserRole.FARMER);
      return {
        id: farmerId,
        name: `Farmer ${i + 1}`,
        bags: 10 + Math.floor(Math.random() * 40),
      };
    });
    engine.registerAccount('PBC_LTD', UserRole.LBC);

    let totalCrdnValue = 0;
    for (const f of farmers) {
      const weightKg = f.bags * 64;
      const crdnId = engine.issueCRDN({
        farmerId: f.id,
        lbcId: 'PBC_LTD',
        cocoaWeightKg: weightKg,
        pricePerKgGHS: 99.89,
        warehouseReceiptId: `SIM-WR-${f.id}`,
        seasonYear: '2025/2026',
        attestationHash: 'sim-cocoa-attest',
      });
      totalCrdnValue += weightKg * 99.89;
    }

    // ── Summary KPIs ──
    const summary = engine.getReserveSummary();
    const totalMinted = mintingSchedule.reduce((s, m) => s + m.amount, 0);
    const totalDisbursed = projects.reduce((s, p) => s + p.amount, 0);
    const effectiveLiquidity = totalMinted * FINANCIAL.MONEY_MULTIPLIER;

    res.json({
      success: true,
      data: {
        kpis: {
          totalGBDCMinted: totalMinted,
          totalGBDCMintedFormatted: `GH₵ ${(totalMinted / 1e9).toFixed(2)}B`,
          effectiveLiquidity,
          effectiveLiquidityFormatted: `GH₵ ${(effectiveLiquidity / 1e9).toFixed(2)}B`,
          moneyMultiplier: FINANCIAL.MONEY_MULTIPLIER,
          totalContractorDisbursed: totalDisbursed,
          totalCRDNValue: Math.round(totalCrdnValue),
          totalFarmersServed: farmers.length,
          goldReserveGrams: summary.goldReserveGrams,
          cocoaReserveKg: summary.cocoaReserveKg,
          reserveBackingRatio: summary.reserveBackingRatio,
          chainHeight: summary.chainHeight,
          totalAccounts: summary.accountCount,
          totalGBDCOutstanding: summary.totalGBDCOutstanding,
          totalCRDNOutstanding: summary.totalCRDNOutstanding,
        },
        minting: mintResults,
        projects: projectResults,
        farmerStats: {
          totalFarmers: farmers.length,
          totalBags: farmers.reduce((s, f) => s + f.bags, 0),
          totalCrdnValue: Math.round(totalCrdnValue),
          avgCrdnPerFarmer: Math.round(totalCrdnValue / farmers.length),
        },
        reserveSummary: summary,
        timestamp: new Date(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SIMULATION_ERROR', message: error.message } });
  }
});
