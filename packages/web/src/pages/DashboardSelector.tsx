/**
 * GOVRES — Dashboard Selector Portal
 * Central hub to access role-specific dashboards after authentication.
 * Shows available portals based on user role.
 */

import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth, getRoleDashboard } from '../lib/auth';

interface PortalCard {
  role: string;
  title: string;
  description: string;
  path: string;
  color: string;
  icon: React.ReactNode;
}

const PORTALS: PortalCard[] = [
  {
    role: 'BOG_ADMIN',
    title: 'BoG Admin Dashboard',
    description: 'Gold reserve management, GBDC minting, oracle monitoring, ledger administration.',
    path: '/bog',
    color: 'bg-govres-navy',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    role: 'BOG_AUDITOR',
    title: 'BoG Auditor Portal',
    description: 'Audit trails, compliance reporting, reserve verification, transaction forensics.',
    path: '/bog',
    color: 'bg-purple-700',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    role: 'COMMERCIAL_BANK',
    title: 'Bank Settlement Portal',
    description: 'Interbank GBDC settlements, contractor disbursement, reserve position tracking.',
    path: '/bank',
    color: 'bg-govres-blue',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>
    ),
  },
  {
    role: 'GOVT_AGENCY',
    title: 'Government Agency Portal',
    description: 'Project submission, milestone approvals, GBDC fund disbursement tracking.',
    path: '/agency',
    color: 'bg-purple-600',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    role: 'LBC',
    title: 'LBC Operations Portal',
    description: 'Farm-gate cocoa delivery capture, CRDN issuance, warehouse receipt management.',
    path: '/farmer',
    color: 'bg-yellow-700',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
  },
  {
    role: 'CONTRACTOR',
    title: 'Contractor Portal',
    description: 'Government project tracking, milestone payments, GBDC settlement history.',
    path: '/contractor',
    color: 'bg-govres-green',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    role: 'FARMER',
    title: 'Farmer Portal',
    description: 'CRDN instruments, conversion to eCedi, MoMo cashout, delivery history.',
    path: '/farmer',
    color: 'bg-green-600',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
    ),
  },
  {
    role: 'DIASPORA',
    title: 'Diaspora Investment Portal',
    description: 'Gold-backed yield notes, eCedi remittance, reserve transparency dashboard.',
    path: '/diaspora',
    color: 'bg-govres-red',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export function DashboardSelector() {
  const { user, logout, isAuthenticated } = useAuth();

  // Redirect unauthenticated users to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Get the portals this user can access
  const accessiblePortals = PORTALS.filter(p => {
    // Exact role match
    if (p.role === user.role) return true;
    // BOG_ADMIN can access BOG_AUDITOR portal (both go to /bog)
    if (user.role === 'BOG_ADMIN' && p.role === 'BOG_AUDITOR') return false; // show only admin
    if (user.role === 'BOG_AUDITOR' && p.role === 'BOG_ADMIN') return false; // show only auditor
    // LBC can access farmer portal
    if (user.role === 'LBC' && p.role === 'FARMER') return false; // show only LBC
    if (user.role === 'FARMER' && p.role === 'LBC') return false; // show only farmer
    return false;
  });

  const primaryPortal = accessiblePortals.find(p => p.role === user.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-govres-navy via-[0a1628] to-govres-blue">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-govres-gold flex items-center justify-center font-bold text-govres-navy text-lg">
              G
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              GOV<span className="text-govres-gold">RES</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-white font-medium text-sm">{user.fullName}</p>
              <p className="text-gray-400 text-xs">{user.role.replace(/_/g, ' ')}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome, {user.fullName.split(' ')[0]}
          </h1>
          <p className="text-gray-400">
            Select your portal to access GOVRES services
          </p>
        </div>

        {/* Quick Access — Go directly to primary dashboard */}
        {primaryPortal && (
          <div className="mb-10">
            <Link
              to={getRoleDashboard(user.role)}
              className={`block w-full ${primaryPortal.color} rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-center gap-6">
                <div className="p-4 bg-white/20 rounded-xl">
                  {primaryPortal.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{primaryPortal.title}</h2>
                  <p className="text-white/80 text-sm mt-1">{primaryPortal.description}</p>
                </div>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </Link>
          </div>
        )}

        {/* Other Available Portals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accessiblePortals.filter(p => p.role !== user.role).map(portal => (
            <Link
              key={portal.role}
              to={portal.path}
              className="block bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 text-white transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 ${portal.color} rounded-lg`}>
                  {portal.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{portal.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{portal.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Public Resources */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Public Resources
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-colors"
            >
              Public Reserve Dashboard
            </Link>
            <Link
              to="/supply-chain"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-govres-gold text-sm transition-colors"
            >
              🌱 Cocoa Supply Chain
            </Link>
            <Link
              to="/"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-colors"
            >
              About GOVRES
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
