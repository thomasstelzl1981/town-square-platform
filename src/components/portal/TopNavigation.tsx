/**
 * TOP NAVIGATION — 3-Level Navigation for Zone 2
 * 
 * Level 1: Area Tabs (Base | Missions | Operations | Services)
 * Level 2: Module Tabs (5 modules per area)
 * Level 3: Sub Tabs (4-6 tiles per module)
 */

import { useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { useAuth } from '@/contexts/AuthContext';
import { areaConfig, AreaKey, getModuleDisplayLabel } from '@/manifests/areaConfig';
import { getModulesSorted, getTileFullPath, ModuleDefinition } from '@/manifests/routesManifest';
import { AreaTabs } from './AreaTabs';
import { ModuleTabs } from './ModuleTabs';
import { SubTabs } from './SubTabs';

interface ModuleWithMeta {
  code: string;
  module: ModuleDefinition;
  displayLabel: string;
}

export function TopNavigation() {
  const location = useLocation();
  const { activeArea, isMobile } = usePortalLayout();

  // Build module data from manifest
  const allModules = useMemo(() => {
    return getModulesSorted().map(({ code, module }) => ({
      code,
      module,
      displayLabel: getModuleDisplayLabel(code, module.name),
    }));
  }, []);

  // Get modules for active area
  const areaModules = useMemo(() => {
    const areaConfig_ = areaConfig.find(a => a.key === activeArea);
    if (!areaConfig_) return [];
    return areaConfig_.modules
      .map(code => allModules.find(m => m.code === code))
      .filter((m): m is ModuleWithMeta => m !== undefined);
  }, [activeArea, allModules]);

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
    <nav className="border-b bg-card/50">
      {/* Level 1: Area Tabs */}
      <div className="border-b">
        <AreaTabs />
      </div>
      
      {/* Level 2: Module Tabs */}
      <div className="border-b">
        <ModuleTabs modules={areaModules} activeModule={activeModule} />
      </div>
      
      {/* Level 3: Sub Tabs (only when a module is active) */}
      {activeModule && (
        <SubTabs module={activeModule.module} moduleBase={activeModule.module.base} />
      )}
    </nav>
  );
}
