/**
 * SoT Widget Sidebar — Dashboard-sized navigation widgets (right column)
 * Mobile: Instagram-style glass bottom nav with 6 round buttons.
 */
import { Link, useLocation } from 'react-router-dom';
import { Building2, TrendingUp, FolderKanban, Settings, Zap, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    label: 'Mgmt', 
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
];

export function SotWidgetSidebar({ className }: { className?: string }) {
  const location = useLocation();

  return (
    <aside className={cn('hidden lg:flex flex-col gap-3 w-[280px] min-w-[280px]', className)}>
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

/** Mobile: Instagram-style fixed glass bottom nav */
export function SotWidgetBarMobile({ className }: { className?: string }) {
  const location = useLocation();

  return (
    <nav className={cn(
      'lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
      'flex items-center gap-3 px-4 py-2.5 rounded-full',
      'backdrop-blur-xl border',
      className
    )}
    style={{
      background: 'hsl(var(--z3-card)/0.7)',
      borderColor: 'hsl(var(--z3-border)/0.3)',
      boxShadow: '0 8px 32px -8px hsl(var(--z3-background)/0.5)',
    }}
    >
      {sidebarWidgets.map((widget) => {
        const isActive = location.pathname === widget.href;
        const Icon = widget.icon;

        return (
          <Link
            key={widget.id}
            to={widget.href}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              'transition-all duration-200',
              isActive
                ? 'shadow-lg scale-110'
                : 'hover:scale-105'
            )}
            style={{
              background: isActive 
                ? 'hsl(var(--z3-accent))' 
                : 'hsl(var(--z3-accent)/0.08)',
              color: isActive 
                ? 'hsl(var(--z3-background))' 
                : 'hsl(var(--z3-accent))',
            }}
            title={widget.label}
          >
            <Icon className="w-5 h-5" />
          </Link>
        );
      })}
    </nav>
  );
}
