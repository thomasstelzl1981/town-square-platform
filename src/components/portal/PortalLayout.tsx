import { useState, useRef, useEffect, useMemo } from 'react';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';

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
import { Loader2, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useLegalConsent } from '@/hooks/useLegalConsent';
import { ConsentRequiredModal } from './ConsentRequiredModal';
import { useDemoAutoLogin } from '@/hooks/useDemoAutoLogin';
import { useLennoxInitialSeed } from '@/hooks/useLennoxInitialSeed';

const LENNOX_TENANT_ID = 'eac1778a-23bc-4d03-b3f9-b26be27c9505';

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
  const { user, isLoading, activeOrganization, isDevelopmentMode, activeTenantId } = useAuth();
  const { isMobile } = usePortalLayout();
  const { isDemo, demoState, endDemo } = useDemoAutoLogin();
  const { showConsentModal, setShowConsentModal } = useLegalConsent();
  const { runSeed: runLennoxSeed } = useLennoxInitialSeed();
  const location = useLocation();
  
  // Armstrong sheet state removed — mobile uses full-screen chat now
  const [mobileHomeMode, setMobileHomeMode] = useState<'modules' | 'chat'>('modules'); // kept for chat activation
  const swipeRef = useRef<HTMLDivElement>(null);
  useSwipeBack(swipeRef);

  // P0-FIX: Track if we've ever finished initial loading
  const hasInitializedRef = useRef(false);
  const lennoxSeedRef = useRef(false);
  
  useEffect(() => {
    if (!isLoading) {
      hasInitializedRef.current = true;
    }
  }, [isLoading]);

  // Lennox Partner Seed: run once when Lennox tenant logs in
  useEffect(() => {
    if (activeTenantId === LENNOX_TENANT_ID && user && !lennoxSeedRef.current) {
      lennoxSeedRef.current = true;
      runLennoxSeed();
    }
  }, [activeTenantId, user, runLennoxSeed]);

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
    // Don't redirect during demo auto-login
    if (isDemo) {
      setShouldRedirect(false);
      return;
    }
    if (!user && !isDevelopmentMode && !isLoading && hasInitializedRef.current) {
      const timer = setTimeout(() => setShouldRedirect(true), 2000);
      return () => clearTimeout(timer);
    }
    setShouldRedirect(false);
  }, [user, isDevelopmentMode, isLoading, isDemo]);

  // Demo mode: show loading screen during login/seeding
  if (isDemo && demoState === 'logging-in') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {demoState === 'logging-in' ? 'Demo wird vorbereitet…' : 'Beispieldaten werden geladen…'}
        </p>
      </div>
    );
  }

  // Demo error
  if (isDemo && demoState === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-sm text-destructive">Demo konnte nicht gestartet werden.</p>
        <Link to="/sot" className="text-sm text-primary underline">Zurück zur Startseite</Link>
      </div>
    );
  }

  // P0-FIX: Only show fullscreen loader on INITIAL load, never after
  if (isLoading && !hasInitializedRef.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // P1-FIX: Redirect to /auth IMMEDIATELY when no user and not loading (no 2s delay needed
  // for the "no org" case — only the shouldRedirect path needs debounce for token refresh)
  if (shouldRedirect && !user && !isDevelopmentMode && !isDemo) {
    return <Navigate to="/auth" replace />;
  }

  // Show "no org" only for authenticated users whose org hasn't loaded yet
  if (!activeOrganization && !isDevelopmentMode) {
    if (user) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    // No user AND no org AND not redirecting yet = waiting for debounce timer
    // Show loader instead of "Keine Organisation" to avoid confusing flash
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Demo banner component
  const DemoBanner = isDemo && demoState === 'ready' ? (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between text-sm">
      <span className="text-primary font-medium">
        🎯 Demo-Modus — Erkunden Sie die Plattform mit Beispieldaten
      </span>
      <div className="flex items-center gap-3">
        <Link 
          to="/auth?mode=register&source=sot" 
          className="text-primary underline hover:no-underline"
        >
          Eigenen Account erstellen
        </Link>
        <button
          onClick={endDemo}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Demo beenden
        </button>
      </div>
    </div>
  ) : null;


  // Detect if we're on the dashboard (root /portal) for scroll-snap
  const isDashboard = location.pathname === '/portal' || location.pathname === '/portal/';

  // Mobile Layout - Identisch zu Desktop: Outlet für konsistentes Routing
  if (isMobile) {
    return (
      <div ref={swipeRef} className="h-screen bg-atmosphere flex flex-col overflow-hidden overflow-x-hidden">
        {/* System Bar */}
        <SystemBar />
        {DemoBanner}
        
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
            <ErrorBoundary moduleName="Inhalt">
              <Outlet />
            </ErrorBoundary>
          </main>
        )}
        
        {/* Unified bottom bar — always visible on mobile */}
        <MobileBottomBar
          onChatActivated={() => setMobileHomeMode('chat')}
        />
        {/* Global Consent Modal (mobile) */}
        <ConsentRequiredModal open={showConsentModal} onOpenChange={setShowConsentModal} />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="h-screen bg-atmosphere flex flex-col overflow-hidden">
      {/* System Bar */}
      <SystemBar />
      
      {/* Demo Banner */}
      {DemoBanner}
      
      
      {/* Top Navigation (3 levels) */}
      <TopNavigation />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto relative">
          <ErrorBoundary moduleName="Inhalt">
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      
      {/* Armstrong Floating Overlay - outside flex layout */}
      <ArmstrongContainer />
      
      {/* Desktop PWA Install Banner */}
      <DesktopInstallBanner />
      
      {/* Global Consent Modal */}
      <ConsentRequiredModal open={showConsentModal} onOpenChange={setShowConsentModal} />
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
