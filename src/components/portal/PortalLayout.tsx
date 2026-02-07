import { useState, useRef, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SystemBar } from './SystemBar';
import { TopNavigation } from './TopNavigation';
import { ArmstrongContainer } from './ArmstrongContainer';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileCardView } from './MobileCardView';
import { ArmstrongPod } from './ArmstrongPod';
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
  const location = useLocation();
  const { isMobile, mobileNavView } = usePortalLayout();
  
  const [armstrongSheetOpen, setArmstrongSheetOpen] = useState(false);
  
  // P0-FIX: Track if we've ever finished initial loading
  const hasInitializedRef = useRef(false);
  
  useEffect(() => {
    if (!isLoading) {
      hasInitializedRef.current = true;
    }
  }, [isLoading]);

  // Check if we're on a module/tile route (not just /portal)
  const isOnModulePage = location.pathname !== '/portal' && location.pathname.startsWith('/portal/');

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

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* System Bar */}
        <SystemBar />
        
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto pb-32 relative">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {/* Show card navigation when on /portal root, otherwise show module content */}
          {!isOnModulePage && mobileNavView !== 'tiles' ? (
            <MobileCardView />
          ) : (
            <Outlet />
          )}
        </main>
        
        {/* Armstrong Pod - Above bottom nav */}
        <ArmstrongPod onOpenSheet={() => setArmstrongSheetOpen(true)} />
        
        {/* Bottom Navigation */}
        <MobileBottomNav />
        
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* System Bar */}
      <SystemBar />
      
      {/* Top Navigation (3 levels) */}
      <TopNavigation />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
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
