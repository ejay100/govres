/**
 * GOVRES — Dashboard Layout with Navbar
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

interface Props {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
}

export function DashboardLayout({ children, title, subtitle, badge }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0D0D14]">
      {/* Header */}
      <header className="bg-[#1A1A2E] text-white px-8 py-4 flex justify-between items-center shadow-lg border-b border-white/10">
        <div>
          <h1 className="text-xl font-bold">
            <span className="text-govres-gold">GOVRES</span>
            <span className="text-gray-300 mx-2">—</span>
            <span>{title}</span>
          </h1>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          {badge && (
            <span className="bg-govres-green text-white text-xs px-3 py-1 rounded-full font-medium">
              {badge}
            </span>
          )}
          <Link to="/" className="text-govres-gold text-sm hover:underline">
            Public View
          </Link>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-300">{user.fullName}</span>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1440px] mx-auto px-8 py-8">
        {children}
      </main>
    </div>
  );
}
