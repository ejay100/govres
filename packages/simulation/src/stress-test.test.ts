/**
 * GOVRES — Stress Test Validation
 * Tests the high-throughput batch operations: GBDC mint, CRDN issue, gold registration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LedgerEngine } from '@govres/ledger';
import { UserRole } from '@govres/shared';

describe('Stress Test Scenarios', () => {
  let engine: LedgerEngine;

  beforeEach(() => {
    engine = new LedgerEngine('stress-test-validator');
    engine.initialize();
    engine.registerGoldReserve(10_000_000, 'stress-gold-attestation');
    engine.registerCocoaReserve(500_000, 'stress-cocoa-attestation');
  });

  describe('High-Volume GBDC Minting', () => {
    it('should handle batch minting of 100 GBDC instruments', () => {
      const count = 100;
      const ids: string[] = [];

      for (let i = 0; i < count; i++) {
        const id = engine.mintGBDC({
          amountCedi: 10_000,
          goldBackingGrams: 5,
          goldPricePerGramUSD: 75,
          exchangeRateUSDGHS: 14.5,
          issuanceId: `STRESS-MINT-${i}`,
          issuedBy: 'BOG_TREASURY',
        });
        ids.push(id);
      }

      expect(ids).toHaveLength(count);
      expect(new Set(ids).size).toBe(count); // All unique IDs
      expect(engine.getTotalGBDCOutstanding()).toBe(10_000 * count);
    });
  });

  describe('High-Volume CRDN Issuance', () => {
    it('should handle batch issuance of 50 CRDNs', () => {
      const count = 50;
      const crdnIds: string[] = [];

      for (let i = 0; i < count; i++) {
        engine.registerAccount(`STRESS_FARMER_${i}`, UserRole.FARMER);
        engine.registerAccount(`STRESS_LBC_${i}`, UserRole.LBC);

        const crdnId = engine.issueCRDN({
          farmerId: `STRESS_FARMER_${i}`,
          lbcId: `STRESS_LBC_${i}`,
          cocoaWeightKg: 640,
          pricePerKgGHS: 99.89,
          warehouseReceiptId: `STRESS-WR-${i}`,
          seasonYear: '2025/2026',
          attestationHash: `stress-attest-${i}`,
        });
        crdnIds.push(crdnId);
      }

      expect(crdnIds).toHaveLength(count);
      expect(new Set(crdnIds).size).toBe(count);
      expect(engine.getTotalCRDNOutstanding()).toBeCloseTo(640 * 99.89 * count, 0);
    });
  });

  describe('Mixed Operations Throughput', () => {
    it('should handle interleaved GBDC and CRDN operations', () => {
      let gbdcCount = 0;
      let crdnCount = 0;
      const iterations = 30;

      for (let i = 0; i < iterations; i++) {
        // Mint GBDC
        engine.mintGBDC({
          amountCedi: 50_000,
          goldBackingGrams: 25,
          goldPricePerGramUSD: 75,
          exchangeRateUSDGHS: 14.5,
          issuanceId: `MIX-MINT-${i}`,
          issuedBy: 'BOG_TREASURY',
        });
        gbdcCount++;

        // Issue CRDN
        engine.registerAccount(`MIX_FARMER_${i}`, UserRole.FARMER);
        engine.registerAccount(`MIX_LBC_${i}`, UserRole.LBC);
        engine.issueCRDN({
          farmerId: `MIX_FARMER_${i}`,
          lbcId: `MIX_LBC_${i}`,
          cocoaWeightKg: 320,
          pricePerKgGHS: 99.89,
          warehouseReceiptId: `MIX-WR-${i}`,
          seasonYear: '2025/2026',
          attestationHash: `mix-attest-${i}`,
        });
        crdnCount++;
      }

      expect(engine.getTotalGBDCOutstanding()).toBe(50_000 * gbdcCount);
      expect(engine.getTotalCRDNOutstanding()).toBeCloseTo(320 * 99.89 * crdnCount, 0);

      const summary = engine.getReserveSummary();
      // 2 initial accounts (BOG_TREASURY, BOG_RESERVE) + 30 farmers + 30 LBCs = 62
      expect(summary.accountCount).toBe(2 + iterations * 2);
    });
  });

  describe('Account Scalability', () => {
    it('should handle 200 account registrations', () => {
      const count = 200;
      const roles: UserRole[] = [
        UserRole.FARMER,
        UserRole.LBC,
        UserRole.CONTRACTOR,
        UserRole.COMMERCIAL_BANK,
        UserRole.GOVT_AGENCY,
      ];

      for (let i = 0; i < count; i++) {
        const role = roles[i % roles.length];
        engine.registerAccount(`SCALE_ACCOUNT_${i}`, role);
      }

      const summary = engine.getReserveSummary();
      // 2 initial accounts (BOG_TREASURY, BOG_RESERVE) + 200 = 202
      expect(summary.accountCount).toBe(count + 2);
    });
  });

  describe('Gold Reserve Scalability', () => {
    it('should handle multiple gold reserve registrations', () => {
      const initialGold = engine.getReserveSummary().goldReserveGrams;
      const additions = 20;
      let addedGrams = 0;

      for (let i = 0; i < additions; i++) {
        const grams = 1000 + i * 500;
        engine.registerGoldReserve(grams, `gold-batch-attest-${i}`);
        addedGrams += grams;
      }

      const summary = engine.getReserveSummary();
      expect(summary.goldReserveGrams).toBe(initialGold + addedGrams);
    });
  });

  describe('Performance Metrics', () => {
    it('should complete 500 operations within reasonable time', () => {
      const start = performance.now();

      // 200 GBDC mints
      for (let i = 0; i < 200; i++) {
        engine.mintGBDC({
          amountCedi: 1000,
          goldBackingGrams: 0.5,
          goldPricePerGramUSD: 75,
          exchangeRateUSDGHS: 14.5,
          issuanceId: `PERF-MINT-${i}`,
          issuedBy: 'BOG_TREASURY',
        });
      }

      // 200 account registrations (100 farmers + 100 LBCs)
      for (let i = 0; i < 100; i++) {
        engine.registerAccount(`PERF_FARMER_${i}`, UserRole.FARMER);
        engine.registerAccount(`PERF_LBC_${i}`, UserRole.LBC);
      }

      // 100 CRDN issuances
      for (let i = 0; i < 100; i++) {
        engine.issueCRDN({
          farmerId: `PERF_FARMER_${i}`,
          lbcId: `PERF_LBC_${i}`,
          cocoaWeightKg: 64,
          pricePerKgGHS: 99.89,
          warehouseReceiptId: `PERF-WR-${i}`,
          seasonYear: '2025/2026',
          attestationHash: `perf-attest-${i}`,
        });
      }

      const elapsed = performance.now() - start;
      const tps = 500 / (elapsed / 1000);

      // Should complete 500 ops in under 5 seconds (very conservative)
      expect(elapsed).toBeLessThan(5000);
      expect(tps).toBeGreaterThan(100); // At least 100 TPS
    });
  });
});
