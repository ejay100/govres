/**
 * GOVRES — Government Contractor Portal
 * Payment receipt, project milestones, supplier payments, cash-out
 */

import React from 'react';

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
};

export function ContractorPortal() {
  const contractorName = 'RoadMaster Construction Ltd';
  const contractorId = 'CTR-ACC-2025-0087';

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      <header style={{
        background: '#1A1A2E',
        color: '#fff',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px' }}>
            <span style={{ color: '#D4AF37' }}>GOVRES</span> — Contractor Portal
          </h1>
          <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>{contractorName}</p>
        </div>
        <span style={{
          background: '#CE1126',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
        }}>Contractor • {contractorId}</span>
      </header>

      <main style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
          <div style={{ ...cardStyle, borderLeft: '4px solid #006B3F' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>GBDC Received</p>
            <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#006B3F' }}>GH¢18.4M</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>Total this year</p>
          </div>
          <div style={{ ...cardStyle, borderLeft: '4px solid #D4AF37' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Pending Payments</p>
            <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#D4AF37' }}>GH¢4.2M</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>Awaiting milestones</p>
          </div>
          <div style={{ ...cardStyle, borderLeft: '4px solid #0F3460' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Active Projects</p>
            <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#0F3460' }}>3</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>Government contracts</p>
          </div>
          <div style={{ ...cardStyle, borderLeft: '4px solid #CE1126' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Cashed Out</p>
            <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#CE1126' }}>GH¢14.1M</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>To bank account</p>
          </div>
        </div>

        {/* Active Projects */}
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Active Government Projects</h3>
          {[
            {
              name: 'Kumasi Inner Ring Road — Phase 2',
              ministry: 'Ministry of Roads & Highways',
              total: 'GH¢24,500,000',
              disbursed: 'GH¢18,400,000',
              progress: 75,
              milestones: [
                { name: 'Foundation & Grading', status: 'completed', amount: 'GH¢6,200,000' },
                { name: 'Drainage Systems', status: 'completed', amount: 'GH¢4,800,000' },
                { name: 'Asphalt Layer 1', status: 'completed', amount: 'GH¢7,400,000' },
                { name: 'Asphalt Layer 2 & Markings', status: 'in_progress', amount: 'GH¢3,800,000' },
                { name: 'Final Inspection & Handover', status: 'pending', amount: 'GH¢2,300,000' },
              ],
            },
            {
              name: 'Tamale Water Treatment Plant',
              ministry: 'Ministry of Sanitation & Water Resources',
              total: 'GH¢8,900,000',
              disbursed: 'GH¢2,670,000',
              progress: 30,
              milestones: [
                { name: 'Site Preparation', status: 'completed', amount: 'GH¢1,200,000' },
                { name: 'Pipe Installation', status: 'completed', amount: 'GH¢1,470,000' },
                { name: 'Treatment Units', status: 'in_progress', amount: 'GH¢3,100,000' },
                { name: 'Testing & Commissioning', status: 'pending', amount: 'GH¢3,130,000' },
              ],
            },
          ].map((project, pi) => (
            <div key={pi} style={{
              border: '1px solid #f0f0f0',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px' }}>{project.name}</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#888' }}>{project.ministry}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontFamily: 'monospace', fontWeight: 600 }}>
                    {project.disbursed} / {project.total}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '8px', marginBottom: '16px' }}>
                <div style={{
                  background: '#006B3F',
                  borderRadius: '4px',
                  height: '8px',
                  width: `${project.progress}%`,
                  transition: 'width 0.3s',
                }}></div>
              </div>

              {/* Milestones */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {project.milestones.map((ms, mi) => (
                  <div key={mi} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: ms.status === 'completed' ? '#f1f8e9' : ms.status === 'in_progress' ? '#fff8e1' : '#fafafa',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}>
                    <span>
                      {ms.status === 'completed' ? '✓' : ms.status === 'in_progress' ? '◎' : '○'}{' '}
                      {ms.name}
                    </span>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'monospace' }}>{ms.amount}</span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        background: ms.status === 'completed' ? '#c8e6c9' : ms.status === 'in_progress' ? '#ffe0b2' : '#e0e0e0',
                        color: ms.status === 'completed' ? '#2e7d32' : ms.status === 'in_progress' ? '#e65100' : '#666',
                      }}>{ms.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Payment History */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Payment History</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8f9fb' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Project</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Milestone</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Channel</th>
              </tr>
            </thead>
            <tbody>
              {[
                { date: 'May 12', project: 'Kumasi Ring Road', milestone: 'Asphalt Layer 1', amount: 'GH¢7,400,000', channel: 'GBDC → GCB' },
                { date: 'Apr 20', project: 'Tamale Water', milestone: 'Pipe Installation', amount: 'GH¢1,470,000', channel: 'GBDC → GCB' },
                { date: 'Mar 15', project: 'Kumasi Ring Road', milestone: 'Drainage Systems', amount: 'GH¢4,800,000', channel: 'GBDC → GCB' },
                { date: 'Feb 28', project: 'Tamale Water', milestone: 'Site Preparation', amount: 'GH¢1,200,000', channel: 'GBDC → GCB' },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px', color: '#888' }}>{row.date}</td>
                  <td style={{ padding: '10px' }}>{row.project}</td>
                  <td style={{ padding: '10px', color: '#666' }}>{row.milestone}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{row.amount}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#e3f2fd', color: '#1565c0', fontSize: '12px' }}>
                      {row.channel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
