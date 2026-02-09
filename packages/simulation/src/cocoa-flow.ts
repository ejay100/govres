/**
 * GOVRES — Cocoa Flow Simulation
 * Simulates: Farmer delivery → CRDN issuance → CRDN conversion → GBDC → MoMo cashout
 * Models the complete cocoa-to-cash lifecycle per GOVRES whitepaper
 */

import { LedgerEngine } from '@govres/ledger';
import { CocoaWarehouseOracle } from '@govres/oracle';
import {
  UserRole,
  InstrumentType,
  SettlementChannel,
  CRDNStatus,
} from '@govres/shared';

interface SimulationResult {
  farmersServed: number;
  totalBagsDelivered: number;
  totalWeightKg: number;
  crdnIssued: number;
  crdnConverted: number;
  gbdcMinted: number;
  momoSettlements: number;
  averageSettlementTimeMs: number;
  multiplierEffect: number;
}

/**
 * Standard cocoa bag weight per Cocobod specifications
 */
const STANDARD_BAG_KG = 64;

/**
 * Producer price per bag (2024/2025 season — GH¢2,070/bag after latest increase)
 */
const PRODUCER_PRICE_PER_BAG_GHS = 2_070;

/**
 * Simulate a single cocoa season flow
 */
export async function simulateCocoaSeason(options: {
  farmerCount: number;
  avgBagsPerFarmer: number;
  conversionRate: number; // percentage of CRDN converted to GBDC (0-1)
  momoRate: number; // percentage cashed out via MoMo vs bank (0-1)
  regions: string[];
}): Promise<SimulationResult> {
  const ledger = new LedgerEngine();
  await ledger.initialize();

  const oracle = new CocoaWarehouseOracle('sim-warehouse-001');

  const startTime = Date.now();

  // Register BoG account
  ledger.registerAccount({
    accountId: 'bog-reserve',
    organizationId: 'bog',
    role: UserRole.BOG_ADMIN,
    label: 'Bank of Ghana Reserve',
  });

  // Seed gold reserve to enable GBDC minting
  ledger.registerGoldReserve({
    barId: 'sim-gold-seed',
    weightGrams: 100_000, // 100kg seed gold
    purity: 0.999,
    attestationId: 'sim-attest-001',
  });

  let totalBags = 0;
  let totalCRDN = 0;
  let totalConverted = 0;
  let totalGBDC = 0;
  let momoSettlements = 0;

  // Simulate each farmer
  for (let f = 0; f < options.farmerCount; f++) {
    const farmerId = `farmer-${String(f).padStart(5, '0')}`;
    const region = options.regions[f % options.regions.length];

    // Register farmer account
    ledger.registerAccount({
      accountId: farmerId,
      organizationId: `lbc-${region.toLowerCase()}`,
      role: UserRole.FARMER,
      label: `Farmer ${f + 1} — ${region}`,
    });

    // Farmer delivers cocoa — variable bag count with normal distribution
    const bags = Math.max(
      1,
      Math.round(options.avgBagsPerFarmer + (Math.random() - 0.5) * options.avgBagsPerFarmer * 0.6)
    );
    const weightKg = bags * STANDARD_BAG_KG;
    totalBags += bags;

    // Oracle records farm-gate delivery
    oracle.recordFarmGateDelivery({
      farmerId,
      farmerName: `Farmer ${f + 1}`,
      bags,
      weightKg,
      moisturePercent: 7.0 + Math.random() * 1.5, // 7-8.5% (must be <8.5 for Grade I)
      region,
      district: `${region} District`,
      gpsLat: 6.0 + Math.random() * 2,
      gpsLng: -2.0 + Math.random() * 1.5,
      biometricHash: `bio-${farmerId}`,
    });

    // Issue CRDN to farmer
    const crdnValue = bags * PRODUCER_PRICE_PER_BAG_GHS;
    totalCRDN += crdnValue;

    ledger.registerCocoaReserve({
      receiptId: `crdn-sim-${farmerId}`,
      weightKg,
      grade: 'Grade I',
      attestationId: `attest-${farmerId}`,
    });

    const crdn = ledger.issueCRDN({
      farmerId,
      receiptId: `crdn-sim-${farmerId}`,
      bags,
      weightKg,
      grade: 'Grade I',
      region,
      producerPricePerBag: PRODUCER_PRICE_PER_BAG_GHS,
    });

    // Conversion: farmer converts CRDN to GBDC
    if (Math.random() < options.conversionRate) {
      const convertResult = ledger.convertCRDN(crdn.instrumentId, farmerId);
      totalConverted += crdnValue;
      totalGBDC += convertResult.gbdcAmount;

      // Cash-out via MoMo or bank
      if (Math.random() < options.momoRate) {
        momoSettlements++;
      }
    }
  }

  const elapsedMs = Date.now() - startTime;

  return {
    farmersServed: options.farmerCount,
    totalBagsDelivered: totalBags,
    totalWeightKg: totalBags * STANDARD_BAG_KG,
    crdnIssued: totalCRDN,
    crdnConverted: totalConverted,
    gbdcMinted: totalGBDC,
    momoSettlements,
    averageSettlementTimeMs: elapsedMs / options.farmerCount,
    multiplierEffect: totalGBDC > 0 ? totalCRDN / totalGBDC : 0,
  };
}

/**
 * Run the simulation with default parameters
 */
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  GOVRES — Cocoa Season Flow Simulation');
  console.log('═══════════════════════════════════════════════════\n');

  const result = await simulateCocoaSeason({
    farmerCount: 500,
    avgBagsPerFarmer: 15,
    conversionRate: 0.75,
    momoRate: 0.65,
    regions: [
      'Ashanti',
      'Western',
      'Eastern',
      'Brong-Ahafo',
      'Central',
      'Volta',
    ],
  });

  console.log('Simulation Results:');
  console.log('───────────────────────────────────────────────────');
  console.log(`  Farmers served:          ${result.farmersServed.toLocaleString()}`);
  console.log(`  Bags delivered:          ${result.totalBagsDelivered.toLocaleString()}`);
  console.log(`  Total weight:            ${(result.totalWeightKg / 1000).toFixed(1)} MT`);
  console.log(`  CRDN issued:             GH¢${result.crdnIssued.toLocaleString()}`);
  console.log(`  CRDN converted:          GH¢${result.crdnConverted.toLocaleString()}`);
  console.log(`  GBDC minted:             GH¢${result.gbdcMinted.toLocaleString()}`);
  console.log(`  MoMo settlements:        ${result.momoSettlements}`);
  console.log(`  Avg settlement time:     ${result.averageSettlementTimeMs.toFixed(2)}ms`);
  console.log(`  Multiplier effect:       ${result.multiplierEffect.toFixed(2)}×`);
  console.log('───────────────────────────────────────────────────\n');
}

main().catch(console.error);
