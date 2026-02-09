/**
 * GOVRES — Gold Vault Oracle
 * 
 * Interfaces with physical gold vault sensors to provide real-time,
 * machine-verifiable attestation of gold reserves.
 * 
 * Per whitepaper Layer 1 (Asset Attestation):
 * - Vault sensors for gold weight
 * - Assay fingerprint per gold bar
 * - Outcome: Machine-verifiable asset truth
 * 
 * Ghana's gold reserves are held at BoG vaults. ~$20B annual gold exports.
 * GOVRES uses 10% of reserves for GBDC backing (~GH¢4.15B capacity).
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';
import {
  OracleSourceType,
  OracleAttestation,
  SensorReading,
  GoldBar,
  SYSTEM,
  ERROR_CODES,
} from '@govres/shared';

// ─── Sensor Types ───────────────────────────────────────────────

export interface VaultSensorConfig {
  sensorId: string;
  vaultId: string;
  type: 'WEIGHT' | 'TEMPERATURE' | 'HUMIDITY' | 'TAMPER' | 'CAMERA';
  manufacturer: string;
  calibrationDate: Date;
  calibrationCertificate: string;
  readingIntervalSeconds: number;
  tolerancePercent: number;       // Acceptable variance
}

export interface AssayReport {
  barId: string;
  assayFingerprint: string;      // Unique spectral/chemical fingerprint
  purity: number;                // e.g., 99.99
  weightGrams: number;
  refineryId: string;
  assayLab: string;
  assayDate: Date;
  certificateHash: string;
  xrfSignature: string;          // X-ray fluorescence signature
}

export interface VaultInventorySnapshot {
  vaultId: string;
  timestamp: Date;
  totalBars: number;
  totalWeightGrams: number;
  bars: Array<{
    barId: string;
    weightGrams: number;
    position: string;            // Shelf/rack position
    lastScanTime: Date;
  }>;
  sensorReadings: SensorReading[];
  anomalies: VaultAnomaly[];
  attestationHash: string;
}

export interface VaultAnomaly {
  type: 'WEIGHT_DISCREPANCY' | 'TAMPER_ALERT' | 'SENSOR_OFFLINE' | 'UNAUTHORIZED_ACCESS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
  details: string;
  sensorId: string;
  acknowledged: boolean;
}

// ─── Gold Vault Oracle ──────────────────────────────────────────

export class GoldVaultOracle extends EventEmitter {
  private sensors: Map<string, VaultSensorConfig> = new Map();
  private bars: Map<string, AssayReport> = new Map();
  private latestReadings: Map<string, SensorReading> = new Map();
  private attestations: Map<string, OracleAttestation> = new Map();
  private pollingTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
  }

  /**
   * Register a vault sensor
   */
  registerSensor(config: VaultSensorConfig): void {
    this.sensors.set(config.sensorId, config);
    this.emit('sensor:registered', {
      sensorId: config.sensorId,
      vaultId: config.vaultId,
      type: config.type,
    });
  }

  /**
   * Register a gold bar with its assay report
   */
  registerBar(report: AssayReport): void {
    this.bars.set(report.barId, report);
    this.emit('bar:registered', {
      barId: report.barId,
      weightGrams: report.weightGrams,
      purity: report.purity,
    });
  }

  /**
   * Process an incoming sensor reading
   * In production, this would receive data from IoT sensors via MQTT/CoAP
   */
  processSensorReading(reading: SensorReading): void {
    const sensor = this.sensors.get(reading.sensorId);
    if (!sensor) {
      this.emit('error', { code: ERROR_CODES.SENSOR_OFFLINE, sensorId: reading.sensorId });
      return;
    }

    // Verify reading signature
    const expectedHash = this.computeReadingHash(reading);
    if (expectedHash !== reading.signatureHash) {
      this.emit('error', {
        code: ERROR_CODES.VERIFICATION_FAILED,
        sensorId: reading.sensorId,
        message: 'Sensor reading signature mismatch',
      });
      return;
    }

    // Check for tamper
    if (reading.tamperDetected) {
      this.emit('anomaly:detected', {
        type: 'TAMPER_ALERT',
        severity: 'CRITICAL',
        sensorId: reading.sensorId,
        timestamp: reading.timestamp,
      });
    }

    // Check weight variance
    const previousReading = this.latestReadings.get(reading.sensorId);
    if (previousReading && sensor.type === 'WEIGHT') {
      const variance = Math.abs(reading.weightGrams - previousReading.weightGrams) / previousReading.weightGrams * 100;
      if (variance > sensor.tolerancePercent) {
        this.emit('anomaly:detected', {
          type: 'WEIGHT_DISCREPANCY',
          severity: variance > 5 ? 'CRITICAL' : 'HIGH',
          sensorId: reading.sensorId,
          previousWeight: previousReading.weightGrams,
          currentWeight: reading.weightGrams,
          variancePercent: variance,
        });
      }
    }

    this.latestReadings.set(reading.sensorId, reading);
    this.emit('reading:processed', { sensorId: reading.sensorId, timestamp: reading.timestamp });
  }

  /**
   * Generate an attestation for the current vault state
   * This creates a cryptographically signed proof of reserves
   */
  generateAttestation(vaultId: string): OracleAttestation {
    const vaultSensors = Array.from(this.sensors.values()).filter(s => s.vaultId === vaultId);
    const vaultBars = Array.from(this.bars.values());

    // Aggregate readings
    const readings = vaultSensors.map(s => this.latestReadings.get(s.sensorId)).filter(Boolean);
    const totalWeight = readings.reduce((sum, r) => sum + (r?.weightGrams || 0), 0);

    const data = {
      vaultId,
      totalBars: vaultBars.length,
      totalWeightGrams: totalWeight,
      sensorCount: vaultSensors.length,
      readingsTimestamp: new Date(),
      barFingerprints: vaultBars.map(b => b.assayFingerprint),
    };

    const hash = crypto.createHash(SYSTEM.HASH_ALGORITHM).update(JSON.stringify(data)).digest('hex');
    const signature = this.signAttestation(hash);

    const attestation: OracleAttestation = {
      id: crypto.randomUUID(),
      attestationId: `GOLD-ATT-${Date.now().toString(36)}`,
      sourceType: OracleSourceType.VAULT_SENSOR,
      sourceId: vaultId,
      data,
      hash,
      signature,
      verified: true,
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + SYSTEM.ORACLE_ATTESTATION_VALIDITY_HOURS * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'GOLD_VAULT_ORACLE',
      version: 1,
    };

    this.attestations.set(attestation.attestationId, attestation);
    this.emit('attestation:generated', {
      attestationId: attestation.attestationId,
      vaultId,
      totalWeightGrams: totalWeight,
    });

    return attestation;
  }

  /**
   * Verify an existing attestation
   */
  verifyAttestation(attestationId: string): boolean {
    const attestation = this.attestations.get(attestationId);
    if (!attestation) return false;
    if (new Date() > attestation.expiresAt) return false;

    const computedHash = crypto
      .createHash(SYSTEM.HASH_ALGORITHM)
      .update(JSON.stringify(attestation.data))
      .digest('hex');

    return computedHash === attestation.hash;
  }

  /**
   * Get a snapshot of the entire vault inventory
   */
  getVaultSnapshot(vaultId: string): VaultInventorySnapshot {
    const vaultSensors = Array.from(this.sensors.values()).filter(s => s.vaultId === vaultId);
    const readings = vaultSensors
      .map(s => this.latestReadings.get(s.sensorId))
      .filter((r): r is SensorReading => r !== undefined);

    const totalWeight = readings.reduce((sum, r) => sum + r.weightGrams, 0);
    const barList = Array.from(this.bars.values()).map(bar => ({
      barId: bar.barId,
      weightGrams: bar.weightGrams,
      position: 'VAULT-' + vaultId,
      lastScanTime: new Date(),
    }));

    const snapshotData = {
      vaultId,
      timestamp: new Date(),
      totalBars: barList.length,
      totalWeightGrams: totalWeight,
    };

    return {
      ...snapshotData,
      bars: barList,
      sensorReadings: readings,
      anomalies: [],
      attestationHash: crypto
        .createHash(SYSTEM.HASH_ALGORITHM)
        .update(JSON.stringify(snapshotData))
        .digest('hex'),
    };
  }

  // ─── Private Methods ──────────────────────────────────────────

  private computeReadingHash(reading: SensorReading): string {
    const data = `${reading.sensorId}:${reading.timestamp.toISOString()}:${reading.weightGrams}:${reading.temperatureCelsius}:${reading.humidityPercent}:${reading.tamperDetected}`;
    return crypto.createHash(SYSTEM.HASH_ALGORITHM).update(data).digest('hex');
  }

  private signAttestation(hash: string): string {
    // In production, this would use HSM-backed private key signing
    return crypto
      .createHash(SYSTEM.HASH_ALGORITHM)
      .update(hash + 'GOVRES_ORACLE_KEY')
      .digest('hex');
  }
}
