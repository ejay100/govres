/**
 * GOVRES — Simulation Entry Point
 * Runs all simulation scenarios and produces a combined report
 */

import { simulateCocoaSeason } from './cocoa-flow';
import { simulateContractorPayments } from './contractor-flow';
import { runStressTest } from './stress-test';

async function main() {
  console.log('\n╔═════════════════════════════════════════════════════════╗');
  console.log('║         GOVRES — Full System Simulation Suite           ║');
  console.log('║   Government Reserve & Settlement Ledger — Ghana        ║');
  console.log('╚═════════════════════════════════════════════════════════╝\n');

  // 1. Cocoa Season Simulation
  console.log('━━━ 1. Cocoa Season Flow ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const cocoaResult = await simulateCocoaSeason({
    farmerCount: 200,
    avgBagsPerFarmer: 12,
    conversionRate: 0.70,
    momoRate: 0.60,
    regions: ['Ashanti', 'Western', 'Eastern', 'Brong-Ahafo', 'Central', 'Volta'],
  });

  console.log(`  Farmers:       ${cocoaResult.farmersServed}`);
  console.log(`  Bags:          ${cocoaResult.totalBagsDelivered.toLocaleString()}`);
  console.log(`  CRDN issued:   GH¢${cocoaResult.crdnIssued.toLocaleString()}`);
  console.log(`  GBDC minted:   GH¢${cocoaResult.gbdcMinted.toLocaleString()}`);
  console.log(`  MoMo payouts:  ${cocoaResult.momoSettlements}`);
  console.log(`  Multiplier:    ${cocoaResult.multiplierEffect.toFixed(2)}×`);

  // 2. Contractor Payment Simulation
  console.log('\n━━━ 2. Contractor Payment Flow ━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const contractorResult = await simulateContractorPayments({
    milestoneCompletionRate: 0.65,
  });

  console.log(`  Projects:      ${contractorResult.projectsProcessed}`);
  console.log(`  Disbursed:     GH¢${contractorResult.totalDisbursed.toLocaleString()}`);
  console.log(`  Milestones:    ${contractorResult.milestonesCompleted}/${contractorResult.totalMilestones}`);
  console.log(`  GBDC turnover: GH¢${contractorResult.gbdcTurnover.toLocaleString()}`);

  // 3. Stress Test
  console.log('\n━━━ 3. Ledger Stress Test ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const stressResult = await runStressTest({
    transactionCount: 1_000,
    concurrentBatches: 10,
    batchSize: 50,
  });

  console.log(`  Transactions:  ${stressResult.totalTransactions.toLocaleString()}`);
  console.log(`  TPS:           ${stressResult.transactionsPerSecond.toFixed(0)}`);
  console.log(`  Errors:        ${stressResult.errors}`);
  console.log(`  Elapsed:       ${stressResult.elapsedMs}ms`);

  // Combined Metrics
  console.log('\n╔═════════════════════════════════════════════════════════╗');
  console.log('║                  Combined Metrics                       ║');
  console.log('╠═════════════════════════════════════════════════════════╣');
  const totalGBDC = cocoaResult.gbdcMinted + contractorResult.gbdcTurnover;
  console.log(`║  Total GBDC turnover:    GH¢${totalGBDC.toLocaleString().padEnd(22)}║`);
  console.log(`║  Total CRDN issued:      GH¢${cocoaResult.crdnIssued.toLocaleString().padEnd(22)}║`);
  console.log(`║  Settlements processed:  ${(cocoaResult.momoSettlements + contractorResult.bankSettlements).toString().padEnd(25)}║`);
  console.log(`║  Ledger TPS capacity:    ${stressResult.transactionsPerSecond.toFixed(0).padEnd(25)}║`);
  console.log('╚═════════════════════════════════════════════════════════╝\n');
}

main().catch(console.error);
