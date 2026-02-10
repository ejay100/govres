/**
 * GOVRES — Compliance Engine Tests
 * Tests for AML, KYC, reserve adequacy, and oracle compliance checks
 */

import { describe, it, expect } from 'vitest';
import {
  checkAMLCompliance,
  checkKYCCompliance,
  checkReserveAdequacy,
  checkOracleCompliance,
  generateComplianceReport,
  ComplianceResult,
  TransactionComplianceInput,
} from './compliance';

// ─── Helpers ────────────────────────────────────────────

function makeTxInput(overrides: Partial<TransactionComplianceInput> = {}): TransactionComplianceInput {
  return {
    amount: overrides.amount ?? 5_000,
    senderAccountId: overrides.senderAccountId ?? 'ACC-001',
    recipientAccountId: overrides.recipientAccountId ?? 'ACC-002',
    instrumentType: overrides.instrumentType ?? 'GBDC',
    channel: overrides.channel ?? 'LEDGER',
    senderKycLevel: overrides.senderKycLevel ?? 3,
    recipientKycLevel: overrides.recipientKycLevel ?? 3,
  };
}

// ─── AML compliance ─────────────────────────────────────

describe('checkAMLCompliance', () => {
  it('passes for small transaction', () => {
    const checks = checkAMLCompliance(makeTxInput({ amount: 1_000 }));
    expect(checks.length).toBeGreaterThanOrEqual(1);
    expect(checks[0].result).toBe(ComplianceResult.PASS);
  });

  it('flags CTR for >= 50,000 GH¢', () => {
    const checks = checkAMLCompliance(makeTxInput({ amount: 50_000 }));
    const ctr = checks.find(c => c.description.includes('Cash Transaction Report'));
    expect(ctr).toBeDefined();
    expect(ctr!.result).toBe(ComplianceResult.NEEDS_REVIEW);
  });

  it('flags EDD for >= 500,000 GH¢', () => {
    const checks = checkAMLCompliance(makeTxInput({ amount: 500_000 }));
    const edd = checks.find(c => c.description.includes('Enhanced Due Diligence'));
    expect(edd).toBeDefined();
    expect(edd!.result).toBe(ComplianceResult.FAIL);
  });

  it('returns checks with correct category', () => {
    const checks = checkAMLCompliance(makeTxInput());
    checks.forEach(c => expect(c.category).toBe('AML'));
  });
});

// ─── KYC compliance ─────────────────────────────────────

describe('checkKYCCompliance', () => {
  it('passes for KYC level 3 (institutional — unlimited)', () => {
    const checks = checkKYCCompliance(makeTxInput({ senderKycLevel: 3, amount: 1_000_000 }));
    expect(checks[0].result).toBe(ComplianceResult.PASS);
  });

  it('fails for KYC level 1 exceeding 1,000 GH¢ single-tx', () => {
    const checks = checkKYCCompliance(makeTxInput({ senderKycLevel: 1, amount: 5_000 }));
    expect(checks[0].result).toBe(ComplianceResult.FAIL);
  });

  it('passes for KYC level 2 with 10,000 GH¢', () => {
    const checks = checkKYCCompliance(makeTxInput({ senderKycLevel: 2, amount: 10_000 }));
    expect(checks[0].result).toBe(ComplianceResult.PASS);
  });

  it('fails for KYC level 0 (no KYC — zero limit)', () => {
    const checks = checkKYCCompliance(makeTxInput({ senderKycLevel: 0, amount: 1 }));
    expect(checks[0].result).toBe(ComplianceResult.FAIL);
  });
});

// ─── Reserve adequacy ───────────────────────────────────

describe('checkReserveAdequacy', () => {
  it('passes when gold backing >= 10%', () => {
    const checks = checkReserveAdequacy({
      goldReserveValueGHS: 500_000_000,
      gbdcCirculation: 4_000_000_000,
      cocoaReserveValueGHS: 100_000_000,
      crdnOutstanding: 100_000_000,
    });
    const goldCheck = checks.find(c => c.description.includes('Gold'));
    expect(goldCheck!.result).toBe(ComplianceResult.PASS);
  });

  it('fails when gold backing < 10%', () => {
    const checks = checkReserveAdequacy({
      goldReserveValueGHS: 100_000,
      gbdcCirculation: 4_000_000_000,
      cocoaReserveValueGHS: 0,
      crdnOutstanding: 0,
    });
    const goldCheck = checks.find(c => c.description.includes('Gold'));
    expect(goldCheck!.result).toBe(ComplianceResult.FAIL);
  });

  it('passes when cocoa backing >= 95%', () => {
    const checks = checkReserveAdequacy({
      goldReserveValueGHS: 0,
      gbdcCirculation: 1,
      cocoaReserveValueGHS: 1_000_000,
      crdnOutstanding: 1_000_000,
    });
    const cocoaCheck = checks.find(c => c.description.includes('Cocoa'));
    expect(cocoaCheck!.result).toBe(ComplianceResult.PASS);
  });

  it('fails when cocoa backing < 95%', () => {
    const checks = checkReserveAdequacy({
      goldReserveValueGHS: 0,
      gbdcCirculation: 1,
      cocoaReserveValueGHS: 500_000,
      crdnOutstanding: 1_000_000,
    });
    const cocoaCheck = checks.find(c => c.description.includes('Cocoa'));
    expect(cocoaCheck!.result).toBe(ComplianceResult.FAIL);
  });
});

// ─── Oracle compliance ──────────────────────────────────

describe('checkOracleCompliance', () => {
  it('passes when attestation is within 24 hours', () => {
    const checks = checkOracleCompliance({
      attestationAge: 3600, // 1 hour
      sensorCount: 10,
      activeSensors: 9,
      confidenceScore: 0.95,
    });
    const freshness = checks.find(c => c.description.includes('freshness'));
    expect(freshness!.result).toBe(ComplianceResult.PASS);
  });

  it('fails when attestation > 24 hours old', () => {
    const checks = checkOracleCompliance({
      attestationAge: 100_000, // > 24h
      sensorCount: 10,
      activeSensors: 10,
      confidenceScore: 0.99,
    });
    const freshness = checks.find(c => c.description.includes('freshness'));
    expect(freshness!.result).toBe(ComplianceResult.FAIL);
  });
});

// ─── generateComplianceReport ───────────────────────────

describe('generateComplianceReport', () => {
  it('summarizes a mix of pass/fail/warning', () => {
    const checks = [
      ...checkAMLCompliance(makeTxInput({ amount: 60_000 })),
      ...checkKYCCompliance(makeTxInput({ senderKycLevel: 3 })),
    ];
    const report = generateComplianceReport(checks);
    expect(report.totalChecks).toBe(checks.length);
    expect(report.passed + report.failed + report.warnings + report.needsReview).toBe(report.totalChecks);
  });

  it('returns overallStatus PASS when all pass', () => {
    const checks = checkKYCCompliance(makeTxInput({ senderKycLevel: 3, amount: 100 }));
    const report = generateComplianceReport(checks);
    expect(report.overallStatus).toBe('PASS');
  });

  it('returns overallStatus FAIL when any check fails', () => {
    const checks = checkKYCCompliance(makeTxInput({ senderKycLevel: 0, amount: 100 }));
    const report = generateComplianceReport(checks);
    expect(report.overallStatus).toBe('FAIL');
  });
});
