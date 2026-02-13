/**
 * SoT Layout — SpaceX-Inspired Dark-First Design
 */
import { Outlet } from 'react-router-dom';
import { SotHeader, SotFooter, SotInputBar } from '@/components/zone3/sot';
import { useSotTheme } from '@/hooks/useSotTheme';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import '@/styles/zone3-theme.css';
import '@/styles/sot-premium.css';

export default function SotLayout() {
  // Single SoT theme source (prevents desync between header + layout)
  const { themeClass, isDark, toggleTheme } = useSotTheme();

  useDocumentMeta({
    title: 'System of a Town — Management Suite für Immobilienprofis',
    description: 'Die All-in-One Plattform für Immobilienverwaltung, Vertrieb, Finanzierung und Investment. 21 Module, KI-Co-Pilot Armstrong, Multi-Tenant-fähig.',
    ogType: 'website',
  });

  return (
    <div className={`${themeClass} zone3-page min-h-screen flex flex-col`}>
      <SotHeader isDark={isDark} onToggleTheme={toggleTheme} />

      <main className="flex-1 pt-16 lg:pt-20 pb-20">
        <Outlet />
      </main>

      <SotFooter />
      <SotInputBar />
    </div>
  );
}
