/**
 * SoT Layout — Symmetrisches Portal-Design mit Scroll-Snap
 * Left Spacer (300px) | Main Content (scroll-snap) | Armstrong Stripe (300px, fixed)
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
        {/* SystemBar */}
        <SotSystemBar isDark={isDark} onToggleTheme={toggleTheme} />

        {/* Content Area: Spacer | Main | (Armstrong is fixed) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Spacer — invisible, matches Armstrong width for perfect centering */}
          <div className="hidden lg:block w-[300px] shrink-0" />

          {/* Main Content with scroll-snap */}
          <main className="flex-1 overflow-y-auto sot-scroll-snap-container">
            <Outlet />
          </main>
        </div>

        {/* Armstrong Stripe — fixed right side, 300px */}
        <SotArmstrongStripe />

        {/* Mobile Bottom Nav */}
        <div className="lg:hidden">
          <SotWidgetBarMobile />
        </div>
      </div>
    </SotLoginTransition>
  );
}
