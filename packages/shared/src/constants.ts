/**
 * GOVRES — Shared Constants
 * 
 * Regulatory constants, financial parameters, and system configuration
 * aligned with Ghanaian economic data and whitepaper specifications.
 */

// ─── Regulatory References ──────────────────────────────────────

export const REGULATORY = {
  /* Bank of Ghana Act, 2002 (Act 612) */
  BOG_ACT: 'Act 612',
  /* Payment Systems and Services Act, 2019 (Act 987) */
  PAYMENT_SYSTEMS_ACT: 'Act 987',
  /* Ghana Cocoa Board Act, 1984 (PNDC Law 81) */
  COCOBOD_ACT: 'PNDC Law 81',
  /* Virtual Asset Service Providers Act, 2025 */
  VASP_ACT: 'VASP Act 2025',
  /* Anti-Money Laundering Act, 2020 (Act 1044) */
  AML_ACT: 'Act 1044',
  /* Data Protection Act, 2012 (Act 843) */
  DATA_PROTECTION_ACT: 'Act 843',
} as const;

// ─── Financial Parameters (from Whitepaper) ─────────────────────

export const FINANCIAL = {
  /* Gold reserves allocation for GBDC issuance (10% of gold reserves) */
  GOLD_RESERVE_ALLOCATION_PERCENT: 10,

  /* Estimated gold reserve value for GBDC backing (~GH¢4.15B at 10%) */
  INITIAL_GBDC_CAPACITY_GHS: 4_150_000_000,

  /* Banking money multiplier for GBDC */
  MONEY_MULTIPLIER: 2.5,

  /* Effective liquidity from GBDC at 2.5x multiplier (~GH¢10.4B) */
  EFFECTIVE_LIQUIDITY_GHS: 10_400_000_000,

  /* 2025 cocoa receipts value estimate */
  COCOA_RECEIPTS_2025_GHS: 44_950_000_000,

  /* Standard cocoa bag weight in kg */
  STANDARD_COCOA_BAG_KG: 64,

  /* Troy ounce to grams conversion */
  TROY_OUNCE_GRAMS: 31.1035,

  /* Minimum GBDC issuance amount */
  MIN_GBDC_ISSUANCE_CEDI: 1000,

  /* Minimum CRDN value */
  MIN_CRDN_VALUE_CEDI: 10,

  /* Maximum daily MoMo transaction limit */
  MAX_MOMO_DAILY_CEDI: 50_000,

  /* Settlement finality window in seconds */
  SETTLEMENT_FINALITY_SECONDS: 30,
} as const;

// ─── System Configuration ───────────────────────────────────────

export const SYSTEM = {
  /* Ledger block generation interval in milliseconds */
  BLOCK_INTERVAL_MS: 5000,

  /* Maximum transactions per block */
  MAX_TX_PER_BLOCK: 1000,

  /* Oracle attestation validity window in hours */
  ORACLE_ATTESTATION_VALIDITY_HOURS: 24,

  /* Sensor reading interval in seconds */
  SENSOR_READING_INTERVAL_SECONDS: 60,

  /* Audit log retention period in days */
  AUDIT_RETENTION_DAYS: 2555, // ~7 years per regulatory requirement

  /* Session timeout in minutes */
  SESSION_TIMEOUT_MINUTES: 30,

  /* Maximum API requests per minute per user */
  API_RATE_LIMIT: 100,

  /* Cryptographic hash algorithm */
  HASH_ALGORITHM: 'SHA-256',

  /* Digital signature algorithm */
  SIGNATURE_ALGORITHM: 'RSA-PSS',

  /* Key size for RSA operations */
  RSA_KEY_SIZE: 4096,
} as const;

// ─── Ghanaian Banks (Major Commercial Banks) ────────────────────

export const GHANAIAN_BANKS = [
  { code: 'GCB', name: 'GCB Bank Limited' },
  { code: 'ECO', name: 'Ecobank Ghana Limited' },
  { code: 'SCB', name: 'Standard Chartered Bank Ghana' },
  { code: 'STB', name: 'Stanbic Bank Ghana Limited' },
  { code: 'ABF', name: 'Absa Bank Ghana Limited' },
  { code: 'FBN', name: 'FBNBank Ghana Limited' },
  { code: 'CAL', name: 'CalBank Limited' },
  { code: 'FID', name: 'Fidelity Bank Ghana Limited' },
  { code: 'ZEN', name: 'Zenith Bank Ghana Limited' },
  { code: 'GTB', name: 'Guaranty Trust Bank Ghana' },
  { code: 'UBA', name: 'United Bank for Africa Ghana' },
  { code: 'ADB', name: 'Agricultural Development Bank' },
  { code: 'ACB', name: 'Access Bank Ghana Plc' },
  { code: 'SOC', name: 'Société Générale Ghana' },
  { code: 'REP', name: 'Republic Bank Ghana Limited' },
  { code: 'NAT', name: 'National Investment Bank' },
  { code: 'PRU', name: 'Prudential Bank Limited' },
  { code: 'OCA', name: 'OmniBSIC Bank Ghana Limited' },
  { code: 'CBG', name: 'Consolidated Bank Ghana Limited' },
  { code: 'ARB', name: 'ARB Apex Bank Limited' },
] as const;

// ─── Mobile Money Providers ─────────────────────────────────────

export const MOMO_PROVIDERS = [
  { code: 'MTN_MOMO', name: 'MTN Mobile Money', prefix: '024|054|055|059' },
  { code: 'VODAFONE_CASH', name: 'Vodafone Cash', prefix: '020|050' },
  { code: 'AIRTELTIGO_MONEY', name: 'AirtelTigo Money', prefix: '026|027|056|057' },
] as const;

// ─── Error Codes ────────────────────────────────────────────────

export const ERROR_CODES = {
  // Ledger errors
  INSUFFICIENT_RESERVE: 'LEDGER_001',
  INVALID_INSTRUMENT: 'LEDGER_002',
  DOUBLE_SPEND: 'LEDGER_003',
  INVALID_SIGNATURE: 'LEDGER_004',
  BLOCK_VALIDATION_FAILED: 'LEDGER_005',

  // Oracle errors
  ATTESTATION_EXPIRED: 'ORACLE_001',
  SENSOR_OFFLINE: 'ORACLE_002',
  TAMPER_DETECTED: 'ORACLE_003',
  VERIFICATION_FAILED: 'ORACLE_004',

  // Settlement errors
  SETTLEMENT_TIMEOUT: 'SETTLE_001',
  BANK_UNREACHABLE: 'SETTLE_002',
  MOMO_FAILED: 'SETTLE_003',
  INSUFFICIENT_BALANCE: 'SETTLE_004',

  // Auth errors
  UNAUTHORIZED: 'AUTH_001',
  FORBIDDEN: 'AUTH_002',
  SESSION_EXPIRED: 'AUTH_003',
  KYC_REQUIRED: 'AUTH_004',

  // Compliance errors
  AML_FLAG: 'COMP_001',
  SANCTION_HIT: 'COMP_002',
  LIMIT_EXCEEDED: 'COMP_003',
} as const;

// ─── Cocoa Regions in Ghana ─────────────────────────────────────

export const COCOA_REGIONS = [
  'Ashanti',
  'Western',
  'Western North',
  'Eastern',
  'Central',
  'Ahafo',
  'Bono',
  'Bono East',
  'Oti',
  'Volta',
] as const;

// ─── Gold Mining Regions ────────────────────────────────────────

export const GOLD_MINING_REGIONS = [
  'Ashanti',
  'Western',
  'Central',
  'Eastern',
  'Upper East',
  'Upper West',
] as const;
