/**
 * GOVRES — Database Migration
 * 
 * PostgreSQL schema for the GOVRES system.
 * Creates all tables for ledger, instruments, accounts, settlements,
 * oracle data, and audit trails.
 */

const MIGRATION_SQL = `
-- ============================================================
-- GOVRES Database Schema
-- Government Reserve & Settlement Ledger
-- Bank of Ghana — Compliant with Act 612, Act 987, VASP Act 2025
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ACCOUNTS & USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_code VARCHAR(10) UNIQUE NOT NULL,
  org_name VARCHAR(255) NOT NULL,
  org_type VARCHAR(50) NOT NULL CHECK (org_type IN (
    'BOG', 'GOVERNMENT_AGENCY', 'COMMERCIAL_BANK', 
    'LBC', 'MINING_COMPANY', 'OTHER'
  )),
  registration_number VARCHAR(100),
  address TEXT,
  region VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id VARCHAR(50) UNIQUE NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  role VARCHAR(30) NOT NULL CHECK (role IN (
    'BOG_ADMIN', 'BOG_AUDITOR', 'GOVT_AGENCY', 'COMMERCIAL_BANK',
    'CONTRACTOR', 'FARMER', 'LBC', 'DIASPORA', 'PUBLIC'
  )),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  kyc_verified BOOLEAN DEFAULT false,
  kyc_verified_at TIMESTAMPTZ,
  permissions JSONB DEFAULT '[]',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LEDGER — Blocks & Transactions
-- ============================================================

CREATE TABLE IF NOT EXISTS ledger_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  block_height BIGINT UNIQUE NOT NULL,
  previous_hash VARCHAR(64) NOT NULL,
  hash VARCHAR(64) UNIQUE NOT NULL,
  merkle_root VARCHAR(64) NOT NULL,
  transaction_count INT NOT NULL DEFAULT 0,
  validator_id VARCHAR(100) NOT NULL,
  validator_signature TEXT,
  nonce BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ledger_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tx_id VARCHAR(64) UNIQUE NOT NULL,
  block_height BIGINT REFERENCES ledger_blocks(block_height),
  tx_type VARCHAR(20) NOT NULL CHECK (tx_type IN (
    'MINT', 'TRANSFER', 'REDEEM', 'CONVERT', 'SETTLE', 'BURN'
  )),
  instrument_type VARCHAR(10) NOT NULL CHECK (instrument_type IN ('GBDC', 'CRDN')),
  instrument_id VARCHAR(100) NOT NULL,
  from_account VARCHAR(50) NOT NULL,
  to_account VARCHAR(50) NOT NULL,
  amount_cedi DECIMAL(20,4) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
    'PENDING', 'CONFIRMED', 'SETTLED', 'REJECTED', 'REVERSED'
  )),
  channel VARCHAR(20) CHECK (channel IN (
    'INTERBANK', 'MOMO', 'BANK_TRANSFER', 'ECEDI'
  )),
  description TEXT,
  signature_hash VARCHAR(64),
  tx_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tx_block ON ledger_transactions(block_height);
CREATE INDEX idx_tx_instrument ON ledger_transactions(instrument_type, instrument_id);
CREATE INDEX idx_tx_from ON ledger_transactions(from_account);
CREATE INDEX idx_tx_to ON ledger_transactions(to_account);
CREATE INDEX idx_tx_status ON ledger_transactions(status);
CREATE INDEX idx_tx_created ON ledger_transactions(created_at);

-- ============================================================
-- GBDC — Gold-Backed Digital Cedi
-- ============================================================

CREATE TABLE IF NOT EXISTS gbdc_instruments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instrument_id VARCHAR(100) UNIQUE NOT NULL,
  amount_cedi DECIMAL(20,4) NOT NULL,
  gold_backing_grams DECIMAL(15,6) NOT NULL,
  gold_price_per_gram_usd DECIMAL(12,4),
  exchange_rate_usd_ghs DECIMAL(12,4),
  issued_by VARCHAR(50) NOT NULL,
  holder_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'MINTED' CHECK (status IN (
    'MINTED', 'CIRCULATING', 'REDEEMED', 'LOCKED', 'BURNED'
  )),
  issuance_id VARCHAR(100) NOT NULL,
  gold_bar_ids JSONB DEFAULT '[]',
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gbdc_holder ON gbdc_instruments(holder_id);
CREATE INDEX idx_gbdc_status ON gbdc_instruments(status);

-- ============================================================
-- CRDN — Cocoa Receipt Digital Note
-- ============================================================

CREATE TABLE IF NOT EXISTS crdn_instruments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instrument_id VARCHAR(100) UNIQUE NOT NULL,
  amount_cedi DECIMAL(20,4) NOT NULL,
  cocoa_weight_kg DECIMAL(12,4) NOT NULL,
  price_per_kg_ghs DECIMAL(10,4) NOT NULL,
  farmer_id VARCHAR(50) NOT NULL,
  lbc_id VARCHAR(50) NOT NULL,
  warehouse_receipt_id VARCHAR(100),
  quality_grade VARCHAR(20) CHECK (quality_grade IN ('GRADE_1', 'GRADE_2', 'SUB_STANDARD')),
  season_year VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ISSUED' CHECK (status IN (
    'ISSUED', 'HELD', 'CONVERTING', 'CONVERTED', 'EXPIRED', 'CANCELLED'
  )),
  converted_to_gbdc VARCHAR(100),
  converted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crdn_farmer ON crdn_instruments(farmer_id);
CREATE INDEX idx_crdn_lbc ON crdn_instruments(lbc_id);
CREATE INDEX idx_crdn_status ON crdn_instruments(status);
CREATE INDEX idx_crdn_season ON crdn_instruments(season_year);

-- ============================================================
-- ORACLE — Gold Reserves
-- ============================================================

CREATE TABLE IF NOT EXISTS gold_bars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bar_id VARCHAR(100) UNIQUE NOT NULL,
  assay_fingerprint VARCHAR(255) UNIQUE NOT NULL,
  weight_grams DECIMAL(15,6) NOT NULL,
  purity DECIMAL(6,4) NOT NULL,
  vault_id VARCHAR(50) NOT NULL,
  refinery_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PLEDGED', 'TRANSFERRED')),
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vault_sensors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sensor_id VARCHAR(100) UNIQUE NOT NULL,
  vault_id VARCHAR(50) NOT NULL,
  sensor_type VARCHAR(30) NOT NULL,
  manufacturer VARCHAR(100),
  calibration_date DATE,
  calibration_certificate VARCHAR(255),
  reading_interval_seconds INT DEFAULT 60,
  tolerance_percent DECIMAL(5,3) DEFAULT 0.1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sensor_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sensor_id VARCHAR(100) REFERENCES vault_sensors(sensor_id),
  weight_grams DECIMAL(15,6),
  temperature_celsius DECIMAL(6,2),
  humidity_percent DECIMAL(5,2),
  tamper_detected BOOLEAN DEFAULT false,
  signature_hash VARCHAR(64) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_readings_sensor ON sensor_readings(sensor_id);
CREATE INDEX idx_readings_time ON sensor_readings(recorded_at);

-- ============================================================
-- ORACLE — Cocoa Warehouse
-- ============================================================

CREATE TABLE IF NOT EXISTS cocoa_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id VARCHAR(100) UNIQUE NOT NULL,
  farmer_id VARCHAR(50) NOT NULL,
  farmer_name VARCHAR(255),
  lbc_id VARCHAR(50) NOT NULL,
  lbc_name VARCHAR(255),
  purchase_clerk_id VARCHAR(50),
  region VARCHAR(50) NOT NULL,
  district VARCHAR(100),
  community VARCHAR(100),
  bags_count INT NOT NULL,
  weight_kg DECIMAL(12,4) NOT NULL,
  quality_grade VARCHAR(20) NOT NULL,
  moisture_content DECIMAL(5,2),
  delivery_date DATE NOT NULL,
  gps_lat DECIMAL(10,7),
  gps_lng DECIMAL(10,7),
  season_year VARCHAR(10) NOT NULL,
  verification_hash VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_delivery_farmer ON cocoa_deliveries(farmer_id);
CREATE INDEX idx_delivery_lbc ON cocoa_deliveries(lbc_id);
CREATE INDEX idx_delivery_region ON cocoa_deliveries(region);
CREATE INDEX idx_delivery_season ON cocoa_deliveries(season_year);

CREATE TABLE IF NOT EXISTS warehouse_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id VARCHAR(100) UNIQUE NOT NULL,
  warehouse_id VARCHAR(50) NOT NULL,
  warehouse_name VARCHAR(255),
  warehouse_region VARCHAR(50),
  delivery_ids JSONB DEFAULT '[]',
  total_bags INT NOT NULL,
  total_weight_kg DECIMAL(12,4) NOT NULL,
  quality_checked_by VARCHAR(100),
  quality_check_date DATE,
  quality_result VARCHAR(20) CHECK (quality_result IN ('PASSED', 'FAILED', 'CONDITIONAL')),
  stack_number VARCHAR(50),
  grade_breakdown JSONB DEFAULT '{}',
  export_contract_ref VARCHAR(100),
  stored_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORACLE — GoldBod Royalties
-- ============================================================

CREATE TABLE IF NOT EXISTS gold_production_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id VARCHAR(100) UNIQUE NOT NULL,
  period_year INT NOT NULL,
  period_quarter INT NOT NULL CHECK (period_quarter BETWEEN 1 AND 4),
  producer_id VARCHAR(50) NOT NULL,
  producer_name VARCHAR(255),
  mine_id VARCHAR(50),
  mine_name VARCHAR(255),
  region VARCHAR(50),
  production_ounces DECIMAL(15,4),
  production_grams DECIMAL(15,4),
  gold_price_per_ounce_usd DECIMAL(12,4),
  gross_revenue_usd DECIMAL(20,4),
  royalty_rate DECIMAL(5,4) DEFAULT 0.05,
  royalty_amount_usd DECIMAL(20,4),
  royalty_amount_ghs DECIMAL(20,4),
  exchange_rate_usd_ghs DECIMAL(12,4),
  report_date DATE,
  verified_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORACLE — Attestations
-- ============================================================

CREATE TABLE IF NOT EXISTS oracle_attestations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attestation_id VARCHAR(100) UNIQUE NOT NULL,
  source_type VARCHAR(30) NOT NULL,
  source_id VARCHAR(100) NOT NULL,
  data JSONB NOT NULL,
  hash VARCHAR(64) NOT NULL,
  signature TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_att_source ON oracle_attestations(source_type, source_id);
CREATE INDEX idx_att_verified ON oracle_attestations(verified);

-- ============================================================
-- SETTLEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS bank_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settlement_id VARCHAR(100) UNIQUE NOT NULL,
  bank_id VARCHAR(50) NOT NULL,
  bank_name VARCHAR(255),
  instrument_type VARCHAR(10) NOT NULL,
  amount_cedi DECIMAL(20,4) NOT NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('CREDIT', 'DEBIT')),
  counterparty_bank_id VARCHAR(50),
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN (
    'PENDING', 'CLEARING', 'SETTLED', 'FAILED'
  )),
  settled_at TIMESTAMPTZ,
  reference_number VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS momo_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  momo_tx_id VARCHAR(100) UNIQUE NOT NULL,
  govres_tx_id VARCHAR(64) REFERENCES ledger_transactions(tx_id),
  provider VARCHAR(30) NOT NULL CHECK (provider IN (
    'MTN_MOMO', 'VODAFONE_CASH', 'AIRTELTIGO_MONEY'
  )),
  phone_number VARCHAR(20) NOT NULL,
  amount_cedi DECIMAL(20,4) NOT NULL,
  instrument_type VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'INITIATED' CHECK (status IN (
    'INITIATED', 'PENDING', 'COMPLETED', 'FAILED', 'REVERSED'
  )),
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- GOVERNMENT PROJECTS
-- ============================================================

CREATE TABLE IF NOT EXISTS government_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id VARCHAR(100) UNIQUE NOT NULL,
  agency_id VARCHAR(50) NOT NULL,
  project_name VARCHAR(500) NOT NULL,
  description TEXT,
  budget_gbdc DECIMAL(20,4) NOT NULL,
  disbursed_gbdc DECIMAL(20,4) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT', 'SUBMITTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
  )),
  contractors JSONB DEFAULT '[]',
  approved_by VARCHAR(50),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id VARCHAR(100) UNIQUE NOT NULL,
  project_id VARCHAR(100) REFERENCES government_projects(project_id),
  description TEXT NOT NULL,
  amount_gbdc DECIMAL(20,4) NOT NULL,
  contractor_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN (
    'PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'
  )),
  completed_at TIMESTAMPTZ,
  verified_by VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DIASPORA YIELD NOTES
-- ============================================================

CREATE TABLE IF NOT EXISTS yield_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id VARCHAR(100) UNIQUE NOT NULL,
  asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('GOLD', 'COCOA', 'MINERAL_ROYALTY')),
  investor_id VARCHAR(50) NOT NULL,
  principal_cedi DECIMAL(20,4) NOT NULL,
  yield_percentage DECIMAL(6,4) NOT NULL,
  maturity_date DATE NOT NULL,
  backing_instrument_ids JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN (
    'ACTIVE', 'MATURED', 'REDEEMED', 'CANCELLED'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CBDC INTEGRATION
-- ============================================================

CREATE TABLE IF NOT EXISTS ecedi_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecedi_tx_id VARCHAR(100) UNIQUE NOT NULL,
  govres_tx_id VARCHAR(64),
  amount_cedi DECIMAL(20,4) NOT NULL,
  direction VARCHAR(30) NOT NULL CHECK (direction IN (
    'GBDC_TO_ECEDI', 'ECEDI_TO_GBDC', 'CRDN_TO_ECEDI'
  )),
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN (
    'PENDING', 'COMPLETED', 'FAILED'
  )),
  proof_hash VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- AUDIT TRAIL
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(100) NOT NULL,
  performed_by VARCHAR(50) NOT NULL,
  role VARCHAR(30),
  resource_type VARCHAR(50),
  resource_id VARCHAR(100),
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  signature_hash VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_user ON audit_log(performed_by);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_time ON audit_log(created_at);

-- ============================================================
-- ACCOUNT BALANCES (Materialized view for performance)
-- ============================================================

CREATE TABLE IF NOT EXISTS account_balances (
  account_id VARCHAR(50) PRIMARY KEY,
  gbdc_balance DECIMAL(20,4) DEFAULT 0,
  crdn_balance DECIMAL(20,4) DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);
`;

export default MIGRATION_SQL;

// Run migration when executed directly
export async function runMigration() {
  const { query } = await import('./connection');
  console.log('Running GOVRES database migration...');
  try {
    await query(MIGRATION_SQL);
    console.log('Migration completed successfully.');
  } catch (error: any) {
    console.error('Migration failed:', error.message);
    throw error;
  }
}

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
