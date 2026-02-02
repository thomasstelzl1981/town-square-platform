import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// P0-ID-CTX-INTERNAL-DEFAULT: Context Badge shows active org_type + org_name
// ============================================================================

function getOrgTypeBadgeVariant(orgType: string | null | undefined): string {
  switch (orgType) {
    case 'internal':
    case 'platform':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'client':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'partner':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function AdminLayout() {
  const navigate = useNavigate();
  const { user, isLoading, memberships, activeOrganization, isDevelopmentMode } = useAuth();

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

  if (!hasAdminAccess && memberships.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to access the admin portal.</p>
        </div>
      </div>
    );
  }

  const orgType = activeOrganization?.org_type || 'unknown';
  const orgName = activeOrganization?.name || 'Kein Kontext';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center justify-between px-4 bg-background">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="mr-2" />
              <h1 className="text-lg font-semibold">Admin Portal</h1>
            </div>
            {/* P0-ID-CTX-INTERNAL-DEFAULT: Context Badge */}
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Badge 
                variant="secondary"
                className={cn('text-xs font-medium', getOrgTypeBadgeVariant(orgType))}
              >
                {orgType} / {orgName}
              </Badge>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-6 bg-muted/30">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
