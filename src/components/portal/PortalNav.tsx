import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home,
  Building2,
  Users,
  Briefcase,
  FileText,
  Wallet,
  Sparkles,
  Inbox,
  Target,
  Search,
  Handshake,
  Tag,
  Landmark,
  FolderOpen
} from 'lucide-react';

// MOD-01 to MOD-08: Standard modules (available to all SoT/Kaufy tenants)
const standardModules = [
  { code: 'home', label: 'Home', icon: Home, route: '/portal' },
  { code: 'stammdaten', label: 'Stammdaten', icon: Users, route: '/portal/stammdaten' },
  { code: 'office', label: 'Office', icon: Sparkles, route: '/portal/office' },
  { code: 'dms', label: 'DMS', icon: FolderOpen, route: '/portal/dms' },
  { code: 'immobilien', label: 'Immobilien', icon: Building2, route: '/portal/immobilien' },
  { code: 'msv', label: 'MSV', icon: FileText, route: '/portal/msv' },
  { code: 'verkauf', label: 'Verkauf', icon: Tag, route: '/portal/verkauf' },
  { code: 'finanzierung', label: 'Finanzierung', icon: Landmark, route: '/portal/finanzierung' },
  { code: 'investments', label: 'Investments', icon: Search, route: '/portal/investments' },
];

// MOD-09 to MOD-10: Kaufy Addon modules (only for partner/Kaufy tenants)
const kaufyAddonModules = [
  { code: 'vertriebspartner', label: 'Partner', icon: Handshake, route: '/portal/vertriebspartner' },
  { code: 'leads', label: 'Leads', icon: Target, route: '/portal/leads' },
];

// Bottom nav (mobile) - first 5 items
const bottomNavItems = standardModules.slice(0, 5);

interface PortalNavProps {
  variant?: 'bottom' | 'sidebar';
  showKaufyModules?: boolean;
}

export function PortalNav({ variant = 'bottom', showKaufyModules = true }: PortalNavProps) {
  const location = useLocation();
  
  const isActive = (route: string) => {
    if (route === '/portal') {
      return location.pathname === '/portal';
    }
    return location.pathname.startsWith(route);
  };

  const allModules = showKaufyModules 
    ? [...standardModules, ...kaufyAddonModules]
    : standardModules;

  if (variant === 'sidebar') {
    return (
      <nav className="hidden lg:flex flex-col gap-1 p-4 w-64 border-r bg-muted/30">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
          Module
        </div>
        {allModules.map(item => {
          const Icon = item.icon;
          const active = isActive(item.route);
          return (
            <Link
              key={item.code}
              to={item.route}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        
        {showKaufyModules && (
          <>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2 px-3">
              Kaufy Module
            </div>
            {kaufyAddonModules.map(item => {
              const Icon = item.icon;
              const active = isActive(item.route);
              return (
                <Link
                  key={item.code}
                  to={item.route}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    active 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>
    );
  }

  // Bottom navigation for mobile
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16">
        {bottomNavItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.route);
          return (
            <Link
              key={item.code}
              to={item.route}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[4rem]',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'fill-primary/20')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
