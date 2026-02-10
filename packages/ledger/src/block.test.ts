/**
 * GOVRES — Ledger Block Tests
 * Tests for block.ts: hashing, merkle trees, validation, genesis block
 */

import { describe, it, expect } from 'vitest';
import {
  computeBlockHash,
  computeMerkleRoot,
  validateBlock,
  createGenesisBlock,
  BlockTransaction,
  BlockHeader,
  LedgerBlock,
} from './block';

// ─── Helpers ────────────────────────────────────────────

function makeTx(partial: Partial<BlockTransaction> = {}): BlockTransaction {
  return {
    txId: partial.txId ?? 'TX-001',
    type: partial.type ?? 'MINT',
    instrumentType: partial.instrumentType ?? 'GBDC',
    instrumentId: partial.instrumentId ?? 'GBDC-001',
    fromAccount: partial.fromAccount ?? 'BOG_TREASURY',
    toAccount: partial.toAccount ?? 'ACC-001',
    amount: partial.amount ?? 10_000,
    timestamp: partial.timestamp ?? new Date('2025-01-01'),
    data: partial.data ?? {},
    signature: partial.signature ?? 'sig-001',
  };
}

function makeBlock(height: number, prevHash: string, txs: BlockTransaction[] = []): LedgerBlock {
  const header: BlockHeader = {
    blockHeight: height,
    previousHash: prevHash,
    timestamp: new Date('2025-01-01'),
    merkleRoot: computeMerkleRoot(txs),
    transactionCount: txs.length,
    validatorId: 'BOG-NODE-1',
    validatorSignature: '',
    nonce: 0,
  };
  return { header, transactions: txs, hash: computeBlockHash(header) };
}

// ─── computeBlockHash ───────────────────────────────────

describe('computeBlockHash', () => {
  it('returns a 64-character hex string (SHA-256)', () => {
    const header: BlockHeader = {
      blockHeight: 0,
      previousHash: '0'.repeat(64),
      timestamp: new Date('2025-01-01'),
      merkleRoot: 'abc',
      transactionCount: 0,
      validatorId: 'V1',
      validatorSignature: '',
      nonce: 0,
    };
    const hash = computeBlockHash(header);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic — same input produces same hash', () => {
    const header: BlockHeader = {
      blockHeight: 1,
      previousHash: 'aaa',
      timestamp: new Date('2025-06-01T12:00:00Z'),
      merkleRoot: 'mrk',
      transactionCount: 2,
      validatorId: 'V2',
      validatorSignature: 'sig',
      nonce: 42,
    };
    expect(computeBlockHash(header)).toBe(computeBlockHash(header));
  });

  it('changes when any header field changes', () => {
    const a: BlockHeader = {
      blockHeight: 1,
      previousHash: 'x',
      timestamp: new Date('2025-01-01'),
      merkleRoot: 'm',
      transactionCount: 0,
      validatorId: 'V1',
      validatorSignature: '',
      nonce: 0,
    };
    const b = { ...a, nonce: 1 };
    expect(computeBlockHash(a)).not.toBe(computeBlockHash(b));
  });
});

// ─── computeMerkleRoot ──────────────────────────────────

describe('computeMerkleRoot', () => {
  it('returns a 64-char hex for empty transactions', () => {
    const root = computeMerkleRoot([]);
    expect(root).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns deterministic root for single transaction', () => {
    const tx = makeTx();
    expect(computeMerkleRoot([tx])).toBe(computeMerkleRoot([tx]));
  });

  it('varies when transaction content changes', () => {
    const a = makeTx({ txId: 'TX-A', signature: 'sig-a' });
    const b = makeTx({ txId: 'TX-B', signature: 'sig-b' });
    expect(computeMerkleRoot([a])).not.toBe(computeMerkleRoot([b]));
  });

  it('handles two transactions (binary tree)', () => {
    const txs = [makeTx({ txId: 'TX-1' }), makeTx({ txId: 'TX-2' })];
    const root = computeMerkleRoot(txs);
    expect(root).toMatch(/^[a-f0-9]{64}$/);
  });

  it('handles odd number of transactions', () => {
    const txs = [makeTx({ txId: '1' }), makeTx({ txId: '2' }), makeTx({ txId: '3' })];
    const root = computeMerkleRoot(txs);
    expect(root).toMatch(/^[a-f0-9]{64}$/);
  });
});

// ─── createGenesisBlock ─────────────────────────────────

describe('createGenesisBlock', () => {
  it('creates a block with height 0', () => {
    const genesis = createGenesisBlock('BOG-NODE-1');
    expect(genesis.header.blockHeight).toBe(0);
  });

  it('has no transactions', () => {
    const genesis = createGenesisBlock('BOG-NODE-1');
    expect(genesis.transactions).toHaveLength(0);
    expect(genesis.header.transactionCount).toBe(0);
  });

  it('has a zero-filled previousHash', () => {
    const genesis = createGenesisBlock('BOG-NODE-1');
    expect(genesis.header.previousHash).toBe('0'.repeat(64));
  });

  it('hash matches recomputed hash', () => {
    const genesis = createGenesisBlock('BOG-NODE-1');
    expect(genesis.hash).toBe(computeBlockHash(genesis.header));
  });

  it('sets the correct validatorId', () => {
    const genesis = createGenesisBlock('MY-VALIDATOR');
    expect(genesis.header.validatorId).toBe('MY-VALIDATOR');
  });
});

// ─── validateBlock ──────────────────────────────────────

describe('validateBlock', () => {
  it('validates GeneSIS block without predecessor', () => {
    const genesis = createGenesisBlock('BOG');
    expect(validateBlock(genesis)).toBe(true);
  });

  it('validates a normal block with valid predecessor', () => {
    const genesis = createGenesisBlock('BOG');
    const tx = makeTx();
    const block1 = makeBlock(1, genesis.hash, [tx]);
    expect(validateBlock(block1, genesis)).toBe(true);
  });

  it('fails when hash is tampered', () => {
    const genesis = createGenesisBlock('BOG');
    const tampered = { ...genesis, hash: 'bad' + genesis.hash.slice(3) };
    expect(validateBlock(tampered)).toBe(false);
  });

  it('fails when chain linkage is broken', () => {
    const genesis = createGenesisBlock('BOG');
    const block1 = makeBlock(1, 'wrong-previous-hash', []);
    expect(validateBlock(block1, genesis)).toBe(false);
  });

  it('fails when transaction count does not match', () => {
    const genesis = createGenesisBlock('BOG');
    const block: LedgerBlock = {
      ...makeBlock(1, genesis.hash, [makeTx()]),
    };
    block.header.transactionCount = 99; // lie
    block.hash = computeBlockHash(block.header);
    expect(validateBlock(block, genesis)).toBe(false);
  });

  it('fails when block height is not sequential', () => {
    const genesis = createGenesisBlock('BOG');
    const block = makeBlock(5, genesis.hash, []);
    expect(validateBlock(block, genesis)).toBe(false);
  });
});
