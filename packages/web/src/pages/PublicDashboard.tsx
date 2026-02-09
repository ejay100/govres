/**
 * GOVRES — Public Sovereign Asset Dashboard
 * 
 * Read-only dashboard showing Ghana's sovereign assets in real-time.
 * Per whitepaper Section 9:
 * - Total gold in vault (mg precision)
 * - Cocoa warehouse receipts
 * - Outstanding GBDC/CRDN circulation
 * - Reduces speculation, stabilizes cedi
 */

import React from 'react';

interface ReserveCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
}

function ReserveCard({ title, value, subtitle, icon, color }: ReserveCardProps) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '24px',
      borderTop: `4px solid ${color}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>{title}</p>
          <h2 style={{ fontSize: '28px', fontWeight: 700, margin: '8px 0' }}>{value}</h2>
          <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>{subtitle}</p>
        </div>
        <span style={{ fontSize: '32px' }}>{icon}</span>
      </div>
    </div>
  );
}

export function PublicDashboard() {
  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f8' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
        color: '#fff',
        padding: '24px 0',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                <span style={{ color: '#D4AF37' }}>GOVRES</span> — Sovereign Asset Dashboard
              </h1>
              <p style={{ color: '#aaa', margin: '4px 0 0', fontSize: '14px' }}>
                Bank of Ghana • Government Reserve & Settlement Ledger
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ 
                background: '#00A86B', 
                color: '#fff', 
                padding: '4px 12px', 
                borderRadius: '12px', 
                fontSize: '12px' 
              }}>
                LIVE
              </span>
              <p style={{ color: '#888', fontSize: '12px', margin: '4px 0 0' }}>
                Real-time asset transparency
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Reserve Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
          gap: '20px',
          marginBottom: '32px',
        }}>
          <ReserveCard
            title="Gold Reserves"
            value="0.000 kg"
            subtitle="Verified by BoG Vault Oracle"
            icon="🥇"
            color="#D4AF37"
          />
          <ReserveCard
            title="Cocoa Reserves"
            value="0 bags"
            subtitle="Season 2025/2026"
            icon="🫘"
            color="#006B3F"
          />
          <ReserveCard
            title="GBDC Outstanding"
            value="GH¢ 0.00"
            subtitle="Gold-Backed Digital Cedi"
            icon="💰"
            color="#0F3460"
          />
          <ReserveCard
            title="CRDN Outstanding"
            value="GH¢ 0.00"
            subtitle="Cocoa Receipt Digital Notes"
            icon="📜"
            color="#CE1126"
          />
        </div>

        {/* Monetary Metrics */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: '32px',
        }}>
          <h3 style={{ margin: '0 0 16px', color: '#1A1A2E' }}>Monetary Metrics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div>
              <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>Money Multiplier (m)</p>
              <p style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0', color: '#006B3F' }}>2.50x</p>
              <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>M = m × MB</p>
            </div>
            <div>
              <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>Reserve Backing Ratio</p>
              <p style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0', color: '#D4AF37' }}>100%</p>
              <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>Assets / Outstanding</p>
            </div>
            <div>
              <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>Liquidity Velocity</p>
              <p style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0', color: '#0F3460' }}>0.0</p>
              <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>Daily settlement flow</p>
            </div>
          </div>
        </div>

        {/* Info Bar */}
        <div style={{
          background: '#E8F5E9',
          borderRadius: '8px',
          padding: '16px 20px',
          borderLeft: '4px solid #006B3F',
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#2E7D32' }}>
            <strong>GOVRES</strong> is a Bank of Ghana reserve and settlement ledger that transforms 
            gold, cocoa, and mineral royalties into live, asset-backed digital instruments. 
            All data is verifiable through the Oracle attestation system.
          </p>
        </div>

        {/* Footer */}
        <footer style={{ textAlign: 'center', padding: '32px 0', color: '#888', fontSize: '12px' }}>
          <p>Bank of Ghana • GOVRES v1.0 • Compliant with Act 612, Act 987, VASP Act 2025</p>
          <p>42 Castle Road, Ridge, Accra • P.O. Box GP 2674</p>
        </footer>
      </main>
    </div>
  );
}
