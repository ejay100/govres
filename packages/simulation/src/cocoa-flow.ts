/**
 * GOVRES — Cocoa Flow Simulation
 * Simulates: Farmer delivery → CRDN issuance → CRDN conversion → GBDC → MoMo cashout
 * Uses the real LedgerEngine and CocoaWarehouseOracle APIs.
 */

import { LedgerEngine } from '@govres/ledger';
import { CocoaWarehouseOracle } from '@govres/oracle';
import { UserRole } from '@govres/shared';

interface SimulationResult {
  farmersServed: number;
  totalBagsDelivered: number;
  totalWeightKg: number;
  crdnIssuedCedi: number;
  crdnConverted: number;
  momoSettlements: number;
  averageSettlementTimeMs: number;
}

const STANDARD_BAG_KG = 64;
const PRODUCER_PRICE_PER_KG = 2_070 / STANDARD_BAG_KG;

export async function simulateCocoaSeason(options: {
  farmerCount: number;
  avgBagsPerFarmer: number;
  conversionRate: number;
  momoRate: number;
  regions: string[];
}): Promise<SimulationResult> {
  const ledger = new LedgerEngine('sim-validator-001');
  ledger.initialize();

  const oracle = new CocoaWarehouseOracle(PRODUCER_PRICE_PER_KG);

  const startTime = Date.now();

  // BoG accounts auto-registered by initialize()
  ledger.registerAccount('lbc-sim-001', UserRole.LBC);
  ledger.registerGoldReserve(100_000, 'sim-gold-attest-001');

  let totalBags = 0;
  let totalCRDN = 0;
  let totalConverted = 0;
  let momoSettlements = 0;

  for (let f = 0; f < options.farmerCount; f++) {
    const farmerId = `farmer-sim-${String(f).padStart(5, '0')}`;
    const region = options.regions[f % options.regions.length];

    try { ledger.registerAccount(farmerId, UserRole.FARMER); } catch { /* exists */ }

    const bags = Math.max(1, Math.round(
      options.avgBagsPerFarmer + (Math.random() - 0.5) * options.avgBagsPerFarmer * 0.6
    ));
    const weightKg = bags * STANDARD_BAG_KG;
    totalBags += bags;

    // Oracle records farm-gate delivery
    oracle.recordDelivery({
      deliveryId: `del-${farmerId}`,
      farmerId,
      farmerName: `Farmer ${f + 1}`,
      farmerPhone: '024000' + String(f).padStart(4, '0'),
      lbcId: 'lbc-sim-001',
      lbcName: 'Simulation LBC',
      purchaseClerkId: 'clerk-001',
      region: region as any,
      district: `${region} District`,
      community: `${region} Community`,
      bagsCount: bags,
      weightKg,
      qualityGrade: 'GRADE_1',
      moistureContent: 7.0 + Math.random() * 1.5,
      beanCount: 95 + Math.round(Math.random() * 10),
      deliveryDate: new Date(),
      gpsCoordinates: { lat: 6.0 + Math.random() * 2, lng: -2.0 + Math.random() * 1.5 },
      seasonYear: '2024/2025',
      clerkSignature: `sig-clerk-${f}`,
      farmerThumbprint: `bio-${farmerId}`,
    });

    // Register cocoa reserve and issue CRDN
    const crdnValue = weightKg * PRODUCER_PRICE_PER_KG;
    totalCRDN += crdnValue;

    ledger.registerCocoaReserve(weightKg, `cocoa-attest-${farmerId}`);

    const crdnId = ledger.issueCRDN({
      farmerId,
      lbcId: 'lbc-sim-001',
      cocoaWeightKg: weightKg,
      pricePerKgGHS: PRODUCER_PRICE_PER_KG,
      warehouseReceiptId: `receipt-${farmerId}`,
      seasonYear: '2024/2025',
      attestationHash: `hash-${farmerId}`,
    });

    // Farmer converts CRDN → GBDC
    if (Math.random() < options.conversionRate) {
      ledger.convertCRDN({
        instrumentId: crdnId,
        farmerId,
        targetInstrument: 'GBDC',
      });
      totalConverted += crdnValue;

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
    crdnIssuedCedi: totalCRDN,
    crdnConverted: totalConverted,
    momoSettlements,
    averageSettlementTimeMs: elapsedMs / options.farmerCount,
  };
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  GOVRES — Cocoa Season Flow Simulation');
  console.log('═══════════════════════════════════════════════════\n');

  const result = await simulateCocoaSeason({
    farmerCount: 500,
    avgBagsPerFarmer: 15,
    conversionRate: 0.75,
    momoRate: 0.65,
    regions: ['Ashanti', 'Western', 'Eastern', 'Brong-Ahafo', 'Central', 'Volta'],
  });

  console.log('Simulation Results:');
  console.log('───────────────────────────────────────────────────');
  console.log(`  Farmers served:          ${result.farmersServed.toLocaleString()}`);
  console.log(`  Bags delivered:          ${result.totalBagsDelivered.toLocaleString()}`);
  console.log(`  Total weight:            ${(result.totalWeightKg / 1000).toFixed(1)} MT`);
  console.log(`  CRDN issued:             GH¢${result.crdnIssuedCedi.toLocaleString()}`);
  console.log(`  CRDN converted:          GH¢${result.crdnConverted.toLocaleString()}`);
  console.log(`  MoMo settlements:        ${result.momoSettlements}`);
  console.log(`  Avg settlement time:     ${result.averageSettlementTimeMs.toFixed(2)}ms`);
  console.log('───────────────────────────────────────────────────\n');
}

main().catch(console.error);
