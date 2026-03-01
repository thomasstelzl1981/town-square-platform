/**
 * SoT Layout — Premium Software Presentation Layout
 * SpaceX-inspired with orbital visuals
 */
import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { SotFooter } from '@/components/zone3/sot/SotFooter';
import { SotLoginTransition } from '@/components/zone3/sot/SotLoginTransition';
import { useSotTheme } from '@/hooks/useSotTheme';
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import { cn } from '@/lib/utils';
import { Sun, Moon, User, Menu, X, Play } from 'lucide-react';
import { WebsitePinGate } from '@/components/zone3/WebsitePinGate';
import { ArmstrongWidget } from '@/components/zone3/ArmstrongWidget';
import { useZone3Setting } from '@/hooks/useZone3Settings';
import '@/styles/zone3-theme.css';
import '@/styles/sot-premium.css';

const navItems = [
  { label: 'PLATTFORM', href: '/website/sot/plattform' },
  { label: 'LÖSUNGEN', href: '/website/sot/loesungen/mietsonderverwaltung' },
  { label: 'INTELLIGENZ', href: '/website/sot/intelligenz' },
  { label: 'MODULE', href: '/website/sot/module' },
  { label: 'PREISE', href: '/website/sot/preise' },
  { label: 'DEMO', href: '/website/sot/demo' },
];

export default function SotLayout() {
  const { themeClass, isDark, toggleTheme } = useSotTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pinVerified, setPinVerified] = useState(() => sessionStorage.getItem('sot_pin_verified') === 'true');
  const { data: pinGateValue, isLoading: pinGateLoading } = useZone3Setting('pin_gate_enabled');
  const pinGateEnabled = pinGateValue === 'true';
  // SEOHead rendered in JSX below

  if (pinGateLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="h-6 w-6 border-2 border-current border-t-transparent rounded-full animate-spin" /></div>;
  }

  const bypassPaths = ['/datenschutz', '/nutzungsbedingungen'];
  const isBypassPage = bypassPaths.some(p => location.pathname.endsWith(p));

  // PIN-gate bypass: only Datenschutz + Nutzungsbedingungen accessible without PIN
  if (pinGateEnabled && !pinVerified && !isBypassPage) {
    return <WebsitePinGate brandName="System of a Town" sessionKey="sot_pin_verified" onVerified={() => setPinVerified(true)} />;
  }

  return (
    <SotLoginTransition>
      <div className={`${themeClass} min-h-screen flex flex-col bg-background text-foreground`}>
        <SEOHead
          brand="sot"
          page={{
            title: 'Digitalisierung greifbar machen',
            description: 'Chaos beseitigen. Struktur schaffen. KI nutzen. 15+ Module für Immobilien, Finanzen, Fuhrpark, Dokumente und mehr — ohne große Investitionen.',
            path: location.pathname.replace('/website/sot', '') || '/',
          }}
          services={[
            { name: 'Digitale Mietsonderverwaltung', description: 'Professionelle Sonderverwaltung für Mietimmobilien — digital, transparent, rechtssicher.' },
            { name: 'Immobilienverwaltung', description: 'KI-gestützte Verwaltung für Miet- und Gewerbeimmobilien mit digitaler Mieterakte.' },
            { name: 'Finanzdienstleistungen', description: 'Finanzierung, Analyse und Reporting für Immobilieninvestments.' },
          ]}
        />
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Brand */}
            <Link to="/website/sot" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-primary shadow-[0_0_12px_2px_hsl(var(--primary)/0.4)]" />
              </div>
              <span className="text-base font-semibold tracking-[0.25em] uppercase hidden sm:block bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                SYSTEM OF A TOWN
              </span>
              <span className="text-base font-semibold tracking-[0.25em] uppercase sm:hidden bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                SOAT
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium tracking-wider uppercase transition-colors',
                    location.pathname === item.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <Link
                to="/portal?mode=demo"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium tracking-wider uppercase hover:bg-emerald-500 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Demo testen
              </Link>
              <Link
                to="/auth"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 text-xs font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                Login
              </Link>
              <Link
                to="/portal?mode=demo"
                className="sm:hidden p-2 rounded-lg text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                aria-label="Demo testen"
              >
                <Play className="w-4 h-4" />
              </Link>
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile Nav Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-border/30 bg-background/95 backdrop-blur-xl">
              <div className="px-4 py-3 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'block px-3 py-2 rounded-lg text-sm font-medium tracking-wider uppercase transition-colors',
                      location.pathname === item.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                {/* Mobile Demo + Login */}
                <div className="pt-3 mt-2 border-t border-border/30 space-y-2">
                  <Link
                    to="/portal?mode=demo"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium tracking-wider uppercase"
                  >
                    <Play className="w-4 h-4" />
                    Demo testen
                  </Link>
                  <Link
                    to="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/50 text-sm font-medium tracking-wider uppercase text-muted-foreground"
                  >
                    <User className="w-4 h-4" />
                    Login
                  </Link>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <Outlet />
        </main>

        {/* Footer */}
        <SotFooter />
        <ArmstrongWidget website="sot" />
      </div>
    </SotLoginTransition>
  );
}
