/**
 * GOVRES — Public Dashboard
 * Read-only overview of Ghana's Reserve & Settlement system.
 */

import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../components/Navbar';
import { dashboardAPI } from '../lib/api';

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${color}`}>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export function PublicDashboard() {
  const { data: reserves, isLoading: loadingReserves } = useQuery({
    queryKey: ['public-reserves'],
    queryFn: dashboardAPI.reserves,
    refetchInterval: 30_000,
  });

  const { data: metrics } = useQuery({
    queryKey: ['public-metrics'],
    queryFn: dashboardAPI.metrics,
    refetchInterval: 30_000,
  });

  const r = reserves?.data;
  const m = metrics?.data;

  const fmt = (n: number | undefined) =>
    n != null ? new Intl.NumberFormat('en-GH').format(n) : '—';
  const fmtCedi = (n: number | undefined) =>
    n != null ? `GH₵ ${new Intl.NumberFormat('en-GH', { minimumFractionDigits: 2 }).format(n)}` : '—';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <header className="pt-16 bg-gradient-to-r from-govres-black via-govres-navy to-govres-blue text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold">
            <span className="text-govres-gold">GOVRES</span>{' '}
            <span className="font-normal">Public Dashboard</span>
          </h1>
          <p className="mt-2 text-gray-300 text-sm">
            Ghana Government Reserve & Settlement Ledger — real-time reserve transparency
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {loadingReserves ? (
          <div className="text-center py-20 text-gray-400">Loading reserve data…</div>
        ) : (
          <>
            {/* Reserve Cards */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Reserve Backing</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Gold Reserve (oz)"
                  value={fmt(r?.goldReserve?.totalOunces)}
                  sub={fmtCedi(r?.goldReserve?.valueCedi)}
                  color="border-govres-gold"
                />
                <StatCard
                  label="Cocoa Reserve (MT)"
                  value={fmt(r?.cocoaReserve?.totalTonnes)}
                  sub={fmtCedi(r?.cocoaReserve?.valueCedi)}
                  color="border-yellow-700"
                />
                <StatCard
                  label="GBDC in Circulation"
                  value={fmt(r?.gbdcCirculation?.totalInstruments)}
                  sub={fmtCedi(r?.gbdcCirculation?.totalValue)}
                  color="border-govres-green"
                />
                <StatCard
                  label="CRDN Instruments"
                  value={fmt(r?.crdnCirculation?.totalInstruments)}
                  sub={fmtCedi(r?.crdnCirculation?.totalValue)}
                  color="border-govres-red"
                />
              </div>
            </section>

            {/* Monetary Metrics */}
            <section>
              <h2 className="text-lg font-semibold mb-4">System Metrics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Block Height" value={fmt(m?.blockHeight)} color="border-blue-500" />
                <StatCard label="Total Transactions" value={fmt(m?.totalTransactions)} color="border-indigo-500" />
                <StatCard label="Active Accounts" value={fmt(m?.activeAccounts)} color="border-purple-500" />
                <StatCard label="Settlements Completed" value={fmt(m?.settlementsCompleted)} color="border-green-500" />
              </div>
            </section>
          </>
        )}

        {/* Info Bar */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">About GOVRES</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            The Government Reserve & Settlement Ledger (GOVRES) is Ghana's permissioned settlement
            infrastructure, managed by the Bank of Ghana. It enables Gold-Backed Digital Certificates (GBDC),
            Cocoa Receipt Digital Notes (CRDN), and eCedi interoperability — all backed by independently verified
            physical reserves and oracle attestations.
          </p>
        </section>
      </main>

      <footer className="bg-govres-black text-gray-400 text-center py-6 text-xs">
        <p>© {new Date().getFullYear()} Bank of Ghana — No. 1 Thorpe Road, Accra</p>
      </footer>
    </div>
  );
}
