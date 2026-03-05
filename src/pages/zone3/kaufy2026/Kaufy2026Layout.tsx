/**
 * Kaufy2026Layout — Zone 3 Website Layout
 * 
 * Design: 1400px centered container with rounded corners
 * Header: Logo + Nav + KI-Assistent Toggle + Auth buttons
 * Footer: 4-column grid
 * Armstrong: Floating AI chat widget (always on, no visible toggle in header)
 */
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { KaufyArmstrongWidget } from '@/components/zone3/kaufy2026/KaufyArmstrongWidget';
import { WebsitePinGate } from '@/components/zone3/WebsitePinGate';
import { useZone3Setting } from '@/hooks/useZone3Settings';
import { SEOHead } from '@/components/zone3/shared/SEOHead';

export default function Kaufy2026Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pinVerified, setPinVerified] = useState(() => sessionStorage.getItem('kaufy_pin_verified') === 'true');
  const { data: pinGateValue, isLoading: pinGateLoading } = useZone3Setting('pin_gate_enabled');
  const pinGateEnabled = pinGateValue === 'true';

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
            {/* Logo — clean, no beta badge */}
            <Link to="/website/kaufy" className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-[hsl(220,20%,10%)]">KAUFY</span>
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

            {/* Right side: Auth buttons only (Armstrong toggle removed from header) */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/auth">
                <Button size="sm" className="rounded-full bg-[hsl(220,20%,10%)] hover:bg-[hsl(220,20%,20%)]">
                  Anmelden
                </Button>
              </Link>
            </div>

            {/* Mobile: Menu only */}
            <div className="flex md:hidden items-center gap-2">
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
              <div className="pt-4 border-t">
                <Link to="/auth">
                  <Button className="w-full">Anmelden</Button>
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
                <span className="text-2xl font-bold tracking-tight text-[hsl(220,20%,10%)]">KAUFY</span>
                <p className="mt-3 text-sm text-[hsl(215,16%,47%)] leading-relaxed">
                  Die KI-Plattform für Kapitalanlageimmobilien.
                </p>
                <p className="mt-2 text-sm text-[hsl(215,16%,47%)] leading-relaxed">
                  Marktplatz, Beratung und Verwaltung — auf einer Plattform.
                </p>
              </div>

              {/* Plattform */}
              <div>
                <h4 className="font-semibold text-[hsl(220,20%,10%)] mb-4 text-sm uppercase tracking-wide">Plattform</h4>
                <ul className="space-y-2.5 text-sm text-[hsl(215,16%,47%)]">
                  <li><Link to="/website/kaufy" className="hover:text-[hsl(220,20%,10%)] transition-colors">Investment-Suche</Link></li>
                  <li><Link to="/website/kaufy/vermieter" className="hover:text-[hsl(220,20%,10%)] transition-colors">Für Vermieter</Link></li>
                  <li><Link to="/website/kaufy/verkaeufer" className="hover:text-[hsl(220,20%,10%)] transition-colors">Für Anbieter</Link></li>
                  <li><Link to="/website/kaufy/vertrieb" className="hover:text-[hsl(220,20%,10%)] transition-colors">Für Partner</Link></li>
                </ul>
              </div>

              {/* Rechtliches */}
              <div>
                <h4 className="font-semibold text-[hsl(220,20%,10%)] mb-4 text-sm uppercase tracking-wide">Rechtliches</h4>
                <ul className="space-y-2.5 text-sm text-[hsl(215,16%,47%)]">
                  <li><Link to="/website/kaufy/faq" className="hover:text-[hsl(220,20%,10%)] transition-colors">FAQ</Link></li>
                  <li><Link to="/website/kaufy/impressum" className="hover:text-[hsl(220,20%,10%)] transition-colors">Impressum</Link></li>
                  <li><Link to="/website/kaufy/datenschutz" className="hover:text-[hsl(220,20%,10%)] transition-colors">Datenschutz</Link></li>
                </ul>
              </div>

              {/* Kontakt */}
              <div>
                <h4 className="font-semibold text-[hsl(220,20%,10%)] mb-4 text-sm uppercase tracking-wide">Kontakt</h4>
                <ul className="space-y-2.5 text-sm text-[hsl(215,16%,47%)]">
                  <li><a href="mailto:info@kaufy.immo" className="hover:text-[hsl(220,20%,10%)] transition-colors">info@kaufy.immo</a></li>
                  <li><a href="tel:+498941432270" className="hover:text-[hsl(220,20%,10%)] transition-colors">+49 89 4143 2270</a></li>
                  <li><Link to="/website/kaufy/kontakt" className="hover:text-[hsl(220,20%,10%)] transition-colors">Kontaktformular</Link></li>
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

      {/* Armstrong Chat Widget — always active, no header toggle */}
      <KaufyArmstrongWidget enabled={true} />
    </div>
  );
}
