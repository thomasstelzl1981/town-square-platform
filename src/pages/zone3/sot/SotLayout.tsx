import { Outlet, Link, useLocation } from 'react-router-dom';
import { MessageCircle, Building2 } from 'lucide-react';
import '@/styles/zone3-theme.css';

const navItems = [
  { href: '/sot/produkt', label: 'Produkt' },
  { href: '/sot/module', label: 'Module' },
  { href: '/sot/use-cases', label: 'Anwendungsfälle' },
  { href: '/sot/preise', label: 'Preise' },
  { href: '/sot/faq', label: 'FAQ' },
];

export default function SotLayout() {
  const location = useLocation();

  return (
    <div className="theme-sot zone3-page">
      <header className="sticky top-0 z-50 border-b" style={{ borderColor: 'hsl(var(--z3-border))', backgroundColor: 'hsl(var(--z3-background))' }}>
        <div className="zone3-container">
          <nav className="flex items-center justify-between h-16">
            <Link to="/sot" className="flex items-center gap-2 text-xl font-bold">
              <Building2 className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
              System of a Town
            </Link>
            <div className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <Link key={item.href} to={item.href} className="text-sm font-medium transition-colors hover:opacity-70"
                  style={{ color: location.pathname === item.href ? 'hsl(var(--z3-foreground))' : 'hsl(var(--z3-muted-foreground))' }}>
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Link to="/auth?mode=login" className="zone3-btn-secondary text-sm">Anmelden</Link>
              <Link to="/auth?mode=register&source=sot" className="zone3-btn-primary text-sm" style={{ backgroundColor: 'hsl(var(--z3-accent))' }}>
                Kostenlos starten
              </Link>
            </div>
          </nav>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="border-t py-12" style={{ borderColor: 'hsl(var(--z3-border))', backgroundColor: 'hsl(var(--z3-card))' }}>
        <div className="zone3-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" style={{ color: 'hsl(var(--z3-accent))' }} />
                System of a Town
              </h3>
              <p className="zone3-text-small">
                KI-Software für Immobilienverwaltung.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 zone3-text-small">
                <li><Link to="/sot/produkt" className="hover:underline">Überblick</Link></li>
                <li><Link to="/sot/module" className="hover:underline">Module</Link></li>
                <li><Link to="/sot/use-cases" className="hover:underline">Anwendungsfälle</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 zone3-text-small">
                <li><Link to="/sot/preise" className="hover:underline">Preise</Link></li>
                <li><Link to="/sot/faq" className="hover:underline">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Rechtliches</h4>
              <ul className="space-y-2 zone3-text-small">
                <li><Link to="/sot/impressum" className="hover:underline">Impressum</Link></li>
                <li><Link to="/sot/datenschutz" className="hover:underline">Datenschutz</Link></li>
              </ul>
            </div>
          </div>
          <div className="text-center zone3-text-small pt-8 border-t" style={{ borderColor: 'hsl(var(--z3-border))' }}>
            © 2026 System of a Town. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>
      <button className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center" 
        style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'white' }} aria-label="Chat">
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
}
