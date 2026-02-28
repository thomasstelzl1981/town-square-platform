/**
 * ZL WOHNBAU LAYOUT — Zone 3 Website
 * Brand: Earthy Green — Wohnraum für Mitarbeiter
 * Legal: ZL Wohnbau GmbH, Oberhaching
 * Design: Light, warm, based on Otto² Advisory style
 */
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { SEOHead } from '@/components/zone3/shared/SEOHead';

const BRAND = '#2D6A4F';

const NAV_ITEMS = [
  { path: '/website/zl-wohnbau/leistungen', label: 'Leistungen' },
  { path: '/website/zl-wohnbau/portfolio', label: 'Portfolio' },
  { path: '/website/zl-wohnbau/kontakt', label: 'Kontakt' },
];

const FOOTER_NAV = [
  { path: '/website/zl-wohnbau/leistungen', label: 'Unsere Leistungen' },
  { path: '/website/zl-wohnbau/portfolio', label: 'Unser Portfolio' },
  { path: '/website/zl-wohnbau/kontakt', label: 'Kontakt aufnehmen' },
];

const FOOTER_LEGAL = [
  { path: '/website/zl-wohnbau/impressum', label: 'Impressum' },
  { path: '/website/zl-wohnbau/datenschutz', label: 'Datenschutz' },
];

export default function ZLWohnbauLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-white text-slate-800" style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif" }}>
      <SEOHead
        brand="zlwohnbau"
        page={{
          title: 'ZL Wohnbau',
          description: 'ZL Wohnbau GmbH — Wir schaffen Wohnraum für Unternehmen in Bayern. Langfristig, nachhaltig, partnerschaftlich.',
          path: location.pathname.replace('/website/zl-wohnbau', '') || '/',
        }}
      />
      <Helmet>
        <meta name="theme-color" content={BRAND} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet" />
      </Helmet>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link to="/website/zl-wohnbau" className="flex items-center gap-3">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute top-0 left-1.5 w-6 h-1.5 rounded-sm" style={{ backgroundColor: BRAND }} />
              <div className="absolute bottom-0 left-1.5 w-6 h-1.5 rounded-sm" style={{ backgroundColor: BRAND }} />
              <div className="absolute left-0 top-1.5 w-1.5 h-6 rounded-sm" style={{ backgroundColor: BRAND }} />
              <div className="absolute right-0 top-1.5 w-1.5 h-6 rounded-sm" style={{ backgroundColor: BRAND, opacity: 0.6 }} />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-slate-800">ZL <span style={{ color: BRAND }}>Wohnbau</span></span>
              <p className="text-[10px] text-slate-400 -mt-0.5">ZL Wohnbau GmbH</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-opacity-5'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
                style={location.pathname === item.path ? { color: BRAND, backgroundColor: `${BRAND}0D` } : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/website/zl-wohnbau/kontakt"
              className="hidden sm:inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: BRAND }}
            >
              Kontakt aufnehmen <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menü"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className="block rounded-md px-3 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-800"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/website/zl-wohnbau/kontakt"
              className="mt-3 flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: BRAND }}
              onClick={() => setMobileOpen(false)}
            >
              Kontakt aufnehmen <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        )}
      </header>

      <main className="pt-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-9 h-9 flex items-center justify-center">
                  <div className="absolute top-0 left-1.5 w-6 h-1.5 rounded-sm" style={{ backgroundColor: BRAND }} />
                  <div className="absolute bottom-0 left-1.5 w-6 h-1.5 rounded-sm" style={{ backgroundColor: BRAND }} />
                  <div className="absolute left-0 top-1.5 w-1.5 h-6 rounded-sm" style={{ backgroundColor: BRAND }} />
                  <div className="absolute right-0 top-1.5 w-1.5 h-6 rounded-sm" style={{ backgroundColor: BRAND, opacity: 0.5 }} />
                </div>
                <div>
                  <span className="font-bold text-lg text-slate-800">ZL Wohnbau</span>
                  <p className="text-[10px] text-slate-400">ZL Wohnbau GmbH</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 max-w-md leading-relaxed">
                Wohnraum für Mitarbeiter — langfristig, nachhaltig, partnerschaftlich.
                Wir investieren in den Ankauf und Neubau von Wohnimmobilien für Unternehmen in Bayern.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4 text-slate-700">Navigation</h4>
              <ul className="space-y-2">
                {FOOTER_NAV.map(link => (
                  <li key={link.path}>
                    <Link to={link.path} className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4 text-slate-700">Rechtliches</h4>
              <ul className="space-y-2">
                {FOOTER_LEGAL.map(link => (
                  <li key={link.path}>
                    <Link to={link.path} className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-6 text-xs text-slate-400 space-y-1">
                <p>Tel: 089 66667788</p>
                <p>info@zl-wohnbau.de</p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} ZL Wohnbau GmbH. Alle Rechte vorbehalten.
            </p>
            <p className="text-xs text-slate-300">
              Ein Unternehmen der ZL Gruppe
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
