import { useState, useRef, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';

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
import { PortalLayoutProvider, usePortalLayout } from '@/hooks/usePortalLayout';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Zone 2: User Portal Layout (Refactored)
 * 
 * Desktop:
 * - SystemBar: Fixed top system bar with Home, Logo, Clock, Armstrong toggle, User
 * - TopNavigation: 3-level navigation (Area > Module > Tile)
 * - ArmstrongContainer: Collapsed bottom-right or expanded right stripe
 * - No left sidebar (removed)
 * 
 * Mobile:
 * - SystemBar: Simplified top bar
 * - MobileCardView: Card-based area/module navigation
 * - MobileBottomNav: Fixed bottom with area switcher
 * - ArmstrongPod: Persistent entry above bottom nav
 * - ArmstrongSheet: Bottom sheet for chat
 */

function PortalLayoutInner() {
  const { user, isLoading, activeOrganization, isDevelopmentMode } = useAuth();
  const { isMobile } = usePortalLayout();
  
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
          
          {/* Mobile: Same as Desktop - Outlet renders PortalDashboard or Module content */}
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
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <Outlet />
      </main>

      {/* Armstrong Container - Desktop only */}
      <ArmstrongContainer />
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
