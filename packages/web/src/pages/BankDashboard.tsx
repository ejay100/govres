/**
 * GOVRES — Commercial Bank Dashboard
 * Settlement management, CRDN/GBDC balances, interbank operations
 */

import React, { useState } from 'react';

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
};

export function BankDashboard() {
  const [settleAmount, setSettleAmount] = useState('');
  const [settleBank, setSettleBank] = useState('');

  const bankName = 'Ghana Commercial Bank (GCB)';

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
            <span style={{ color: '#D4AF37' }}>GOVRES</span> — Bank Portal
          </h1>
          <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>{bankName}</p>
        </div>
        <span style={{
          background: '#0F3460',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
        }}>Bank Admin</span>
      </header>

      <main style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Balance Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
          <div style={{ ...cardStyle, borderLeft: '4px solid #006B3F' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>GBDC Balance</p>
            <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700, color: '#006B3F' }}>
              GH¢245,800,000
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>Available for settlement</p>
          </div>
          <div style={{ ...cardStyle, borderLeft: '4px solid #D4AF37' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>CRDN Holdings</p>
            <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700, color: '#D4AF37' }}>
              GH¢89,400,000
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>Pending conversion</p>
          </div>
          <div style={{ ...cardStyle, borderLeft: '4px solid #0F3460' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Settlements Today</p>
            <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700, color: '#0F3460' }}>
              47
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>GH¢12.3M total volume</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          {/* Interbank Settlement */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Interbank Settlement</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500 }}>Counterparty Bank</label>
              <select
                value={settleBank}
                onChange={e => setSettleBank(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  marginTop: '6px',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">Select bank…</option>
                <option value="stanbic">Stanbic Bank Ghana</option>
                <option value="ecobank">Ecobank Ghana</option>
                <option value="calbank">CalBank</option>
                <option value="absa">Absa Bank Ghana</option>
                <option value="fidelity">Fidelity Bank Ghana</option>
                <option value="uba">UBA Ghana</option>
                <option value="adb">Agricultural Development Bank</option>
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500 }}>Amount (GH¢)</label>
              <input
                type="number"
                value={settleAmount}
                onChange={e => setSettleAmount(e.target.value)}
                placeholder="Settlement amount"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  marginTop: '6px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button style={{
              width: '100%',
              padding: '12px',
              background: '#006B3F',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
            }}>Initiate Settlement</button>
          </div>

          {/* Contractor Payments */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Contractor Payments Queue</h3>
            {[
              { name: 'RoadMaster Construction Ltd', amount: 'GH¢2,340,000', project: 'Kumasi Ring Road', status: 'ready' },
              { name: 'AquaGhana Services', amount: 'GH¢890,000', project: 'Tamale Water Supply', status: 'ready' },
              { name: 'SolarTech Ghana', amount: 'GH¢1,450,000', project: 'Northern Solar Grid', status: 'pending_approval' },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '12px',
                border: '1px solid #f0f0f0',
                borderRadius: '8px',
                marginBottom: '8px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 500, fontSize: '14px' }}>{item.name}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 600 }}>{item.amount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>{item.project}</span>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: item.status === 'ready' ? '#e8f5e9' : '#fff3e0',
                    color: item.status === 'ready' ? '#2e7d32' : '#e65100',
                  }}>{item.status === 'ready' ? 'Ready to Disburse' : 'Pending Approval'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Settlement History */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Settlement History</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8f9fb' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Reference</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Counterparty</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Channel</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { ref: 'STL-2025-0847', type: 'Interbank', party: 'Ecobank Ghana', amount: 'GH¢4,500,000', channel: 'GBDC', status: 'settled' },
                { ref: 'STL-2025-0846', type: 'Contractor', party: 'BuildWell Ltd', amount: 'GH¢1,200,000', channel: 'GBDC→Bank', status: 'settled' },
                { ref: 'STL-2025-0845', type: 'CRDN Conv.', party: 'Farmer Collective', amount: 'GH¢340,000', channel: 'CRDN→MoMo', status: 'settled' },
                { ref: 'STL-2025-0844', type: 'Interbank', party: 'Stanbic Bank', amount: 'GH¢8,900,000', channel: 'GBDC', status: 'settled' },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '12px' }}>{row.ref}</td>
                  <td style={{ padding: '10px' }}>{row.type}</td>
                  <td style={{ padding: '10px' }}>{row.party}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace' }}>{row.amount}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: '#e3f2fd',
                      color: '#1565c0',
                      fontSize: '12px',
                    }}>{row.channel}</span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ color: '#006B3F' }}>✓ {row.status}</span>
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
