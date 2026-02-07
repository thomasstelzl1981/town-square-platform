/**
 * AREA TABS — Level 1 Navigation
 * 
 * Horizontal tabs: Base | Missions | Operations | Services
 * Switching areas does NOT navigate — only changes visible module tabs
 */

import { cn } from '@/lib/utils';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { areaConfig, AreaKey } from '@/manifests/areaConfig';
import { Layers, Target, Settings, Grid } from 'lucide-react';

const areaIcons: Record<AreaKey, React.ElementType> = {
  base: Layers,
  missions: Target,
  operations: Settings,
  services: Grid,
};

export function AreaTabs() {
  const { activeArea, setActiveArea } = usePortalLayout();

  return (
    <div className="flex items-center gap-1 px-4 py-2">
      {areaConfig.map((area) => {
        const Icon = areaIcons[area.key];
        const isActive = activeArea === area.key;
        
        return (
          <button
            key={area.key}
            onClick={() => setActiveArea(area.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{area.label}</span>
            <span className="sm:hidden">{area.labelShort}</span>
          </button>
        );
      })}
    </div>
  );
}
