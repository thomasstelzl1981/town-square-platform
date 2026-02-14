/**
 * SoT Layout — 3-Column: Armstrong Stripe | Main Content | Widget Sidebar
 */
import { Outlet } from 'react-router-dom';
import { SotHeader, SotFooter } from '@/components/zone3/sot';
import { SotWidgetSidebar, SotWidgetBarMobile } from '@/components/zone3/sot/SotWidgetSidebar';
import { SotArmstrongStripe } from '@/components/zone3/sot/SotArmstrongStripe';
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
    <div className={`${themeClass} zone3-page min-h-screen flex flex-col`}>
      <SotHeader isDark={isDark} onToggleTheme={toggleTheme} />

      {/* 3-Column Body */}
      <div className="flex-1 pt-16 lg:pt-20">
        <div className="zone3-container flex gap-6 py-6">
          {/* Left: Armstrong Stripe */}
          <SotArmstrongStripe />

          {/* Center: Main Content */}
          <main className="flex-1 min-w-0">
            {/* Mobile Widget Bar */}
            <SotWidgetBarMobile />
            <Outlet />
          </main>

          {/* Right: Widget Sidebar */}
          <SotWidgetSidebar />
        </div>
      </div>

      <SotFooter />
    </div>
  );
}
