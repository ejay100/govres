/**
 * GOVRES — Historical Data Feed
 * 
 * 5-year centralized feed of Ghana cocoa and gold economic data (2020–2025).
 * Based on publicly available data from ICCO, World Gold Council, Bank of Ghana,
 * and Ghana Cocoa Board (COCOBOD).
 * 
 * Data Sources:
 * - Cocoa: ICCO daily prices, COCOBOD producer prices
 * - Gold: LBMA Gold Price, Ghana Minerals Commission
 * - FX: Bank of Ghana reference rates
 * - Macro: Ghana Statistical Service, World Bank
 */

// ─── Types ──────────────────────────────────────────────────────

export interface HistoricalDataPoint {
  date: string;         // ISO month "YYYY-MM"
  year: number;
  month: number;
}

export interface CocoaDataPoint extends HistoricalDataPoint {
  /** ICCO world price (USD/tonne) */
  worldPriceUSD: number;
  /** Ghana producer price (GHS per 64kg bag) */
  producerPriceGHS: number;
  /** Estimated Ghana crop (thousands of tonnes) — season based */
  productionKTonnes: number;
  /** COCOBOD export revenue estimate (million USD) */
  exportRevenueMillionUSD: number;
}

export interface GoldDataPoint extends HistoricalDataPoint {
  /** LBMA gold fix (USD/troy oz) */
  pricePerOzUSD: number;
  /** Ghana gold production (thousands of oz) */
  productionKOz: number;
  /** Mining royalty revenue (million GHS) */
  royaltyRevenueMillionGHS: number;
  /** Price per gram (USD) */
  pricePerGramUSD: number;
}

export interface MacroDataPoint extends HistoricalDataPoint {
  /** USD/GHS exchange rate */
  exchangeRateUSDGHS: number;
  /** Bank of Ghana policy rate (%) */
  policyRatePercent: number;
  /** Year-on-year CPI inflation (%) */
  inflationPercent: number;
}

export interface HistoricalFeedResponse {
  cocoa: CocoaDataPoint[];
  gold: GoldDataPoint[];
  macro: MacroDataPoint[];
  summary: {
    dateRange: { from: string; to: string };
    totalDataPoints: number;
    latestCocoa: CocoaDataPoint;
    latestGold: GoldDataPoint;
    latestMacro: MacroDataPoint;
    fiveYearAvgCocoaUSD: number;
    fiveYearAvgGoldUSD: number;
    fiveYearCocoaPriceChange: number;
    fiveYearGoldPriceChange: number;
  };
}

// ─── 5-Year Cocoa Data (Monthly — 2020-01 to 2025-06) ──────────

export const COCOA_HISTORICAL: CocoaDataPoint[] = [
  // 2020 — COVID-affected, Living Income Differential (LID) introduced
  { date: '2020-01', year: 2020, month: 1, worldPriceUSD: 2698, producerPriceGHS: 660, productionKTonnes: 72, exportRevenueMillionUSD: 220 },
  { date: '2020-02', year: 2020, month: 2, worldPriceUSD: 2748, producerPriceGHS: 660, productionKTonnes: 68, exportRevenueMillionUSD: 210 },
  { date: '2020-03', year: 2020, month: 3, worldPriceUSD: 2369, producerPriceGHS: 660, productionKTonnes: 65, exportRevenueMillionUSD: 180 },
  { date: '2020-04', year: 2020, month: 4, worldPriceUSD: 2304, producerPriceGHS: 660, productionKTonnes: 62, exportRevenueMillionUSD: 165 },
  { date: '2020-05', year: 2020, month: 5, worldPriceUSD: 2390, producerPriceGHS: 660, productionKTonnes: 58, exportRevenueMillionUSD: 160 },
  { date: '2020-06', year: 2020, month: 6, worldPriceUSD: 2303, producerPriceGHS: 660, productionKTonnes: 55, exportRevenueMillionUSD: 150 },
  { date: '2020-07', year: 2020, month: 7, worldPriceUSD: 2268, producerPriceGHS: 660, productionKTonnes: 50, exportRevenueMillionUSD: 135 },
  { date: '2020-08', year: 2020, month: 8, worldPriceUSD: 2382, producerPriceGHS: 660, productionKTonnes: 48, exportRevenueMillionUSD: 130 },
  { date: '2020-09', year: 2020, month: 9, worldPriceUSD: 2626, producerPriceGHS: 660, productionKTonnes: 52, exportRevenueMillionUSD: 155 },
  { date: '2020-10', year: 2020, month: 10, worldPriceUSD: 2418, producerPriceGHS: 660, productionKTonnes: 75, exportRevenueMillionUSD: 205 },
  { date: '2020-11', year: 2020, month: 11, worldPriceUSD: 2486, producerPriceGHS: 660, productionKTonnes: 82, exportRevenueMillionUSD: 230 },
  { date: '2020-12', year: 2020, month: 12, worldPriceUSD: 2555, producerPriceGHS: 660, productionKTonnes: 85, exportRevenueMillionUSD: 245 },

  // 2021 — Recovery year, Cedi weakness begins
  { date: '2021-01', year: 2021, month: 1, worldPriceUSD: 2518, producerPriceGHS: 660, productionKTonnes: 78, exportRevenueMillionUSD: 221 },
  { date: '2021-02', year: 2021, month: 2, worldPriceUSD: 2523, producerPriceGHS: 660, productionKTonnes: 75, exportRevenueMillionUSD: 215 },
  { date: '2021-03', year: 2021, month: 3, worldPriceUSD: 2452, producerPriceGHS: 660, productionKTonnes: 70, exportRevenueMillionUSD: 198 },
  { date: '2021-04', year: 2021, month: 4, worldPriceUSD: 2378, producerPriceGHS: 660, productionKTonnes: 65, exportRevenueMillionUSD: 178 },
  { date: '2021-05', year: 2021, month: 5, worldPriceUSD: 2440, producerPriceGHS: 660, productionKTonnes: 60, exportRevenueMillionUSD: 168 },
  { date: '2021-06', year: 2021, month: 6, worldPriceUSD: 2367, producerPriceGHS: 660, productionKTonnes: 55, exportRevenueMillionUSD: 150 },
  { date: '2021-07', year: 2021, month: 7, worldPriceUSD: 2383, producerPriceGHS: 660, productionKTonnes: 50, exportRevenueMillionUSD: 138 },
  { date: '2021-08', year: 2021, month: 8, worldPriceUSD: 2471, producerPriceGHS: 660, productionKTonnes: 48, exportRevenueMillionUSD: 135 },
  { date: '2021-09', year: 2021, month: 9, worldPriceUSD: 2587, producerPriceGHS: 660, productionKTonnes: 55, exportRevenueMillionUSD: 163 },
  { date: '2021-10', year: 2021, month: 10, worldPriceUSD: 2503, producerPriceGHS: 800, productionKTonnes: 80, exportRevenueMillionUSD: 225 },
  { date: '2021-11', year: 2021, month: 11, worldPriceUSD: 2449, producerPriceGHS: 800, productionKTonnes: 85, exportRevenueMillionUSD: 238 },
  { date: '2021-12', year: 2021, month: 12, worldPriceUSD: 2389, producerPriceGHS: 800, productionKTonnes: 88, exportRevenueMillionUSD: 242 },

  // 2022 — Cedi crisis, cocoa demand strong
  { date: '2022-01', year: 2022, month: 1, worldPriceUSD: 2490, producerPriceGHS: 800, productionKTonnes: 80, exportRevenueMillionUSD: 228 },
  { date: '2022-02', year: 2022, month: 2, worldPriceUSD: 2618, producerPriceGHS: 800, productionKTonnes: 76, exportRevenueMillionUSD: 225 },
  { date: '2022-03', year: 2022, month: 3, worldPriceUSD: 2558, producerPriceGHS: 800, productionKTonnes: 72, exportRevenueMillionUSD: 210 },
  { date: '2022-04', year: 2022, month: 4, worldPriceUSD: 2561, producerPriceGHS: 800, productionKTonnes: 67, exportRevenueMillionUSD: 195 },
  { date: '2022-05', year: 2022, month: 5, worldPriceUSD: 2464, producerPriceGHS: 800, productionKTonnes: 62, exportRevenueMillionUSD: 175 },
  { date: '2022-06', year: 2022, month: 6, worldPriceUSD: 2391, producerPriceGHS: 800, productionKTonnes: 56, exportRevenueMillionUSD: 155 },
  { date: '2022-07', year: 2022, month: 7, worldPriceUSD: 2357, producerPriceGHS: 800, productionKTonnes: 52, exportRevenueMillionUSD: 140 },
  { date: '2022-08', year: 2022, month: 8, worldPriceUSD: 2314, producerPriceGHS: 800, productionKTonnes: 50, exportRevenueMillionUSD: 133 },
  { date: '2022-09', year: 2022, month: 9, worldPriceUSD: 2278, producerPriceGHS: 800, productionKTonnes: 54, exportRevenueMillionUSD: 140 },
  { date: '2022-10', year: 2022, month: 10, worldPriceUSD: 2326, producerPriceGHS: 1308, productionKTonnes: 78, exportRevenueMillionUSD: 205 },
  { date: '2022-11', year: 2022, month: 11, worldPriceUSD: 2426, producerPriceGHS: 1308, productionKTonnes: 83, exportRevenueMillionUSD: 228 },
  { date: '2022-12', year: 2022, month: 12, worldPriceUSD: 2541, producerPriceGHS: 1308, productionKTonnes: 86, exportRevenueMillionUSD: 248 },

  // 2023 — Prices begin rising, supply concerns from West Africa
  { date: '2023-01', year: 2023, month: 1, worldPriceUSD: 2604, producerPriceGHS: 1308, productionKTonnes: 77, exportRevenueMillionUSD: 230 },
  { date: '2023-02', year: 2023, month: 2, worldPriceUSD: 2660, producerPriceGHS: 1308, productionKTonnes: 73, exportRevenueMillionUSD: 218 },
  { date: '2023-03', year: 2023, month: 3, worldPriceUSD: 2820, producerPriceGHS: 1308, productionKTonnes: 69, exportRevenueMillionUSD: 220 },
  { date: '2023-04', year: 2023, month: 4, worldPriceUSD: 2920, producerPriceGHS: 1308, productionKTonnes: 64, exportRevenueMillionUSD: 215 },
  { date: '2023-05', year: 2023, month: 5, worldPriceUSD: 3082, producerPriceGHS: 1308, productionKTonnes: 58, exportRevenueMillionUSD: 205 },
  { date: '2023-06', year: 2023, month: 6, worldPriceUSD: 3143, producerPriceGHS: 1308, productionKTonnes: 54, exportRevenueMillionUSD: 195 },
  { date: '2023-07', year: 2023, month: 7, worldPriceUSD: 3256, producerPriceGHS: 1308, productionKTonnes: 50, exportRevenueMillionUSD: 188 },
  { date: '2023-08', year: 2023, month: 8, worldPriceUSD: 3380, producerPriceGHS: 1308, productionKTonnes: 47, exportRevenueMillionUSD: 183 },
  { date: '2023-09', year: 2023, month: 9, worldPriceUSD: 3510, producerPriceGHS: 1308, productionKTonnes: 52, exportRevenueMillionUSD: 208 },
  { date: '2023-10', year: 2023, month: 10, worldPriceUSD: 3682, producerPriceGHS: 1808, productionKTonnes: 75, exportRevenueMillionUSD: 315 },
  { date: '2023-11', year: 2023, month: 11, worldPriceUSD: 4020, producerPriceGHS: 1808, productionKTonnes: 80, exportRevenueMillionUSD: 365 },
  { date: '2023-12', year: 2023, month: 12, worldPriceUSD: 4290, producerPriceGHS: 1808, productionKTonnes: 82, exportRevenueMillionUSD: 400 },

  // 2024 — Historic price surge, supply deficit from Ivory Coast & Ghana
  { date: '2024-01', year: 2024, month: 1, worldPriceUSD: 4534, producerPriceGHS: 1808, productionKTonnes: 70, exportRevenueMillionUSD: 360 },
  { date: '2024-02', year: 2024, month: 2, worldPriceUSD: 5820, producerPriceGHS: 1808, productionKTonnes: 65, exportRevenueMillionUSD: 430 },
  { date: '2024-03', year: 2024, month: 3, worldPriceUSD: 8160, producerPriceGHS: 1808, productionKTonnes: 60, exportRevenueMillionUSD: 560 },
  { date: '2024-04', year: 2024, month: 4, worldPriceUSD: 10_420, producerPriceGHS: 1808, productionKTonnes: 55, exportRevenueMillionUSD: 650 },
  { date: '2024-05', year: 2024, month: 5, worldPriceUSD: 9_280, producerPriceGHS: 1808, productionKTonnes: 52, exportRevenueMillionUSD: 555 },
  { date: '2024-06', year: 2024, month: 6, worldPriceUSD: 8_450, producerPriceGHS: 1808, productionKTonnes: 48, exportRevenueMillionUSD: 468 },
  { date: '2024-07', year: 2024, month: 7, worldPriceUSD: 8_020, producerPriceGHS: 1808, productionKTonnes: 45, exportRevenueMillionUSD: 415 },
  { date: '2024-08', year: 2024, month: 8, worldPriceUSD: 8_670, producerPriceGHS: 1808, productionKTonnes: 43, exportRevenueMillionUSD: 430 },
  { date: '2024-09', year: 2024, month: 9, worldPriceUSD: 8_250, producerPriceGHS: 1808, productionKTonnes: 47, exportRevenueMillionUSD: 445 },
  { date: '2024-10', year: 2024, month: 10, worldPriceUSD: 9_118, producerPriceGHS: 2400, productionKTonnes: 68, exportRevenueMillionUSD: 710 },
  { date: '2024-11', year: 2024, month: 11, worldPriceUSD: 10_150, producerPriceGHS: 2400, productionKTonnes: 72, exportRevenueMillionUSD: 830 },
  { date: '2024-12', year: 2024, month: 12, worldPriceUSD: 11_234, producerPriceGHS: 2400, productionKTonnes: 74, exportRevenueMillionUSD: 950 },

  // 2025 — GOVRES goes live, prices stabilising at high levels
  { date: '2025-01', year: 2025, month: 1, worldPriceUSD: 10_890, producerPriceGHS: 2400, productionKTonnes: 70, exportRevenueMillionUSD: 870 },
  { date: '2025-02', year: 2025, month: 2, worldPriceUSD: 10_450, producerPriceGHS: 2400, productionKTonnes: 67, exportRevenueMillionUSD: 800 },
  { date: '2025-03', year: 2025, month: 3, worldPriceUSD: 9_780, producerPriceGHS: 2400, productionKTonnes: 63, exportRevenueMillionUSD: 710 },
  { date: '2025-04', year: 2025, month: 4, worldPriceUSD: 9_420, producerPriceGHS: 2400, productionKTonnes: 60, exportRevenueMillionUSD: 650 },
  { date: '2025-05', year: 2025, month: 5, worldPriceUSD: 9_100, producerPriceGHS: 2400, productionKTonnes: 56, exportRevenueMillionUSD: 588 },
  { date: '2025-06', year: 2025, month: 6, worldPriceUSD: 8_750, producerPriceGHS: 2400, productionKTonnes: 53, exportRevenueMillionUSD: 535 },
];

// ─── 5-Year Gold Data (Monthly — 2020-01 to 2025-06) ───────────

export const GOLD_HISTORICAL: GoldDataPoint[] = [
  // 2020 — COVID safe-haven rally
  { date: '2020-01', year: 2020, month: 1, pricePerOzUSD: 1561, productionKOz: 340, royaltyRevenueMillionGHS: 156, pricePerGramUSD: 50.18 },
  { date: '2020-02', year: 2020, month: 2, pricePerOzUSD: 1597, productionKOz: 330, royaltyRevenueMillionGHS: 161, pricePerGramUSD: 51.34 },
  { date: '2020-03', year: 2020, month: 3, pricePerOzUSD: 1577, productionKOz: 310, royaltyRevenueMillionGHS: 150, pricePerGramUSD: 50.70 },
  { date: '2020-04', year: 2020, month: 4, pricePerOzUSD: 1694, productionKOz: 300, royaltyRevenueMillionGHS: 155, pricePerGramUSD: 54.47 },
  { date: '2020-05', year: 2020, month: 5, pricePerOzUSD: 1728, productionKOz: 310, royaltyRevenueMillionGHS: 163, pricePerGramUSD: 55.56 },
  { date: '2020-06', year: 2020, month: 6, pricePerOzUSD: 1751, productionKOz: 320, royaltyRevenueMillionGHS: 170, pricePerGramUSD: 56.30 },
  { date: '2020-07', year: 2020, month: 7, pricePerOzUSD: 1895, productionKOz: 330, royaltyRevenueMillionGHS: 190, pricePerGramUSD: 60.93 },
  { date: '2020-08', year: 2020, month: 8, pricePerOzUSD: 1970, productionKOz: 340, royaltyRevenueMillionGHS: 203, pricePerGramUSD: 63.34 },
  { date: '2020-09', year: 2020, month: 9, pricePerOzUSD: 1920, productionKOz: 335, royaltyRevenueMillionGHS: 195, pricePerGramUSD: 61.73 },
  { date: '2020-10', year: 2020, month: 10, pricePerOzUSD: 1903, productionKOz: 340, royaltyRevenueMillionGHS: 196, pricePerGramUSD: 61.18 },
  { date: '2020-11', year: 2020, month: 11, pricePerOzUSD: 1862, productionKOz: 335, royaltyRevenueMillionGHS: 189, pricePerGramUSD: 59.86 },
  { date: '2020-12', year: 2020, month: 12, pricePerOzUSD: 1879, productionKOz: 340, royaltyRevenueMillionGHS: 192, pricePerGramUSD: 60.41 },

  // 2021 — Consolidation, Ghana production ~4M oz
  { date: '2021-01', year: 2021, month: 1, pricePerOzUSD: 1863, productionKOz: 335, royaltyRevenueMillionGHS: 195, pricePerGramUSD: 59.89 },
  { date: '2021-02', year: 2021, month: 2, pricePerOzUSD: 1811, productionKOz: 330, royaltyRevenueMillionGHS: 187, pricePerGramUSD: 58.22 },
  { date: '2021-03', year: 2021, month: 3, pricePerOzUSD: 1730, productionKOz: 325, royaltyRevenueMillionGHS: 176, pricePerGramUSD: 55.62 },
  { date: '2021-04', year: 2021, month: 4, pricePerOzUSD: 1768, productionKOz: 330, royaltyRevenueMillionGHS: 182, pricePerGramUSD: 56.84 },
  { date: '2021-05', year: 2021, month: 5, pricePerOzUSD: 1845, productionKOz: 335, royaltyRevenueMillionGHS: 193, pricePerGramUSD: 59.32 },
  { date: '2021-06', year: 2021, month: 6, pricePerOzUSD: 1806, productionKOz: 330, royaltyRevenueMillionGHS: 186, pricePerGramUSD: 58.06 },
  { date: '2021-07', year: 2021, month: 7, pricePerOzUSD: 1808, productionKOz: 325, royaltyRevenueMillionGHS: 183, pricePerGramUSD: 58.13 },
  { date: '2021-08', year: 2021, month: 8, pricePerOzUSD: 1780, productionKOz: 330, royaltyRevenueMillionGHS: 183, pricePerGramUSD: 57.23 },
  { date: '2021-09', year: 2021, month: 9, pricePerOzUSD: 1757, productionKOz: 335, royaltyRevenueMillionGHS: 183, pricePerGramUSD: 56.49 },
  { date: '2021-10', year: 2021, month: 10, pricePerOzUSD: 1783, productionKOz: 340, royaltyRevenueMillionGHS: 189, pricePerGramUSD: 57.32 },
  { date: '2021-11', year: 2021, month: 11, pricePerOzUSD: 1817, productionKOz: 335, royaltyRevenueMillionGHS: 190, pricePerGramUSD: 58.42 },
  { date: '2021-12', year: 2021, month: 12, pricePerOzUSD: 1798, productionKOz: 340, royaltyRevenueMillionGHS: 190, pricePerGramUSD: 57.81 },

  // 2022 — US rate hikes weigh, but geo tensions lift gold
  { date: '2022-01', year: 2022, month: 1, pricePerOzUSD: 1829, productionKOz: 335, royaltyRevenueMillionGHS: 210, pricePerGramUSD: 58.80 },
  { date: '2022-02', year: 2022, month: 2, pricePerOzUSD: 1889, productionKOz: 330, royaltyRevenueMillionGHS: 220, pricePerGramUSD: 60.73 },
  { date: '2022-03', year: 2022, month: 3, pricePerOzUSD: 1942, productionKOz: 340, royaltyRevenueMillionGHS: 248, pricePerGramUSD: 62.44 },
  { date: '2022-04', year: 2022, month: 4, pricePerOzUSD: 1909, productionKOz: 335, royaltyRevenueMillionGHS: 260, pricePerGramUSD: 61.38 },
  { date: '2022-05', year: 2022, month: 5, pricePerOzUSD: 1847, productionKOz: 330, royaltyRevenueMillionGHS: 260, pricePerGramUSD: 59.38 },
  { date: '2022-06', year: 2022, month: 6, pricePerOzUSD: 1837, productionKOz: 325, royaltyRevenueMillionGHS: 262, pricePerGramUSD: 59.06 },
  { date: '2022-07', year: 2022, month: 7, pricePerOzUSD: 1735, productionKOz: 320, royaltyRevenueMillionGHS: 270, pricePerGramUSD: 55.78 },
  { date: '2022-08', year: 2022, month: 8, pricePerOzUSD: 1769, productionKOz: 325, royaltyRevenueMillionGHS: 282, pricePerGramUSD: 56.87 },
  { date: '2022-09', year: 2022, month: 9, pricePerOzUSD: 1680, productionKOz: 330, royaltyRevenueMillionGHS: 295, pricePerGramUSD: 54.01 },
  { date: '2022-10', year: 2022, month: 10, pricePerOzUSD: 1665, productionKOz: 335, royaltyRevenueMillionGHS: 310, pricePerGramUSD: 53.53 },
  { date: '2022-11', year: 2022, month: 11, pricePerOzUSD: 1751, productionKOz: 340, royaltyRevenueMillionGHS: 340, pricePerGramUSD: 56.30 },
  { date: '2022-12', year: 2022, month: 12, pricePerOzUSD: 1797, productionKOz: 340, royaltyRevenueMillionGHS: 355, pricePerGramUSD: 57.78 },

  // 2023 — Central bank buying, gold breakout begins
  { date: '2023-01', year: 2023, month: 1, pricePerOzUSD: 1910, productionKOz: 340, royaltyRevenueMillionGHS: 345, pricePerGramUSD: 61.41 },
  { date: '2023-02', year: 2023, month: 2, pricePerOzUSD: 1860, productionKOz: 335, royaltyRevenueMillionGHS: 338, pricePerGramUSD: 59.81 },
  { date: '2023-03', year: 2023, month: 3, pricePerOzUSD: 1962, productionKOz: 340, royaltyRevenueMillionGHS: 360, pricePerGramUSD: 63.09 },
  { date: '2023-04', year: 2023, month: 4, pricePerOzUSD: 2017, productionKOz: 335, royaltyRevenueMillionGHS: 365, pricePerGramUSD: 64.85 },
  { date: '2023-05', year: 2023, month: 5, pricePerOzUSD: 1983, productionKOz: 330, royaltyRevenueMillionGHS: 354, pricePerGramUSD: 63.76 },
  { date: '2023-06', year: 2023, month: 6, pricePerOzUSD: 1940, productionKOz: 325, royaltyRevenueMillionGHS: 340, pricePerGramUSD: 62.38 },
  { date: '2023-07', year: 2023, month: 7, pricePerOzUSD: 1955, productionKOz: 330, royaltyRevenueMillionGHS: 348, pricePerGramUSD: 62.86 },
  { date: '2023-08', year: 2023, month: 8, pricePerOzUSD: 1920, productionKOz: 335, royaltyRevenueMillionGHS: 347, pricePerGramUSD: 61.73 },
  { date: '2023-09', year: 2023, month: 9, pricePerOzUSD: 1925, productionKOz: 340, royaltyRevenueMillionGHS: 353, pricePerGramUSD: 61.89 },
  { date: '2023-10', year: 2023, month: 10, pricePerOzUSD: 1997, productionKOz: 340, royaltyRevenueMillionGHS: 366, pricePerGramUSD: 64.21 },
  { date: '2023-11', year: 2023, month: 11, pricePerOzUSD: 2038, productionKOz: 340, royaltyRevenueMillionGHS: 375, pricePerGramUSD: 65.52 },
  { date: '2023-12', year: 2023, month: 12, pricePerOzUSD: 2062, productionKOz: 345, royaltyRevenueMillionGHS: 384, pricePerGramUSD: 66.29 },

  // 2024 — Record gold bull run, central bank pivots
  { date: '2024-01', year: 2024, month: 1, pricePerOzUSD: 2045, productionKOz: 340, royaltyRevenueMillionGHS: 390, pricePerGramUSD: 65.75 },
  { date: '2024-02', year: 2024, month: 2, pricePerOzUSD: 2030, productionKOz: 335, royaltyRevenueMillionGHS: 385, pricePerGramUSD: 65.27 },
  { date: '2024-03', year: 2024, month: 3, pricePerOzUSD: 2178, productionKOz: 340, royaltyRevenueMillionGHS: 420, pricePerGramUSD: 70.02 },
  { date: '2024-04', year: 2024, month: 4, pricePerOzUSD: 2340, productionKOz: 345, royaltyRevenueMillionGHS: 458, pricePerGramUSD: 75.23 },
  { date: '2024-05', year: 2024, month: 5, pricePerOzUSD: 2360, productionKOz: 340, royaltyRevenueMillionGHS: 455, pricePerGramUSD: 75.87 },
  { date: '2024-06', year: 2024, month: 6, pricePerOzUSD: 2325, productionKOz: 335, royaltyRevenueMillionGHS: 442, pricePerGramUSD: 74.75 },
  { date: '2024-07', year: 2024, month: 7, pricePerOzUSD: 2411, productionKOz: 340, royaltyRevenueMillionGHS: 465, pricePerGramUSD: 77.52 },
  { date: '2024-08', year: 2024, month: 8, pricePerOzUSD: 2508, productionKOz: 345, royaltyRevenueMillionGHS: 490, pricePerGramUSD: 80.64 },
  { date: '2024-09', year: 2024, month: 9, pricePerOzUSD: 2630, productionKOz: 340, royaltyRevenueMillionGHS: 508, pricePerGramUSD: 84.56 },
  { date: '2024-10', year: 2024, month: 10, pricePerOzUSD: 2755, productionKOz: 345, royaltyRevenueMillionGHS: 540, pricePerGramUSD: 88.58 },
  { date: '2024-11', year: 2024, month: 11, pricePerOzUSD: 2690, productionKOz: 340, royaltyRevenueMillionGHS: 520, pricePerGramUSD: 86.49 },
  { date: '2024-12', year: 2024, month: 12, pricePerOzUSD: 2615, productionKOz: 345, royaltyRevenueMillionGHS: 512, pricePerGramUSD: 84.07 },

  // 2025 — Sustained high prices, GOVRES integration
  { date: '2025-01', year: 2025, month: 1, pricePerOzUSD: 2755, productionKOz: 350, royaltyRevenueMillionGHS: 548, pricePerGramUSD: 88.58 },
  { date: '2025-02', year: 2025, month: 2, pricePerOzUSD: 2878, productionKOz: 345, royaltyRevenueMillionGHS: 565, pricePerGramUSD: 92.54 },
  { date: '2025-03', year: 2025, month: 3, pricePerOzUSD: 3002, productionKOz: 350, royaltyRevenueMillionGHS: 597, pricePerGramUSD: 96.52 },
  { date: '2025-04', year: 2025, month: 4, pricePerOzUSD: 3128, productionKOz: 345, royaltyRevenueMillionGHS: 615, pricePerGramUSD: 100.57 },
  { date: '2025-05', year: 2025, month: 5, pricePerOzUSD: 3350, productionKOz: 350, royaltyRevenueMillionGHS: 667, pricePerGramUSD: 107.71 },
  { date: '2025-06', year: 2025, month: 6, pricePerOzUSD: 3280, productionKOz: 345, royaltyRevenueMillionGHS: 645, pricePerGramUSD: 105.46 },
];

// ─── 5-Year Macro Data (Monthly — 2020-01 to 2025-06) ──────────

export const MACRO_HISTORICAL: MacroDataPoint[] = [
  // 2020
  { date: '2020-01', year: 2020, month: 1, exchangeRateUSDGHS: 5.57, policyRatePercent: 16.00, inflationPercent: 7.8 },
  { date: '2020-02', year: 2020, month: 2, exchangeRateUSDGHS: 5.55, policyRatePercent: 16.00, inflationPercent: 7.8 },
  { date: '2020-03', year: 2020, month: 3, exchangeRateUSDGHS: 5.74, policyRatePercent: 14.50, inflationPercent: 7.8 },
  { date: '2020-04', year: 2020, month: 4, exchangeRateUSDGHS: 5.73, policyRatePercent: 14.50, inflationPercent: 10.6 },
  { date: '2020-05', year: 2020, month: 5, exchangeRateUSDGHS: 5.75, policyRatePercent: 14.50, inflationPercent: 11.3 },
  { date: '2020-06', year: 2020, month: 6, exchangeRateUSDGHS: 5.73, policyRatePercent: 14.50, inflationPercent: 11.2 },
  { date: '2020-07', year: 2020, month: 7, exchangeRateUSDGHS: 5.73, policyRatePercent: 14.50, inflationPercent: 11.4 },
  { date: '2020-08', year: 2020, month: 8, exchangeRateUSDGHS: 5.76, policyRatePercent: 14.50, inflationPercent: 10.4 },
  { date: '2020-09', year: 2020, month: 9, exchangeRateUSDGHS: 5.76, policyRatePercent: 14.50, inflationPercent: 10.4 },
  { date: '2020-10', year: 2020, month: 10, exchangeRateUSDGHS: 5.78, policyRatePercent: 14.50, inflationPercent: 10.1 },
  { date: '2020-11', year: 2020, month: 11, exchangeRateUSDGHS: 5.79, policyRatePercent: 14.50, inflationPercent: 9.8 },
  { date: '2020-12', year: 2020, month: 12, exchangeRateUSDGHS: 5.76, policyRatePercent: 14.50, inflationPercent: 10.2 },

  // 2021
  { date: '2021-01', year: 2021, month: 1, exchangeRateUSDGHS: 5.83, policyRatePercent: 14.50, inflationPercent: 9.9 },
  { date: '2021-02', year: 2021, month: 2, exchangeRateUSDGHS: 5.79, policyRatePercent: 14.50, inflationPercent: 10.3 },
  { date: '2021-03', year: 2021, month: 3, exchangeRateUSDGHS: 5.78, policyRatePercent: 14.50, inflationPercent: 10.3 },
  { date: '2021-04', year: 2021, month: 4, exchangeRateUSDGHS: 5.76, policyRatePercent: 14.50, inflationPercent: 8.5 },
  { date: '2021-05', year: 2021, month: 5, exchangeRateUSDGHS: 5.76, policyRatePercent: 13.50, inflationPercent: 7.5 },
  { date: '2021-06', year: 2021, month: 6, exchangeRateUSDGHS: 5.82, policyRatePercent: 13.50, inflationPercent: 7.8 },
  { date: '2021-07', year: 2021, month: 7, exchangeRateUSDGHS: 5.86, policyRatePercent: 13.50, inflationPercent: 9.0 },
  { date: '2021-08', year: 2021, month: 8, exchangeRateUSDGHS: 5.93, policyRatePercent: 13.50, inflationPercent: 9.7 },
  { date: '2021-09', year: 2021, month: 9, exchangeRateUSDGHS: 5.99, policyRatePercent: 13.50, inflationPercent: 10.6 },
  { date: '2021-10', year: 2021, month: 10, exchangeRateUSDGHS: 6.05, policyRatePercent: 13.50, inflationPercent: 11.0 },
  { date: '2021-11', year: 2021, month: 11, exchangeRateUSDGHS: 6.12, policyRatePercent: 13.50, inflationPercent: 12.2 },
  { date: '2021-12', year: 2021, month: 12, exchangeRateUSDGHS: 6.20, policyRatePercent: 14.50, inflationPercent: 12.6 },

  // 2022 — Cedi collapses, rate hikes
  { date: '2022-01', year: 2022, month: 1, exchangeRateUSDGHS: 6.31, policyRatePercent: 14.50, inflationPercent: 13.9 },
  { date: '2022-02', year: 2022, month: 2, exchangeRateUSDGHS: 6.64, policyRatePercent: 14.50, inflationPercent: 15.7 },
  { date: '2022-03', year: 2022, month: 3, exchangeRateUSDGHS: 7.23, policyRatePercent: 17.00, inflationPercent: 19.4 },
  { date: '2022-04', year: 2022, month: 4, exchangeRateUSDGHS: 7.35, policyRatePercent: 17.00, inflationPercent: 23.6 },
  { date: '2022-05', year: 2022, month: 5, exchangeRateUSDGHS: 7.70, policyRatePercent: 19.00, inflationPercent: 27.6 },
  { date: '2022-06', year: 2022, month: 6, exchangeRateUSDGHS: 8.08, policyRatePercent: 19.00, inflationPercent: 29.8 },
  { date: '2022-07', year: 2022, month: 7, exchangeRateUSDGHS: 8.45, policyRatePercent: 22.00, inflationPercent: 31.7 },
  { date: '2022-08', year: 2022, month: 8, exchangeRateUSDGHS: 9.30, policyRatePercent: 22.00, inflationPercent: 33.9 },
  { date: '2022-09', year: 2022, month: 9, exchangeRateUSDGHS: 10.40, policyRatePercent: 24.50, inflationPercent: 37.2 },
  { date: '2022-10', year: 2022, month: 10, exchangeRateUSDGHS: 14.20, policyRatePercent: 24.50, inflationPercent: 40.4 },
  { date: '2022-11', year: 2022, month: 11, exchangeRateUSDGHS: 14.50, policyRatePercent: 27.00, inflationPercent: 50.3 },
  { date: '2022-12', year: 2022, month: 12, exchangeRateUSDGHS: 12.80, policyRatePercent: 27.00, inflationPercent: 54.1 },

  // 2023 — IMF programme, Cedi stabilisation
  { date: '2023-01', year: 2023, month: 1, exchangeRateUSDGHS: 12.25, policyRatePercent: 28.00, inflationPercent: 53.6 },
  { date: '2023-02', year: 2023, month: 2, exchangeRateUSDGHS: 12.84, policyRatePercent: 28.00, inflationPercent: 52.8 },
  { date: '2023-03', year: 2023, month: 3, exchangeRateUSDGHS: 12.35, policyRatePercent: 29.50, inflationPercent: 45.0 },
  { date: '2023-04', year: 2023, month: 4, exchangeRateUSDGHS: 12.05, policyRatePercent: 29.50, inflationPercent: 41.2 },
  { date: '2023-05', year: 2023, month: 5, exchangeRateUSDGHS: 11.48, policyRatePercent: 29.50, inflationPercent: 42.2 },
  { date: '2023-06', year: 2023, month: 6, exchangeRateUSDGHS: 11.30, policyRatePercent: 30.00, inflationPercent: 42.5 },
  { date: '2023-07', year: 2023, month: 7, exchangeRateUSDGHS: 11.42, policyRatePercent: 30.00, inflationPercent: 43.1 },
  { date: '2023-08', year: 2023, month: 8, exchangeRateUSDGHS: 11.47, policyRatePercent: 30.00, inflationPercent: 40.1 },
  { date: '2023-09', year: 2023, month: 9, exchangeRateUSDGHS: 11.70, policyRatePercent: 30.00, inflationPercent: 38.1 },
  { date: '2023-10', year: 2023, month: 10, exchangeRateUSDGHS: 11.98, policyRatePercent: 30.00, inflationPercent: 35.2 },
  { date: '2023-11', year: 2023, month: 11, exchangeRateUSDGHS: 12.17, policyRatePercent: 30.00, inflationPercent: 26.4 },
  { date: '2023-12', year: 2023, month: 12, exchangeRateUSDGHS: 12.50, policyRatePercent: 30.00, inflationPercent: 23.2 },

  // 2024 — Disinflation continues, Cedi pressure
  { date: '2024-01', year: 2024, month: 1, exchangeRateUSDGHS: 12.62, policyRatePercent: 29.00, inflationPercent: 23.5 },
  { date: '2024-02', year: 2024, month: 2, exchangeRateUSDGHS: 12.75, policyRatePercent: 29.00, inflationPercent: 23.2 },
  { date: '2024-03', year: 2024, month: 3, exchangeRateUSDGHS: 13.15, policyRatePercent: 29.00, inflationPercent: 25.8 },
  { date: '2024-04', year: 2024, month: 4, exchangeRateUSDGHS: 13.48, policyRatePercent: 29.00, inflationPercent: 25.0 },
  { date: '2024-05', year: 2024, month: 5, exchangeRateUSDGHS: 14.50, policyRatePercent: 29.00, inflationPercent: 23.1 },
  { date: '2024-06', year: 2024, month: 6, exchangeRateUSDGHS: 15.24, policyRatePercent: 29.00, inflationPercent: 22.8 },
  { date: '2024-07', year: 2024, month: 7, exchangeRateUSDGHS: 15.60, policyRatePercent: 29.00, inflationPercent: 20.9 },
  { date: '2024-08', year: 2024, month: 8, exchangeRateUSDGHS: 15.80, policyRatePercent: 28.00, inflationPercent: 20.4 },
  { date: '2024-09', year: 2024, month: 9, exchangeRateUSDGHS: 15.72, policyRatePercent: 27.00, inflationPercent: 21.5 },
  { date: '2024-10', year: 2024, month: 10, exchangeRateUSDGHS: 15.95, policyRatePercent: 27.00, inflationPercent: 22.1 },
  { date: '2024-11', year: 2024, month: 11, exchangeRateUSDGHS: 16.10, policyRatePercent: 27.00, inflationPercent: 23.0 },
  { date: '2024-12', year: 2024, month: 12, exchangeRateUSDGHS: 16.25, policyRatePercent: 27.00, inflationPercent: 23.8 },

  // 2025 — GOVRES era
  { date: '2025-01', year: 2025, month: 1, exchangeRateUSDGHS: 15.80, policyRatePercent: 27.00, inflationPercent: 23.1 },
  { date: '2025-02', year: 2025, month: 2, exchangeRateUSDGHS: 15.50, policyRatePercent: 26.00, inflationPercent: 22.4 },
  { date: '2025-03', year: 2025, month: 3, exchangeRateUSDGHS: 15.20, policyRatePercent: 26.00, inflationPercent: 21.2 },
  { date: '2025-04', year: 2025, month: 4, exchangeRateUSDGHS: 14.80, policyRatePercent: 25.00, inflationPercent: 19.8 },
  { date: '2025-05', year: 2025, month: 5, exchangeRateUSDGHS: 14.50, policyRatePercent: 25.00, inflationPercent: 18.5 },
  { date: '2025-06', year: 2025, month: 6, exchangeRateUSDGHS: 14.50, policyRatePercent: 25.00, inflationPercent: 17.2 },
];

// ─── Query Helpers ──────────────────────────────────────────────

export function getCocoaByYear(year: number): CocoaDataPoint[] {
  return COCOA_HISTORICAL.filter(d => d.year === year);
}

export function getGoldByYear(year: number): GoldDataPoint[] {
  return GOLD_HISTORICAL.filter(d => d.year === year);
}

export function getMacroByYear(year: number): MacroDataPoint[] {
  return MACRO_HISTORICAL.filter(d => d.year === year);
}

export function getCocoaByDateRange(from: string, to: string): CocoaDataPoint[] {
  return COCOA_HISTORICAL.filter(d => d.date >= from && d.date <= to);
}

export function getGoldByDateRange(from: string, to: string): GoldDataPoint[] {
  return GOLD_HISTORICAL.filter(d => d.date >= from && d.date <= to);
}

export function getMacroByDateRange(from: string, to: string): MacroDataPoint[] {
  return MACRO_HISTORICAL.filter(d => d.date >= from && d.date <= to);
}

/** Get the full 5-year feed with summary analytics */
export function getHistoricalFeed(): HistoricalFeedResponse {
  const latestCocoa = COCOA_HISTORICAL[COCOA_HISTORICAL.length - 1];
  const latestGold = GOLD_HISTORICAL[GOLD_HISTORICAL.length - 1];
  const latestMacro = MACRO_HISTORICAL[MACRO_HISTORICAL.length - 1];
  const firstCocoa = COCOA_HISTORICAL[0];
  const firstGold = GOLD_HISTORICAL[0];

  const avgCocoa = COCOA_HISTORICAL.reduce((s, d) => s + d.worldPriceUSD, 0) / COCOA_HISTORICAL.length;
  const avgGold = GOLD_HISTORICAL.reduce((s, d) => s + d.pricePerOzUSD, 0) / GOLD_HISTORICAL.length;

  const cocoaPriceChange = ((latestCocoa.worldPriceUSD - firstCocoa.worldPriceUSD) / firstCocoa.worldPriceUSD) * 100;
  const goldPriceChange = ((latestGold.pricePerOzUSD - firstGold.pricePerOzUSD) / firstGold.pricePerOzUSD) * 100;

  return {
    cocoa: COCOA_HISTORICAL,
    gold: GOLD_HISTORICAL,
    macro: MACRO_HISTORICAL,
    summary: {
      dateRange: { from: '2020-01', to: '2025-06' },
      totalDataPoints: COCOA_HISTORICAL.length + GOLD_HISTORICAL.length + MACRO_HISTORICAL.length,
      latestCocoa,
      latestGold,
      latestMacro,
      fiveYearAvgCocoaUSD: Math.round(avgCocoa),
      fiveYearAvgGoldUSD: Math.round(avgGold),
      fiveYearCocoaPriceChange: Math.round(cocoaPriceChange * 10) / 10,
      fiveYearGoldPriceChange: Math.round(goldPriceChange * 10) / 10,
    },
  };
}

/** Get annual aggregates for cocoa */
export function getCocoaAnnualSummary() {
  const years = [2020, 2021, 2022, 2023, 2024, 2025];
  return years.map(year => {
    const data = getCocoaByYear(year);
    return {
      year,
      avgWorldPriceUSD: Math.round(data.reduce((s, d) => s + d.worldPriceUSD, 0) / data.length),
      totalProductionKT: Math.round(data.reduce((s, d) => s + d.productionKTonnes, 0)),
      totalExportRevenueM: Math.round(data.reduce((s, d) => s + d.exportRevenueMillionUSD, 0)),
      producerPriceGHS: data[data.length - 1].producerPriceGHS,
    };
  });
}

/** Get annual aggregates for gold */
export function getGoldAnnualSummary() {
  const years = [2020, 2021, 2022, 2023, 2024, 2025];
  return years.map(year => {
    const data = getGoldByYear(year);
    return {
      year,
      avgPricePerOzUSD: Math.round(data.reduce((s, d) => s + d.pricePerOzUSD, 0) / data.length),
      totalProductionKOz: Math.round(data.reduce((s, d) => s + d.productionKOz, 0)),
      totalRoyaltyRevenueM: Math.round(data.reduce((s, d) => s + d.royaltyRevenueMillionGHS, 0)),
    };
  });
}
