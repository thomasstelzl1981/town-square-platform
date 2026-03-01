/**
 * AdminSidebar — Zone-1 Navigation
 * SSOT: Reads from routesManifest.ts
 */
import { useLocation } from 'react-router-dom';
import { 
  Building2, Users, Link2, LifeBuoy, LayoutDashboard, LogOut, ChevronDown,
  Contact, Grid3X3, Plug, Mail, Eye, FileText, CreditCard, FileCheck,
  Inbox, Settings2, Landmark, Briefcase, ShoppingBag, Target, Bot,
  UserCog, ClipboardCheck, Users2, Sparkles, BookOpen, Scale, FlaskConical, Shield, Globe, PawPrint
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
  // KI Office — Consolidated
  'AdminRecherche': Users,
  'AdminKontaktbuch': Contact,
  'AdminEmailAgent': Mail,
  'TileCatalog': Grid3X3,
  'Integrations': Plug,
  'Oversight': Eye,
  'AuditHub': FileText,
  'Agreements': FileCheck,
  'PartnerVerification': ClipboardCheck,
  'ManagerFreischaltung': UserCog,
  'Support': LifeBuoy,
  // FutureRoom
  'FutureRoom': Landmark,
  'FutureRoomBanks': Landmark,
  'FutureRoomManagers': UserCog,
  // Agents — ENTFERNT
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
  // Masterdata Hub
  'MasterTemplates': FileText,
  // Fortbildung
  'AdminFortbildung': BookOpen,
  // New Desks
  'LeadDeskDashboard': Target,
  'ProjektDeskDashboard': Building2,
  'PetmanagerDashboard': PawPrint,
  'PetmanagerProvider': Users2,
  'PetmanagerFinanzen': CreditCard,
  'PetmanagerServices': ClipboardCheck,
  'PetmanagerMonitor': Eye,
  // Compliance Desk
  'ComplianceDeskRouter': Scale,
  // Ncore, Otto², CommPro Desks
  'NcoreDeskRouter': Globe,
  'OttoDeskRouter': Landmark,
  'CommProDeskRouter': Bot,
};

// Group configuration for grouping routes
interface GroupConfig {
  label: string;
  priority: number;
}

const GROUP_CONFIG: Record<string, GroupConfig> = {
  'foundation': { label: 'Mandanten & Zugriff', priority: 1 },
  'masterdata': { label: 'Stammdaten-Vorlagen', priority: 2 },
  'ki-office': { label: 'KI Office', priority: 3 },
  'armstrong': { label: 'Armstrong', priority: 4 },
  'activation': { label: 'Modul-Verwaltung', priority: 5 },
  'backbone': { label: 'Infrastruktur', priority: 6 },
  'desks': { label: 'Operative Desks', priority: 7 },
  'compliance': { label: 'Compliance', priority: 8 },
  'system': { label: 'System', priority: 9 },
  'platformAdmin': { label: 'Plattform-Admin', priority: 10 },
};

// Route to group mapping via prefix
function getGroupKey(path: string, component: string): string {
  if (path === '' || path === 'organizations' || path === 'delegations') {
    return 'foundation';
  }
  // Masterdata — nur Hub zeigen, Sub-Seiten via Hub erreichbar
  if (path === 'masterdata') {
    return 'masterdata';
  }
  if (path.startsWith('masterdata/')) {
    return 'masterdata'; // grouped but filtered out in shouldShowInNav
  }
  // KI Office (all sub-pages)
  if (path === 'ki-office/recherche' || path === 'ki-office/kontakte' || path === 'ki-office/email') {
    return 'ki-office';
  }
  // Armstrong Zone 1 — nur Dashboard zeigen
  if (path === 'armstrong') {
    return 'armstrong';
  }
  if (path.startsWith('armstrong/')) {
    return 'armstrong'; // grouped but filtered out in shouldShowInNav
  }
  // Feature Activation (inkl. Partner-Verifizierung und Rollen)
  if (path === 'tiles' || path === 'partner-verification' || path === 'roles' || path === 'manager-freischaltung') {
    return 'activation';
  }
  // FutureRoom gehört zu Operative Desks
  if (path.startsWith('futureroom')) {
    return 'desks';
  }
  // Backbone
  if (path === 'agreements') {
    return 'backbone';
  }
  // Operative Desks (Desks + LeadPool + Provisionen + Landing Pages)
  if (path.startsWith('sales-desk') || path.startsWith('finance-desk') || 
       path.startsWith('acquiary') || path.startsWith('lead-desk') || path.startsWith('projekt-desk') ||
       path.startsWith('pet-desk') || path.startsWith('service-desk') ||
       path.startsWith('ncore-desk') || path.startsWith('otto-desk') || path.startsWith('commpro-desk')) {
    return 'desks';
  }
  // Compliance Desk
  if (path === 'compliance') {
    return 'compliance';
  }
  // System (bereinigt - nur Read-only Monitoring)
  if (path === 'integrations' || path === 'oversight' || path === 'audit') {
    return 'system';
  }
  // Fortbildung → desks (via Service Desk erreichbar, aber Route bleibt für Kompatibilität)
  if (path === 'fortbildung') {
    return 'desks';
  }
  if (path === 'support') {
    return 'platformAdmin';
  }
  return 'system';
}

// Filter routes for nav (exclude dynamic routes and sub-routes unless they're top-level desk entries)
function shouldShowInNav(path: string): boolean {
  // Skip dynamic routes and removed pages
  if (path.includes(':')) return false;
  if (path === 'users') return false; // Users moved into OrganizationDetail
  // Show main desk entries
  if (path === 'sales-desk' || path === 'finance-desk' || path === 'acquiary' || 
      path === 'futureroom' || path === 'lead-desk' || 
      path === 'projekt-desk' || path === 'pet-desk' || path === 'service-desk' ||
      path === 'ncore-desk' || path === 'otto-desk' || path === 'commpro-desk') {
    return true;
  }
  // KI Office items — consolidated 3
  if (path === 'ki-office/recherche' || path === 'ki-office/kontakte' || path === 'ki-office/email') {
    return true;
  }
  // Armstrong Zone 1 — Dashboard + Credit-Monitoring in Sidebar
  if (path === 'armstrong') {
    return true;
  }
  if (path === 'armstrong/billing' || path === 'armstrong/costs') {
    return true; // Credit-Monitoring in Sidebar sichtbar
  }
  if (path.startsWith('armstrong/')) {
    return false; // Andere Sub-Seiten via Armstrong Dashboard erreichbar
  }
  // Skip sub-routes of desks (they will be accessible from their parent page)
  if (path.includes('/') && (
    path.startsWith('sales-desk/') ||
    path.startsWith('finance-desk/') ||
    path.startsWith('acquiary/') ||
    path.startsWith('lead-desk/') ||
    path.startsWith('projekt-desk/') ||
    path.startsWith('pet-desk/') ||
    path.startsWith('service-desk/') ||
    path.startsWith('ncore-desk/') || path.startsWith('otto-desk/') || path.startsWith('commpro-desk/')
  )) {
    return false;
  }
  // FutureRoom sub-items are accessed via internal tabs, NOT sidebar
  if (path.startsWith('futureroom/')) {
    return false;
  }
  // Masterdata — nur Hub zeigen, Sub-Seiten via Hub erreichbar
  if (path === 'masterdata') {
    return true;
  }
  if (path.startsWith('masterdata/')) {
    return false;
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
                  {activeOrganization?.name || 'Mandant wählen'}
                </span>
                <ChevronDown className="h-3 w-3 ml-2 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Mandant wechseln</DropdownMenuLabel>
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
