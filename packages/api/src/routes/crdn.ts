/**
 * GOVRES — CRDN Routes
 * 
 * Cocoa Receipt Digital Note management endpoints.
 * Per whitepaper Section 6: Cocoa Financing Without USD Loans
 * - Farmers deliver cocoa → CRDN issued instantly
 * - LBC purchases CRDN using GBDC
 * - Eliminates need for USD loans and FX risk
 * - 2025 cocoa receipts ≈ GH¢44.95B
 */

import { Router, Request, Response } from 'express';
import { UserRole } from '@govres/shared';
import { requireRole } from '../middleware/auth';

const router = Router();

/**
 * POST /api/v1/crdn/issue
 * Issue CRDN at farm-gate delivery
 */
router.post('/issue', requireRole(UserRole.LBC, UserRole.BOG_ADMIN), async (req: Request, res: Response) => {
  const {
    farmerId, lbcId, cocoaWeightKg, pricePerKgGHS,
    warehouseReceiptId, seasonYear, qualityGrade
  } = req.body;

  const amountCedi = cocoaWeightKg * pricePerKgGHS;

  res.status(201).json({
    success: true,
    data: {
      instrumentId: `CRDN-${Date.now().toString(36)}`,
      farmerId,
      lbcId,
      cocoaWeightKg,
      pricePerKgGHS,
      amountCedi,
      qualityGrade,
      seasonYear,
      warehouseReceiptId,
      status: 'ISSUED',
      timestamp: new Date(),
    },
  });
});

/**
 * POST /api/v1/crdn/convert
 * Convert CRDN to GBDC or cash via bank/MoMo
 */
router.post('/convert', requireRole(
  UserRole.FARMER, UserRole.LBC, UserRole.COMMERCIAL_BANK
), async (req: Request, res: Response) => {
  const { instrumentId, targetInstrument, settlementChannel, momoPhone } = req.body;

  res.json({
    success: true,
    data: {
      txId: `TX-${Date.now().toString(36)}`,
      instrumentId,
      targetInstrument, // 'GBDC' or 'CASH'
      settlementChannel, // 'BANK_TRANSFER' or 'MOMO'
      status: 'CONVERTING',
      timestamp: new Date(),
    },
  });
});

/**
 * GET /api/v1/crdn/farmer/:farmerId
 * Get all CRDNs for a farmer
 */
router.get('/farmer/:farmerId', requireRole(
  UserRole.FARMER, UserRole.LBC, UserRole.BOG_ADMIN, UserRole.BOG_AUDITOR
), async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      farmerId: req.params.farmerId,
      instruments: [],
      totalOutstanding: 0,
      totalConverted: 0,
    },
  });
});

/**
 * GET /api/v1/crdn/season/:seasonYear
 * Get CRDN season summary
 */
router.get('/season/:seasonYear', requireRole(
  UserRole.BOG_ADMIN, UserRole.BOG_AUDITOR, UserRole.GOVT_AGENCY
), async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      seasonYear: req.params.seasonYear,
      totalIssued: 0,
      totalConverted: 0,
      totalOutstanding: 0,
      totalValueGHS: 0,
      regionBreakdown: {},
    },
  });
});

/**
 * GET /api/v1/crdn/:instrumentId
 * Get CRDN instrument details
 */
router.get('/:instrumentId', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      instrumentId: req.params.instrumentId,
      type: 'CRDN',
    },
  });
});

export { router as crdnRoutes };
