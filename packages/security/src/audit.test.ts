/**
 * GOVRES — Audit Logger Tests
 * Tests for hash-chained audit trail, query, and export
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AuditLogger, AuditAction } from './audit';

let logger: AuditLogger;

beforeEach(() => {
  logger = new AuditLogger('TEST');
});

// ─── log ────────────────────────────────────────────────

describe('AuditLogger.log', () => {
  it('creates an entry with correct fields', () => {
    const entry = logger.log({
      action: AuditAction.GBDC_MINT,
      actorId: 'USER-001',
      actorRole: 'BOG_ADMIN',
      resourceType: 'GBDC',
      resourceId: 'GBDC-001',
      details: { amountCedi: 1_000_000 },
    });

    expect(entry.entryId).toContain('TEST-AUDIT-');
    expect(entry.sequenceNumber).toBe(1);
    expect(entry.action).toBe(AuditAction.GBDC_MINT);
    expect(entry.actorId).toBe('USER-001');
    expect(entry.actorRole).toBe('BOG_ADMIN');
    expect(entry.entryHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('increments sequence number', () => {
    const e1 = logger.log({ action: AuditAction.USER_LOGIN, actorId: 'A', actorRole: 'R', resourceType: 'T', resourceId: 'R1', details: {} });
    const e2 = logger.log({ action: AuditAction.USER_LOGOUT, actorId: 'A', actorRole: 'R', resourceType: 'T', resourceId: 'R2', details: {} });
    expect(e1.sequenceNumber).toBe(1);
    expect(e2.sequenceNumber).toBe(2);
  });

  it('chains hashes — entry N references entry N-1', () => {
    const e1 = logger.log({ action: AuditAction.USER_LOGIN, actorId: 'A', actorRole: 'R', resourceType: 'T', resourceId: 'R1', details: {} });
    const e2 = logger.log({ action: AuditAction.USER_LOGOUT, actorId: 'A', actorRole: 'R', resourceType: 'T', resourceId: 'R2', details: {} });
    expect(e2.previousHash).toBe(e1.entryHash);
  });

  it('first entry has genesis previousHash (all zeros)', () => {
    const entry = logger.log({ action: AuditAction.USER_LOGIN, actorId: 'A', actorRole: 'R', resourceType: 'T', resourceId: 'R1', details: {} });
    expect(entry.previousHash).toBe('0'.repeat(64));
  });

  it('includes optional ipAddress', () => {
    const entry = logger.log({
      action: AuditAction.USER_LOGIN, actorId: 'A', actorRole: 'R',
      resourceType: 'T', resourceId: 'R1', details: {}, ipAddress: '10.0.0.1',
    });
    expect(entry.ipAddress).toBe('10.0.0.1');
  });
});

// ─── verifyChain ────────────────────────────────────────

describe('AuditLogger.verifyChain', () => {
  it('valid on empty log', () => {
    const result = logger.verifyChain();
    expect(result.valid).toBe(true);
    expect(result.totalEntries).toBe(0);
  });

  it('valid after multiple entries', () => {
    for (let i = 0; i < 10; i++) {
      logger.log({ action: AuditAction.SENSOR_READING, actorId: 'S', actorRole: 'SYSTEM', resourceType: 'SENSOR', resourceId: `S-${i}`, details: { value: i } });
    }
    const result = logger.verifyChain();
    expect(result.valid).toBe(true);
    expect(result.totalEntries).toBe(10);
  });
});

// ─── query ──────────────────────────────────────────────

describe('AuditLogger.query', () => {
  it('filters by action', () => {
    logger.log({ action: AuditAction.GBDC_MINT, actorId: 'A', actorRole: 'R', resourceType: 'T', resourceId: 'X', details: {} });
    logger.log({ action: AuditAction.USER_LOGIN, actorId: 'B', actorRole: 'R', resourceType: 'T', resourceId: 'Y', details: {} });
    const results = logger.query({ action: AuditAction.GBDC_MINT });
    expect(results).toHaveLength(1);
    expect(results[0].actorId).toBe('A');
  });

  it('filters by actorId', () => {
    logger.log({ action: AuditAction.GBDC_MINT, actorId: 'ALICE', actorRole: 'R', resourceType: 'T', resourceId: 'X', details: {} });
    logger.log({ action: AuditAction.GBDC_MINT, actorId: 'BOB', actorRole: 'R', resourceType: 'T', resourceId: 'Y', details: {} });
    expect(logger.query({ actorId: 'ALICE' })).toHaveLength(1);
  });

  it('filters by resourceId', () => {
    logger.log({ action: AuditAction.GBDC_TRANSFER, actorId: 'A', actorRole: 'R', resourceType: 'T', resourceId: 'GBDC-001', details: {} });
    logger.log({ action: AuditAction.GBDC_TRANSFER, actorId: 'A', actorRole: 'R', resourceType: 'T', resourceId: 'GBDC-002', details: {} });
    expect(logger.query({ resourceId: 'GBDC-001' })).toHaveLength(1);
  });

  it('respects limit', () => {
    for (let i = 0; i < 20; i++) {
      logger.log({ action: AuditAction.SENSOR_READING, actorId: 'S', actorRole: 'R', resourceType: 'T', resourceId: `${i}`, details: {} });
    }
    expect(logger.query({ limit: 5 })).toHaveLength(5);
  });

  it('returns all when no filters', () => {
    logger.log({ action: AuditAction.GBDC_MINT, actorId: 'A', actorRole: 'R', resourceType: 'T', resourceId: 'X', details: {} });
    logger.log({ action: AuditAction.GBDC_REDEEM, actorId: 'B', actorRole: 'R', resourceType: 'T', resourceId: 'Y', details: {} });
    expect(logger.query({})).toHaveLength(2);
  });
});

// ─── exportForRegulator ─────────────────────────────────

describe('AuditLogger.exportForRegulator', () => {
  it('exports CSV with header row', () => {
    logger.log({ action: AuditAction.GBDC_MINT, actorId: 'A', actorRole: 'BOG_ADMIN', resourceType: 'GBDC', resourceId: 'G1', details: {} });
    const csv = logger.exportForRegulator({
      startDate: '2020-01-01',
      endDate: '2030-12-31',
      format: 'csv',
    });
    expect(csv).toContain('EntryID,Sequence,Timestamp');
    expect(csv).toContain('GBDC_MINT');
  });

  it('exports JSON with chainIntegrity', () => {
    logger.log({ action: AuditAction.USER_LOGIN, actorId: 'A', actorRole: 'R', resourceType: 'T', resourceId: 'X', details: {} });
    const json = logger.exportForRegulator({
      startDate: '2020-01-01',
      endDate: '2030-12-31',
      format: 'json',
    });
    const parsed = JSON.parse(json);
    expect(parsed).toHaveProperty('exportedAt');
    expect(parsed).toHaveProperty('chainIntegrity');
    expect(parsed.chainIntegrity.valid).toBe(true);
  });
});

// ─── getEntryCount ──────────────────────────────────────

describe('AuditLogger.getEntryCount', () => {
  it('returns 0 initially', () => {
    expect(logger.getEntryCount()).toBe(0);
  });

  it('increments after logging', () => {
    logger.log({ action: AuditAction.GBDC_MINT, actorId: 'A', actorRole: 'R', resourceType: 'T', resourceId: 'X', details: {} });
    expect(logger.getEntryCount()).toBe(1);
  });
});
