/**
 * LennoxLayout — Alpine Chic Shell
 */
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogIn, ShoppingBag, Handshake, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useZ3Auth } from '@/hooks/useZ3Auth';
import lennoxPatch from '@/assets/logos/lennox_logo_patch.jpeg';

const C = {
  forest: 'hsl(155,35%,22%)',
  forestHover: 'hsl(155,35%,18%)',
  cream: 'hsl(38,45%,96%)',
  bark: 'hsl(25,30%,18%)',
  barkMuted: 'hsl(25,15%,42%)',
  sand: 'hsl(32,35%,82%)',
  sandLight: 'hsl(35,40%,92%)',
  coral: 'hsl(10,78%,58%)',
};

const navLinks = [
  { path: '/website/tierservice?locate=1', label: 'Partner finden', icon: MapPin },
  { path: '/website/tierservice/shop', label: 'Shop', icon: ShoppingBag },
  { path: '/website/tierservice/partner-werden', label: 'Partner werden', icon: Handshake },
];

export default function LennoxLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { z3User } = useZ3Auth();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen" style={{ background: C.cream }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b" style={{ borderColor: C.sandLight }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-5">
          <Link to="/website/tierservice" className="flex items-center gap-2.5">
            <img src={lennoxPatch} alt="Lennox & Friends" className="h-9 w-auto rounded-md object-cover shadow-sm" />
            <span className="text-lg font-bold tracking-tight" style={{ color: C.bark }}>
              Lennox & Friends
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5">
            {navLinks.map(l => (
              <Link key={l.path} to={l.path}
                className="text-sm font-medium transition-colors flex items-center gap-1.5"
                style={{ color: isActive(l.path) ? C.forest : C.barkMuted }}>
                <l.icon className="h-4 w-4" />
                {l.label}
              </Link>
            ))}
            {z3User ? (
              <Link to="/website/tierservice/mein-bereich"
                className="text-sm font-semibold px-4 py-2 rounded-full text-white transition-colors inline-flex items-center gap-1.5"
                style={{ background: C.forest }}
                onMouseEnter={e => (e.currentTarget.style.background = C.forestHover)}
                onMouseLeave={e => (e.currentTarget.style.background = C.forest)}>
                <User className="h-4 w-4" /> Mein Bereich
              </Link>
            ) : (
              <Link to="/website/tierservice/login"
                className="text-sm font-semibold px-4 py-2 rounded-full text-white transition-colors inline-flex items-center gap-1.5"
                style={{ background: C.forest }}
                onMouseEnter={e => (e.currentTarget.style.background = C.forestHover)}
                onMouseLeave={e => (e.currentTarget.style.background = C.forest)}>
                <LogIn className="h-4 w-4" /> Login
              </Link>
            )}
          </nav>

          {/* Mobile toggle */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} style={{ color: C.bark }}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t px-5 py-4 space-y-3 bg-white" style={{ borderColor: C.sandLight }}>
            {navLinks.map(l => (
              <Link key={l.path} to={l.path} onClick={() => setMenuOpen(false)}
                className="block text-sm font-medium" style={{ color: C.barkMuted }}>
                {l.label}
              </Link>
            ))}
            <Link to={z3User ? '/website/tierservice/mein-bereich' : '/website/tierservice/login'}
              onClick={() => setMenuOpen(false)}
              className="block text-center text-sm font-semibold px-4 py-2 rounded-full text-white"
              style={{ background: C.forest }}>
              {z3User ? 'Mein Bereich' : 'Anmelden'}
            </Link>
          </div>
        )}
      </header>

      <main><Outlet /></main>

      {/* Footer */}
      <footer className="border-t bg-white" style={{ borderColor: C.sandLight }}>
        <div className="max-w-6xl mx-auto px-5 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img src={lennoxPatch} alt="" className="h-7 w-auto rounded-md object-cover" />
              <span className="font-bold tracking-tight" style={{ color: C.bark }}>Lennox & Friends</span>
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: C.barkMuted }}>
              <Link to="#" className="hover:underline">Impressum</Link>
              <Link to="#" className="hover:underline">Datenschutz</Link>
              <Link to="#" className="hover:underline">Kontakt</Link>
            </div>
            <p className="text-xs" style={{ color: C.barkMuted }}>
              © {new Date().getFullYear()} Lennox & Friends — Dein Hundenetzwerk
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
