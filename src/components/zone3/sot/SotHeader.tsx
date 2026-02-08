/**
 * SoT Header — Glass Effect with Theme Toggle & Armstrong Logo
 */
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useSotTheme } from '@/hooks/useSotTheme';
import armstrongLogoDark from '@/assets/logos/armstrong_logo_mono_white.png';
import armstrongLogoLight from '@/assets/logos/armstrong_logo_mono_black.png';

const navItems = [
  { href: '/sot/produkt', label: 'Produkt' },
  { href: '/sot/module', label: 'Module' },
  { href: '/sot/use-cases', label: 'Anwendungsfälle' },
  { href: '/sot/preise', label: 'Preise' },
  { href: '/sot/demo', label: 'Demo' },
  { href: '/sot/faq', label: 'FAQ' },
];

export function SotHeader() {
  const location = useLocation();
  const { isDark, toggleTheme } = useSotTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Use appropriate logo based on theme
  const logoSrc = isDark ? armstrongLogoDark : armstrongLogoLight;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 sot-glass">
      <div className="zone3-container">
        <nav className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo with Armstrong branding */}
          <Link to="/sot" className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
            <img 
              src={logoSrc} 
              alt="System of a Town" 
              className="h-8 w-auto object-contain"
            />
            <span className="hidden sm:block font-semibold" style={{ color: 'hsl(var(--z3-foreground))' }}>
              System of a Town
            </span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`sot-btn-ghost ${
                  location.pathname === item.href 
                    ? 'text-[hsl(var(--z3-foreground))]' 
                    : 'text-[hsl(var(--z3-muted-foreground))]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          
          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="sot-btn-ghost p-2"
              aria-label="Theme umschalten"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            {/* Auth buttons */}
            <Link to="/auth?mode=login" className="sot-btn-ghost hidden sm:block">
              Anmelden
            </Link>
            <Link to="/auth?mode=register&source=sot" className="sot-btn-primary text-sm">
              Starten
            </Link>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sot-btn-ghost p-2 lg:hidden"
              aria-label="Menü"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-[hsl(var(--z3-border))]">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`sot-btn-ghost text-left ${
                    location.pathname === item.href 
                      ? 'text-[hsl(var(--z3-foreground))]' 
                      : 'text-[hsl(var(--z3-muted-foreground))]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/auth?mode=login"
                onClick={() => setMobileMenuOpen(false)}
                className="sot-btn-ghost text-left sm:hidden"
              >
                Anmelden
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}