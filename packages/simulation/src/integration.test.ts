/**
 * GOVRES — End-to-End Integration Tests
 * Tests the full money creation and settlement lifecycle:
 * Gold Reserve → GBDC Mint → Contractor Payment → Bank Settlement
 * Cocoa Delivery → Oracle Attestation → CRDN Issue → Farmer Cashout
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LedgerEngine } from '@govres/ledger';
import { UserRole, COCOA_REGIONS, GOLD_MINING_REGIONS } from '@govres/shared';
import { CocoaWarehouseOracle, FarmGateDelivery } from '../../oracle/src/cocoa-warehouse';
import { GoldVaultOracle } from '../../oracle/src/gold-vault';
import { GoldBodRoyaltyOracle } from '../../oracle/src/goldbod-royalty';

function makeDelivery(overrides: Partial<FarmGateDelivery> = {}): FarmGateDelivery {
  return {
    deliveryId: `DEL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
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

describe('Integration: Full Money Creation Lifecycle', () => {
  let engine: LedgerEngine;

  beforeEach(() => {
    engine = new LedgerEngine('integration-validator');
    engine.initialize();
  });

  describe('GBDC Money Printing Flow', () => {
    it('should complete full cycle: reserve → mint → transfer → redeem', () => {
      // Step 1: Register gold reserve (sovereign asset backing)
      engine.registerGoldReserve(1_000_000, 'gold-attestation-hash');

      // Step 2: Register accounts
      engine.registerAccount('GCB_BANK', UserRole.COMMERCIAL_BANK);
      engine.registerAccount('JOSPONG_GROUP', UserRole.CONTRACTOR);

      // Step 3: Mint GBDC (print money backed by gold) — BOG_TREASURY is created by initialize()
      const gbdcId = engine.mintGBDC({
        amountCedi: 50_000_000,
        goldBackingGrams: 25_000,
        goldPricePerGramUSD: 75,
        exchangeRateUSDGHS: 14.5,
        issuanceId: 'ISS-INTEGRATION-001',
        issuedBy: 'BOG_TREASURY',
      });
      expect(gbdcId).toBeDefined();
      expect(engine.getTotalGBDCOutstanding()).toBe(50_000_000);

      // Step 4: Transfer to contractor from BOG_TREASURY
      const txId = engine.transferGBDC({
        instrumentId: gbdcId,
        fromAccount: 'BOG_TREASURY',
        toAccount: 'JOSPONG_GROUP',
        amountCedi: 20_000_000,
        description: 'Sanitation infrastructure contract payment',
      });
      expect(txId).toBeDefined();

      // Step 5: Verify chain state
      const summary = engine.getReserveSummary();
      expect(summary.goldReserveGrams).toBe(1_000_000);
      expect(summary.totalGBDCOutstanding).toBe(50_000_000);
      // 2 initial (BOG_TREASURY, BOG_RESERVE) + GCB_BANK + JOSPONG_GROUP = 4
      expect(summary.accountCount).toBe(4);
    });

    it('should enforce gold reserve ceiling on minting', () => {
      // 10% allocation: 1000g reserve → max 100g backing
      engine.registerGoldReserve(1000, 'small-reserve-attest');

      // First mint should succeed (within 10% = 100g limit)
      const gbdc1 = engine.mintGBDC({
        amountCedi: 100_000,
        goldBackingGrams: 50,
        goldPricePerGramUSD: 75,
        exchangeRateUSDGHS: 14.5,
        issuanceId: 'ISS-LIMIT-1',
        issuedBy: 'BOG_TREASURY',
      });
      expect(gbdc1).toBeDefined();

      // Second mint should fail if it exceeds ceiling (50 + 80 = 130 > 100)
      expect(() => {
        engine.mintGBDC({
          amountCedi: 500_000,
          goldBackingGrams: 80,
          goldPricePerGramUSD: 75,
          exchangeRateUSDGHS: 14.5,
          issuanceId: 'ISS-LIMIT-2',
          issuedBy: 'BOG_TREASURY',
        });
      }).toThrow();
    });
  });

  describe('CRDN Cocoa Receipt Flow', () => {
    it('should complete full cycle: delivery → CRDN → conversion', () => {
      // Setup reserves
      engine.registerGoldReserve(500_000, 'gold-attest');
      engine.registerCocoaReserve(100_000, 'cocoa-attest');

      // Register participants
      engine.registerAccount('KWAME_ASANTE', UserRole.FARMER);
      engine.registerAccount('PBC_LTD', UserRole.LBC);

      // Mint GBDC for liquidity pool (using BOG_TREASURY — BOG_ADMIN role)
      engine.mintGBDC({
        amountCedi: 100_000_000,
        goldBackingGrams: 10_000,
        goldPricePerGramUSD: 75,
        exchangeRateUSDGHS: 14.5,
        issuanceId: 'ISS-LIQUIDITY',
        issuedBy: 'BOG_TREASURY',
      });

      // Issue CRDN for cocoa delivery
      const crdnId = engine.issueCRDN({
        farmerId: 'KWAME_ASANTE',
        lbcId: 'PBC_LTD',
        cocoaWeightKg: 6_400,  // 100 bags × 64kg
        pricePerKgGHS: 99.89,
        warehouseReceiptId: 'WR-INT-001',
        seasonYear: '2025/2026',
        attestationHash: 'cocoa-attest',
      });

      expect(crdnId).toBeDefined();
      const crdn = engine.getCRDNRecord(crdnId);
      expect(crdn!.amountCedi).toBeCloseTo(6_400 * 99.89, 0);

      // Convert CRDN to GBDC (farmer cashout)
      const convertTx = engine.convertCRDN({
        instrumentId: crdnId,
        farmerId: 'KWAME_ASANTE',
        targetInstrument: 'GBDC',
      });
      expect(convertTx).toBeDefined();

      // Verify CRDN converted
      const convertedCrdn = engine.getCRDNRecord(crdnId);
      expect(convertedCrdn!.status).toBe('CONVERTED');

      // Verify farmer balance updated
      const farmerBalance = engine.getAccountBalance('KWAME_ASANTE');
      expect(farmerBalance!.gbdcBalance).toBeCloseTo(6_400 * 99.89, 0);
    });
  });

  describe('Combined Operations', () => {
    it('should handle both GBDC and CRDN simultaneously', () => {
      engine.registerGoldReserve(5_000_000, 'gold-combined');
      engine.registerCocoaReserve(200_000, 'cocoa-combined');

      // Mint GBDC for infrastructure (using BOG_TREASURY)
      engine.mintGBDC({
        amountCedi: 200_000_000,
        goldBackingGrams: 50_000,
        goldPricePerGramUSD: 75,
        exchangeRateUSDGHS: 14.5,
        issuanceId: 'ISS-COMBINED',
        issuedBy: 'BOG_TREASURY',
      });

      // Issue CRDNs for 10 farmers
      for (let i = 0; i < 10; i++) {
        engine.registerAccount(`FARMER_${i}`, UserRole.FARMER);
        engine.registerAccount(`LBC_${i}`, UserRole.LBC);
        engine.issueCRDN({
          farmerId: `FARMER_${i}`,
          lbcId: `LBC_${i}`,
          cocoaWeightKg: 3_200,
          pricePerKgGHS: 99.89,
          warehouseReceiptId: `WR-COMBINED-${i}`,
          seasonYear: '2025/2026',
          attestationHash: `combined-attest-${i}`,
        });
      }

      const summary = engine.getReserveSummary();
      expect(summary.totalGBDCOutstanding).toBe(200_000_000);
      expect(summary.totalCRDNOutstanding).toBeCloseTo(3_200 * 99.89 * 10, 0);
      // 2 initial + 10 farmers + 10 LBCs = 22
      expect(summary.accountCount).toBe(22);
      expect(summary.reserveBackingRatio).toBeGreaterThan(0);
    });
  });

  describe('Oracle Integration', () => {
    it('should use oracle attestation for cocoa reserve', () => {
      const oracle = new CocoaWarehouseOracle(99.89);

      // Record deliveries through oracle
      const deliveries = [
        { farmerId: 'F1', farmerName: 'Ama Serwaa', region: 'Ashanti' as typeof COCOA_REGIONS[number], weightKg: 3200, bags: 50 },
        { farmerId: 'F2', farmerName: 'Kofi Mensah', region: 'Western' as typeof COCOA_REGIONS[number], weightKg: 6400, bags: 100 },
        { farmerId: 'F3', farmerName: 'Yaa Asantewaa', region: 'Eastern' as typeof COCOA_REGIONS[number], weightKg: 1280, bags: 20 },
      ];

      for (const d of deliveries) {
        oracle.recordDelivery(makeDelivery({
          deliveryId: `DEL-${d.farmerId}`,
          farmerId: d.farmerId,
          farmerName: d.farmerName,
          lbcId: 'LBC_MAIN',
          lbcName: 'PBC Ltd',
          region: d.region,
          community: 'Test Community',
          weightKg: d.weightKg,
          bagsCount: d.bags,
          moistureContent: 6.0,
          seasonYear: '2025/2026',
        }));
      }

      const season = oracle.getSeasonSummary('2025/2026');
      expect(season.totalDeliveries).toBe(3);
      expect(season.totalWeightKg).toBe(10880);
      expect(season.totalBags).toBe(170);
    });

    it('should integrate gold vault oracle with ledger', () => {
      const goldOracle = new GoldVaultOracle();

      goldOracle.registerSensor({
        sensorId: 'W1',
        vaultId: 'BOG_VAULT_1',
        type: 'WEIGHT',
        manufacturer: 'Mettler Toledo',
        calibrationDate: new Date(),
        calibrationCertificate: 'CAL-1',
        readingIntervalSeconds: 60,
        tolerancePercent: 0.5,
      });

      goldOracle.registerBar({
        barId: 'BAR_INT_1',
        assayFingerprint: 'FP-INT-1',
        purity: 99.99,
        weightGrams: 12441,
        refineryId: 'PMMC',
        assayLab: 'PMMC Lab',
        assayDate: new Date(),
        certificateHash: 'cert-int-1',
        xrfSignature: 'xrf-int-1',
      });

      const attestation = goldOracle.generateAttestation('BOG_VAULT_1');
      expect(attestation.verified).toBe(true);

      // Register in ledger with attestation
      engine.registerGoldReserve(12441, attestation.hash);
      const summary = engine.getReserveSummary();
      expect(summary.goldReserveGrams).toBe(12441);
    });

    it('should integrate goldbod royalty oracle', () => {
      const royaltyOracle = new GoldBodRoyaltyOracle();

      royaltyOracle.recordProductionReport({
        reportId: 'RPT-INT-001',
        period: { year: 2025, quarter: 1 },
        producerId: 'NEWMONT',
        producerName: 'Newmont Ahafo',
        mineId: 'AHAFO',
        mineName: 'Ahafo Mine',
        region: 'Ashanti' as typeof GOLD_MINING_REGIONS[number],
        productionOunces: 250_000,
        productionGrams: 250_000 * 31.1035,
        goldPricePerOunceUSD: 2400,
        grossRevenueUSD: 250_000 * 2400,
        royaltyRate: 0.05,
        royaltyAmountUSD: 250_000 * 2400 * 0.05,
        royaltyAmountGHS: 250_000 * 2400 * 0.05 * 14.5,
        exchangeRateUSDGHS: 14.5,
        reportDate: new Date(),
        verifiedBy: 'Minerals Commission',
      });

      const forecast = royaltyOracle.generateForecast({
        year: 2025,
        quarter: 2,
        estimatedGoldPriceUSD: 2500,
        exchangeRateUSDGHS: 14.5,
      });

      expect(forecast.estimatedRoyaltyGHS).toBeGreaterThan(0);
      expect(forecast.confidence).toBeDefined();
    });
  });
});
