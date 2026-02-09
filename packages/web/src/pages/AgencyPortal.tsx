/**
 * GOVRES — Government Agency Portal
 * Project submission, approval tracking, fund disbursement monitoring.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../components/DashboardLayout';
import { projectAPI } from '../lib/api';

const fmtCedi = (n: number | undefined) =>
  n != null ? `GH₵ ${new Intl.NumberFormat('en-GH', { minimumFractionDigits: 2 }).format(n)}` : '—';

export function AgencyPortal() {
  const qc = useQueryClient();

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['agency-projects'],
    queryFn: () => projectAPI.list(1),
  });

  const projects = projectsData?.data?.projects ?? [];
  const submitted = projects.filter((p: any) => p.status === 'SUBMITTED').length;
  const approved = projects.filter((p: any) => p.status === 'APPROVED' || p.status === 'IN_PROGRESS').length;
  const totalBudget = projects.reduce((s: number, p: any) => s + (Number(p.total_budget_cedi) || 0), 0);

  // ── New Project Form ──
  const [form, setForm] = useState({
    projectName: '',
    description: '',
    region: '',
    totalBudgetCedi: '',
    contractorId: '',
    milestones: '',
  });
  const [showForm, setShowForm] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data: any) => projectAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agency-projects'] });
      setForm({ projectName: '', description: '', region: '', totalBudgetCedi: '', contractorId: '', milestones: '' });
      setShowForm(false);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    // Parse milestones from comma-separated text
    const milestoneNames = form.milestones.split(',').map(m => m.trim()).filter(Boolean);
    const milestones = milestoneNames.map((name, i) => ({
      milestoneName: name,
      description: name,
      amountCedi: Number(form.totalBudgetCedi) / milestoneNames.length,
      sequenceOrder: i + 1,
    }));

    createMutation.mutate({
      projectName: form.projectName,
      description: form.description,
      region: form.region,
      totalBudgetCedi: Number(form.totalBudgetCedi),
      contractorId: form.contractorId,
      milestones,
    });
  };

  const approveMutation = useMutation({
    mutationFn: (projectId: string) => projectAPI.approve(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agency-projects'] }),
  });

  return (
    <DashboardLayout title="Government Agency Portal">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-yellow-500">
          <p className="text-xs text-gray-500 uppercase">Submitted</p>
          <p className="text-2xl font-bold mt-1">{submitted}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-govres-green">
          <p className="text-xs text-gray-500 uppercase">Active</p>
          <p className="text-2xl font-bold mt-1">{approved}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-govres-gold">
          <p className="text-xs text-gray-500 uppercase">Total Budget</p>
          <p className="text-2xl font-bold mt-1">{fmtCedi(totalBudget)}</p>
        </div>
      </div>

      {/* New Project Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-govres-green text-white rounded-lg font-medium hover:bg-green-800 transition"
        >
          {showForm ? 'Cancel' : '+ Submit New Project'}
        </button>
      </div>

      {/* New Project Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">New Project Submission</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <input type="text" value={form.projectName}
                onChange={e => setForm(p => ({ ...p, projectName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
              <select value={form.region}
                onChange={e => setForm(p => ({ ...p, region: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required>
                <option value="">Select region…</option>
                {['Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central', 'Northern',
                  'Volta', 'Upper East', 'Upper West', 'Bono', 'Bono East', 'Ahafo',
                  'Western North', 'Oti', 'North East', 'Savannah'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Budget (GH₵)</label>
              <input type="number" step="0.01" value={form.totalBudgetCedi}
                onChange={e => setForm(p => ({ ...p, totalBudgetCedi: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contractor ID</label>
              <input type="text" value={form.contractorId}
                onChange={e => setForm(p => ({ ...p, contractorId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="CONTRACTOR-001" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={2} required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Milestones (comma-separated)</label>
              <input type="text" value={form.milestones}
                onChange={e => setForm(p => ({ ...p, milestones: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Land survey, Foundation, Superstructure, Finishing, Handover" required />
            </div>

            {createMutation.isError && (
              <p className="md:col-span-2 text-sm text-red-600">
                {(createMutation.error as any)?.response?.data?.error?.message || 'Submission failed'}
              </p>
            )}

            <div className="md:col-span-2">
              <button type="submit" disabled={createMutation.isPending}
                className="px-6 py-2.5 bg-govres-green text-white rounded-lg font-medium hover:bg-green-800 disabled:opacity-50">
                {createMutation.isPending ? 'Submitting…' : 'Submit Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">All Projects</h2>
        {isLoading ? (
          <p className="text-gray-400 py-4">Loading…</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-400 py-4">No projects found.</p>
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
                  <th className="py-2">Action</th>
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
                        p.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-800' :
                        p.status === 'COMPLETED' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>{p.status}</span>
                    </td>
                    <td className="py-3">
                      {p.status === 'SUBMITTED' && (
                        <button
                          onClick={() => approveMutation.mutate(p.project_id)}
                          disabled={approveMutation.isPending}
                          className="text-xs px-3 py-1 bg-govres-green text-white rounded-md hover:bg-green-800 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
