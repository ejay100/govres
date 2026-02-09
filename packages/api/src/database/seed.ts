/**
 * GOVRES — Database Seed
 * 
 * Seed data for development and testing.
 * Creates sample organizations, users, and initial records.
 * Uses bcrypt for proper password hashing.
 */

import bcrypt from 'bcryptjs';

async function buildSeedSQL(): Promise<string> {
  // Hash a default dev password
  const devHash = await bcrypt.hash('govres2025', 12);

  return `
-- ============================================================
-- SEED DATA FOR GOVRES DEVELOPMENT
-- ============================================================

-- Organizations
INSERT INTO organizations (org_code, org_name, org_type, region) VALUES
  ('BOG', 'Bank of Ghana', 'BOG', 'Greater Accra'),
  ('MOF', 'Ministry of Finance', 'GOVERNMENT_AGENCY', 'Greater Accra'),
  ('MRH', 'Ministry of Roads & Highways', 'GOVERNMENT_AGENCY', 'Greater Accra'),
  ('GCB', 'GCB Bank Limited', 'COMMERCIAL_BANK', 'Greater Accra'),
  ('ECO', 'Ecobank Ghana Limited', 'COMMERCIAL_BANK', 'Greater Accra'),
  ('STB', 'Stanbic Bank Ghana Limited', 'COMMERCIAL_BANK', 'Greater Accra'),
  ('FID', 'Fidelity Bank Ghana Limited', 'COMMERCIAL_BANK', 'Greater Accra'),
  ('ADB', 'Agricultural Development Bank', 'COMMERCIAL_BANK', 'Greater Accra'),
  ('LBC001', 'PBC Limited', 'LBC', 'Ashanti'),
  ('LBC002', 'Akuafo Adamfo Marketing Company', 'LBC', 'Western'),
  ('LBC003', 'Kuapa Kokoo Limited', 'LBC', 'Ashanti'),
  ('NEWMONT', 'Newmont Corporation Ghana', 'MINING_COMPANY', 'Ashanti'),
  ('AGA', 'AngloGold Ashanti - Obuasi', 'MINING_COMPANY', 'Ashanti'),
  ('GFL', 'Gold Fields Ghana - Tarkwa', 'MINING_COMPANY', 'Western')
ON CONFLICT (org_code) DO NOTHING;

-- User accounts with proper bcrypt password hashes
-- Default dev password: govres2025
INSERT INTO user_accounts (account_id, organization_id, role, full_name, email, phone, password_hash) VALUES
  ('BOG-ADMIN-001', (SELECT id FROM organizations WHERE org_code = 'BOG'), 'BOG_ADMIN',
   'GOVRES System Administrator', 'admin@bog.gov.gh', '+233302666174', '${devHash}'),
  ('BOG-AUDIT-001', (SELECT id FROM organizations WHERE org_code = 'BOG'), 'BOG_AUDITOR',
   'GOVRES Auditor', 'auditor@bog.gov.gh', '+233302666175', '${devHash}'),
  ('MOF-001', (SELECT id FROM organizations WHERE org_code = 'MOF'), 'GOVT_AGENCY',
   'Ministry of Finance Officer', 'officer@mof.gov.gh', '+233302000001', '${devHash}'),
  ('GCB-001', (SELECT id FROM organizations WHERE org_code = 'GCB'), 'COMMERCIAL_BANK',
   'GCB Settlement Officer', 'settlement@gcbbank.com.gh', '+233302000002', '${devHash}'),
  ('LBC001-001', (SELECT id FROM organizations WHERE org_code = 'LBC001'), 'LBC',
   'PBC Purchase Clerk', 'clerk@pbc.com.gh', '+233200000001', '${devHash}'),
  ('FARMER-001', NULL, 'FARMER',
   'Kwame Mensah', 'kwame@example.com', '+233240000001', '${devHash}'),
  ('FARMER-002', NULL, 'FARMER',
   'Ama Serwaa', 'ama@example.com', '+233240000002', '${devHash}'),
  ('CONTRACTOR-001', NULL, 'CONTRACTOR',
   'Northgate Construction Ltd', 'info@northgate.com.gh', '+233300000001', '${devHash}'),
  ('DIASPORA-001', NULL, 'DIASPORA',
   'Kofi Asante', 'kofi.asante@email.com', '+14155550001', '${devHash}')
ON CONFLICT (account_id) DO NOTHING;

-- Initialize account balances
INSERT INTO account_balances (account_id, gbdc_balance, crdn_balance) VALUES
  ('BOG-ADMIN-001', 0, 0),
  ('GCB-001', 0, 0),
  ('LBC001-001', 0, 0),
  ('FARMER-001', 0, 0),
  ('FARMER-002', 0, 0),
  ('CONTRACTOR-001', 0, 0)
ON CONFLICT (account_id) DO NOTHING;

-- Genesis block
INSERT INTO ledger_blocks (block_height, previous_hash, hash, merkle_root, transaction_count, validator_id)
VALUES (0, REPEAT('0', 64), encode(digest('genesis-govres-bog', 'sha256'), 'hex'),
        encode(digest('empty', 'sha256'), 'hex'), 0, 'BOG-VALIDATOR-001')
ON CONFLICT (block_height) DO NOTHING;
`;
}

export default buildSeedSQL;

export async function runSeed() {
  const { query } = await import('./connection');
  console.log('Running GOVRES database seed...');
  try {
    const sql = await buildSeedSQL();
    await query(sql);
    console.log('Seed completed successfully.');
  } catch (error: any) {
    console.error('Seed failed:', error.message);
    throw error;
  }
}

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
