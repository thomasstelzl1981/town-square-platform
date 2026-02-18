/**
 * AREA OVERVIEW PAGE
 * 
 * Dynamic page that displays promo + module cards for a given area.
 * Reads from moduleContents.ts (SSOT for How It Works).
 * 
 * Route: /portal/area/:areaKey
 */

import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { areaConfig, AreaKey, moduleLabelOverrides } from '@/manifests/areaConfig';
import { useIsMobile } from '@/hooks/use-mobile';
import { zone2Portal } from '@/manifests/routesManifest';
import { moduleContents } from '@/components/portal/HowItWorks/moduleContents';
import { AreaModuleCard } from '@/components/portal/AreaModuleCard';
import { filterModulesForMobile } from '@/config/mobileConfig';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Area descriptions for header
const areaDescriptions: Record<AreaKey, string> = {
  base: 'Stammdaten und KI Office',
  missions: 'Immobilien, Mietverwaltung, Verkauf, Finanzierung und Investment',
  operations: 'Projektmanager, Vertriebspartner, Finanzierung, Akquise, Leads und Kommunikation',
  services: 'Fortbildung, Haustiere, Shops, Fahrzeuge und Photovoltaik',
};

export default function AreaOverviewPage() {
  const { areaKey } = useParams<{ areaKey: string }>();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Validate area key
  const validAreaKey = areaKey as AreaKey;
  const area = areaConfig.find(a => a.key === validAreaKey);
  
  // Build module data — filter hidden modules on mobile
  const moduleData = useMemo(() => {
    if (!area) return [];
    
    const visibleModules = isMobile 
      ? filterModulesForMobile(area.modules) 
      : area.modules;
    
    return visibleModules.map(code => {
      const content = moduleContents[code];
      const moduleConfig = zone2Portal.modules?.[code];
      const defaultRoute = code === 'ARMSTRONG' 
        ? '/portal/armstrong' 
        : moduleConfig ? `/portal/${moduleConfig.base}` : '/portal';
      const displayName = code === 'ARMSTRONG'
        ? 'Armstrong — KI-Co-Pilot'
        : moduleLabelOverrides[code] || moduleConfig?.name || code;
      
      return {
        code,
        content,
        defaultRoute,
        displayName,
      };
    }).filter(m => m.content);
  }, [area, isMobile]);
  
  // Invalid area → redirect to portal
  if (!area) {
    return <Navigate to="/portal" replace />;
  }

  // ── MOBILE: Compact full-width list (skip large cards) ──
  if (isMobile) {
    return (
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
        {/* Area Title */}
        <h1 className="text-lg font-semibold text-foreground tracking-wide uppercase mb-1 px-1">
          {area.label}
        </h1>
        <p className="text-sm text-muted-foreground mb-4 px-1">
          {areaDescriptions[area.key]}
        </p>

        {/* Module List */}
        <div className="flex flex-col gap-2">
          {moduleData.map(({ code, defaultRoute, displayName }) => (
            <button
              key={code}
              onClick={() => navigate(defaultRoute)}
              className={cn(
                'flex items-center justify-between w-full px-5 py-4 rounded-xl',
                'bg-card/60 backdrop-blur-sm border border-border/30',
                'text-left text-foreground font-medium text-base',
                'active:scale-[0.98] transition-all',
                'hover:bg-card/80'
              )}
            >
              <span>{displayName}</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── DESKTOP: Grid cards ──
  return (
    <div className="container max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight uppercase mb-2">
          {area.label}
        </h1>
        <p className="text-base text-muted-foreground">
          {areaDescriptions[area.key]}
        </p>
      </div>

      {/* Grid: fixed-height cards, uniform 3-col layout */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
