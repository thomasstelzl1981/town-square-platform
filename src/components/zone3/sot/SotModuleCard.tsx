/**
 * SoT Module Card — Premium Card for Module Display
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Sparkles, FolderOpen, Building2, FileText, Tag, Landmark, Search, Target, Mail, FolderKanban, Calculator, Car, Home, LucideIcon } from 'lucide-react';
import { SotWebsiteModule } from '@/data/sotWebsiteModules';

const iconMap: Record<string, LucideIcon> = {
  Users,
  Sparkles,
  FolderOpen,
  Building2,
  FileText,
  Tag,
  Landmark,
  Search,
  Target,
  Mail,
  FolderKanban,
  Calculator,
  Car,
  Home,
};

interface SotModuleCardProps {
  module: SotWebsiteModule;
  index?: number;
  isVisible?: boolean;
}

export function SotModuleCard({ module, index = 0, isVisible = true }: SotModuleCardProps) {
  const Icon = iconMap[module.icon] || Building2;
  
  return (
    <Link
      to={`/sot/module/${module.code.toLowerCase()}`}
      className={`sot-module-card group block sot-fade-in ${isVisible ? 'visible' : ''}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Icon & Code */}
      <div className="flex items-start justify-between mb-4">
        <div 
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
        >
          <Icon className="w-7 h-7" style={{ color: 'hsl(var(--z3-accent))' }} />
        </div>
        <span className="sot-label opacity-50">{module.code}</span>
      </div>
      
      {/* Title & Tagline */}
      <h3 className="text-xl font-bold mb-2 group-hover:text-[hsl(var(--z3-accent))] transition-colors">
        {module.name}
      </h3>
      <p className="text-sm mb-4" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
        {module.tagline}
      </p>
      
      {/* Features */}
      <ul className="space-y-2 mb-6">
        {module.features.slice(0, 4).map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
            <span className="w-1 h-1 rounded-full bg-current opacity-50" />
            {feature}
          </li>
        ))}
      </ul>
      
      {/* CTA */}
      <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'hsl(var(--z3-accent))' }}>
        <span>Mehr erfahren</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
      
      {/* Highlight badge */}
      {module.highlight && (
        <div className="absolute top-4 right-4">
          <span 
            className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ 
              backgroundColor: 'hsl(var(--z3-accent))',
              color: 'hsl(var(--z3-background))'
            }}
          >
            ★ Beliebt
          </span>
        </div>
      )}
    </Link>
  );
}