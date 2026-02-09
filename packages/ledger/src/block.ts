/**
 * GOVRES — Ledger Block
 * 
 * Implements the permissioned ledger block structure.
 * Each block contains a set of transactions, linked via cryptographic hashes
 * to form a tamper-proof chain. The ledger is operated exclusively by the
 * Bank of Ghana and authorized nodes.
 * 
 * This is NOT a public blockchain — it is a BoG-permissioned institutional
 * settlement ledger compliant with Bank of Ghana Act 612.
 */

import crypto from 'crypto';
import { SYSTEM } from '@govres/shared';

export interface BlockHeader {
  blockHeight: number;
  previousHash: string;
  timestamp: Date;
  merkleRoot: string;
  transactionCount: number;
  validatorId: string;          // BoG node that validated this block
  validatorSignature: string;   // Digital signature of the validator
  nonce: number;
}

export interface LedgerBlock {
  header: BlockHeader;
  transactions: BlockTransaction[];
  hash: string;
}

export interface BlockTransaction {
  txId: string;
  type: 'MINT' | 'TRANSFER' | 'REDEEM' | 'CONVERT' | 'SETTLE' | 'BURN';
  instrumentType: 'GBDC' | 'CRDN';
  instrumentId: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  timestamp: Date;
  data: Record<string, unknown>;
  signature: string;
}

/**
 * Computes the SHA-256 hash of a block header
 */
export function computeBlockHash(header: BlockHeader): string {
  const data = JSON.stringify({
    blockHeight: header.blockHeight,
    previousHash: header.previousHash,
    timestamp: header.timestamp.toISOString(),
    merkleRoot: header.merkleRoot,
    transactionCount: header.transactionCount,
    validatorId: header.validatorId,
    nonce: header.nonce,
  });
  return crypto.createHash(SYSTEM.HASH_ALGORITHM).update(data).digest('hex');
}

/**
 * Computes the Merkle root of a set of transactions
 */
export function computeMerkleRoot(transactions: BlockTransaction[]): string {
  if (transactions.length === 0) {
    return crypto.createHash(SYSTEM.HASH_ALGORITHM).update('empty').digest('hex');
  }

  let hashes = transactions.map(tx =>
    crypto.createHash(SYSTEM.HASH_ALGORITHM).update(tx.txId + tx.signature).digest('hex')
  );

  while (hashes.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = i + 1 < hashes.length ? hashes[i + 1] : left;
      nextLevel.push(
        crypto.createHash(SYSTEM.HASH_ALGORITHM).update(left + right).digest('hex')
      );
    }
    hashes = nextLevel;
  }

  return hashes[0];
}

/**
 * Validates a block's integrity
 */
export function validateBlock(block: LedgerBlock, previousBlock?: LedgerBlock): boolean {
  // 1. Verify block hash
  const computedHash = computeBlockHash(block.header);
  if (computedHash !== block.hash) {
    return false;
  }

  // 2. Verify chain linkage
  if (previousBlock && block.header.previousHash !== previousBlock.hash) {
    return false;
  }

  // 3. Verify Merkle root
  const computedMerkle = computeMerkleRoot(block.transactions);
  if (computedMerkle !== block.header.merkleRoot) {
    return false;
  }

  // 4. Verify transaction count
  if (block.header.transactionCount !== block.transactions.length) {
    return false;
  }

  // 5. Verify block height sequence
  if (previousBlock && block.header.blockHeight !== previousBlock.header.blockHeight + 1) {
    return false;
  }

  // 6. Verify max transactions per block
  if (block.transactions.length > SYSTEM.MAX_TX_PER_BLOCK) {
    return false;
  }

  return true;
}

/**
 * Creates a new genesis block for the GOVRES ledger
 */
export function createGenesisBlock(validatorId: string): LedgerBlock {
  const header: BlockHeader = {
    blockHeight: 0,
    previousHash: '0'.repeat(64),
    timestamp: new Date(),
    merkleRoot: computeMerkleRoot([]),
    transactionCount: 0,
    validatorId,
    validatorSignature: '',
    nonce: 0,
  };

  const hash = computeBlockHash(header);

  return {
    header,
    transactions: [],
    hash,
  };
}
