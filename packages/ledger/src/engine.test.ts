/**
 * GOVRES — Ledger Engine Tests
 * Full coverage for the core permissioned ledger engine
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LedgerEngine } from './engine';
import { UserRole, FINANCIAL } from '@govres/shared';

let engine: LedgerEngine;

beforeEach(() => {
  engine = new LedgerEngine('BOG-NODE-TEST');
  engine.initialize();
});

afterEach(() => {
  engine.stopBlockGeneration();
});

// ─── Initialization ─────────────────────────────────────

describe('LedgerEngine initialization', () => {
  it('creates genesis block at height 0', () => {
    expect(engine.getChainHeight()).toBe(0);
  });

  it('registers BOG_TREASURY and BOG_RESERVE accounts', () => {
    expect(engine.getAccountBalance('BOG_TREASURY')).toBeDefined();
    expect(engine.getAccountBalance('BOG_RESERVE')).toBeDefined();
  });

  it('genesis block has no transactions', () => {
    const genesis = engine.getBlock(0);
    expect(genesis).toBeDefined();
    expect(genesis!.transactions).toHaveLength(0);
  });

  it('latestBlock returns genesis', () => {
    const latest = engine.getLatestBlock();
    expect(latest.header.blockHeight).toBe(0);
  });
});

// ─── Account Management ─────────────────────────────────

describe('registerAccount', () => {
  it('registers a new account', () => {
    engine.registerAccount('FARMER-001', UserRole.FARMER);
    const acct = engine.getAccountBalance('FARMER-001');
    expect(acct).toBeDefined();
    expect(acct!.role).toBe(UserRole.FARMER);
    expect(acct!.gbdcBalance).toBe(0);
    expect(acct!.crdnBalance).toBe(0);
    expect(acct!.isActive).toBe(true);
  });

  it('throws on duplicate account', () => {
    engine.registerAccount('DUP', UserRole.FARMER);
    expect(() => engine.registerAccount('DUP', UserRole.FARMER)).toThrow('already exists');
  });

  it('registers multiple roles', () => {
    engine.registerAccount('BANK-001', UserRole.COMMERCIAL_BANK);
    engine.registerAccount('LBC-001', UserRole.LBC);
    expect(engine.getAccountBalance('BANK-001')!.role).toBe(UserRole.COMMERCIAL_BANK);
    expect(engine.getAccountBalance('LBC-001')!.role).toBe(UserRole.LBC);
  });
});

// ─── Gold / Cocoa Reserve Registration ──────────────────

describe('registerGoldReserve', () => {
  it('adds gold to reserves', () => {
    engine.registerGoldReserve(50_000, 'hash-001');
    const summary = engine.getReserveSummary();
    expect(summary.goldReserveGrams).toBe(50_000);
  });

  it('accumulates gold reserves', () => {
    engine.registerGoldReserve(10_000, 'h1');
    engine.registerGoldReserve(20_000, 'h2');
    expect(engine.getReserveSummary().goldReserveGrams).toBe(30_000);
  });
});

describe('registerCocoaReserve', () => {
  it('adds cocoa to reserves', () => {
    engine.registerCocoaReserve(100_000, 'hash-c1');
    expect(engine.getReserveSummary().cocoaReserveKg).toBe(100_000);
  });
});

// ─── GBDC Minting ───────────────────────────────────────

describe('mintGBDC', () => {
  beforeEach(() => {
    // Register enough gold: 10% of 1,000,000g = 100,000g backing capacity
    engine.registerGoldReserve(1_000_000, 'gold-hash');
  });

  it('mints GBDC and returns instrumentId', () => {
    const id = engine.mintGBDC({
      amountCedi: 10_000,
      goldBackingGrams: 500,
      goldPricePerGramUSD: 80,
      exchangeRateUSDGHS: 15,
      issuanceId: 'ISS-001',
      issuedBy: 'BOG_TREASURY',
    });
    expect(id).toContain('GBDC-');
  });

  it('credits BOG_TREASURY balance', () => {
    engine.mintGBDC({
      amountCedi: 50_000,
      goldBackingGrams: 1_000,
      goldPricePerGramUSD: 80,
      exchangeRateUSDGHS: 15,
      issuanceId: 'ISS-002',
      issuedBy: 'BOG_TREASURY',
    });
    expect(engine.getAccountBalance('BOG_TREASURY')!.gbdcBalance).toBe(50_000);
  });

  it('creates GBDC record in registry', () => {
    const id = engine.mintGBDC({
      amountCedi: 10_000,
      goldBackingGrams: 500,
      goldPricePerGramUSD: 80,
      exchangeRateUSDGHS: 15,
      issuanceId: 'ISS-003',
      issuedBy: 'BOG_TREASURY',
    });
    const record = engine.getGBDCRecord(id);
    expect(record).toBeDefined();
    expect(record!.amountCedi).toBe(10_000);
    expect(record!.holder).toBe('BOG_TREASURY');
  });

  it('rejects minting by non-BoG accounts', () => {
    engine.registerAccount('BANK-X', UserRole.COMMERCIAL_BANK);
    expect(() =>
      engine.mintGBDC({
        amountCedi: 10_000,
        goldBackingGrams: 100,
        goldPricePerGramUSD: 80,
        exchangeRateUSDGHS: 15,
        issuanceId: 'ISS-bad',
        issuedBy: 'BANK-X',
      })
    ).toThrow();
  });

  it('rejects when gold reserve backing is insufficient', () => {
    // Max backing = 1,000,000 * 0.10 = 100,000 grams
    expect(() =>
      engine.mintGBDC({
        amountCedi: 10_000_000,
        goldBackingGrams: 200_000, // exceeds 100,000
        goldPricePerGramUSD: 80,
        exchangeRateUSDGHS: 15,
        issuanceId: 'ISS-over',
        issuedBy: 'BOG_TREASURY',
      })
    ).toThrow(/reserve/i);
  });

  it('rejects amounts below MIN_GBDC_ISSUANCE_CEDI', () => {
    expect(() =>
      engine.mintGBDC({
        amountCedi: 1, // below 1000
        goldBackingGrams: 1,
        goldPricePerGramUSD: 80,
        exchangeRateUSDGHS: 15,
        issuanceId: 'ISS-small',
        issuedBy: 'BOG_TREASURY',
      })
    ).toThrow();
  });

  it('tracks total GBDC outstanding', () => {
    engine.mintGBDC({ amountCedi: 5_000, goldBackingGrams: 100, goldPricePerGramUSD: 80, exchangeRateUSDGHS: 15, issuanceId: 'A', issuedBy: 'BOG_TREASURY' });
    engine.mintGBDC({ amountCedi: 3_000, goldBackingGrams: 100, goldPricePerGramUSD: 80, exchangeRateUSDGHS: 15, issuanceId: 'B', issuedBy: 'BOG_TREASURY' });
    expect(engine.getTotalGBDCOutstanding()).toBe(8_000);
  });
});

// ─── GBDC Transfer ──────────────────────────────────────

describe('transferGBDC', () => {
  let gbdcId: string;

  beforeEach(() => {
    engine.registerGoldReserve(1_000_000, 'h');
    gbdcId = engine.mintGBDC({
      amountCedi: 100_000,
      goldBackingGrams: 5_000,
      goldPricePerGramUSD: 80,
      exchangeRateUSDGHS: 15,
      issuanceId: 'ISS-T1',
      issuedBy: 'BOG_TREASURY',
    });
    engine.registerAccount('BANK-A', UserRole.COMMERCIAL_BANK);
  });

  it('transfers GBDC between accounts', () => {
    const txId = engine.transferGBDC({
      instrumentId: gbdcId,
      fromAccount: 'BOG_TREASURY',
      toAccount: 'BANK-A',
      amountCedi: 50_000,
      description: 'Settlement',
    });
    expect(txId).toBeDefined();
    expect(engine.getAccountBalance('BOG_TREASURY')!.gbdcBalance).toBe(50_000);
    expect(engine.getAccountBalance('BANK-A')!.gbdcBalance).toBe(50_000);
  });

  it('throws on insufficient balance', () => {
    expect(() =>
      engine.transferGBDC({
        instrumentId: gbdcId,
        fromAccount: 'BOG_TREASURY',
        toAccount: 'BANK-A',
        amountCedi: 999_999,
        description: 'Over-transfer',
      })
    ).toThrow();
  });

  it('throws for invalid accounts', () => {
    expect(() =>
      engine.transferGBDC({
        instrumentId: gbdcId,
        fromAccount: 'BOG_TREASURY',
        toAccount: 'NONEXISTENT',
        amountCedi: 1_000,
        description: 'Bad',
      })
    ).toThrow();
  });
});

// ─── GBDC Redemption ────────────────────────────────────

describe('redeemGBDC', () => {
  let gbdcId: string;

  beforeEach(() => {
    engine.registerGoldReserve(1_000_000, 'h');
    engine.registerAccount('GCB-BANK', UserRole.COMMERCIAL_BANK);
    gbdcId = engine.mintGBDC({
      amountCedi: 50_000,
      goldBackingGrams: 2_000,
      goldPricePerGramUSD: 80,
      exchangeRateUSDGHS: 15,
      issuanceId: 'ISS-R1',
      issuedBy: 'BOG_TREASURY',
    });
    // Transfer to bank first
    engine.transferGBDC({
      instrumentId: gbdcId,
      fromAccount: 'BOG_TREASURY',
      toAccount: 'GCB-BANK',
      amountCedi: 50_000,
      description: 'Fund bank',
    });
  });

  it('redeems GBDC for a bank', () => {
    const txId = engine.redeemGBDC({
      instrumentId: gbdcId,
      holderAccount: 'GCB-BANK',
      amountCedi: 50_000,
    });
    expect(txId).toBeDefined();
    expect(engine.getAccountBalance('GCB-BANK')!.gbdcBalance).toBe(0);
  });

  it('rejects redemption by non-bank', () => {
    engine.registerAccount('FARMER-X', UserRole.FARMER);
    expect(() =>
      engine.redeemGBDC({
        instrumentId: gbdcId,
        holderAccount: 'FARMER-X',
        amountCedi: 1_000,
      })
    ).toThrow();
  });
});

// ─── CRDN Issuance ──────────────────────────────────────

describe('issueCRDN', () => {
  beforeEach(() => {
    engine.registerAccount('FARMER-K1', UserRole.FARMER);
    engine.registerAccount('LBC-PBC', UserRole.LBC);
    engine.registerCocoaReserve(500_000, 'cocoa-hash');
  });

  it('issues CRDN and returns instrumentId', () => {
    const id = engine.issueCRDN({
      farmerId: 'FARMER-K1',
      lbcId: 'LBC-PBC',
      cocoaWeightKg: 640,
      pricePerKgGHS: 50,
      warehouseReceiptId: 'WR-001',
      seasonYear: '2025',
      attestationHash: 'attest-001',
    });
    expect(id).toContain('CRDN-');
  });

  it('credits farmer with CRDN balance', () => {
    engine.issueCRDN({
      farmerId: 'FARMER-K1',
      lbcId: 'LBC-PBC',
      cocoaWeightKg: 640,
      pricePerKgGHS: 50,
      warehouseReceiptId: 'WR-002',
      seasonYear: '2025',
      attestationHash: 'attest-002',
    });
    expect(engine.getAccountBalance('FARMER-K1')!.crdnBalance).toBe(32_000); // 640*50
  });

  it('rejects invalid farmer account', () => {
    engine.registerAccount('NOT-FARMER', UserRole.COMMERCIAL_BANK);
    expect(() =>
      engine.issueCRDN({
        farmerId: 'NOT-FARMER',
        lbcId: 'LBC-PBC',
        cocoaWeightKg: 100,
        pricePerKgGHS: 50,
        warehouseReceiptId: 'WR-X',
        seasonYear: '2025',
        attestationHash: 'h',
      })
    ).toThrow();
  });

  it('rejects invalid LBC account', () => {
    expect(() =>
      engine.issueCRDN({
        farmerId: 'FARMER-K1',
        lbcId: 'BOG_TREASURY', // not an LBC
        cocoaWeightKg: 100,
        pricePerKgGHS: 50,
        warehouseReceiptId: 'WR-X',
        seasonYear: '2025',
        attestationHash: 'h',
      })
    ).toThrow();
  });

  it('rejects CRDN below minimum value', () => {
    // MIN_CRDN_VALUE_CEDI = 10, so 0.1 kg * 50 = 5 GHS < 10
    expect(() =>
      engine.issueCRDN({
        farmerId: 'FARMER-K1',
        lbcId: 'LBC-PBC',
        cocoaWeightKg: 0.1,
        pricePerKgGHS: 50,
        warehouseReceiptId: 'WR-tiny',
        seasonYear: '2025',
        attestationHash: 'h',
      })
    ).toThrow();
  });

  it('tracks total CRDN outstanding', () => {
    engine.issueCRDN({ farmerId: 'FARMER-K1', lbcId: 'LBC-PBC', cocoaWeightKg: 100, pricePerKgGHS: 50, warehouseReceiptId: 'WR-A', seasonYear: '2025', attestationHash: 'a' });
    engine.issueCRDN({ farmerId: 'FARMER-K1', lbcId: 'LBC-PBC', cocoaWeightKg: 200, pricePerKgGHS: 50, warehouseReceiptId: 'WR-B', seasonYear: '2025', attestationHash: 'b' });
    expect(engine.getTotalCRDNOutstanding()).toBe(15_000); // (100+200)*50
  });
});

// ─── CRDN Conversion ───────────────────────────────────

describe('convertCRDN', () => {
  let crdnId: string;

  beforeEach(() => {
    engine.registerAccount('FARMER-C1', UserRole.FARMER);
    engine.registerAccount('LBC-C1', UserRole.LBC);
    engine.registerCocoaReserve(100_000, 'ch');
    crdnId = engine.issueCRDN({
      farmerId: 'FARMER-C1',
      lbcId: 'LBC-C1',
      cocoaWeightKg: 640,
      pricePerKgGHS: 50,
      warehouseReceiptId: 'WR-C1',
      seasonYear: '2025',
      attestationHash: 'ah',
    });
  });

  it('converts CRDN to GBDC and credits farmer', () => {
    const txId = engine.convertCRDN({
      instrumentId: crdnId,
      farmerId: 'FARMER-C1',
      targetInstrument: 'GBDC',
    });
    expect(txId).toBeDefined();
    expect(engine.getAccountBalance('FARMER-C1')!.crdnBalance).toBe(0);
    expect(engine.getAccountBalance('FARMER-C1')!.gbdcBalance).toBe(32_000);
  });

  it('converts CRDN to CASH', () => {
    const txId = engine.convertCRDN({
      instrumentId: crdnId,
      farmerId: 'FARMER-C1',
      targetInstrument: 'CASH',
    });
    expect(txId).toBeDefined();
    // CASH conversion does not credit GBDC
    expect(engine.getAccountBalance('FARMER-C1')!.gbdcBalance).toBe(0);
  });

  it('rejects conversion by non-holder', () => {
    engine.registerAccount('FARMER-OTHER', UserRole.FARMER);
    expect(() =>
      engine.convertCRDN({
        instrumentId: crdnId,
        farmerId: 'FARMER-OTHER',
        targetInstrument: 'GBDC',
      })
    ).toThrow();
  });

  it('rejects double conversion', () => {
    engine.convertCRDN({
      instrumentId: crdnId,
      farmerId: 'FARMER-C1',
      targetInstrument: 'GBDC',
    });
    expect(() =>
      engine.convertCRDN({
        instrumentId: crdnId,
        farmerId: 'FARMER-C1',
        targetInstrument: 'GBDC',
      })
    ).toThrow();
  });
});

// ─── Reserve Summary ────────────────────────────────────

describe('getReserveSummary', () => {
  it('returns correct summary for empty ledger', () => {
    const summary = engine.getReserveSummary();
    expect(summary.goldReserveGrams).toBe(0);
    expect(summary.cocoaReserveKg).toBe(0);
    expect(summary.totalGBDCOutstanding).toBe(0);
    expect(summary.totalCRDNOutstanding).toBe(0);
    expect(summary.chainHeight).toBe(0);
    expect(summary.accountCount).toBe(2); // BOG_TREASURY + BOG_RESERVE
  });

  it('reflects gold and GBDC after minting', () => {
    engine.registerGoldReserve(500_000, 'gh');
    engine.mintGBDC({
      amountCedi: 5_000,
      goldBackingGrams: 500,
      goldPricePerGramUSD: 80,
      exchangeRateUSDGHS: 15,
      issuanceId: 'S1',
      issuedBy: 'BOG_TREASURY',
    });
    const summary = engine.getReserveSummary();
    expect(summary.goldReserveGrams).toBe(500_000);
    expect(summary.totalGBDCOutstanding).toBe(5_000);
  });
});

// ─── Events ─────────────────────────────────────────────

describe('Event emissions', () => {
  it('emits ledger:initialized on init', () => {
    const engine2 = new LedgerEngine('BOG-2');
    let emitted = false;
    engine2.on('ledger:initialized', () => { emitted = true; });
    engine2.initialize();
    expect(emitted).toBe(true);
  });

  it('emits gbdc:minted on mint', () => {
    engine.registerGoldReserve(1_000_000, 'h');
    let data: any = null;
    engine.on('gbdc:minted', (d) => { data = d; });
    engine.mintGBDC({ amountCedi: 5_000, goldBackingGrams: 100, goldPricePerGramUSD: 80, exchangeRateUSDGHS: 15, issuanceId: 'E1', issuedBy: 'BOG_TREASURY' });
    expect(data).toBeDefined();
    expect(data.amountCedi).toBe(5_000);
  });

  it('emits account:registered on register', () => {
    let data: any = null;
    engine.on('account:registered', (d) => { data = d; });
    engine.registerAccount('ACC-EVT', UserRole.FARMER);
    expect(data).toEqual({ accountId: 'ACC-EVT', role: UserRole.FARMER });
  });
});
