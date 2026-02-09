/**
 * GOVRES — Bank of Ghana Admin Dashboard
 * Full reserve monitoring, oracle status, GBDC minting, and ledger view.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../components/DashboardLayout';
import { dashboardAPI, gbdcAPI, oracleAPI, ledgerAPI } from '../lib/api';

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm border-t-4 ${accent}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Gold Reserve (oz)" value={fmt(r?.goldReserve?.totalOunces)} sub={fmtCedi(r?.goldReserve?.valueCedi)} accent="border-govres-gold" />
        <StatCard label="Cocoa Reserve (MT)" value={fmt(r?.cocoaReserve?.totalTonnes)} sub={fmtCedi(r?.cocoaReserve?.valueCedi)} accent="border-yellow-700" />
        <StatCard label="GBDC Circulation" value={fmt(r?.gbdcCirculation?.totalInstruments)} sub={fmtCedi(r?.gbdcCirculation?.totalValue)} accent="border-govres-green" />
        <StatCard label="CRDN Active" value={fmt(r?.crdnCirculation?.totalInstruments)} sub={fmtCedi(r?.crdnCirculation?.totalValue)} accent="border-govres-red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Gold Detail & Oracle ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gold Summary */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Gold Vault Summary</h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Total Bars</p>
                <p className="font-bold text-lg">{fmt(gold?.totalBars)}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Weight (oz)</p>
                <p className="font-bold text-lg">{fmt(gold?.totalOunces)}</p>
              </div>
              <div>
                <p className="text-gray-500">Valuation</p>
                <p className="font-bold text-lg">{fmtCedi(gold?.valueCedi)}</p>
              </div>
            </div>
          </div>

          {/* Ledger Status */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-3">Ledger Status</h2>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Block Height</p>
                <p className="font-bold">{fmt(ls?.blockHeight)}</p>
              </div>
              <div>
                <p className="text-gray-500">Transactions</p>
                <p className="font-bold">{fmt(ls?.totalTransactions)}</p>
              </div>
              <div>
                <p className="text-gray-500">Accounts</p>
                <p className="font-bold">{fmt(ls?.activeAccounts)}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800">Active</span>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-3">Recent Transactions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase border-b">
                  <tr>
                    <th className="py-2 pr-4">TX ID</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {txList.length === 0 ? (
                    <tr><td colSpan={5} className="py-4 text-center text-gray-400">No transactions yet</td></tr>
                  ) : (
                    txList.slice(0, 10).map((tx: any) => (
                      <tr key={tx.transaction_id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-mono text-xs">{tx.transaction_id?.slice(0, 12)}…</td>
                        <td className="py-2 pr-4">{tx.transaction_type}</td>
                        <td className="py-2 pr-4">{fmtCedi(tx.amount_cedi)}</td>
                        <td className="py-2 pr-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            tx.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                            tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                          }`}>{tx.status}</span>
                        </td>
                        <td className="py-2 text-xs text-gray-400">{new Date(tx.created_at).toLocaleString()}</td>
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
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Mint GBDC</h2>
            <form onSubmit={handleMint} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (GH₵)</label>
                <input
                  type="number"
                  step="0.01"
                  value={mintForm.amountCedi}
                  onChange={e => setMintForm(p => ({ ...p, amountCedi: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-govres-green"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gold Backing (grams)</label>
                <input
                  type="number"
                  step="0.001"
                  value={mintForm.goldBackingGrams}
                  onChange={e => setMintForm(p => ({ ...p, goldBackingGrams: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-govres-green"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={mintForm.description}
                  onChange={e => setMintForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Issuance note"
                />
              </div>

              {mintMutation.isError && (
                <p className="text-sm text-red-600">{(mintMutation.error as any)?.response?.data?.error?.message || 'Mint failed'}</p>
              )}
              {mintMutation.isSuccess && (
                <p className="text-sm text-green-600">GBDC minted successfully ✓</p>
              )}

              <button
                type="submit"
                disabled={mintMutation.isPending}
                className="w-full py-2.5 bg-govres-green text-white rounded-lg font-medium hover:bg-green-800 transition disabled:opacity-50"
              >
                {mintMutation.isPending ? 'Processing…' : 'Mint GBDC'}
              </button>
            </form>
          </div>

          {/* System Uptime */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-3">System Health</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Block Height</span>
                <span className="font-medium">{fmt(m?.blockHeight)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Uptime</span>
                <span className="font-medium">{m?.uptimeHours ? `${m.uptimeHours}h` : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Active Accounts</span>
                <span className="font-medium">{fmt(m?.activeAccounts)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Settlements</span>
                <span className="font-medium">{fmt(m?.settlementsCompleted)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
