/**
 * TOP NAVIGATION — 2-Level Navigation for Zone 2
 * 
 * Level 1: Area Tabs (Base | Missions | Operations | Services)
 * Level 2: Sub Tabs (4-6 tiles per module)
 */

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { getModuleDisplayLabel } from '@/manifests/areaConfig';
import { getModulesSorted, ModuleDefinition } from '@/manifests/routesManifest';
import { AreaTabs } from './AreaTabs';
import { SubTabs } from './SubTabs';

interface ModuleWithMeta {
  code: string;
  module: ModuleDefinition;
  displayLabel: string;
}

export function TopNavigation() {
  const location = useLocation();
  const { isMobile } = usePortalLayout();

  // Build module data from manifest
  const allModules = useMemo(() => {
    return getModulesSorted().map(({ code, module }) => ({
      code,
      module,
      displayLabel: getModuleDisplayLabel(code, module.name),
    }));
  }, []);

  // Find active module from current path
  const activeModule = useMemo(() => {
    return allModules.find(m => {
      const route = `/portal/${m.module.base}`;
      return location.pathname === route || location.pathname.startsWith(route + '/');
    });
  }, [allModules, location.pathname]);

  // Hide on mobile - mobile uses card navigation
  if (isMobile) {
    return null;
  }

  return (
    <nav className="border-b bg-[hsl(var(--chrome-bg)/0.98)] shadow-[0_2px_8px_-4px_rgb(0_0_0/0.08)] dark:bg-card/60 dark:backdrop-blur-md dark:shadow-none">
      {/* Level 1: Area Tabs */}
      <div className="border-b">
        <AreaTabs />
      </div>
      
      {/* Level 2: Sub Tabs */}
      {activeModule && !location.pathname.startsWith('/portal/area/') && (
        <div className="relative">
          <SubTabs module={activeModule.module} moduleBase={activeModule.module.base} />
        </div>
      )}
    </nav>
  );
}
