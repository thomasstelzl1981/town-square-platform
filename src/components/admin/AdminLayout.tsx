import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { Loader2 } from 'lucide-react';

export function AdminLayout() {
  const navigate = useNavigate();
  const { user, isLoading, memberships, isDevelopmentMode } = useAuth();

  useEffect(() => {
    if (!isLoading && !user && !isDevelopmentMode) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate, isDevelopmentMode]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user && !isDevelopmentMode) {
    return null;
  }

  // Check if user has any admin role
  const hasAdminAccess = memberships.some(m => 
    ['platform_admin', 'org_admin', 'internal_ops'].includes(m.role)
  );

  if (!hasAdminAccess && memberships.length > 0 && !isDevelopmentMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to access the admin portal.</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center px-4 bg-background">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-lg font-semibold">Admin Portal</h1>
          </header>
          <div className="flex-1 overflow-auto p-6 bg-muted/30">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
