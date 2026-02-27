/**
 * OTTO² ADVISORY LAYOUT — Zone 3 Website
 * Brand: Blue — Ganzheitliche Finanzberatung
 */
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Wallet, Menu, X } from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { path: '/website/otto-advisory/unternehmer', label: 'Für Unternehmer' },
  { path: '/website/otto-advisory/private-haushalte', label: 'Privathaushalte' },
  { path: '/website/otto-advisory/finanzierung', label: 'Finanzierung' },
  { path: '/website/otto-advisory/kontakt', label: 'Kontakt' },
];

export default function OttoAdvisoryLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-blue-900/30 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link to="/website/otto-advisory" className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-blue-400" />
            <span className="text-lg font-bold">Otto²<span className="text-blue-400">Advisory</span></span>
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {NAV_ITEMS.map(item => (
              <Link key={item.path} to={item.path}
                className={`text-sm transition-colors hover:text-blue-400 ${location.pathname === item.path ? 'text-blue-400' : 'text-white/70'}`}>
                {item.label}
              </Link>
            ))}
          </nav>
          <button className="lg:hidden text-white/70" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileOpen && (
          <nav className="border-t border-blue-900/30 bg-slate-950/95 px-4 py-4 lg:hidden">
            {NAV_ITEMS.map(item => (
              <Link key={item.path} to={item.path} className="block py-2 text-sm text-white/70 hover:text-blue-400"
                onClick={() => setMobileOpen(false)}>{item.label}</Link>
            ))}
          </nav>
        )}
      </header>
      <main className="pt-16"><Outlet /></main>
      <footer className="border-t border-blue-900/20 bg-slate-950 py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 flex flex-col items-center justify-between gap-6 md:flex-row">
          <span className="text-sm font-semibold">Otto² Advisory</span>
          <div className="flex gap-6 text-xs text-white/40">
            <Link to="/website/otto-advisory/impressum" className="hover:text-white/70">Impressum</Link>
            <Link to="/website/otto-advisory/datenschutz" className="hover:text-white/70">Datenschutz</Link>
          </div>
          <p className="text-xs text-white/30">© {new Date().getFullYear()} Komplett ZL Finanzdienstleistungen GmbH</p>
        </div>
      </footer>
    </div>
  );
}
