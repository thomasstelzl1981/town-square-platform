/**
 * FutureRoomLayout — Zone 3 Public Website for Financing Platform
 * 
 * Banking-inspired design with Teal/Mint color scheme
 * Focus: Digital financing orchestration, not just brokerage
 */
import * as React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Landmark, Home, FileText, Users, HelpCircle, 
  Menu, X, ChevronRight, Shield, Sparkles
} from 'lucide-react';
import '@/styles/futureroom-premium.css';

const navItems = [
  { label: 'Start', href: '/futureroom', icon: Home },
  { label: 'Finanzierung starten', href: '/futureroom/bonitat', icon: FileText },
  { label: 'Finanzierungsmanager werden', href: '/futureroom/karriere', icon: Users },
  { label: 'FAQ', href: '/futureroom/faq', icon: HelpCircle },
];

export default function FutureRoomLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="futureroom-page">
      {/* Header */}
      <header className={`fr-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="fr-header-content">
          {/* Logo */}
          <Link to="/futureroom" className="fr-logo">
            <div className="fr-logo-icon">
              <Landmark className="h-5 w-5" />
            </div>
            <div className="fr-logo-text">
              Future<span>Room</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="fr-nav hidden md:flex">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`fr-nav-link ${isActive ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/futureroom/bonitat">
              <button className="fr-btn fr-btn-primary">
                Jetzt starten
                <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <nav className="container mx-auto px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-4 px-4">
                <Link to="/futureroom/bonitat" onClick={() => setMobileMenuOpen(false)}>
                  <button className="fr-btn fr-btn-primary w-full">
                    Finanzierung starten
                  </button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Trust Badges */}
      <div className="fr-trust-badges">
        <div className="fr-trust-badge">
          <Shield className="h-5 w-5" />
          DSGVO-konform
        </div>
        <div className="fr-trust-badge">
          <Sparkles className="h-5 w-5" />
          KI-gestützte Aufbereitung
        </div>
        <div className="fr-trust-badge">
          <Landmark className="h-5 w-5" />
          Über 400 Bankpartner
        </div>
      </div>

      {/* Footer */}
      <footer className="fr-footer">
        <div className="fr-footer-grid">
          <div className="fr-footer-brand">
            <Link to="/futureroom" className="fr-logo" style={{ color: 'white' }}>
              <div className="fr-logo-icon">
                <Landmark className="h-5 w-5" />
              </div>
              <div className="fr-logo-text">
                Future<span style={{ color: 'hsl(158 64% 52%)' }}>Room</span>
              </div>
            </Link>
            <p>
              Digitale Finanzierungsorchestrierung — Wir begleiten Sie vom ersten Schritt 
              bis zur erfolgreichen Auszahlung. Kein Vermittler, sondern Ihr Partner.
            </p>
          </div>
          <div>
            <h4 className="fr-footer-title">Produkt</h4>
            <ul className="fr-footer-links">
              <li><Link to="/futureroom/bonitat">Finanzierung starten</Link></li>
              <li><Link to="/futureroom/karriere">Für Finanzierungsmanager</Link></li>
              <li><Link to="/futureroom/faq">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="fr-footer-title">Rechtliches</h4>
            <ul className="fr-footer-links">
              <li><Link to="#">Impressum</Link></li>
              <li><Link to="#">Datenschutz</Link></li>
              <li><Link to="#">AGB</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="fr-footer-title">Kontakt</h4>
            <ul className="fr-footer-links">
              <li>info@futureroom.de</li>
              <li>+49 89 123456789</li>
            </ul>
          </div>
        </div>
        <div className="fr-footer-bottom">
          © {new Date().getFullYear()} FutureRoom — Ein Service von System of a Town
        </div>
      </footer>
    </div>
  );
}
