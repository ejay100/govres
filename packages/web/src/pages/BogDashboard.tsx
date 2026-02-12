/**
 * GOVRES — Bank of Ghana Admin Dashboard
 * Full reserve monitoring, oracle status, GBDC minting, and ledger view.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../components/DashboardLayout';
import { dashboardAPI, gbdcAPI, oracleAPI, ledgerAPI } from '../lib/api';

function StatCard({ label, value, sub, accent, bgAccent }: { label: string; value: string; sub?: string; accent: string; bgAccent?: string }) {
  return (
    <div className={`rounded-xl p-5 shadow-card border-l-4 ${accent} ${bgAccent || 'bg-white'} transition-shadow hover:shadow-card-hover`}>
      <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-2xl font-bold mt-2 text-gray-900">{value}</p>
      {sub && <p className="text-sm text-gray-500 mt-1 font-medium">{sub}</p>}
    </div>
  );
}

const fmt = (n: number | undefined) => n != null ? new Intl.NumberFormat('en-GH').format(n) : '—';
const fmtCedi = (n: number | undefined) =>
  n != null ? `GH₵ ${new Intl.NumberFormat('en-GH', { minimumFractionDigits: 2 }).format(n)}` : '—';

export function BogDashboard() {
  const qc = useQueryClient();

  // ── Data Queries ──
  const { data: reserves } = useQuery({ queryKey: ['reserves'], queryFn: dashboardAPI.reserves, refetchInterval: 15_000 });
  const { data: metrics } = useQuery({ queryKey: ['metrics'], queryFn: dashboardAPI.metrics, refetchInterval: 15_000 });
  const { data: goldData } = useQuery({ queryKey: ['gold-detail'], queryFn: dashboardAPI.gold });
  const { data: recentTx } = useQuery({ queryKey: ['recent-tx'], queryFn: () => ledgerAPI.recentTransactions() });
  const { data: ledgerStatus } = useQuery({ queryKey: ['ledger-status'], queryFn: ledgerAPI.status });

  const r = reserves?.data;
  const m = metrics?.data;
  const gold = goldData?.data;
  const txList = recentTx?.data?.transactions ?? [];
  const ls = ledgerStatus?.data;

  // ── Mint GBDC Form ──
  const [mintForm, setMintForm] = useState({ amountCedi: '', goldBackingGrams: '', description: '' });
  const mintMutation = useMutation({
    mutationFn: (data: { amountCedi: number; goldBackingGrams: number; description: string }) =>
      gbdcAPI.mint(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reserves'] });
      qc.invalidateQueries({ queryKey: ['recent-tx'] });
      setMintForm({ amountCedi: '', goldBackingGrams: '', description: '' });
    },
  });

  const handleMint = (e: React.FormEvent) => {
    e.preventDefault();
    mintMutation.mutate({
      amountCedi: Number(mintForm.amountCedi),
      goldBackingGrams: Number(mintForm.goldBackingGrams),
      description: mintForm.description || 'GBDC Mint — BoG Dashboard',
    });
  };

  return (
    <DashboardLayout title="BoG Admin Dashboard">
      {/* ── Top-level Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard label="Gold Reserve (oz)" value={fmt(r?.goldReserve?.totalOunces)} sub={fmtCedi(r?.goldReserve?.valueCedi)} accent="border-govres-gold" bgAccent="bg-govres-gold-light" />
        <StatCard label="Cocoa Reserve (MT)" value={fmt(r?.cocoaReserve?.totalTonnes)} sub={fmtCedi(r?.cocoaReserve?.valueCedi)} accent="border-govres-cocoa" bgAccent="bg-govres-cocoa-light" />
        <StatCard label="GBDC Circulation" value={fmt(r?.gbdcCirculation?.totalInstruments)} sub={fmtCedi(r?.gbdcCirculation?.totalValue)} accent="border-govres-green" bgAccent="bg-govres-green-light" />
        <StatCard label="CRDN Active" value={fmt(r?.crdnCirculation?.totalInstruments)} sub={fmtCedi(r?.crdnCirculation?.totalValue)} accent="border-govres-red" bgAccent="bg-govres-red-light" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Gold Detail & Oracle ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gold Summary */}
          <div className="bg-white rounded-xl p-6 shadow-card border border-gray-100">
            <h2 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-govres-gold rounded-full"></span>
              Gold Vault Summary
            </h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Bars</p>
                <p className="font-bold text-xl text-gray-900 mt-1">{fmt(gold?.totalBars)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Weight (oz)</p>
                <p className="font-bold text-xl text-gray-900 mt-1">{fmt(gold?.totalOunces)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Valuation</p>
                <p className="font-bold text-xl text-govres-green mt-1">{fmtCedi(gold?.valueCedi)}</p>
              </div>
            </div>
          </div>

          {/* Ledger Status */}
          <div className="bg-white rounded-xl p-6 shadow-card border border-gray-100">
            <h2 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-govres-blue rounded-full"></span>
              Ledger Status
            </h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-govres-blue-light rounded-lg">
                <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Block Height</p>
                <p className="font-bold text-xl text-govres-blue mt-1">{fmt(ls?.blockHeight)}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Transactions</p>
                <p className="font-bold text-xl text-gray-900 mt-1">{fmt(ls?.totalTransactions)}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Accounts</p>
                <p className="font-bold text-xl text-gray-900 mt-1">{fmt(ls?.activeAccounts)}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Status</p>
                <span className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full bg-green-600 text-white shadow-sm">Active</span>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl p-6 shadow-card border border-gray-100">
            <h2 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-govres-green rounded-full"></span>
              Recent Transactions
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-700">
                    <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider rounded-l-lg">TX ID</th>
                    <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider">Type</th>
                    <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider">Amount</th>
                    <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider rounded-r-lg">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {txList.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-400">No transactions yet</td></tr>
                  ) : (
                    txList.slice(0, 10).map((tx: any) => (
                      <tr key={tx.transaction_id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-gray-700">{tx.transaction_id?.slice(0, 12)}…</td>
                        <td className="py-3 px-4 font-medium text-gray-800">{tx.transaction_type}</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">{fmtCedi(tx.amount_cedi)}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            tx.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 ring-1 ring-green-200' :
                            tx.status === 'PENDING' ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'
                          }`}>{tx.status}</span>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar — Mint GBDC ── */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-card border border-gray-100">
            <h2 className="font-bold text-lg mb-5 text-gray-800 flex items-center gap-2">
              <span className="w-8 h-8 bg-govres-green-light rounded-lg flex items-center justify-center">
                <span className="text-govres-green font-bold text-sm">₵</span>
              </span>
              Mint GBDC
            </h2>
            <form onSubmit={handleMint} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (GH₵)</label>
                <input
                  type="number"
                  step="0.01"
                  value={mintForm.amountCedi}
                  onChange={e => setMintForm(p => ({ ...p, amountCedi: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-govres-green focus:border-govres-green transition-colors"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Gold Backing (grams)</label>
                <input
                  type="number"
                  step="0.001"
                  value={mintForm.goldBackingGrams}
                  onChange={e => setMintForm(p => ({ ...p, goldBackingGrams: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-govres-green focus:border-govres-green transition-colors"
                  placeholder="0.000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={mintForm.description}
                  onChange={e => setMintForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-govres-green focus:border-govres-green transition-colors"
                  placeholder="Issuance note"
                />
              </div>

              {mintMutation.isError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">{(mintMutation.error as any)?.response?.data?.error?.message || 'Mint failed'}</p>
                </div>
              )}
              {mintMutation.isSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">GBDC minted successfully ✓</p>
                </div>
              )}

              <button
                type="submit"
                disabled={mintMutation.isPending}
                className="w-full py-3 bg-govres-green text-white rounded-lg font-bold text-sm hover:bg-govres-green-dark transition-colors shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mintMutation.isPending ? 'Processing…' : 'Mint GBDC'}
              </button>
            </form>
          </div>

          {/* System Health */}
          <div className="bg-govres-navy rounded-xl p-6 shadow-card text-white">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              System Health
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-gray-300 text-sm">Block Height</span>
                <span className="font-bold text-govres-gold">{fmt(m?.blockHeight)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-gray-300 text-sm">Uptime</span>
                <span className="font-bold text-green-400">{m?.uptimeHours ? `${m.uptimeHours}h` : '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-gray-300 text-sm">Active Accounts</span>
                <span className="font-bold">{fmt(m?.activeAccounts)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-300 text-sm">Settlements</span>
                <span className="font-bold">{fmt(m?.settlementsCompleted)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
