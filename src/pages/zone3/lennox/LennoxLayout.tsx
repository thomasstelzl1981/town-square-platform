/**
 * LennoxLayout — Zone 3 Public Website for "Lennox & Friends" Pet Services
 */
import { Outlet, Link, useLocation } from 'react-router-dom';
import { PawPrint, Menu, X, User, LogIn } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const navLinks = [
  { path: '/website/tierservice', label: 'Anbieter finden', exact: true },
  { path: '/website/tierservice/ueber-uns', label: 'Über uns' },
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

  return (
    <div className="min-h-screen bg-[hsl(35,40%,97%)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[hsl(35,30%,90%)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-5">
          <Link to="/website/tierservice" className="flex items-center gap-2">
            <PawPrint className="h-7 w-7 text-[hsl(25,85%,55%)]" />
            <span className="text-xl font-bold text-[hsl(25,30%,20%)]">Lennox & Friends</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(l => {
              const active = l.exact
                ? location.pathname === l.path
                : location.pathname.startsWith(l.path);
              return (
                <Link
                  key={l.path}
                  to={l.path}
                  className={`text-sm font-medium transition-colors ${active ? 'text-[hsl(25,85%,55%)]' : 'text-[hsl(25,20%,40%)] hover:text-[hsl(25,85%,55%)]'}`}
                >
                  {l.label}
                </Link>
              );
            })}
            {user ? (
              <Link
                to="/website/tierservice/profil"
                className="text-sm font-semibold px-4 py-2 rounded-full bg-[hsl(25,85%,55%)] text-white hover:bg-[hsl(25,85%,48%)] transition-colors inline-flex items-center gap-1.5"
              >
                <User className="h-4 w-4" /> Mein Profil
              </Link>
            ) : (
              <Link
                to="/website/tierservice/login"
                className="text-sm font-semibold px-4 py-2 rounded-full bg-[hsl(25,85%,55%)] text-white hover:bg-[hsl(25,85%,48%)] transition-colors inline-flex items-center gap-1.5"
              >
                <LogIn className="h-4 w-4" /> Anmelden
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
          <div className="md:hidden border-t border-[hsl(35,30%,90%)] px-5 py-4 space-y-3 bg-white">
            {navLinks.map(l => (
              <Link
                key={l.path}
                to={l.path}
                onClick={() => setMenuOpen(false)}
                className="block text-sm font-medium text-[hsl(25,20%,40%)]"
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <Link
                to="/website/tierservice/profil"
                onClick={() => setMenuOpen(false)}
                className="block text-center text-sm font-semibold px-4 py-2 rounded-full bg-[hsl(25,85%,55%)] text-white"
              >
                Mein Profil
              </Link>
            ) : (
              <Link
                to="/website/tierservice/login"
                onClick={() => setMenuOpen(false)}
                className="block text-center text-sm font-semibold px-4 py-2 rounded-full bg-[hsl(25,85%,55%)] text-white"
              >
                Anmelden
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="max-w-6xl mx-auto px-5 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-[hsl(35,30%,90%)] bg-white mt-12">
        <div className="max-w-6xl mx-auto px-5 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-[hsl(25,85%,55%)]" />
              <span className="font-semibold text-[hsl(25,30%,20%)]">Lennox & Friends</span>
            </div>
            <p className="text-xs text-[hsl(25,15%,55%)]">
              © {new Date().getFullYear()} Lennox & Friends — Tierbetreuung mit Herz
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
