/**
 * MODULE TABS — Level 2 Navigation
 * 
 * Shows 5 modules from the active area
 * Click navigates to module base route
 */

import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ModuleDefinition } from '@/manifests/routesManifest';
import { 
  Users,
  Sparkles,
  FolderOpen,
  Building2,
  FileText,
  Tag,
  Landmark,
  Search,
  Handshake,
  Target,
  Home,
  Briefcase,
  FolderKanban,
  Mail,
  GraduationCap,
  Wrench,
  Car,
  LineChart,
  Sun,
  LucideIcon
} from 'lucide-react';

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
  'Briefcase': Briefcase,
  'FolderKanban': FolderKanban,
  'Mail': Mail,
  'GraduationCap': GraduationCap,
  'Wrench': Wrench,
  'Car': Car,
  'LineChart': LineChart,
  'Sun': Sun,
};

interface ModuleWithMeta {
  code: string;
  module: ModuleDefinition;
  displayLabel: string;
}

interface ModuleTabsProps {
  modules: ModuleWithMeta[];
  activeModule?: ModuleWithMeta;
}

export function ModuleTabs({ modules, activeModule }: ModuleTabsProps) {
  const { isDevelopmentMode } = useAuth();

  if (modules.length === 0) {
    return (
      <div className="px-4 py-3 text-sm text-muted-foreground">
        Keine Module in diesem Bereich verfügbar
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1 px-4 py-2 overflow-x-auto scrollbar-none">
      {modules.map(({ code, module, displayLabel }) => {
        const Icon = iconMap[module.icon] || Briefcase;
        const route = `/portal/${module.base}`;
        const isActive = activeModule?.code === code;
        
        // Check if module requires activation (but allow in dev mode)
        const requiresActivation = module.visibility.requires_activation && !isDevelopmentMode;
        
        return (
          <NavLink
            key={code}
            to={route}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
              requiresActivation && 'opacity-50'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{displayLabel}</span>
          </NavLink>
        );
      })}
    </div>
  );
}
