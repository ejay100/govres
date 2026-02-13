/**
 * GOVRES — Diaspora Portal
 * Investment overview, yield notes, and remittance-backed instruments.
 */

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '../components/DashboardLayout';
import { dashboardAPI, cbdcAPI, ledgerAPI } from '../lib/api';
import { useAuth } from '../lib/auth';

const fmtCedi = (n: number | undefined) =>
  n != null ? `GH₵ ${new Intl.NumberFormat('en-GH', { minimumFractionDigits: 2 }).format(n)}` : '—';
const fmt = (n: number | undefined) =>
  n != null ? new Intl.NumberFormat('en-GH').format(n) : '—';

export function DiasporaPortal() {
  const { user } = useAuth();

  const { data: reserveData } = useQuery({
    queryKey: ['diaspora-reserves'],
    queryFn: dashboardAPI.reserves,
    refetchInterval: 30_000,
  });

  const { data: ecediData } = useQuery({
    queryKey: ['ecedi-status'],
    queryFn: cbdcAPI.status,
  });

  const { data: txHistData } = useQuery({
    queryKey: ['diaspora-tx', user?.userId],
    queryFn: () => ledgerAPI.accountHistory(user!.userId, 1),
    enabled: !!user,
  });

  const r = reserveData?.data;
  const ecedi = ecediData?.data;
  const txHistory = txHistData?.data?.transactions ?? [];

  return (
    <DashboardLayout title="Diaspora Portal">
      {/* Investment Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1A1A2E] rounded-xl p-5 shadow-sm border-t-4 border-govres-gold">
          <p className="text-xs text-gray-400 uppercase">Gold Reserve</p>
          <p className="text-2xl font-bold text-white mt-1">{fmt(r?.goldReserve?.totalOunces)} oz</p>
          <p className="text-xs text-gray-400 mt-1">{fmtCedi(r?.goldReserve?.valueCedi)}</p>
        </div>
        <div className="bg-[#1A1A2E] rounded-xl p-5 shadow-sm border-t-4 border-yellow-700">
          <p className="text-xs text-gray-400 uppercase">Cocoa Reserve</p>
          <p className="text-2xl font-bold text-white mt-1">{fmt(r?.cocoaReserve?.totalTonnes)} MT</p>
          <p className="text-xs text-gray-400 mt-1">{fmtCedi(r?.cocoaReserve?.valueCedi)}</p>
        </div>
        <div className="bg-[#1A1A2E] rounded-xl p-5 shadow-sm border-t-4 border-govres-green">
          <p className="text-xs text-gray-400 uppercase">GBDC Circulation</p>
          <p className="text-2xl font-bold text-white mt-1">{fmtCedi(r?.gbdcCirculation?.totalValue)}</p>
        </div>
        <div className="bg-[#1A1A2E] rounded-xl p-5 shadow-sm border-t-4 border-blue-500">
          <p className="text-xs text-gray-400 uppercase">eCedi Volume</p>
          <p className="text-2xl font-bold text-white mt-1">{fmtCedi(ecedi?.totalVolume)}</p>
          <p className="text-xs text-gray-400 mt-1">{fmt(ecedi?.totalTransactions)} txns</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yield Notes Info */}
        <div className="bg-[#1A1A2E] rounded-xl p-6 shadow-sm border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Yield Notes</h2>
          <p className="text-sm text-gray-400 mb-4">
            Gold-backed yield notes allow diaspora investors to participate in Ghana's
            commodity-backed digital economy. Notes are denominated in GBDC and backed
            by verified gold reserves held at the Bank of Ghana vault in Accra.
          </p>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <div>
                <p className="font-medium text-sm text-white">Gold Yield Note – Series A</p>
                <p className="text-xs text-gray-400">12-month maturity • GBDC-denominated</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-900/40 text-emerald-400 font-medium">Active</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <div>
                <p className="font-medium text-sm text-white">Cocoa Seasonal Bond – Q4 2025</p>
                <p className="text-xs text-gray-400">6-month maturity • CRDN-backed</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-amber-900/40 text-amber-400 font-medium">Upcoming</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium text-sm text-white">Infrastructure Fund – Road Sector</p>
                <p className="text-xs text-gray-400">24-month maturity • GH₵-denominated</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-900/40 text-blue-400 font-medium">Open</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Yield note subscriptions available through registered Ghanaian banks and the eCedi platform.
          </p>
        </div>

        {/* eCedi Gateway */}
        <div className="bg-[#1A1A2E] rounded-xl p-6 shadow-sm border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">eCedi & Remittance Gateway</h2>
          <p className="text-sm text-gray-400 mb-4">
            Send remittances directly into Ghana's digital reserve system. Funds are converted to
            eCedi and can be redeemed via MoMo, bank transfer, or held as GBDC/CRDN instruments.
          </p>

          <div className="bg-[#222236] rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">eCedi Total Volume</span>
              <span className="font-medium text-white">{fmtCedi(ecedi?.totalVolume)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Active Transactions</span>
              <span className="font-medium text-white">{fmt(ecedi?.totalTransactions)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Exchange Rate (USD/GHS)</span>
              <span className="font-medium text-white">14.75</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Processing Time</span>
              <span className="font-medium text-white">{"< 30 seconds"}</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-emerald-900/30 rounded-lg text-sm text-emerald-400">
            Remittances through GOVRES benefit from zero FX markup and instant eCedi settlement.
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="mt-6 bg-[#1A1A2E] rounded-xl p-6 shadow-sm border border-white/10">
        <h2 className="text-lg font-semibold text-white mb-4">My Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase border-b border-white/10">
              <tr>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">TX ID</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Amount</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {txHistory.length === 0 ? (
                <tr><td colSpan={5} className="py-4 text-center text-gray-400">No transactions yet</td></tr>
              ) : (
                txHistory.map((tx: any) => (
                  <tr key={tx.transaction_id} className="border-b border-white/10 last:border-0">
                    <td className="py-2 pr-3 text-xs">{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{tx.transaction_id?.slice(0, 12)}…</td>
                    <td className="py-2 pr-3">{tx.transaction_type}</td>
                    <td className="py-2 pr-3">{fmtCedi(tx.amount_cedi)}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        tx.status === 'CONFIRMED' ? 'bg-emerald-900/40 text-emerald-400' :
                        tx.status === 'PENDING' ? 'bg-amber-900/40 text-amber-400' : 'bg-gray-800 text-gray-400'
                      }`}>{tx.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
