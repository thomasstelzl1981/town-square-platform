import { useState, useRef, useEffect, useMemo } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';

// Preload core modules for instant navigation
const preloadModules = () => {
  Promise.all([
    import('@/pages/portal/StammdatenPage'),
    import('@/pages/portal/ImmobilienPage'),
    import('@/pages/portal/FinanzierungPage'),
    import('@/pages/portal/OfficePage'),
    import('@/pages/portal/DMSPage'),
  ]);
};
import { useAuth } from '@/contexts/AuthContext';
import { SystemBar } from './SystemBar';
import { TopNavigation } from './TopNavigation';
import { ArmstrongContainer } from './ArmstrongContainer';
import { MobileBottomNav } from './MobileBottomNav';
import { ArmstrongInputBar } from './ArmstrongInputBar';
import { ArmstrongSheet } from './ArmstrongSheet';
import { SubTabs } from './SubTabs';
import { PortalLayoutProvider, usePortalLayout } from '@/hooks/usePortalLayout';
import { getModulesSorted } from '@/manifests/routesManifest';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Zone 2: User Portal Layout
 * 
 * Desktop:
 * - SystemBar: Fixed top bar (Home, Logo, Clock, Armstrong, User)
 * - TopNavigation: 3-level navigation (Area > Module > Tile)
 * - ArmstrongContainer: Collapsed bottom-right or expanded right stripe
 * 
 * Mobile:
 * - SystemBar: Simplified top bar
 * - MobileBottomNav: Fixed bottom with area switcher
 * - ArmstrongInputBar: Persistent entry above bottom nav
 * - ArmstrongSheet: Bottom sheet for chat
 */

function PortalLayoutInner() {
  const { user, isLoading, activeOrganization, isDevelopmentMode } = useAuth();
  const { isMobile } = usePortalLayout();
  const location = useLocation();
  
  const [armstrongSheetOpen, setArmstrongSheetOpen] = useState(false);
  
  // P0-FIX: Track if we've ever finished initial loading
  const hasInitializedRef = useRef(false);
  
  useEffect(() => {
    if (!isLoading) {
      hasInitializedRef.current = true;
    }
  }, [isLoading]);

  // Preload modules after initial render for instant navigation
  useEffect(() => {
    const timer = setTimeout(preloadModules, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Detect active module for mobile SubTabs (same logic as TopNavigation)
  const activeModule = useMemo(() => {
    const allModules = getModulesSorted();
    return allModules.find(({ module }) => {
      const route = `/portal/${module.base}`;
      return location.pathname === route || location.pathname.startsWith(route + '/');
    });
  }, [location.pathname]);

  // P0-FIX: Only show fullscreen loader on INITIAL load, never after
  if (isLoading && !hasInitializedRef.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user && !isDevelopmentMode) {
    return <Navigate to="/auth" replace />;
  }

  if (!activeOrganization && !isDevelopmentMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <p className="text-muted-foreground">Keine Organisation zugewiesen.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Bitte kontaktiere deinen Administrator.
          </p>
        </div>
      </div>
    );
  }

  // Mobile Layout - Identisch zu Desktop: Outlet für konsistentes Routing
  if (isMobile) {
    return (
      <div className="h-screen bg-atmosphere flex flex-col overflow-hidden">
        {/* System Bar */}
        <SystemBar />
        
        {/* Content Area - Always use Outlet for consistent routing (Dashboard or Module) */}
        <main className="flex-1 overflow-y-auto pb-28 relative">
          
          {/* Mobile SubTabs: Tile-Navigation when inside a module */}
          {activeModule && !location.pathname.startsWith('/portal/area/') && (
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
              <SubTabs module={activeModule.module} moduleBase={activeModule.module.base} />
            </div>
          )}
          
          <Outlet />
        </main>
        
        {/* Bottom Navigation - Above Armstrong bar */}
        <MobileBottomNav />
        
        {/* Armstrong Input Bar - At very bottom */}
        <ArmstrongInputBar onOpenSheet={() => setArmstrongSheetOpen(true)} />
        
        {/* Armstrong Sheet */}
        <ArmstrongSheet 
          open={armstrongSheetOpen} 
          onOpenChange={setArmstrongSheetOpen} 
        />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="h-screen bg-atmosphere flex flex-col overflow-hidden">
      {/* System Bar */}
      <SystemBar />
      
      {/* Top Navigation (3 levels) */}
      <TopNavigation />
      
      {/* Main Content + Armstrong Stripe */}
      <div className="flex-1 flex overflow-hidden">
        <main className={cn(
          "flex-1 overflow-y-auto relative transition-all duration-300",
        )}>
          <Outlet />
        </main>
        
        {/* Armstrong Stripe - inline layout element when expanded */}
        <ArmstrongContainer />
      </div>
    </div>
  );
}

export function PortalLayout() {
  return (
    <PortalLayoutProvider>
      <PortalLayoutInner />
    </PortalLayoutProvider>
  );
}
