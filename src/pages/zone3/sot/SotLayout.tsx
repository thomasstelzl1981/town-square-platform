import { Outlet, Link, useLocation } from 'react-router-dom';
import { MessageCircle, Building2 } from 'lucide-react';
import '@/styles/zone3-theme.css';

const navItems = [
  { href: '/sot/produkt', label: 'Produkt' },
  { href: '/sot/module', label: 'Module' },
  { href: '/sot/use-cases', label: 'Use Cases' },
  { href: '/sot/preise', label: 'Preise' },
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
        <div className="zone3-container text-center zone3-text-small">
          © 2026 System of a Town. Alle Rechte vorbehalten.
        </div>
      </footer>
      <button className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center" 
        style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'white' }} aria-label="Chat">
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
}
