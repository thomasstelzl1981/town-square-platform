/**
 * SoT Layout — Premium Software Presentation Layout
 * SpaceX-inspired with orbital visuals
 */
import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { SotFooter } from '@/components/zone3/sot/SotFooter';
import { SotLoginTransition } from '@/components/zone3/sot/SotLoginTransition';
import { useSotTheme } from '@/hooks/useSotTheme';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { cn } from '@/lib/utils';
import { Sun, Moon, User, Menu, X } from 'lucide-react';
import '@/styles/zone3-theme.css';
import '@/styles/sot-premium.css';

const navItems = [
  { label: 'MANAGEMENT', href: '/website/sot/management' },
  { label: 'REAL ESTATE', href: '/website/sot/real-estate' },
  { label: 'FINANCE', href: '/website/sot/finance' },
  { label: 'ENERGY', href: '/website/sot/energy' },
  { label: 'CAREER', href: '/website/sot/karriere' },
];

export default function SotLayout() {
  const { themeClass, isDark, toggleTheme } = useSotTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useDocumentMeta({
    title: 'System of a Town — Der digitale Manager für Immobilien und private Finanzen.',
    description: 'Organisieren. Verwalten. Analysieren. Automatisieren. Die Plattform für Immobilien, Finanzen und KI-gestützte Verwaltung.',
    ogType: 'website',
  });

  return (
    <SotLoginTransition>
      <div className={`${themeClass} min-h-screen flex flex-col bg-background text-foreground`}>
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Brand */}
            <Link to="/website/sot" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-primary" />
              </div>
              <span className="text-sm font-bold tracking-widest uppercase hidden sm:block">
                System of a Town
              </span>
              <span className="text-sm font-bold tracking-widest uppercase sm:hidden">
                SoaT
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium tracking-wider uppercase transition-colors',
                    location.pathname === item.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <Link
                to="/auth"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium tracking-wider uppercase hover:bg-primary/90 transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                Login
              </Link>
              <Link
                to="/auth"
                className="sm:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <User className="w-4 h-4" />
              </Link>
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile Nav Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-border/30 bg-background/95 backdrop-blur-xl">
              <div className="px-4 py-3 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'block px-3 py-2 rounded-lg text-sm font-medium tracking-wider uppercase transition-colors',
                      location.pathname === item.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <Outlet />
        </main>

        {/* Footer */}
        <SotFooter />
      </div>
    </SotLoginTransition>
  );
}
