/**
 * GOVRES — Cocoa Flow Simulation Tests
 * Validates the full cocoa season simulation:
 * farmer delivery → CRDN issuance → conversion → MoMo cashout
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LedgerEngine } from '@govres/ledger';
import { UserRole, FINANCIAL, COCOA_REGIONS } from '@govres/shared';
import { CocoaWarehouseOracle, FarmGateDelivery } from '../../oracle/src/cocoa-warehouse';

function makeDelivery(overrides: Partial<FarmGateDelivery> = {}): FarmGateDelivery {
  return {
    deliveryId: `DEL-${Date.now().toString(36)}`,
    farmerId: 'FARMER_001',
    farmerName: 'Kwame Asante',
    farmerPhone: '+233201234567',
    lbcId: 'LBC_001',
    lbcName: 'PBC Ltd',
    purchaseClerkId: 'CLERK_001',
    region: 'Ashanti' as typeof COCOA_REGIONS[number],
    district: 'Bekwai Municipal',
    community: 'Bekwai',
    bagsCount: 10,
    weightKg: 640,
    qualityGrade: 'GRADE_1',
    moistureContent: 6.5,
    beanCount: 95,
    deliveryDate: new Date(),
    gpsCoordinates: { lat: 6.4584, lng: -1.5710 },
    seasonYear: '2025/2026',
    clerkSignature: 'sig-clerk-001',
    farmerThumbprint: 'thumb-farmer-001',
    ...overrides,
  };
}

describe('Cocoa Flow Simulation', () => {
  let engine: LedgerEngine;
  let oracle: CocoaWarehouseOracle;

  beforeEach(() => {
    engine = new LedgerEngine('cocoa-test-validator');
    engine.initialize();
    oracle = new CocoaWarehouseOracle(99.89); // GHS per kg producer price
  });

  describe('Farmer Delivery Flow', () => {
    it('should register farmer and LBC accounts', () => {
      engine.registerAccount('FARMER_001', UserRole.FARMER);
      engine.registerAccount('LBC_001', UserRole.LBC);

      const farmerAcct = engine.getAccountBalance('FARMER_001');
      const lbcAcct = engine.getAccountBalance('LBC_001');
      expect(farmerAcct).toBeDefined();
      expect(lbcAcct).toBeDefined();
      expect(farmerAcct!.role).toBe(UserRole.FARMER);
      expect(lbcAcct!.role).toBe(UserRole.LBC);
    });

    it('should record cocoa delivery in oracle', () => {
      const receipt = oracle.recordDelivery(makeDelivery({ deliveryId: 'DEL-TEST-001' }));
      expect(receipt).toBeDefined();
      expect(receipt.receiptId).toBeDefined();
      expect(typeof receipt.receiptId).toBe('string');
      expect(receipt.weightKg).toBe(640);
      expect(receipt.bagsCount).toBe(10);
    });

    it('should issue CRDN after delivery', () => {
      engine.registerAccount('FARMER_001', UserRole.FARMER);
      engine.registerAccount('LBC_001', UserRole.LBC);
      engine.registerCocoaReserve(10000, 'test-attestation-hash');

      const crdnId = engine.issueCRDN({
        farmerId: 'FARMER_001',
        lbcId: 'LBC_001',
        cocoaWeightKg: 640,
        pricePerKgGHS: 99.89,
        warehouseReceiptId: 'WR-001',
        seasonYear: '2025/2026',
        attestationHash: 'test-attestation',
      });

      expect(crdnId).toBeDefined();
      const crdn = engine.getCRDNRecord(crdnId);
      expect(crdn).toBeDefined();
      expect(crdn!.amountCedi).toBeCloseTo(640 * 99.89, 0);
    });

    it('should convert CRDN to GBDC', () => {
      engine.registerAccount('FARMER_001', UserRole.FARMER);
      engine.registerAccount('LBC_001', UserRole.LBC);
      engine.registerCocoaReserve(10000, 'test-attestation');
      engine.registerGoldReserve(100000, 'gold-attestation');

      // Mint GBDC first for liquidity (use BOG_TREASURY — the initial BOG_ADMIN account)
      engine.mintGBDC({
        amountCedi: 1_000_000,
        goldBackingGrams: 500,
        goldPricePerGramUSD: 75,
        exchangeRateUSDGHS: 14.5,
        issuanceId: 'ISS-001',
        issuedBy: 'BOG_TREASURY',
      });

      const crdnId = engine.issueCRDN({
        farmerId: 'FARMER_001',
        lbcId: 'LBC_001',
        cocoaWeightKg: 640,
        pricePerKgGHS: 99.89,
        warehouseReceiptId: 'WR-001',
        seasonYear: '2025/2026',
        attestationHash: 'test-attestation',
      });

      const txId = engine.convertCRDN({
        instrumentId: crdnId,
        farmerId: 'FARMER_001',
        targetInstrument: 'GBDC',
      });

      expect(txId).toBeDefined();
      const crdn = engine.getCRDNRecord(crdnId);
      expect(crdn!.status).toBe('CONVERTED');
    });
  });

  describe('Multiple Farmer Season Simulation', () => {
    it('should handle multiple farmers delivering cocoa', () => {
      const farmerCount = 5;

      engine.registerCocoaReserve(100000, 'bulk-attestation');

      for (let i = 0; i < farmerCount; i++) {
        engine.registerAccount(`FARMER_${i}`, UserRole.FARMER);
      }
      engine.registerAccount('LBC_001', UserRole.LBC);

      const crdnIds: string[] = [];
      for (let i = 0; i < farmerCount; i++) {
        const crdnId = engine.issueCRDN({
          farmerId: `FARMER_${i}`,
          lbcId: 'LBC_001',
          cocoaWeightKg: 640,
          pricePerKgGHS: 99.89,
          warehouseReceiptId: `WR-${i}`,
          seasonYear: '2025/2026',
          attestationHash: 'bulk-attestation',
        });
        crdnIds.push(crdnId);
      }

      expect(crdnIds).toHaveLength(farmerCount);
      expect(engine.getTotalCRDNOutstanding()).toBeCloseTo(640 * 99.89 * farmerCount, 0);
    });

    it('should track reserve summary after issuances', () => {
      engine.registerCocoaReserve(50000, 'reserve-attestation');
      engine.registerGoldReserve(100000, 'gold-attestation');
      engine.registerAccount('FARMER_A', UserRole.FARMER);
      engine.registerAccount('LBC_A', UserRole.LBC);

      engine.issueCRDN({
        farmerId: 'FARMER_A',
        lbcId: 'LBC_A',
        cocoaWeightKg: 1000,
        pricePerKgGHS: 99.89,
        warehouseReceiptId: 'WR-A',
        seasonYear: '2025/2026',
        attestationHash: 'test-attest',
      });

      const summary = engine.getReserveSummary();
      expect(summary.cocoaReserveKg).toBe(50000);
      expect(summary.goldReserveGrams).toBe(100000);
      expect(summary.totalCRDNOutstanding).toBeGreaterThan(0);
      // 2 initial accounts (BOG_TREASURY, BOG_RESERVE) + FARMER_A + LBC_A = 4
      expect(summary.accountCount).toBe(4);
    });
  });

  describe('Oracle Season Summary', () => {
    it('should aggregate season stats', () => {
      oracle.recordDelivery(makeDelivery({
        deliveryId: 'DEL-001',
        farmerId: 'F1',
        farmerName: 'Farmer 1',
        lbcId: 'LBC1',
        lbcName: 'PBC',
        region: 'Ashanti' as typeof COCOA_REGIONS[number],
        community: 'Bekwai',
        weightKg: 640,
        bagsCount: 10,
        moistureContent: 5.0,
        seasonYear: '2025/2026',
      }));
      oracle.recordDelivery(makeDelivery({
        deliveryId: 'DEL-002',
        farmerId: 'F2',
        farmerName: 'Farmer 2',
        lbcId: 'LBC1',
        lbcName: 'PBC',
        region: 'Western' as typeof COCOA_REGIONS[number],
        community: 'Tarkwa',
        weightKg: 1280,
        bagsCount: 20,
        moistureContent: 6.0,
        seasonYear: '2025/2026',
      }));

      const summary = oracle.getSeasonSummary('2025/2026');
      expect(summary.totalDeliveries).toBe(2);
      expect(summary.totalWeightKg).toBe(1920);
      expect(summary.totalBags).toBe(30);
    });

    it('should detect moisture anomalies and downgrade quality', () => {
      const receipt = oracle.recordDelivery(makeDelivery({
        deliveryId: 'DEL-WET-001',
        farmerId: 'F1',
        farmerName: 'Wet Farmer',
        region: 'Ashanti' as typeof COCOA_REGIONS[number],
        weightKg: 640,
        bagsCount: 10,
        moistureContent: 9.5,  // Above 8% threshold
        qualityGrade: 'GRADE_1',
        seasonYear: '2025/2026',
      }));

      // The oracle should have downgraded to SUB_STANDARD
      const summary = oracle.getSeasonSummary('2025/2026');
      expect(summary.totalDeliveries).toBe(1);
      // Quality should be downgraded due to high moisture
      expect(summary.qualityBreakdown.subStandardPercent).toBe(100);
    });
  });
});
