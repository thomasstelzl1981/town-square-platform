/**
 * Social Sidebar — 9-Punkt Navigation für MOD-14 Social
 */
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Mic, Lightbulb, BookOpen, Inbox,
  ImageIcon, PenTool, Calendar, BarChart3
} from 'lucide-react';

const socialNavItems = [
  { path: 'overview', label: 'Überblick', icon: LayoutDashboard },
  { path: 'audit', label: 'Audit', icon: Mic },
  { path: 'inspiration', label: 'Ideen & Inspiration', icon: Lightbulb },
  { path: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
  { path: 'inbound', label: 'Individual Content', icon: Inbox },
  { path: 'assets', label: 'Assets', icon: ImageIcon },
  { path: 'create', label: 'Content Creation', icon: PenTool },
  { path: 'calendar', label: 'Kalender & Planung', icon: Calendar },
  { path: 'performance', label: 'Performance', icon: BarChart3 },
] as const;

const BASE = '/portal/communication-pro/social';

export function SocialSidebar() {
  return (
    <nav className="w-56 shrink-0 border-r border-border bg-muted/30 py-4 px-2 space-y-0.5 overflow-y-auto">
      <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Social
      </p>
      {socialNavItems.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={`${BASE}/${path}`}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

/** Mobile-friendly bottom sheet or horizontal scroller */
export function SocialMobileNav() {
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none px-3 py-2 border-b border-border bg-muted/30">
      {socialNavItems.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={`${BASE}/${path}`}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )
          }
        >
          <Icon className="h-3.5 w-3.5" />
          <span>{label}</span>
        </NavLink>
      ))}
    </div>
  );
}
