import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ChevronDown, Home, LucideIcon, Briefcase } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getModulesSorted, getTileFullPath } from '@/manifests/routesManifest';

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Users: LucideIcons.Users,
  Sparkles: LucideIcons.Sparkles,
  FolderOpen: LucideIcons.FolderOpen,
  Building2: LucideIcons.Building2,
  FileText: LucideIcons.FileText,
  Tag: LucideIcons.Tag,
  Landmark: LucideIcons.Landmark,
  Search: LucideIcons.Search,
  Handshake: LucideIcons.Handshake,
  Target: LucideIcons.Target,
  Home: LucideIcons.Home,
};

interface NavItem {
  code: string;
  title: string;
  route: string;
  icon: LucideIcon;
  subTiles: { title: string; route: string }[];
}

function buildNavItems(): NavItem[] {
  const modules = getModulesSorted();
  
  return modules.map(({ code, module }) => {
    const Icon = iconMap[module.icon] || Briefcase;
    const mainRoute = `/portal/${module.base}`;
    
    const subTiles = module.tiles
      .filter(tile => tile.path !== '')
      .map(tile => ({
        title: tile.title,
        route: getTileFullPath(module.base, tile.path),
      }));
    
    return {
      code,
      title: module.name,
      route: mainRoute,
      icon: Icon,
      subTiles,
    };
  });
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const location = useLocation();
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const navItems = buildNavItems();

  // Auto-expand active module
  useEffect(() => {
    const activeModule = navItems.find(item => 
      location.pathname === item.route || 
      location.pathname.startsWith(item.route + '/')
    );
    if (activeModule) {
      setOpenModules(prev => ({ ...prev, [activeModule.code]: true }));
    }
  }, [location.pathname]);

  const isActive = (route: string) => {
    if (route === '/portal') return location.pathname === '/portal';
    return location.pathname === route || location.pathname.startsWith(route + '/');
  };

  const isSubActive = (route: string) => location.pathname === route;

  const handleNavigate = () => {
    onOpenChange(false);
  };

  const toggleModule = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenModules(prev => ({ ...prev, [code]: !prev[code] }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-left">Navigation</SheetTitle>
        </SheetHeader>
        
        <nav className="overflow-y-auto h-[calc(100vh-5rem)] p-4">
          {/* Home */}
          <Link
            to="/portal"
            onClick={handleNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium mb-2 transition-colors',
              isActive('/portal') && location.pathname === '/portal'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Home className="h-4 w-4" />
            Home
          </Link>

          {/* Modules */}
          <div className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.route);
              const isOpen = openModules[item.code] ?? active;
              const hasSubTiles = item.subTiles.length > 0;

              return (
                <div key={item.code}>
                  <div className="flex items-center">
                    {/* Parent click navigates to How-it-works */}
                    <Link
                      to={item.route}
                      onClick={handleNavigate}
                      className={cn(
                        'flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.title}
                    </Link>
                    
                    {/* Chevron toggles submenu */}
                    {hasSubTiles && (
                      <button
                        onClick={(e) => toggleModule(item.code, e)}
                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                      >
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform duration-200',
                            isOpen && 'rotate-180'
                          )}
                        />
                      </button>
                    )}
                  </div>

                  {/* Subtiles */}
                  {hasSubTiles && (
                    <Collapsible open={isOpen}>
                      <CollapsibleContent>
                        <div className="ml-4 mt-1 space-y-1 border-l pl-3">
                          {item.subTiles.map(sub => (
                            <Link
                              key={sub.route}
                              to={sub.route}
                              onClick={handleNavigate}
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
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
