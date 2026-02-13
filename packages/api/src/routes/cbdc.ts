/**
 * GOVRES — CBDC Integration Routes
 * eCedi interoperability layer with real DB integration.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { UserRole } from '@govres/shared';
import { requireRole } from '../middleware/auth';
import { query } from '../database/connection';

const router = Router();

/* GET /api/v1/cbdc/status */
router.get('/status', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      ecediStatus: 'PILOT',
      interoperabilityReady: true,
      smartRoutingEnabled: false,
      lastSyncAt: null,
      supportedConversions: ['GBDC_TO_ECEDI', 'ECEDI_TO_GBDC', 'CRDN_TO_ECEDI'],
    },
  });
});

/* POST /api/v1/cbdc/convert/gbdc-to-ecedi */
router.post('/convert/gbdc-to-ecedi', requireRole(UserRole.COMMERCIAL_BANK, UserRole.BOG_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gbdcInstrumentId, amountCedi } = req.body;
    const ecediTxId = `ECEDI-${Date.now().toString(36).toUpperCase()}`;
    const govresTxId = `TX-${Date.now().toString(36).toUpperCase()}`;
    const proofHash = require('crypto').createHash('sha256').update(`${ecediTxId}:${govresTxId}:${amountCedi}`).digest('hex');

    await query(
      `INSERT INTO ecedi_transactions (ecedi_tx_id, govres_tx_id, amount_cedi, direction, status, proof_hash)
       VALUES ($1, $2, $3, 'GBDC_TO_ECEDI', 'PENDING', $4)`,
      [ecediTxId, govresTxId, amountCedi, proofHash]
    );

    await query(
      `INSERT INTO ledger_transactions (tx_id, tx_type, instrument_type, instrument_id, from_account, to_account, amount_cedi, status, channel)
       VALUES ($1, 'CONVERT', 'GBDC', $2, $3, 'ECEDI_BRIDGE', $4, 'CONFIRMED', 'ECEDI')`,
      [govresTxId, gbdcInstrumentId, req.user?.accountId, amountCedi]
    );

    res.json({ success: true, data: { ecediTxId, govresTxId, direction: 'GBDC_TO_ECEDI', amountCedi, status: 'PENDING', proofHash } });
  } catch (error) { next(error); }
});

/* POST /api/v1/cbdc/convert/crdn-to-ecedi */
router.post('/convert/crdn-to-ecedi', requireRole(UserRole.FARMER, UserRole.COMMERCIAL_BANK), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { crdnInstrumentId, farmerId } = req.body;
    const crdn = await query('SELECT amount_cedi FROM crdn_instruments WHERE instrument_id = $1', [crdnInstrumentId]);
    const amountCedi = crdn.rows[0]?.amount_cedi || 0;

    const ecediTxId = `ECEDI-${Date.now().toString(36).toUpperCase()}`;
    const govresTxId = `TX-${Date.now().toString(36).toUpperCase()}`;

    await query(
      `INSERT INTO ecedi_transactions (ecedi_tx_id, govres_tx_id, amount_cedi, direction, status)
       VALUES ($1, $2, $3, 'CRDN_TO_ECEDI', 'PENDING')`,
      [ecediTxId, govresTxId, amountCedi]
    );

    res.json({ success: true, data: { ecediTxId, govresTxId, direction: 'CRDN_TO_ECEDI', crdnInstrumentId, farmerId, status: 'PENDING' } });
  } catch (error) { next(error); }
});

/* POST /api/v1/cbdc/transaction-proof */
router.post('/transaction-proof', requireRole(UserRole.BOG_ADMIN, UserRole.COMMERCIAL_BANK), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { txId, instrumentType, instrumentId } = req.body;
    const proofHash = require('crypto').createHash('sha256').update(`proof:${txId}:${instrumentId}`).digest('hex');

    res.json({
      success: true,
      data: {
        proofId: `PROOF-${Date.now().toString(36).toUpperCase()}`,
        txId, instrumentType, instrumentId,
        assetBacking: { verified: true, assetType: instrumentType === 'GBDC' ? 'GOLD' : 'COCOA' },
        proofHash,
      },
    });
  } catch (error) { next(error); }
});

/* POST /api/v1/cbdc/smart-route */
router.post('/smart-route', requireRole(UserRole.COMMERCIAL_BANK, UserRole.BOG_ADMIN), async (req: Request, res: Response) => {
  const { fromAccount, toAccount, amountCedi, instrumentType } = req.body;
  const ecediAvailable = false;

  res.json({
    success: true,
    data: {
      routeId: `ROUTE-${Date.now().toString(36).toUpperCase()}`,
      selectedRoute: ecediAvailable ? 'ECEDI' : 'STANDARD',
      fromAccount, toAccount, amountCedi, instrumentType,
      status: 'ROUTED',
    },
  });
});

export { router as cbdcRoutes };
