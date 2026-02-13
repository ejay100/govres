/**
 * GOVRES — Main App with Auth & Role-Based Routing
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { PublicDashboard } from './pages/PublicDashboard';
import { Login } from './pages/Login';
import { DashboardSelector } from './pages/DashboardSelector';
import { BogDashboard } from './pages/BogDashboard';
import { BankDashboard } from './pages/BankDashboard';
import { FarmerPortal } from './pages/FarmerPortal';
import { ContractorPortal } from './pages/ContractorPortal';
import { AgencyPortal } from './pages/AgencyPortal';
import { DiasporaPortal } from './pages/DiasporaPortal';
import { CocoaSupplyChain } from './pages/CocoaSupplyChain';
import { SimulationDashboard } from './pages/SimulationDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<PublicDashboard />} />
      <Route path="/simulation" element={<SimulationDashboard />} />
      <Route path="/login" element={<Login />} />
      
      {/* Dashboard selector (requires auth) */}
      <Route path="/portal" element={<DashboardSelector />} />

      {/* Role-specific protected portals */}
      <Route path="/bog/*" element={
        <ProtectedRoute allowedRoles={['BOG_ADMIN', 'BOG_AUDITOR']}>
          <BogDashboard />
        </ProtectedRoute>
      } />
      <Route path="/bank/*" element={
        <ProtectedRoute allowedRoles={['COMMERCIAL_BANK']}>
          <BankDashboard />
        </ProtectedRoute>
      } />
      <Route path="/farmer/*" element={
        <ProtectedRoute allowedRoles={['FARMER', 'LBC']}>
          <FarmerPortal />
        </ProtectedRoute>
      } />
      <Route path="/contractor/*" element={
        <ProtectedRoute allowedRoles={['CONTRACTOR']}>
          <ContractorPortal />
        </ProtectedRoute>
      } />
      <Route path="/agency/*" element={
        <ProtectedRoute allowedRoles={['GOVT_AGENCY']}>
          <AgencyPortal />
        </ProtectedRoute>
      } />
      <Route path="/diaspora/*" element={
        <ProtectedRoute allowedRoles={['DIASPORA']}>
          <DiasporaPortal />
        </ProtectedRoute>
      } />
      <Route path="/supply-chain/*" element={
        <ProtectedRoute allowedRoles={['BOG_ADMIN', 'BOG_AUDITOR', 'FARMER', 'LBC', 'GOVT_AGENCY']}>
          <CocoaSupplyChain />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
