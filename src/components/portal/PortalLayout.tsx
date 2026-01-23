import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PortalHeader } from './PortalHeader';
import { PortalNav } from './PortalNav';
import { Loader2 } from 'lucide-react';

/**
 * Zone 2: User Portal Layout
 * 
 * Mobile-first layout with:
 * - Sticky header with tenant switcher
 * - Bottom navigation on mobile
 * - Sidebar navigation on desktop (lg+)
 * - Safe area handling for iOS
 */
export function PortalLayout() {
  const { user, isLoading, activeOrganization } = useAuth();

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
        
        {/* Main Content */}
        <main className="flex-1 pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>
      
      {/* Mobile Bottom Nav */}
      <PortalNav variant="bottom" />
    </div>
  );
}
