/**
 * GOVRES — Government Agency Portal
 * Budget submission, project approvals, disbursement tracking
 */

import React, { useState } from 'react';

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
};

export function AgencyPortal() {
  const [showNewProject, setShowNewProject] = useState(false);

  const agencyName = 'Ministry of Roads & Highways';

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
            <span style={{ color: '#D4AF37' }}>GOVRES</span> — Agency Portal
          </h1>
          <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>{agencyName}</p>
        </div>
        <span style={{
          background: '#0F3460',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          color: '#fff',
        }}>Gov Agency</span>
      </header>

      <main style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Budget Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
          <div style={{ ...cardStyle, borderLeft: '4px solid #006B3F' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Approved Budget</p>
            <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#006B3F' }}>GH¢245M</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>FY 2025</p>
          </div>
          <div style={{ ...cardStyle, borderLeft: '4px solid #D4AF37' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Disbursed (GBDC)</p>
            <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#D4AF37' }}>GH¢142M</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>58% utilized</p>
          </div>
          <div style={{ ...cardStyle, borderLeft: '4px solid #0F3460' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Active Projects</p>
            <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#0F3460' }}>12</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>Across 6 regions</p>
          </div>
          <div style={{ ...cardStyle, borderLeft: '4px solid #CE1126' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Pending Approvals</p>
            <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#CE1126' }}>4</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>Awaiting BoG/MoF</p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Projects & Disbursements</h3>
          <button
            onClick={() => setShowNewProject(!showNewProject)}
            style={{
              padding: '10px 20px',
              background: '#006B3F',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            + Submit New Project
          </button>
        </div>

        {/* New Project Form */}
        {showNewProject && (
          <div style={{ ...cardStyle, marginBottom: '24px', border: '2px solid #006B3F' }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '16px' }}>New Project Submission</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500 }}>Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Accra-Tema Motorway Extension"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '6px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500 }}>Region</label>
                <select style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '6px', boxSizing: 'border-box' }}>
                  <option>Greater Accra</option>
                  <option>Ashanti</option>
                  <option>Western</option>
                  <option>Northern</option>
                  <option>Eastern</option>
                  <option>Volta</option>
                  <option>Central</option>
                  <option>Upper East</option>
                  <option>Upper West</option>
                  <option>Bono</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500 }}>Estimated Budget (GH¢)</label>
                <input
                  type="number"
                  placeholder="Total project budget"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '6px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500 }}>Contractor</label>
                <input
                  type="text"
                  placeholder="Assigned contractor"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '6px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '13px', fontWeight: 500 }}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Project scope and objectives"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '6px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button style={{
                padding: '10px 24px',
                background: '#006B3F',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}>Submit for Approval</button>
              <button
                onClick={() => setShowNewProject(false)}
                style={{
                  padding: '10px 24px',
                  background: '#f5f5f5',
                  color: '#666',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >Cancel</button>
            </div>
          </div>
        )}

        {/* Project List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            {
              name: 'Kumasi Inner Ring Road — Phase 2',
              contractor: 'RoadMaster Construction Ltd',
              budget: 'GH¢24,500,000',
              disbursed: 'GH¢18,400,000',
              progress: 75,
              status: 'active',
              region: 'Ashanti',
            },
            {
              name: 'Tamale-Bolgatanga Highway Rehabilitation',
              contractor: 'Highway Masters Ghana',
              budget: 'GH¢45,600,000',
              disbursed: 'GH¢22,800,000',
              progress: 50,
              status: 'active',
              region: 'Northern',
            },
            {
              name: 'Cape Coast Bypass Road',
              contractor: 'BuildCo International',
              budget: 'GH¢18,200,000',
              disbursed: 'GH¢5,460,000',
              progress: 30,
              status: 'active',
              region: 'Central',
            },
            {
              name: 'Volta Bridge Expansion',
              contractor: 'BridgeTech Ltd',
              budget: 'GH¢32,000,000',
              disbursed: 'GH¢0',
              progress: 0,
              status: 'pending_approval',
              region: 'Volta',
            },
          ].map((project, i) => (
            <div key={i} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px' }}>{project.name}</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#888' }}>
                    {project.contractor} • {project.region} Region
                  </p>
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  background: project.status === 'active' ? '#e8f5e9' : '#fff3e0',
                  color: project.status === 'active' ? '#2e7d32' : '#e65100',
                }}>
                  {project.status === 'active' ? 'Active' : 'Pending Approval'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span>Disbursed: <strong>{project.disbursed}</strong> of {project.budget}</span>
                <span style={{ fontWeight: 600 }}>{project.progress}%</span>
              </div>
              <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '6px' }}>
                <div style={{
                  background: project.status === 'active' ? '#006B3F' : '#ccc',
                  borderRadius: '4px',
                  height: '6px',
                  width: `${project.progress}%`,
                }}></div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
