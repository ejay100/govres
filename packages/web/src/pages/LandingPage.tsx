/**
 * GOVRES — Landing Page
 * Full marketing landing with hero, services, how-it-works, stats, about, and footer.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../components/Navbar';
import { dashboardAPI } from '../lib/api';

/* ── Helpers ────────────────────────────────────────────── */

const fmt = (n: number | undefined) =>
  n != null ? new Intl.NumberFormat('en-GH').format(n) : '—';
const fmtCedi = (n: number | undefined) =>
  n != null ? `GH₵ ${new Intl.NumberFormat('en-GH', { minimumFractionDigits: 2 }).format(n)}` : '—';

/* ── Service Card (expandable) ──────────────────────────── */

function ServiceCard({
  icon, title, description, color, details, stat, statLabel,
}: {
  icon: React.ReactNode; title: string; description: string; color: string;
  details: string[]; stat?: string; statLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div
      className={`bg-[#1A1A2E] rounded-2xl shadow-sm hover:shadow-lg transition-all group border border-white/10 cursor-pointer ${open ? 'ring-2 ring-govres-gold/30' : ''}`}
      onClick={() => setOpen(!open)}
    >
      <div className="p-7">
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          {stat && (
            <div className="text-right">
              <p className="text-lg font-bold text-white">{stat}</p>
              <p className="text-[10px] text-gray-400">{statLabel}</p>
            </div>
          )}
        </div>
        <h3 className="text-lg font-bold mb-2 text-white">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>

        {/* Expand indicator */}
        <button className="mt-3 text-xs text-govres-green font-medium flex items-center gap-1 hover:underline">
          {open ? 'Less detail' : 'Learn more'}
          <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded detail panel */}
      {open && (
        <div className="px-7 pb-7 pt-0 border-t border-white/10">
          <ul className="mt-4 space-y-2">
            {details.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                <svg className="w-4 h-4 text-govres-green shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── Step Card ──────────────────────────────────────────── */

function StepCard({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="relative pl-16">
      <div className="absolute left-0 top-0 w-11 h-11 rounded-full bg-govres-gold text-govres-navy flex items-center justify-center font-bold text-lg shadow-md">
        {n}
      </div>
      <h4 className="text-base font-bold text-white mb-1">{title}</h4>
      <p className="text-sm text-gray-400 leading-relaxed">{text}</p>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────── */

export function LandingPage() {
  const { data: reserves } = useQuery({
    queryKey: ['landing-reserves'],
    queryFn: dashboardAPI.reserves,
    refetchInterval: 60_000,
    retry: false,
  });

  const { data: metrics } = useQuery({
    queryKey: ['landing-metrics'],
    queryFn: dashboardAPI.metrics,
    refetchInterval: 60_000,
    retry: false,
  });

  const r = reserves?.data;
  const m = metrics?.data;

  return (
    <div className="min-h-screen bg-[#0D0D14]">
      <Navbar />

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative pt-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-govres-navy via-[0a1628] to-govres-blue" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative max-w-7xl mx-auto px-6 py-28 lg:py-36">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 rounded-full bg-govres-gold animate-pulse" />
              <span className="text-xs text-gray-300 font-medium tracking-wide">
                Bank of Ghana Digital Infrastructure
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Ghana's Sovereign{' '}
              <span className="text-govres-gold">Reserve & Settlement</span>{' '}
              Ledger
            </h1>

            <p className="mt-6 text-lg text-gray-300 leading-relaxed max-w-2xl">
              GOVRES converts Ghana's gold and cocoa reserves into programmable,
              asset-backed digital settlement instruments — enabling instant farmer
              payments, transparent government spending, and diaspora investment
              without unbacked currency printing.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 bg-govres-gold text-govres-navy rounded-xl text-base font-bold hover:bg-yellow-400 transition-colors shadow-lg shadow-govres-gold/20"
              >
                View Live Dashboard
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white rounded-xl text-base font-semibold hover:bg-white/10 transition-colors"
              >
                Portal Sign In
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-14 flex flex-wrap gap-8 text-gray-400 text-xs">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-govres-green" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Bank of Ghana Act 612 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-govres-green" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Oracle-Attested Reserves</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-govres-green" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>eCedi CBDC Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="relative">
          <svg className="w-full h-16 text-[#0D0D14]" viewBox="0 0 1200 60" preserveAspectRatio="none">
            <path d="M0 60V30Q300 0 600 30T1200 30V60Z" fill="currentColor" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════ LIVE STATS BAR ═══════════════════ */}
      <section className="bg-[#0D0D14] -mt-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-govres-gold">{fmt(r?.goldReserve?.totalOunces) ?? '—'}</p>
              <p className="text-xs text-gray-500 mt-1">Gold Reserve (oz)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{fmt(r?.cocoaReserve?.totalTonnes) ?? '—'}</p>
              <p className="text-xs text-gray-500 mt-1">Cocoa Reserve (MT)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{fmtCedi(r?.gbdcCirculation?.totalValue) ?? '—'}</p>
              <p className="text-xs text-gray-500 mt-1">GBDC in Circulation</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{fmt(m?.totalTransactions) ?? '—'}</p>
              <p className="text-xs text-gray-500 mt-1">Settlement Transactions</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ SERVICES ═══════════════════ */}
      <section id="services" className="bg-[#0a0e1a] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-govres-gold uppercase tracking-widest mb-2">Services</p>
            <h2 className="text-3xl font-extrabold text-white">
              Digital Instruments & Portals
            </h2>
            <p className="mt-3 text-gray-400 max-w-2xl mx-auto text-sm">
              GOVRES provides role-based access to Ghana's programmable settlement infrastructure,
              connecting the Bank of Ghana, commercial banks, farmers, contractors, agencies, and the diaspora.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ServiceCard
              icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
              title="Gold-Backed Digital Cedi (GBDC)"
              description="Digital settlement certificates backed by verified gold held in BoG vaults. Enables government spending without unbacked printing."
              color="bg-govres-gold"
              stat={fmtCedi(r?.gbdcCirculation?.totalValue)}
              statLabel="In Circulation"
              details={[
                `Each GBDC unit is mathematically tied to a verified portion of Ghana's gold reserves`,
                'Oracle-attested gold weight, purity, and location updated in real time',
                'Used for government project disbursements, contractor payments, and interbank settlement',
                'Fully redeemable — convertible to eCedi or commercial bank cedi at par value',
                'Prevents unbacked currency expansion while unlocking reserve value',
              ]}
            />
            <ServiceCard
              icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>}
              title="Cocoa Receipt Digital Notes (CRDN)"
              description="Digital notes issued at farm-gate delivery, backed 1:1 by Cocobod warehouse receipts. Convertible to eCedi or GBDC."
              color="bg-yellow-700"
              stat={fmt(r?.cocoaReserve?.totalTonnes)}
              statLabel="Tonnes Verified"
              details={[
                'Issued instantly at licensed buying company (LBC) weigh-stations upon cocoa delivery',
                'Each note cryptographically linked to a Cocobod warehouse receipt ID and lot number',
                'Farmers receive immediate value — no 30–90 day payment delays',
                'CRDNs can be converted to GBDC for government settlement or eCedi for mobile money',
                `Eliminates Cocobod's pre-export financing dependency and reduces USD borrowing`,
              ]}
            />
            <ServiceCard
              icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              title="eCedi CBDC Bridge"
              description="Smart routing between GBDC, CRDN, and Ghana's future retail eCedi — enabling last-mile mobile money payouts."
              color="bg-govres-green"
              stat={fmt(m?.settlementsCompleted)}
              statLabel="Settlements"
              details={[
                'Two-way bridge: GBDC/CRDN ↔ eCedi at BoG-mandated exchange rates',
                'Enables mobile money payouts to unbanked farmers and micro-contractors',
                `Designed to integrate with the Bank of Ghana's upcoming retail CBDC rails`,
                'Programmable routing rules ensure settlement finality in under 3 seconds',
                'Supports conditional payments — funds released only when project milestones are verified',
              ]}
            />
            <ServiceCard
              icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
              title="Bank Settlement Portal"
              description="Interbank GBDC settlement, contractor disbursement, and real-time reserve position monitoring for commercial banks."
              color="bg-govres-blue"
              stat={fmt(m?.activeAccounts)}
              statLabel="Active Accounts"
              details={[
                'Real-time GBDC balance and settlement position dashboard for each commercial bank',
                'Initiate interbank GBDC transfers with instant finality — no overnight batch cycles',
                'Disburse contractor payments from government project escrow with auditable trails',
                'View reserve-backing ratios and compliance status at a glance',
                'Full integration with existing GhIPSS and ACH settlement infrastructure',
              ]}
            />
            <ServiceCard
              icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
              title="Government Agency Portal"
              description="Submit infrastructure projects, track milestone approvals, and monitor GBDC fund disbursement — all on-ledger."
              color="bg-purple-600"
              stat={fmt(m?.totalTransactions)}
              statLabel="Transactions"
              details={[
                'Submit project proposals with milestones, budgets, and contractor assignments',
                'BoG reviews and approves GBDC allocation — funds are escrowed on-ledger',
                'Milestone completion triggers automatic partial disbursement to contractors',
                'Full audit trail: who approved, when, and how much was released',
                'Reduces corruption risk — every cedi of government spending is traceable',
              ]}
            />
            <ServiceCard
              icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              title="Diaspora Investment Gateway"
              description="Invest in gold-backed yield notes and remit via eCedi — with full transparency into Ghana's reserve backing."
              color="bg-govres-red"
              stat={fmt(r?.goldReserve?.totalOunces)}
              statLabel="Gold (oz) backing"
              details={[
                'Purchase gold-backed yield notes denominated in GBDC — earn returns tied to gold appreciation',
                'Remit eCedi directly to family in Ghana with instant settlement and low fees',
                'Full visibility into reserve backing — view real-time oracle attestations',
                `KYC-verified accounts with compliance to Ghana's Payment Systems Act 987`,
                'No currency speculation — all instruments backed by verified physical assets',
              ]}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section id="how-it-works" className="bg-[#0D0D14] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — text */}
            <div>
              <p className="text-sm font-semibold text-govres-gold uppercase tracking-widest mb-2">How It Works</p>
              <h2 className="text-3xl font-extrabold text-white mb-8">
                Asset-Backed, Oracle-Verified
              </h2>

              <div className="space-y-8">
                <StepCard
                  n={1}
                  title="Physical Assets Stay Put"
                  text="Gold remains in BoG vaults. Cocoa stays in Cocobod warehouses. No asset is sold or moved to create liquidity."
                />
                <StepCard
                  n={2}
                  title="Oracle Attestation"
                  text="IoT sensors and independent audits continuously verify asset weight, quality, and location. Hash-chained attestations are recorded on the ledger."
                />
                <StepCard
                  n={3}
                  title="Digital Instruments Issued"
                  text="The Bank of Ghana mints GBDC or the LBC issues CRDN — each unit mathematically linked to a portion of verified reserves."
                />
                <StepCard
                  n={4}
                  title="Settlement & Conversion"
                  text="Instruments settle instantly between banks, farmers, contractors, and agencies — convertible to eCedi or mobile money at any time."
                />
              </div>
            </div>

            {/* Right — architecture diagram */}
            <div className="bg-gradient-to-br from-govres-navy to-govres-blue rounded-2xl p-8 text-white shadow-xl">
              <h3 className="text-sm font-semibold text-govres-gold uppercase tracking-widest mb-6">System Architecture</h3>
              <div className="space-y-4 font-mono text-sm">
                <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                  <p className="text-govres-gold font-bold text-xs mb-2">LAYER 3 — Financial Access</p>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    React Portals: BoG Admin, Banks, Farmers, Contractors, Agencies, Diaspora
                  </p>
                </div>
                <div className="flex justify-center">
                  <svg className="w-5 h-5 text-govres-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                  <p className="text-govres-gold font-bold text-xs mb-2">LAYER 2 — Reserve Ledger</p>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Permissioned ledger, GBDC/CRDN lifecycle, settlement engine, compliance
                  </p>
                </div>
                <div className="flex justify-center">
                  <svg className="w-5 h-5 text-govres-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                  <p className="text-govres-gold font-bold text-xs mb-2">LAYER 1 — Asset Attestation</p>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Gold vault IoT, Cocobod warehouse sensors, GoldBod royalty feeds, hash-chain proofs
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-3 text-center text-xs text-gray-400">
                <div>
                  <p className="text-govres-gold font-bold text-lg">{fmt(m?.blockHeight) ?? '—'}</p>
                  <p>Blocks</p>
                </div>
                <div>
                  <p className="text-govres-gold font-bold text-lg">{fmt(m?.activeAccounts) ?? '—'}</p>
                  <p>Accounts</p>
                </div>
                <div>
                  <p className="text-govres-gold font-bold text-lg">{fmt(m?.settlementsCompleted) ?? '—'}</p>
                  <p>Settlements</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ ABOUT / WHY ═══════════════════ */}
      <section id="about" className="bg-[#0a0e1a] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-govres-gold uppercase tracking-widest mb-2">About</p>
            <h2 className="text-3xl font-extrabold text-white">
              Why Ghana Needs GOVRES
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-[#1A1A2E] rounded-2xl p-7 shadow-sm border border-white/10">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-govres-red" />
                Gold Reserve Paradox
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Ghana exports ~$20B in gold annually, yet reserves are sold off in liquidity crises.
                GOVRES keeps gold secured while unlocking its value as settlement backing.
              </p>
            </div>
            <div className="bg-[#1A1A2E] rounded-2xl p-7 shadow-sm border border-white/10">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-700" />
                Cocoa Debt Trap
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Cocobod owes ~GH₵32.9B, delaying farmer payments and forcing USD borrowing.
                CRDN instruments ensure farmers are paid instantly at delivery.
              </p>
            </div>
            <div className="bg-[#1A1A2E] rounded-2xl p-7 shadow-sm border border-white/10">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-govres-gold" />
                Asset-Poor Financing
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Ghana's economy is financed as if reserves don't exist.
                GOVRES converts physical assets into live settlement backing.
              </p>
            </div>
            <div className="bg-[#1A1A2E] rounded-2xl p-7 shadow-sm border border-white/10">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-govres-blue" />
                Trust & Transparency
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Lack of real-time visibility fuels speculation and cedi volatility.
                GOVRES provides a public dashboard with oracle-verified proof of reserves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA BANNER ═══════════════════ */}
      <section className="bg-gradient-to-r from-govres-navy to-govres-blue">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            Explore Ghana's Reserve Transparency
          </h2>
          <p className="text-gray-300 text-sm max-w-xl mx-auto mb-8">
            View real-time reserve data on the public dashboard, or sign in to your
            role-specific portal to access settlement instruments.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-govres-gold text-govres-navy rounded-xl text-sm font-bold hover:bg-yellow-400 transition-colors"
            >
              Public Dashboard
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-white/30 text-white rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="bg-govres-navy border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-govres-gold flex items-center justify-center font-bold text-govres-navy text-sm">
                  G
                </div>
                <span className="text-lg font-bold text-white">
                  GOV<span className="text-govres-gold">RES</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Bank of Ghana — Government Reserve & Settlement Ledger.
                Programmable, asset-backed sovereign infrastructure.
              </p>
            </div>

            {/* Instruments */}
            <div>
              <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-3">Instruments</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>Gold-Backed Digital Cedi (GBDC)</li>
                <li>Cocoa Receipt Digital Notes (CRDN)</li>
                <li>eCedi CBDC Bridge</li>
                <li>Yield Notes</li>
              </ul>
            </div>

            {/* Portals */}
            <div>
              <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-3">Portals</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li><Link to="/login" className="hover:text-govres-gold transition-colors">BoG Admin</Link></li>
                <li><Link to="/login" className="hover:text-govres-gold transition-colors">Commercial Bank</Link></li>
                <li><Link to="/login" className="hover:text-govres-gold transition-colors">Farmer / LBC</Link></li>
                <li><Link to="/login" className="hover:text-govres-gold transition-colors">Contractor</Link></li>
                <li><Link to="/login" className="hover:text-govres-gold transition-colors">Government Agency</Link></li>
                <li><Link to="/login" className="hover:text-govres-gold transition-colors">Diaspora</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-3">Compliance</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>Bank of Ghana Act 612</li>
                <li>Payment Systems Act 987</li>
                <li>GoldBod & Cocobod Mandates</li>
                <li>VASP Act 2025</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Bank of Ghana — No. 1 Thorpe Road, Accra, Ghana
            </p>
            <div className="flex gap-6 text-xs text-gray-500">
              <Link to="/dashboard" className="hover:text-govres-gold transition-colors">Dashboard</Link>
              <a href="https://github.com/ejay100/govres" target="_blank" rel="noopener noreferrer" className="hover:text-govres-gold transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
