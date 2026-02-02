import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgContext, getOrgTypeBadgeColor, getOrgTypeLabel } from '@/hooks/useOrgContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, Building2, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// P0-ID-CTX-INTERNAL-DEFAULT: Context Badge + Org-Switcher
// Admin Portal defaults to internal org context for Platform Admins
// ============================================================================

export function AdminLayout() {
  const navigate = useNavigate();
  const { user, isLoading, memberships, isDevelopmentMode } = useAuth();
  const { 
    activeOrgName, 
    activeOrgType, 
    availableOrgs, 
    canSwitch, 
    switchOrg, 
    isLoading: orgSwitching 
  } = useOrgContext();

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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center justify-between px-4 bg-background">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="mr-2" />
              <h1 className="text-lg font-semibold">Admin Portal</h1>
              {/* P0-ID-CTX-INTERNAL-DEFAULT: Context Badge (always visible) */}
              <Badge 
                variant="secondary"
                className={cn('text-xs font-medium hidden md:inline-flex', getOrgTypeBadgeColor(activeOrgType))}
              >
                {getOrgTypeLabel(activeOrgType)} / {activeOrgName}
              </Badge>
            </div>
            
            {/* Org-Switcher Dropdown */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    disabled={orgSwitching}
                  >
                    <Building2 className="h-4 w-4" />
                    <span className="hidden sm:inline max-w-40 truncate">
                      {activeOrgName}
                    </span>
                    <Badge 
                      variant="secondary" 
                      className={cn('hidden md:inline-flex text-xs px-1.5 py-0', getOrgTypeBadgeColor(activeOrgType))}
                    >
                      {getOrgTypeLabel(activeOrgType)}
                    </Badge>
                    {canSwitch && <ChevronDown className="h-3 w-3" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Organisation wechseln</span>
                    <Badge 
                      variant="outline" 
                      className={cn('text-xs', getOrgTypeBadgeColor(activeOrgType))}
                    >
                      {getOrgTypeLabel(activeOrgType)}
                    </Badge>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableOrgs.map(org => (
                    <DropdownMenuItem
                      key={org.id}
                      onClick={() => !org.isActive && switchOrg(org.id)}
                      className={cn(
                        'flex items-center justify-between cursor-pointer',
                        org.isActive && 'bg-accent'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span className="truncate max-w-36">{org.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={cn('text-xs px-1', getOrgTypeBadgeColor(org.type))}
                        >
                          {getOrgTypeLabel(org.type)}
                        </Badge>
                        {org.isActive && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
