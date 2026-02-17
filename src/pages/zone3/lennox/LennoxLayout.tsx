/**
 * LennoxLayout — Zone 3 Public Website "Lennox & Friends — Dog Resorts"
 * Alpine Modern CI: Tannengrün + Offwhite + Sand + Neon Coral Akzent
 */
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogIn, ShoppingBag, Handshake } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import lennoxLogo from '@/assets/logos/lennox_logo_minimal.jpeg';

const COLORS = {
  primary: 'hsl(155,35%,25%)',
  primaryHover: 'hsl(155,35%,20%)',
  bg: 'hsl(40,30%,97%)',
  sand: 'hsl(35,30%,85%)',
  foreground: 'hsl(155,25%,15%)',
  muted: 'hsl(155,10%,45%)',
  coral: 'hsl(10,85%,60%)',
};

const navLinks = [
  { path: '/website/tierservice/shop', label: 'Shop', icon: ShoppingBag },
  { path: '/website/tierservice/partner-werden', label: 'Partner werden', icon: Handshake },
];

export default function LennoxLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u));
    return () => subscription.unsubscribe();
  }, []);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen" style={{ background: COLORS.bg }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b" style={{ borderColor: COLORS.sand }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-5">
          <Link to="/website/tierservice" className="flex items-center gap-2.5">
            <img src={lennoxLogo} alt="Lennox & Friends" className="h-9 w-9 rounded-full object-cover" />
            <span className="text-lg font-bold" style={{ color: COLORS.foreground }}>
              Lennox & Friends
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5">
            {navLinks.map(l => (
              <Link
                key={l.path}
                to={l.path}
                className="text-sm font-medium transition-colors flex items-center gap-1.5"
                style={{ color: isActive(l.path) ? COLORS.primary : COLORS.muted }}
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </Link>
            ))}
            {user ? (
              <Link
                to="/website/tierservice/mein-bereich"
                className="text-sm font-semibold px-4 py-2 rounded-full text-white transition-colors inline-flex items-center gap-1.5"
                style={{ background: COLORS.primary }}
                onMouseEnter={e => (e.currentTarget.style.background = COLORS.primaryHover)}
                onMouseLeave={e => (e.currentTarget.style.background = COLORS.primary)}
              >
                <User className="h-4 w-4" /> Mein Bereich
              </Link>
            ) : (
              <Link
                to="/website/tierservice/login"
                className="text-sm font-semibold px-4 py-2 rounded-full text-white transition-colors inline-flex items-center gap-1.5"
                style={{ background: COLORS.primary }}
                onMouseEnter={e => (e.currentTarget.style.background = COLORS.primaryHover)}
                onMouseLeave={e => (e.currentTarget.style.background = COLORS.primary)}
              >
                <LogIn className="h-4 w-4" /> Login
              </Link>
            )}
          </nav>

          {/* Mobile toggle */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t px-5 py-4 space-y-3 bg-white" style={{ borderColor: COLORS.sand }}>
            {navLinks.map(l => (
              <Link key={l.path} to={l.path} onClick={() => setMenuOpen(false)}
                className="block text-sm font-medium" style={{ color: COLORS.muted }}>
                {l.label}
              </Link>
            ))}
            <Link
              to={user ? '/website/tierservice/mein-bereich' : '/website/tierservice/login'}
              onClick={() => setMenuOpen(false)}
              className="block text-center text-sm font-semibold px-4 py-2 rounded-full text-white"
              style={{ background: COLORS.primary }}
            >
              {user ? 'Mein Bereich' : 'Anmelden'}
            </Link>
          </div>
        )}
      </header>

      {/* Page Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-12" style={{ borderColor: COLORS.sand }}>
        <div className="max-w-6xl mx-auto px-5 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img src={lennoxLogo} alt="" className="h-6 w-6 rounded-full object-cover" />
              <span className="font-semibold" style={{ color: COLORS.foreground }}>Lennox & Friends</span>
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: COLORS.muted }}>
              <Link to="#" className="hover:underline">Impressum</Link>
              <Link to="#" className="hover:underline">Datenschutz</Link>
              <Link to="#" className="hover:underline">Kontakt</Link>
            </div>
            <p className="text-xs" style={{ color: COLORS.muted }}>
              © {new Date().getFullYear()} Lennox & Friends — Dog Resorts
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
