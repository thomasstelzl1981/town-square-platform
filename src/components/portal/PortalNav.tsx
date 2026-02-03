/**
 * PORTAL NAV — Manifest-Driven Navigation
 * 
 * Desktop Sidebar:
 * - Expanded: 256px (w-64)
 * - Collapsed: 56px (w-14) with icons only
 * - Parent click: navigates to How-it-works (/portal/{base})
 * - Chevron click: toggles submenu (no navigation)
 */

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Home,
  Building2,
  Users,
  Briefcase,
  FileText,
  Sparkles,
  Target,
  Search,
  Handshake,
  Tag,
  Landmark,
  FolderOpen,
  ChevronDown,
  FolderKanban,
  Mail,
  GraduationCap,
  Wrench,
  Car,
  LineChart,
  Sun,
  LucideIcon
} from 'lucide-react';

// Import manifest
import { getModulesSorted, getTileFullPath } from '@/manifests/routesManifest';

// Icon mapping for modules — all icons correctly mapped
const iconMap: Record<string, LucideIcon> = {
  'Users': Users,
  'Sparkles': Sparkles,
  'FolderOpen': FolderOpen,
  'Building2': Building2,
  'FileText': FileText,
  'Tag': Tag,
  'Landmark': Landmark,
  'Search': Search,
  'Handshake': Handshake,
  'Target': Target,
  'Home': Home,
  'Briefcase': Briefcase,
  'FolderKanban': FolderKanban,
  'Mail': Mail,
  'GraduationCap': GraduationCap,
  'Wrench': Wrench,
  'Car': Car,
  'LineChart': LineChart,
  'Sun': Sun,
};

interface SubTileDisplay {
  title: string;
  route: string;
}

interface TileDisplay {
  code: string;
  title: string;
  route: string;
  icon: LucideIcon;
  display_order: number;
  sub_tiles: SubTileDisplay[];
  requires_role?: string[];
}

interface PortalNavProps {
  variant?: 'bottom' | 'sidebar';
  collapsed?: boolean;
}

// Fetch activation flags from DB (visibility overlay only)
async function fetchActiveTileCodes(tenantId: string): Promise<string[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabase as any;
    const { data } = await client
      .from('tenant_tile_activation')
      .select('tile_code')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);
    
    if (!data) return [];
    return (data as { tile_code: string }[]).map(a => a.tile_code);
  } catch {
    return [];
  }
}

// Fetch user roles from memberships
async function fetchUserRoles(userId: string): Promise<string[]> {
  try {
    const { data } = await supabase
      .from('memberships')
      .select('role')
      .eq('user_id', userId);
    
    if (!data) return [];
    return data.map(m => m.role);
  } catch {
    return [];
  }
}

// Get modules with visibility.default from manifest (for fallback)
function getDefaultVisibleModuleCodes(): string[] {
  const modules = getModulesSorted();
  return modules
    .filter(({ module }) => module.visibility.default === true)
    .map(({ code }) => code);
}

// Build tiles from manifest (including requires_role and visibility)
function buildTilesFromManifest(): (TileDisplay & { visibilityDefault: boolean })[] {
  const modules = getModulesSorted();
  
  return modules.map(({ code, module }) => {
    const Icon = iconMap[module.icon] || Briefcase;
    const mainRoute = `/portal/${module.base}`;
    
    // Build sub-tiles from manifest tiles
    // P0-FIX: Filter tiles that are default landing pages (marked with default: true)
    // These are accessed via the parent route, not as sub-tiles
    const subTiles: SubTileDisplay[] = module.tiles
      .filter(tile => !tile.default) // Skip default tiles (landing pages)
      .map(tile => ({
        title: tile.title,
        route: getTileFullPath(module.base, tile.path),
      }));
    
    return {
      code,
      title: module.name,
      route: mainRoute,
      icon: Icon,
      display_order: module.display_order,
      sub_tiles: subTiles,
      requires_role: module.visibility.requires_role,
      visibilityDefault: module.visibility.default,
    };
  });
}

export function PortalNav({ variant = 'sidebar', collapsed = false }: PortalNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeOrganization, isDevelopmentMode, user } = useAuth();
  const [activeTileCodes, setActiveTileCodes] = useState<string[] | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Get tiles from manifest (SSOT)
  const manifestTiles = buildTilesFromManifest();

  // Fetch user roles for role-gating
  useEffect(() => {
    async function loadUserRoles() {
      if (user?.id) {
        const roles = await fetchUserRoles(user.id);
        setUserRoles(roles);
      }
    }
    loadUserRoles();
  }, [user?.id]);

  // Fetch activation overlay from DB
  useEffect(() => {
    async function loadActivations() {
      try {
        // In development mode, show all tiles
        if (isDevelopmentMode) {
          setActiveTileCodes(null); // null = show all
          setIsLoading(false);
          return;
        }
        
        // Fetch tenant activations if we have a valid org
        if (activeOrganization?.id && !activeOrganization.id.startsWith('dev-')) {
          const codes = await fetchActiveTileCodes(activeOrganization.id);
          setActiveTileCodes(codes.length > 0 ? codes : null);
        } else {
          setActiveTileCodes(null);
        }
      } catch (err) {
        console.error('Failed to fetch tile activations:', err);
        setActiveTileCodes(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadActivations();
  }, [activeOrganization?.id, isDevelopmentMode]);

  // Filter tiles by activation overlay AND role-gating
  // P0-STABILIZATION: Respect visibility.default from manifest
  const visibleTiles = manifestTiles.filter(tile => {
    // ALWAYS show tiles with visibility.default = true (manifest SSOT)
    // Only apply activation overlay for tiles that require_activation
    if (tile.visibilityDefault) {
      // Default-visible tiles are always shown (manifest says so)
      // Skip activation check for these
    } else {
      // Check activation overlay (tenant-specific) only for non-default tiles
      if (activeTileCodes && !activeTileCodes.includes(tile.code)) {
        return false;
      }
    }
    
    // Check role-gating (user-specific)
    if (tile.requires_role && tile.requires_role.length > 0) {
      // In dev mode, show all (for testing)
      if (isDevelopmentMode) return true;
      // User must have at least one of the required roles
      const hasRequiredRole = tile.requires_role.some(role => userRoles.includes(role));
      if (!hasRequiredRole) return false;
    }
    return true;
  });

  // Initialize open state for active module
  useEffect(() => {
    const currentPath = location.pathname;
    const activeModule = visibleTiles.find(t => 
      currentPath === t.route || currentPath.startsWith(t.route + '/')
    );
    if (activeModule) {
      setOpenModules(prev => ({ ...prev, [activeModule.code]: true }));
    }
  }, [location.pathname, visibleTiles]);
  
  const isActive = (route: string) => {
    if (route === '/portal') {
      return location.pathname === '/portal';
    }
    return location.pathname === route || location.pathname.startsWith(route + '/');
  };

  const isSubActive = (route: string) => {
    return location.pathname === route;
  };

  const toggleModule = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpenModules(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const handleParentClick = (route: string) => {
    navigate(route);
  };

  // Home entry (always visible)
  const homeEntry: TileDisplay = {
    code: 'home',
    title: 'Home',
    route: '/portal',
    icon: Home,
    display_order: 0,
    sub_tiles: [],
  };

  const allTiles = [homeEntry, ...visibleTiles];

  // Sidebar variant
  if (variant === 'sidebar') {
    return (
      <TooltipProvider delayDuration={0}>
        <nav 
          className={cn(
            'hidden md:flex flex-col gap-1 p-2 shrink-0 border-r bg-sidebar overflow-y-auto max-h-[calc(100vh-3.5rem)] transition-all duration-200',
            collapsed ? 'w-14' : 'w-64'
          )}
        >
          {!collapsed && (
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              Module
            </div>
          )}
          
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {collapsed ? '...' : 'Lade Module...'}
            </div>
          ) : (
            allTiles.map(tile => {
              const Icon = tile.icon;
              const active = isActive(tile.route);
              const isOpen = openModules[tile.code] ?? active;
              const hasSubTiles = tile.sub_tiles && tile.sub_tiles.length > 0;

              // Collapsed state: icons only with tooltip
              if (collapsed) {
                return (
                  <Tooltip key={tile.code}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleParentClick(tile.route)}
                        className={cn(
                          'flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-colors',
                          active 
                            ? 'bg-primary text-primary-foreground' 
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      <p>{tile.title}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              // Expanded state: full labels
              if (!hasSubTiles) {
                return (
                  <Link
                    key={tile.code}
                    to={tile.route}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      active 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tile.title}
                  </Link>
                );
              }

              return (
                <div key={tile.code}>
                  <div className="flex items-center">
                    {/* Parent: navigates to How-it-works */}
                    <button
                      onClick={() => handleParentClick(tile.route)}
                      className={cn(
                        'flex-1 flex items-center gap-3 px-3 py-2 rounded-l-lg text-sm font-medium transition-colors text-left',
                        active 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {tile.title}
                    </button>
                    
                    {/* Chevron: toggles submenu, no navigation */}
                    <button
                      onClick={(e) => toggleModule(tile.code, e)}
                      className={cn(
                        'p-2 rounded-r-lg transition-colors',
                        active 
                          ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <ChevronDown 
                        className={cn(
                          'h-4 w-4 transition-transform duration-200',
                          isOpen && 'rotate-180'
                        )} 
                      />
                    </button>
                  </div>
                  
                  <Collapsible open={isOpen}>
                    <CollapsibleContent>
                      <div className="ml-4 mt-1 space-y-1 border-l pl-3">
                        {tile.sub_tiles?.map(sub => (
                          <Link
                            key={sub.route}
                            to={sub.route}
                            className={cn(
                              'block px-3 py-1.5 rounded-lg text-sm transition-colors',
                              isSubActive(sub.route)
                                ? 'bg-primary text-primary-foreground font-medium'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                          >
                            {sub.title}
                          </Link>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })
          )}
        </nav>
      </TooltipProvider>
    );
  }

  // Bottom nav variant - no longer used, return null
  return null;
}
