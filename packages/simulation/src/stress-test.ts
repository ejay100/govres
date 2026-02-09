/**
 * GOVRES — Stress Test
 * High-volume transaction throughput testing for the ledger engine.
 * Uses real LedgerEngine API signatures.
 */

import { LedgerEngine } from '@govres/ledger';
import { UserRole } from '@govres/shared';

interface StressTestResult {
  totalTransactions: number;
  transactionsPerSecond: number;
  errors: number;
  elapsedMs: number;
}

export async function runStressTest(options: {
  transactionCount: number;
  concurrentBatches: number;
  batchSize: number;
}): Promise<StressTestResult> {
  const ledger = new LedgerEngine('stress-validator');
  ledger.initialize();

  // Seed massive gold reserve for GBDC minting
  ledger.registerGoldReserve(10_000_000, 'stress-gold-attest');

  // Register LBC for CRDN operations
  ledger.registerAccount('lbc-stress', UserRole.LBC);

  // Register test accounts
  const accountCount = Math.min(options.concurrentBatches * 10, 1000);
  for (let i = 0; i < accountCount; i++) {
    const role = i % 3 === 0 ? UserRole.COMMERCIAL_BANK
               : i % 3 === 1 ? UserRole.FARMER
               : UserRole.CONTRACTOR;
    try { ledger.registerAccount(`stress-acct-${i}`, role); } catch { /* exists */ }
  }

  const startTime = Date.now();
  let txCount = 0;
  let errorCount = 0;

  for (let batch = 0; batch < Math.ceil(options.transactionCount / options.batchSize); batch++) {
    for (let i = 0; i < options.batchSize && txCount < options.transactionCount; i++) {
      txCount++;
      const operation = txCount % 3;

      try {
        switch (operation) {
          case 0: {
            // Mint GBDC
            const amount = Math.round(1000 + Math.random() * 99_000);
            ledger.mintGBDC({
              amountCedi: amount,
              goldBackingGrams: amount * 0.001,
              goldPricePerGramUSD: 85,
              exchangeRateUSDGHS: 14.75,
              issuanceId: `stress-mint-${txCount}`,
              issuedBy: 'BOG_TREASURY',
            });
            break;
          }
          case 1: {
            // Register cocoa and issue CRDN
            const farmerIdx = txCount % accountCount;
            // Only issue to FARMER accounts (i % 3 === 1)
            const fIdx = farmerIdx - (farmerIdx % 3) + 1; // nearest farmer index
            const fId = `stress-acct-${fIdx}`;
            const bags = Math.round(1 + Math.random() * 20);
            const weightKg = bags * 64;
            ledger.registerCocoaReserve(weightKg, `stress-cocoa-attest-${txCount}`);
            ledger.issueCRDN({
              farmerId: fId,
              lbcId: 'lbc-stress',
              cocoaWeightKg: weightKg,
              pricePerKgGHS: 32.34,
              warehouseReceiptId: `stress-receipt-${txCount}`,
              seasonYear: '2024/2025',
              attestationHash: `stress-hash-${txCount}`,
            });
            break;
          }
          case 2: {
            // Register gold
            ledger.registerGoldReserve(
              Math.round(100 + Math.random() * 900),
              `stress-gold-attest-${txCount}`,
            );
            break;
          }
        }
      } catch {
        errorCount++;
      }
    }
  }

  const elapsedMs = Date.now() - startTime;

  return {
    totalTransactions: txCount,
    transactionsPerSecond: txCount / (elapsedMs / 1000),
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
    console.log(`  Errors:          ${result.errors}`);
    console.log(`  Elapsed:         ${result.elapsedMs}ms`);
  }

  console.log('\n═══════════════════════════════════════════════════\n');
}

main().catch(console.error);
