/**
 * GOVRES — Cocoa Supply Chain Routes
 * Full lot tracking from Farmgate → Weighing → Grading → Delivery → Processing/Export
 * Actual Ghana Model — COCOBOD/QCC/CMC compliant
 */

import { Router, Request, Response, NextFunction } from 'express';
import { UserRole } from '@govres/shared';
import { requireRole } from '../middleware/auth';
import { query } from '../database/connection';
import { AppError } from '../middleware/error-handler';
import crypto from 'crypto';

const router = Router();

/** Generate a unique lot GUID */
function generateLotGuid(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `LOT-${ts}-${rand}`;
}

/** Generate event ID */
function generateEventId(): string {
  return `EVT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

/** Insert a supply chain event */
async function insertEvent(
  lotGuid: string,
  eventType: string,
  actorId: string,
  actorRole: string,
  actorName: string,
  gpsLat?: number,
  gpsLng?: number,
  data?: Record<string, any>
): Promise<any> {
  const eventId = generateEventId();
  const signatureHash = crypto.createHash('sha256')
    .update(`${eventId}:${lotGuid}:${eventType}:${actorId}:${Date.now()}`)
    .digest('hex');

  const result = await query(
    `INSERT INTO supply_chain_events (event_id, lot_guid, event_type, actor_id, actor_role, actor_name, location_gps_lat, location_gps_lng, data, signature_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [eventId, lotGuid, eventType, actorId, actorRole, actorName, gpsLat, gpsLng, JSON.stringify(data || {}), signatureHash]
  );
  return result.rows[0];
}

/* ============================================================
   POST /lots/deliver — Register farmgate delivery (creates lot)
   Actor: Farmer / LBC Purchase Clerk
   ============================================================ */
router.post('/lots/deliver', requireRole(UserRole.FARMER, UserRole.LBC, UserRole.BOG_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      farmerId, farmerName, farmGpsLat, farmGpsLng,
      lbcId, lbcName, depotId, depotName,
      region, district, community,
      weightKg, bagsCount, moisturePercent,
      seasonYear
    } = req.body;

    if (!farmerId || !region) throw new AppError('farmerId and region are required', 400, 'VALIDATION');

    const lotGuid = generateLotGuid();
    const verificationHash = crypto.createHash('sha256')
      .update(`${lotGuid}:${farmerId}:${weightKg || 0}:${Date.now()}`)
      .digest('hex');

    const result = await query(
      `INSERT INTO cocoa_lots (
        lot_guid, farmer_id, farmer_name, farm_gps_lat, farm_gps_lng,
        lbc_id, lbc_name, depot_id, depot_name,
        region, district, community,
        weight_kg, bags_count, moisture_percent,
        season_year, status, verification_hash
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'DELIVERED',$17)
      RETURNING *`,
      [lotGuid, farmerId, farmerName, farmGpsLat, farmGpsLng,
       lbcId || req.user?.accountId, lbcName, depotId, depotName,
       region, district, community,
       weightKg, bagsCount, moisturePercent,
       seasonYear || '2025/2026', verificationHash]
    );

    await insertEvent(lotGuid, 'FARMGATE_DELIVERY', req.user?.accountId || farmerId, req.user?.role || 'FARMER', farmerName || 'Unknown', farmGpsLat, farmGpsLng, {
      bagsCount, weightKg, moisturePercent, depotId
    });

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

/* ============================================================
   PUT /lots/:lotGuid/weigh — Record digital weighing
   Actor: LBC / Depot Clerk
   ============================================================ */
router.put('/lots/:lotGuid/weigh', requireRole(UserRole.LBC, UserRole.BOG_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lotGuid } = req.params;
    const { weightKg, bagsCount, moisturePercent, scaleId, gpsLat, gpsLng } = req.body;
    if (!weightKg) throw new AppError('weightKg is required', 400, 'VALIDATION');

    const result = await query(
      `UPDATE cocoa_lots SET weight_kg = $1, bags_count = COALESCE($2, bags_count), moisture_percent = COALESCE($3, moisture_percent),
       status = 'WEIGHED', weighed_at = NOW(), updated_at = NOW()
       WHERE lot_guid = $4 AND status = 'DELIVERED' RETURNING *`,
      [weightKg, bagsCount, moisturePercent, lotGuid]
    );
    if (result.rows.length === 0) throw new AppError('Lot not found or not in DELIVERED status', 404, 'NOT_FOUND');

    await insertEvent(lotGuid, 'WEIGH_IN', req.user?.accountId || '', req.user?.role || 'LBC', '', gpsLat, gpsLng, {
      weightKg, bagsCount, moisturePercent, scaleId
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

/* ============================================================
   PUT /lots/:lotGuid/grade — QCC quality grading
   Actor: QCC Inspector
   ============================================================ */
router.put('/lots/:lotGuid/grade', requireRole(UserRole.BOG_ADMIN, UserRole.GOVT_AGENCY), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lotGuid } = req.params;
    const { qualityGrade, qccInspectorId, qccCertificateId, moisturePercent, notes, gpsLat, gpsLng } = req.body;
    if (!qualityGrade) throw new AppError('qualityGrade is required', 400, 'VALIDATION');

    const validGrades = ['GRADE_1', 'GRADE_2', 'SUB_STANDARD', 'UNGRADED'];
    if (!validGrades.includes(qualityGrade)) throw new AppError('Invalid quality grade', 400, 'VALIDATION');

    const newStatus = qualityGrade === 'SUB_STANDARD' ? 'REJECTED' : 'GRADED';

    const result = await query(
      `UPDATE cocoa_lots SET quality_grade = $1, qcc_inspector_id = $2, qcc_certificate_id = $3,
       moisture_percent = COALESCE($4, moisture_percent), status = $5, graded_at = NOW(), updated_at = NOW()
       WHERE lot_guid = $6 AND status = 'WEIGHED' RETURNING *`,
      [qualityGrade, qccInspectorId || req.user?.accountId, qccCertificateId, moisturePercent, newStatus, lotGuid]
    );
    if (result.rows.length === 0) throw new AppError('Lot not found or not in WEIGHED status', 404, 'NOT_FOUND');

    await insertEvent(lotGuid, 'GRADE_ASSIGN', req.user?.accountId || '', req.user?.role || 'GOVT_AGENCY', '', gpsLat, gpsLng, {
      qualityGrade, qccCertificateId, notes
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

/* ============================================================
   PUT /lots/:lotGuid/seal — QCC sealing after grading
   Actor: QCC Inspector
   ============================================================ */
router.put('/lots/:lotGuid/seal', requireRole(UserRole.BOG_ADMIN, UserRole.GOVT_AGENCY), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lotGuid } = req.params;
    const { sealNumber, gpsLat, gpsLng } = req.body;
    if (!sealNumber) throw new AppError('sealNumber is required', 400, 'VALIDATION');

    const result = await query(
      `UPDATE cocoa_lots SET seal_number = $1, status = 'SEALED', sealed_at = NOW(), updated_at = NOW()
       WHERE lot_guid = $2 AND status = 'GRADED' RETURNING *`,
      [sealNumber, lotGuid]
    );
    if (result.rows.length === 0) throw new AppError('Lot not found or not in GRADED status', 404, 'NOT_FOUND');

    await insertEvent(lotGuid, 'QCC_SEAL', req.user?.accountId || '', req.user?.role || 'GOVT_AGENCY', '', gpsLat, gpsLng, { sealNumber });

    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

/* ============================================================
   PUT /lots/:lotGuid/transport — Begin transport to CMC/takeover
   Actor: Transporter / LBC
   ============================================================ */
router.put('/lots/:lotGuid/transport', requireRole(UserRole.LBC, UserRole.BOG_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lotGuid } = req.params;
    const { transporterId, vehicleNumber, destination, gpsLat, gpsLng } = req.body;

    const result = await query(
      `UPDATE cocoa_lots SET transporter_id = $1, transport_vehicle = $2,
       status = 'IN_TRANSIT', transport_started_at = NOW(), updated_at = NOW()
       WHERE lot_guid = $3 AND status = 'SEALED' RETURNING *`,
      [transporterId || req.user?.accountId, vehicleNumber, lotGuid]
    );
    if (result.rows.length === 0) throw new AppError('Lot not found or not in SEALED status', 404, 'NOT_FOUND');

    await insertEvent(lotGuid, 'TRANSPORT_START', req.user?.accountId || '', req.user?.role || 'LBC', '', gpsLat, gpsLng, {
      transporterId, vehicleNumber, destination
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

/* ============================================================
   PUT /lots/:lotGuid/take-over — CMC/COCOBOD takes over lot
   Actor: CMC Officer
   ============================================================ */
router.put('/lots/:lotGuid/take-over', requireRole(UserRole.BOG_ADMIN, UserRole.GOVT_AGENCY), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lotGuid } = req.params;
    const { cmcTakeOverId, takeOverWeightKg, gpsLat, gpsLng, notes } = req.body;

    const result = await query(
      `UPDATE cocoa_lots SET cmc_take_over_id = $1, cmc_take_over_weight_kg = $2,
       status = 'TAKEN_OVER', taken_over_at = NOW(), updated_at = NOW()
       WHERE lot_guid = $3 AND status = 'IN_TRANSIT' RETURNING *`,
      [cmcTakeOverId || `CMC-${Date.now().toString(36).toUpperCase()}`, takeOverWeightKg, lotGuid]
    );
    if (result.rows.length === 0) throw new AppError('Lot not found or not in IN_TRANSIT status', 404, 'NOT_FOUND');

    await insertEvent(lotGuid, 'CMC_TAKE_OVER', req.user?.accountId || '', req.user?.role || 'GOVT_AGENCY', '', gpsLat, gpsLng, {
      cmcTakeOverId, takeOverWeightKg, notes
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

/* ============================================================
   PUT /lots/:lotGuid/process — Begin processing
   Actor: Processor
   ============================================================ */
router.put('/lots/:lotGuid/process', requireRole(UserRole.BOG_ADMIN, UserRole.GOVT_AGENCY), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lotGuid } = req.params;
    const { processorId, processingType, gpsLat, gpsLng } = req.body;

    const result = await query(
      `UPDATE cocoa_lots SET processor_id = $1, status = 'PROCESSING', processing_started_at = NOW(), updated_at = NOW()
       WHERE lot_guid = $2 AND status = 'TAKEN_OVER' RETURNING *`,
      [processorId || req.user?.accountId, lotGuid]
    );
    if (result.rows.length === 0) throw new AppError('Lot not found or not in TAKEN_OVER status', 404, 'NOT_FOUND');

    await insertEvent(lotGuid, 'PROCESSING_START', req.user?.accountId || '', req.user?.role || 'GOVT_AGENCY', '', gpsLat, gpsLng, {
      processorId, processingType
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

/* ============================================================
   PUT /lots/:lotGuid/export — Export/ship lot
   Actor: Exporter / CMC
   ============================================================ */
router.put('/lots/:lotGuid/export', requireRole(UserRole.BOG_ADMIN, UserRole.GOVT_AGENCY), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lotGuid } = req.params;
    const { exportContractRef, destinationPort, destinationCountry, gpsLat, gpsLng } = req.body;

    const result = await query(
      `UPDATE cocoa_lots SET export_contract_ref = $1, status = 'EXPORTED', exported_at = NOW(), updated_at = NOW()
       WHERE lot_guid = $2 AND status = 'PROCESSING' RETURNING *`,
      [exportContractRef, lotGuid]
    );
    if (result.rows.length === 0) throw new AppError('Lot not found or not in PROCESSING status', 404, 'NOT_FOUND');

    await insertEvent(lotGuid, 'EXPORT_SHIP', req.user?.accountId || '', req.user?.role || 'GOVT_AGENCY', '', gpsLat, gpsLng, {
      exportContractRef, destinationPort, destinationCountry
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

/* ============================================================
   POST /lots/:lotGuid/crdn — Issue CRDN for a graded lot
   Actor: LBC / BOG Admin
   ============================================================ */
router.post('/lots/:lotGuid/crdn', requireRole(UserRole.LBC, UserRole.BOG_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lotGuid } = req.params;
    const { pricePerKgGHS } = req.body;

    const lot = await query('SELECT * FROM cocoa_lots WHERE lot_guid = $1', [lotGuid]);
    if (lot.rows.length === 0) throw new AppError('Lot not found', 404, 'NOT_FOUND');
    const l = lot.rows[0];
    if (l.crdn_instrument_id) throw new AppError('CRDN already issued for this lot', 409, 'CONFLICT');
    if (!['GRADED', 'SEALED', 'IN_TRANSIT', 'TAKEN_OVER', 'PROCESSING', 'EXPORTED'].includes(l.status)) {
      throw new AppError('Lot must be at least GRADED to issue CRDN', 400, 'VALIDATION');
    }

    const amountCedi = (l.weight_kg || 0) * (pricePerKgGHS || 26.0);
    const instrumentId = `CRDN-${Date.now().toString(36).toUpperCase()}`;

    await query(
      `INSERT INTO crdn_instruments (instrument_id, amount_cedi, cocoa_weight_kg, price_per_kg_ghs, farmer_id, lbc_id, quality_grade, season_year, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ISSUED')`,
      [instrumentId, amountCedi, l.weight_kg, pricePerKgGHS || 26.0, l.farmer_id, l.lbc_id, l.quality_grade, l.season_year]
    );

    await query('UPDATE cocoa_lots SET crdn_instrument_id = $1, updated_at = NOW() WHERE lot_guid = $2', [instrumentId, lotGuid]);

    const txId = `TX-${Date.now().toString(36).toUpperCase()}`;
    await query(
      `INSERT INTO ledger_transactions (tx_id, tx_type, instrument_type, instrument_id, from_account, to_account, amount_cedi, status)
       VALUES ($1, 'MINT', 'CRDN', $2, $3, $4, $5, 'CONFIRMED')`,
      [txId, instrumentId, l.lbc_id, l.farmer_id, amountCedi]
    );

    await insertEvent(lotGuid, 'CRDN_ISSUED', req.user?.accountId || '', req.user?.role || 'LBC', '', undefined, undefined, {
      instrumentId, amountCedi, pricePerKgGHS: pricePerKgGHS || 26.0
    });

    res.status(201).json({ success: true, data: { lotGuid, instrumentId, amountCedi, txId } });
  } catch (error) { next(error); }
});

/* ============================================================
   GET /lots — List lots with filtering
   ============================================================ */
router.get('/lots', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, region, seasonYear, farmerId, lbcId, grade, page = '1', limit = '50' } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
    if (region) { conditions.push(`region = $${idx++}`); params.push(region); }
    if (seasonYear) { conditions.push(`season_year = $${idx++}`); params.push(seasonYear); }
    if (farmerId) { conditions.push(`farmer_id = $${idx++}`); params.push(farmerId); }
    if (lbcId) { conditions.push(`lbc_id = $${idx++}`); params.push(lbcId); }
    if (grade) { conditions.push(`quality_grade = $${idx++}`); params.push(grade); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const countResult = await query(`SELECT COUNT(*) FROM cocoa_lots ${where}`, params);
    const result = await query(
      `SELECT * FROM cocoa_lots ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, parseInt(limit as string), offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit as string))
      }
    });
  } catch (error) { next(error); }
});

/* ============================================================
   GET /lots/:lotGuid — Single lot detail with events
   ============================================================ */
router.get('/lots/:lotGuid', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lot = await query('SELECT * FROM cocoa_lots WHERE lot_guid = $1', [req.params.lotGuid]);
    if (lot.rows.length === 0) throw new AppError('Lot not found', 404, 'NOT_FOUND');

    const events = await query(
      'SELECT * FROM supply_chain_events WHERE lot_guid = $1 ORDER BY created_at ASC',
      [req.params.lotGuid]
    );

    res.json({ success: true, data: { ...lot.rows[0], events: events.rows } });
  } catch (error) { next(error); }
});

/* ============================================================
   GET /stats — Supply chain dashboard statistics
   ============================================================ */
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const statusCounts = await query(
      `SELECT status, COUNT(*)::int as count, COALESCE(SUM(weight_kg),0)::numeric as total_weight_kg
       FROM cocoa_lots GROUP BY status ORDER BY status`
    );

    const gradeCounts = await query(
      `SELECT quality_grade, COUNT(*)::int as count FROM cocoa_lots WHERE quality_grade IS NOT NULL GROUP BY quality_grade`
    );

    const regionCounts = await query(
      `SELECT region, COUNT(*)::int as count, COALESCE(SUM(weight_kg),0)::numeric as total_weight_kg
       FROM cocoa_lots GROUP BY region ORDER BY total_weight_kg DESC`
    );

    const totals = await query(
      `SELECT COUNT(*)::int as total_lots,
              COALESCE(SUM(weight_kg),0)::numeric as total_weight_kg,
              COALESCE(SUM(bags_count),0)::int as total_bags,
              COUNT(DISTINCT farmer_id)::int as unique_farmers,
              COUNT(crdn_instrument_id) FILTER (WHERE crdn_instrument_id IS NOT NULL)::int as crdn_issued
       FROM cocoa_lots`
    );

    const recentEvents = await query(
      `SELECT * FROM supply_chain_events ORDER BY created_at DESC LIMIT 20`
    );

    res.json({
      success: true,
      data: {
        totals: totals.rows[0],
        byStatus: statusCounts.rows,
        byGrade: gradeCounts.rows,
        byRegion: regionCounts.rows,
        recentEvents: recentEvents.rows
      }
    });
  } catch (error) { next(error); }
});

export { router as supplyChainRoutes };
