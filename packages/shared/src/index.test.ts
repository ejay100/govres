/**
 * GOVRES — Shared Package Tests
 * Tests for types, constants, and exports
 */

import { describe, it, expect } from 'vitest';
import {
  UserRole,
  InstrumentType,
  TransactionStatus,
  OracleSourceType,
  SYSTEM,
  FINANCIAL,
  REGULATORY,
  GHANAIAN_BANKS,
  MOMO_PROVIDERS,
  ERROR_CODES,
  COCOA_REGIONS,
  GOLD_MINING_REGIONS,
} from './index';

// ─── UserRole enum ──────────────────────────────────────

describe('UserRole enum', () => {
  it('has all 9 roles', () => {
    const roles = Object.keys(UserRole);
    expect(roles.length).toBeGreaterThanOrEqual(9);
    expect(roles).toContain('BOG_ADMIN');
    expect(roles).toContain('BOG_AUDITOR');
    expect(roles).toContain('GOVT_AGENCY');
    expect(roles).toContain('COMMERCIAL_BANK');
    expect(roles).toContain('CONTRACTOR');
    expect(roles).toContain('FARMER');
    expect(roles).toContain('LBC');
    expect(roles).toContain('DIASPORA');
    expect(roles).toContain('PUBLIC');
  });
});

// ─── InstrumentType ─────────────────────────────────────

describe('InstrumentType enum', () => {
  it('includes GBDC and CRDN', () => {
    expect(InstrumentType.GBDC).toBe('GBDC');
    expect(InstrumentType.CRDN).toBe('CRDN');
  });
});

// ─── TransactionStatus ──────────────────────────────────

describe('TransactionStatus enum', () => {
  it('has required statuses', () => {
    expect(TransactionStatus.PENDING).toBe('PENDING');
    expect(TransactionStatus.CONFIRMED).toBe('CONFIRMED');
    expect(TransactionStatus.SETTLED).toBe('SETTLED');
    expect(TransactionStatus.REJECTED).toBe('REJECTED');
  });
});

// ─── OracleSourceType ───────────────────────────────────

describe('OracleSourceType enum', () => {
  it('has vault and warehouse types', () => {
    expect(OracleSourceType.VAULT_SENSOR).toBe('VAULT_SENSOR');
    expect(OracleSourceType.WAREHOUSE_RECEIPT).toBe('WAREHOUSE_RECEIPT');
    expect(OracleSourceType.GOLDBOD_ROYALTY).toBe('GOLDBOD_ROYALTY');
  });
});

// ─── SYSTEM constants ───────────────────────────────────

describe('SYSTEM constants', () => {
  it('has correct block interval', () => {
    expect(SYSTEM.BLOCK_INTERVAL_MS).toBe(5000);
  });

  it('has correct max tx per block', () => {
    expect(SYSTEM.MAX_TX_PER_BLOCK).toBe(1000);
  });

  it('has correct hash algorithm', () => {
    expect(SYSTEM.HASH_ALGORITHM).toBe('SHA-256');
  });

  it('has API rate limit', () => {
    expect(SYSTEM.API_RATE_LIMIT).toBe(100);
  });
});

// ─── FINANCIAL constants ────────────────────────────────

describe('FINANCIAL constants', () => {
  it('gold reserve allocation is 10%', () => {
    expect(FINANCIAL.GOLD_RESERVE_ALLOCATION_PERCENT).toBe(10);
  });

  it('min GBDC issuance is 1000 GHS', () => {
    expect(FINANCIAL.MIN_GBDC_ISSUANCE_CEDI).toBe(1000);
  });

  it('min CRDN value is 10 GHS', () => {
    expect(FINANCIAL.MIN_CRDN_VALUE_CEDI).toBe(10);
  });

  it('settlement finality is 30 seconds', () => {
    expect(FINANCIAL.SETTLEMENT_FINALITY_SECONDS).toBe(30);
  });

  it('money multiplier is 2.5', () => {
    expect(FINANCIAL.MONEY_MULTIPLIER).toBe(2.5);
  });
});

// ─── Reference data ─────────────────────────────────────

describe('Reference data arrays', () => {
  it('GHANAIAN_BANKS is non-empty', () => {
    expect(GHANAIAN_BANKS.length).toBeGreaterThan(0);
  });

  it('MOMO_PROVIDERS has entries', () => {
    expect(MOMO_PROVIDERS.length).toBeGreaterThan(0);
  });

  it('COCOA_REGIONS has regions', () => {
    expect(COCOA_REGIONS.length).toBeGreaterThan(0);
  });

  it('GOLD_MINING_REGIONS has regions', () => {
    expect(GOLD_MINING_REGIONS.length).toBeGreaterThan(0);
  });
});

// ─── ERROR_CODES ────────────────────────────────────────

describe('ERROR_CODES', () => {
  it('has ledger error codes', () => {
    expect(ERROR_CODES).toHaveProperty('INSUFFICIENT_BALANCE');
    expect(ERROR_CODES).toHaveProperty('INSUFFICIENT_RESERVE');
    expect(ERROR_CODES).toHaveProperty('UNAUTHORIZED');
  });

  it('has oracle error codes', () => {
    expect(ERROR_CODES).toHaveProperty('SENSOR_OFFLINE');
    expect(ERROR_CODES).toHaveProperty('VERIFICATION_FAILED');
  });
});

// ─── REGULATORY ─────────────────────────────────────────

describe('REGULATORY constants', () => {
  it('has key acts', () => {
    expect(REGULATORY.BOG_ACT).toBeDefined();
    expect(REGULATORY.PAYMENT_SYSTEMS_ACT).toBeDefined();
    expect(REGULATORY.COCOBOD_ACT).toBeDefined();
  });
});
