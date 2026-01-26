import { Outlet, Link, useLocation } from 'react-router-dom';
import { MessageCircle, Home } from 'lucide-react';
import '@/styles/zone3-theme.css';

const navItems = [
  { href: '/miety', label: 'Startseite' },
  { href: '/miety/leistungen', label: 'Leistungen' },
  { href: '/miety/vermieter', label: 'Für Vermieter' },
  { href: '/miety/app', label: 'Miety-App' },
  { href: '/miety/preise', label: 'Preise' },
  { href: '/miety/invite', label: 'Einladung' },
];

export default function MietyLayout() {
  const location = useLocation();

  return (
    <div className="theme-miety zone3-page">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b" style={{ borderColor: 'hsl(var(--z3-border))', backgroundColor: 'hsl(var(--z3-background))' }}>
        <div className="zone3-container">
          <nav className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/miety" className="flex items-center gap-2 text-xl font-bold" style={{ color: 'hsl(var(--z3-foreground))' }}>
              <Home className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
              Miety
            </Link>

            {/* Navigation */}
            <div className="hidden xl:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="text-sm font-medium transition-colors hover:opacity-70"
                  style={{
                    color: location.pathname === item.href
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
                className="zone3-btn-secondary text-sm"
              >
                Anmelden
              </Link>
              <Link
                to="/miety/registrieren"
                className="zone3-btn-primary text-sm"
                style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'hsl(var(--z3-accent-foreground))' }}
              >
                Bei Miety registrieren
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t py-12" style={{ borderColor: 'hsl(var(--z3-border))', backgroundColor: 'hsl(var(--z3-card))' }}>
        <div className="zone3-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 text-lg font-bold mb-4">
                <Home className="w-5 h-5" style={{ color: 'hsl(var(--z3-accent))' }} />
                Miety
              </div>
              <p className="zone3-text-small">
                Das digitale Mieterportal.
              </p>
            </div>

            {/* Produkt */}
            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 zone3-text-small">
                <li><Link to="/miety/leistungen" className="hover:underline">Leistungen</Link></li>
                <li><Link to="/miety/vermieter" className="hover:underline">Für Vermieter</Link></li>
                <li><Link to="/miety/app" className="hover:underline">Miety-App</Link></li>
                <li><Link to="/miety/preise" className="hover:underline">Preise</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 zone3-text-small">
                <li><Link to="/miety/kontakt" className="hover:underline">Kontakt</Link></li>
                <li><Link to="/miety/so-funktioniert" className="hover:underline">Hilfe</Link></li>
              </ul>
            </div>

            {/* Rechtliches */}
            <div>
              <h4 className="font-semibold mb-4">Rechtliches</h4>
              <ul className="space-y-2 zone3-text-small">
                <li><Link to="/miety/impressum" className="hover:underline">Impressum</Link></li>
                <li><Link to="/miety/datenschutz" className="hover:underline">Datenschutz</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t text-center zone3-text-small" style={{ borderColor: 'hsl(var(--z3-border))' }}>
            © 2026 Miety. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>

      {/* Chat Button */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
        style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'hsl(var(--z3-accent-foreground))' }}
        aria-label="Chat öffnen"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
}
