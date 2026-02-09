/**
 * GOVRES — Ledger Engine
 * 
 * The core permissioned ledger that manages GBDC and CRDN lifecycle.
 * Handles minting, transfers, redemptions, and conversions.
 * 
 * Design principles:
 * - Tamper-proof: Every transaction is cryptographically chained
 * - Auditable: Full audit trail for every state change
 * - Compliant: Aligned with BoG Act 612, Payment Systems Act 987
 * - Permissioned: Only authorized BoG nodes can validate blocks
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';
import {
  InstrumentType,
  TransactionStatus,
  GBDCStatus,
  CRDNStatus,
  UserRole,
  SYSTEM,
  FINANCIAL,
  ERROR_CODES,
} from '@govres/shared';
import {
  LedgerBlock,
  BlockTransaction,
  createGenesisBlock,
  computeMerkleRoot,
  computeBlockHash,
  validateBlock,
} from './block';

// ─── Ledger State ───────────────────────────────────────────────

interface LedgerState {
  chain: LedgerBlock[];
  pendingTransactions: BlockTransaction[];
  accounts: Map<string, AccountBalance>;
  gbdcRegistry: Map<string, GBDCRecord>;
  crdnRegistry: Map<string, CRDNRecord>;
  goldReserveGrams: number;
  cocoaReserveKg: number;
}

interface AccountBalance {
  accountId: string;
  gbdcBalance: number;
  crdnBalance: number;
  role: UserRole;
  isActive: boolean;
}

interface GBDCRecord {
  instrumentId: string;
  amountCedi: number;
  goldBackingGrams: number;
  holder: string;
  status: GBDCStatus;
  mintedAt: Date;
  issuanceId: string;
}

interface CRDNRecord {
  instrumentId: string;
  amountCedi: number;
  cocoaWeightKg: number;
  holder: string;
  status: CRDNStatus;
  issuedAt: Date;
  farmerId: string;
  lbcId: string;
}

// ─── Ledger Engine ──────────────────────────────────────────────

export class LedgerEngine extends EventEmitter {
  private state: LedgerState;
  private validatorId: string;
  private blockTimer?: NodeJS.Timeout;

  constructor(validatorId: string) {
    super();
    this.validatorId = validatorId;
    this.state = {
      chain: [],
      pendingTransactions: [],
      accounts: new Map(),
      gbdcRegistry: new Map(),
      crdnRegistry: new Map(),
      goldReserveGrams: 0,
      cocoaReserveKg: 0,
    };
  }

  /**
   * Initialize the ledger with a genesis block
   */
  initialize(): void {
    const genesis = createGenesisBlock(this.validatorId);
    this.state.chain.push(genesis);
    this.emit('ledger:initialized', { blockHeight: 0, hash: genesis.hash });

    // Register the BoG system account
    this.registerAccount('BOG_TREASURY', UserRole.BOG_ADMIN);
    this.registerAccount('BOG_RESERVE', UserRole.BOG_ADMIN);
  }

  /**
   * Start automatic block generation
   */
  startBlockGeneration(): void {
    this.blockTimer = setInterval(() => {
      if (this.state.pendingTransactions.length > 0) {
        this.generateBlock();
      }
    }, SYSTEM.BLOCK_INTERVAL_MS);
  }

  /**
   * Stop block generation
   */
  stopBlockGeneration(): void {
    if (this.blockTimer) {
      clearInterval(this.blockTimer);
    }
  }

  /**
   * Register a new account on the ledger
   */
  registerAccount(accountId: string, role: UserRole): void {
    if (this.state.accounts.has(accountId)) {
      throw new Error(`Account ${accountId} already exists`);
    }
    this.state.accounts.set(accountId, {
      accountId,
      gbdcBalance: 0,
      crdnBalance: 0,
      role,
      isActive: true,
    });
    this.emit('account:registered', { accountId, role });
  }

  /**
   * Register gold reserves backing (Oracle verified)
   */
  registerGoldReserve(weightGrams: number, attestationHash: string): void {
    this.state.goldReserveGrams += weightGrams;
    this.emit('reserve:gold:updated', {
      totalGrams: this.state.goldReserveGrams,
      addedGrams: weightGrams,
      attestationHash,
    });
  }

  /**
   * Register cocoa reserves (Oracle verified)
   */
  registerCocoaReserve(weightKg: number, attestationHash: string): void {
    this.state.cocoaReserveKg += weightKg;
    this.emit('reserve:cocoa:updated', {
      totalKg: this.state.cocoaReserveKg,
      addedKg: weightKg,
      attestationHash,
    });
  }

  // ─── GBDC Operations ───────────────────────────────────────────

  /**
   * Mint GBDC against gold reserves
   * Only BoG Treasury can mint GBDC
   * 
   * Per whitepaper Section 7:
   * - BoG issues GBDC against 10% of gold reserves
   * - No sale of reserves, no unbacked printing
   */
  mintGBDC(params: {
    amountCedi: number;
    goldBackingGrams: number;
    goldPricePerGramUSD: number;
    exchangeRateUSDGHS: number;
    issuanceId: string;
    issuedBy: string;
  }): string {
    // Validate issuer is BoG
    const issuerAccount = this.state.accounts.get(params.issuedBy);
    if (!issuerAccount || issuerAccount.role !== UserRole.BOG_ADMIN) {
      throw new Error(ERROR_CODES.UNAUTHORIZED + ': Only BoG can mint GBDC');
    }

    // Validate gold reserve backing
    const maxIssuableGrams = this.state.goldReserveGrams * (FINANCIAL.GOLD_RESERVE_ALLOCATION_PERCENT / 100);
    const totalBackedGrams = this.getTotalGBDCBackingGrams();
    if (totalBackedGrams + params.goldBackingGrams > maxIssuableGrams) {
      throw new Error(ERROR_CODES.INSUFFICIENT_RESERVE + ': Insufficient gold reserve backing');
    }

    // Validate minimum issuance
    if (params.amountCedi < FINANCIAL.MIN_GBDC_ISSUANCE_CEDI) {
      throw new Error(`Minimum GBDC issuance is ${FINANCIAL.MIN_GBDC_ISSUANCE_CEDI} GHS`);
    }

    // Create instrument
    const instrumentId = this.generateInstrumentId('GBDC');
    this.state.gbdcRegistry.set(instrumentId, {
      instrumentId,
      amountCedi: params.amountCedi,
      goldBackingGrams: params.goldBackingGrams,
      holder: 'BOG_TREASURY',
      status: GBDCStatus.MINTED,
      mintedAt: new Date(),
      issuanceId: params.issuanceId,
    });

    // Credit BoG Treasury
    const treasury = this.state.accounts.get('BOG_TREASURY')!;
    treasury.gbdcBalance += params.amountCedi;

    // Create transaction
    const tx = this.createTransaction({
      type: 'MINT',
      instrumentType: 'GBDC',
      instrumentId,
      fromAccount: 'BOG_RESERVE',
      toAccount: 'BOG_TREASURY',
      amount: params.amountCedi,
      data: {
        goldBackingGrams: params.goldBackingGrams,
        goldPricePerGramUSD: params.goldPricePerGramUSD,
        exchangeRateUSDGHS: params.exchangeRateUSDGHS,
        issuanceId: params.issuanceId,
      },
    });

    this.emit('gbdc:minted', { instrumentId, amountCedi: params.amountCedi, txId: tx.txId });
    return instrumentId;
  }

  /**
   * Transfer GBDC between accounts
   * Used for government contractor payments and interbank settlement
   */
  transferGBDC(params: {
    instrumentId: string;
    fromAccount: string;
    toAccount: string;
    amountCedi: number;
    description: string;
  }): string {
    // Validate accounts
    const from = this.state.accounts.get(params.fromAccount);
    const to = this.state.accounts.get(params.toAccount);
    if (!from || !to) throw new Error('Invalid account');
    if (!from.isActive || !to.isActive) throw new Error('Account inactive');

    // Validate balance
    if (from.gbdcBalance < params.amountCedi) {
      throw new Error(ERROR_CODES.INSUFFICIENT_BALANCE);
    }

    // Update balances
    from.gbdcBalance -= params.amountCedi;
    to.gbdcBalance += params.amountCedi;

    // Update GBDC registry
    const gbdc = this.state.gbdcRegistry.get(params.instrumentId);
    if (gbdc) {
      gbdc.holder = params.toAccount;
      gbdc.status = GBDCStatus.CIRCULATING;
    }

    // Create transaction
    const tx = this.createTransaction({
      type: 'TRANSFER',
      instrumentType: 'GBDC',
      instrumentId: params.instrumentId,
      fromAccount: params.fromAccount,
      toAccount: params.toAccount,
      amount: params.amountCedi,
      data: { description: params.description },
    });

    this.emit('gbdc:transferred', {
      instrumentId: params.instrumentId,
      from: params.fromAccount,
      to: params.toAccount,
      amount: params.amountCedi,
      txId: tx.txId,
    });

    return tx.txId;
  }

  /**
   * Redeem GBDC back to BoG
   * Only banks can initiate redemption
   */
  redeemGBDC(params: {
    instrumentId: string;
    holderAccount: string;
    amountCedi: number;
  }): string {
    const holder = this.state.accounts.get(params.holderAccount);
    if (!holder || holder.role !== UserRole.COMMERCIAL_BANK) {
      throw new Error('Only banks can redeem GBDC');
    }

    if (holder.gbdcBalance < params.amountCedi) {
      throw new Error(ERROR_CODES.INSUFFICIENT_BALANCE);
    }

    holder.gbdcBalance -= params.amountCedi;
    const gbdc = this.state.gbdcRegistry.get(params.instrumentId);
    if (gbdc) {
      gbdc.status = GBDCStatus.REDEEMED;
      gbdc.holder = 'BOG_TREASURY';
    }

    const tx = this.createTransaction({
      type: 'REDEEM',
      instrumentType: 'GBDC',
      instrumentId: params.instrumentId,
      fromAccount: params.holderAccount,
      toAccount: 'BOG_TREASURY',
      amount: params.amountCedi,
      data: {},
    });

    this.emit('gbdc:redeemed', { instrumentId: params.instrumentId, txId: tx.txId });
    return tx.txId;
  }

  // ─── CRDN Operations ───────────────────────────────────────────

  /**
   * Issue CRDN at cocoa delivery
   * 
   * Per whitepaper Section 6:
   * - Farmers deliver cocoa → CRDN issued instantly
   * - Backed by warehouse receipt + export contract
   * - Eliminates need for USD loans
   */
  issueCRDN(params: {
    farmerId: string;
    lbcId: string;
    cocoaWeightKg: number;
    pricePerKgGHS: number;
    warehouseReceiptId: string;
    seasonYear: string;
    attestationHash: string;
  }): string {
    // Validate farmer and LBC accounts
    const farmer = this.state.accounts.get(params.farmerId);
    const lbc = this.state.accounts.get(params.lbcId);
    if (!farmer || farmer.role !== UserRole.FARMER) throw new Error('Invalid farmer account');
    if (!lbc || lbc.role !== UserRole.LBC) throw new Error('Invalid LBC account');

    const amountCedi = params.cocoaWeightKg * params.pricePerKgGHS;
    if (amountCedi < FINANCIAL.MIN_CRDN_VALUE_CEDI) {
      throw new Error(`CRDN value below minimum of ${FINANCIAL.MIN_CRDN_VALUE_CEDI} GHS`);
    }

    const instrumentId = this.generateInstrumentId('CRDN');
    this.state.crdnRegistry.set(instrumentId, {
      instrumentId,
      amountCedi,
      cocoaWeightKg: params.cocoaWeightKg,
      holder: params.farmerId,
      status: CRDNStatus.ISSUED,
      issuedAt: new Date(),
      farmerId: params.farmerId,
      lbcId: params.lbcId,
    });

    // Credit farmer
    farmer.crdnBalance += amountCedi;

    const tx = this.createTransaction({
      type: 'MINT',
      instrumentType: 'CRDN',
      instrumentId,
      fromAccount: 'BOG_RESERVE',
      toAccount: params.farmerId,
      amount: amountCedi,
      data: {
        warehouseReceiptId: params.warehouseReceiptId,
        cocoaWeightKg: params.cocoaWeightKg,
        pricePerKgGHS: params.pricePerKgGHS,
        seasonYear: params.seasonYear,
        attestationHash: params.attestationHash,
      },
    });

    this.emit('crdn:issued', {
      instrumentId,
      farmerId: params.farmerId,
      amountCedi,
      txId: tx.txId,
    });

    return instrumentId;
  }

  /**
   * Convert CRDN to GBDC or cash
   * 
   * Per whitepaper: Convertible immediately to cedi via bank/MoMo
   */
  convertCRDN(params: {
    instrumentId: string;
    farmerId: string;
    targetInstrument: 'GBDC' | 'CASH';
    bankAccountId?: string;
  }): string {
    const crdn = this.state.crdnRegistry.get(params.instrumentId);
    if (!crdn) throw new Error('CRDN not found');
    if (crdn.holder !== params.farmerId) throw new Error('Not the holder');
    if (crdn.status !== CRDNStatus.ISSUED && crdn.status !== CRDNStatus.HELD) {
      throw new Error('CRDN cannot be converted in current state');
    }

    const farmer = this.state.accounts.get(params.farmerId)!;
    farmer.crdnBalance -= crdn.amountCedi;

    crdn.status = CRDNStatus.CONVERTED;

    if (params.targetInstrument === 'GBDC') {
      farmer.gbdcBalance += crdn.amountCedi;
    }

    const tx = this.createTransaction({
      type: 'CONVERT',
      instrumentType: 'CRDN',
      instrumentId: params.instrumentId,
      fromAccount: params.farmerId,
      toAccount: params.bankAccountId || params.farmerId,
      amount: crdn.amountCedi,
      data: {
        targetInstrument: params.targetInstrument,
        originalCRDN: params.instrumentId,
      },
    });

    this.emit('crdn:converted', {
      instrumentId: params.instrumentId,
      farmerId: params.farmerId,
      amountCedi: crdn.amountCedi,
      target: params.targetInstrument,
      txId: tx.txId,
    });

    return tx.txId;
  }

  // ─── Query Methods ────────────────────────────────────────────

  getChainHeight(): number {
    return this.state.chain.length - 1;
  }

  getBlock(height: number): LedgerBlock | undefined {
    return this.state.chain[height];
  }

  getLatestBlock(): LedgerBlock {
    return this.state.chain[this.state.chain.length - 1];
  }

  getAccountBalance(accountId: string): AccountBalance | undefined {
    return this.state.accounts.get(accountId);
  }

  getGBDCRecord(instrumentId: string): GBDCRecord | undefined {
    return this.state.gbdcRegistry.get(instrumentId);
  }

  getCRDNRecord(instrumentId: string): CRDNRecord | undefined {
    return this.state.crdnRegistry.get(instrumentId);
  }

  getTotalGBDCOutstanding(): number {
    let total = 0;
    for (const [, gbdc] of this.state.gbdcRegistry) {
      if (gbdc.status === GBDCStatus.MINTED || gbdc.status === GBDCStatus.CIRCULATING) {
        total += gbdc.amountCedi;
      }
    }
    return total;
  }

  getTotalCRDNOutstanding(): number {
    let total = 0;
    for (const [, crdn] of this.state.crdnRegistry) {
      if (crdn.status === CRDNStatus.ISSUED || crdn.status === CRDNStatus.HELD) {
        total += crdn.amountCedi;
      }
    }
    return total;
  }

  getReserveSummary() {
    const totalGBDC = this.getTotalGBDCOutstanding();
    const totalCRDN = this.getTotalCRDNOutstanding();
    const totalInstruments = totalGBDC + totalCRDN;
    const reserveValue = this.state.goldReserveGrams + this.state.cocoaReserveKg;

    return {
      goldReserveGrams: this.state.goldReserveGrams,
      cocoaReserveKg: this.state.cocoaReserveKg,
      totalGBDCOutstanding: totalGBDC,
      totalCRDNOutstanding: totalCRDN,
      chainHeight: this.getChainHeight(),
      pendingTransactions: this.state.pendingTransactions.length,
      accountCount: this.state.accounts.size,
      reserveBackingRatio: totalInstruments > 0 ? reserveValue / totalInstruments : 0,
    };
  }

  // ─── Internal Methods ─────────────────────────────────────────

  private getTotalGBDCBackingGrams(): number {
    let total = 0;
    for (const [, gbdc] of this.state.gbdcRegistry) {
      if (gbdc.status !== GBDCStatus.BURNED && gbdc.status !== GBDCStatus.REDEEMED) {
        total += gbdc.goldBackingGrams;
      }
    }
    return total;
  }

  private createTransaction(params: {
    type: BlockTransaction['type'];
    instrumentType: 'GBDC' | 'CRDN';
    instrumentId: string;
    fromAccount: string;
    toAccount: string;
    amount: number;
    data: Record<string, unknown>;
  }): BlockTransaction {
    const txId = this.generateTxId();
    const tx: BlockTransaction = {
      txId,
      type: params.type,
      instrumentType: params.instrumentType,
      instrumentId: params.instrumentId,
      fromAccount: params.fromAccount,
      toAccount: params.toAccount,
      amount: params.amount,
      timestamp: new Date(),
      data: params.data,
      signature: this.signTransaction(txId),
    };

    this.state.pendingTransactions.push(tx);
    this.emit('transaction:created', { txId, type: params.type });
    return tx;
  }

  private generateBlock(): void {
    const previousBlock = this.getLatestBlock();
    const transactions = this.state.pendingTransactions.splice(0, SYSTEM.MAX_TX_PER_BLOCK);

    const header = {
      blockHeight: previousBlock.header.blockHeight + 1,
      previousHash: previousBlock.hash,
      timestamp: new Date(),
      merkleRoot: computeMerkleRoot(transactions),
      transactionCount: transactions.length,
      validatorId: this.validatorId,
      validatorSignature: '',
      nonce: 0,
    };

    const hash = computeBlockHash(header);
    const block: LedgerBlock = { header, transactions, hash };

    if (validateBlock(block, previousBlock)) {
      this.state.chain.push(block);
      this.emit('block:generated', {
        blockHeight: header.blockHeight,
        hash,
        txCount: transactions.length,
      });
    } else {
      // Return transactions to pending pool
      this.state.pendingTransactions.unshift(...transactions);
      this.emit('block:validation_failed', { blockHeight: header.blockHeight });
    }
  }

  private generateInstrumentId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex');
    return `${prefix}-${timestamp}-${random}`;
  }

  private generateTxId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private signTransaction(txId: string): string {
    return crypto
      .createHash(SYSTEM.HASH_ALGORITHM)
      .update(txId + this.validatorId + Date.now())
      .digest('hex');
  }
}
