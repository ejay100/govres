/**
 * GOVRES — Bank of Ghana Dashboard
 * Central bank oversight: reserve monitoring, GBDC issuance, compliance, oracle status
 */

import React, { useState } from 'react';

interface ReserveData {
  goldGrams: number;
  goldValueUSD: number;
  cocoaKg: number;
  cocoaValueGHS: number;
  gbdcCirculation: number;
  crdnOutstanding: number;
  backingRatio: number;
  multiplier: number;
}

const mockReserve: ReserveData = {
  goldGrams: 8_809_000,
  goldValueUSD: 632_000_000,
  cocoaKg: 450_000_000,
  cocoaValueGHS: 44_950_000_000,
  gbdcCirculation: 1_580_000_000,
  crdnOutstanding: 34_200_000_000,
  backingRatio: 1.12,
  multiplier: 2.5,
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  marginBottom: '16px',
  color: '#1A1A2E',
};

export function BogDashboard() {
  const [mintAmount, setMintAmount] = useState('');

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      {/* Header */}
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
            <span style={{ color: '#D4AF37' }}>GOVRES</span> — Central Bank Dashboard
          </h1>
          <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>Bank of Ghana • Governor's Office</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{
            background: '#006B3F',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
          }}>BoG Admin</span>
          <a href="/" style={{ color: '#D4AF37', fontSize: '14px', textDecoration: 'none' }}>Public View</a>
        </div>
      </header>

      <main style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Reserve Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
          <div style={{ ...cardStyle, borderLeft: '4px solid #D4AF37' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Gold Reserve</p>
            <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#D4AF37' }}>
              {(mockReserve.goldGrams / 1000).toFixed(1)}kg
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
              ${(mockReserve.goldValueUSD / 1_000_000).toFixed(0)}M USD
            </p>
          </div>
          <div style={{ ...cardStyle, borderLeft: '4px solid #8B4513' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Cocoa Reserve</p>
            <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#8B4513' }}>
              {(mockReserve.cocoaKg / 1_000_000).toFixed(0)}k MT
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
              GH¢{(mockReserve.cocoaValueGHS / 1_000_000_000).toFixed(1)}B
            </p>
          </div>
          <div style={{ ...cardStyle, borderLeft: '4px solid #006B3F' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>GBDC in Circulation</p>
            <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#006B3F' }}>
              GH¢{(mockReserve.gbdcCirculation / 1_000_000_000).toFixed(2)}B
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
              Backing: {(mockReserve.backingRatio * 100).toFixed(0)}%
            </p>
          </div>
          <div style={{ ...cardStyle, borderLeft: '4px solid #CE1126' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>CRDN Outstanding</p>
            <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#CE1126' }}>
              GH¢{(mockReserve.crdnOutstanding / 1_000_000_000).toFixed(1)}B
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
              Multiplier: {mockReserve.multiplier}×
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
          {/* Oracle Status Panel */}
          <div style={cardStyle}>
            <h3 style={sectionTitle}>Oracle Attestation Status</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8f9fb' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Source</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Last Attestation</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { source: 'Precious Minerals (PMMC)', last: '2 min ago', status: 'active', confidence: 99.2 },
                  { source: 'Cocobod Warehouse — Tema', last: '8 min ago', status: 'active', confidence: 97.8 },
                  { source: 'Cocobod Warehouse — Takoradi', last: '12 min ago', status: 'active', confidence: 96.5 },
                  { source: 'BoG Vault — Accra', last: '1 min ago', status: 'active', confidence: 99.9 },
                  { source: 'GoldBod Royalty Feed', last: '45 min ago', status: 'warning', confidence: 91.0 },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px' }}>{row.source}</td>
                    <td style={{ padding: '10px', color: '#666' }}>{row.last}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: row.status === 'active' ? '#006B3F' : '#D4AF37',
                        marginRight: '6px',
                      }}></span>
                      {row.status}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace' }}>
                      {row.confidence.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* GBDC Mint Panel */}
          <div style={cardStyle}>
            <h3 style={sectionTitle}>Mint GBDC</h3>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
              Issue new Gold-Backed Digital Credits backed by verified reserve attestations.
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500 }}>Amount (GH¢)</label>
              <input
                type="number"
                value={mintAmount}
                onChange={e => setMintAmount(e.target.value)}
                placeholder="e.g. 10,000,000"
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
            <div style={{
              background: '#f8f9fb',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              fontSize: '13px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Gold backing required</span>
                <span style={{ fontFamily: 'monospace' }}>
                  {mintAmount ? (Number(mintAmount) * 0.10 / 71.80).toFixed(2) : '—'} g
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Reserve allocation (10%)</span>
                <span style={{ fontFamily: 'monospace' }}>
                  GH¢{mintAmount ? (Number(mintAmount) * 0.10).toLocaleString() : '—'}
                </span>
              </div>
            </div>
            <button
              style={{
                width: '100%',
                padding: '12px',
                background: '#006B3F',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Mint GBDC
            </button>
          </div>
        </div>

        {/* Recent Ledger Transactions */}
        <div style={cardStyle}>
          <h3 style={sectionTitle}>Recent Ledger Transactions</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8f9fb' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Tx ID</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>From → To</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: '0xa3f1…cd9e', type: 'GBDC_MINT', flow: 'BoG → Reserve', amount: 'GH¢5,000,000', status: 'confirmed', time: '14:32' },
                { id: '0xb7c2…e412', type: 'CRDN_ISSUE', flow: 'CocoB → Farmer', amount: 'GH¢124,800', status: 'confirmed', time: '14:28' },
                { id: '0xd9a4…f891', type: 'SETTLEMENT', flow: 'GCB → Contractor', amount: 'GH¢2,340,000', status: 'pending', time: '14:25' },
                { id: '0xe5b1…a023', type: 'GBDC_TRANSFER', flow: 'Stanbic → CalBank', amount: 'GH¢890,000', status: 'confirmed', time: '14:21' },
                { id: '0xf2d8…b765', type: 'CRDN_CONVERT', flow: 'Farmer → MoMo', amount: 'GH¢8,450', status: 'confirmed', time: '14:18' },
              ].map((tx, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '12px' }}>{tx.id}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      background: tx.type.startsWith('GBDC') ? '#e8f5e9' : tx.type.startsWith('CRDN') ? '#fff3e0' : '#e3f2fd',
                      color: tx.type.startsWith('GBDC') ? '#2e7d32' : tx.type.startsWith('CRDN') ? '#e65100' : '#1565c0',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}>{tx.type}</span>
                  </td>
                  <td style={{ padding: '10px', color: '#666' }}>{tx.flow}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace' }}>{tx.amount}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: tx.status === 'confirmed' ? '#006B3F' : '#D4AF37',
                      marginRight: '6px',
                    }}></span>
                    {tx.status}
                  </td>
                  <td style={{ padding: '10px', color: '#888' }}>{tx.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
