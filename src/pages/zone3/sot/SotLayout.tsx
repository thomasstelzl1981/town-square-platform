/**
 * SoT Layout — 3-Column: Armstrong Stripe | Main Content | Widget Sidebar
 * Wrapped in SotLoginTransition for animated login flow.
 */
import { Outlet } from 'react-router-dom';
import { SotHeader, SotFooter } from '@/components/zone3/sot';
import { SotWidgetSidebar, SotWidgetBarMobile } from '@/components/zone3/sot/SotWidgetSidebar';
import { SotArmstrongStripe } from '@/components/zone3/sot/SotArmstrongStripe';
import { SotLoginTransition } from '@/components/zone3/sot/SotLoginTransition';
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
      <div className={`${themeClass} zone3-page min-h-screen flex flex-col`}>
        <div className="sot-header-area">
          <SotHeader isDark={isDark} onToggleTheme={toggleTheme} />
        </div>

        {/* 3-Column Body */}
        <div className="flex-1 pt-16 lg:pt-20">
          <div className="zone3-container flex gap-6 py-6">
            {/* Left: Armstrong Stripe */}
            <div className="sot-armstrong-area">
              <SotArmstrongStripe />
            </div>

            {/* Center: Main Content */}
            <main className="sot-main-area flex-1 min-w-0 pb-20 lg:pb-0">
              <Outlet />
            </main>

            {/* Right: Widget Sidebar */}
            <div className="sot-sidebar-area">
              <SotWidgetSidebar />
            </div>
          </div>
        </div>

        <div className="sot-footer-area">
          <SotFooter />
        </div>

        {/* Mobile Bottom Nav */}
        <div className="sot-mobile-nav-area">
          <SotWidgetBarMobile />
        </div>
      </div>
    </SotLoginTransition>
  );
}
