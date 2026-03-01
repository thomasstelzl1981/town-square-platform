/**
 * LennoxLayout — Alpine Chic Shell
 */
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogIn, ShoppingBag, Handshake, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useZ3Auth } from '@/hooks/useZ3Auth';
import { LENNOX as C } from './lennoxTheme';
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import { WebsitePinGate } from '@/components/zone3/WebsitePinGate';
import { useZone3Setting } from '@/hooks/useZone3Settings';
import { ArmstrongWidget } from '@/components/zone3/ArmstrongWidget';
import lennoxPatch from '@/assets/logos/lennox_logo_patch.jpeg';

const navLinks = [
  { path: '/website/tierservice?locate=1', label: 'Partner finden', icon: MapPin },
  { path: '/website/tierservice/shop', label: 'Shop', icon: ShoppingBag },
  { path: '/website/tierservice/partner-werden', label: 'Partner werden', icon: Handshake },
];

export default function LennoxLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pinVerified, setPinVerified] = useState(() => sessionStorage.getItem('lennox_pin_verified') === 'true');
  const { z3User } = useZ3Auth();
  const { data: pinGateValue, isLoading: pinGateLoading } = useZone3Setting('pin_gate_enabled');
  const pinGateEnabled = pinGateValue === 'true';

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  if (pinGateLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="h-6 w-6 border-2 border-current border-t-transparent rounded-full animate-spin" /></div>;
  }

  const legalPaths = ['/impressum', '/datenschutz'];
  const isLegalPage = legalPaths.some(p => location.pathname.endsWith(p));

  if (pinGateEnabled && !pinVerified && !isLegalPage) {
    return <WebsitePinGate brandName="Lennox & Friends" sessionKey="lennox_pin_verified" onVerified={() => setPinVerified(true)} />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.cream }}>
      <SEOHead
        brand="lennox"
        page={{
          title: 'Premium Dog Resorts & Services',
          description: 'Hundebetreuung, Gassi-Service und Premium-Zubehör — von zertifizierten Partnern in Ihrer Nähe.',
          path: location.pathname.replace('/website/tierservice', '') || '/',
        }}
        services={[{
          name: 'Premium Hundebetreuung',
          description: 'Zertifizierte Partner für Daycare, Gassi-Service und Hundetraining in Ihrer Nähe.',
        }]}
      />
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

      <main className="flex-1"><Outlet /></main>

      {/* Footer */}
      <footer className="border-t bg-white" style={{ borderColor: C.sandLight }}>
        <div className="max-w-6xl mx-auto px-5 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <img src={lennoxPatch} alt="" className="h-8 w-auto rounded-md object-cover" />
              <div>
                <span className="font-bold tracking-tight block" style={{ color: C.bark }}>Lennox & Friends</span>
                <span className="text-xs" style={{ color: C.barkMuted }}>Dein Hundenetzwerk</span>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs" style={{ color: C.barkMuted }}>
              <Link to="/website/tierservice/partner-werden" className="hover:underline">Partner werden</Link>
              <Link to="/website/tierservice/shop" className="hover:underline">Shop</Link>
              <Link to="/website/tierservice/faq" className="hover:underline">FAQ</Link>
              <Link to="/website/tierservice/kontakt" className="hover:underline">Kontakt</Link>
              <Link to="/website/tierservice/impressum" className="hover:underline">Impressum</Link>
              <Link to="/website/tierservice/datenschutz" className="hover:underline">Datenschutz</Link>
            </div>

            {/* Contact + Copyright */}
            <div className="text-xs md:text-right" style={{ color: C.barkMuted }}>
              <a href="tel:+498941434901" className="hover:underline block mb-0.5" style={{ color: C.bark }}>+49 89 4143 4901</a>
              <span className="text-[10px] opacity-70 block mb-2">Armstrong KI-Assistent erreichbar</span>
              <p>© {new Date().getFullYear()} Lennox & Friends</p>
              <span className="text-[10px] opacity-60">Plattform: <a href="https://systemofatown.com" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">System of a Town</a></span>
            </div>
          </div>
        </div>
      </footer>
      <ArmstrongWidget website="lennox" />
    </div>
  );
}
