/**
 * GOVRES — Commercial Bank Dashboard
 * Interbank settlements, contractor payments, GBDC/CRDN balances.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../components/DashboardLayout';
import { settlementAPI, gbdcAPI, crdnAPI } from '../lib/api';
import { useAuth } from '../lib/auth';
import { GHANAIAN_BANKS } from '@govres/shared';

const fmtCedi = (n: number | undefined) =>
  n != null ? `GH₵ ${new Intl.NumberFormat('en-GH', { minimumFractionDigits: 2 }).format(n)}` : '—';

export function BankDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // ── Queries ──
  const { data: circulationData } = useQuery({
    queryKey: ['gbdc-circulation'],
    queryFn: () => gbdcAPI.circulationSummary(),
  });
  const { data: bankSummary } = useQuery({
    queryKey: ['bank-summary', user?.userId],
    queryFn: () => settlementAPI.bankSummary(user!.userId),
    enabled: !!user,
    refetchInterval: 20_000,
  });

  const circ = circulationData?.data;
  const summary = bankSummary?.data;

  // ── Interbank Settlement Form ──
  const [settleForm, setSettleForm] = useState({
    counterpartyBankId: '',
    amountCedi: '',
    instrumentType: 'GBDC',
    description: '',
  });

  const interbankMutation = useMutation({
    mutationFn: (data: any) => settlementAPI.interbank(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank-summary'] });
      setSettleForm({ counterpartyBankId: '', amountCedi: '', instrumentType: 'GBDC', description: '' });
    },
  });

  const handleSettle = (e: React.FormEvent) => {
    e.preventDefault();
    interbankMutation.mutate({
      counterpartyBankId: settleForm.counterpartyBankId,
      amountCedi: Number(settleForm.amountCedi),
      instrumentType: settleForm.instrumentType,
      description: settleForm.description || 'Interbank settlement',
    });
  };

  // ── Contractor Payment Form ──
  const [payForm, setPayForm] = useState({ projectId: '', milestoneId: '', amountCedi: '' });

  const payMutation = useMutation({
    mutationFn: (data: any) => settlementAPI.contractorPayment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank-summary'] });
      setPayForm({ projectId: '', milestoneId: '', amountCedi: '' });
    },
  });

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    payMutation.mutate({
      projectId: payForm.projectId,
      milestoneId: payForm.milestoneId,
      amountCedi: Number(payForm.amountCedi),
    });
  };

  return (
    <DashboardLayout title="Bank Dashboard">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-govres-surface rounded-xl p-5 shadow-sm border-t-4 border-govres-green">
          <p className="text-xs text-gray-400 uppercase">GBDC Issued</p>
          <p className="text-2xl font-bold mt-1 text-white">{fmtCedi(circ?.activeValue)}</p>
          <p className="text-xs text-gray-500 mt-1">{circ?.activeCount ?? 0} instruments</p>
        </div>
        <div className="bg-govres-surface rounded-xl p-5 shadow-sm border-t-4 border-govres-gold">
          <p className="text-xs text-gray-400 uppercase">Settlements Today</p>
          <p className="text-2xl font-bold mt-1 text-white">{summary?.totalSettlements ?? '—'}</p>
        </div>
        <div className="bg-govres-surface rounded-xl p-5 shadow-sm border-t-4 border-blue-500">
          <p className="text-xs text-gray-400 uppercase">Net Position</p>
          <p className="text-2xl font-bold mt-1 text-white">{fmtCedi(summary?.netPosition)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Interbank Settlement ── */}
        <div className="bg-govres-surface rounded-xl p-6 shadow-sm border border-white/10">
          <h2 className="text-lg font-semibold mb-4 text-white">Interbank Settlement</h2>
          <form onSubmit={handleSettle} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Counterparty Bank</label>
              <select
                value={settleForm.counterpartyBankId}
                onChange={e => setSettleForm(p => ({ ...p, counterpartyBankId: e.target.value }))}
                className="w-full px-3 py-2 border border-white/10 bg-govres-surface-light rounded-lg text-sm text-white focus:ring-2 focus:ring-govres-green"
                required
              >
                <option value="">Select bank…</option>
                {(typeof GHANAIAN_BANKS !== 'undefined' ? GHANAIAN_BANKS : [
                  'Ghana Commercial Bank', 'Ecobank Ghana', 'Stanbic Bank',
                  'Fidelity Bank', 'CalBank', 'Access Bank',
                ]).map((b: any) => {
                  const name = typeof b === 'string' ? b : b.name;
                  return <option key={name} value={name}>{name}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Amount (GH₵)</label>
              <input
                type="number"
                step="0.01"
                value={settleForm.amountCedi}
                onChange={e => setSettleForm(p => ({ ...p, amountCedi: e.target.value }))}
                className="w-full px-3 py-2 border border-white/10 bg-govres-surface-light rounded-lg text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Instrument</label>
              <select
                value={settleForm.instrumentType}
                onChange={e => setSettleForm(p => ({ ...p, instrumentType: e.target.value }))}
                className="w-full px-3 py-2 border border-white/10 bg-govres-surface-light rounded-lg text-sm text-white"
              >
                <option value="GBDC">GBDC</option>
                <option value="CRDN">CRDN</option>
              </select>
            </div>

            {interbankMutation.isError && (
              <p className="text-sm text-red-600">{(interbankMutation.error as any)?.response?.data?.error?.message || 'Settlement failed'}</p>
            )}
            {interbankMutation.isSuccess && <p className="text-sm text-green-600">Settlement completed ✓</p>}

            <button type="submit" disabled={interbankMutation.isPending}
              className="w-full py-2.5 bg-govres-green text-white rounded-lg font-medium hover:bg-green-800 disabled:opacity-50">
              {interbankMutation.isPending ? 'Processing…' : 'Settle'}
            </button>
          </form>
        </div>

        {/* ── Contractor Payment ── */}
        <div className="bg-govres-surface rounded-xl p-6 shadow-sm border border-white/10">
          <h2 className="text-lg font-semibold mb-4 text-white">Contractor Payment</h2>
          <form onSubmit={handlePay} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Project ID</label>
              <input
                type="text"
                value={payForm.projectId}
                onChange={e => setPayForm(p => ({ ...p, projectId: e.target.value }))}
                className="w-full px-3 py-2 border border-white/10 bg-govres-surface-light rounded-lg text-sm text-white"
                placeholder="PROJECT-XXXX"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Milestone ID</label>
              <input
                type="text"
                value={payForm.milestoneId}
                onChange={e => setPayForm(p => ({ ...p, milestoneId: e.target.value }))}
                className="w-full px-3 py-2 border border-white/10 bg-govres-surface-light rounded-lg text-sm text-white"
                placeholder="MS-0001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Amount (GH₵)</label>
              <input
                type="number"
                step="0.01"
                value={payForm.amountCedi}
                onChange={e => setPayForm(p => ({ ...p, amountCedi: e.target.value }))}
                className="w-full px-3 py-2 border border-white/10 bg-govres-surface-light rounded-lg text-sm text-white"
                required
              />
            </div>

            {payMutation.isError && (
              <p className="text-sm text-red-600">{(payMutation.error as any)?.response?.data?.error?.message || 'Payment failed'}</p>
            )}
            {payMutation.isSuccess && <p className="text-sm text-green-600">Payment disbursed ✓</p>}

            <button type="submit" disabled={payMutation.isPending}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
              {payMutation.isPending ? 'Disbursing…' : 'Disburse Payment'}
            </button>
          </form>
        </div>
      </div>

      {/* Settlement History */}
      <div className="mt-6 bg-govres-surface rounded-xl p-6 shadow-sm border border-white/10">
        <h2 className="text-lg font-semibold mb-3 text-white">Settlement History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase border-b border-white/10">
              <tr>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Counterparty</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(summary?.recentSettlements ?? []).length === 0 ? (
                <tr><td colSpan={5} className="py-4 text-center text-gray-400">No settlements recorded</td></tr>
              ) : (
                (summary?.recentSettlements ?? []).map((s: any, i: number) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="py-2 pr-4 text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="py-2 pr-4 text-gray-300">{s.counterparty_bank || '—'}</td>
                    <td className="py-2 pr-4 text-white">{fmtCedi(s.amount_cedi)}</td>
                    <td className="py-2 pr-4 text-gray-300">{s.settlement_type}</td>
                    <td className="py-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 font-medium">{s.status}</span>
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
