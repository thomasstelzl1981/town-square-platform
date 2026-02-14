/**
 * AREA OVERVIEW PAGE
 * 
 * Dynamic page that displays promo + module cards for a given area.
 * Reads from moduleContents.ts (SSOT for How It Works).
 * 
 * Route: /portal/area/:areaKey
 */

import { useParams, Navigate } from 'react-router-dom';
import { useMemo } from 'react';
import { areaConfig, AreaKey } from '@/manifests/areaConfig';
import { useIsMobile } from '@/hooks/use-mobile';
import { zone2Portal } from '@/manifests/routesManifest';
import { moduleContents } from '@/components/portal/HowItWorks/moduleContents';
import { areaPromoContent } from '@/config/areaPromoContent';
import { AreaPromoCard } from '@/components/portal/AreaPromoCard';
import { AreaModuleCard } from '@/components/portal/AreaModuleCard';

// Area descriptions for header
const areaDescriptions: Record<AreaKey, string> = {
  base: 'Stammdaten, KI Office, Dokumente und Services-Grundlagen',
  missions: 'Immobilien, Mietverwaltung, Verkauf, Finanzierung und Investment',
  operations: 'Akquise, Finanzierungsmanager, Projekte, Partner und Leads',
  services: 'Kommunikation, Fortbildung, Fahrzeuge, Analyse und Photovoltaik',
};

export default function AreaOverviewPage() {
  const { areaKey } = useParams<{ areaKey: string }>();
  
  // Validate area key
  const validAreaKey = areaKey as AreaKey;
  const area = areaConfig.find(a => a.key === validAreaKey);
  
  // Note: Area state sync now handled by deriveAreaFromPath in usePortalLayout
  
  // Build module data
  const moduleData = useMemo(() => {
    if (!area) return [];
    
    return area.modules.map(code => {
      const content = moduleContents[code];
      const moduleConfig = zone2Portal.modules?.[code];
      const defaultRoute = moduleConfig ? `/portal/${moduleConfig.base}` : '/portal';
      
      return {
        code,
        content,
        defaultRoute,
      };
    }).filter(m => m.content); // Only include modules with content
  }, [area]);
  
  // Get promo content
  const promo = validAreaKey ? areaPromoContent[validAreaKey] : null;
  
  // Invalid area → redirect to portal
  if (!area) {
    return <Navigate to="/portal" replace />;
  }

  const isMobile = useIsMobile();

  return (
    <div className={isMobile ? "px-4 py-4" : "container max-w-7xl mx-auto px-4 py-6"}>
      {/* Header */}
      <div className={isMobile ? "mb-4" : "mb-8"}>
        <h1 className={isMobile 
          ? "text-lg font-bold tracking-tight uppercase mb-1" 
          : "text-2xl font-bold tracking-tight uppercase mb-2"
        }>
          {area.label}
        </h1>
        <p className="text-base text-muted-foreground">
          {areaDescriptions[area.key]}
        </p>
      </div>

      {/* Grid: fixed-height cards, uniform 3-col layout */}
      <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Promo Card (always first) */}
        {promo && <AreaPromoCard promo={promo} />}
        
        {/* Module Cards */}
        {moduleData.map(({ code, content, defaultRoute }) => (
          <AreaModuleCard
            key={code}
            moduleCode={code}
            content={content}
            defaultRoute={defaultRoute}
          />
        ))}
      </div>
    </div>
  );
}
