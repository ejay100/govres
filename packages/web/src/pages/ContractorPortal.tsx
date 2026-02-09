/**
 * GOVRES — Contractor Portal
 * Government project tracking, milestones, and payment history.
 */

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '../components/DashboardLayout';
import { projectAPI, ledgerAPI } from '../lib/api';
import { useAuth } from '../lib/auth';

const fmtCedi = (n: number | undefined) =>
  n != null ? `GH₵ ${new Intl.NumberFormat('en-GH', { minimumFractionDigits: 2 }).format(n)}` : '—';

export function ContractorPortal() {
  const { user } = useAuth();

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['my-projects'],
    queryFn: () => projectAPI.list(1),
  });

  const { data: historyData } = useQuery({
    queryKey: ['my-tx-history', user?.userId],
    queryFn: () => ledgerAPI.accountHistory(user!.userId, 1),
    enabled: !!user,
  });

  const projects = projectsData?.data?.projects ?? [];
  const txHistory = historyData?.data?.transactions ?? [];

  const totalBudget = projects.reduce((s: number, p: any) => s + (Number(p.total_budget_cedi) || 0), 0);
  const totalDisbursed = projects.reduce((s: number, p: any) => s + (Number(p.disbursed_cedi) || 0), 0);
  const activeCount = projects.filter((p: any) => p.status === 'APPROVED' || p.status === 'IN_PROGRESS').length;

  return (
    <DashboardLayout title="Contractor Portal">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-govres-green">
          <p className="text-xs text-gray-500 uppercase">Active Projects</p>
          <p className="text-2xl font-bold mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-govres-gold">
          <p className="text-xs text-gray-500 uppercase">Total Budget</p>
          <p className="text-2xl font-bold mt-1">{fmtCedi(totalBudget)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-blue-500">
          <p className="text-xs text-gray-500 uppercase">Disbursed</p>
          <p className="text-2xl font-bold mt-1">{fmtCedi(totalDisbursed)}</p>
          <p className="text-xs text-gray-400 mt-1">{totalBudget ? `${((totalDisbursed / totalBudget) * 100).toFixed(1)}%` : '—'}</p>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-4">My Projects</h2>
        {isLoading ? (
          <p className="text-gray-400 py-4">Loading projects…</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-400 py-4">No projects assigned to your account.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase border-b">
                <tr>
                  <th className="py-2 pr-3">Project</th>
                  <th className="py-2 pr-3">Region</th>
                  <th className="py-2 pr-3">Budget</th>
                  <th className="py-2 pr-3">Disbursed</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Milestones</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p: any) => (
                  <tr key={p.project_id} className="border-b last:border-0">
                    <td className="py-3 pr-3">
                      <p className="font-medium">{p.project_name}</p>
                      <p className="text-xs text-gray-400">{p.project_id?.slice(0, 12)}…</p>
                    </td>
                    <td className="py-3 pr-3">{p.region ?? '—'}</td>
                    <td className="py-3 pr-3">{fmtCedi(p.total_budget_cedi)}</td>
                    <td className="py-3 pr-3">{fmtCedi(p.disbursed_cedi)}</td>
                    <td className="py-3 pr-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        p.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        p.status === 'COMPLETED' ? 'bg-purple-100 text-purple-800' :
                        p.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>{p.status}</span>
                    </td>
                    <td className="py-3">
                      <p className="text-xs">{p.completed_milestones ?? 0} / {p.total_milestones ?? 0}</p>
                      <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1">
                        <div
                          className="h-1.5 bg-govres-green rounded-full"
                          style={{ width: `${p.total_milestones ? (p.completed_milestones / p.total_milestones) * 100 : 0}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Payment History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase border-b">
              <tr>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">TX ID</th>
                <th className="py-2 pr-3">Amount</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {txHistory.length === 0 ? (
                <tr><td colSpan={4} className="py-4 text-center text-gray-400">No payment records</td></tr>
              ) : (
                txHistory.map((tx: any) => (
                  <tr key={tx.transaction_id} className="border-b last:border-0">
                    <td className="py-2 pr-3 text-xs">{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{tx.transaction_id?.slice(0, 12)}…</td>
                    <td className="py-2 pr-3">{fmtCedi(tx.amount_cedi)}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        tx.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                        tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
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
