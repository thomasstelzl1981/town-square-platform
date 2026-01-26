import { Outlet, Link, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import '@/styles/zone3-theme.css';

const navItems = [
  { href: '/kaufy/immobilien', label: 'Immobilien' },
  { href: '/kaufy/module', label: 'Module' },
  { href: '/kaufy/berater', label: 'Für Berater' },
  { href: '/kaufy/anbieter', label: 'Für Anbieter' },
  { href: '/kaufy/faq', label: 'FAQ' },
];

export default function KaufyLayout() {
  const location = useLocation();

  return (
    <div className="theme-kaufy zone3-page">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b" style={{ borderColor: 'hsl(var(--z3-border))', backgroundColor: 'hsl(var(--z3-background))' }}>
        <div className="zone3-container">
          <nav className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/kaufy" className="text-2xl font-bold" style={{ color: 'hsl(var(--z3-foreground))' }}>
              KAUFY
            </Link>

            {/* Navigation */}
            <div className="hidden lg:flex items-center gap-8">
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
                to="/auth?mode=register&source=kaufy"
                className="zone3-btn-primary text-sm"
              >
                Registrieren
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
              <h3 className="text-lg font-bold mb-4">KAUFY</h3>
              <p className="zone3-text-small">
                Der Marktplatz für Rendite-Immobilien.
              </p>
            </div>

            {/* Produkt */}
            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 zone3-text-small">
                <li><Link to="/kaufy/immobilien" className="hover:underline">Immobilien</Link></li>
                <li><Link to="/kaufy/module" className="hover:underline">Module</Link></li>
                <li><Link to="/kaufy/berater" className="hover:underline">Für Berater</Link></li>
                <li><Link to="/kaufy/anbieter" className="hover:underline">Für Anbieter</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 zone3-text-small">
                <li><Link to="/kaufy/faq" className="hover:underline">FAQ</Link></li>
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

      {/* Chatbot Button */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
        style={{ backgroundColor: 'hsl(var(--z3-primary))', color: 'hsl(var(--z3-primary-foreground))' }}
        aria-label="Chat öffnen"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
}
