/**
 * GOVRES — Settlement Routes
 * Real DB integration for interbank, contractor, and farmer settlement.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { UserRole } from '@govres/shared';
import { requireRole } from '../middleware/auth';
import { query } from '../database/connection';
import { AppError } from '../middleware/error-handler';

const router = Router();

/* POST /api/v1/settlement/interbank */
router.post('/interbank', requireRole(UserRole.BOG_ADMIN, UserRole.COMMERCIAL_BANK), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fromBankId, toBankId, amountCedi, instrumentId, referenceNumber } = req.body;
    const settlementId = `SETT-${Date.now().toString(36).toUpperCase()}`;

    await query(
      `INSERT INTO bank_settlements (settlement_id, bank_id, bank_name, instrument_type, amount_cedi, direction, counterparty_bank_id, status, reference_number)
       VALUES ($1, $2, '', 'GBDC', $3, 'DEBIT', $4, 'CLEARING', $5)`,
      [settlementId, fromBankId, amountCedi, toBankId, referenceNumber || settlementId]
    );

    const txId = `TX-${Date.now().toString(36).toUpperCase()}`;
    await query(
      `INSERT INTO ledger_transactions (tx_id, tx_type, instrument_type, instrument_id, from_account, to_account, amount_cedi, status, channel)
       VALUES ($1, 'SETTLE', 'GBDC', $2, $3, $4, $5, 'CONFIRMED', 'INTERBANK')`,
      [txId, instrumentId || settlementId, fromBankId, toBankId, amountCedi]
    );

    res.status(201).json({ success: true, data: { settlementId, txId, fromBankId, toBankId, amountCedi, status: 'CLEARING' } });
  } catch (error) { next(error); }
});

/* POST /api/v1/settlement/contractor-payment */
router.post('/contractor-payment', requireRole(UserRole.BOG_ADMIN, UserRole.GOVT_AGENCY, UserRole.COMMERCIAL_BANK), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, contractorId, amountCedi, milestoneId, bankId, description } = req.body;
    const paymentId = `PAY-${Date.now().toString(36).toUpperCase()}`;

    const txId = `TX-${Date.now().toString(36).toUpperCase()}`;
    await query(
      `INSERT INTO ledger_transactions (tx_id, tx_type, instrument_type, instrument_id, from_account, to_account, amount_cedi, status, description, channel)
       VALUES ($1, 'TRANSFER', 'GBDC', $2, $3, $4, $5, 'CONFIRMED', $6, 'BANK_TRANSFER')`,
      [txId, paymentId, bankId || 'BOG_TREASURY', contractorId, amountCedi, description]
    );

    if (milestoneId) {
      await query(`UPDATE project_milestones SET status = 'COMPLETED', completed_at = NOW() WHERE milestone_id = $1`, [milestoneId]);
      await query(`UPDATE government_projects SET disbursed_gbdc = disbursed_gbdc + $1, updated_at = NOW() WHERE project_id = $2`, [amountCedi, projectId]);
    }

    res.status(201).json({ success: true, data: { paymentId, txId, projectId, contractorId, amountCedi, status: 'PROCESSING' } });
  } catch (error) { next(error); }
});

/* POST /api/v1/settlement/farmer-cashout */
router.post('/farmer-cashout', requireRole(UserRole.FARMER, UserRole.LBC, UserRole.COMMERCIAL_BANK), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { crdnInstrumentId, farmerId, channel, momoProvider, momoPhone } = req.body;
    const cashoutId = `CASH-${Date.now().toString(36).toUpperCase()}`;

    if (channel === 'MOMO') {
      const momoTxId = `MOMO-${Date.now().toString(36).toUpperCase()}`;
      const crdn = await query('SELECT amount_cedi FROM crdn_instruments WHERE instrument_id = $1', [crdnInstrumentId]);
      if (crdn.rows.length === 0) throw new AppError('CRDN not found', 404, 'NOT_FOUND');

      await query(
        `INSERT INTO momo_transactions (momo_tx_id, provider, phone_number, amount_cedi, instrument_type, status)
         VALUES ($1, $2, $3, $4, 'CRDN', 'INITIATED')`,
        [momoTxId, momoProvider, momoPhone, crdn.rows[0].amount_cedi]
      );
    }

    res.status(201).json({ success: true, data: { cashoutId, crdnInstrumentId, farmerId, channel, status: 'INITIATED' } });
  } catch (error) { next(error); }
});

/* GET /api/v1/settlement/bank/:bankId/summary */
router.get('/bank/:bankId/summary', requireRole(UserRole.COMMERCIAL_BANK, UserRole.BOG_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT COUNT(*) as total, COALESCE(SUM(amount_cedi), 0) as total_volume,
              COUNT(*) FILTER (WHERE status = 'PENDING' OR status = 'CLEARING') as pending
       FROM bank_settlements WHERE bank_id = $1`,
      [req.params.bankId]
    );
    res.json({ success: true, data: { bankId: req.params.bankId, ...result.rows[0] } });
  } catch (error) { next(error); }
});

/* GET /api/v1/settlement/:settlementId */
router.get('/:settlementId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM bank_settlements WHERE settlement_id = $1', [req.params.settlementId]);
    if (result.rows.length === 0) throw new AppError('Settlement not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

export { router as settlementRoutes };
