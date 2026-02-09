/**
 * GOVRES — Diaspora Portal
 * Yield note purchase, asset-backed returns, investment dashboard
 */

import React, { useState } from 'react';

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
};

export function DiasporaPortal() {
  const [investAmount, setInvestAmount] = useState('');
  const [selectedNote, setSelectedNote] = useState('gold-12');

  const investorName = 'Akua Boateng';
  const country = 'United Kingdom';

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
            <span style={{ color: '#D4AF37' }}>GOVRES</span> — Diaspora Investment Portal
          </h1>
          <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>{investorName} • {country}</p>
        </div>
        <span style={{
          background: '#D4AF37',
          color: '#1A1A2E',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 600,
        }}>Diaspora Investor</span>
      </header>

      <main style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Portfolio Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
          <div style={{ ...cardStyle, borderLeft: '4px solid #D4AF37' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Portfolio Value</p>
            <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#D4AF37' }}>$42,500</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#2e7d32' }}>↑ 8.4% return</p>
          </div>
          <div style={{ ...cardStyle, borderLeft: '4px solid #006B3F' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Gold-Backed Notes</p>
            <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#006B3F' }}>$28,000</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>3 active notes</p>
          </div>
          <div style={{ ...cardStyle, borderLeft: '4px solid #8B4513' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Cocoa-Backed Notes</p>
            <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#8B4513' }}>$14,500</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>2 active notes</p>
          </div>
          <div style={{ ...cardStyle, borderLeft: '4px solid #0F3460' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Yield Earned</p>
            <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#0F3460' }}>$3,290</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>Since inception</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          {/* Available Yield Notes */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Available Yield Notes</h3>
            {[
              {
                id: 'gold-12',
                name: 'Gold Reserve Note — 12 Month',
                backing: '100% Gold-Backed',
                yield: '7.2% p.a.',
                min: '$1,000',
                rating: 'A+',
                color: '#D4AF37',
              },
              {
                id: 'gold-24',
                name: 'Gold Reserve Note — 24 Month',
                backing: '100% Gold-Backed',
                yield: '9.5% p.a.',
                min: '$5,000',
                rating: 'A+',
                color: '#D4AF37',
              },
              {
                id: 'cocoa-12',
                name: 'Cocoa Season Note — 12 Month',
                backing: 'Cocoa Receipt-Backed',
                yield: '11.2% p.a.',
                min: '$500',
                rating: 'A',
                color: '#8B4513',
              },
              {
                id: 'hybrid-18',
                name: 'Hybrid Reserve Note — 18 Month',
                backing: 'Gold + Cocoa Blended',
                yield: '8.8% p.a.',
                min: '$2,000',
                rating: 'A+',
                color: '#006B3F',
              },
            ].map(note => (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note.id)}
                style={{
                  padding: '16px',
                  border: selectedNote === note.id ? `2px solid ${note.color}` : '1px solid #f0f0f0',
                  borderRadius: '10px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  background: selectedNote === note.id ? '#fafafa' : '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{note.name}</span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: note.color + '20',
                    color: note.color,
                    fontWeight: 600,
                  }}>{note.yield}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888' }}>
                  <span>{note.backing}</span>
                  <span>Min: {note.min} • Rating: {note.rating}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Purchase Form */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Purchase Yield Note</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500 }}>Investment Amount (USD)</label>
              <input
                type="number"
                value={investAmount}
                onChange={e => setInvestAmount(e.target.value)}
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

            {investAmount && Number(investAmount) > 0 && (
              <div style={{
                background: '#f8f9fb',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
                fontSize: '13px',
              }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>Investment Summary</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Amount</span>
                  <span style={{ fontFamily: 'monospace' }}>${Number(investAmount).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>GHS Equivalent (@ 14.5)</span>
                  <span style={{ fontFamily: 'monospace' }}>GH¢{(Number(investAmount) * 14.5).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Expected Annual Yield</span>
                  <span style={{ fontFamily: 'monospace', color: '#2e7d32' }}>
                    ${(Number(investAmount) * 0.072).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #e0e0e0' }}>
                  <span style={{ fontWeight: 600 }}>Maturity Value (12m)</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#006B3F' }}>
                    ${(Number(investAmount) * 1.072).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div style={{
              background: '#e8f5e9',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#2e7d32',
            }}>
              <strong>Asset-Backed Guarantee:</strong> All yield notes are backed 1:1 by verified
              gold reserves (PMMC attested) or Cocobod warehouse receipts recorded on the GOVRES ledger.
            </div>

            <button style={{
              width: '100%',
              padding: '14px',
              background: '#D4AF37',
              color: '#1A1A2E',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '16px',
              cursor: 'pointer',
            }}>
              Purchase Yield Note
            </button>
          </div>
        </div>

        {/* Active Investments */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Your Active Investments</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8f9fb' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Note ID</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Principal</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Yield Rate</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Accrued</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Maturity</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'YN-G-2025-001', type: 'Gold 12M', principal: '$10,000', rate: '7.2%', accrued: '$420', maturity: 'Jan 2026', status: 'active' },
                { id: 'YN-G-2025-003', type: 'Gold 24M', principal: '$15,000', rate: '9.5%', accrued: '$890', maturity: 'Jun 2027', status: 'active' },
                { id: 'YN-C-2025-002', type: 'Cocoa 12M', principal: '$8,500', rate: '11.2%', accrued: '$560', maturity: 'Mar 2026', status: 'active' },
                { id: 'YN-H-2024-005', type: 'Hybrid 18M', principal: '$6,000', rate: '8.8%', accrued: '$1,420', maturity: 'Sep 2025', status: 'maturing' },
                { id: 'YN-G-2024-001', type: 'Gold 12M', principal: '$3,000', rate: '6.8%', accrued: '$204', maturity: 'Apr 2025', status: 'matured' },
              ].map((inv, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '12px' }}>{inv.id}</td>
                  <td style={{ padding: '10px' }}>{inv.type}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace' }}>{inv.principal}</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#2e7d32' }}>{inv.rate}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', color: '#006B3F' }}>{inv.accrued}</td>
                  <td style={{ padding: '10px', color: '#666' }}>{inv.maturity}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: inv.status === 'active' ? '#e8f5e9' : inv.status === 'maturing' ? '#fff3e0' : '#e0e0e0',
                      color: inv.status === 'active' ? '#2e7d32' : inv.status === 'maturing' ? '#e65100' : '#666',
                    }}>{inv.status}</span>
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
