/**
 * NCORE LAYOUT — Zone 3 Website Layout for Ncore Business Consulting
 * Brand: Emerald/Teal — "Connecting Dots. Connecting People."
 * SEO: Structured data, semantic HTML, Open Graph
 */
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Cpu, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Helmet } from 'react-helmet';

const NAV_ITEMS = [
  { path: '/website/ncore/digitalisierung', label: 'Digitalisierung & KI' },
  { path: '/website/ncore/stiftungen', label: 'Stiftungen' },
  { path: '/website/ncore/geschaeftsmodelle', label: 'Geschäftsmodelle' },
  { path: '/website/ncore/netzwerk', label: 'Netzwerk' },
  { path: '/website/ncore/gruender', label: 'Gründer' },
  { path: '/website/ncore/kontakt', label: 'Kontakt' },
];

export default function NcoreLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <Helmet>
        <meta name="robots" content="index, follow" />
        <meta property="og:site_name" content="Ncore Business Consulting" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://ncore.online${location.pathname.replace('/website/ncore', '') || '/'}`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ConsultingBusiness",
          "name": "Ncore Business Consulting",
          "url": "https://ncore.online",
          "description": "Unternehmensberatung für Digitalisierung, KI-Integration und Vermögensstrukturierung. Connecting Dots. Connecting People.",
          "areaServed": { "@type": "Country", "name": "Germany" },
          "knowsAbout": ["Digitalisierung", "Künstliche Intelligenz", "Stiftungen", "Vermögensschutz", "Geschäftsmodelle", "KMU-Beratung"],
        })}</script>
      </Helmet>
      
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-emerald-900/30 bg-black/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
            <Link to="/website/ncore" className="flex items-center gap-2">
              <Cpu className="h-6 w-6 text-emerald-400" />
              <span className="text-lg font-bold tracking-tight">
                Ncore<span className="text-emerald-400">.</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-6 lg:flex">
              {NAV_ITEMS.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm transition-colors hover:text-emerald-400 ${
                    location.pathname === item.path ? 'text-emerald-400' : 'text-white/70'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Toggle */}
            <button
              className="lg:hidden text-white/70 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Nav */}
          {mobileOpen && (
            <nav className="border-t border-emerald-900/30 bg-black/95 px-4 py-4 lg:hidden">
              {NAV_ITEMS.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="block py-2 text-sm text-white/70 hover:text-emerald-400"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </header>

        {/* Main Content */}
        <main className="pt-16">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-emerald-900/20 bg-black py-12">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-semibold">Ncore Business Consulting</span>
              </div>
              <div className="flex gap-6 text-xs text-white/40">
                <Link to="/website/ncore/impressum" className="hover:text-white/70">Impressum</Link>
                <Link to="/website/ncore/datenschutz" className="hover:text-white/70">Datenschutz</Link>
              </div>
              <p className="text-xs text-white/30">© {new Date().getFullYear()} Ncore Business Consulting</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
