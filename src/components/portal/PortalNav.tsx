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

// Icon mapping for modules
const iconMap: Record<string, LucideIcon> = {
  'home': Home,
  'stammdaten': Users,
  'office': Sparkles,
  'dms': FolderOpen,
  'immobilien': Building2,
  'msv': FileText,
  'verkauf': Tag,
  'finanzierung': Landmark,
  'investments': Search,
  'vertriebspartner': Handshake,
  'leads': Target,
};

interface SubTile {
  title: string;
  route: string;
}

interface TileCatalogEntry {
  tile_code: string;
  title: string;
  route: string;
  sub_tiles: SubTile[] | null;
  display_order: number;
}

interface PortalNavProps {
  variant?: 'bottom' | 'sidebar';
}

// Bottom nav items (first 5 items for mobile)
const bottomNavCodes = ['home', 'MOD-01', 'MOD-02', 'MOD-03', 'MOD-04'];

// Fetch helper to bypass Supabase type complexity
async function fetchActiveTiles(tenantId: string): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;
  const { data } = await client
    .from('tenant_tile_activation')
    .select('tile_code')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);
  
  if (!data) return [];
  return (data as { tile_code: string }[]).map(a => a.tile_code);
}

async function fetchTileCatalog(): Promise<TileCatalogEntry[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;
  const { data, error } = await client
    .from('tile_catalog')
    .select('tile_code, title, main_tile_route, sub_tiles, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  
  if (error || !data) {
    console.error('Error fetching tiles:', error);
    return [];
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(t => {
    let subTiles: SubTile[] | null = null;
    if (t.sub_tiles) {
      if (Array.isArray(t.sub_tiles)) {
        subTiles = t.sub_tiles as SubTile[];
      } else if (typeof t.sub_tiles === 'string') {
        try {
          subTiles = JSON.parse(t.sub_tiles);
        } catch {
          subTiles = null;
        }
      }
    }
    
    return {
      tile_code: t.tile_code,
      title: t.title,
      route: t.main_tile_route || `/portal/${t.tile_code.toLowerCase().replace('mod-', '')}`,
      sub_tiles: subTiles,
      display_order: t.display_order
    };
  });
}

export function PortalNav({ variant = 'bottom' }: PortalNavProps) {
  const location = useLocation();
  const { activeOrganization } = useAuth();
  const [tiles, setTiles] = useState<TileCatalogEntry[]>([]);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tiles from tile_catalog
  useEffect(() => {
    async function loadTiles() {
      try {
        // Fetch catalog first
        const catalogTiles = await fetchTileCatalog();
        
        // Then filter by tenant activations if we have an org
        if (activeOrganization?.id) {
          const activeTileCodes = await fetchActiveTiles(activeOrganization.id);
          if (activeTileCodes.length > 0) {
            const filteredTiles = catalogTiles.filter(t => activeTileCodes.includes(t.tile_code));
            setTiles(filteredTiles);
          } else {
            setTiles(catalogTiles);
          }
        } else {
          setTiles(catalogTiles);
        }
      } catch (err) {
        console.error('Failed to fetch tiles:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTiles();
  }, [activeOrganization?.id]);

  // Initialize open state for active module
  useEffect(() => {
    const currentPath = location.pathname;
    const activeModule = tiles.find(t => 
      currentPath === t.route || currentPath.startsWith(t.route + '/')
    );
    if (activeModule) {
      setOpenModules(prev => ({ ...prev, [activeModule.tile_code]: true }));
    }
  }, [location.pathname, tiles]);
  
  const isActive = (route: string) => {
    if (route === '/portal') {
      return location.pathname === '/portal';
    }
    return location.pathname === route || location.pathname.startsWith(route + '/');
  };

  const isSubActive = (route: string) => {
    return location.pathname === route;
  };

  const getIcon = (tileCode: string): LucideIcon => {
    const moduleMap: Record<string, string> = {
      'MOD-01': 'stammdaten',
      'MOD-02': 'office',
      'MOD-03': 'dms',
      'MOD-04': 'immobilien',
      'MOD-05': 'msv',
      'MOD-06': 'verkauf',
      'MOD-07': 'finanzierung',
      'MOD-08': 'investments',
      'MOD-09': 'vertriebspartner',
      'MOD-10': 'leads',
    };
    const key = moduleMap[tileCode] || tileCode.toLowerCase();
    return iconMap[key] || Briefcase;
  };

  const toggleModule = (code: string) => {
    setOpenModules(prev => ({ ...prev, [code]: !prev[code] }));
  };

  // Add Home entry
  const homeEntry: TileCatalogEntry = {
    tile_code: 'home',
    title: 'Home',
    route: '/portal',
    sub_tiles: null,
    display_order: 0
  };

  const allTiles = [homeEntry, ...tiles];

  if (variant === 'sidebar') {
    return (
      <nav className="hidden lg:flex flex-col gap-1 p-4 w-64 border-r bg-sidebar overflow-y-auto max-h-[calc(100vh-4rem)]">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
          Module
        </div>
        
        {isLoading ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">Lade Module...</div>
        ) : (
          allTiles.map(tile => {
            const Icon = getIcon(tile.tile_code);
            const active = isActive(tile.route);
            const hasSubTiles = tile.sub_tiles && tile.sub_tiles.length > 0;
            const isOpen = openModules[tile.tile_code] ?? active;

            if (!hasSubTiles) {
              return (
                <Link
                  key={tile.tile_code}
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
                key={tile.tile_code}
                open={isOpen}
                onOpenChange={() => toggleModule(tile.tile_code)}
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
    t.tile_code === 'home' || bottomNavCodes.includes(t.tile_code)
  ).slice(0, 5);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16">
        {bottomTiles.map(tile => {
          const Icon = getIcon(tile.tile_code);
          const active = isActive(tile.route);
          return (
            <Link
              key={tile.tile_code}
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
