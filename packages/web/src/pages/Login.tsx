/**
 * GOVRES — Login Page
 * Real authentication with API integration and Tailwind CSS.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getRoleDashboard } from '../lib/auth';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      const stored = localStorage.getItem('govres_user');
      const user = stored ? JSON.parse(stored) : null;
      navigate(user ? getRoleDashboard(user.role) : '/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed. Check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-govres-black via-govres-navy to-govres-blue">
      <div className="bg-white rounded-2xl p-12 w-full max-w-md shadow-2xl">
        <h1 className="text-center text-3xl font-bold mb-1">
          <span className="text-govres-gold">GOVRES</span>
        </h1>
        <p className="text-center text-gray-500 text-sm mb-8">
          Government Reserve & Settlement Ledger
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@bog.gov.gh"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-govres-green focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-govres-green focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-govres-green text-white rounded-lg text-base font-semibold hover:bg-green-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          <p>Demo: admin@bog.gov.gh / govres2025</p>
        </div>

        <p className="text-center mt-6 text-xs text-gray-400">
          Authorized access only • Bank of Ghana
        </p>
      </div>
    </div>
  );
}
