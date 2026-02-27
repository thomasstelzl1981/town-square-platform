/**
 * NCORE LAYOUT — Zone 3 Website Layout for Ncore Business Consulting
 * Redesign: Alternating slate-900/slate-50, Space Grotesk, glassmorphism header
 */
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Cpu, Menu, X, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { ArmstrongWidget } from '@/components/zone3/ArmstrongWidget';

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
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <html lang="de" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <meta property="og:site_name" content="Ncore Business Consulting" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="de_DE" />
        <meta name="author" content="Ncore Business Consulting" />
        <link rel="canonical" href={`https://ncore.online${location.pathname.replace('/website/ncore', '') || '/'}`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          "@id": "https://ncore.online/#organization",
          "name": "Ncore Business Consulting",
          "url": "https://ncore.online",
          "description": "Ganzheitliche Unternehmensberatung für KMU: KI-gestützte Digitalisierung, österreichische Stiftungsmodelle, Vermögensschutz und Geschäftsmodellentwicklung.",
          "slogan": "Connecting Dots. Connecting People.",
          "areaServed": [
            { "@type": "Country", "name": "Germany" },
            { "@type": "Country", "name": "Austria" },
          ],
          "knowsAbout": [
            "KMU-Digitalisierung", "Künstliche Intelligenz für Unternehmen", "Prozessautomatisierung",
            "Österreichische Privatstiftungen", "Vermögensschutz und -strukturierung", "Wegzugsbesteuerung",
            "Geschäftsmodellentwicklung", "Vertriebssysteme", "Businessplan-Erstellung", "Pitch Deck Entwicklung",
          ],
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Beratungsleistungen",
            "itemListElement": [
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Digitalisierung & KI-Beratung", "description": "Operative KI-Integration und Prozessautomatisierung für KMU." } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Stiftungen & Vermögensschutz", "description": "Österreichische Stiftungsmodelle und generationsübergreifender Vermögensschutz." } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Geschäftsmodelle & Vertrieb", "description": "Geschäftsmodellentwicklung, Businesspläne und digitalisierte Vertriebssysteme." } },
            ],
          },
          "contactPoint": { "@type": "ContactPoint", "contactType": "customer service", "email": "info@ncore.online", "availableLanguage": ["Deutsch", "Englisch"] },
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-slate-900 text-slate-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {/* Header — Glassmorphism */}
        <header
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            scrolled
              ? 'border-b border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-lg shadow-slate-950/20'
              : 'bg-transparent'
          }`}
        >
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:h-20 lg:px-8">
            <Link to="/website/ncore" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-slate-900 group-hover:bg-emerald-400 transition-colors">
                N
              </div>
              <span className="text-lg font-bold tracking-tight">
                Ncore<span className="text-emerald-400">.</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Hauptnavigation">
              {NAV_ITEMS.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    location.pathname === item.path
                      ? 'text-emerald-400 bg-emerald-500/15'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/website/ncore/kontakt"
                className="ml-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-900 transition-all hover:bg-emerald-400"
              >
                Erstgespräch <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </nav>

            <button
              className="lg:hidden rounded-lg p-2 text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileOpen && (
            <nav className="border-t border-white/10 bg-slate-900/95 backdrop-blur-xl px-4 py-6 lg:hidden" aria-label="Mobile Navigation">
              <div className="space-y-1">
                {NAV_ITEMS.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block rounded-lg px-4 py-3 text-sm font-medium ${
                      location.pathname === item.path ? 'text-emerald-400 bg-emerald-500/15' : 'text-slate-300'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <Link to="/website/ncore/kontakt" className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-900">
                  Erstgespräch vereinbaren <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </nav>
          )}
        </header>

        <main className="pt-16 lg:pt-20">
          <Outlet />
        </main>

        {/* Footer — Light */}
        <footer className="border-t border-slate-200 bg-slate-50 text-slate-600" role="contentinfo">
          <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
            <div className="grid gap-8 md:grid-cols-4">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-slate-900">N</div>
                  <span className="text-lg font-bold text-slate-800">Ncore<span className="text-emerald-500">.</span></span>
                </div>
                <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                  Connecting Dots. Connecting People. — Ganzheitliche Unternehmensberatung für den Mittelstand.
                </p>
              </div>
              <div>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Leistungen</h3>
                <ul className="space-y-2">
                  <li><Link to="/website/ncore/digitalisierung" className="text-sm hover:text-emerald-600 transition-colors">Digitalisierung & KI</Link></li>
                  <li><Link to="/website/ncore/stiftungen" className="text-sm hover:text-emerald-600 transition-colors">Stiftungen & Vermögensschutz</Link></li>
                  <li><Link to="/website/ncore/geschaeftsmodelle" className="text-sm hover:text-emerald-600 transition-colors">Geschäftsmodelle & Vertrieb</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Unternehmen</h3>
                <ul className="space-y-2">
                  <li><Link to="/website/ncore/gruender" className="text-sm hover:text-emerald-600 transition-colors">Der Gründer</Link></li>
                  <li><Link to="/website/ncore/netzwerk" className="text-sm hover:text-emerald-600 transition-colors">Netzwerk</Link></li>
                  <li><Link to="/website/ncore/kontakt" className="text-sm hover:text-emerald-600 transition-colors">Kontakt</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-xs text-slate-400">© {new Date().getFullYear()} Ncore Business Consulting. Alle Rechte vorbehalten.</p>
              <p className="text-xs text-slate-400">Made with Intelligence.</p>
            </div>
          </div>
        </footer>
      </div>

      <ArmstrongWidget website="ncore" />
    </>
  );
}
