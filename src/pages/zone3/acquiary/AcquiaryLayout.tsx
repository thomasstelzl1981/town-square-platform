/**
 * AcquiaryLayout — Zone 3 Public Website
 * Investment-House aesthetic: Houlihan Lokey, Lazard, FINVIA
 */
import * as React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight, Shield, Sparkles, Lock } from 'lucide-react';
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import { WebsitePinGate } from '@/components/zone3/WebsitePinGate';
import { useZone3Setting } from '@/hooks/useZone3Settings';
import { ArmstrongWidget } from '@/components/zone3/ArmstrongWidget';
import '@/styles/acquiary-premium.css';

const navItems = [
  { label: 'Methodik', href: '/website/acquiary/methodik' },
  { label: 'Netzwerk', href: '/website/acquiary/netzwerk' },
  { label: 'Karriere', href: '/website/acquiary/karriere' },
];

export default function AcquiaryLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [pinVerified, setPinVerified] = React.useState(() => sessionStorage.getItem('acquiary_pin_verified') === 'true');
  const { data: pinGateValue, isLoading: pinGateLoading } = useZone3Setting('pin_gate_enabled');
  const pinGateEnabled = pinGateValue === 'true';

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // SEOHead rendered in JSX below

  if (pinGateLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="h-6 w-6 border-2 border-current border-t-transparent rounded-full animate-spin" /></div>;
  }

  const legalPaths = ['/impressum', '/datenschutz'];
  const isLegalPage = legalPaths.some(p => location.pathname.endsWith(p));

  if (pinGateEnabled && !pinVerified && !isLegalPage) {
    return <WebsitePinGate brandName="Acquiary" sessionKey="acquiary_pin_verified" onVerified={() => setPinVerified(true)} />;
  }

  return (
    <div className="acquiary-page">
      <SEOHead
        brand="acquiary"
        page={{
          title: 'Digitale Akquise für Immobilieninvestments',
          description: 'Diskrete, KI-gestützte Akquise-Plattform für institutionelle Immobilienankäufe. Methodik, Netzwerk und Deal-Sourcing auf höchstem Niveau.',
          path: location.pathname.replace('/website/acquiary', '') || '/',
        }}
        services={[{
          name: 'Digitale Immobilien-Akquise',
          description: 'KI-gestütztes Deal-Sourcing und Bewertung für institutionelle Immobilienankäufe.',
        }]}
      />
      {/* Header */}
      <header className={`aq-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="aq-header-content">
          <Link to="/website/acquiary" className="aq-logo">
            <div className="aq-logo-mark">A</div>
            ACQUIARY
          </Link>

          {/* Desktop Nav */}
          <nav className="aq-nav hidden md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`aq-nav-link ${location.pathname === item.href ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/website/acquiary/objekt">
              <button className="aq-btn aq-btn-primary">
                Objekt anbieten
                <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
          </div>

          {/* Mobile */}
          <button
            className="md:hidden p-2 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t" style={{ borderColor: 'hsl(220 15% 90%)' }}>
            <nav className="max-w-[1280px] mx-auto px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-[0.9375rem] transition-colors ${
                    location.pathname === item.href
                      ? 'text-[hsl(207,90%,54%)]'
                      : 'text-[hsl(220,10%,42%)] hover:text-[hsl(220,25%,12%)]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 px-4">
                <Link to="/website/acquiary/objekt" onClick={() => setMobileMenuOpen(false)}>
                  <button className="aq-btn aq-btn-primary w-full">
                    Objekt anbieten
                  </button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="aq-footer">
        <div className="aq-footer-grid">
          <div className="aq-footer-brand">
            <Link to="/website/acquiary" className="aq-logo" style={{ color: 'hsl(220 20% 92%)' }}>
              <div className="aq-logo-mark">A</div>
              ACQUIARY
            </Link>
            <p>
              Digitale Akquise-Plattform für institutionelle Immobilienankäufe.
              Diskret, präzise, technologiegestützt.
            </p>
          </div>
          <div>
            <h4 className="aq-footer-title">Plattform</h4>
            <ul className="aq-footer-links">
              <li><Link to="/website/acquiary/methodik">Methodik</Link></li>
              <li><Link to="/website/acquiary/netzwerk">Netzwerk</Link></li>
              <li><Link to="/website/acquiary/karriere">Karriere</Link></li>
              <li><Link to="/website/acquiary/objekt">Objekt anbieten</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="aq-footer-title">Rechtliches</h4>
            <ul className="aq-footer-links">
              <li><Link to="/website/acquiary/impressum">Impressum</Link></li>
              <li><Link to="/website/acquiary/datenschutz">Datenschutz</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="aq-footer-title">Kontakt</h4>
            <ul className="aq-footer-links">
              <li>info@acquiary.com</li>
              <li><a href="tel:+498941432188">+49 89 4143 2188</a></li>
              <li className="text-xs opacity-70">Armstrong KI-Assistent erreichbar</li>
            </ul>
          </div>
        </div>
        <div className="aq-footer-bottom">
          <span>© {new Date().getFullYear()} ACQUIARY — Ein Service der <a href="https://futureroom.online" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">FutureRoom GmbH</a> · Plattform: <a href="https://systemofatown.com" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">System of a Town</a></span>
          <div className="aq-footer-badges">
            <span className="aq-footer-badge"><Shield className="h-3.5 w-3.5" /> DSGVO</span>
            <span className="aq-footer-badge"><Sparkles className="h-3.5 w-3.5" /> KI-gestützt</span>
            <span className="aq-footer-badge"><Lock className="h-3.5 w-3.5" /> NDA-geschützt</span>
          </div>
        </div>
      </footer>
      <ArmstrongWidget website="acquiary" />
    </div>
  );
}
