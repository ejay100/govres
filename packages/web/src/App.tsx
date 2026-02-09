/**
 * GOVRES — Main App with Role-Based Routing
 * 
 * Routes users to their respective portals based on their role:
 * - BoG Admin/Auditor → Admin Dashboard
 * - Government Agency → Project Management Portal
 * - Commercial Bank → Settlement Dashboard
 * - Contractor → Payment Portal
 * - Farmer/LBC → CRDN Management
 * - Diaspora → Yield Notes Portal
 * - Public → Read-only Dashboard
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicDashboard } from './pages/PublicDashboard';
import { Login } from './pages/Login';
import { BogDashboard } from './pages/BogDashboard';
import { BankDashboard } from './pages/BankDashboard';
import { FarmerPortal } from './pages/FarmerPortal';
import { ContractorPortal } from './pages/ContractorPortal';
import { AgencyPortal } from './pages/AgencyPortal';
import { DiasporaPortal } from './pages/DiasporaPortal';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicDashboard />} />
      <Route path="/login" element={<Login />} />

      {/* Role-specific portals */}
      <Route path="/bog/*" element={<BogDashboard />} />
      <Route path="/bank/*" element={<BankDashboard />} />
      <Route path="/farmer/*" element={<FarmerPortal />} />
      <Route path="/contractor/*" element={<ContractorPortal />} />
      <Route path="/agency/*" element={<AgencyPortal />} />
      <Route path="/diaspora/*" element={<DiasporaPortal />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
