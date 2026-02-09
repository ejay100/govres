/**
 * GOVRES — Stress Test
 * High-volume transaction throughput testing, block generation under load,
 * concurrent GBDC/CRDN operations
 */

import { LedgerEngine } from '@govres/ledger';
import { UserRole } from '@govres/shared';

interface StressTestResult {
  totalTransactions: number;
  blocksGenerated: number;
  transactionsPerSecond: number;
  averageBlockTimeMs: number;
  peakPendingTxCount: number;
  errors: number;
  elapsedMs: number;
}

export async function runStressTest(options: {
  transactionCount: number;
  concurrentBatches: number;
  batchSize: number;
}): Promise<StressTestResult> {
  const ledger = new LedgerEngine();
  await ledger.initialize();

  // Seed reserves
  ledger.registerAccount({
    accountId: 'bog-stress',
    organizationId: 'bog',
    role: UserRole.BOG_ADMIN,
    label: 'BoG Stress Test',
  });

  ledger.registerGoldReserve({
    barId: 'stress-gold',
    weightGrams: 10_000_000, // 10 tonnes
    purity: 0.999,
    attestationId: 'stress-attest',
  });

  // Register test accounts
  const accountCount = Math.min(options.concurrentBatches * 10, 1000);
  for (let i = 0; i < accountCount; i++) {
    ledger.registerAccount({
      accountId: `stress-acct-${i}`,
      organizationId: `org-${i % 20}`,
      role: i % 3 === 0 ? UserRole.BANK_ADMIN : i % 3 === 1 ? UserRole.FARMER : UserRole.CONTRACTOR,
      label: `Stress Account ${i}`,
    });
  }

  const startTime = Date.now();
  let txCount = 0;
  let errorCount = 0;
  let peakPending = 0;
  const blockHeights: number[] = [];

  // Capture block events
  ledger.on('blockGenerated', (block: any) => {
    blockHeights.push(block.header.height);
  });

  // Run transaction batches
  for (let batch = 0; batch < Math.ceil(options.transactionCount / options.batchSize); batch++) {
    const batchPromises: Promise<void>[] = [];

    for (let i = 0; i < options.batchSize && txCount < options.transactionCount; i++) {
      txCount++;

      const operation = txCount % 4;
      try {
        switch (operation) {
          case 0: {
            // Mint GBDC
            const amount = Math.round(1000 + Math.random() * 99_000);
            ledger.mintGBDC({
              amount,
              authorizedBy: 'bog-stress',
              purpose: `Stress test mint #${txCount}`,
            });
            break;
          }
          case 1: {
            // Register cocoa and issue CRDN
            const farmerId = `stress-acct-${txCount % accountCount}`;
            const bags = Math.round(1 + Math.random() * 20);
            ledger.registerCocoaReserve({
              receiptId: `stress-crdn-${txCount}`,
              weightKg: bags * 64,
              grade: 'Grade I',
              attestationId: `stress-cocoa-attest-${txCount}`,
            });
            ledger.issueCRDN({
              farmerId,
              receiptId: `stress-crdn-${txCount}`,
              bags,
              weightKg: bags * 64,
              grade: 'Grade I',
              region: 'Ashanti',
              producerPricePerBag: 2070,
            });
            break;
          }
          case 2: {
            // Additional gold reserve registration
            ledger.registerGoldReserve({
              barId: `stress-bar-${txCount}`,
              weightGrams: Math.round(100 + Math.random() * 900),
              purity: 0.995 + Math.random() * 0.004,
              attestationId: `stress-gold-attest-${txCount}`,
            });
            break;
          }
          case 3: {
            // Mint and transfer
            const amt = Math.round(500 + Math.random() * 5000);
            const gbdc = ledger.mintGBDC({
              amount: amt,
              authorizedBy: 'bog-stress',
              purpose: `Stress transfer #${txCount}`,
            });
            const targetAcct = `stress-acct-${txCount % accountCount}`;
            ledger.transferGBDC(gbdc.instrumentId, 'bog-stress', targetAcct);
            break;
          }
        }
      } catch (err) {
        errorCount++;
      }
    }

    // Track pending tx peak
    const summary = ledger.getReserveSummary();
    // Simple proxy for pending count
    peakPending = Math.max(peakPending, txCount - blockHeights.length * 100);
  }

  const elapsedMs = Date.now() - startTime;

  return {
    totalTransactions: txCount,
    blocksGenerated: blockHeights.length,
    transactionsPerSecond: txCount / (elapsedMs / 1000),
    averageBlockTimeMs: blockHeights.length > 0 ? elapsedMs / blockHeights.length : 0,
    peakPendingTxCount: Math.max(0, peakPending),
    errors: errorCount,
    elapsedMs,
  };
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  GOVRES — Stress Test');
  console.log('═══════════════════════════════════════════════════\n');

  const configs = [
    { label: 'Light Load',  transactionCount: 100,   concurrentBatches: 5,  batchSize: 20 },
    { label: 'Medium Load', transactionCount: 1_000,  concurrentBatches: 10, batchSize: 50 },
    { label: 'Heavy Load',  transactionCount: 5_000,  concurrentBatches: 20, batchSize: 100 },
  ];

  for (const config of configs) {
    console.log(`\n--- ${config.label} (${config.transactionCount} txns) ---`);

    const result = await runStressTest(config);

    console.log(`  Transactions:    ${result.totalTransactions.toLocaleString()}`);
    console.log(`  TPS:             ${result.transactionsPerSecond.toFixed(0)}`);
    console.log(`  Blocks:          ${result.blocksGenerated}`);
    console.log(`  Errors:          ${result.errors}`);
    console.log(`  Elapsed:         ${result.elapsedMs}ms`);
  }

  console.log('\n═══════════════════════════════════════════════════\n');
}

main().catch(console.error);
