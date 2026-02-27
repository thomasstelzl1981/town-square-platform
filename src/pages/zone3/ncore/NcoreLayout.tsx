/**
 * NCORE LAYOUT — Zone 3 Website Layout for Ncore Business Consulting
 * Brand: Emerald/Teal — "Connecting Dots. Connecting People."
 * SEO: Structured data, semantic HTML, Open Graph, LLM-optimized
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <html lang="de" />
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
          "description": "Ganzheitliche Unternehmensberatung für KMU: KI-gestützte Digitalisierung, österreichische Stiftungsmodelle, Vermögensschutz und Geschäftsmodellentwicklung. Wir betrachten das Unternehmen als Ganzes — nicht Teillösungen.",
          "slogan": "Connecting Dots. Connecting People.",
          "areaServed": [
            { "@type": "Country", "name": "Germany" },
            { "@type": "Country", "name": "Austria" },
          ],
          "knowsAbout": [
            "KMU-Digitalisierung",
            "Künstliche Intelligenz für Unternehmen",
            "Prozessautomatisierung",
            "Österreichische Privatstiftungen",
            "Vermögensschutz und -strukturierung",
            "Wegzugsbesteuerung",
            "Geschäftsmodellentwicklung",
            "Vertriebssysteme",
            "Businessplan-Erstellung",
            "Pitch Deck Entwicklung",
          ],
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Beratungsleistungen",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Digitalisierung & KI-Beratung",
                  "description": "Operative KI-Integration und Prozessautomatisierung für kleine und mittelständische Unternehmen zu günstigen Kosten.",
                },
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Stiftungen & Vermögensschutz",
                  "description": "Beratung zu österreichischen Stiftungsmodellen, generationsübergreifendem Vermögensschutz und Wegzugsbesteuerung mit Netzwerk aus Rechtsanwälten und Steuerberatern.",
                },
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Geschäftsmodelle & Vertrieb",
                  "description": "Entwicklung und Weiterentwicklung von Geschäftsmodellen, Businessplänen, Pitch Decks und Vertriebssystemen.",
                },
              },
            ],
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "email": "info@ncore.online",
            "availableLanguage": ["Deutsch", "Englisch"],
          },
          "sameAs": [],
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            scrolled
              ? 'border-b border-emerald-900/40 bg-black/90 backdrop-blur-xl shadow-lg shadow-emerald-900/5'
              : 'bg-transparent'
          }`}
        >
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:h-20 lg:px-8">
            <Link to="/website/ncore" className="flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                <Cpu className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Ncore<span className="text-emerald-400">.</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Hauptnavigation">
              {NAV_ITEMS.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`rounded-lg px-3 py-2 text-sm transition-all ${
                    location.pathname === item.path
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/website/ncore/kontakt"
                className="ml-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-black transition-all hover:bg-emerald-400"
              >
                Erstgespräch <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </nav>

            {/* Mobile Toggle */}
            <button
              className="lg:hidden rounded-lg p-2 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Nav */}
          {mobileOpen && (
            <nav
              className="border-t border-emerald-900/30 bg-black/98 px-4 py-6 lg:hidden animate-in slide-in-from-top-2"
              aria-label="Mobile Navigation"
            >
              <div className="space-y-1">
                {NAV_ITEMS.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block rounded-lg px-4 py-3 text-sm transition-colors ${
                      location.pathname === item.path
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-emerald-900/30">
                <Link
                  to="/website/ncore/kontakt"
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-black"
                >
                  Erstgespräch vereinbaren <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </nav>
          )}
        </header>

        {/* Main Content */}
        <main className="pt-16 lg:pt-20">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-emerald-900/20 bg-black" role="contentinfo">
          <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
            <div className="grid gap-8 md:grid-cols-4">
              {/* Brand */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Cpu className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-lg font-bold">Ncore<span className="text-emerald-400">.</span></span>
                </div>
                <p className="text-sm text-white/40 max-w-sm leading-relaxed">
                  Connecting Dots. Connecting People. — Ganzheitliche Unternehmensberatung für den
                  Mittelstand. Digitalisierung, Vermögensschutz und Geschäftsmodelle.
                </p>
              </div>

              {/* Leistungen */}
              <div>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/30">Leistungen</h3>
                <ul className="space-y-2">
                  <li><Link to="/website/ncore/digitalisierung" className="text-sm text-white/50 hover:text-emerald-400 transition-colors">Digitalisierung & KI</Link></li>
                  <li><Link to="/website/ncore/stiftungen" className="text-sm text-white/50 hover:text-emerald-400 transition-colors">Stiftungen & Vermögensschutz</Link></li>
                  <li><Link to="/website/ncore/geschaeftsmodelle" className="text-sm text-white/50 hover:text-emerald-400 transition-colors">Geschäftsmodelle & Vertrieb</Link></li>
                </ul>
              </div>

              {/* Rechtliches */}
              <div>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/30">Rechtliches</h3>
                <ul className="space-y-2">
                  <li><Link to="/website/ncore/impressum" className="text-sm text-white/50 hover:text-white/70 transition-colors">Impressum</Link></li>
                  <li><Link to="/website/ncore/datenschutz" className="text-sm text-white/50 hover:text-white/70 transition-colors">Datenschutz</Link></li>
                </ul>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-emerald-900/20 flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-xs text-white/25">© {new Date().getFullYear()} Ncore Business Consulting. Alle Rechte vorbehalten.</p>
              <p className="text-xs text-white/25">Made with Intelligence.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Armstrong LITE Chatbot */}
      <ArmstrongWidget website="ncore" />
    </>
  );
}
