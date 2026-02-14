/**
 * MobileModuleBar — Compact bottom bar for module views (non-home)
 * 
 * Combines 4 area icons + home button + Armstrong trigger in one bar.
 * Much more compact than the old MobileBottomNav + ArmstrongInputBar combo.
 */

import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { areaConfig, type AreaKey } from '@/manifests/areaConfig';
import { 
  CircleDot, 
  Database, 
  Rocket, 
  Wrench, 
  LayoutGrid,
  MessageCircle
} from 'lucide-react';

const areaIcons: Record<AreaKey | 'home', React.ElementType> = {
  home: CircleDot,
  base: Database,
  missions: Rocket,
  operations: Wrench,
  services: LayoutGrid,
};

export function MobileModuleBar() {
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

  const isHomeActive = activeArea === null;

  return (
    <nav 
      className="sticky bottom-0 z-40 w-full bg-background/80 backdrop-blur-lg border-t border-border/30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-14 px-1">
        {/* Home */}
        <button
          onClick={handleHomeClick}
          className={cn(
            'flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all active:scale-95',
            isHomeActive
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-[9px] font-medium mt-0.5">Chat</span>
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
                'flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all active:scale-95',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-medium mt-0.5">{area.labelShort}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
