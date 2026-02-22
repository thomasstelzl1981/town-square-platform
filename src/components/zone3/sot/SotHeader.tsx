/**
 * SoT Header — Minimal Navigation (Logo + Auth only)
 * Widget sidebar replaces traditional nav items.
 */
import { Link } from 'react-router-dom';
import { Building2, Sun, Moon } from 'lucide-react';


interface SotHeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export function SotHeader({ isDark, onToggleTheme }: SotHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 sot-glass" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="zone3-container">
        <nav className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/website/sot" className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'hsl(var(--z3-accent))' }}
            >
              <Building2 className="w-5 h-5" style={{ color: 'hsl(var(--z3-background))' }} />
            </div>
            <span className="hidden sm:block" style={{ color: 'hsl(var(--z3-foreground))' }}>
              System of a Town
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleTheme}
              className="sot-btn-ghost p-2"
              aria-label="Theme umschalten"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
