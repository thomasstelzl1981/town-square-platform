/**
 * OTTO² ADVISORY LAYOUT — Zone 3 Website
 * Brand: Blue — Ganzheitliche Finanzberatung
 * Legal: Komplett ZL Finanzdienstleistungen GmbH
 */
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Wallet, Menu, X, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Helmet } from 'react-helmet';

const NAV_ITEMS = [
  { path: '/website/otto-advisory/unternehmer', label: 'Für Unternehmer' },
  { path: '/website/otto-advisory/private-haushalte', label: 'Privathaushalte' },
  { path: '/website/otto-advisory/finanzierung', label: 'Finanzierung' },
  { path: '/website/otto-advisory/kontakt', label: 'Kontakt' },
];

const FOOTER_NAV = [
  { path: '/website/otto-advisory/unternehmer', label: 'Für Unternehmer' },
  { path: '/website/otto-advisory/private-haushalte', label: 'Für Privathaushalte' },
  { path: '/website/otto-advisory/finanzierung', label: 'Finanzierung beantragen' },
  { path: '/website/otto-advisory/kontakt', label: 'Kontakt' },
];

const FOOTER_LEGAL = [
  { path: '/website/otto-advisory/impressum', label: 'Impressum' },
  { path: '/website/otto-advisory/datenschutz', label: 'Datenschutz' },
];

export default function OttoAdvisoryLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
        <meta name="theme-color" content="#020617" />
      </Helmet>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-blue-900/30 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          {/* Logo */}
          <Link to="/website/otto-advisory" className="flex items-center gap-3">
            {/* Geometric O² Logo */}
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute top-0 left-1.5 w-6 h-1.5 bg-blue-500 rounded-sm" />
              <div className="absolute bottom-0 left-1.5 w-6 h-1.5 bg-blue-500 rounded-sm" />
              <div className="absolute left-0 top-1.5 w-1.5 h-6 bg-blue-500 rounded-sm" />
              <div className="absolute right-0 top-1.5 w-1.5 h-6 bg-blue-400/60 rounded-sm" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold">Otto²<span className="text-blue-400">Advisory</span></span>
              <p className="text-[10px] text-white/40 -mt-0.5">ZL Finanzdienstleistungen</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-blue-400 bg-blue-500/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA + Mobile */}
          <div className="flex items-center gap-3">
            <Link
              to="/website/otto-advisory/finanzierung"
              className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-400 transition-colors"
            >
              Finanzierung starten <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              className="lg:hidden p-2 text-white/70 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menü"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="border-t border-blue-900/30 bg-slate-950/95 backdrop-blur-xl px-4 py-4 lg:hidden">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`block rounded-md px-3 py-2.5 text-sm font-medium ${
                  location.pathname === item.path ? 'text-blue-400 bg-blue-500/10' : 'text-white/60 hover:text-white'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/website/otto-advisory/finanzierung"
              className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white"
              onClick={() => setMobileOpen(false)}
            >
              Finanzierung starten <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        )}
      </header>

      {/* Main */}
      <main className="pt-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-blue-900/20 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <div className="grid gap-12 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-9 h-9 flex items-center justify-center">
                  <div className="absolute top-0 left-1.5 w-6 h-1.5 bg-blue-400 rounded-sm" />
                  <div className="absolute bottom-0 left-1.5 w-6 h-1.5 bg-blue-400 rounded-sm" />
                  <div className="absolute left-0 top-1.5 w-1.5 h-6 bg-blue-400 rounded-sm" />
                  <div className="absolute right-0 top-1.5 w-1.5 h-6 bg-blue-300/50 rounded-sm" />
                </div>
                <div>
                  <span className="font-bold text-lg">Otto² Advisory</span>
                  <p className="text-[10px] text-white/40">ZL Finanzdienstleistungen GmbH</p>
                </div>
              </div>
              <p className="text-sm text-white/50 max-w-md leading-relaxed">
                Finanz- und Vorsorgekonzepte für Unternehmer und Familien.
                Erst Analyse, dann Zielbild — strukturiert umsetzen.
              </p>
              <p className="mt-6 text-xs text-white/30 max-w-md leading-relaxed">
                Otto² Advisory erbringt keine Steuer- oder Rechtsberatung. Steuerliche und rechtliche Fragen werden in Abstimmung mit dem Steuerberater/Rechtsanwalt des Kunden geklärt.
              </p>
            </div>

            {/* Leistungen */}
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white/80">Leistungen</h4>
              <ul className="space-y-2">
                {FOOTER_NAV.map(link => (
                  <li key={link.path}>
                    <Link to={link.path} className="text-sm text-white/40 hover:text-white/70 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Rechtliches */}
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white/80">Rechtliches</h4>
              <ul className="space-y-2">
                {FOOTER_LEGAL.map(link => (
                  <li key={link.path}>
                    <Link to={link.path} className="text-sm text-white/40 hover:text-white/70 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} Komplett ZL Finanzdienstleistungen GmbH. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
