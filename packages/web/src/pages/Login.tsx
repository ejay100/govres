/**
 * GOVRES — Login & Signup Page
 * Tabbed auth with Sign In, Create Account, and demo credentials.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, getRoleDashboard } from '../lib/auth';

const DEMO_CREDS = [
  { role: 'BOG Admin', email: 'admin@bog.gov.gh' },
  { role: 'Auditor', email: 'auditor@bog.gov.gh' },
  { role: 'Govt Agency', email: 'officer@mof.gov.gh' },
  { role: 'Bank', email: 'settlement@gcbbank.com.gh' },
  { role: 'LBC', email: 'clerk@pbc.com.gh' },
  { role: 'Farmer', email: 'kwame@example.com' },
  { role: 'Contractor', email: 'info@northgate.com.gh' },
  { role: 'Diaspora', email: 'kofi.asante@email.com' },
];

const SIGNUP_ROLES = [
  { value: 'FARMER', label: 'Farmer — Cocoa / crop producer' },
  { value: 'CONTRACTOR', label: 'Contractor — Government supplier' },
  { value: 'DIASPORA', label: 'Diaspora — Investment & remittance' },
];

export function Login() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login, signup, loading } = useAuth();
  const navigate = useNavigate();

  // ── Login state ──
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // ── Signup state ──
  const [signupForm, setSignupForm] = useState({
    fullName: '', email: '', phone: '', role: 'FARMER', password: '', confirmPassword: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(loginEmail, loginPassword);
      const stored = localStorage.getItem('govres_user');
      const user = stored ? JSON.parse(stored) : null;
      navigate(user ? getRoleDashboard(user.role) : '/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed. Check your credentials.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (signupForm.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await signup(signupForm);
      const stored = localStorage.getItem('govres_user');
      const user = stored ? JSON.parse(stored) : null;
      navigate(user ? getRoleDashboard(user.role) : '/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed. Please try again.');
    }
  };

  const fillDemo = (email: string) => {
    setLoginEmail(email);
    setLoginPassword('govres2025');
    setTab('login');
    setError('');
  };

  const updateSignup = (field: string, value: string) =>
    setSignupForm(prev => ({ ...prev, [field]: value }));

  const inputCls =
    'w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-govres-green focus:border-transparent';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-govres-navy via-[#0a1628] to-govres-blue">
      {/* ── Left: Branding ── */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="max-w-md text-white">
          <Link to="/" className="inline-flex items-center gap-2 mb-10 group">
            <div className="w-10 h-10 rounded-xl bg-govres-gold flex items-center justify-center font-bold text-govres-navy text-lg">
              G
            </div>
            <span className="text-2xl font-bold tracking-tight">
              GOV<span className="text-govres-gold">RES</span>
            </span>
          </Link>
          <h2 className="text-3xl font-extrabold leading-tight mb-4">
            Ghana's Sovereign Reserve & Settlement Ledger
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Access your role-specific portal — manage gold-backed instruments, cocoa receipts,
            government project settlements, and diaspora investments on a single permissioned ledger.
          </p>

          {/* Demo credentials */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-govres-gold uppercase tracking-widest mb-3">
              Demo Accounts (password: govres2025)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_CREDS.map((d) => (
                <button
                  key={d.email}
                  onClick={() => fillDemo(d.email)}
                  className="text-left text-xs px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <span className="block font-semibold text-gray-200">{d.role}</span>
                  <span className="text-gray-500 text-[11px]">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Auth Form ── */}
      <div className="lg:w-1/2 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl">
          {/* Tabs */}
          <div className="flex mb-8 border-b border-gray-200">
            <button
              onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                tab === 'login' ? 'border-govres-green text-govres-green' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('signup'); setError(''); setSuccess(''); }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                tab === 'signup' ? 'border-govres-green text-govres-green' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-5">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-5">
              {success}
            </div>
          )}

          {/* ── Sign In Form ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@example.com" className={inputCls} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" className={inputCls} required />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3.5 bg-govres-green text-white rounded-lg text-sm font-bold hover:bg-green-800 transition-colors disabled:opacity-50">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">
                Don't have an account?{' '}
                <button type="button" onClick={() => setTab('signup')} className="text-govres-green font-medium hover:underline">
                  Create one
                </button>
              </p>
            </form>
          )}

          {/* ── Signup Form ── */}
          {tab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" value={signupForm.fullName} onChange={(e) => updateSignup('fullName', e.target.value)} placeholder="Kwame Mensah" className={inputCls} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={signupForm.email} onChange={(e) => updateSignup('email', e.target.value)} placeholder="you@example.com" className={inputCls} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input type="tel" value={signupForm.phone} onChange={(e) => updateSignup('phone', e.target.value)} placeholder="+233 24 000 0000" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select value={signupForm.role} onChange={(e) => updateSignup('role', e.target.value)} className={inputCls}>
                  {SIGNUP_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Institutional accounts (BoG, Bank, Agency, LBC) require admin provisioning.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" value={signupForm.password} onChange={(e) => updateSignup('password', e.target.value)} placeholder="Min 8 chars" className={inputCls} required minLength={8} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm</label>
                  <input type="password" value={signupForm.confirmPassword} onChange={(e) => updateSignup('confirmPassword', e.target.value)} placeholder="Repeat" className={inputCls} required />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3.5 bg-govres-green text-white rounded-lg text-sm font-bold hover:bg-green-800 transition-colors disabled:opacity-50">
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">
                Already have an account?{' '}
                <button type="button" onClick={() => setTab('login')} className="text-govres-green font-medium hover:underline">
                  Sign in
                </button>
              </p>
            </form>
          )}

          <p className="text-center mt-6 text-[11px] text-gray-400">
            Authorized access only &bull; Bank of Ghana &bull; <Link to="/" className="text-govres-green hover:underline">Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
