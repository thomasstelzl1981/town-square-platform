/**
 * SoT Widget Sidebar — Dashboard-sized navigation widgets (right column)
 * Uses the same aspect-square sizing as the portal dashboard widgets.
 */
import { Link, useLocation } from 'react-router-dom';
import { Building2, TrendingUp, FolderKanban, Settings, Zap, Users, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WIDGET_CELL } from '@/config/designManifest';

const sidebarWidgets = [
  { 
    id: 'real-estate', 
    label: 'Real Estate', 
    sublabel: 'Immobilien verwalten',
    icon: Building2, 
    href: '/website/sot/real-estate',
  },
  { 
    id: 'capital', 
    label: 'Capital', 
    sublabel: 'Investment & Finanzierung',
    icon: TrendingUp, 
    href: '/website/sot/capital',
  },
  { 
    id: 'projects', 
    label: 'Projects', 
    sublabel: 'Objekte einreichen',
    icon: FolderKanban, 
    href: '/website/sot/projects',
  },
  { 
    id: 'management', 
    label: 'Management', 
    sublabel: 'KI-Office & DMS',
    icon: Settings, 
    href: '/website/sot/management',
  },
  { 
    id: 'energy', 
    label: 'Energy', 
    sublabel: 'PV & Energieverträge',
    icon: Zap, 
    href: '/website/sot/energy',
  },
  { 
    id: 'karriere', 
    label: 'Career', 
    sublabel: 'Partner werden',
    icon: Users, 
    href: '/website/sot/karriere',
  },
  { 
    id: 'login', 
    label: 'Login', 
    sublabel: 'Portal-Zugang',
    icon: LogIn, 
    href: '/auth?mode=login',
  },
];

export function SotWidgetSidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col gap-3 w-[280px] min-w-[280px]">
      {sidebarWidgets.map((widget) => {
        const isActive = location.pathname === widget.href || 
          (widget.href !== '/website/sot' && location.pathname.startsWith(widget.href));
        const Icon = widget.icon;

        return (
          <Link
            key={widget.id}
            to={widget.href}
            className={cn(
              'sot-glass-card p-4 flex flex-col items-center justify-center text-center',
              'transition-all duration-200 hover:scale-[1.02]',
              'aspect-square',
              isActive && 'border-[hsl(var(--z3-accent))] shadow-[0_0_20px_-5px_hsl(var(--z3-accent)/0.3)]'
            )}
          >
            <div 
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center mb-3',
                isActive ? 'bg-[hsl(var(--z3-accent)/0.2)]' : 'bg-[hsl(var(--z3-accent)/0.08)]'
              )}
            >
              <Icon 
                className="w-6 h-6" 
                style={{ color: 'hsl(var(--z3-accent))' }} 
              />
            </div>
            <span className="text-sm font-semibold" style={{ color: 'hsl(var(--z3-foreground))' }}>
              {widget.label}
            </span>
            <span className="text-xs mt-1" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
              {widget.sublabel}
            </span>
          </Link>
        );
      })}
    </aside>
  );
}

/** Mobile: horizontal scrollable widget row */
export function SotWidgetBarMobile() {
  const location = useLocation();

  return (
    <div className="lg:hidden overflow-x-auto pb-3 -mx-4 px-4">
      <div className="flex gap-3 min-w-max">
        {sidebarWidgets.map((widget) => {
          const isActive = location.pathname === widget.href;
          const Icon = widget.icon;

          return (
            <Link
              key={widget.id}
              to={widget.href}
              className={cn(
                'sot-glass-card px-4 py-3 flex items-center gap-2.5 whitespace-nowrap',
                'transition-all duration-200',
                isActive && 'border-[hsl(var(--z3-accent))]'
              )}
            >
              <Icon 
                className="w-4 h-4" 
                style={{ color: 'hsl(var(--z3-accent))' }} 
              />
              <span className="text-sm font-medium">{widget.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
