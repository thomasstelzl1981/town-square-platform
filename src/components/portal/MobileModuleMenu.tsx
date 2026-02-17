/**
 * MobileModuleMenu — Vertical tile list as intermediate page on mobile
 * 
 * Replaces horizontal SubTabs with a full-page vertical menu.
 * Each row navigates to the specific tile route.
 */

import { useNavigate } from 'react-router-dom';
import { ModuleDefinition, getTileFullPath } from '@/manifests/routesManifest';
import { moduleLabelOverrides } from '@/manifests/areaConfig';
import { isTileHiddenOnMobile } from '@/config/mobileConfig';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileModuleMenuProps {
  module: ModuleDefinition;
  moduleBase: string;
  moduleCode: string;
}

export function MobileModuleMenu({ module, moduleBase, moduleCode }: MobileModuleMenuProps) {
  const navigate = useNavigate();
  
  const displayName = moduleLabelOverrides[moduleCode] || module.name;
  
  const visibleTiles = (module.tiles || []).filter(
    tile => !isTileHiddenOnMobile(moduleBase, tile.path)
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4">
      {/* Module Title */}
      <h1 className="text-lg font-semibold text-foreground tracking-wide uppercase mb-4 px-1">
        {displayName}
      </h1>

      {/* Vertical Tile List */}
      <div className="flex flex-col gap-1.5">
        {visibleTiles.map((tile) => {
          const route = getTileFullPath(moduleBase, tile.path);
          
          return (
            <button
              key={tile.path}
              onClick={() => navigate(route)}
              className={cn(
                'flex items-center justify-between w-full px-4 py-3.5 rounded-xl',
                'bg-card/60 backdrop-blur-sm border border-border/30',
                'text-left text-foreground font-medium text-sm',
                'active:scale-[0.98] transition-all',
                'hover:bg-card/80',
                tile.premium && 'border-warning/30'
              )}
            >
              <span>{tile.title}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
