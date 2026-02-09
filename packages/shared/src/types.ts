/**
 * GOVRES — Shared Type Definitions
 * 
 * Core types for the Government Reserve & Settlement Ledger
 * Aligned with Bank of Ghana Act 612, Payment Systems Act 987,
 * Cocobod Act 1984, and VASP Act 2025.
 */

// ─── Enums ───────────────────────────────────────────────────────

/** Instrument types on the GOVRES ledger */
export enum InstrumentType {
  GBDC = 'GBDC',   // Gold-Backed Digital Cedi
  CRDN = 'CRDN',   // Cocoa Receipt Digital Note
}

/** Transaction states on the ledger */
export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SETTLED = 'SETTLED',
  REJECTED = 'REJECTED',
  REVERSED = 'REVERSED',
}

/** User roles aligned with whitepaper Layer 3 */
export enum UserRole {
  BOG_ADMIN = 'BOG_ADMIN',             // Bank of Ghana / Treasury
  BOG_AUDITOR = 'BOG_AUDITOR',         // BoG Audit & Compliance
  GOVT_AGENCY = 'GOVT_AGENCY',         // Government Agencies / Ministries
  COMMERCIAL_BANK = 'COMMERCIAL_BANK', // Commercial Banks
  CONTRACTOR = 'CONTRACTOR',           // Contractors / Suppliers
  FARMER = 'FARMER',                   // Farmers
  LBC = 'LBC',                         // Licensed Buying Companies
  DIASPORA = 'DIASPORA',               // Diaspora Investors
  PUBLIC = 'PUBLIC',                    // Public Dashboard (read-only)
}

/** Oracle data source types */
export enum OracleSourceType {
  VAULT_SENSOR = 'VAULT_SENSOR',           // Gold vault weight sensors
  ASSAY_FINGERPRINT = 'ASSAY_FINGERPRINT', // Gold bar assay fingerprint
  WAREHOUSE_RECEIPT = 'WAREHOUSE_RECEIPT', // Cocoa warehouse digitized receipt
  LBC_FARMGATE = 'LBC_FARMGATE',          // LBC farm-gate delivery capture
  GOLDBOD_ROYALTY = 'GOLDBOD_ROYALTY',     // GoldBod royalty feed
  COCOBOD_FEED = 'COCOBOD_FEED',          // Cocobod data feed
}

/** Asset types backing instruments */
export enum AssetType {
  GOLD = 'GOLD',
  COCOA = 'COCOA',
  MINERAL_ROYALTY = 'MINERAL_ROYALTY',
}

/** Settlement channel */
export enum SettlementChannel {
  INTERBANK = 'INTERBANK',
  MOMO = 'MOMO',           // Mobile Money (MTN MoMo, Vodafone Cash, AirtelTigo Money)
  BANK_TRANSFER = 'BANK_TRANSFER',
  ECEDI = 'ECEDI',         // Future eCedi CBDC
}

/** CRDN lifecycle states */
export enum CRDNStatus {
  ISSUED = 'ISSUED',             // Issued at farm-gate delivery
  HELD = 'HELD',                 // Held by farmer/LBC
  CONVERTING = 'CONVERTING',     // Being converted to GBDC or cash
  CONVERTED = 'CONVERTED',       // Converted to GBDC / cedi
  EXPIRED = 'EXPIRED',           // Past validity period
  CANCELLED = 'CANCELLED',       // Cancelled by issuer
}

/** GBDC lifecycle states */
export enum GBDCStatus {
  MINTED = 'MINTED',           // Newly minted against gold reserves
  CIRCULATING = 'CIRCULATING', // In circulation
  REDEEMED = 'REDEEMED',       // Redeemed back to BoG
  LOCKED = 'LOCKED',           // Locked for settlement
  BURNED = 'BURNED',           // Permanently removed from circulation
}

// ─── Core Interfaces ────────────────────────────────────────────

/** Base entity with audit fields */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  version: number; // Optimistic concurrency control
}

/** Gold bar record in the reserve */
export interface GoldBar extends BaseEntity {
  barId: string;                   // Unique bar identifier
  assayFingerprint: string;        // Unique assay signature
  weightGrams: number;             // Weight in grams
  purity: number;                  // Purity percentage (e.g., 99.99)
  vaultId: string;                 // Vault location identifier
  country: 'GH';                  // Country of origin
  refineryId: string;              // Refinery identifier
  status: 'ACTIVE' | 'PLEDGED' | 'TRANSFERRED';
  lastVerifiedAt: Date;            // Last oracle verification timestamp
  sensorReadings: SensorReading[];
}

/** Sensor reading from vault oracle */
export interface SensorReading {
  sensorId: string;
  timestamp: Date;
  weightGrams: number;
  temperatureCelsius: number;
  humidityPercent: number;
  tamperDetected: boolean;
  signatureHash: string;           // Cryptographic signature of reading
}

/** Cocoa warehouse receipt */
export interface CocoaReceipt extends BaseEntity {
  receiptId: string;               // Unique receipt ID
  warehouseId: string;             // Warehouse location
  farmerId: string;                // Delivering farmer
  lbcId: string;                   // Licensed Buying Company
  qualityGrade: 'GRADE_1' | 'GRADE_2' | 'SUB_STANDARD';
  weightKg: number;                // Weight in kilograms
  bagsCount: number;               // Number of bags (standard 64kg)
  deliveryDate: Date;              // Farm-gate delivery date
  seasonYear: string;              // e.g., "2025/2026"
  exportContractId?: string;       // Linked export contract
  status: CRDNStatus;
  verificationHash: string;        // Hash of receipt data for tamper detection
}

/** GBDC instrument on the ledger */
export interface GBDC extends BaseEntity {
  instrumentId: string;
  type: InstrumentType.GBDC;
  amountCedi: number;              // Value in Ghana Cedi
  goldBackingBarIds: string[];     // Gold bars backing this issuance
  goldWeightGrams: number;         // Total gold weight backing
  goldPricePerGramUSD: number;     // Gold price at issuance
  exchangeRateUSDGHS: number;      // USD/GHS rate at issuance
  issuedBy: string;                // BoG issuer ID
  holderId: string;                // Current holder
  status: GBDCStatus;
  issuanceId: string;              // Batch issuance reference
  expiresAt?: Date;                // Optional expiry
  metadata: Record<string, unknown>;
}

/** CRDN instrument on the ledger */
export interface CRDN extends BaseEntity {
  instrumentId: string;
  type: InstrumentType.CRDN;
  amountCedi: number;              // Value in Ghana Cedi
  cocoaReceiptId: string;          // Linked warehouse receipt
  weightKg: number;                // Cocoa weight
  pricePerKgGHS: number;           // Producer price per kg at issuance
  farmerId: string;                // Farmer who delivered cocoa
  lbcId: string;                   // LBC that captured delivery
  seasonYear: string;              // Cocoa season
  status: CRDNStatus;
  convertedToGBDC?: string;        // GBDC instrument ID if converted
  convertedAt?: Date;
  metadata: Record<string, unknown>;
}

/** Ledger transaction record */
export interface LedgerTransaction extends BaseEntity {
  txId: string;                    // Unique transaction hash
  instrumentType: InstrumentType;
  instrumentId: string;
  fromAccountId: string;
  toAccountId: string;
  amountCedi: number;
  status: TransactionStatus;
  channel: SettlementChannel;
  description: string;
  blockHeight: number;             // Ledger block number
  previousTxHash: string;         // Chain link to previous transaction
  signatureHash: string;          // Digital signature
  auditTrail: AuditEntry[];
}

/** Audit trail entry */
export interface AuditEntry {
  timestamp: Date;
  action: string;
  performedBy: string;
  role: UserRole;
  details: string;
  ipAddress: string;
  signatureHash: string;
}

/** User account on the system */
export interface UserAccount extends BaseEntity {
  accountId: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  fullName: string;
  email: string;
  phone: string;
  isActive: boolean;
  kycVerified: boolean;
  permissions: string[];
  lastLoginAt?: Date;
}

/** Government project for contractor payment */
export interface GovernmentProject extends BaseEntity {
  projectId: string;
  agencyId: string;                // Submitting agency
  projectName: string;
  description: string;
  budgetGBDC: number;             // Budget allocated in GBDC
  disbursedGBDC: number;          // Amount disbursed
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  contractors: string[];           // Contractor account IDs
  approvedBy?: string;             // BoG/Treasury approver
  approvedAt?: Date;
  milestones: ProjectMilestone[];
}

/** Project milestone for tracking disbursement */
export interface ProjectMilestone {
  milestoneId: string;
  description: string;
  amountGBDC: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED';
  contractorId: string;
  completedAt?: Date;
  verifiedBy?: string;
}

/** Diaspora yield note */
export interface YieldNote extends BaseEntity {
  noteId: string;
  assetType: AssetType;
  investorId: string;              // Diaspora investor account
  principalCedi: number;           // Investment amount
  yieldPercentage: number;         // Annual yield
  maturityDate: Date;
  backingInstrumentIds: string[];  // GBDC/CRDN backing
  status: 'ACTIVE' | 'MATURED' | 'REDEEMED' | 'CANCELLED';
}

/** Oracle attestation record */
export interface OracleAttestation extends BaseEntity {
  attestationId: string;
  sourceType: OracleSourceType;
  sourceId: string;                // Sensor/device/feed ID
  data: Record<string, unknown>;   // Raw attestation data
  hash: string;                    // Cryptographic hash
  signature: string;               // Oracle signature
  verified: boolean;
  verifiedAt?: Date;
  expiresAt: Date;                 // Attestation validity window
}

/** Reserve summary for public dashboard */
export interface ReserveSummary {
  timestamp: Date;
  goldReserves: {
    totalWeightGrams: number;
    totalBars: number;
    estimatedValueUSD: number;
    estimatedValueGHS: number;
    lastVerifiedAt: Date;
  };
  cocoaReserves: {
    totalWeightKg: number;
    totalReceipts: number;
    estimatedValueGHS: number;
    seasonYear: string;
  };
  circulation: {
    totalGBDCOutstanding: number;
    totalCRDNOutstanding: number;
    totalGBDCRedeemed: number;
    totalCRDNConverted: number;
  };
  monetaryMetrics: {
    moneyMultiplier: number;       // m = M / MB
    liquidityVelocity: number;
    reserveBackingRatio: number;   // Total assets / Total outstanding instruments
  };
}

/** CBDC interoperability types */
export interface ECediTransaction {
  ecediTxId: string;
  govresTxId: string;
  amount: number;
  direction: 'GBDC_TO_ECEDI' | 'ECEDI_TO_GBDC' | 'CRDN_TO_ECEDI';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  proofHash: string;               // Asset-backed verification proof
  timestamp: Date;
}

/** Bank settlement record */
export interface BankSettlement extends BaseEntity {
  settlementId: string;
  bankId: string;
  bankName: string;
  instrumentType: InstrumentType;
  amountCedi: number;
  direction: 'CREDIT' | 'DEBIT';
  counterpartyBankId?: string;
  status: 'PENDING' | 'CLEARING' | 'SETTLED' | 'FAILED';
  settledAt?: Date;
  referenceNumber: string;
}

/** MoMo (Mobile Money) transaction */
export interface MoMoTransaction extends BaseEntity {
  momoTxId: string;
  govresTxId: string;
  provider: 'MTN_MOMO' | 'VODAFONE_CASH' | 'AIRTELTIGO_MONEY';
  phoneNumber: string;             // Recipient phone
  amountCedi: number;
  instrumentType: InstrumentType;
  status: 'INITIATED' | 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  failureReason?: string;
}

// ─── API Types ──────────────────────────────────────────────────

/** Standard API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    timestamp: Date;
  };
}

/** Pagination parameters */
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
