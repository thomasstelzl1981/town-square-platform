/**
 * SoT Layout — Clean Software Presentation Layout
 * Full-width centered content with inline header navigation
 */
import { Outlet, Link, useLocation } from 'react-router-dom';
import { SotFooter } from '@/components/zone3/sot/SotFooter';
import { SotLoginTransition } from '@/components/zone3/sot/SotLoginTransition';
import { useSotTheme } from '@/hooks/useSotTheme';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { cn } from '@/lib/utils';
import { Sun, Moon } from 'lucide-react';
import '@/styles/zone3-theme.css';
import '@/styles/sot-premium.css';

const navItems = [
  { label: 'MANAGEMENT', href: '/website/sot/management' },
  { label: 'REAL ESTATE', href: '/website/sot/real-estate' },
  { label: 'FINANCE', href: '/website/sot/finance' },
  { label: 'ENERGY', href: '/website/sot/energy' },
  { label: 'CAREER', href: '/website/sot/karriere' },
  { label: 'LOGIN', href: '/auth' },
];

export default function SotLayout() {
  const { themeClass, isDark, toggleTheme } = useSotTheme();
  const location = useLocation();

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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            {/* Brand */}
            <Link to="/website/sot" className="text-sm font-bold tracking-widest uppercase hover:opacity-80 transition-opacity">
              SYSTEM OF A TOWN
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-1">
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
              <button
                onClick={toggleTheme}
                className="ml-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </nav>

            {/* Mobile Nav Toggle */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile Nav Bar */}
          <div className="md:hidden overflow-x-auto scrollbar-none border-t border-border/30">
            <div className="flex items-center gap-1 px-4 py-1.5">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-medium tracking-wider uppercase whitespace-nowrap transition-colors',
                    location.pathname === item.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
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
