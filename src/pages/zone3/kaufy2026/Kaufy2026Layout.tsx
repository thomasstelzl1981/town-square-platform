/**
 * Kaufy2026Layout — Zone 3 Website Layout
 * 
 * Design: 1400px centered container with rounded corners
 * Header: Logo + Nav + Armstrong Toggle + Auth buttons
 * Footer: 5-column grid
 * Armstrong: Floating AI chat widget with header toggle
 */
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { KaufyArmstrongWidget } from '@/components/zone3/kaufy2026/KaufyArmstrongWidget';
import { WebsitePinGate } from '@/components/zone3/WebsitePinGate';
import { useZone3Setting } from '@/hooks/useZone3Settings';
import { SEOHead } from '@/components/zone3/shared/SEOHead';

const ARMSTRONG_STORAGE_KEY = 'kaufy_armstrong_enabled';

export default function Kaufy2026Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pinVerified, setPinVerified] = useState(() => sessionStorage.getItem('kaufy_pin_verified') === 'true');
  const { data: pinGateValue, isLoading: pinGateLoading } = useZone3Setting('pin_gate_enabled');
  const pinGateEnabled = pinGateValue === 'true';
  
  // Armstrong toggle — default ON, persisted in localStorage
  const [armstrongEnabled, setArmstrongEnabled] = useState(() => {
    const saved = localStorage.getItem(ARMSTRONG_STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem(ARMSTRONG_STORAGE_KEY, String(armstrongEnabled));
  }, [armstrongEnabled]);

  // SEOHead rendered in JSX below

  if (pinGateLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="h-6 w-6 border-2 border-current border-t-transparent rounded-full animate-spin" /></div>;
  }

  const legalPaths = ['/impressum', '/datenschutz'];
  const isLegalPage = legalPaths.some(p => location.pathname.endsWith(p));

  if (pinGateEnabled && !pinVerified && !isLegalPage) {
    return <WebsitePinGate brandName="KAUFY" sessionKey="kaufy_pin_verified" onVerified={() => setPinVerified(true)} />;
  }

  const navLinks = [
    { path: '/website/kaufy', label: 'Suchen', exact: true },
    { path: '/website/kaufy/vermieter', label: 'Vermieter' },
    { path: '/website/kaufy/verkaeufer', label: 'Verkäufer' },
    { path: '/website/kaufy/vertrieb', label: 'Partner' },
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  // Force light mode CSS variables for all shadcn/ui components
  const lightModeVars: React.CSSProperties = {
    '--background': '0 0% 100%',
    '--foreground': '222.2 84% 4.9%',
    '--card': '0 0% 100%',
    '--card-foreground': '222.2 84% 4.9%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '222.2 84% 4.9%',
    '--primary': '222.2 47.4% 11.2%',
    '--primary-foreground': '210 40% 98%',
    '--secondary': '210 40% 96.1%',
    '--secondary-foreground': '222.2 47.4% 11.2%',
    '--muted': '210 40% 96.1%',
    '--muted-foreground': '215.4 16.3% 46.9%',
    '--accent': '210 40% 96.1%',
    '--accent-foreground': '222.2 47.4% 11.2%',
    '--destructive': '0 84.2% 60.2%',
    '--destructive-foreground': '210 40% 98%',
    '--border': '214.3 31.8% 91.4%',
    '--input': '214.3 31.8% 91.4%',
    '--ring': '222.2 84% 4.9%',
    colorScheme: 'light',
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-[hsl(210,40%,97%)] light" data-theme="light" style={lightModeVars}>
      <SEOHead
        brand="kaufy"
        page={{
          title: 'KI-Plattform für Kapitalanlageimmobilien',
          description: 'Finden, finanzieren und verwalten Sie Kapitalanlageimmobilien mit KI-gestützter Analyse. Investment-Rechner, Marktdaten und persönliche Beratung.',
          path: location.pathname.replace('/website/kaufy', '') || '/',
        }}
        services={[{
          name: 'KI-gestützte Immobiliensuche',
          description: 'Kapitalanlageimmobilien finden, bewerten und finanzieren – auf einer Plattform.',
        }]}
      />
      {/* Main Container */}
      <div className="kaufy2026-container">
        {/* Header */}
        <header className="kaufy2026-header">
          <div className="flex items-center justify-between h-16 px-6 lg:px-10">
            {/* Logo */}
            <Link to="/website/kaufy" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[hsl(220,20%,10%)]">KAUFY</span>
              <span className="text-xs font-medium text-[hsl(210,80%,55%)] bg-[hsl(210,80%,55%,0.1)] px-2 py-0.5 rounded-full">
                beta
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-full transition-colors",
                    isActive(link.path, link.exact)
                      ? "bg-[hsl(220,20%,10%)] text-white"
                      : "text-[hsl(220,20%,10%)] hover:bg-[hsl(210,30%,95%)]"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side: Armstrong Toggle + Auth */}
            <div className="hidden md:flex items-center gap-3">
              {/* Armstrong Toggle */}
              <button
                onClick={() => setArmstrongEnabled(!armstrongEnabled)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  armstrongEnabled
                    ? 'bg-[hsl(210,80%,55%,0.12)] text-[hsl(210,80%,40%)]'
                    : 'bg-[hsl(210,20%,92%)] text-[hsl(215,16%,55%)]'
                )}
                aria-label={armstrongEnabled ? 'Armstrong deaktivieren' : 'Armstrong aktivieren'}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Armstrong</span>
                <div className={cn(
                  'relative h-4 w-7 rounded-full transition-colors',
                  armstrongEnabled ? 'bg-[hsl(210,80%,55%)]' : 'bg-[hsl(210,20%,82%)]'
                )}>
                  <div className={cn(
                    'absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform shadow-sm',
                    armstrongEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
                  )} />
                </div>
              </button>

              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-[hsl(220,20%,10%)]">
                  Anmelden
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="rounded-full bg-[hsl(220,20%,10%)] hover:bg-[hsl(220,20%,20%)]">
                  Registrieren
                </Button>
              </Link>
            </div>

            {/* Mobile: Armstrong Toggle + Menu */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setArmstrongEnabled(!armstrongEnabled)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all',
                  armstrongEnabled
                    ? 'bg-[hsl(210,80%,55%,0.12)] text-[hsl(210,80%,40%)]'
                    : 'bg-[hsl(210,20%,92%)] text-[hsl(215,16%,55%)]'
                )}
              >
                <Sparkles className="h-3 w-3" />
                <div className={cn(
                  'relative h-3.5 w-6 rounded-full transition-colors',
                  armstrongEnabled ? 'bg-[hsl(210,80%,55%)]' : 'bg-[hsl(210,20%,82%)]'
                )}>
                  <div className={cn(
                    'absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-transform shadow-sm',
                    armstrongEnabled ? 'translate-x-3' : 'translate-x-0.5'
                  )} />
                </div>
              </button>
              <button
                className="p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav className="md:hidden border-t px-6 py-4 space-y-2 bg-white">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    isActive(link.path, link.exact)
                      ? "bg-[hsl(220,20%,10%)] text-white"
                      : "text-[hsl(220,20%,10%)] hover:bg-[hsl(210,30%,95%)]"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t flex gap-2">
                <Link to="/auth" className="flex-1">
                  <Button variant="outline" className="w-full">Anmelden</Button>
                </Link>
                <Link to="/auth" className="flex-1">
                  <Button className="w-full">Registrieren</Button>
                </Link>
              </div>
            </nav>
          )}
        </header>

        {/* Main Content */}
        <main className="kaufy2026-main">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="kaufy2026-footer">
          <div className="px-6 lg:px-10 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Logo + Claim */}
              <div className="md:col-span-1">
                <span className="text-2xl font-bold text-[hsl(220,20%,10%)]">KAUFY</span>
                <p className="mt-3 text-sm text-[hsl(215,16%,47%)] leading-relaxed">
                  Die KI-Plattform für Kapitalanlage.
                </p>
                <p className="mt-2 text-sm text-[hsl(215,16%,47%)] leading-relaxed">
                  Vermarktung, Beratung und Verwaltung – auf einer Plattform.
                </p>
              </div>

              {/* Plattform */}
              <div>
                <h4 className="font-semibold text-[hsl(220,20%,10%)] mb-4 text-sm uppercase tracking-wide">Plattform</h4>
                <ul className="space-y-2 text-sm text-[hsl(215,16%,47%)]">
                  <li><Link to="/website/kaufy" className="hover:text-[hsl(220,20%,10%)] transition-colors">Investment-Suche</Link></li>
                  <li><Link to="/website/kaufy/vermieter" className="hover:text-[hsl(220,20%,10%)] transition-colors">Für Vermieter</Link></li>
                  <li><Link to="/website/kaufy/verkaeufer" className="hover:text-[hsl(220,20%,10%)] transition-colors">Für Anbieter</Link></li>
                  <li><Link to="/website/kaufy/vertrieb" className="hover:text-[hsl(220,20%,10%)] transition-colors">Für Partner</Link></li>
                </ul>
              </div>

              {/* Rechtliches */}
              <div>
                <h4 className="font-semibold text-[hsl(220,20%,10%)] mb-4 text-sm uppercase tracking-wide">Rechtliches</h4>
                <ul className="space-y-2 text-sm text-[hsl(215,16%,47%)]">
                  <li><Link to="/website/kaufy/faq" className="hover:text-[hsl(220,20%,10%)] transition-colors">FAQ</Link></li>
                  <li><Link to="/website/kaufy/impressum" className="hover:text-[hsl(220,20%,10%)] transition-colors">Impressum</Link></li>
                  <li><Link to="/website/kaufy/datenschutz" className="hover:text-[hsl(220,20%,10%)] transition-colors">Datenschutz</Link></li>
                </ul>
              </div>

              {/* Kontakt */}
              <div>
                <h4 className="font-semibold text-[hsl(220,20%,10%)] mb-4 text-sm uppercase tracking-wide">Kontakt</h4>
                <ul className="space-y-2 text-sm text-[hsl(215,16%,47%)]">
                  <li><a href="mailto:info@kaufy.immo" className="hover:text-[hsl(220,20%,10%)] transition-colors">info@kaufy.immo</a></li>
                  <li><Link to="/website/kaufy/kontakt" className="hover:text-[hsl(220,20%,10%)] transition-colors">Kontaktformular</Link></li>
                  <li><Link to="/auth" className="hover:text-[hsl(220,20%,10%)] transition-colors">Registrieren</Link></li>
                </ul>
              </div>
            </div>

            {/* Footer Bottom Bar */}
            <div className="mt-12 pt-6 border-t border-[hsl(210,20%,90%)] flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-[hsl(215,16%,47%)]">
                © {new Date().getFullYear()} KAUFY — Ein Produkt der{' '}
                <a href="https://systemofatown.com" target="_blank" rel="noopener noreferrer" className="hover:text-[hsl(220,20%,10%)] underline transition-colors">System of a Town GmbH</a>
              </p>
              <div className="flex items-center gap-4 text-xs text-[hsl(215,16%,47%)]">
                <Link to="/website/kaufy/impressum" className="hover:text-[hsl(220,20%,10%)] transition-colors">Impressum</Link>
                <span className="text-[hsl(210,20%,85%)]">·</span>
                <Link to="/website/kaufy/datenschutz" className="hover:text-[hsl(220,20%,10%)] transition-colors">Datenschutz</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Armstrong Chat Widget */}
      <KaufyArmstrongWidget enabled={armstrongEnabled} />
    </div>
  );
}
