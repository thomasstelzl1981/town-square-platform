/**
 * AREA TABS — Level 1 Navigation
 * 
 * Horizontal tabs: Base | Missions | Operations | Services
 * Clicking navigates to /portal/area/:areaKey and updates state
 */

import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { areaConfig, AreaKey } from '@/manifests/areaConfig';
import { Database, Rocket, Wrench, LayoutGrid } from 'lucide-react';

const areaIcons: Record<AreaKey, React.ElementType> = {
  base: Database,
  missions: Rocket,
  operations: Wrench,
  services: LayoutGrid,
};

export function AreaTabs() {
  const navigate = useNavigate();
  const { activeArea, setActiveArea } = usePortalLayout();

  const handleAreaClick = (areaKey: AreaKey) => {
    setActiveArea(areaKey);
    navigate(`/portal/area/${areaKey}`);
  };

  return (
    <div className="flex items-center justify-center gap-1 px-4 py-1">
      {areaConfig.map((area) => {
        const Icon = areaIcons[area.key];
        const isActive = activeArea === area.key;
        
        return (
          <button
            key={area.key}
            onClick={() => handleAreaClick(area.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium uppercase tracking-wide',
              isActive
                ? 'bg-primary/90 backdrop-blur-md text-primary-foreground shadow-lg'
                : 'nav-tab-glass text-muted-foreground hover:text-foreground'
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
