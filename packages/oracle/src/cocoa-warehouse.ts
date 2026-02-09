/**
 * GOVRES — Cocoa Warehouse Oracle
 * 
 * Digitizes cocoa warehouse receipts and farm-gate delivery data.
 * Provides real-time attestation of cocoa reserves for CRDN issuance.
 * 
 * Per whitepaper Layer 1:
 * - Digitized cocoa warehouse receipts
 * - LBC farm-gate delivery capture
 * - Cocobod data feed integration
 * 
 * Ghana Cocobod context:
 * - Governed by PNDC Law 81 (Cocoa Board Act 1984)
 * - Current CEO: Randy Abbey (Jan 2025)
 * - 2025 cocoa receipts ~GH¢44.95B  
 * - Standard bag = 64kg
 * - Key regions: Ashanti, Western, Western North, Eastern, Central
 * - Subsidiaries: CRIG, Seed Production, Cocoa Health & Extension, 
 *   Quality Control Company, Cocoa Marketing Company
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';
import {
  OracleSourceType,
  OracleAttestation,
  CocoaReceipt,
  CRDNStatus,
  SYSTEM,
  FINANCIAL,
  COCOA_REGIONS,
} from '@govres/shared';

// ─── Types ──────────────────────────────────────────────────────

export interface FarmGateDelivery {
  deliveryId: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  lbcId: string;
  lbcName: string;
  purchaseClerkId: string;
  region: typeof COCOA_REGIONS[number];
  district: string;
  community: string;
  bagsCount: number;
  weightKg: number;             // Standard 64kg per bag
  qualityGrade: 'GRADE_1' | 'GRADE_2' | 'SUB_STANDARD';
  moistureContent: number;       // Percentage
  beanCount: number;             // Beans per 100g sample
  deliveryDate: Date;
  gpsCoordinates: { lat: number; lng: number };
  seasonYear: string;
  clerkSignature: string;
  farmerThumbprint: string;      // Biometric hash
}

export interface WarehouseEntry {
  entryId: string;
  warehouseId: string;
  warehouseName: string;
  warehouseRegion: typeof COCOA_REGIONS[number];
  deliveryIds: string[];
  totalBags: number;
  totalWeightKg: number;
  qualityCheckedBy: string;      // QCC (Quality Control Company) inspector
  qualityCheckDate: Date;
  qualityResult: 'PASSED' | 'FAILED' | 'CONDITIONAL';
  stackNumber: string;
  gradeBreakdown: {
    grade1Bags: number;
    grade2Bags: number;
    subStandardBags: number;
  };
  exportContractRef?: string;
  storedAt: Date;
}

export interface CocoaSeasonSummary {
  seasonYear: string;
  totalDeliveries: number;
  totalBags: number;
  totalWeightKg: number;
  estimatedValueGHS: number;
  regionBreakdown: Record<string, {
    deliveries: number;
    bags: number;
    weightKg: number;
  }>;
  qualityBreakdown: {
    grade1Percent: number;
    grade2Percent: number;
    subStandardPercent: number;
  };
}

// ─── Cocoa Warehouse Oracle ─────────────────────────────────────

export class CocoaWarehouseOracle extends EventEmitter {
  private deliveries: Map<string, FarmGateDelivery> = new Map();
  private warehouseEntries: Map<string, WarehouseEntry> = new Map();
  private attestations: Map<string, OracleAttestation> = new Map();
  private producerPricePerKgGHS: number;

  constructor(initialProducerPrice: number) {
    super();
    // Cocobod sets the producer price at the start of each season
    this.producerPricePerKgGHS = initialProducerPrice;
  }

  /**
   * Update the Cocobod producer price (set at season start)
   */
  updateProducerPrice(pricePerKgGHS: number): void {
    const oldPrice = this.producerPricePerKgGHS;
    this.producerPricePerKgGHS = pricePerKgGHS;
    this.emit('price:updated', { oldPrice, newPrice: pricePerKgGHS });
  }

  /**
   * Record a farm-gate cocoa delivery
   * This is the trigger point for CRDN issuance
   */
  recordDelivery(delivery: FarmGateDelivery): CocoaReceipt {
    // Validate weight consistency (bags × 64kg ≈ total weight)
    const expectedWeight = delivery.bagsCount * FINANCIAL.STANDARD_COCOA_BAG_KG;
    const weightVariance = Math.abs(delivery.weightKg - expectedWeight) / expectedWeight * 100;
    if (weightVariance > 5) {
      this.emit('anomaly:weight', {
        deliveryId: delivery.deliveryId,
        expected: expectedWeight,
        actual: delivery.weightKg,
        variance: weightVariance,
      });
    }

    // Validate quality
    if (delivery.moistureContent > 8) {
      delivery.qualityGrade = 'SUB_STANDARD';
    }

    this.deliveries.set(delivery.deliveryId, delivery);

    // Generate cocoa receipt
    const receiptId = `CRDN-RCP-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
    const verificationHash = crypto
      .createHash(SYSTEM.HASH_ALGORITHM)
      .update(JSON.stringify(delivery))
      .digest('hex');

    const receipt: CocoaReceipt = {
      id: crypto.randomUUID(),
      receiptId,
      warehouseId: '',
      farmerId: delivery.farmerId,
      lbcId: delivery.lbcId,
      qualityGrade: delivery.qualityGrade,
      weightKg: delivery.weightKg,
      bagsCount: delivery.bagsCount,
      deliveryDate: delivery.deliveryDate,
      seasonYear: delivery.seasonYear,
      status: CRDNStatus.ISSUED,
      verificationHash,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: delivery.purchaseClerkId,
      version: 1,
    };

    this.emit('delivery:recorded', {
      deliveryId: delivery.deliveryId,
      receiptId,
      farmerId: delivery.farmerId,
      weightKg: delivery.weightKg,
      valueCedi: delivery.weightKg * this.producerPricePerKgGHS,
    });

    return receipt;
  }

  /**
   * Record warehouse entry after QCC inspection
   */
  recordWarehouseEntry(entry: WarehouseEntry): void {
    this.warehouseEntries.set(entry.entryId, entry);

    // Link deliveries to warehouse
    for (const deliveryId of entry.deliveryIds) {
      const delivery = this.deliveries.get(deliveryId);
      if (delivery) {
        this.emit('delivery:warehoused', {
          deliveryId,
          warehouseId: entry.warehouseId,
          qualityResult: entry.qualityResult,
        });
      }
    }

    this.emit('warehouse:entry', {
      entryId: entry.entryId,
      warehouseId: entry.warehouseId,
      totalBags: entry.totalBags,
      totalWeightKg: entry.totalWeightKg,
    });
  }

  /**
   * Generate an attestation for cocoa reserves
   */
  generateAttestation(warehouseId: string): OracleAttestation {
    const entries = Array.from(this.warehouseEntries.values())
      .filter(e => e.warehouseId === warehouseId);

    const totalBags = entries.reduce((sum, e) => sum + e.totalBags, 0);
    const totalWeightKg = entries.reduce((sum, e) => sum + e.totalWeightKg, 0);

    const data = {
      warehouseId,
      totalBags,
      totalWeightKg,
      estimatedValueGHS: totalWeightKg * this.producerPricePerKgGHS,
      entryCount: entries.length,
      gradeBreakdown: entries.reduce(
        (acc, e) => ({
          grade1: acc.grade1 + e.gradeBreakdown.grade1Bags,
          grade2: acc.grade2 + e.gradeBreakdown.grade2Bags,
          subStandard: acc.subStandard + e.gradeBreakdown.subStandardBags,
        }),
        { grade1: 0, grade2: 0, subStandard: 0 }
      ),
      timestamp: new Date(),
    };

    const hash = crypto.createHash(SYSTEM.HASH_ALGORITHM).update(JSON.stringify(data)).digest('hex');

    const attestation: OracleAttestation = {
      id: crypto.randomUUID(),
      attestationId: `COCOA-ATT-${Date.now().toString(36)}`,
      sourceType: OracleSourceType.WAREHOUSE_RECEIPT,
      sourceId: warehouseId,
      data,
      hash,
      signature: this.signAttestation(hash),
      verified: true,
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + SYSTEM.ORACLE_ATTESTATION_VALIDITY_HOURS * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'COCOA_WAREHOUSE_ORACLE',
      version: 1,
    };

    this.attestations.set(attestation.attestationId, attestation);
    this.emit('attestation:generated', {
      attestationId: attestation.attestationId,
      warehouseId,
      totalWeightKg,
    });

    return attestation;
  }

  /**
   * Get season summary with regional breakdown
   */
  getSeasonSummary(seasonYear: string): CocoaSeasonSummary {
    const seasonDeliveries = Array.from(this.deliveries.values())
      .filter(d => d.seasonYear === seasonYear);

    const regionBreakdown: Record<string, { deliveries: number; bags: number; weightKg: number }> = {};
    let grade1 = 0, grade2 = 0, subStandard = 0;

    for (const d of seasonDeliveries) {
      if (!regionBreakdown[d.region]) {
        regionBreakdown[d.region] = { deliveries: 0, bags: 0, weightKg: 0 };
      }
      regionBreakdown[d.region].deliveries++;
      regionBreakdown[d.region].bags += d.bagsCount;
      regionBreakdown[d.region].weightKg += d.weightKg;

      if (d.qualityGrade === 'GRADE_1') grade1 += d.bagsCount;
      else if (d.qualityGrade === 'GRADE_2') grade2 += d.bagsCount;
      else subStandard += d.bagsCount;
    }

    const totalBags = seasonDeliveries.reduce((sum, d) => sum + d.bagsCount, 0);
    const totalWeightKg = seasonDeliveries.reduce((sum, d) => sum + d.weightKg, 0);

    return {
      seasonYear,
      totalDeliveries: seasonDeliveries.length,
      totalBags,
      totalWeightKg,
      estimatedValueGHS: totalWeightKg * this.producerPricePerKgGHS,
      regionBreakdown,
      qualityBreakdown: {
        grade1Percent: totalBags > 0 ? (grade1 / totalBags) * 100 : 0,
        grade2Percent: totalBags > 0 ? (grade2 / totalBags) * 100 : 0,
        subStandardPercent: totalBags > 0 ? (subStandard / totalBags) * 100 : 0,
      },
    };
  }

  /**
   * Get the current producer price
   */
  getProducerPrice(): number {
    return this.producerPricePerKgGHS;
  }

  // ─── Private Methods ──────────────────────────────────────────

  private signAttestation(hash: string): string {
    return crypto
      .createHash(SYSTEM.HASH_ALGORITHM)
      .update(hash + 'GOVRES_COCOA_ORACLE_KEY')
      .digest('hex');
  }
}
