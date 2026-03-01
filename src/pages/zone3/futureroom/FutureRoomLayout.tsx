/**
 * FutureRoomLayout — Zone 3 Public Website for Financing Platform
 * 
 * Banking-inspired design with Teal/Mint color scheme
 * Dynamic nav based on auth state
 */
import * as React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Landmark, Home, FileText, Users, HelpCircle, 
  Menu, X, ChevronRight, Shield, Sparkles, LogIn, LogOut, FolderOpen
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import { WebsitePinGate } from '@/components/zone3/WebsitePinGate';
import { ArmstrongWidget } from '@/components/zone3/ArmstrongWidget';
import { useZone3Setting } from '@/hooks/useZone3Settings';
import '@/styles/futureroom-premium.css';

export default function FutureRoomLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [pinVerified, setPinVerified] = React.useState(() => sessionStorage.getItem('futureroom_pin_verified') === 'true');
  const { data: pinGateValue, isLoading: pinGateLoading } = useZone3Setting('pin_gate_enabled');
  const pinGateEnabled = pinGateValue === 'true';

  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/website/futureroom');
  };

  // SEOHead rendered in JSX below

  if (pinGateLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="h-6 w-6 border-2 border-current border-t-transparent rounded-full animate-spin" /></div>;
  }

  const legalPaths = ['/impressum', '/datenschutz'];
  const isLegalPage = legalPaths.some(p => location.pathname.endsWith(p));

  if (pinGateEnabled && !pinVerified && !isLegalPage) {
    return <WebsitePinGate brandName="FutureRoom" sessionKey="futureroom_pin_verified" onVerified={() => setPinVerified(true)} />;
  }

  const navItems = [
    { label: 'Start', href: '/website/futureroom', icon: Home, show: true },
    { label: 'Finanzierung starten', href: '/website/futureroom/bonitat', icon: FileText, show: true },
    { label: 'Meine Akte', href: '/website/futureroom/akte', icon: FolderOpen, show: !!user },
    { label: 'FM werden', href: '/website/futureroom/karriere', icon: Users, show: true },
    { label: 'FAQ', href: '/website/futureroom/faq', icon: HelpCircle, show: true },
  ].filter(i => i.show);

  return (
    <div className="futureroom-page">
      <SEOHead
        brand="futureroom"
        page={{
          title: 'Digitale Immobilienfinanzierung',
          description: 'KI-gestützte Finanzierungsorchestrierung: Vom Bonitätscheck bis zur Auszahlung. Über 400 Bankpartner, digitaler Datenraum und persönliche Betreuung.',
          path: location.pathname.replace('/website/futureroom', '') || '/',
        }}
        services={[{
          name: 'Digitale Immobilienfinanzierung',
          description: 'Finanzierungsorchestrierung mit über 400 Bankpartnern — vom Bonitätscheck bis zur Auszahlung.',
        }]}
      />
      {/* Header */}
      <header className={`fr-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="fr-header-content">
          <Link to="/website/futureroom" className="fr-logo">
            <div className="fr-logo-icon"><Landmark className="h-5 w-5" /></div>
            <div className="fr-logo-text">Future<span>Room</span></div>
          </Link>

          <nav className="fr-nav hidden md:flex">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link key={item.href} to={item.href} className={`fr-nav-link ${isActive ? 'active' : ''}`}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to="/website/futureroom/akte">
                  <button className="fr-btn fr-btn-primary">
                    Meine Akte
                    <FolderOpen className="h-4 w-4" />
                  </button>
                </Link>
                <button onClick={handleLogout} className="fr-btn" style={{ background: 'transparent', border: '1px solid hsl(210 20% 88%)', color: 'hsl(210 30% 40%)' }}>
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/website/futureroom/login">
                  <button className="fr-btn" style={{ background: 'transparent', border: '1px solid hsl(210 20% 88%)', color: 'hsl(210 30% 40%)' }}>
                    <LogIn className="h-4 w-4" />
                    Anmelden
                  </button>
                </Link>
                <Link to="/website/futureroom/bonitat">
                  <button className="fr-btn fr-btn-primary">
                    Jetzt starten
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <nav className="container mx-auto px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link key={item.href} to={item.href} onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Icon className="h-5 w-5" />{item.label}
                  </Link>
                );
              })}
              <div className="pt-4 px-4 space-y-2">
                {user ? (
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="fr-btn w-full" style={{ background: 'transparent', border: '1px solid hsl(210 20% 88%)', color: 'hsl(210 30% 40%)' }}>
                    <LogOut className="h-4 w-4" /> Abmelden
                  </button>
                ) : (
                  <>
                    <Link to="/website/futureroom/login" onClick={() => setMobileMenuOpen(false)}>
                      <button className="fr-btn w-full" style={{ background: 'transparent', border: '1px solid hsl(210 20% 88%)', color: 'hsl(210 30% 40%)' }}>
                        <LogIn className="h-4 w-4" /> Anmelden
                      </button>
                    </Link>
                    <Link to="/website/futureroom/bonitat" onClick={() => setMobileMenuOpen(false)}>
                      <button className="fr-btn fr-btn-primary w-full">Finanzierung starten</button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main><Outlet /></main>

      {/* Trust Badges */}
      <div className="fr-trust-badges">
        <div className="fr-trust-badge"><Shield className="h-5 w-5" />DSGVO-konform</div>
        <div className="fr-trust-badge"><Sparkles className="h-5 w-5" />KI-gestützte Aufbereitung</div>
        <div className="fr-trust-badge"><Landmark className="h-5 w-5" />Über 400 Bankpartner</div>
      </div>

      {/* Footer */}
      <footer className="fr-footer">
        <div className="fr-footer-grid">
          <div className="fr-footer-brand">
            <Link to="/website/futureroom" className="fr-logo" style={{ color: 'white' }}>
              <div className="fr-logo-icon"><Landmark className="h-5 w-5" /></div>
              <div className="fr-logo-text">Future<span style={{ color: 'hsl(158 64% 52%)' }}>Room</span></div>
            </Link>
            <p>Digitale Finanzierungsorchestrierung — Wir begleiten Sie vom ersten Schritt bis zur erfolgreichen Auszahlung.</p>
          </div>
          <div>
            <h4 className="fr-footer-title">Produkt</h4>
            <ul className="fr-footer-links">
              <li><Link to="/website/futureroom/bonitat">Finanzierung starten</Link></li>
              <li><Link to="/website/futureroom/karriere">Für Finanzierungsmanager</Link></li>
              <li><Link to="/website/futureroom/faq">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="fr-footer-title">Rechtliches</h4>
            <ul className="fr-footer-links">
              <li><Link to="/website/futureroom/impressum">Impressum</Link></li>
              <li><Link to="/website/futureroom/datenschutz">Datenschutz</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="fr-footer-title">Kontakt</h4>
            <ul className="fr-footer-links">
              <li>info@futureroom.online</li>
              <li>089 66667788</li>
            </ul>
          </div>
        </div>
      <div className="fr-footer-bottom">© {new Date().getFullYear()} FutureRoom — Plattform: <a href="https://systemofatown.com" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">System of a Town</a></div>
      </footer>
      <ArmstrongWidget website="futureroom" />
    </div>
  );
}
