/**
 * MOBILE BOTTOM NAV — Fixed bottom navigation for mobile
 * 
 * 5 buttons: Home | Base | Missions | Operations | Services
 * Tap sets active area context (does NOT navigate directly)
 */

import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { areaConfig, AreaKey } from '@/manifests/areaConfig';
import { Home, Layers, Target, Settings, Grid } from 'lucide-react';

const areaIcons: Record<AreaKey | 'home', React.ElementType> = {
  home: Home,
  base: Layers,
  missions: Target,
  operations: Settings,
  services: Grid,
};

export function MobileBottomNav() {
  const navigate = useNavigate();
  const { activeArea, setActiveArea, setMobileNavView, setSelectedMobileModule } = usePortalLayout();

  const handleHomeClick = () => {
    navigate('/portal');
    setActiveArea(null);
    setMobileNavView('areas');
    setSelectedMobileModule(null);
  };

  const handleAreaClick = (areaKey: AreaKey) => {
    setActiveArea(areaKey);
    setMobileNavView('modules');
    setSelectedMobileModule(null);
  };

  return (
    <nav 
      className="fixed left-0 right-0 z-50 bg-card border-t"
      style={{ bottom: 'calc(3rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-around h-14">
        {/* Home button */}
        <button
          onClick={handleHomeClick}
          className={cn(
            'flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors',
            'text-muted-foreground hover:text-foreground'
          )}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px]">Home</span>
        </button>

        {/* Area buttons */}
        {areaConfig.map((area) => {
          const Icon = areaIcons[area.key];
          const isActive = activeArea === area.key;
          
          return (
            <button
              key={area.key}
              onClick={() => handleAreaClick(area.key)}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{area.labelShort}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
