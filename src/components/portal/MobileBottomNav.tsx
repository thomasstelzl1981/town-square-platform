/**
 * MOBILE BOTTOM NAV — iOS-style floating tab bar
 * 
 * 5 buttons: Home | Base | Missions | Operations | Services
 * Tap sets active area context (does NOT navigate directly)
 * 
 * Design: Floating pill with glass effect, large touch targets
 */

import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { areaConfig, AreaKey } from '@/manifests/areaConfig';
import { CircleDot, Database, Rocket, Wrench, LayoutGrid } from 'lucide-react';

// iOS-style monochrome icons
const areaIcons: Record<AreaKey | 'home', React.ElementType> = {
  home: CircleDot,
  base: Database,
  missions: Rocket,
  operations: Wrench,
  services: LayoutGrid,
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
    navigate(`/portal/area/${areaKey}`);
  };

  // Check if home is active (no area selected)
  const isHomeActive = activeArea === null;

  return (
    <nav 
      className="fixed left-4 right-4 z-50"
      style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-around h-20 px-2">
        {/* Home button - Glass circle */}
        <button
          onClick={handleHomeClick}
          className={cn(
            'relative flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all active:scale-95',
            isHomeActive
              ? 'bg-primary/90 text-primary-foreground shadow-lg'
              : 'nav-tab-glass text-muted-foreground hover:text-foreground'
          )}
        >
          <CircleDot className="h-6 w-6" />
          <span className="text-[9px] font-medium mt-0.5">Home</span>
        </button>

        {/* Area buttons - Glass circles */}
        {areaConfig.map((area) => {
          const Icon = areaIcons[area.key];
          const isActive = activeArea === area.key;
          
          return (
            <button
              key={area.key}
              onClick={() => handleAreaClick(area.key)}
              className={cn(
                'relative flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all active:scale-95',
                isActive
                  ? 'bg-primary/90 text-primary-foreground shadow-lg'
                  : 'nav-tab-glass text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[9px] font-medium mt-0.5">{area.labelShort}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
