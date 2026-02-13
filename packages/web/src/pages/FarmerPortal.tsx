/**
 * GOVRES — Farmer Portal
 * CRDN instruments, conversion to eCedi, MoMo cashout.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../components/DashboardLayout';
import { crdnAPI, cbdcAPI, settlementAPI } from '../lib/api';
import { useAuth } from '../lib/auth';

const fmtCedi = (n: number | undefined) =>
  n != null ? `GH₵ ${new Intl.NumberFormat('en-GH', { minimumFractionDigits: 2 }).format(n)}` : '—';

export function FarmerPortal() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // ── CRDN Instruments ──
  const { data: crdnData, isLoading } = useQuery({
    queryKey: ['my-crdns', user?.userId],
    queryFn: () => crdnAPI.getByFarmer(user!.userId),
    enabled: !!user,
  });

  const { data: seasonData } = useQuery({
    queryKey: ['crdn-season'],
    queryFn: () => crdnAPI.getSeason(new Date().getFullYear().toString()),
  });

  const instruments = crdnData?.data?.instruments ?? [];
  const totals = crdnData?.data?.totals;
  const season = seasonData?.data;

  // ── Convert CRDN → eCedi ──
  const [convertId, setConvertId] = useState('');
  const convertMutation = useMutation({
    mutationFn: (data: { instrumentId: string; targetCurrency: string }) =>
      crdnAPI.convert(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-crdns'] });
      setConvertId('');
    },
  });

  // ── MoMo Cashout ──
  const [cashoutForm, setCashoutForm] = useState({ amountCedi: '', momoProvider: 'MTN', momoNumber: '' });
  const cashoutMutation = useMutation({
    mutationFn: (data: any) => settlementAPI.farmerCashout(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-crdns'] });
      setCashoutForm({ amountCedi: '', momoProvider: 'MTN', momoNumber: '' });
    },
  });

  const handleCashout = (e: React.FormEvent) => {
    e.preventDefault();
    cashoutMutation.mutate({
      amountCedi: Number(cashoutForm.amountCedi),
      momoProvider: cashoutForm.momoProvider,
      momoNumber: cashoutForm.momoNumber,
    });
  };

  return (
    <DashboardLayout title="Farmer Portal">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#1A1A2E] rounded-xl p-5 shadow-sm border-t-4 border-govres-green">
          <p className="text-xs text-gray-400 uppercase">My Active CRDNs</p>
          <p className="text-2xl font-bold text-white mt-1">{totals?.activeCount ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">{fmtCedi(totals?.activeValue)}</p>
        </div>
        <div className="bg-[#1A1A2E] rounded-xl p-5 shadow-sm border-t-4 border-govres-gold">
          <p className="text-xs text-gray-400 uppercase">Converted</p>
          <p className="text-2xl font-bold text-white mt-1">{totals?.convertedCount ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">{fmtCedi(totals?.convertedValue)}</p>
        </div>
        <div className="bg-[#1A1A2E] rounded-xl p-5 shadow-sm border-t-4 border-blue-500">
          <p className="text-xs text-gray-400 uppercase">Season Total</p>
          <p className="text-2xl font-bold text-white mt-1">{season?.totalInstruments ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">{fmtCedi(season?.totalValue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CRDN Instrument List */}
        <div className="lg:col-span-2 bg-[#1A1A2E] rounded-xl p-6 shadow-sm border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">My CRDN Instruments</h2>
          {isLoading ? (
            <p className="text-gray-400 py-4">Loading…</p>
          ) : instruments.length === 0 ? (
            <p className="text-gray-400 py-4">No CRDN instruments found for your account.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase border-b border-white/10">
                  <tr>
                    <th className="py-2 pr-3">ID</th>
                    <th className="py-2 pr-3">Value</th>
                    <th className="py-2 pr-3">Weight (MT)</th>
                    <th className="py-2 pr-3">Grade</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {instruments.map((inst: any) => (
                    <tr key={inst.instrument_id} className="border-b border-white/10 last:border-0">
                      <td className="py-2 pr-3 font-mono text-xs">{inst.instrument_id?.slice(0, 12)}…</td>
                      <td className="py-2 pr-3">{fmtCedi(inst.amount_cedi)}</td>
                      <td className="py-2 pr-3">{inst.cocoa_weight_mt ?? '—'}</td>
                      <td className="py-2 pr-3">{inst.cocoa_grade ?? '—'}</td>
                      <td className="py-2 pr-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          inst.status === 'ACTIVE' ? 'bg-emerald-900/40 text-emerald-400' :
                          inst.status === 'CONVERTED' ? 'bg-blue-900/40 text-blue-400' :
                          'bg-gray-800 text-gray-400'
                        }`}>{inst.status}</span>
                      </td>
                      <td className="py-2">
                        {inst.status === 'ACTIVE' && (
                          <button
                            onClick={() => convertMutation.mutate({ instrumentId: inst.instrument_id, targetCurrency: 'ECEDI' })}
                            disabled={convertMutation.isPending}
                            className="text-xs px-3 py-1 bg-govres-green text-white rounded-md hover:bg-green-800 disabled:opacity-50"
                          >
                            Convert
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {convertMutation.isSuccess && (
            <p className="text-sm text-green-600 mt-3">CRDN converted to eCedi ✓</p>
          )}
          {convertMutation.isError && (
            <p className="text-sm text-red-600 mt-3">Conversion failed. Try again.</p>
          )}
        </div>

        {/* MoMo Cashout */}
        <div className="bg-[#1A1A2E] rounded-xl p-6 shadow-sm border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">MoMo Cashout</h2>
          <form onSubmit={handleCashout} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Amount (GH₵)</label>
              <input
                type="number"
                step="0.01"
                value={cashoutForm.amountCedi}
                onChange={e => setCashoutForm(p => ({ ...p, amountCedi: e.target.value }))}
                className="w-full px-3 py-2 border border-white/10 bg-[#222236] text-white rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Provider</label>
              <select
                value={cashoutForm.momoProvider}
                onChange={e => setCashoutForm(p => ({ ...p, momoProvider: e.target.value }))}
                className="w-full px-3 py-2 border border-white/10 bg-[#222236] text-white rounded-lg text-sm"
              >
                <option value="MTN">MTN Mobile Money</option>
                <option value="VODAFONE">Vodafone Cash</option>
                <option value="AIRTELTIGO">AirtelTigo Money</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
              <input
                type="tel"
                value={cashoutForm.momoNumber}
                onChange={e => setCashoutForm(p => ({ ...p, momoNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-white/10 bg-[#222236] text-white rounded-lg text-sm"
                placeholder="024 XXX XXXX"
                required
              />
            </div>

            {cashoutMutation.isError && <p className="text-sm text-red-600">Cashout failed</p>}
            {cashoutMutation.isSuccess && <p className="text-sm text-green-600">MoMo cashout initiated ✓</p>}

            <button type="submit" disabled={cashoutMutation.isPending}
              className="w-full py-2.5 bg-govres-gold text-govres-black rounded-lg font-medium hover:bg-yellow-500 disabled:opacity-50">
              {cashoutMutation.isPending ? 'Processing…' : 'Cash Out'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
