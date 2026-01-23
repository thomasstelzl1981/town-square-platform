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
  Target
} from 'lucide-react';

// Fixed navigation items matching the 9-module grid
const navItems = [
  { code: 'home', label: 'Home', icon: Home, route: '/portal' },
  { code: 'stammdaten', label: 'Stamm', icon: Users, route: '/portal/stammdaten' },
  { code: 'ki-office', label: 'Office', icon: Sparkles, route: '/portal/ki-office' },
  { code: 'posteingang', label: 'Post', icon: Inbox, route: '/portal/posteingang' },
  { code: 'immobilien', label: 'Immo', icon: Building2, route: '/portal/immobilien' },
];

const moreItems = [
  { code: 'msv', label: 'MSV', icon: FileText, route: '/portal/msv' },
  { code: 'verkauf', label: 'Verkauf', icon: Briefcase, route: '/portal/verkauf' },
  { code: 'vertriebspartner', label: 'Partner', icon: Users, route: '/portal/vertriebspartner' },
  { code: 'finanzierung', label: 'Finanz', icon: Wallet, route: '/portal/finanzierung' },
  { code: 'leadgenerierung', label: 'Leads', icon: Target, route: '/portal/leadgenerierung' },
];

interface PortalNavProps {
  variant?: 'bottom' | 'sidebar';
}

export function PortalNav({ variant = 'bottom' }: PortalNavProps) {
  const location = useLocation();
  
  const isActive = (route: string) => {
    if (route === '/portal') {
      return location.pathname === '/portal';
    }
    return location.pathname.startsWith(route);
  };

  if (variant === 'sidebar') {
    return (
      <nav className="hidden lg:flex flex-col gap-1 p-4 w-64 border-r bg-muted/30">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
          Navigation
        </div>
        {[...navItems, ...moreItems].map(item => {
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
              {item.label === 'Stamm' ? 'Stammdaten' : 
               item.label === 'Office' ? 'KI Office' :
               item.label === 'Post' ? 'Posteingang' :
               item.label === 'Immo' ? 'Immobilien' :
               item.label === 'Finanz' ? 'Finanzierung' :
               item.label === 'Partner' ? 'Vertriebspartner' :
               item.label === 'Leads' ? 'Leadgenerierung' :
               item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  // Bottom navigation for mobile
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16">
        {navItems.map(item => {
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
