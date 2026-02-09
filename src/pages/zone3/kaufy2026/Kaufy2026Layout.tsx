/**
 * Kaufy2026Layout — Zone 3 Website Layout
 * 
 * Design: 1400px centered container with rounded corners
 * Header: Logo + Nav + Auth buttons
 * Footer: 5-column grid
 */
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function Kaufy2026Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/kaufy2026', label: 'Suchen', exact: true },
    { path: '/kaufy2026/vermieter', label: 'Vermieter' },
    { path: '/kaufy2026/verkaeufer', label: 'Verkäufer' },
    { path: '/kaufy2026/vertrieb', label: 'Partner' },
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[hsl(210,40%,97%)]">
      {/* Main Container */}
      <div className="kaufy2026-container">
        {/* Header */}
        <header className="kaufy2026-header">
          <div className="flex items-center justify-between h-16 px-6 lg:px-10">
            {/* Logo */}
            <Link to="/kaufy2026" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[hsl(220,20%,10%)]">KAUFY</span>
              <span className="text-xs font-medium text-[hsl(210,80%,55%)] bg-[hsl(210,80%,55%,0.1)] px-2 py-0.5 rounded-full">
                beta
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-full transition-colors",
                    isActive(link.path, link.exact)
                      ? "bg-[hsl(220,20%,10%)] text-white"
                      : "text-[hsl(220,20%,10%)] hover:bg-[hsl(210,30%,95%)]"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-[hsl(220,20%,10%)]">
                  Anmelden
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="rounded-full bg-[hsl(220,20%,10%)] hover:bg-[hsl(220,20%,20%)]">
                  Registrieren
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav className="md:hidden border-t px-6 py-4 space-y-2 bg-white">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    isActive(link.path, link.exact)
                      ? "bg-[hsl(220,20%,10%)] text-white"
                      : "text-[hsl(220,20%,10%)] hover:bg-[hsl(210,30%,95%)]"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t flex gap-2">
                <Link to="/auth" className="flex-1">
                  <Button variant="outline" className="w-full">Anmelden</Button>
                </Link>
                <Link to="/auth" className="flex-1">
                  <Button className="w-full">Registrieren</Button>
                </Link>
              </div>
            </nav>
          )}
        </header>

        {/* Main Content */}
        <main className="kaufy2026-main">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="kaufy2026-footer">
          <div className="px-6 lg:px-10 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Logo + Claim */}
              <div className="md:col-span-1">
                <span className="text-2xl font-bold text-[hsl(220,20%,10%)]">KAUFY</span>
                <p className="mt-3 text-sm text-[hsl(215,16%,47%)] leading-relaxed">
                  Die KI-Plattform für Kapitalanlage.
                </p>
                <p className="mt-2 text-sm text-[hsl(215,16%,47%)] leading-relaxed">
                  Vermarktung, Beratung und Verwaltung – auf einer Plattform.
                </p>
              </div>

              {/* Plattform */}
              <div>
                <h4 className="font-semibold text-[hsl(220,20%,10%)] mb-4 text-sm uppercase tracking-wide">Plattform</h4>
                <ul className="space-y-2 text-sm text-[hsl(215,16%,47%)]">
                  <li><Link to="/kaufy2026" className="hover:text-[hsl(220,20%,10%)] transition-colors">Überblick</Link></li>
                  <li><Link to="/kaufy2026" className="hover:text-[hsl(220,20%,10%)] transition-colors">Funktionen</Link></li>
                  <li><Link to="/kaufy2026" className="hover:text-[hsl(220,20%,10%)] transition-colors">Immo-Wallet</Link></li>
                  <li><Link to="/kaufy2026" className="hover:text-[hsl(220,20%,10%)] transition-colors">Vertriebstools</Link></li>
                  <li><Link to="/kaufy2026" className="hover:text-[hsl(220,20%,10%)] transition-colors">Automationen</Link></li>
                </ul>
              </div>

              {/* Für wen */}
              <div>
                <h4 className="font-semibold text-[hsl(220,20%,10%)] mb-4 text-sm uppercase tracking-wide">Für wen</h4>
                <ul className="space-y-2 text-sm text-[hsl(215,16%,47%)]">
                  <li><Link to="/kaufy2026/vermieter" className="hover:text-[hsl(220,20%,10%)] transition-colors">Für Vermieter</Link></li>
                  <li><Link to="/kaufy2026/verkaeufer" className="hover:text-[hsl(220,20%,10%)] transition-colors">Für Anbieter</Link></li>
                  <li><Link to="/kaufy2026/vertrieb" className="hover:text-[hsl(220,20%,10%)] transition-colors">Für Vertriebspartner</Link></li>
                  <li><Link to="/kaufy2026" className="hover:text-[hsl(220,20%,10%)] transition-colors">Für Investoren</Link></li>
                  <li><a href="#" className="hover:text-[hsl(220,20%,10%)] transition-colors">Demo anfragen</a></li>
                </ul>
              </div>

              {/* Unternehmen */}
              <div>
                <h4 className="font-semibold text-[hsl(220,20%,10%)] mb-4 text-sm uppercase tracking-wide">Unternehmen</h4>
                <ul className="space-y-2 text-sm text-[hsl(215,16%,47%)]">
                  <li><a href="#" className="hover:text-[hsl(220,20%,10%)] transition-colors">Über kaufy</a></li>
                  <li><a href="#" className="hover:text-[hsl(220,20%,10%)] transition-colors">Kontakt</a></li>
                  <li><a href="#" className="hover:text-[hsl(220,20%,10%)] transition-colors">Karriere</a></li>
                  <li><a href="#" className="hover:text-[hsl(220,20%,10%)] transition-colors">Partner</a></li>
                  <li><a href="#" className="hover:text-[hsl(220,20%,10%)] transition-colors">Presse</a></li>
                </ul>
              </div>
            </div>

            {/* Footer Bottom Bar */}
            <div className="mt-12 pt-6 border-t border-[hsl(210,20%,90%)] flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-[hsl(215,16%,47%)]">
                © {new Date().getFullYear()} kaufy GmbH
              </p>
              <div className="flex items-center gap-4 text-xs text-[hsl(215,16%,47%)]">
                <a href="#" className="hover:text-[hsl(220,20%,10%)] transition-colors">Impressum</a>
                <span className="text-[hsl(210,20%,85%)]">·</span>
                <a href="#" className="hover:text-[hsl(220,20%,10%)] transition-colors">Datenschutz</a>
                <span className="text-[hsl(210,20%,85%)]">·</span>
                <a href="#" className="hover:text-[hsl(220,20%,10%)] transition-colors">AGB</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
