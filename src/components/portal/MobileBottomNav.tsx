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
  };

  return (
    <nav 
      className="fixed left-4 right-4 z-50 nav-ios-floating rounded-2xl"
      style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-around h-16">
        {/* Home button */}
        <button
          onClick={handleHomeClick}
          className={cn(
            'flex flex-col items-center justify-center h-full px-3 gap-1 transition-all',
            'text-muted-foreground hover:text-foreground active:scale-95'
          )}
        >
          <div className="relative">
            <CircleDot className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-medium">Home</span>
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
                'flex flex-col items-center justify-center h-full px-3 gap-1 transition-all active:scale-95',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-[10px] font-medium">{area.labelShort}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
