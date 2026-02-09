/**
 * GOVRES — Contractor Payment Flow Simulation
 * Simulates: Budget allocation → Project creation → Milestone disbursement → Bank settlement → Cash-out
 * Models government expenditure through GBDC rails
 */

import { LedgerEngine } from '@govres/ledger';
import { UserRole } from '@govres/shared';

interface ProjectSimConfig {
  name: string;
  ministry: string;
  contractor: string;
  totalBudget: number;
  milestones: { name: string; percentOfBudget: number }[];
  region: string;
}

interface ContractorSimResult {
  projectsProcessed: number;
  totalDisbursed: number;
  totalMilestones: number;
  milestonesCompleted: number;
  averageDisbursementTimeMs: number;
  bankSettlements: number;
  gbdcTurnover: number;
}

/**
 * Sample government infrastructure projects (realistic Ghanaian context)
 */
const SAMPLE_PROJECTS: ProjectSimConfig[] = [
  {
    name: 'Accra-Tema Motorway Extension',
    ministry: 'Ministry of Roads & Highways',
    contractor: 'Sinohydro Ghana',
    totalBudget: 120_000_000,
    milestones: [
      { name: 'Land Acquisition & EIA', percentOfBudget: 0.08 },
      { name: 'Foundation & Earthworks', percentOfBudget: 0.20 },
      { name: 'Bridge Structures', percentOfBudget: 0.25 },
      { name: 'Road Surface Layer 1', percentOfBudget: 0.20 },
      { name: 'Road Surface Layer 2', percentOfBudget: 0.15 },
      { name: 'Signage, Lighting & Handover', percentOfBudget: 0.12 },
    ],
    region: 'Greater Accra',
  },
  {
    name: 'Tamale Teaching Hospital Expansion',
    ministry: 'Ministry of Health',
    contractor: 'BuildWell Ghana Ltd',
    totalBudget: 45_000_000,
    milestones: [
      { name: 'Architectural Design & Permits', percentOfBudget: 0.05 },
      { name: 'Foundation & Structural Frame', percentOfBudget: 0.30 },
      { name: 'MEP Installation', percentOfBudget: 0.25 },
      { name: 'Interior Finishing', percentOfBudget: 0.20 },
      { name: 'Medical Equipment & Commissioning', percentOfBudget: 0.20 },
    ],
    region: 'Northern',
  },
  {
    name: 'Solar Power Plant — Bui Enclave',
    ministry: 'Ministry of Energy',
    contractor: 'SolarTech Ghana',
    totalBudget: 28_000_000,
    milestones: [
      { name: 'Site Preparation', percentOfBudget: 0.10 },
      { name: 'Panel Installation (Phase 1)', percentOfBudget: 0.30 },
      { name: 'Panel Installation (Phase 2)', percentOfBudget: 0.25 },
      { name: 'Grid Connection & Testing', percentOfBudget: 0.20 },
      { name: 'Handover & Warranty', percentOfBudget: 0.15 },
    ],
    region: 'Bono',
  },
  {
    name: 'Kumasi Water Supply Improvement',
    ministry: 'Ministry of Sanitation & Water Resources',
    contractor: 'AquaGhana Services',
    totalBudget: 18_500_000,
    milestones: [
      { name: 'Pipeline Route Survey', percentOfBudget: 0.05 },
      { name: 'Pipe Laying (48km)', percentOfBudget: 0.35 },
      { name: 'Treatment Plant Construction', percentOfBudget: 0.30 },
      { name: 'Pump Station & Testing', percentOfBudget: 0.20 },
      { name: 'Community Connections & Launch', percentOfBudget: 0.10 },
    ],
    region: 'Ashanti',
  },
];

/**
 * Simulate government contractor payment flows
 */
export async function simulateContractorPayments(options: {
  projectsToSimulate?: number;
  milestoneCompletionRate: number; // 0-1, what fraction of milestones to complete
}): Promise<ContractorSimResult> {
  const ledger = new LedgerEngine();
  await ledger.initialize();

  const startTime = Date.now();

  // Register system accounts
  ledger.registerAccount({
    accountId: 'bog-reserve',
    organizationId: 'bog',
    role: UserRole.BOG_ADMIN,
    label: 'Bank of Ghana Reserve',
  });

  ledger.registerAccount({
    accountId: 'mof-treasury',
    organizationId: 'mof',
    role: UserRole.GOV_AGENCY,
    label: 'Ministry of Finance Treasury',
  });

  // Seed gold reserve for GBDC minting capacity
  ledger.registerGoldReserve({
    barId: 'sim-gold-reserve',
    weightGrams: 500_000, // 500kg
    purity: 0.999,
    attestationId: 'sim-attest-gold',
  });

  let totalDisbursed = 0;
  let totalMilestonesCompleted = 0;
  let totalMilestones = 0;
  let bankSettlements = 0;
  let gbdcTurnover = 0;

  const projects = SAMPLE_PROJECTS.slice(0, options.projectsToSimulate ?? SAMPLE_PROJECTS.length);

  for (const project of projects) {
    // Register contractor account
    const contractorId = `ctr-${project.contractor.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}`;
    ledger.registerAccount({
      accountId: contractorId,
      organizationId: contractorId,
      role: UserRole.CONTRACTOR,
      label: project.contractor,
    });

    // Register bank for settlement
    const bankId = `bank-${project.region.toLowerCase().replace(/\s+/g, '-')}`;
    try {
      ledger.registerAccount({
        accountId: bankId,
        organizationId: bankId,
        role: UserRole.BANK_ADMIN,
        label: `Settlement Bank — ${project.region}`,
      });
    } catch {
      // Bank may already exist from a previous project
    }

    console.log(`\n  Project: ${project.name}`);
    console.log(`  Budget:  GH¢${project.totalBudget.toLocaleString()}`);
    console.log(`  Region:  ${project.region}`);

    // Process milestones
    for (let mi = 0; mi < project.milestones.length; mi++) {
      totalMilestones++;
      const milestone = project.milestones[mi];

      // Check if this milestone should be "completed" based on rate
      if (Math.random() > options.milestoneCompletionRate) {
        console.log(`    ○ ${milestone.name} — pending`);
        continue;
      }

      totalMilestonesCompleted++;
      const amount = Math.round(project.totalBudget * milestone.percentOfBudget);

      // Mint GBDC for disbursement (BoG → Treasury → Contractor → Bank)
      const gbdc = ledger.mintGBDC({
        amount,
        authorizedBy: 'bog-reserve',
        purpose: `${project.name} — ${milestone.name}`,
      });

      // Transfer to contractor
      ledger.transferGBDC(gbdc.instrumentId, 'bog-reserve', contractorId);

      // Contractor redeems at bank
      ledger.redeemGBDC(gbdc.instrumentId, contractorId);

      totalDisbursed += amount;
      gbdcTurnover += amount;
      bankSettlements++;

      console.log(`    ✓ ${milestone.name} — GH¢${amount.toLocaleString()}`);
    }
  }

  const elapsedMs = Date.now() - startTime;

  return {
    projectsProcessed: projects.length,
    totalDisbursed,
    totalMilestones,
    milestonesCompleted: totalMilestonesCompleted,
    averageDisbursementTimeMs: totalMilestonesCompleted > 0 ? elapsedMs / totalMilestonesCompleted : 0,
    bankSettlements,
    gbdcTurnover,
  };
}

/**
 * Run simulation
 */
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  GOVRES — Contractor Payment Flow Simulation');
  console.log('═══════════════════════════════════════════════════');

  const result = await simulateContractorPayments({
    milestoneCompletionRate: 0.70,
  });

  console.log('\n───────────────────────────────────────────────────');
  console.log('Simulation Results:');
  console.log('───────────────────────────────────────────────────');
  console.log(`  Projects processed:      ${result.projectsProcessed}`);
  console.log(`  Total disbursed:         GH¢${result.totalDisbursed.toLocaleString()}`);
  console.log(`  Milestones completed:    ${result.milestonesCompleted}/${result.totalMilestones}`);
  console.log(`  Bank settlements:        ${result.bankSettlements}`);
  console.log(`  GBDC turnover:           GH¢${result.gbdcTurnover.toLocaleString()}`);
  console.log(`  Avg disbursement time:   ${result.averageDisbursementTimeMs.toFixed(2)}ms`);
  console.log('───────────────────────────────────────────────────\n');
}

main().catch(console.error);
