import * as React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Landmark, Home, FileText, Users, HelpCircle, 
  Menu, X, ChevronRight 
} from 'lucide-react';

const navItems = [
  { label: 'Start', href: '/futureroom', icon: Home },
  { label: 'Bonitätscheck', href: '/futureroom/bonitat', icon: FileText },
  { label: 'Karriere', href: '/futureroom/karriere', icon: Users },
  { label: 'FAQ', href: '/futureroom/faq', icon: HelpCircle },
];

export default function FutureRoomLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/futureroom" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Landmark className="h-6 w-6 text-slate-900" />
              </div>
              <span className="text-xl font-bold">
                Future<span className="text-amber-400">Room</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* CTA Button */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/futureroom/bonitat">
                <Button className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 hover:from-amber-500 hover:to-orange-600">
                  Bonitätscheck starten
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-900">
            <nav className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-4">
                <Link to="/futureroom/bonitat" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900">
                    Bonitätscheck starten
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-900/50 py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Landmark className="h-4 w-4 text-slate-900" />
                </div>
                <span className="font-bold">FutureRoom</span>
              </div>
              <p className="text-sm text-white/60">
                Professionelle Finanzierungsvermittlung für Ihre Immobilie.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link to="/futureroom/bonitat" className="hover:text-white">Bonitätscheck</Link></li>
                <li><Link to="/futureroom/karriere" className="hover:text-white">Für Berater</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Rechtliches</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link to="#" className="hover:text-white">Impressum</Link></li>
                <li><Link to="#" className="hover:text-white">Datenschutz</Link></li>
                <li><Link to="#" className="hover:text-white">AGB</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Kontakt</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>info@futureroom.de</li>
                <li>+49 89 123456789</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-white/40">
            © {new Date().getFullYear()} FutureRoom – Ein Service von System of a Town
          </div>
        </div>
      </footer>
    </div>
  );
}
