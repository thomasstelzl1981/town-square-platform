/**
 * KaufyLayout — Phase 3 Update
 * Navigation: Immobilien | Vermieter | Verkäufer | Partner
 * Mobile: Fixierte Armstrong Input Bar am unteren Bildschirmrand
 */
import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { ArmstrongSidebar } from '@/components/zone3/kaufy';
import { KaufyInputBar } from '@/components/zone3/kaufy/KaufyInputBar';
import { useIsMobile } from '@/hooks/use-mobile';
import '@/styles/zone3-theme.css';

const navItems = [
  { href: '/kaufy', label: 'Immobilien' },
  { href: '/kaufy/vermieter', label: 'Vermieter' },
  { href: '/kaufy/verkaeufer', label: 'Verkäufer' },
  { href: '/kaufy/vertrieb', label: 'Partner' },
];

export default function KaufyLayout() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="theme-kaufy zone3-page">
      {/* Header — 64px height */}
      <header 
        className="sticky top-0 z-50 border-b backdrop-blur-sm" 
        style={{ 
          borderColor: 'hsl(var(--z3-border))', 
          backgroundColor: 'hsl(var(--z3-background) / 0.95)' 
        }}
      >
        <div className="zone3-container">
          <nav className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/kaufy" className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--z3-foreground))' }}>
              KAUFY
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="text-sm font-medium transition-colors hover:opacity-70"
                  style={{
                    color: location.pathname.startsWith(item.href)
                      ? 'hsl(var(--z3-foreground))'
                      : 'hsl(var(--z3-muted-foreground))'
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Auth buttons */}
            <div className="flex items-center gap-3">
              <Link
                to="/auth?mode=login"
                className="hidden sm:inline-flex zone3-btn-secondary text-sm"
              >
                Anmelden
              </Link>
              <Link
                to="/auth?mode=register&source=kaufy"
                className="zone3-btn-primary text-sm"
              >
                Registrieren
              </Link>
              
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted/50"
                aria-label="Menü"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </nav>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div 
            className="lg:hidden border-t py-4"
            style={{ 
              borderColor: 'hsl(var(--z3-border))',
              backgroundColor: 'hsl(var(--z3-background))'
            }}
          >
            <div className="zone3-container flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: location.pathname.startsWith(item.href)
                      ? 'hsl(var(--z3-muted))'
                      : 'transparent',
                    color: location.pathname.startsWith(item.href)
                      ? 'hsl(var(--z3-foreground))'
                      : 'hsl(var(--z3-muted-foreground))'
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content - adjust for sidebar on desktop, bottom bar on mobile */}
      <main className={`lg:mr-[320px] ${isMobile ? 'pb-16' : ''}`}>
        <Outlet />
      </main>

      {/* Footer - adjust for sidebar on desktop */}
      <footer className={`border-t py-12 lg:mr-[320px] ${isMobile ? 'pb-20' : ''}`} style={{ borderColor: 'hsl(var(--z3-border))', backgroundColor: 'hsl(var(--z3-card))' }}>
        <div className="zone3-container">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand */}
            <div>
              <h3 className="text-lg font-bold mb-4">KAUFY</h3>
              <p className="zone3-text-small">
                Finden Sie Ihre Rendite-Immobilie.
              </p>
            </div>

            {/* Plattform */}
            <div>
              <h4 className="font-semibold mb-4">Plattform</h4>
              <ul className="space-y-2 zone3-text-small">
                <li><Link to="/kaufy" className="hover:underline">Immobilien</Link></li>
                <li><Link to="/kaufy/module" className="hover:underline">Funktionen</Link></li>
                <li><Link to="/kaufy/faq" className="hover:underline">FAQ</Link></li>
              </ul>
            </div>

            {/* Für wen */}
            <div>
              <h4 className="font-semibold mb-4">Für wen</h4>
              <ul className="space-y-2 zone3-text-small">
                <li><Link to="/kaufy/vermieter" className="hover:underline">Vermieter</Link></li>
                <li><Link to="/kaufy/verkaeufer" className="hover:underline">Verkäufer</Link></li>
                <li><Link to="/kaufy/vertrieb" className="hover:underline">Partner</Link></li>
              </ul>
            </div>

            {/* Unternehmen */}
            <div>
              <h4 className="font-semibold mb-4">Unternehmen</h4>
              <ul className="space-y-2 zone3-text-small">
                <li><Link to="/kaufy/ueber-uns" className="hover:underline">Über uns</Link></li>
                <li><a href="mailto:kontakt@kaufy.app" className="hover:underline">Kontakt</a></li>
              </ul>
            </div>

            {/* Rechtliches */}
            <div>
              <h4 className="font-semibold mb-4">Rechtliches</h4>
              <ul className="space-y-2 zone3-text-small">
                <li><Link to="/kaufy/impressum" className="hover:underline">Impressum</Link></li>
                <li><Link to="/kaufy/datenschutz" className="hover:underline">Datenschutz</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t text-center zone3-text-small" style={{ borderColor: 'hsl(var(--z3-border))' }}>
            © 2026 KAUFY. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>

      {/* Armstrong AI Sidebar (Desktop: always visible, Mobile: Sheet) */}
      <ArmstrongSidebar 
        isOpen={chatOpen}
        onToggle={() => setChatOpen(!chatOpen)}
      />

      {/* Mobile: Fixed Input Bar at Bottom */}
      {isMobile && (
        <KaufyInputBar onOpen={() => setChatOpen(true)} />
      )}
    </div>
  );
}
