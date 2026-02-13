/**
 * GOVRES — Cocoa Supply Chain Dashboard
 * Actual Ghana Model: Farmgate → Weighing → Grading → Delivery → Processing/Export
 * Full lot tracking with stage pipeline, events timeline, and actor interactions.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../components/DashboardLayout';
import { supplyChainAPI } from '../lib/api';
import { useAuth } from '../lib/auth';

/* ── Formatters ─────────────────────────────────────────────── */

const fmt = (n: number | string | undefined) =>
  n != null ? new Intl.NumberFormat('en-GH').format(Number(n)) : '—';
const fmtKg = (n: number | string | undefined) =>
  n != null ? `${new Intl.NumberFormat('en-GH', { minimumFractionDigits: 1 }).format(Number(n))} kg` : '—';
const fmtCedi = (n: number | undefined) =>
  n != null ? `GH₵ ${new Intl.NumberFormat('en-GH', { minimumFractionDigits: 2 }).format(n)}` : '—';
const fmtDate = (d: string | undefined) =>
  d ? new Date(d).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

/* ── Pipeline stage config ──────────────────────────────────── */

const STAGES = [
  { key: 'DELIVERED', label: 'Farmgate', icon: '🌱', color: 'text-green-400' },
  { key: 'WEIGHED', label: 'Weighed', icon: '⚖️', color: 'text-blue-400' },
  { key: 'GRADED', label: 'Graded', icon: '🏅', color: 'text-yellow-400' },
  { key: 'SEALED', label: 'Sealed', icon: '🔒', color: 'text-purple-400' },
  { key: 'IN_TRANSIT', label: 'In Transit', icon: '🚚', color: 'text-orange-400' },
  { key: 'TAKEN_OVER', label: 'CMC Take-Over', icon: '🏭', color: 'text-cyan-400' },
  { key: 'PROCESSING', label: 'Processing', icon: '⚙️', color: 'text-pink-400' },
  { key: 'EXPORTED', label: 'Exported', icon: '🚢', color: 'text-emerald-400' },
];

const GRADE_COLORS: Record<string, string> = {
  GRADE_1: 'bg-green-600/30 text-green-300 border-green-500/40',
  GRADE_2: 'bg-yellow-600/30 text-yellow-300 border-yellow-500/40',
  SUB_STANDARD: 'bg-red-600/30 text-red-300 border-red-500/40',
  UNGRADED: 'bg-gray-600/30 text-gray-300 border-gray-500/40',
};

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: 'bg-green-600/30 text-green-300',
  WEIGHED: 'bg-blue-600/30 text-blue-300',
  GRADED: 'bg-yellow-600/30 text-yellow-300',
  SEALED: 'bg-purple-600/30 text-purple-300',
  IN_TRANSIT: 'bg-orange-600/30 text-orange-300',
  TAKEN_OVER: 'bg-cyan-600/30 text-cyan-300',
  PROCESSING: 'bg-pink-600/30 text-pink-300',
  EXPORTED: 'bg-emerald-600/30 text-emerald-300',
  REJECTED: 'bg-red-600/30 text-red-300',
};

/* ── StatCard ───────────────────────────────────────────────── */

function StatCard({ label, value, sub, accent, bgAccent }: { label: string; value: string; sub?: string; accent: string; bgAccent?: string }) {
  return (
    <div className={`rounded-xl p-5 shadow-card border-l-4 ${accent} ${bgAccent || 'bg-govres-surface'} transition-shadow hover:shadow-card-hover`}>
      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-2xl font-bold mt-2 text-white">{value}</p>
      {sub && <p className="text-sm text-gray-500 mt-1 font-medium">{sub}</p>}
    </div>
  );
}

/* ── Pipeline Visual ────────────────────────────────────────── */

function PipelineView({ byStatus }: { byStatus: any[] }) {
  const statusMap: Record<string, { count: number; total_weight_kg: number }> = {};
  byStatus.forEach((s: any) => { statusMap[s.status] = { count: Number(s.count), total_weight_kg: Number(s.total_weight_kg) }; });
  const maxCount = Math.max(...Object.values(statusMap).map(s => s.count), 1);

  return (
    <div className="bg-govres-surface rounded-xl p-6 border border-white/10">
      <h3 className="text-lg font-bold text-white mb-6">Supply Chain Pipeline</h3>
      <div className="flex items-end gap-2 overflow-x-auto pb-2">
        {STAGES.map((stage, i) => {
          const data = statusMap[stage.key] || { count: 0, total_weight_kg: 0 };
          const barHeight = Math.max((data.count / maxCount) * 120, 8);
          return (
            <div key={stage.key} className="flex flex-col items-center min-w-[80px] flex-1">
              <span className="text-xs text-gray-400 mb-1">{fmt(data.count)} lots</span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-govres-gold/60 to-govres-gold/20 transition-all duration-500"
                style={{ height: `${barHeight}px` }}
              />
              <div className={`w-full text-center py-2 ${i < STAGES.length - 1 ? 'border-r border-white/10' : ''}`}>
                <span className="text-lg">{stage.icon}</span>
                <p className={`text-[10px] font-semibold mt-1 ${stage.color}`}>{stage.label}</p>
                <p className="text-[9px] text-gray-500">{fmtKg(data.total_weight_kg)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Event Timeline ─────────────────────────────────────────── */

function EventTimeline({ events }: { events: any[] }) {
  if (!events?.length) return <p className="text-gray-500 text-sm">No events recorded yet.</p>;
  return (
    <div className="space-y-3">
      {events.map((evt: any, i: number) => (
        <div key={evt.event_id || i} className="flex gap-3 items-start">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-govres-gold mt-1" />
            {i < events.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1" />}
          </div>
          <div className="flex-1 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[evt.event_type] || 'bg-gray-600/30 text-gray-300'}`}>
                {evt.event_type?.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-gray-500">{fmtDate(evt.created_at)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Actor: <span className="text-gray-300">{evt.actor_name || evt.actor_id}</span>
              {evt.actor_role && <span className="text-gray-500"> ({evt.actor_role})</span>}
            </p>
            {evt.data && Object.keys(evt.data).length > 0 && (
              <div className="text-[10px] text-gray-500 mt-1 space-x-2">
                {Object.entries(evt.data).map(([k, v]) => (
                  <span key={k}>{k}: <span className="text-gray-400">{String(v)}</span></span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Lot Detail Modal ───────────────────────────────────────── */

function LotDetail({ lotGuid, onClose }: { lotGuid: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['lot-detail', lotGuid],
    queryFn: () => supplyChainAPI.getLot(lotGuid),
    enabled: !!lotGuid,
  });

  const lot = data?.data?.data;
  const events = lot?.events ?? [];

  if (isLoading) return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={onClose}>
      <div className="bg-govres-surface rounded-xl p-8 max-w-2xl w-full mx-4 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
        <div className="h-4 bg-white/10 rounded w-2/3" />
      </div>
    </div>
  );

  if (!lot) return null;

  const stageIdx = STAGES.findIndex(s => s.key === lot.status);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-govres-surface rounded-xl border border-white/10 max-w-3xl w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">{lot.lot_guid}</h2>
            <p className="text-sm text-gray-400">Farmer: {lot.farmer_name || lot.farmer_id} • {lot.region}{lot.district ? `, ${lot.district}` : ''}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none">×</button>
        </div>

        {/* Stage Progress Bar */}
        <div className="flex items-center gap-1 mb-6">
          {STAGES.map((stage, i) => {
            const active = i <= stageIdx;
            const isCurrent = stage.key === lot.status;
            return (
              <div key={stage.key} className="flex-1 flex flex-col items-center">
                <div className={`w-full h-2 rounded-full ${active ? 'bg-govres-gold' : 'bg-white/10'} ${isCurrent ? 'ring-2 ring-govres-gold/50' : ''}`} />
                <span className={`text-[9px] mt-1 ${active ? 'text-govres-gold' : 'text-gray-600'}`}>{stage.label}</span>
              </div>
            );
          })}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <InfoCell label="Weight" value={fmtKg(lot.weight_kg)} />
          <InfoCell label="Bags" value={fmt(lot.bags_count)} />
          <InfoCell label="Grade" value={lot.quality_grade || 'UNGRADED'} />
          <InfoCell label="Moisture" value={lot.moisture_percent ? `${lot.moisture_percent}%` : '—'} />
          <InfoCell label="Season" value={lot.season_year} />
          <InfoCell label="LBC" value={lot.lbc_name || lot.lbc_id || '—'} />
          <InfoCell label="Depot" value={lot.depot_name || lot.depot_id || '—'} />
          <InfoCell label="CRDN" value={lot.crdn_instrument_id || 'Not Issued'} />
          <InfoCell label="QCC Certificate" value={lot.qcc_certificate_id || '—'} />
          <InfoCell label="Seal #" value={lot.seal_number || '—'} />
          <InfoCell label="Transporter" value={lot.transporter_id || '—'} />
          <InfoCell label="Export Ref" value={lot.export_contract_ref || '—'} />
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6 text-[10px]">
          {[
            { label: 'Delivered', value: lot.delivered_at },
            { label: 'Weighed', value: lot.weighed_at },
            { label: 'Graded', value: lot.graded_at },
            { label: 'Sealed', value: lot.sealed_at },
            { label: 'Transport Started', value: lot.transport_started_at },
            { label: 'Taken Over', value: lot.taken_over_at },
            { label: 'Processing', value: lot.processing_started_at },
            { label: 'Exported', value: lot.exported_at },
          ].map(ts => (
            <div key={ts.label} className="bg-black/30 rounded p-2">
              <span className="text-gray-500">{ts.label}</span>
              <p className="text-gray-300">{fmtDate(ts.value)}</p>
            </div>
          ))}
        </div>

        {/* Events Timeline */}
        <h3 className="text-sm font-bold text-white mb-3">Event Timeline</h3>
        <div className="max-h-60 overflow-y-auto pr-2">
          <EventTimeline events={events} />
        </div>
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black/30 rounded-lg p-2">
      <p className="text-[10px] text-gray-500 uppercase">{label}</p>
      <p className="text-sm text-white font-medium truncate">{value}</p>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */

export function CocoaSupplyChain() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'lots' | 'register'>('overview');
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  /* ── Data queries ── */
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['sc-stats'],
    queryFn: supplyChainAPI.stats,
    refetchInterval: 15_000,
  });

  const { data: lotsData, isLoading: lotsLoading } = useQuery({
    queryKey: ['sc-lots', statusFilter, regionFilter],
    queryFn: () => supplyChainAPI.listLots({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(regionFilter ? { region: regionFilter } : {}),
      limit: 100,
    }),
  });

  const stats = statsData?.data?.data;
  const lots = lotsData?.data?.data ?? [];
  const totals = stats?.totals ?? {};
  const byStatus = stats?.byStatus ?? [];
  const byGrade = stats?.byGrade ?? [];
  const byRegion = stats?.byRegion ?? [];
  const recentEvents = stats?.recentEvents ?? [];

  /* ── Delivery form ── */
  const [deliverForm, setDeliverForm] = useState({
    farmerId: '', farmerName: '', region: '', district: '', community: '',
    weightKg: '', bagsCount: '', moisturePercent: '', seasonYear: '2025/2026',
    lbcId: '', lbcName: '', depotId: '', depotName: '',
    farmGpsLat: '', farmGpsLng: '',
  });

  const deliverMutation = useMutation({
    mutationFn: (data: any) => supplyChainAPI.deliver(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sc-stats'] });
      qc.invalidateQueries({ queryKey: ['sc-lots'] });
      setDeliverForm({
        farmerId: '', farmerName: '', region: '', district: '', community: '',
        weightKg: '', bagsCount: '', moisturePercent: '', seasonYear: '2025/2026',
        lbcId: '', lbcName: '', depotId: '', depotName: '',
        farmGpsLat: '', farmGpsLng: '',
      });
      setActiveTab('lots');
    },
  });

  const handleDeliver = (e: React.FormEvent) => {
    e.preventDefault();
    deliverMutation.mutate({
      ...deliverForm,
      weightKg: deliverForm.weightKg ? Number(deliverForm.weightKg) : undefined,
      bagsCount: deliverForm.bagsCount ? Number(deliverForm.bagsCount) : undefined,
      moisturePercent: deliverForm.moisturePercent ? Number(deliverForm.moisturePercent) : undefined,
      farmGpsLat: deliverForm.farmGpsLat ? Number(deliverForm.farmGpsLat) : undefined,
      farmGpsLng: deliverForm.farmGpsLng ? Number(deliverForm.farmGpsLng) : undefined,
    });
  };

  /* ── Quick-action mutations for lot status transitions ── */
  const actionMutation = useMutation({
    mutationFn: ({ lotGuid, action, payload }: { lotGuid: string; action: string; payload?: any }) => {
      switch (action) {
        case 'weigh': return supplyChainAPI.weigh(lotGuid, payload);
        case 'grade': return supplyChainAPI.grade(lotGuid, payload);
        case 'seal': return supplyChainAPI.seal(lotGuid, payload);
        case 'transport': return supplyChainAPI.transport(lotGuid, payload);
        case 'takeOver': return supplyChainAPI.takeOver(lotGuid, payload);
        case 'process': return supplyChainAPI.process(lotGuid, payload);
        case 'export': return supplyChainAPI.exportLot(lotGuid, payload);
        case 'crdn': return supplyChainAPI.issueCRDN(lotGuid, payload);
        default: throw new Error('Unknown action');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sc-stats'] });
      qc.invalidateQueries({ queryKey: ['sc-lots'] });
    },
  });

  const REGIONS = [
    'Ashanti', 'Western', 'Eastern', 'Central', 'Volta',
    'Brong-Ahafo', 'Western North', 'Ahafo', 'Oti', 'North East',
  ];

  return (
    <DashboardLayout title="Cocoa Supply Chain" subtitle="Ghana Model — COCOBOD/QCC/CMC Compliant">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Cocoa Supply Chain</h1>
            <p className="text-gray-400 text-sm mt-1">Farmgate → Weighing → Grading → Transport → Processing → Export</p>
          </div>
          <div className="flex gap-2">
            {(['overview', 'lots', 'register'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === tab
                    ? 'bg-govres-gold text-black'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab === 'overview' ? '📊 Overview' : tab === 'lots' ? '📦 Lots' : '➕ Register'}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════════════ OVERVIEW TAB ═══════════════════════ */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Total Lots" value={fmt(totals.total_lots)} accent="border-govres-gold" />
              <StatCard label="Total Weight" value={fmtKg(totals.total_weight_kg)} accent="border-blue-500" />
              <StatCard label="Total Bags" value={fmt(totals.total_bags)} accent="border-green-500" />
              <StatCard label="Unique Farmers" value={fmt(totals.unique_farmers)} accent="border-purple-500" />
              <StatCard label="CRDNs Issued" value={fmt(totals.crdn_issued)} accent="border-orange-500" />
            </div>

            {/* Pipeline */}
            <PipelineView byStatus={byStatus} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* By Grade */}
              <div className="bg-govres-surface rounded-xl p-5 border border-white/10">
                <h3 className="text-sm font-bold text-white mb-4">Quality Grade Breakdown</h3>
                <div className="space-y-3">
                  {byGrade.length > 0 ? byGrade.map((g: any) => (
                    <div key={g.quality_grade} className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full border ${GRADE_COLORS[g.quality_grade] || GRADE_COLORS.UNGRADED}`}>
                        {g.quality_grade || 'UNGRADED'}
                      </span>
                      <span className="text-white font-semibold">{fmt(g.count)} lots</span>
                    </div>
                  )) : <p className="text-gray-500 text-sm">No grading data available.</p>}
                </div>
              </div>

              {/* By Region */}
              <div className="bg-govres-surface rounded-xl p-5 border border-white/10">
                <h3 className="text-sm font-bold text-white mb-4">Regional Distribution</h3>
                <div className="space-y-2">
                  {byRegion.length > 0 ? byRegion.slice(0, 8).map((r: any) => {
                    const pct = totals.total_weight_kg > 0 ? (Number(r.total_weight_kg) / Number(totals.total_weight_kg) * 100) : 0;
                    return (
                      <div key={r.region}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300">{r.region}</span>
                          <span className="text-gray-400">{fmtKg(r.total_weight_kg)} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-govres-gold/70 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  }) : <p className="text-gray-500 text-sm">No regional data available.</p>}
                </div>
              </div>
            </div>

            {/* Recent Events */}
            <div className="bg-govres-surface rounded-xl p-5 border border-white/10">
              <h3 className="text-sm font-bold text-white mb-4">Recent Supply Chain Events</h3>
              <EventTimeline events={recentEvents.slice(0, 10)} />
            </div>
          </>
        )}

        {/* ═══════════════════════ LOTS TAB ═══════════════════════ */}
        {activeTab === 'lots' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-govres-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-govres-gold focus:outline-none"
              >
                <option value="">All Statuses</option>
                {STAGES.map(s => (
                  <option key={s.key} value={s.key}>{s.icon} {s.label}</option>
                ))}
                <option value="REJECTED">❌ Rejected</option>
              </select>
              <select
                value={regionFilter}
                onChange={e => setRegionFilter(e.target.value)}
                className="bg-govres-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-govres-gold focus:outline-none"
              >
                <option value="">All Regions</option>
                {REGIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <span className="text-xs text-gray-500 self-center">
                {lots.length} lot{lots.length !== 1 ? 's' : ''} found
              </span>
            </div>

            {/* Lots Table */}
            <div className="bg-govres-surface rounded-xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-xs">
                      <th className="text-left p-3 font-semibold">Lot GUID</th>
                      <th className="text-left p-3 font-semibold">Farmer</th>
                      <th className="text-left p-3 font-semibold">Region</th>
                      <th className="text-right p-3 font-semibold">Weight</th>
                      <th className="text-right p-3 font-semibold">Bags</th>
                      <th className="text-center p-3 font-semibold">Grade</th>
                      <th className="text-center p-3 font-semibold">Status</th>
                      <th className="text-center p-3 font-semibold">CRDN</th>
                      <th className="text-left p-3 font-semibold">Delivered</th>
                      <th className="text-center p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lotsLoading ? (
                      <tr><td colSpan={10} className="p-8 text-center text-gray-500">Loading lots...</td></tr>
                    ) : lots.length === 0 ? (
                      <tr><td colSpan={10} className="p-8 text-center text-gray-500">No lots found. Register a delivery to get started.</td></tr>
                    ) : lots.map((lot: any) => (
                      <tr key={lot.lot_guid} className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer" onClick={() => setSelectedLot(lot.lot_guid)}>
                        <td className="p-3 font-mono text-xs text-govres-gold">{lot.lot_guid}</td>
                        <td className="p-3 text-gray-300">{lot.farmer_name || lot.farmer_id}</td>
                        <td className="p-3 text-gray-400">{lot.region}</td>
                        <td className="p-3 text-right text-white">{fmtKg(lot.weight_kg)}</td>
                        <td className="p-3 text-right text-gray-300">{lot.bags_count || '—'}</td>
                        <td className="p-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${GRADE_COLORS[lot.quality_grade] || GRADE_COLORS.UNGRADED}`}>
                            {lot.quality_grade || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[lot.status] || 'bg-gray-600/30 text-gray-300'}`}>
                            {lot.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {lot.crdn_instrument_id
                            ? <span className="text-[10px] text-green-400">✓</span>
                            : <span className="text-[10px] text-gray-600">—</span>}
                        </td>
                        <td className="p-3 text-xs text-gray-500">{fmtDate(lot.delivered_at)}</td>
                        <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                          <LotActions lot={lot} onAction={(action, payload) => {
                            actionMutation.mutate({ lotGuid: lot.lot_guid, action, payload });
                          }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════ REGISTER TAB ═════════════════════ */}
        {activeTab === 'register' && (
          <div className="bg-govres-surface rounded-xl p-6 border border-white/10 max-w-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Register Farmgate Delivery</h3>
            <p className="text-xs text-gray-400 mb-5">Record a new cocoa lot at the buying centre/depot</p>

            <form onSubmit={handleDeliver} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Farmer ID *" value={deliverForm.farmerId} onChange={v => setDeliverForm(f => ({ ...f, farmerId: v }))} placeholder="FRM-001" />
                <FormField label="Farmer Name" value={deliverForm.farmerName} onChange={v => setDeliverForm(f => ({ ...f, farmerName: v }))} placeholder="Kofi Mensah" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Region *</label>
                  <select
                    value={deliverForm.region}
                    onChange={e => setDeliverForm(f => ({ ...f, region: e.target.value }))}
                    required
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-govres-gold focus:outline-none"
                  >
                    <option value="">Select Region</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <FormField label="District" value={deliverForm.district} onChange={v => setDeliverForm(f => ({ ...f, district: v }))} placeholder="Sefwi Wiawso" />
                <FormField label="Community" value={deliverForm.community} onChange={v => setDeliverForm(f => ({ ...f, community: v }))} placeholder="Asawinso" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField label="Weight (kg)" value={deliverForm.weightKg} onChange={v => setDeliverForm(f => ({ ...f, weightKg: v }))} placeholder="640" type="number" />
                <FormField label="Bags" value={deliverForm.bagsCount} onChange={v => setDeliverForm(f => ({ ...f, bagsCount: v }))} placeholder="10" type="number" />
                <FormField label="Moisture %" value={deliverForm.moisturePercent} onChange={v => setDeliverForm(f => ({ ...f, moisturePercent: v }))} placeholder="7.5" type="number" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="LBC ID" value={deliverForm.lbcId} onChange={v => setDeliverForm(f => ({ ...f, lbcId: v }))} placeholder="LBC-PBC" />
                <FormField label="LBC Name" value={deliverForm.lbcName} onChange={v => setDeliverForm(f => ({ ...f, lbcName: v }))} placeholder="Produce Buying Company" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Depot ID" value={deliverForm.depotId} onChange={v => setDeliverForm(f => ({ ...f, depotId: v }))} placeholder="DEP-SWN-01" />
                <FormField label="Depot Name" value={deliverForm.depotName} onChange={v => setDeliverForm(f => ({ ...f, depotName: v }))} placeholder="Sefwi Wiawso Depot" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField label="GPS Lat" value={deliverForm.farmGpsLat} onChange={v => setDeliverForm(f => ({ ...f, farmGpsLat: v }))} placeholder="6.2094" type="number" />
                <FormField label="GPS Lng" value={deliverForm.farmGpsLng} onChange={v => setDeliverForm(f => ({ ...f, farmGpsLng: v }))} placeholder="-2.4897" type="number" />
                <FormField label="Season" value={deliverForm.seasonYear} onChange={v => setDeliverForm(f => ({ ...f, seasonYear: v }))} placeholder="2025/2026" />
              </div>

              <button
                type="submit"
                disabled={deliverMutation.isPending || !deliverForm.farmerId || !deliverForm.region}
                className="w-full bg-govres-gold text-black py-3 rounded-lg font-bold hover:bg-govres-gold/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deliverMutation.isPending ? 'Registering...' : '🌱 Register Delivery'}
              </button>

              {deliverMutation.isError && (
                <p className="text-red-400 text-xs">Error: {(deliverMutation.error as any)?.response?.data?.error?.message || 'Registration failed'}</p>
              )}
              {deliverMutation.isSuccess && (
                <p className="text-green-400 text-xs">✓ Delivery registered — Lot GUID: {(deliverMutation.data as any)?.data?.data?.lot_guid}</p>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Lot Detail Modal */}
      {selectedLot && <LotDetail lotGuid={selectedLot} onClose={() => setSelectedLot(null)} />}
    </DashboardLayout>
  );
}

/* ── Reusable Form Field ────────────────────────────────────── */

function FormField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-gray-400 block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        step={type === 'number' ? 'any' : undefined}
        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-govres-gold focus:outline-none"
      />
    </div>
  );
}

/* ── Lot Action Buttons ─────────────────────────────────────── */

function LotActions({ lot, onAction }: { lot: any; onAction: (action: string, payload?: any) => void }) {
  const nextActionMap: Record<string, { action: string; label: string; icon: string }> = {
    DELIVERED: { action: 'weigh', label: 'Weigh', icon: '⚖️' },
    WEIGHED: { action: 'grade', label: 'Grade', icon: '🏅' },
    GRADED: { action: 'seal', label: 'Seal', icon: '🔒' },
    SEALED: { action: 'transport', label: 'Ship', icon: '🚚' },
    IN_TRANSIT: { action: 'takeOver', label: 'Take Over', icon: '🏭' },
    TAKEN_OVER: { action: 'process', label: 'Process', icon: '⚙️' },
    PROCESSING: { action: 'export', label: 'Export', icon: '🚢' },
  };

  const next = nextActionMap[lot.status];
  if (!next) return <span className="text-[10px] text-gray-600">—</span>;

  const handleClick = () => {
    const payloads: Record<string, any> = {
      weigh: { weightKg: lot.weight_kg || 640 },
      grade: { qualityGrade: 'GRADE_1' },
      seal: { sealNumber: `SEAL-${Date.now().toString(36).toUpperCase()}` },
      transport: { vehicleNumber: 'GH-XXX-00' },
      takeOver: { takeOverWeightKg: lot.weight_kg },
      process: { processingType: 'ROASTING' },
      export: { exportContractRef: `EXP-${Date.now().toString(36).toUpperCase()}` },
    };
    onAction(next.action, payloads[next.action]);
  };

  return (
    <button
      onClick={handleClick}
      className="text-[10px] px-2 py-1 rounded bg-govres-gold/20 text-govres-gold hover:bg-govres-gold/30 transition font-medium"
      title={next.label}
    >
      {next.icon} {next.label}
    </button>
  );
}
