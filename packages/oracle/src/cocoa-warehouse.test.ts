/**
 * GOVRES — Cocoa Warehouse Oracle Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CocoaWarehouseOracle, FarmGateDelivery } from './cocoa-warehouse';
import { COCOA_REGIONS } from '@govres/shared';

let oracle: CocoaWarehouseOracle;

function makeDelivery(overrides: Partial<FarmGateDelivery> = {}): FarmGateDelivery {
  return {
    deliveryId: overrides.deliveryId ?? 'DEL-001',
    farmerId: overrides.farmerId ?? 'FARMER-K1',
    farmerName: 'Kwame Mensah',
    farmerPhone: '+233240000001',
    lbcId: overrides.lbcId ?? 'PBC-001',
    lbcName: 'Produce Buying Company',
    purchaseClerkId: 'CLERK-001',
    region: (overrides.region ?? 'Western') as typeof COCOA_REGIONS[number],
    district: 'Sefwi Wiawso',
    community: 'Benchema',
    bagsCount: overrides.bagsCount ?? 10,
    weightKg: overrides.weightKg ?? 640,
    qualityGrade: 'GRADE_1' as const,
    moistureContent: 7.5,
    beanCount: 100,
    deliveryDate: new Date('2025-03-15'),
    gpsCoordinates: { lat: 6.2, lng: -2.3 },
    seasonYear: overrides.seasonYear ?? '2025',
    clerkSignature: 'sig-clerk',
    farmerThumbprint: 'thumb-farmer',
  };
}

beforeEach(() => {
  oracle = new CocoaWarehouseOracle(50); // 50 GHS/kg producer price
});

describe('CocoaWarehouseOracle', () => {
  it('records a delivery and returns receipt', () => {
    const receipt = oracle.recordDelivery(makeDelivery());
    expect(receipt).toBeDefined();
    expect(receipt.receiptId).toBeDefined();
    expect(receipt.weightKg).toBe(640);
  });

  it('emits delivery:recorded with correct value', () => {
    let emitted: any = null;
    oracle.on('delivery:recorded', (d: any) => { emitted = d; });
    oracle.recordDelivery(makeDelivery({ weightKg: 640 }));
    // 640 kg * 50 GHS/kg = 32,000 GHS
    expect(emitted).toBeDefined();
    expect(emitted.valueCedi).toBe(32_000);
  });

  it('updates producer price', () => {
    oracle.updateProducerPrice(60);
    expect(oracle.getProducerPrice()).toBe(60);
  });

  it('uses updated price for new deliveries', () => {
    oracle.updateProducerPrice(100);
    let emitted: any = null;
    oracle.on('delivery:recorded', (d: any) => { emitted = d; });
    oracle.recordDelivery(makeDelivery({ weightKg: 100 }));
    expect(emitted.valueCedi).toBe(10_000);
  });

  it('generates attestation', () => {
    // Attestation needs warehouse entries, but should still work with empty warehouse
    const att = oracle.generateAttestation('WH-001');
    expect(att).toBeDefined();
    expect(att.attestationId).toBeDefined();
    expect(att.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns season summary', () => {
    oracle.recordDelivery(makeDelivery({ deliveryId: 'D1', weightKg: 640, seasonYear: '2025' }));
    oracle.recordDelivery(makeDelivery({ deliveryId: 'D2', weightKg: 320, seasonYear: '2025' }));
    const summary = oracle.getSeasonSummary('2025');
    expect(summary.totalDeliveries).toBe(2);
    expect(summary.totalWeightKg).toBe(960);
  });

  it('emits weight anomaly when weight deviates >5% from bags * 64kg', () => {
    let anomaly: any = null;
    oracle.on('anomaly:weight', (a: any) => { anomaly = a; });
    // 10 bags = 640 expected, but we say 500: variance ~22%
    oracle.recordDelivery(makeDelivery({ deliveryId: 'ANOM', weightKg: 500 }));
    expect(anomaly).toBeDefined();
    expect(anomaly.deliveryId).toBe('ANOM');
  });

  it('downgrades to SUB_STANDARD when moisture > 8', () => {
    const delivery = makeDelivery({ deliveryId: 'WET' });
    delivery.moistureContent = 9.5;
    delivery.qualityGrade = 'GRADE_1';
    const receipt = oracle.recordDelivery(delivery);
    // The oracle mutates the delivery to SUB_STANDARD before creating receipt
    expect(receipt.qualityGrade).toBe('SUB_STANDARD');
  });

  it('records warehouse entry and emits events', () => {
    oracle.recordDelivery(makeDelivery({ deliveryId: 'D-WH' }));
    let emitted: any = null;
    oracle.on('warehouse:entry', (e: any) => { emitted = e; });
    oracle.recordWarehouseEntry({
      entryId: 'WE-001',
      warehouseId: 'WH-KUMASI',
      warehouseName: 'Kumasi Warehouse',
      warehouseRegion: 'Ashanti' as any,
      deliveryIds: ['D-WH'],
      totalBags: 10,
      totalWeightKg: 640,
      qualityCheckedBy: 'QCC Inspector',
      qualityCheckDate: new Date(),
      qualityResult: 'PASSED',
      stackNumber: 'S-001',
      gradeBreakdown: { grade1Bags: 8, grade2Bags: 2, subStandardBags: 0 },
      storedAt: new Date(),
    });
    expect(emitted).toBeDefined();
    expect(emitted.warehouseId).toBe('WH-KUMASI');
  });

  it('season summary returns quality breakdown', () => {
    oracle.recordDelivery(makeDelivery({ deliveryId: 'G1', seasonYear: '2025' }));
    const d2 = makeDelivery({ deliveryId: 'G2', seasonYear: '2025' });
    d2.qualityGrade = 'GRADE_2';
    oracle.recordDelivery(d2);
    const summary = oracle.getSeasonSummary('2025');
    expect(summary.qualityBreakdown.grade1Percent).toBe(50);
    expect(summary.qualityBreakdown.grade2Percent).toBe(50);
  });

  it('empty season returns zero breakdown', () => {
    const summary = oracle.getSeasonSummary('1999');
    expect(summary.totalDeliveries).toBe(0);
    expect(summary.qualityBreakdown.grade1Percent).toBe(0);
  });
});
