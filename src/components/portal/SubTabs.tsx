/**
 * SUB TABS — Level 3 Navigation
 * 
 * Shows 4-6 tiles from the active module
 * Click navigates to tile route
 */

import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ModuleDefinition, getTileFullPath } from '@/manifests/routesManifest';

interface SubTabsProps {
  module: ModuleDefinition;
  moduleBase: string;
}

export function SubTabs({ module, moduleBase }: SubTabsProps) {
  const location = useLocation();

  // URL-driven visibility: show only when on a module page (not Area-Overview)
  const isOnModulePage = location.pathname.startsWith(`/portal/${moduleBase}`);
  
  // Hide if not on module page OR no tiles exist
  if (!isOnModulePage || !module.tiles || module.tiles.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-1 px-4 py-1 overflow-x-auto scrollbar-none bg-background/50">
      {module.tiles.map((tile) => {
        const route = getTileFullPath(moduleBase, tile.path);
        const isActive = location.pathname === route;
        
        return (
          <NavLink
            key={tile.path}
            to={route}
            className={cn(
              'px-3 py-1.5 rounded-xl text-sm uppercase tracking-wide whitespace-nowrap',
              isActive
                ? 'bg-primary/90 backdrop-blur-md text-primary-foreground font-medium shadow-sm'
                : 'nav-tab-glass text-muted-foreground hover:text-foreground',
              tile.premium && 'border border-warning/30'
            )}
          >
            {tile.title}
            {tile.premium && (
              <span className="ml-1 text-xs text-warning">★</span>
            )}
          </NavLink>
        );
      })}
    </div>
  );
}
