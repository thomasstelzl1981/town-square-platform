import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSwipeBack } from '@/hooks/useSwipeBack';
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
import { DesktopInstallBanner } from '@/components/shared/DesktopInstallBanner';
import { MobileBottomBar } from './MobileBottomBar';
import { MobileHomeChatView } from './MobileHomeChatView';
import { MobileHomeModuleList } from './MobileHomeModuleList';
import { MobileModuleMenu } from './MobileModuleMenu';
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
 * Mobile (Immo-Wallet):
 * - SystemBar: Simplified top bar
 * - Home: Full-screen Armstrong Chat with area buttons above input
 * - Modules: Content + compact MobileModuleBar at bottom
 */

function PortalLayoutInner() {
  const { user, isLoading, activeOrganization, isDevelopmentMode } = useAuth();
  const { isMobile } = usePortalLayout();
  const location = useLocation();
  // Armstrong sheet state removed — mobile uses full-screen chat now
  const [mobileHomeMode, setMobileHomeMode] = useState<'modules' | 'chat'>('modules'); // kept for chat activation
  const swipeRef = useRef<HTMLDivElement>(null);
  useSwipeBack(swipeRef);
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

  // On mobile: detect if we're on a module's BASE route (no specific tile)
  // e.g. /portal/finanzanalyse but NOT /portal/finanzanalyse/investment
  const isModuleBaseRoute = useMemo(() => {
    if (!activeModule) return false;
    const baseRoute = `/portal/${activeModule.module.base}`;
    // Exact match or with trailing slash only
    return location.pathname === baseRoute || location.pathname === baseRoute + '/';
  }, [activeModule, location.pathname]);

  // P0-SESSION-FIX: Debounced redirect — only navigate to /auth after a grace period
  // to avoid redirecting during transient null states (e.g. token refresh).
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  useEffect(() => {
    if (!user && !isDevelopmentMode && !isLoading && hasInitializedRef.current) {
      const timer = setTimeout(() => setShouldRedirect(true), 2000);
      return () => clearTimeout(timer);
    }
    setShouldRedirect(false);
  }, [user, isDevelopmentMode, isLoading]);

  // P0-FIX: Only show fullscreen loader on INITIAL load, never after
  if (isLoading && !hasInitializedRef.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (shouldRedirect && !user && !isDevelopmentMode) {
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

  // Detect if we're on the dashboard (root /portal) for scroll-snap
  const isDashboard = location.pathname === '/portal' || location.pathname === '/portal/';

  // Mobile Layout - Identisch zu Desktop: Outlet für konsistentes Routing
  if (isMobile) {
    return (
      <div ref={swipeRef} className="h-screen bg-atmosphere flex flex-col overflow-hidden overflow-x-hidden">
        {/* System Bar */}
        <SystemBar />
        
      {isDashboard ? (
          mobileHomeMode === 'chat' ? (
            /* CHAT MODE: Full-screen Armstrong Chat with back button */
            <MobileHomeChatView onBackToModules={() => setMobileHomeMode('modules')} />
          ) : (
            /* MODULE LIST: Scrollable module entries */
            <MobileHomeModuleList />
          )
        ) : isModuleBaseRoute && activeModule ? (
          /* MODULE BASE: Show vertical tile menu */
          <MobileModuleMenu 
            module={activeModule.module} 
            moduleBase={activeModule.module.base}
            moduleCode={activeModule.code}
          />
        ) : (
          /* TILE VIEW or other: Content area without SubTabs */
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
            <Outlet />
          </main>
        )}
        
        {/* Unified bottom bar — always visible on mobile */}
        <MobileBottomBar
          onChatActivated={() => setMobileHomeMode('chat')}
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
      
      {/* Desktop PWA Install Banner */}
      <DesktopInstallBanner />
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
