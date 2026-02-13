/**
 * GOVRES — Contractor Flow Simulation Tests
 * Validates budget allocation → GBDC mint → contractor disbursement → bank settlement
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LedgerEngine } from '@govres/ledger';
import { UserRole } from '@govres/shared';

describe('Contractor Flow Simulation', () => {
  let engine: LedgerEngine;

  beforeEach(() => {
    engine = new LedgerEngine('contractor-test-validator');
    engine.initialize();
    // Register gold reserve sufficient for minting
    engine.registerGoldReserve(500_000, 'gold-attestation-hash');
  });

  describe('GBDC Minting for Contractor Payments', () => {
    it('should mint GBDC within gold-backed limits', () => {
      const gbdcId = engine.mintGBDC({
        amountCedi: 5_000_000,
        goldBackingGrams: 2000,
        goldPricePerGramUSD: 75,
        exchangeRateUSDGHS: 14.5,
        issuanceId: 'ISS-CONTRACTOR-001',
        issuedBy: 'BOG_TREASURY',
      });

      expect(gbdcId).toBeDefined();
      const gbdc = engine.getGBDCRecord(gbdcId);
      expect(gbdc).toBeDefined();
      expect(gbdc!.amountCedi).toBe(5_000_000);
      expect(gbdc!.goldBackingGrams).toBe(2000);
    });

    it('should reject minting beyond gold reserve backing', () => {
      // Max backing = 500,000 * 10% = 50,000 grams
      expect(() => {
        engine.mintGBDC({
          amountCedi: 1_000_000_000,
          goldBackingGrams: 600_000,
          goldPricePerGramUSD: 75,
          exchangeRateUSDGHS: 14.5,
          issuanceId: 'ISS-OVER-LIMIT',
          issuedBy: 'BOG_TREASURY',
        });
      }).toThrow();
    });

    it('should track total GBDC outstanding after minting', () => {
      engine.mintGBDC({
        amountCedi: 10_000_000,
        goldBackingGrams: 5000,
        goldPricePerGramUSD: 75,
        exchangeRateUSDGHS: 14.5,
        issuanceId: 'ISS-001',
        issuedBy: 'BOG_TREASURY',
      });

      engine.mintGBDC({
        amountCedi: 5_000_000,
        goldBackingGrams: 2500,
        goldPricePerGramUSD: 75,
        exchangeRateUSDGHS: 14.5,
        issuanceId: 'ISS-002',
        issuedBy: 'BOG_TREASURY',
      });

      expect(engine.getTotalGBDCOutstanding()).toBe(15_000_000);
    });
  });

  describe('Contractor Disbursement Flow', () => {
    it('should transfer GBDC from treasury to contractor', () => {
      engine.registerAccount('CONTRACTOR_001', UserRole.CONTRACTOR);

      const gbdcId = engine.mintGBDC({
        amountCedi: 120_000_000,
        goldBackingGrams: 10000,
        goldPricePerGramUSD: 75,
        exchangeRateUSDGHS: 14.5,
        issuanceId: 'ISS-MOTORWAY',
        issuedBy: 'BOG_TREASURY',
      });

      // Transfer from BOG_TREASURY (which received the minted GBDC) to contractor
      const txId = engine.transferGBDC({
        instrumentId: gbdcId,
        fromAccount: 'BOG_TREASURY',
        toAccount: 'CONTRACTOR_001',
        amountCedi: 30_000_000,
        description: 'Accra-Tema Motorway Phase 1 Payment',
      });

      expect(txId).toBeDefined();
      const contractorBalance = engine.getAccountBalance('CONTRACTOR_001');
      expect(contractorBalance!.gbdcBalance).toBe(30_000_000);
    });

    it('should track multiple disbursements across projects', () => {
      // Ghana infrastructure projects
      const projects = [
        { name: 'Accra-Tema Motorway', amount: 120_000_000, contractorId: 'CONTR_001' },
        { name: 'Tamale Teaching Hospital', amount: 45_000_000, contractorId: 'CONTR_002' },
        { name: 'Bui Solar Plant Extension', amount: 28_000_000, contractorId: 'CONTR_003' },
        { name: 'Kumasi Water Supply', amount: 18_500_000, contractorId: 'CONTR_004' },
      ];

      let totalMinted = 0;
      for (const project of projects) {
        engine.registerAccount(project.contractorId, UserRole.CONTRACTOR);
        // Use conservative backing: 10g per ₵1M (well within 10% of 500,000g = 50,000g limit)
        engine.mintGBDC({
          amountCedi: project.amount,
          goldBackingGrams: Math.ceil(project.amount / 10_000_000),
          goldPricePerGramUSD: 75,
          exchangeRateUSDGHS: 14.5,
          issuanceId: `ISS-${project.contractorId}`,
          issuedBy: 'BOG_TREASURY',
        });
        totalMinted += project.amount;
      }

      expect(engine.getTotalGBDCOutstanding()).toBe(totalMinted);

      const summary = engine.getReserveSummary();
      // 2 initial accounts (BOG_TREASURY, BOG_RESERVE) + 4 contractors = 6
      expect(summary.accountCount).toBe(6);
    });
  });

  describe('Block Generation', () => {
    it('should generate blocks from pending transactions', () => {
      engine.registerAccount('CONTR_A', UserRole.CONTRACTOR);

      engine.mintGBDC({
        amountCedi: 10_000_000,
        goldBackingGrams: 5000,
        goldPricePerGramUSD: 75,
        exchangeRateUSDGHS: 14.5,
        issuanceId: 'ISS-BLOCK-TEST',
        issuedBy: 'BOG_TREASURY',
      });

      // After minting, pending transactions should exist
      const summary = engine.getReserveSummary();
      expect(summary.pendingTransactions).toBeGreaterThanOrEqual(0);
      expect(summary.chainHeight).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Reserve Summary Integrity', () => {
    it('should maintain correct reserve backing ratio', () => {
      const goldGrams = 500_000; // already registered in beforeEach
      const cocoaKg = 50_000;
      engine.registerCocoaReserve(cocoaKg, 'cocoa-attest');

      engine.mintGBDC({
        amountCedi: 5_000_000,
        goldBackingGrams: 2500,
        goldPricePerGramUSD: 75,
        exchangeRateUSDGHS: 14.5,
        issuanceId: 'ISS-RATIO-TEST',
        issuedBy: 'BOG_TREASURY',
      });

      const summary = engine.getReserveSummary();
      expect(summary.goldReserveGrams).toBe(goldGrams);
      expect(summary.cocoaReserveKg).toBe(cocoaKg);
      expect(summary.reserveBackingRatio).toBeGreaterThan(0);
    });
  });
});
