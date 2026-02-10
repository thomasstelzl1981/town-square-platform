/**
 * AdminSidebar — Zone-1 Navigation
 * SSOT: Reads from routesManifest.ts
 */
import { useLocation } from 'react-router-dom';
import { 
  Building2, Users, Link2, LifeBuoy, LayoutDashboard, LogOut, ChevronDown,
  Contact, Grid3X3, Plug, Mail, Eye, FileText, CreditCard, FileCheck,
  Inbox, Settings2, Landmark, Briefcase, ShoppingBag, Target, Bot,
  UserCog, ClipboardCheck, Users2, Sparkles, BookOpen, Scale, FlaskConical, Shield,
  Megaphone, Share2
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { zone1Admin } from '@/manifests/routesManifest';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Icon mapping for routes
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'Dashboard': LayoutDashboard,
  'Organizations': Building2,
  'OrganizationDetail': Building2,
  'Users': Users,
  'Delegations': Link2,
  // Masterdata
  'MasterTemplatesImmobilienakte': Building2,
  'MasterTemplatesSelbstauskunft': FileText,
  // KI Office
  'AdminKiOfficeDashboard': Sparkles,
  'AdminKiOfficeEmail': Mail,
  'AdminKiOfficeSequenzen': Target,
  'AdminKiOfficeTemplates': FileText,
  'AdminKiOfficeKontakte': Contact,
  'AdminKiOfficeRecherche': Users,
  'TileCatalog': Grid3X3,
  'Integrations': Plug,
  'Oversight': Eye,
  'AuditLog': FileText,
  'AuditHub': FileText,
  'Agreements': FileCheck,
  'Inbox': Inbox,
  'LeadPool': Target,
  'PartnerVerification': ClipboardCheck,
  'CommissionApproval': CreditCard,
  'Support': LifeBuoy,
  // FutureRoom
  'FutureRoom': Landmark,
  'FutureRoomBanks': Landmark,
  'FutureRoomManagers': UserCog,
  // Agents
  'AgentsDashboard': Bot,
  'AgentsCatalog': Bot,
  'AgentsInstances': Bot,
  'AgentsRuns': Bot,
  'AgentsPolicies': Bot,
  // Acquiary
  'AcquiaryDashboard': Briefcase,
  'AcquiaryZuordnung': Briefcase,
  'AcquiaryInbox': Inbox,
  'AcquiaryMandate': FileCheck,
  // Sales Desk
  'SalesDeskDashboard': ShoppingBag,
  'SalesDeskPublishing': ShoppingBag,
  'SalesDeskInbox': Inbox,
  'SalesDeskPartner': Users2,
  'SalesDeskAudit': FileText,
  // Finance Desk
  'FinanceDeskDashboard': Landmark,
  'FinanceDeskInbox': Inbox,
  'FinanceDeskBerater': UserCog,
  'FinanceDeskZuweisung': Link2,
  'FinanceDeskMonitoring': Eye,
  // Armstrong Zone 1
  'ArmstrongDashboard': Sparkles,
  'ArmstrongActions': FileText,
  'ArmstrongLogs': FileText,
  'ArmstrongBilling': CreditCard,
  'ArmstrongKnowledge': BookOpen,
  'ArmstrongPolicies': Scale,
  'ArmstrongTestHarness': FlaskConical,
  // Feature Activation
  'RolesManagement': Shield,
  // Social Media
  'SocialMediaDashboard': Megaphone,
  'SocialMediaKampagnen': Share2,
  'SocialMediaCreator': Sparkles,
  'SocialMediaVertrieb': Briefcase,
  'SocialMediaVertriebDetail': Briefcase,
  'SocialMediaLeads': Target,
  'SocialMediaTemplates': FileText,
  'SocialMediaAbrechnung': CreditCard,
};

// Group configuration for grouping routes
interface GroupConfig {
  label: string;
  priority: number;
}

const GROUP_CONFIG: Record<string, GroupConfig> = {
  'foundation': { label: 'Tenants & Access', priority: 1 },
  'masterdata': { label: 'Masterdata', priority: 2 },
  'ki-office': { label: 'KI Office', priority: 3 },
  'social-media': { label: 'Social Media', priority: 4 },
  'armstrong': { label: 'Armstrong Zone 1', priority: 5 },
  'activation': { label: 'Feature Activation', priority: 6 },
  'backbone': { label: 'Backbone', priority: 7 },
  'desks': { label: 'Operative Desks', priority: 8 },
  'agents': { label: 'AI Agents', priority: 9 },
  'system': { label: 'System', priority: 10 },
  'platformAdmin': { label: 'Platform Admin', priority: 11 },
};

// Route to group mapping via prefix
function getGroupKey(path: string, component: string): string {
  if (path === '' || path === 'organizations' || path === 'users' || path === 'delegations') {
    return 'foundation';
  }
  // Masterdata
  if (path.startsWith('masterdata/')) {
    return 'masterdata';
  }
  // KI Office (all sub-pages)
  if (path === 'ki-office' || path === 'ki-office-email' || path === 'ki-office-kontakte' || 
      path === 'ki-office-sequenzen' || path === 'ki-office-templates' || path === 'ki-office-recherche' ||
      path === 'communication') {
    return 'ki-office';
  }
  // Armstrong Zone 1
  if (path.startsWith('armstrong')) {
    return 'armstrong';
  }
  // Social Media
  if (path.startsWith('social-media')) {
    return 'social-media';
  }
  // Feature Activation (inkl. Partner-Verifizierung und Rollen)
  if (path === 'tiles' || path === 'partner-verification' || path === 'roles') {
    return 'activation';
  }
  // FutureRoom gehört zu Operative Desks
  if (path.startsWith('futureroom')) {
    return 'desks';
  }
  // Backbone
  if (path === 'agreements' || path === 'inbox') {
    return 'backbone';
  }
  // Operative Desks (Desks + LeadPool + Provisionen)
  if (path.startsWith('sales-desk') || path.startsWith('finance-desk') || 
      path.startsWith('acquiary') || path === 'leadpool' || path === 'commissions') {
    return 'desks';
  }
  if (path.startsWith('agents')) {
    return 'agents';
  }
  // System (bereinigt - nur Read-only Monitoring)
  if (path === 'integrations' || path === 'oversight' || path === 'audit') {
    return 'system';
  }
  if (path === 'support') {
    return 'platformAdmin';
  }
  return 'system';
}

// Filter routes for nav (exclude dynamic routes and sub-routes unless they're top-level desk entries)
function shouldShowInNav(path: string): boolean {
  // Skip dynamic routes
  if (path.includes(':')) return false;
  // Show main desk entries
  if (path === 'sales-desk' || path === 'finance-desk' || path === 'acquiary' || 
      path === 'agents' || path === 'futureroom') {
    return true;
  }
  // KI Office items show all
  if (path === 'ki-office' || path === 'ki-office-email' || path === 'ki-office-kontakte' ||
      path === 'ki-office-sequenzen' || path === 'ki-office-templates' || path === 'ki-office-recherche') {
    return true;
  }
  // Armstrong Zone 1 - show all 7 menu items
  if (path === 'armstrong' || 
      path === 'armstrong/actions' || 
      path === 'armstrong/logs' || 
      path === 'armstrong/knowledge' ||
      path === 'armstrong/billing' ||
      path === 'armstrong/policies' ||
      path === 'armstrong/test') {
    return true;
  }
  // Skip sub-routes of desks (they will be accessible from their parent page)
  if (path.includes('/') && (
    path.startsWith('sales-desk/') ||
    path.startsWith('finance-desk/') ||
    path.startsWith('acquiary/') ||
    path.startsWith('agents/')
  )) {
    return false;
  }
  // Social Media - show dashboard + all sub-items
  if (path === 'social-media' || 
      path === 'social-media/kampagnen' || path === 'social-media/creator' ||
      path === 'social-media/vertrieb' || path === 'social-media/leads' ||
      path === 'social-media/templates' || path === 'social-media/abrechnung') {
    return true;
  }
  // Social Media detail routes - hide
  if (path.startsWith('social-media/vertrieb/')) {
    return false;
  }
  // FutureRoom sub-items are accessed via internal tabs, NOT sidebar
  if (path.startsWith('futureroom/')) {
    return false;
  }
  // Masterdata sub-items should be shown (they're standalone pages)
  if (path.startsWith('masterdata/')) {
    return true;
  }
  return true;
}

export function AdminSidebar() {
  const location = useLocation();
  const { profile, memberships, activeOrganization, isPlatformAdmin, signOut, switchTenant } = useAuth();

  // Build grouped menu items from manifest
  const groupedItems = new Map<string, Array<{ title: string; url: string; icon: React.ComponentType<{ className?: string }> }>>();
  
  for (const route of zone1Admin.routes || []) {
    if (!shouldShowInNav(route.path)) continue;
    
    const groupKey = getGroupKey(route.path, route.component);
    const Icon = ICON_MAP[route.component] || LayoutDashboard;
    const url = route.path === '' ? '/admin' : `/admin/${route.path}`;
    
    if (!groupedItems.has(groupKey)) {
      groupedItems.set(groupKey, []);
    }
    
    groupedItems.get(groupKey)!.push({
      title: route.title,
      url,
      icon: Icon,
    });
  }

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

  // Sort groups by priority
  const sortedGroups = Array.from(groupedItems.entries())
    .map(([key, items]) => ({ key, items, config: GROUP_CONFIG[key] || { label: key, priority: 99 } }))
    .sort((a, b) => a.config.priority - b.config.priority);

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
        {sortedGroups.map(({ key, items, config }) => {
          // Platform Admin section only visible to platform admins
          if (key === 'platformAdmin' && !isPlatformAdmin) return null;
          
          return (
            <SidebarGroup key={key}>
              <SidebarGroupLabel>{config.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.url}>
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
          );
        })}
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
