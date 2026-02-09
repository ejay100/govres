/**
 * GOVRES — Farmer Portal
 * CRDN receipt view, conversion to GBDC/cash, transaction history, MoMo integration
 */

import React, { useState } from 'react';

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
};

export function FarmerPortal() {
  const [convertAmount, setConvertAmount] = useState('');
  const [cashoutMethod, setCashoutMethod] = useState('momo');

  const farmerName = 'Kwame Mensah';
  const farmerId = 'FRM-ASH-2025-00412';
  const region = 'Ashanti Region — Kumasi District';

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
            <span style={{ color: '#D4AF37' }}>GOVRES</span> — Farmer Portal
          </h1>
          <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>{farmerName} • {region}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{
            background: '#8B4513',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
          }}>Farmer</span>
          <span style={{ fontSize: '12px', color: '#aaa' }}>{farmerId}</span>
        </div>
      </header>

      <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Balance Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
          <div style={{ ...cardStyle, borderLeft: '4px solid #8B4513' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>CRDN Balance</p>
            <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700, color: '#8B4513' }}>
              GH¢42,560
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
              6 active receipts
            </p>
          </div>
          <div style={{ ...cardStyle, borderLeft: '4px solid #006B3F' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Converted to GBDC</p>
            <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700, color: '#006B3F' }}>
              GH¢124,800
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>This season</p>
          </div>
          <div style={{ ...cardStyle, borderLeft: '4px solid #0F3460' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Cashed Out</p>
            <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700, color: '#0F3460' }}>
              GH¢98,200
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>Via MoMo & bank transfer</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          {/* Active CRDN Receipts */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Active Cocoa Receipts (CRDN)</h3>
            {[
              { id: 'CRDN-2025-05-001', bags: 12, weight: '768 kg', grade: 'Grade I', value: 'GH¢11,520', date: 'May 14, 2025' },
              { id: 'CRDN-2025-05-002', bags: 8, weight: '512 kg', grade: 'Grade I', value: 'GH¢7,680', date: 'May 18, 2025' },
              { id: 'CRDN-2025-04-009', bags: 15, weight: '960 kg', grade: 'Grade II', value: 'GH¢12,800', date: 'Apr 28, 2025' },
              { id: 'CRDN-2025-04-006', bags: 7, weight: '448 kg', grade: 'Grade I', value: 'GH¢6,720', date: 'Apr 15, 2025' },
            ].map((crdn, i) => (
              <div key={i} style={{
                padding: '12px',
                border: '1px solid #f0f0f0',
                borderRadius: '8px',
                marginBottom: '8px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#8B4513' }}>{crdn.id}</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{crdn.value}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888' }}>
                  <span>{crdn.bags} bags • {crdn.weight} • {crdn.grade}</span>
                  <span>{crdn.date}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Cash Out / Convert */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Convert & Cash Out</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500 }}>Amount to convert (GH¢)</label>
              <input
                type="number"
                value={convertAmount}
                onChange={e => setConvertAmount(e.target.value)}
                placeholder="e.g. 5000"
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
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500 }}>Cash-out method</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {[
                  { value: 'momo', label: 'MTN MoMo', icon: '📱' },
                  { value: 'vodafone', label: 'Vodafone Cash', icon: '📱' },
                  { value: 'bank', label: 'Bank Transfer', icon: '🏦' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setCashoutMethod(opt.value)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: cashoutMethod === opt.value ? '2px solid #006B3F' : '1px solid #ddd',
                      borderRadius: '8px',
                      background: cashoutMethod === opt.value ? '#e8f5e9' : '#fff',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {cashoutMethod === 'momo' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500 }}>MoMo Number</label>
                <input
                  type="tel"
                  placeholder="024 XXX XXXX"
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
            )}

            <div style={{
              background: '#fff8e1',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              fontSize: '13px',
            }}>
              <strong>Flow:</strong> CRDN → GBDC → {cashoutMethod === 'bank' ? 'Bank Account' : 'Mobile Money'}
              <br />
              <span style={{ color: '#666' }}>Settlement via GOVRES ledger with full audit trail</span>
            </div>

            <button style={{
              width: '100%',
              padding: '12px',
              background: '#8B4513',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
            }}>
              Convert & Cash Out
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Transaction History</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8f9fb' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Channel</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { date: 'May 18', type: 'CRDN Issued', amount: '+GH¢7,680', channel: 'Cocobod LBC', status: 'confirmed' },
                { date: 'May 16', type: 'Cash Out', amount: '-GH¢5,000', channel: 'MTN MoMo', status: 'confirmed' },
                { date: 'May 14', type: 'CRDN Issued', amount: '+GH¢11,520', channel: 'Cocobod LBC', status: 'confirmed' },
                { date: 'May 10', type: 'CRDN → GBDC', amount: 'GH¢8,400', channel: 'Conversion', status: 'confirmed' },
                { date: 'May 8', type: 'Cash Out', amount: '-GH¢8,400', channel: 'GCB Bank', status: 'confirmed' },
              ].map((tx, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px', color: '#888' }}>{tx.date}</td>
                  <td style={{ padding: '10px' }}>{tx.type}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', color: tx.amount.startsWith('+') ? '#2e7d32' : '#c62828' }}>
                    {tx.amount}
                  </td>
                  <td style={{ padding: '10px', fontSize: '13px' }}>{tx.channel}</td>
                  <td style={{ padding: '10px', color: '#006B3F' }}>✓ {tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
