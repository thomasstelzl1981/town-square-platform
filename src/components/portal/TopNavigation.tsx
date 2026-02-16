/**
 * TOP NAVIGATION — 3-Level Navigation for Zone 2
 * 
 * Level 1: Area Tabs (Base | Missions | Operations | Services)
 * Level 2: Module Tabs (5 modules per area)
 * Level 3: Sub Tabs (4-6 tiles per module)
 */

import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { useAuth } from '@/contexts/AuthContext';
import { areaConfig, getModuleDisplayLabel } from '@/manifests/areaConfig';
import { getModulesSorted, ModuleDefinition } from '@/manifests/routesManifest';
import { AreaTabs } from './AreaTabs';
import { SubTabs } from './SubTabs';
import { Users, Sparkles, FolderOpen, Building2, FileText, Tag, Landmark, Search, Handshake, Target, Home, Briefcase, FolderKanban, Mail, GraduationCap, Wrench, Car, LineChart, Sun, LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  'Users': Users, 'Sparkles': Sparkles, 'FolderOpen': FolderOpen, 'Building2': Building2,
  'FileText': FileText, 'Tag': Tag, 'Landmark': Landmark, 'Search': Search,
  'Handshake': Handshake, 'Target': Target, 'Home': Home, 'Briefcase': Briefcase,
  'FolderKanban': FolderKanban, 'Mail': Mail, 'GraduationCap': GraduationCap,
  'Wrench': Wrench, 'Car': Car, 'LineChart': LineChart, 'Sun': Sun,
};

interface ModuleWithMeta {
  code: string;
  module: ModuleDefinition;
  displayLabel: string;
}

export function TopNavigation() {
  const location = useLocation();
  const { activeArea, isMobile } = usePortalLayout();
  const { isDevelopmentMode } = useAuth();
  const [showModuleSwitcher, setShowModuleSwitcher] = useState(false);
  const hideTimeout = useRef<ReturnType<typeof setTimeout>>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [portalPosition, setPortalPosition] = useState({ top: 0, left: 0 });

  const showSwitcher = useCallback(() => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
    setShowModuleSwitcher(true);
  }, []);

  const hideSwitcher = useCallback(() => {
    hideTimeout.current = setTimeout(() => {
      setShowModuleSwitcher(false);
    }, 400);
  }, []);

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

  // Recalculate portal position when switcher becomes visible
  useEffect(() => {
    if (showModuleSwitcher && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPortalPosition({
        top: rect.bottom,
        left: rect.left + rect.width / 2,
      });
    }
  }, [showModuleSwitcher]);

  // Hide on mobile - mobile uses card navigation
  if (isMobile) {
    return null;
  }

  return (
    <nav className="border-b bg-card/60 backdrop-blur-md">
      {/* Level 1: Area Tabs */}
      <div className="border-b">
        <AreaTabs />
      </div>
      
      {/* Level 2: Sub Tabs + Floating Module Switcher on hover */}
      {activeModule && !location.pathname.startsWith('/portal/area/') && (
        <div
          ref={triggerRef}
          className="relative"
          onMouseEnter={showSwitcher}
          onMouseLeave={hideSwitcher}
        >
          <SubTabs module={activeModule.module} moduleBase={activeModule.module.base} />
        </div>
      )}

      {/* Floating Module Switcher — rendered as Portal to escape overflow-hidden */}
      {areaModules.length > 0 && createPortal(
        <div
          className={cn(
            "fixed z-50 pt-3 transition-all duration-200 -translate-x-1/2",
            showModuleSwitcher
              ? "opacity-100 pointer-events-auto translate-y-0"
              : "opacity-0 pointer-events-none -translate-y-1"
          )}
          style={{ top: portalPosition.top, left: portalPosition.left }}
          onMouseEnter={showSwitcher}
          onMouseLeave={hideSwitcher}
        >
          <div className="flex items-center gap-1 px-4 py-2
                          bg-card/80 backdrop-blur-xl shadow-lg rounded-2xl border border-border/30">
            {areaModules.map(({ code, module, displayLabel }) => {
              const Icon = iconMap[module.icon] || Briefcase;
              const isActive = activeModule?.code === code;
              const requiresActivation = module.visibility.requires_activation && !isDevelopmentMode;

              return (
                <NavLink
                  key={code}
                  to={`/portal/${module.base}`}
                  onClick={() => {
                    if (hideTimeout.current) {
                      clearTimeout(hideTimeout.current);
                      hideTimeout.current = null;
                    }
                    setShowModuleSwitcher(false);
                  }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                    isActive
                      ? 'bg-accent/80 text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/10',
                    requiresActivation && 'opacity-50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{displayLabel}</span>
                </NavLink>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </nav>
  );
}
