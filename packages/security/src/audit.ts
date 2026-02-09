/**
 * GOVRES — Audit Trail Module
 * Immutable audit logging for regulatory compliance
 *
 * Per Bank of Ghana Cyber & Information Security Directive:
 *  - All financial transactions must have complete audit trails
 *  - Logs must be tamper-evident (hash-chained)
 *  - Retention: minimum 7 years
 *  - Access: authorized auditors only
 */

import crypto from 'crypto';

export enum AuditAction {
  // Instrument lifecycle
  GBDC_MINT = 'GBDC_MINT',
  GBDC_TRANSFER = 'GBDC_TRANSFER',
  GBDC_REDEEM = 'GBDC_REDEEM',
  CRDN_ISSUE = 'CRDN_ISSUE',
  CRDN_CONVERT = 'CRDN_CONVERT',

  // Oracle events
  ATTESTATION_GENERATED = 'ATTESTATION_GENERATED',
  ATTESTATION_VERIFIED = 'ATTESTATION_VERIFIED',
  SENSOR_READING = 'SENSOR_READING',
  TAMPER_DETECTED = 'TAMPER_DETECTED',

  // Settlement
  INTERBANK_SETTLEMENT = 'INTERBANK_SETTLEMENT',
  CONTRACTOR_PAYMENT = 'CONTRACTOR_PAYMENT',
  FARMER_CASHOUT = 'FARMER_CASHOUT',
  MOMO_SETTLEMENT = 'MOMO_SETTLEMENT',

  // Administrative
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  ROLE_CHANGE = 'ROLE_CHANGE',
  KEY_ROTATION = 'KEY_ROTATION',
  CONFIG_CHANGE = 'CONFIG_CHANGE',

  // Compliance
  COMPLIANCE_CHECK = 'COMPLIANCE_CHECK',
  CTR_FILED = 'CTR_FILED',
  STR_FILED = 'STR_FILED',
}

export interface AuditLogEntry {
  entryId: string;
  sequenceNumber: number;
  timestamp: string;
  action: AuditAction;
  actorId: string;
  actorRole: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
  previousHash: string;
  entryHash: string;
}

/**
 * Append-only, hash-chained audit logger
 */
export class AuditLogger {
  private entries: AuditLogEntry[] = [];
  private sequenceCounter = 0;

  constructor(private readonly systemId: string = 'GOVRES') {}

  /**
   * Log an audit event (append-only, hash-chained)
   */
  log(params: {
    action: AuditAction;
    actorId: string;
    actorRole: string;
    resourceType: string;
    resourceId: string;
    details: Record<string, any>;
    ipAddress?: string;
  }): AuditLogEntry {
    this.sequenceCounter++;

    const previousHash =
      this.entries.length > 0
        ? this.entries[this.entries.length - 1].entryHash
        : '0'.repeat(64); // genesis

    const entry: Omit<AuditLogEntry, 'entryHash'> = {
      entryId: `${this.systemId}-AUDIT-${this.sequenceCounter.toString().padStart(10, '0')}`,
      sequenceNumber: this.sequenceCounter,
      timestamp: new Date().toISOString(),
      action: params.action,
      actorId: params.actorId,
      actorRole: params.actorRole,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      details: params.details,
      ipAddress: params.ipAddress,
      previousHash,
    };

    // Compute tamper-evident hash
    const entryHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(entry))
      .digest('hex');

    const fullEntry: AuditLogEntry = { ...entry, entryHash };
    this.entries.push(fullEntry);

    return fullEntry;
  }

  /**
   * Verify the integrity of the entire audit chain
   */
  verifyChain(): { valid: boolean; brokenAt?: number; totalEntries: number } {
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];

      // Verify hash
      const { entryHash, ...entryWithoutHash } = entry;
      const computedHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(entryWithoutHash))
        .digest('hex');

      if (computedHash !== entryHash) {
        return { valid: false, brokenAt: i, totalEntries: this.entries.length };
      }

      // Verify chain link
      if (i > 0 && entry.previousHash !== this.entries[i - 1].entryHash) {
        return { valid: false, brokenAt: i, totalEntries: this.entries.length };
      }
    }

    return { valid: true, totalEntries: this.entries.length };
  }

  /**
   * Query audit entries by criteria
   */
  query(params: {
    action?: AuditAction;
    actorId?: string;
    resourceId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): AuditLogEntry[] {
    let results = this.entries;

    if (params.action) {
      results = results.filter(e => e.action === params.action);
    }
    if (params.actorId) {
      results = results.filter(e => e.actorId === params.actorId);
    }
    if (params.resourceId) {
      results = results.filter(e => e.resourceId === params.resourceId);
    }
    if (params.startDate) {
      results = results.filter(e => e.timestamp >= params.startDate!);
    }
    if (params.endDate) {
      results = results.filter(e => e.timestamp <= params.endDate!);
    }
    if (params.limit) {
      results = results.slice(-params.limit);
    }

    return results;
  }

  /**
   * Export audit log for regulatory submission
   * Per BoG requirements, audit records must be exportable for FIC/SEC review
   */
  exportForRegulator(params: {
    startDate: string;
    endDate: string;
    format: 'json' | 'csv';
  }): string {
    const entries = this.query({ startDate: params.startDate, endDate: params.endDate });

    if (params.format === 'csv') {
      const header = 'EntryID,Sequence,Timestamp,Action,ActorID,ActorRole,ResourceType,ResourceID,Hash\n';
      const rows = entries.map(e =>
        `${e.entryId},${e.sequenceNumber},${e.timestamp},${e.action},${e.actorId},${e.actorRole},${e.resourceType},${e.resourceId},${e.entryHash}`
      ).join('\n');
      return header + rows;
    }

    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      system: this.systemId,
      chainIntegrity: this.verifyChain(),
      entries,
    }, null, 2);
  }

  getEntryCount(): number {
    return this.entries.length;
  }
}
