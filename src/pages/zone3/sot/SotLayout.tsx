/**
 * SoT Layout — Portal-Clone: SystemBar | Main Content + Armstrong Stripe (right)
 * Matches the Zone 2 portal design exactly: h-screen, no footer, no widget sidebar.
 */
import { Outlet } from 'react-router-dom';
import { SotWidgetBarMobile } from '@/components/zone3/sot/SotWidgetSidebar';
import { SotArmstrongStripe } from '@/components/zone3/sot/SotArmstrongStripe';
import { SotLoginTransition } from '@/components/zone3/sot/SotLoginTransition';
import { SotSystemBar } from '@/components/zone3/sot/SotSystemBar';
import { useSotTheme } from '@/hooks/useSotTheme';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import '@/styles/zone3-theme.css';
import '@/styles/sot-premium.css';

export default function SotLayout() {
  const { themeClass, isDark, toggleTheme } = useSotTheme();

  useDocumentMeta({
    title: 'System of a Town — Investments finden. Objekte einreichen. Prozesse steuern.',
    description: 'Die Plattform für Kapitalanlage, Projekte und Finanzierung. Marketplace, Investment Engine, KI-Verwaltung.',
    ogType: 'website',
  });

  return (
    <SotLoginTransition>
      <div className={`${themeClass} h-screen flex flex-col overflow-hidden bg-atmosphere`}>
        {/* SystemBar — Portal-Clone */}
        <SotSystemBar isDark={isDark} onToggleTheme={toggleTheme} />

        {/* Main Content + Armstrong Stripe (right) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto relative">
            <Outlet />
          </main>

          {/* Armstrong Stripe — right side, like Portal */}
          <SotArmstrongStripe />
        </div>

        {/* Mobile Bottom Nav */}
        <div className="lg:hidden">
          <SotWidgetBarMobile />
        </div>
      </div>
    </SotLoginTransition>
  );
}
