import { useLocation } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Link2, 
  LifeBuoy, 
  LayoutDashboard, 
  LogOut, 
  ChevronDown,
  Contact,
  Grid3X3,
  Plug,
  Mail,
  Eye,
  FileText,
  CreditCard,
  FileCheck,
  Inbox,
  Settings2,
  Landmark
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Core Foundation
const foundationItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Organizations', url: '/admin/organizations', icon: Building2 },
  { title: 'Users & Memberships', url: '/admin/users', icon: Users },
  { title: 'Delegations', url: '/admin/delegations', icon: Link2 },
];

// Master Data
const masterDataItems = [
  { title: 'Master Contacts', url: '/admin/contacts', icon: Contact },
  { title: 'Master-Vorlagen', url: '/admin/master-templates', icon: Settings2 },
];

// Backbone
const backboneItems = [
  { title: 'Billing & Plans', url: '/admin/billing', icon: CreditCard },
  { title: 'Agreements', url: '/admin/agreements', icon: FileCheck },
  { title: 'Post & Documents', url: '/admin/inbox', icon: Inbox },
  { title: 'Future Room', url: '/admin/futureroom', icon: Landmark },
];

// System
const systemItems = [
  { title: 'Integrations', url: '/admin/integrations', icon: Plug },
  { title: 'Communication Hub', url: '/admin/communication', icon: Mail },
  { title: 'Oversight', url: '/admin/oversight', icon: Eye },
  { title: 'Audit Log', url: '/admin/audit', icon: FileText },
];

// Platform Admin Only
const platformAdminItems = [
  { title: 'Support Mode', url: '/admin/support', icon: LifeBuoy },
];

export function AdminSidebar() {
  const location = useLocation();
  const { profile, memberships, activeOrganization, isPlatformAdmin, signOut, switchTenant } = useAuth();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'platform_admin': return 'default';
      case 'org_admin': return 'secondary';
      default: return 'outline';
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">System of a Town</span>
            <span className="text-xs text-muted-foreground">Admin Portal</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Foundation */}
        <SidebarGroup>
          <SidebarGroupLabel>Tenants & Access</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {foundationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/admin'}
                      className="flex items-center gap-2 hover:bg-muted/50" 
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Master Data */}
        <SidebarGroup>
          <SidebarGroupLabel>Master Data</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {masterDataItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-2 hover:bg-muted/50" 
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Feature Activation */}
        <SidebarGroup>
          <SidebarGroupLabel>Feature Activation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/admin/tiles"
                    className="flex items-center gap-2 hover:bg-muted/50" 
                    activeClassName="bg-muted text-primary font-medium"
                  >
                    <Grid3X3 className="h-4 w-4" />
                    <span>Tile Catalog</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Backbone */}
        <SidebarGroup>
          <SidebarGroupLabel>Backbone</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {backboneItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-2 hover:bg-muted/50" 
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System */}
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-2 hover:bg-muted/50" 
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Platform Admin */}
        {isPlatformAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Platform Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {platformAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className="flex items-center gap-2 hover:bg-muted/50" 
                        activeClassName="bg-muted text-primary font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        {memberships.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between mb-2">
                <span className="truncate text-xs">
                  {activeOrganization?.name || 'Select Tenant'}
                </span>
                <ChevronDown className="h-3 w-3 ml-2 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Switch Tenant</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {memberships.map((membership) => (
                <DropdownMenuItem
                  key={membership.id}
                  onClick={() => switchTenant(membership.tenant_id)}
                >
                  <span className="truncate">{membership.tenant_id}</span>
                  <Badge variant={getRoleBadgeVariant(membership.role)} className="ml-auto text-xs">
                    {formatRole(membership.role)}
                  </Badge>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{profile?.display_name || profile?.email}</span>
            <div className="flex items-center gap-1">
              {isPlatformAdmin && (
                <Badge variant="default" className="text-xs">Platform Admin</Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign Out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
