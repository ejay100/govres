/**
 * GOVRES — GoldBod Royalty Oracle
 * 
 * Integrates with GoldBod royalty feeds to enable royalty-backed 
 * infrastructure notes and gold reserve forecasting.
 * 
 * Per whitepaper Section 10 (GoldBod Integration):
 * - Gold production & royalty forecasts feed GOVRES
 * - Enables Royalty-Backed Infrastructure Notes
 * - Monetizes royalties without selling assets
 * 
 * Ghana Gold Context:
 * - ~$20B annual gold exports
 * - Major producers: Newmont (Ahafo, Akyem), AngloGold Ashanti (Obuasi),
 *   Gold Fields (Damang, Tarkwa), Kinross (Chirano)
 * - Mining regions: Ashanti, Western, Central, Eastern, Upper East
 * - Royalty rate: 5% of gross revenue (Minerals & Mining Act 2006, Act 703)
 * - Managed by Minerals Commission and proposed GoldBod
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';
import { OracleSourceType, OracleAttestation, SYSTEM, GOLD_MINING_REGIONS } from '@govres/shared';

// ─── Types ──────────────────────────────────────────────────────

export interface GoldProductionReport {
  reportId: string;
  period: { year: number; quarter: number };
  producerId: string;
  producerName: string;
  mineId: string;
  mineName: string;
  region: typeof GOLD_MINING_REGIONS[number];
  productionOunces: number;           // Troy ounces produced
  productionGrams: number;            // Grams produced
  goldPricePerOunceUSD: number;       // Average price during period
  grossRevenueUSD: number;
  royaltyRate: number;                // 5% per Act 703
  royaltyAmountUSD: number;
  royaltyAmountGHS: number;
  exchangeRateUSDGHS: number;
  reportDate: Date;
  verifiedBy: string;                 // Minerals Commission verifier
}

export interface RoyaltyForecast {
  forecastId: string;
  period: { year: number; quarter: number };
  estimatedProductionOunces: number;
  estimatedGoldPriceUSD: number;
  estimatedRoyaltyUSD: number;
  estimatedRoyaltyGHS: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  assumptions: string[];
  createdAt: Date;
}

export interface RoyaltyBackedNote {
  noteId: string;
  principalGHS: number;
  backingRoyaltyIds: string[];      // Production report IDs
  forecastIds: string[];            // Forecast IDs
  yieldPercent: number;
  maturityMonths: number;
  status: 'DRAFT' | 'ISSUED' | 'ACTIVE' | 'MATURED' | 'REDEEMED';
  issuedAt?: Date;
}

// ─── Gold Mining Companies Registry ─────────────────────────────

export const MAJOR_GOLD_PRODUCERS = [
  { id: 'NEWMONT_AHAFO', name: 'Newmont Corporation - Ahafo Mine', region: 'Ashanti' as const },
  { id: 'NEWMONT_AKYEM', name: 'Newmont Corporation - Akyem Mine', region: 'Eastern' as const },
  { id: 'AGA_OBUASI', name: 'AngloGold Ashanti - Obuasi Mine', region: 'Ashanti' as const },
  { id: 'GOLDFIELDS_TARKWA', name: 'Gold Fields - Tarkwa Mine', region: 'Western' as const },
  { id: 'GOLDFIELDS_DAMANG', name: 'Gold Fields - Damang Mine', region: 'Western' as const },
  { id: 'KINROSS_CHIRANO', name: 'Kinross Gold - Chirano Mine', region: 'Western' as const },
  { id: 'ASANKO_GOLD', name: 'Galiano Gold - Asanko Mine', region: 'Ashanti' as const },
  { id: 'PERSEUS_EDIKAN', name: 'Perseus Mining - Edikan Mine', region: 'Western' as const },
  { id: 'CARDINAL_NAMDINI', name: 'Cardinal Resources - Namdini Mine', region: 'Upper East' as const },
] as const;

// ─── GoldBod Royalty Oracle ─────────────────────────────────────

export class GoldBodRoyaltyOracle extends EventEmitter {
  private productionReports: Map<string, GoldProductionReport> = new Map();
  private forecasts: Map<string, RoyaltyForecast> = new Map();
  private royaltyNotes: Map<string, RoyaltyBackedNote> = new Map();
  private attestations: Map<string, OracleAttestation> = new Map();

  /** Standard royalty rate per Minerals & Mining Act 2006 (Act 703) */
  private readonly ROYALTY_RATE = 0.05;

  constructor() {
    super();
  }

  /**
   * Record a gold production report from a mining company
   */
  recordProductionReport(report: GoldProductionReport): void {
    // Validate royalty calculation
    const expectedRoyalty = report.grossRevenueUSD * this.ROYALTY_RATE;
    if (Math.abs(report.royaltyAmountUSD - expectedRoyalty) > 1) {
      this.emit('anomaly:royalty_mismatch', {
        reportId: report.reportId,
        expected: expectedRoyalty,
        reported: report.royaltyAmountUSD,
      });
    }

    this.productionReports.set(report.reportId, report);
    this.emit('production:recorded', {
      reportId: report.reportId,
      producer: report.producerName,
      ounces: report.productionOunces,
      royaltyUSD: report.royaltyAmountUSD,
    });
  }

  /**
   * Generate a royalty forecast based on historical data
   */
  generateForecast(params: {
    year: number;
    quarter: number;
    estimatedGoldPriceUSD: number;
    exchangeRateUSDGHS: number;
  }): RoyaltyForecast {
    // Calculate average quarterly production from historical reports
    const historicalReports = Array.from(this.productionReports.values());
    const avgQuarterlyOunces = historicalReports.length > 0
      ? historicalReports.reduce((sum, r) => sum + r.productionOunces, 0) / Math.max(historicalReports.length, 1)
      : 1_000_000; // Default estimate: ~1M oz/quarter (Ghana produces ~4M oz/year)

    const estimatedRevenue = avgQuarterlyOunces * params.estimatedGoldPriceUSD;
    const estimatedRoyaltyUSD = estimatedRevenue * this.ROYALTY_RATE;

    const forecast: RoyaltyForecast = {
      forecastId: `FORECAST-${params.year}Q${params.quarter}-${crypto.randomBytes(4).toString('hex')}`,
      period: { year: params.year, quarter: params.quarter },
      estimatedProductionOunces: avgQuarterlyOunces,
      estimatedGoldPriceUSD: params.estimatedGoldPriceUSD,
      estimatedRoyaltyUSD,
      estimatedRoyaltyGHS: estimatedRoyaltyUSD * params.exchangeRateUSDGHS,
      confidence: historicalReports.length > 4 ? 'HIGH' : historicalReports.length > 1 ? 'MEDIUM' : 'LOW',
      assumptions: [
        `Gold price: $${params.estimatedGoldPriceUSD}/oz`,
        `Production estimate based on ${historicalReports.length} historical reports`,
        `Royalty rate: ${this.ROYALTY_RATE * 100}% per Act 703`,
        `Exchange rate: 1 USD = ${params.exchangeRateUSDGHS} GHS`,
      ],
      createdAt: new Date(),
    };

    this.forecasts.set(forecast.forecastId, forecast);
    this.emit('forecast:generated', {
      forecastId: forecast.forecastId,
      estimatedRoyaltyGHS: forecast.estimatedRoyaltyGHS,
    });

    return forecast;
  }

  /**
   * Generate attestation for royalty data
   */
  generateAttestation(): OracleAttestation {
    const reports = Array.from(this.productionReports.values());
    const totalRoyaltyUSD = reports.reduce((sum, r) => sum + r.royaltyAmountUSD, 0);
    const totalRoyaltyGHS = reports.reduce((sum, r) => sum + r.royaltyAmountGHS, 0);
    const totalProductionOunces = reports.reduce((sum, r) => sum + r.productionOunces, 0);

    const data = {
      totalReports: reports.length,
      totalProductionOunces,
      totalRoyaltyUSD,
      totalRoyaltyGHS,
      timestamp: new Date(),
      regionBreakdown: this.getRegionBreakdown(),
    };

    const hash = crypto.createHash(SYSTEM.HASH_ALGORITHM).update(JSON.stringify(data)).digest('hex');

    const attestation: OracleAttestation = {
      id: crypto.randomUUID(),
      attestationId: `GOLDBOD-ATT-${Date.now().toString(36)}`,
      sourceType: OracleSourceType.GOLDBOD_ROYALTY,
      sourceId: 'GOLDBOD',
      data,
      hash,
      signature: crypto.createHash(SYSTEM.HASH_ALGORITHM).update(hash + 'GOLDBOD_KEY').digest('hex'),
      verified: true,
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + SYSTEM.ORACLE_ATTESTATION_VALIDITY_HOURS * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'GOLDBOD_ROYALTY_ORACLE',
      version: 1,
    };

    this.attestations.set(attestation.attestationId, attestation);
    return attestation;
  }

  /**
   * Get total royalty collected
   */
  getTotalRoyalties(): { totalUSD: number; totalGHS: number } {
    const reports = Array.from(this.productionReports.values());
    return {
      totalUSD: reports.reduce((sum, r) => sum + r.royaltyAmountUSD, 0),
      totalGHS: reports.reduce((sum, r) => sum + r.royaltyAmountGHS, 0),
    };
  }

  /**
   * Get production by region
   */
  getRegionBreakdown(): Record<string, { ounces: number; royaltyUSD: number }> {
    const breakdown: Record<string, { ounces: number; royaltyUSD: number }> = {};
    for (const report of this.productionReports.values()) {
      if (!breakdown[report.region]) {
        breakdown[report.region] = { ounces: 0, royaltyUSD: 0 };
      }
      breakdown[report.region].ounces += report.productionOunces;
      breakdown[report.region].royaltyUSD += report.royaltyAmountUSD;
    }
    return breakdown;
  }
}
