/**
 * PORTAL NAV — Manifest-Driven Navigation
 * 
 * This component reads tiles/routes from the SSOT manifest.
 * Database tile_catalog is ONLY used as activation/visibility overlay.
 * 
 * RULES:
 * 1. Routes come from manifest (routesManifest.ts)
 * 2. DB only provides is_active flags per tenant
 * 3. 4-Tile-Pattern is enforced by manifest
 * 4. requires_role is ENFORCED for visibility
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  LucideIcon
} from 'lucide-react';

// Import manifest
import { zone2Portal, getModulesSorted, getTileFullPath } from '@/manifests/routesManifest';

// Icon mapping for modules
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
}

// Bottom nav items (first 5 items for mobile)
const bottomNavCodes = ['home', 'MOD-01', 'MOD-02', 'MOD-03', 'MOD-04'];

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

// Build tiles from manifest (including requires_role)
function buildTilesFromManifest(): TileDisplay[] {
  const modules = getModulesSorted();
  
  return modules.map(({ code, module }) => {
    const Icon = iconMap[module.icon] || Briefcase;
    const mainRoute = `/portal/${module.base}`;
    
    // Build sub-tiles from manifest tiles
    const subTiles: SubTileDisplay[] = module.tiles
      .filter(tile => tile.path !== '') // Skip default/index tiles
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
    };
  });
}

export function PortalNav({ variant = 'bottom' }: PortalNavProps) {
  const location = useLocation();
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
  const visibleTiles = manifestTiles.filter(tile => {
    // Check activation overlay (tenant-specific)
    if (activeTileCodes && !activeTileCodes.includes(tile.code)) {
      return false;
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

  const toggleModule = (code: string) => {
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

  if (variant === 'sidebar') {
    return (
      <nav className="hidden lg:flex flex-col gap-1 p-4 w-64 min-w-64 shrink-0 border-r bg-sidebar overflow-y-auto max-h-[calc(100vh-4rem)]">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
          Module
        </div>
        
        {isLoading ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">Lade Module...</div>
        ) : (
          allTiles.map(tile => {
            const Icon = tile.icon;
            const active = isActive(tile.route);
            const hasSubTiles = tile.sub_tiles && tile.sub_tiles.length > 0;
            const isOpen = openModules[tile.code] ?? active;

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
              <Collapsible
                key={tile.code}
                open={isOpen}
                onOpenChange={() => toggleModule(tile.code)}
              >
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      active 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {tile.title}
                    </span>
                    <ChevronDown 
                      className={cn(
                        'h-4 w-4 transition-transform duration-200',
                        isOpen && 'rotate-180'
                      )} 
                    />
                  </button>
                </CollapsibleTrigger>
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
            );
          })
        )}
      </nav>
    );
  }

  // Bottom navigation for mobile (first 5 modules only)
  const bottomTiles = allTiles.filter(t => 
    t.code === 'home' || bottomNavCodes.includes(t.code)
  ).slice(0, 5);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16">
        {bottomTiles.map(tile => {
          const Icon = tile.icon;
          const active = isActive(tile.route);
          return (
            <Link
              key={tile.code}
              to={tile.route}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[4rem]',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'fill-primary/20')} />
              <span className="text-[10px] font-medium">{tile.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
