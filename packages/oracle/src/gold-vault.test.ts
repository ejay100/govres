/**
 * GOVRES — Gold Vault Oracle Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GoldVaultOracle, VaultSensorConfig, AssayReport } from './gold-vault';
import crypto from 'crypto';
import { SYSTEM } from '@govres/shared';

let oracle: GoldVaultOracle;

function makeSensor(overrides: Partial<VaultSensorConfig> = {}): VaultSensorConfig {
  return {
    sensorId: overrides.sensorId ?? 'SENSOR-001',
    vaultId: overrides.vaultId ?? 'VAULT-ACCRA-1',
    type: overrides.type ?? 'WEIGHT',
    manufacturer: 'Mettler Toledo',
    calibrationDate: new Date('2025-01-01'),
    calibrationCertificate: 'CERT-001',
    readingIntervalSeconds: 60,
    tolerancePercent: overrides.tolerancePercent ?? 0.5,
  };
}

function makeAssay(overrides: Partial<AssayReport> = {}): AssayReport {
  return {
    barId: overrides.barId ?? 'BAR-GH-001',
    assayFingerprint: overrides.assayFingerprint ?? 'FP-' + crypto.randomBytes(8).toString('hex'),
    purity: overrides.purity ?? 99.99,
    weightGrams: overrides.weightGrams ?? 12_500, // standard 400oz bar
    refineryId: 'GoldFields-Tarkwa',
    assayLab: 'SGS Ghana',
    assayDate: new Date('2025-01-15'),
    certificateHash: 'cert-hash',
    xrfSignature: 'xrf-sig',
  };
}

function makeReading(sensorId: string, weightGrams: number, tamper = false) {
  const timestamp = new Date();
  const data = `${sensorId}:${timestamp.toISOString()}:${weightGrams}:25:45:${tamper}`;
  const signatureHash = crypto.createHash(SYSTEM.HASH_ALGORITHM).update(data).digest('hex');
  return {
    sensorId,
    timestamp,
    weightGrams,
    temperatureCelsius: 25,
    humidityPercent: 45,
    tamperDetected: tamper,
    signatureHash,
  };
}

beforeEach(() => {
  oracle = new GoldVaultOracle();
});

// ─── Sensor ─────────────────────────────────────────────

describe('registerSensor', () => {
  it('registers and emits event', () => {
    let emitted: any = null;
    oracle.on('sensor:registered', (d) => { emitted = d; });
    oracle.registerSensor(makeSensor());
    expect(emitted).toBeDefined();
    expect(emitted.sensorId).toBe('SENSOR-001');
  });
});

// ─── Bar ────────────────────────────────────────────────

describe('registerBar', () => {
  it('registers a gold bar', () => {
    let emitted: any = null;
    oracle.on('bar:registered', (d) => { emitted = d; });
    oracle.registerBar(makeAssay({ barId: 'BAR-X' }));
    expect(emitted).toBeDefined();
    expect(emitted.barId).toBe('BAR-X');
    expect(emitted.weightGrams).toBe(12_500);
  });
});

// ─── Sensor Readings ────────────────────────────────────

describe('processSensorReading', () => {
  it('processes a valid reading', () => {
    oracle.registerSensor(makeSensor({ sensorId: 'S1' }));
    let emitted = false;
    oracle.on('reading:processed', () => { emitted = true; });
    oracle.processSensorReading(makeReading('S1', 12_500));
    expect(emitted).toBe(true);
  });

  it('emits error for unknown sensor', () => {
    let err: any = null;
    oracle.on('error', (e) => { err = e; });
    oracle.processSensorReading(makeReading('UNKNOWN', 100));
    expect(err).toBeDefined();
  });

  it('emits error for invalid signature hash', () => {
    oracle.registerSensor(makeSensor({ sensorId: 'S-BAD' }));
    let err: any = null;
    oracle.on('error', (e) => { err = e; });
    const reading = makeReading('S-BAD', 12_500);
    reading.signatureHash = 'wrong-hash';
    oracle.processSensorReading(reading);
    expect(err).toBeDefined();
    expect(err.message).toContain('signature mismatch');
  });

  it('detects tamper', () => {
    oracle.registerSensor(makeSensor({ sensorId: 'S-T' }));
    let anomaly: any = null;
    oracle.on('anomaly:detected', (a) => { anomaly = a; });
    oracle.processSensorReading(makeReading('S-T', 12_500, true));
    expect(anomaly).toBeDefined();
    expect(anomaly.type).toBe('TAMPER_ALERT');
  });

  it('detects weight discrepancy between consecutive readings', () => {
    oracle.registerSensor(makeSensor({ sensorId: 'S-W', tolerancePercent: 1 }));
    // First reading: 12,500g
    oracle.processSensorReading(makeReading('S-W', 12_500));
    // Second reading with 10% variance: 11,250g
    let anomaly: any = null;
    oracle.on('anomaly:detected', (a) => { anomaly = a; });
    oracle.processSensorReading(makeReading('S-W', 11_250));
    expect(anomaly).toBeDefined();
    expect(anomaly.type).toBe('WEIGHT_DISCREPANCY');
  });
});

// ─── Attestation ────────────────────────────────────────

describe('generateAttestation', () => {
  it('creates attestation for a vault', () => {
    oracle.registerSensor(makeSensor({ sensorId: 'SV1', vaultId: 'V1' }));
    oracle.registerBar(makeAssay());
    oracle.processSensorReading(makeReading('SV1', 12_500));

    const att = oracle.generateAttestation('V1');
    expect(att.attestationId).toContain('GOLD-ATT-');
    expect(att.verified).toBe(true);
    expect(att.hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('verifyAttestation', () => {
  it('returns true for a valid attestation', () => {
    oracle.registerSensor(makeSensor({ sensorId: 'SV2', vaultId: 'V2' }));
    oracle.processSensorReading(makeReading('SV2', 10_000));
    const att = oracle.generateAttestation('V2');
    expect(oracle.verifyAttestation(att.attestationId)).toBe(true);
  });

  it('returns false for non-existent attestation', () => {
    expect(oracle.verifyAttestation('nonexistent')).toBe(false);
  });
});

// ─── Vault Snapshot ─────────────────────────────────────

describe('getVaultSnapshot', () => {
  it('returns snapshot with bars and readings', () => {
    oracle.registerSensor(makeSensor({ sensorId: 'SS1', vaultId: 'VS1' }));
    oracle.registerBar(makeAssay({ barId: 'B1' }));
    oracle.registerBar(makeAssay({ barId: 'B2' }));
    oracle.processSensorReading(makeReading('SS1', 25_000));

    const snap = oracle.getVaultSnapshot('VS1');
    expect(snap.vaultId).toBe('VS1');
    expect(snap.totalBars).toBe(2);
    expect(snap.bars).toHaveLength(2);
    expect(snap.sensorReadings).toHaveLength(1);
    expect(snap.attestationHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
