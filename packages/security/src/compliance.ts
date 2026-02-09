/**
 * GOVRES — Regulatory Compliance Engine
 * Automated checks against Ghanaian financial regulations
 *
 * Covered legislation:
 *  - Bank of Ghana Act, 2002 (Act 612)
 *  - Payment Systems & Services Act, 2019 (Act 987)
 *  - Anti-Money Laundering Act, 2020 (Act 1044)
 *  - Data Protection Act, 2012 (Act 843)
 *  - Virtual Asset Service Providers Act, 2025 (VASP Act)
 *  - Cocoa Industry Regulation (PNDC Law 81, 1984)
 *  - Minerals & Mining Act, 2006 (Act 703)
 */

export enum ComplianceCategory {
  AML = 'AML',
  KYC = 'KYC',
  DATA_PROTECTION = 'DATA_PROTECTION',
  RESERVE_ADEQUACY = 'RESERVE_ADEQUACY',
  TRANSACTION_LIMITS = 'TRANSACTION_LIMITS',
  ORACLE_ATTESTATION = 'ORACLE_ATTESTATION',
  AUDIT_TRAIL = 'AUDIT_TRAIL',
}

export enum ComplianceResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
  WARNING = 'WARNING',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
}

export interface ComplianceCheck {
  id: string;
  category: ComplianceCategory;
  regulation: string;
  description: string;
  result: ComplianceResult;
  details: string;
  timestamp: string;
}

export interface TransactionComplianceInput {
  amount: number;
  senderAccountId: string;
  recipientAccountId: string;
  instrumentType: 'GBDC' | 'CRDN';
  channel: string;
  senderKycLevel: number; // 0=none, 1=basic, 2=enhanced, 3=full
  recipientKycLevel: number;
}

/**
 * AML thresholds per Bank of Ghana Anti-Money Laundering Act 1044
 */
const AML_THRESHOLDS = {
  /** Cash Transaction Report threshold (GH¢) */
  CTR_THRESHOLD: 50_000,
  /** Suspicious Transaction Report threshold (GH¢) — structuring detection */
  STR_AGGREGATE_24H: 100_000,
  /** Enhanced Due Diligence threshold (GH¢) */
  EDD_THRESHOLD: 500_000,
  /** Politically Exposed Persons additional checks threshold (GH¢) */
  PEP_THRESHOLD: 20_000,
};

/**
 * KYC tier limits per BoG e-Money guidelines
 */
const KYC_TIER_LIMITS = {
  0: { singleTx: 0, dailyLimit: 0, monthlyLimit: 0 },
  1: { singleTx: 1_000, dailyLimit: 3_000, monthlyLimit: 10_000 }, // Minimal KYC (Ghana Card only)
  2: { singleTx: 10_000, dailyLimit: 30_000, monthlyLimit: 100_000 }, // Standard KYC
  3: { singleTx: Infinity, dailyLimit: Infinity, monthlyLimit: Infinity }, // Full KYC (institutional)
} as const;

/**
 * Run AML compliance checks on a transaction
 */
export function checkAMLCompliance(input: TransactionComplianceInput): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];
  const timestamp = new Date().toISOString();

  // CTR Check — Cash Transaction Report
  checks.push({
    id: `aml-ctr-${Date.now()}`,
    category: ComplianceCategory.AML,
    regulation: 'Anti-Money Laundering Act 1044, Section 30',
    description: 'Cash Transaction Report threshold check',
    result: input.amount >= AML_THRESHOLDS.CTR_THRESHOLD ? ComplianceResult.NEEDS_REVIEW : ComplianceResult.PASS,
    details: input.amount >= AML_THRESHOLDS.CTR_THRESHOLD
      ? `Transaction of GH¢${input.amount.toLocaleString()} exceeds CTR threshold of GH¢${AML_THRESHOLDS.CTR_THRESHOLD.toLocaleString()}. CTR must be filed with Financial Intelligence Centre (FIC).`
      : `Transaction amount within CTR threshold.`,
    timestamp,
  });

  // EDD Check — Enhanced Due Diligence
  if (input.amount >= AML_THRESHOLDS.EDD_THRESHOLD) {
    checks.push({
      id: `aml-edd-${Date.now()}`,
      category: ComplianceCategory.AML,
      regulation: 'Anti-Money Laundering Act 1044, Section 22',
      description: 'Enhanced Due Diligence requirement',
      result: ComplianceResult.FAIL,
      details: `High-value transaction (GH¢${input.amount.toLocaleString()}) requires Enhanced Due Diligence. Source of funds documentation and senior management approval required.`,
      timestamp,
    });
  }

  return checks;
}

/**
 * Run KYC tier compliance checks
 */
export function checkKYCCompliance(input: TransactionComplianceInput): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];
  const timestamp = new Date().toISOString();

  const senderLimits = KYC_TIER_LIMITS[input.senderKycLevel as keyof typeof KYC_TIER_LIMITS] ?? KYC_TIER_LIMITS[0];

  checks.push({
    id: `kyc-sender-${Date.now()}`,
    category: ComplianceCategory.KYC,
    regulation: 'BoG e-Money Guidelines, Section 5.2',
    description: 'Sender KYC tier transaction limit check',
    result: input.amount <= senderLimits.singleTx ? ComplianceResult.PASS : ComplianceResult.FAIL,
    details: input.amount <= senderLimits.singleTx
      ? `Sender KYC Level ${input.senderKycLevel}: Transaction within single-tx limit.`
      : `Sender KYC Level ${input.senderKycLevel}: Transaction of GH¢${input.amount.toLocaleString()} exceeds single-tx limit of GH¢${senderLimits.singleTx.toLocaleString()}. KYC upgrade required.`,
    timestamp,
  });

  return checks;
}

/**
 * Check reserve adequacy per GOVRES whitepaper 10% gold reserve requirement
 */
export function checkReserveAdequacy(params: {
  goldReserveValueGHS: number;
  gbdcCirculation: number;
  cocoaReserveValueGHS: number;
  crdnOutstanding: number;
}): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];
  const timestamp = new Date().toISOString();

  // Gold reserve backing for GBDC (minimum 10% per whitepaper)
  const goldBackingRatio = params.goldReserveValueGHS / Math.max(params.gbdcCirculation, 1);
  checks.push({
    id: `reserve-gold-${Date.now()}`,
    category: ComplianceCategory.RESERVE_ADEQUACY,
    regulation: 'GOVRES Whitepaper Section 4.1 — Reserve Policy',
    description: 'Gold reserve backing ratio check (minimum 10%)',
    result: goldBackingRatio >= 0.10 ? ComplianceResult.PASS : ComplianceResult.FAIL,
    details: `Gold backing ratio: ${(goldBackingRatio * 100).toFixed(2)}% (minimum: 10%). Gold reserve: GH¢${params.goldReserveValueGHS.toLocaleString()}, GBDC circulation: GH¢${params.gbdcCirculation.toLocaleString()}.`,
    timestamp,
  });

  // Cocoa reserve backing for CRDN (1:1 by design)
  const cocoaBackingRatio = params.cocoaReserveValueGHS / Math.max(params.crdnOutstanding, 1);
  checks.push({
    id: `reserve-cocoa-${Date.now()}`,
    category: ComplianceCategory.RESERVE_ADEQUACY,
    regulation: 'GOVRES Whitepaper Section 4.2 — CRDN Backing',
    description: 'Cocoa reserve backing ratio check (1:1 required)',
    result: cocoaBackingRatio >= 0.95 ? ComplianceResult.PASS : ComplianceResult.FAIL,
    details: `Cocoa backing ratio: ${(cocoaBackingRatio * 100).toFixed(2)}%. Cocoa reserve: GH¢${params.cocoaReserveValueGHS.toLocaleString()}, CRDN outstanding: GH¢${params.crdnOutstanding.toLocaleString()}.`,
    timestamp,
  });

  return checks;
}

/**
 * Check oracle attestation validity
 */
export function checkOracleCompliance(params: {
  attestationAge: number; // seconds since last attestation
  sensorCount: number;
  activeSensors: number;
  confidenceScore: number;
}): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];
  const timestamp = new Date().toISOString();

  // Attestation freshness (max 24 hours per whitepaper)
  const MAX_ATTESTATION_AGE_SECONDS = 24 * 60 * 60;
  checks.push({
    id: `oracle-freshness-${Date.now()}`,
    category: ComplianceCategory.ORACLE_ATTESTATION,
    regulation: 'GOVRES Whitepaper — Oracle Attestation Policy',
    description: 'Attestation freshness check (maximum 24 hours)',
    result: params.attestationAge <= MAX_ATTESTATION_AGE_SECONDS ? ComplianceResult.PASS : ComplianceResult.FAIL,
    details: `Last attestation: ${Math.round(params.attestationAge / 3600)} hours ago. Maximum: 24 hours.`,
    timestamp,
  });

  // Sensor coverage
  const coverage = params.activeSensors / Math.max(params.sensorCount, 1);
  checks.push({
    id: `oracle-sensors-${Date.now()}`,
    category: ComplianceCategory.ORACLE_ATTESTATION,
    regulation: 'GOVRES Whitepaper — Sensor Quorum',
    description: 'Active sensor coverage check (minimum 75%)',
    result: coverage >= 0.75 ? ComplianceResult.PASS : coverage >= 0.50 ? ComplianceResult.WARNING : ComplianceResult.FAIL,
    details: `Active sensors: ${params.activeSensors}/${params.sensorCount} (${(coverage * 100).toFixed(0)}%).`,
    timestamp,
  });

  // Confidence score
  checks.push({
    id: `oracle-confidence-${Date.now()}`,
    category: ComplianceCategory.ORACLE_ATTESTATION,
    regulation: 'GOVRES Whitepaper — Confidence Threshold',
    description: 'Oracle confidence score check (minimum 90%)',
    result: params.confidenceScore >= 90 ? ComplianceResult.PASS : ComplianceResult.WARNING,
    details: `Confidence score: ${params.confidenceScore.toFixed(1)}%. Minimum: 90%.`,
    timestamp,
  });

  return checks;
}

/**
 * Generate a full compliance report for the system
 */
export function generateComplianceReport(checks: ComplianceCheck[]): {
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  needsReview: number;
  overallStatus: ComplianceResult;
  checks: ComplianceCheck[];
} {
  const passed = checks.filter(c => c.result === ComplianceResult.PASS).length;
  const failed = checks.filter(c => c.result === ComplianceResult.FAIL).length;
  const warnings = checks.filter(c => c.result === ComplianceResult.WARNING).length;
  const needsReview = checks.filter(c => c.result === ComplianceResult.NEEDS_REVIEW).length;

  let overallStatus: ComplianceResult;
  if (failed > 0) overallStatus = ComplianceResult.FAIL;
  else if (needsReview > 0) overallStatus = ComplianceResult.NEEDS_REVIEW;
  else if (warnings > 0) overallStatus = ComplianceResult.WARNING;
  else overallStatus = ComplianceResult.PASS;

  return { totalChecks: checks.length, passed, failed, warnings, needsReview, overallStatus, checks };
}
