import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PortalHeader } from './PortalHeader';
import { PortalNav } from './PortalNav';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { Loader2, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Zone 2: User Portal Layout
 * 
 * Mobile-first layout with:
 * - Sticky header with tenant switcher
 * - Bottom navigation on mobile
 * - Sidebar navigation on desktop (lg+)
 * - Armstrong AI Chatbot (floating + panel)
 * - Safe area handling for iOS
 */
export function PortalLayout() {
  const { user, isLoading, activeOrganization } = useAuth();
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!activeOrganization) {
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

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader />
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <PortalNav variant="sidebar" />
        
        {/* Main Content - with right margin for persistent chat on desktop */}
        <main className="flex-1 pb-20 lg:pb-0 lg:mr-[380px]">
          <Outlet />
        </main>

        {/* Armstrong AI Chat Panel - Always visible on desktop */}
        <div className="hidden lg:block fixed right-0 top-[var(--header-height)] bottom-0 w-[380px] border-l bg-card shadow-card z-40">
          <ChatPanel 
            context={getContext()}
            position="docked"
            onClose={() => setChatOpen(false)}
            quickActions={[
              { label: 'Hilfe', action: 'help' },
              { label: 'Dokument analysieren', action: 'analyze' },
            ]}
          />
        </div>
      </div>
      
      {/* Mobile Bottom Nav */}
      <PortalNav variant="bottom" />

      {/* Armstrong Floating Button - Mobile only */}
      {!chatOpen && (
        <Button
          onClick={() => setChatOpen(true)}
          className="lg:hidden fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Mobile Chat Drawer */}
      {chatOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed bottom-0 left-0 right-0 h-[80vh] bg-card rounded-t-xl shadow-xl animate-in slide-in-from-bottom">
            <ChatPanel 
              context={getContext()}
              position="bottomsheet"
              onClose={() => setChatOpen(false)}
              quickActions={[
                { label: 'Hilfe', action: 'help' },
                { label: 'Dokument analysieren', action: 'analyze' },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
