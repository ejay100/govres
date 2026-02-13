/**
 * GOVRES — Historical Data Feed Tests
 * Validates the 5-year Ghana cocoa, gold, and macro data feed.
 */

import { describe, it, expect } from 'vitest';
import {
  COCOA_HISTORICAL,
  GOLD_HISTORICAL,
  MACRO_HISTORICAL,
  getCocoaByYear,
  getGoldByYear,
  getMacroByYear,
  getCocoaByDateRange,
  getGoldByDateRange,
  getHistoricalFeed,
  getCocoaAnnualSummary,
  getGoldAnnualSummary,
} from './historical-data';

describe('Historical Data Feed', () => {
  describe('Data Completeness', () => {
    it('should have 66 monthly cocoa data points (Jan 2020 – Jun 2025)', () => {
      expect(COCOA_HISTORICAL).toHaveLength(66);
    });

    it('should have 66 monthly gold data points', () => {
      expect(GOLD_HISTORICAL).toHaveLength(66);
    });

    it('should have 66 monthly macro data points', () => {
      expect(MACRO_HISTORICAL).toHaveLength(66);
    });

    it('should have 12 data points per full year', () => {
      for (const year of [2020, 2021, 2022, 2023, 2024]) {
        expect(getCocoaByYear(year)).toHaveLength(12);
        expect(getGoldByYear(year)).toHaveLength(12);
        expect(getMacroByYear(year)).toHaveLength(12);
      }
    });

    it('should have 6 data points for 2025', () => {
      expect(getCocoaByYear(2025)).toHaveLength(6);
      expect(getGoldByYear(2025)).toHaveLength(6);
      expect(getMacroByYear(2025)).toHaveLength(6);
    });
  });

  describe('Data Integrity', () => {
    it('cocoa prices should all be positive', () => {
      COCOA_HISTORICAL.forEach(d => {
        expect(d.worldPriceUSD).toBeGreaterThan(0);
        expect(d.producerPriceGHS).toBeGreaterThan(0);
        expect(d.productionKTonnes).toBeGreaterThan(0);
      });
    });

    it('gold prices should all be positive', () => {
      GOLD_HISTORICAL.forEach(d => {
        expect(d.pricePerOzUSD).toBeGreaterThan(0);
        expect(d.pricePerGramUSD).toBeGreaterThan(0);
        expect(d.productionKOz).toBeGreaterThan(0);
      });
    });

    it('exchange rates should be realistic (1–20 GHS per USD)', () => {
      MACRO_HISTORICAL.forEach(d => {
        expect(d.exchangeRateUSDGHS).toBeGreaterThan(1);
        expect(d.exchangeRateUSDGHS).toBeLessThan(20);
      });
    });

    it('policy rates should be realistic (5–35%)', () => {
      MACRO_HISTORICAL.forEach(d => {
        expect(d.policyRatePercent).toBeGreaterThan(5);
        expect(d.policyRatePercent).toBeLessThan(35);
      });
    });

    it('cocoa prices should reflect 2024 surge', () => {
      const apr2024 = COCOA_HISTORICAL.find(d => d.date === '2024-04');
      expect(apr2024!.worldPriceUSD).toBeGreaterThan(8000);
    });

    it('gold price per gram should be roughly price per oz / 31.1035', () => {
      GOLD_HISTORICAL.forEach(d => {
        const expected = d.pricePerOzUSD / 31.1035;
        expect(d.pricePerGramUSD).toBeCloseTo(expected, 0);
      });
    });
  });

  describe('Query Helpers', () => {
    it('getCocoaByDateRange should return correct range', () => {
      const result = getCocoaByDateRange('2023-06', '2023-12');
      expect(result).toHaveLength(7);
      expect(result[0].date).toBe('2023-06');
      expect(result[result.length - 1].date).toBe('2023-12');
    });

    it('getGoldByDateRange should return correct range', () => {
      const result = getGoldByDateRange('2024-01', '2024-06');
      expect(result).toHaveLength(6);
    });
  });

  describe('Historical Feed', () => {
    it('should return complete feed with summary', () => {
      const feed = getHistoricalFeed();
      expect(feed.cocoa).toHaveLength(66);
      expect(feed.gold).toHaveLength(66);
      expect(feed.macro).toHaveLength(66);
      expect(feed.summary.dateRange.from).toBe('2020-01');
      expect(feed.summary.dateRange.to).toBe('2025-06');
      expect(feed.summary.totalDataPoints).toBe(198);
    });

    it('should compute 5-year averages', () => {
      const feed = getHistoricalFeed();
      expect(feed.summary.fiveYearAvgCocoaUSD).toBeGreaterThan(2000);
      expect(feed.summary.fiveYearAvgGoldUSD).toBeGreaterThan(1500);
    });

    it('should show positive price changes over 5 years', () => {
      const feed = getHistoricalFeed();
      expect(feed.summary.fiveYearCocoaPriceChange).toBeGreaterThan(0);
      expect(feed.summary.fiveYearGoldPriceChange).toBeGreaterThan(0);
    });
  });

  describe('Annual Summaries', () => {
    it('should produce 6 years of cocoa summaries', () => {
      const summaries = getCocoaAnnualSummary();
      expect(summaries).toHaveLength(6);
      expect(summaries[0].year).toBe(2020);
      expect(summaries[5].year).toBe(2025);
    });

    it('should produce 6 years of gold summaries', () => {
      const summaries = getGoldAnnualSummary();
      expect(summaries).toHaveLength(6);
      expect(summaries[0].year).toBe(2020);
    });

    it('cocoa 2024 avg price should reflect the surge', () => {
      const summaries = getCocoaAnnualSummary();
      const y2024 = summaries.find(s => s.year === 2024)!;
      expect(y2024.avgWorldPriceUSD).toBeGreaterThan(7000);
    });

    it('gold 2025 avg price should be above $2900', () => {
      const summaries = getGoldAnnualSummary();
      const y2025 = summaries.find(s => s.year === 2025)!;
      expect(y2025.avgPricePerOzUSD).toBeGreaterThan(2900);
    });
  });
});
