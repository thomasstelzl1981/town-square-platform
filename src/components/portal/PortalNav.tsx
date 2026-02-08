/**
 * PORTAL NAV — Manifest-Driven Navigation (P0-Stabilized)
 * 
 * P0-FIX: Memoized tile arrays + stable effects + NavLink for navigation
 * 
 * Desktop Sidebar:
 * - Expanded: 256px (w-64)
 * - Collapsed: 56px (w-14) with icons only
 * - Parent click: navigates to How-it-works (/portal/{base})
 * - Chevron click: toggles submenu (no navigation)
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
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
  visibilityDefault?: boolean;
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

// Build tiles from manifest (including requires_role and visibility)
// P0-FIX: This is a pure function, called once via useMemo
function buildTilesFromManifest(): TileDisplay[] {
  const modules = getModulesSorted();
  
  return modules.map(({ code, module }) => {
    const Icon = iconMap[module.icon] || Briefcase;
    const mainRoute = `/portal/${module.base}`;
    
    // Build sub-tiles from manifest tiles
    const subTiles: SubTileDisplay[] = module.tiles
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

// Find active module code from pathname
function findActiveModuleCode(pathname: string, tiles: TileDisplay[]): string | null {
  const activeModule = tiles.find(t => 
    pathname === t.route || pathname.startsWith(t.route + '/')
  );
  return activeModule?.code || null;
}

export function PortalNav({ variant = 'sidebar', collapsed = false }: PortalNavProps) {
  const location = useLocation();
  const { activeOrganization, isDevelopmentMode, isPlatformAdmin, user } = useAuth();
  const [activeTileCodes, setActiveTileCodes] = useState<string[] | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Track previous active module to avoid redundant state updates
  const prevActiveModuleRef = useRef<string | null>(null);

  // P0-FIX: Memoize manifest tiles (static, never changes)
  const manifestTiles = useMemo(() => buildTilesFromManifest(), []);

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
        // Superuser/dev: show all tiles (visibility overlay disabled)
        if (isDevelopmentMode || isPlatformAdmin) {
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
  }, [activeOrganization?.id, isDevelopmentMode, isPlatformAdmin]);

  // P0-FIX: Memoize visible tiles with stable dependencies
  const visibleTiles = useMemo(() => {
    return manifestTiles.filter(tile => {
      // ALWAYS show tiles with visibility.default = true (manifest SSOT)
      if (tile.visibilityDefault) {
        // Default-visible tiles are always shown
      } else {
        // Check activation overlay (tenant-specific) only for non-default tiles
        if (activeTileCodes && !activeTileCodes.includes(tile.code)) {
          return false;
        }
      }
      
      // Check role-gating (user-specific)
      if (tile.requires_role && tile.requires_role.length > 0) {
        // Superuser/dev: show all (for testing/support)
        if (isDevelopmentMode || isPlatformAdmin) return true;
        // User must have at least one of the required roles
        const hasRequiredRole = tile.requires_role.some(role => userRoles.includes(role));
        if (!hasRequiredRole) return false;
      }
      return true;
    });
  }, [manifestTiles, activeTileCodes, isDevelopmentMode, isPlatformAdmin, userRoles]);

  // P0-FIX: Memoize active module code
  const activeModuleCode = useMemo(
    () => findActiveModuleCode(location.pathname, visibleTiles),
    [location.pathname, visibleTiles]
  );

  // P0-FIX: Stable effect - only update openModules when activeModuleCode actually changes
  useEffect(() => {
    if (activeModuleCode && activeModuleCode !== prevActiveModuleRef.current) {
      prevActiveModuleRef.current = activeModuleCode;
      setOpenModules(prev => {
        // Only update if not already open
        if (prev[activeModuleCode]) return prev;
        return { ...prev, [activeModuleCode]: true };
      });
    }
  }, [activeModuleCode]);
  
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
                      <NavLink
                        to={tile.route}
                        className={({ isActive: navActive }) => cn(
                          'flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-colors',
                          navActive || active
                            ? 'bg-primary text-primary-foreground' 
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      <p>{tile.title}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              // Expanded state: full labels - no sub-tiles
              if (!hasSubTiles) {
                return (
                  <NavLink
                    key={tile.code}
                    to={tile.route}
                    className={({ isActive: navActive }) => cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      navActive
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tile.title}
                  </NavLink>
                );
              }

              // P0-FIX: Parent is now NavLink (declarative) instead of button (imperative)
              return (
                <div key={tile.code}>
                  <div className="flex items-center">
                    {/* Parent: NavLink navigates to How-it-works */}
                    <NavLink
                      to={tile.route}
                      className={({ isActive: navActive }) => cn(
                        'flex-1 flex items-center gap-3 px-3 py-2 rounded-l-lg text-sm font-medium transition-colors text-left',
                        navActive || active
                          ? 'bg-primary/10 text-primary' 
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {tile.title}
                    </NavLink>
                    
                    {/* Chevron: toggles submenu, no navigation */}
                    <button
                      onClick={(e) => toggleModule(tile.code, e)}
                      className={cn(
                        'p-2 rounded-r-lg transition-colors',
                        active 
                          ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                      aria-label={`${tile.title} Untermenü ${isOpen ? 'schließen' : 'öffnen'}`}
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
                          <NavLink
                            key={sub.route}
                            to={sub.route}
                            className={({ isActive: subActive }) => cn(
                              'block px-3 py-1.5 rounded-lg text-sm transition-colors',
                              subActive
                                ? 'bg-primary text-primary-foreground font-medium'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                          >
                            {sub.title}
                          </NavLink>
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
