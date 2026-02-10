/**
 * GOVRES — GoldBod Royalty Oracle Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GoldBodRoyaltyOracle, GoldProductionReport } from './goldbod-royalty';

let oracle: GoldBodRoyaltyOracle;

function makeReport(overrides: Partial<GoldProductionReport> = {}): GoldProductionReport {
  const ounces = overrides.productionOunces ?? 100_000;
  return {
    reportId: overrides.reportId ?? 'RPT-001',
    period: overrides.period ?? { year: 2025, quarter: 1 },
    producerId: 'PROD-001',
    producerName: 'Gold Fields Tarkwa',
    mineId: 'MINE-TARKWA',
    mineName: 'Tarkwa Gold Mine',
    region: overrides.region ?? 'Western',
    productionOunces: ounces,
    productionGrams: ounces * 31.1035,
    goldPricePerOunceUSD: 2_400,
    grossRevenueUSD: ounces * 2_400,
    royaltyRate: 0.05,
    royaltyAmountUSD: ounces * 2_400 * 0.05,
    royaltyAmountGHS: ounces * 2_400 * 0.05 * 15,
    exchangeRateUSDGHS: 15,
    reportDate: new Date('2025-04-01'),
    verifiedBy: 'Minerals Commission',
  };
}

beforeEach(() => {
  oracle = new GoldBodRoyaltyOracle();
});

describe('GoldBodRoyaltyOracle', () => {
  it('records a production report', () => {
    let emitted: any = null;
    oracle.on('report:recorded', (d) => { emitted = d; });
    oracle.recordProductionReport(makeReport());
    expect(emitted).toBeDefined();
  });

  it('calculates total royalties', () => {
    oracle.recordProductionReport(makeReport({ productionOunces: 10_000 }));
    const totals = oracle.getTotalRoyalties();
    expect(totals.totalUSD).toBeGreaterThan(0);
    expect(totals.totalGHS).toBeGreaterThan(0);
  });

  it('breaks down by region', () => {
    oracle.recordProductionReport(makeReport({ region: 'Western', productionOunces: 5_000 }));
    oracle.recordProductionReport(makeReport({ reportId: 'RPT-002', region: 'Ashanti', productionOunces: 3_000 }));
    const breakdown = oracle.getRegionBreakdown();
    expect(breakdown['Western']).toBeDefined();
    expect(breakdown['Ashanti']).toBeDefined();
    expect(breakdown['Western'].ounces).toBe(5_000);
  });

  it('generates forecast', () => {
    oracle.recordProductionReport(makeReport());
    const forecast = oracle.generateForecast({
      year: 2025,
      quarter: 2,
      estimatedGoldPriceUSD: 2_500,
      exchangeRateUSDGHS: 16,
    });
    expect(forecast.forecastId).toBeDefined();
    expect(forecast.estimatedRoyaltyUSD).toBeGreaterThan(0);
  });

  it('generates attestation', () => {
    oracle.recordProductionReport(makeReport());
    const att = oracle.generateAttestation();
    expect(att).toBeDefined();
    expect(att.hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
