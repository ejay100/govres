/**
 * GOVRES — Simulation Demo Dashboard
 * 
 * Interactive overview demonstrating how the GOVRES system works:
 * - Money creation (GBDC minting backed by gold)
 * - Contractor disbursements
 * - Farmer CRDN issuance & conversion
 * - 5-year historical cocoa & gold data feed
 * - Full KPI metrics
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { dashboardAPI } from '../lib/api';

/* ── Formatters ─────────────────────────────────────────── */

const fmt = (n: number | undefined) =>
  n != null ? new Intl.NumberFormat('en-GH').format(n) : '—';
const fmtCedi = (n: number | undefined) =>
  n != null ? `GH₵ ${new Intl.NumberFormat('en-GH', { minimumFractionDigits: 0 }).format(n)}` : '—';
const fmtB = (n: number | undefined) =>
  n != null ? `GH₵ ${(n / 1e9).toFixed(2)}B` : '—';
const fmtM = (n: number | undefined) =>
  n != null ? `GH₵ ${(n / 1e6).toFixed(1)}M` : '—';
const fmtUSD = (n: number | undefined) =>
  n != null ? `$${new Intl.NumberFormat('en-US').format(n)}` : '—';
const fmtPct = (n: number | undefined) =>
  n != null ? `${n.toFixed(1)}%` : '—';

/* ── KPI Card ───────────────────────────────────────────── */

function KPICard({ label, value, sub, icon, color }: {
  label: string; value: string; sub?: string; icon: React.ReactNode; color: string;
}) {
  return (
    <div className={`bg-[#1A1A2E] rounded-xl p-5 shadow-sm border border-white/10 ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-1 text-white">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className="text-2xl opacity-60">{icon}</div>
      </div>
    </div>
  );
}

/* ── Flow Step ──────────────────────────────────────────── */

function FlowStep({ step, title, description, active }: {
  step: number; title: string; description: string; active: boolean;
}) {
  return (
    <div className={`flex items-start gap-4 p-4 rounded-lg transition-all ${active ? 'bg-govres-gold/10 border border-govres-gold/30' : 'bg-[#1A1A2E]'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${active ? 'bg-govres-gold text-govres-navy' : 'bg-white/10 text-gray-400'}`}>
        {step}
      </div>
      <div>
        <h4 className={`font-semibold text-sm ${active ? 'text-govres-gold' : 'text-white'}`}>{title}</h4>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

/* ── Bar Chart (Pure CSS) ───────────────────────────────── */

function BarChart({ data, labelKey, valueKey, color, prefix }: {
  data: Array<Record<string, any>>; labelKey: string; valueKey: string; color: string; prefix?: string;
}) {
  const maxVal = Math.max(...data.map(d => d[valueKey]));
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-12 text-right shrink-0">{d[labelKey]}</span>
          <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
            <div
              className={`h-full ${color} rounded-full flex items-center justify-end px-2 transition-all duration-500`}
              style={{ width: `${(d[valueKey] / maxVal) * 100}%` }}
            >
              <span className="text-[10px] font-semibold text-white whitespace-nowrap">
                {prefix ?? ''}{fmt(d[valueKey])}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Mini Spark Line (CSS) ──────────────────────────────── */

function SparkLine({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  return (
    <div className="flex items-end gap-px h-12">
      {data.map((v, i) => (
        <div
          key={i}
          className={`${color} rounded-t-sm flex-1 min-w-[2px] transition-all`}
          style={{ height: `${((v - min) / range) * 100}%`, minHeight: '4px' }}
          title={`${v}`}
        />
      ))}
    </div>
  );
}

/* ── Tab Button ─────────────────────────────────────────── */

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active ? 'bg-govres-gold text-govres-navy' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

/* ── Main Component ─────────────────────────────────────── */

export function SimulationDashboard() {
  const [activeFlowStep, setActiveFlowStep] = useState(0);
  const [histTab, setHistTab] = useState<'cocoa' | 'gold' | 'macro'>('cocoa');

  // Fetch simulation data
  const { data: simData, isLoading: simLoading, refetch: rerunSim } = useQuery({
    queryKey: ['simulation-demo'],
    queryFn: dashboardAPI.simulation,
    refetchOnWindowFocus: false,
  });

  // Fetch historical data
  const { data: histData, isLoading: histLoading } = useQuery({
    queryKey: ['historical-feed'],
    queryFn: dashboardAPI.historical,
    refetchOnWindowFocus: false,
  });

  // Fetch live reserves
  const { data: reserves } = useQuery({
    queryKey: ['sim-reserves'],
    queryFn: dashboardAPI.reserves,
    refetchInterval: 30_000,
  });

  const sim = simData?.data?.data;
  const hist = histData?.data?.data;
  const res = reserves?.data?.data;

  // Prepare chart data from historical
  const cocoaYearChart = useMemo(() => {
    if (!hist?.cocoa) return [];
    const years = [2020, 2021, 2022, 2023, 2024, 2025];
    return years.map(y => {
      const yd = hist.cocoa.filter((d: any) => d.year === y);
      return { year: y, avgPrice: Math.round(yd.reduce((s: number, d: any) => s + d.worldPriceUSD, 0) / yd.length) };
    });
  }, [hist]);

  const goldYearChart = useMemo(() => {
    if (!hist?.gold) return [];
    const years = [2020, 2021, 2022, 2023, 2024, 2025];
    return years.map(y => {
      const yd = hist.gold.filter((d: any) => d.year === y);
      return { year: y, avgPrice: Math.round(yd.reduce((s: number, d: any) => s + d.pricePerOzUSD, 0) / yd.length) };
    });
  }, [hist]);

  const cocoaSpark = useMemo(() => hist?.cocoa?.map((d: any) => d.worldPriceUSD) || [], [hist]);
  const goldSpark = useMemo(() => hist?.gold?.map((d: any) => d.pricePerOzUSD) || [], [hist]);
  const fxSpark = useMemo(() => hist?.macro?.map((d: any) => d.exchangeRateUSDGHS) || [], [hist]);

  // Auto-cycle flow steps
  React.useEffect(() => {
    const timer = setInterval(() => setActiveFlowStep(s => (s + 1) % 6), 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0D14]">
      <Navbar />

      {/* Hero */}
      <header className="pt-16 bg-gradient-to-r from-govres-black via-govres-navy to-govres-blue text-white">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">
                <span className="text-govres-gold">GOVRES</span>{' '}
                <span className="font-normal">Simulation Demo</span>
              </h1>
              <p className="mt-2 text-gray-300 text-sm max-w-xl">
                Interactive demonstration of Ghana's Government Reserve & Settlement Ledger —
                showing money creation, contractor payments, farmer receipts, and 5-year economic data.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => rerunSim()}
                className="px-5 py-2.5 bg-govres-gold text-govres-navy rounded-lg text-sm font-semibold hover:bg-yellow-400 transition-colors"
              >
                ▶ Run Simulation
              </button>
              <Link
                to="/dashboard"
                className="px-5 py-2.5 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
              >
                Live Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* ══════════════════════════════════════════════════════
            Section 1: KPI Overview
            ══════════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
            <span className="text-govres-gold">■</span> Key Performance Indicators
          </h2>
          {simLoading ? (
            <div className="text-center py-12 text-gray-500">Running simulation…</div>
          ) : sim ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <KPICard
                label="GBDC Minted"
                value={fmtB(sim.kpis.totalGBDCMinted)}
                sub="Gold-backed digital cedi"
                icon={<span>🏦</span>}
                color="border-l-4 border-l-govres-gold"
              />
              <KPICard
                label="Effective Liquidity"
                value={fmtB(sim.kpis.effectiveLiquidity)}
                sub={`× ${sim.kpis.moneyMultiplier} multiplier`}
                icon={<span>💰</span>}
                color="border-l-4 border-l-blue-500"
              />
              <KPICard
                label="Contractors Paid"
                value={fmtM(sim.kpis.totalContractorDisbursed)}
                sub={`${sim.projects.length} projects`}
                icon={<span>🏗️</span>}
                color="border-l-4 border-l-green-500"
              />
              <KPICard
                label="CRDN Issued"
                value={fmtM(sim.kpis.totalCRDNValue)}
                sub={`${sim.kpis.totalFarmersServed} farmers`}
                icon={<span>🌿</span>}
                color="border-l-4 border-l-yellow-600"
              />
              <KPICard
                label="Reserve Ratio"
                value={sim.kpis.reserveBackingRatio?.toFixed(2) + 'x'}
                sub="Asset-to-liability"
                icon={<span>🛡️</span>}
                color="border-l-4 border-l-purple-500"
              />
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">Click "Run Simulation" to start</div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════
            Section 2: How It Works — Money Flow
            ══════════════════════════════════════════════════════ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <span className="text-govres-gold">■</span> How GOVRES Creates Money
            </h2>
            <div className="space-y-3">
              <FlowStep step={1} active={activeFlowStep === 0}
                title="Gold Reserve Verification"
                description="Physical gold bars in BoG vaults verified by IoT sensors & assay reports. Oracle generates attestation." />
              <FlowStep step={2} active={activeFlowStep === 1}
                title="GBDC Minting (Money Printing)"
                description="Bank of Ghana mints GBDC backed by 10% of gold reserves. GH₵4.15B capacity." />
              <FlowStep step={3} active={activeFlowStep === 2}
                title="Banking Multiplier Effect"
                description="GBDC flows through commercial banks via 2.5× multiplier → GH₵10.4B effective liquidity." />
              <FlowStep step={4} active={activeFlowStep === 3}
                title="Contractor Disbursement"
                description="Government agencies disburse GBDC to infrastructure contractors (roads, hospitals, energy)." />
              <FlowStep step={5} active={activeFlowStep === 4}
                title="CRDN Issuance (Cocoa Receipts)"
                description="Farmers deliver cocoa → LBC weighs → Oracle attestation → CRDN digital receipt issued." />
              <FlowStep step={6} active={activeFlowStep === 5}
                title="Settlement & Cashout"
                description="Contractors redeem via bank settlement. Farmers convert CRDN to cedi via MoMo within 24hrs." />
            </div>
          </div>

          {/* Minting Breakdown */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <span className="text-govres-gold">■</span> GBDC Minting Breakdown
            </h2>
            {sim?.minting ? (
              <div className="bg-[#1A1A2E] rounded-xl p-6 border border-white/10 space-y-4">
                <BarChart
                  data={sim.minting.map((m: any) => ({ label: m.label, value: m.amount }))}
                  labelKey="label"
                  valueKey="value"
                  color="bg-govres-gold"
                  prefix="₵"
                />
                <div className="border-t border-white/10 pt-3 flex justify-between text-sm">
                  <span className="text-gray-400">Total Minted</span>
                  <span className="text-govres-gold font-bold">{fmtB(sim.kpis.totalGBDCMinted)}</span>
                </div>
              </div>
            ) : (
              <div className="bg-[#1A1A2E] rounded-xl p-12 border border-white/10 text-center text-gray-500">
                Run simulation to see minting data
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            Section 3: Contractor Projects
            ══════════════════════════════════════════════════════ */}
        {sim?.projects && (
          <section>
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <span className="text-govres-gold">■</span> Infrastructure Projects Funded
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sim.projects.map((p: any, i: number) => (
                <div key={i} className="bg-[#1A1A2E] rounded-xl p-5 border border-white/10">
                  <h3 className="text-sm font-semibold text-white">{p.name}</h3>
                  <p className="text-xl font-bold text-govres-gold mt-2">{fmtM(p.amount)}</p>
                  <p className="text-xs text-gray-500 mt-1">TX: {p.txId?.substring(0, 12)}…</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            Section 4: Farmer / Cocoa Season Stats
            ══════════════════════════════════════════════════════ */}
        {sim?.farmerStats && (
          <section>
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <span className="text-govres-gold">■</span> Cocoa Season 2025/2026 Simulation
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard label="Farmers Served" value={fmt(sim.farmerStats.totalFarmers)} sub="Digital CRDN receipts" icon={<span>👨‍🌾</span>} color="" />
              <KPICard label="Cocoa Bags" value={fmt(sim.farmerStats.totalBags)} sub="64kg standard bags" icon={<span>📦</span>} color="" />
              <KPICard label="CRDN Total Value" value={fmtM(sim.farmerStats.totalCrdnValue)} sub="Convertible to cedi" icon={<span>📜</span>} color="" />
              <KPICard label="Avg CRDN/Farmer" value={fmtCedi(sim.farmerStats.avgCrdnPerFarmer)} sub="Per farmer receipt" icon={<span>💳</span>} color="" />
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            Section 5: Historical Data Feed (5-Year)
            ══════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-govres-gold">■</span> 5-Year Economic Data Feed (2020–2025)
            </h2>
            <div className="flex gap-2">
              <Tab active={histTab === 'cocoa'} onClick={() => setHistTab('cocoa')}>Cocoa</Tab>
              <Tab active={histTab === 'gold'} onClick={() => setHistTab('gold')}>Gold</Tab>
              <Tab active={histTab === 'macro'} onClick={() => setHistTab('macro')}>Macro</Tab>
            </div>
          </div>

          {histLoading ? (
            <div className="text-center py-12 text-gray-500">Loading historical data…</div>
          ) : hist ? (
            <div className="space-y-6">
              {/* Summary cards */}
              {hist.summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard
                    label="Cocoa 5yr Avg"
                    value={fmtUSD(hist.summary.fiveYearAvgCocoaUSD) + '/t'}
                    sub={`${hist.summary.fiveYearCocoaPriceChange > 0 ? '+' : ''}${hist.summary.fiveYearCocoaPriceChange}% change`}
                    icon={<span>🍫</span>}
                    color={hist.summary.fiveYearCocoaPriceChange > 0 ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}
                  />
                  <KPICard
                    label="Gold 5yr Avg"
                    value={fmtUSD(hist.summary.fiveYearAvgGoldUSD) + '/oz'}
                    sub={`${hist.summary.fiveYearGoldPriceChange > 0 ? '+' : ''}${hist.summary.fiveYearGoldPriceChange}% change`}
                    icon={<span>🥇</span>}
                    color={hist.summary.fiveYearGoldPriceChange > 0 ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}
                  />
                  <KPICard
                    label="Latest FX Rate"
                    value={`₵${hist.summary.latestMacro?.exchangeRateUSDGHS}/USD`}
                    sub={`Policy rate: ${hist.summary.latestMacro?.policyRatePercent}%`}
                    icon={<span>💱</span>}
                    color=""
                  />
                  <KPICard
                    label="Data Points"
                    value={fmt(hist.summary.totalDataPoints)}
                    sub={`${hist.summary.dateRange.from} → ${hist.summary.dateRange.to}`}
                    icon={<span>📊</span>}
                    color=""
                  />
                </div>
              )}

              {/* Spark lines */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#1A1A2E] rounded-xl p-5 border border-white/10">
                  <p className="text-xs text-gray-400 mb-2">Cocoa World Price (USD/tonne)</p>
                  <SparkLine data={cocoaSpark} color="bg-yellow-500" />
                  <p className="text-right text-xs text-gray-500 mt-1">
                    Latest: {fmtUSD(hist.summary?.latestCocoa?.worldPriceUSD)}/t
                  </p>
                </div>
                <div className="bg-[#1A1A2E] rounded-xl p-5 border border-white/10">
                  <p className="text-xs text-gray-400 mb-2">Gold Price (USD/oz)</p>
                  <SparkLine data={goldSpark} color="bg-govres-gold" />
                  <p className="text-right text-xs text-gray-500 mt-1">
                    Latest: {fmtUSD(hist.summary?.latestGold?.pricePerOzUSD)}/oz
                  </p>
                </div>
                <div className="bg-[#1A1A2E] rounded-xl p-5 border border-white/10">
                  <p className="text-xs text-gray-400 mb-2">USD/GHS Exchange Rate</p>
                  <SparkLine data={fxSpark} color="bg-red-400" />
                  <p className="text-right text-xs text-gray-500 mt-1">
                    Latest: ₵{hist.summary?.latestMacro?.exchangeRateUSDGHS}/USD
                  </p>
                </div>
              </div>

              {/* Annual bar charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1A1A2E] rounded-xl p-6 border border-white/10">
                  <p className="text-sm font-semibold text-white mb-4">Cocoa — Annual Avg Price (USD/tonne)</p>
                  <BarChart data={cocoaYearChart} labelKey="year" valueKey="avgPrice" color="bg-yellow-600" prefix="$" />
                </div>
                <div className="bg-[#1A1A2E] rounded-xl p-6 border border-white/10">
                  <p className="text-sm font-semibold text-white mb-4">Gold — Annual Avg Price (USD/oz)</p>
                  <BarChart data={goldYearChart} labelKey="year" valueKey="avgPrice" color="bg-govres-gold" prefix="$" />
                </div>
              </div>

              {/* Detailed data table */}
              <div className="bg-[#1A1A2E] rounded-xl border border-white/10 overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 sticky top-0">
                      <tr>
                        {histTab === 'cocoa' && (
                          <>
                            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Date</th>
                            <th className="px-4 py-3 text-right text-xs text-gray-400 font-medium">World Price (USD/t)</th>
                            <th className="px-4 py-3 text-right text-xs text-gray-400 font-medium">Producer (GHS/bag)</th>
                            <th className="px-4 py-3 text-right text-xs text-gray-400 font-medium">Production (KT)</th>
                            <th className="px-4 py-3 text-right text-xs text-gray-400 font-medium">Export Rev ($M)</th>
                          </>
                        )}
                        {histTab === 'gold' && (
                          <>
                            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Date</th>
                            <th className="px-4 py-3 text-right text-xs text-gray-400 font-medium">Price (USD/oz)</th>
                            <th className="px-4 py-3 text-right text-xs text-gray-400 font-medium">Price (USD/g)</th>
                            <th className="px-4 py-3 text-right text-xs text-gray-400 font-medium">Production (Koz)</th>
                            <th className="px-4 py-3 text-right text-xs text-gray-400 font-medium">Royalty (₵M)</th>
                          </>
                        )}
                        {histTab === 'macro' && (
                          <>
                            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Date</th>
                            <th className="px-4 py-3 text-right text-xs text-gray-400 font-medium">USD/GHS</th>
                            <th className="px-4 py-3 text-right text-xs text-gray-400 font-medium">Policy Rate</th>
                            <th className="px-4 py-3 text-right text-xs text-gray-400 font-medium">Inflation</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {histTab === 'cocoa' && hist.cocoa?.slice().reverse().map((d: any, i: number) => (
                        <tr key={i} className="hover:bg-white/5">
                          <td className="px-4 py-2 text-gray-300">{d.date}</td>
                          <td className="px-4 py-2 text-right text-white font-medium">{fmtUSD(d.worldPriceUSD)}</td>
                          <td className="px-4 py-2 text-right text-gray-300">₵{fmt(d.producerPriceGHS)}</td>
                          <td className="px-4 py-2 text-right text-gray-300">{fmt(d.productionKTonnes)}</td>
                          <td className="px-4 py-2 text-right text-gray-300">${fmt(d.exportRevenueMillionUSD)}</td>
                        </tr>
                      ))}
                      {histTab === 'gold' && hist.gold?.slice().reverse().map((d: any, i: number) => (
                        <tr key={i} className="hover:bg-white/5">
                          <td className="px-4 py-2 text-gray-300">{d.date}</td>
                          <td className="px-4 py-2 text-right text-white font-medium">{fmtUSD(d.pricePerOzUSD)}</td>
                          <td className="px-4 py-2 text-right text-gray-300">${d.pricePerGramUSD.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right text-gray-300">{fmt(d.productionKOz)}</td>
                          <td className="px-4 py-2 text-right text-gray-300">₵{fmt(d.royaltyRevenueMillionGHS)}</td>
                        </tr>
                      ))}
                      {histTab === 'macro' && hist.macro?.slice().reverse().map((d: any, i: number) => (
                        <tr key={i} className="hover:bg-white/5">
                          <td className="px-4 py-2 text-gray-300">{d.date}</td>
                          <td className="px-4 py-2 text-right text-white font-medium">₵{d.exchangeRateUSDGHS.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right text-gray-300">{d.policyRatePercent}%</td>
                          <td className="px-4 py-2 text-right text-gray-300">{fmtPct(d.inflationPercent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">Historical data unavailable</div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════
            Section 6: Reserve Summary & System Status
            ══════════════════════════════════════════════════════ */}
        {sim?.reserveSummary && (
          <section>
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <span className="text-govres-gold">■</span> System Reserve Summary
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                label="Gold Reserve"
                value={`${fmt(sim.reserveSummary.goldReserveGrams)}g`}
                sub={`≈ ${fmt(Math.round(sim.reserveSummary.goldReserveGrams / 31.1035))} oz`}
                icon={<span>🪙</span>}
                color="border-l-4 border-l-govres-gold"
              />
              <KPICard
                label="Cocoa Reserve"
                value={`${fmt(sim.reserveSummary.cocoaReserveKg)} kg`}
                sub={`≈ ${fmt(Math.round(sim.reserveSummary.cocoaReserveKg / 1000))} tonnes`}
                icon={<span>🫘</span>}
                color="border-l-4 border-l-yellow-700"
              />
              <KPICard
                label="Chain Height"
                value={fmt(sim.reserveSummary.chainHeight)}
                sub={`${fmt(sim.reserveSummary.pendingTransactions)} pending`}
                icon={<span>⛓️</span>}
                color="border-l-4 border-l-blue-500"
              />
              <KPICard
                label="Total Accounts"
                value={fmt(sim.reserveSummary.accountCount)}
                sub="Registered on ledger"
                icon={<span>👥</span>}
                color="border-l-4 border-l-indigo-500"
              />
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            Section 7: Live Database Reserves (if connected)
            ══════════════════════════════════════════════════════ */}
        {res && (
          <section>
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <span className="text-govres-gold">■</span> Live Database Reserves
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                label="Gold (DB)"
                value={`${fmt(res.goldReserves?.totalWeightGrams)}g`}
                sub={`${fmt(res.goldReserves?.totalBars)} bars`}
                icon={<span>🏛️</span>}
                color=""
              />
              <KPICard
                label="Cocoa (DB)"
                value={`${fmt(res.cocoaReserves?.totalWeightKg)} kg`}
                sub={`${fmt(res.cocoaReserves?.totalBags)} bags`}
                icon={<span>🌾</span>}
                color=""
              />
              <KPICard
                label="GBDC Outstanding (DB)"
                value={fmtCedi(res.circulation?.totalGBDCOutstanding)}
                sub={`Redeemed: ${fmtCedi(res.circulation?.totalGBDCRedeemed)}`}
                icon={<span>💵</span>}
                color=""
              />
              <KPICard
                label="CRDN Outstanding (DB)"
                value={fmtCedi(res.circulation?.totalCRDNOutstanding)}
                sub={`Converted: ${fmtCedi(res.circulation?.totalCRDNConverted)}`}
                icon={<span>📋</span>}
                color=""
              />
            </div>
          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12 py-8 text-center text-xs text-gray-500">
        <p>
          GOVRES Simulation Demo — Bank of Ghana × COCOBOD × GoldBod — Open Source
          {' '}|{' '}
          <Link to="/" className="text-govres-gold hover:underline">Home</Link>
          {' '}|{' '}
          <Link to="/dashboard" className="text-govres-gold hover:underline">Live Dashboard</Link>
        </p>
      </footer>
    </div>
  );
}
