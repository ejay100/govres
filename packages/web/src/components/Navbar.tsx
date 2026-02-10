/**
 * GOVRES — Public Navbar
 * Top navigation bar for landing and public-facing pages.
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { getRoleDashboard } from '../lib/auth';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Services', to: '/#services' },
  { label: 'How It Works', to: '/#how-it-works' },
  { label: 'About', to: '/#about' },
];

export function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollToSection = (hash: string) => {
    setMobileOpen(false);
    if (location.pathname !== '/') {
      // Navigate home first — the hash will be picked up after render
      window.location.href = hash;
      return;
    }
    const id = hash.replace('/#', '');
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-govres-navy/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-govres-gold flex items-center justify-center font-bold text-govres-navy text-sm">
            G
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            GOV<span className="text-govres-gold">RES</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) =>
            link.to.startsWith('/#') ? (
              <button
                key={link.to}
                onClick={() => scrollToSection(link.to)}
                className="text-sm text-gray-300 hover:text-govres-gold transition-colors"
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm transition-colors ${
                  location.pathname === link.to
                    ? 'text-govres-gold font-semibold'
                    : 'text-gray-300 hover:text-govres-gold'
                }`}
              >
                {link.label}
              </Link>
            )
          )}
        </div>

        {/* CTA / Auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link
              to={getRoleDashboard(user.role)}
              className="px-5 py-2 bg-govres-gold text-govres-navy rounded-lg text-sm font-semibold hover:bg-yellow-400 transition-colors"
            >
              My Portal
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="px-5 py-2 bg-govres-gold text-govres-navy rounded-lg text-sm font-semibold hover:bg-yellow-400 transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-gray-300 hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-govres-navy border-t border-white/10 px-6 py-4 space-y-3">
          {NAV_LINKS.map((link) =>
            link.to.startsWith('/#') ? (
              <button
                key={link.to}
                onClick={() => scrollToSection(link.to)}
                className="block w-full text-left text-sm text-gray-300 hover:text-govres-gold py-1"
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block text-sm text-gray-300 hover:text-govres-gold py-1"
              >
                {link.label}
              </Link>
            )
          )}
          <div className="pt-3 border-t border-white/10">
            {user ? (
              <Link
                to={getRoleDashboard(user.role)}
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center px-4 py-2.5 bg-govres-gold text-govres-navy rounded-lg text-sm font-semibold"
              >
                My Portal
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center px-4 py-2.5 bg-govres-gold text-govres-navy rounded-lg text-sm font-semibold"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
