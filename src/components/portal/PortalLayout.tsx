import { useState, useRef, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PortalHeader } from './PortalHeader';
import { PortalNav } from './PortalNav';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { MobileDrawer } from './MobileDrawer';
import { ArmstrongSheet } from './ArmstrongSheet';
import { PortalLayoutProvider, usePortalLayout } from '@/hooks/usePortalLayout';
import { Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Zone 2: User Portal Layout (P0-Stabilized)
 * 
 * P0-FIX: Loading state no longer unmounts the entire UI.
 * Instead, we show an overlay on the content area only.
 * Navigation remains visible and interactive during brief loading states.
 * 
 * Desktop:
 * - Left sidebar: collapsible (256px / 56px), persisted via localStorage
 * - Right Armstrong: default HIDDEN, togglable, persisted via localStorage
 * 
 * Mobile:
 * - Hamburger opens drawer with all 11 modules
 * - Armstrong as FAB -> Bottom-Sheet
 * - No bottom-nav
 */

function PortalLayoutInner() {
  const { user, isLoading, activeOrganization, isDevelopmentMode } = useAuth();
  const location = useLocation();
  const { sidebarCollapsed, armstrongVisible, isMobile, toggleArmstrong } = usePortalLayout();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [armstrongSheetOpen, setArmstrongSheetOpen] = useState(false);
  
  // P0-FIX: Track if we've ever finished initial loading
  const hasInitializedRef = useRef(false);
  
  useEffect(() => {
    if (!isLoading) {
      hasInitializedRef.current = true;
    }
  }, [isLoading]);

  // Derive context from current route
  const getContext = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    return {
      zone: 'Portal',
      module: segments[1] ? segments[1].charAt(0).toUpperCase() + segments[1].slice(1) : 'Dashboard',
      entity: segments[2] || undefined,
    };
  };

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

  // P0-FIX: In development mode, always render the layout (even during brief loading)
  // This prevents the entire UI from unmounting during navigation

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader 
        onMenuClick={() => setDrawerOpen(true)}
      />
      
      <div className="flex">
        {/* Desktop Sidebar - hidden on mobile */}
        {!isMobile && (
          <PortalNav 
            variant="sidebar" 
            collapsed={sidebarCollapsed}
          />
        )}
        
        {/* Main Content */}
        <main 
          className={cn(
            'flex-1 min-w-0 overflow-x-hidden relative',
            // Add right margin for Armstrong when visible on desktop
            !isMobile && armstrongVisible && 'lg:mr-80'
          )}
        >
          {/* P0-FIX: Content overlay during loading (instead of unmounting) */}
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          <Outlet />
        </main>

        {/* Armstrong AI Chat Panel - Desktop only, hidden by default */}
        {!isMobile && armstrongVisible && (
          <div className="hidden lg:block fixed right-0 top-14 bottom-0 w-80 border-l bg-card shadow-card z-40">
            <ChatPanel 
              context={getContext()}
              position="docked"
              onClose={toggleArmstrong}
            />
          </div>
        )}
        
        {/* Armstrong Toggle Handle - Desktop only, always visible */}
        {!isMobile && !armstrongVisible && (
          <Button
            onClick={toggleArmstrong}
            variant="outline"
            size="icon"
            className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 h-12 w-8 rounded-l-lg rounded-r-none border-r-0 z-40 shadow-md"
            title="Armstrong öffnen"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Mobile Drawer */}
      <MobileDrawer 
        open={drawerOpen} 
        onOpenChange={setDrawerOpen} 
      />

      {/* Armstrong FAB - Mobile only */}
      {isMobile && (
        <Button
          onClick={() => setArmstrongSheetOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
          style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Armstrong Bottom Sheet - Mobile only */}
      <ArmstrongSheet 
        open={armstrongSheetOpen} 
        onOpenChange={setArmstrongSheetOpen} 
      />
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
