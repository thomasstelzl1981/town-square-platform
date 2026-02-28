/**
 * SoT Module Card — Premium Card with Pain Points
 */
import { Link } from 'react-router-dom';
import { ArrowRight, AlertCircle, Check, Users, Sparkles, FolderOpen, Building2, FileText, Tag, Landmark, Search, Mail, FolderKanban, Calculator, Car, Home, Box, Sun, TrendingUp, GraduationCap, ShoppingCart, Globe, PawPrint, LucideIcon } from 'lucide-react';
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
  Mail,
  FolderKanban,
  Calculator,
  Car,
  Home,
  Box,
  Sun,
  TrendingUp,
  GraduationCap,
  ShoppingCart,
  Globe,
  PawPrint,
};

interface SotModuleCardProps {
  module: SotWebsiteModule;
  index?: number;
  isVisible?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export function SotModuleCard({ 
  module, 
  index = 0, 
  isVisible = true,
  variant = 'default' 
}: SotModuleCardProps) {
  // Get icon component from map
  const IconComponent = iconMap[module.icon] || Box;
  
  if (variant === 'compact') {
    return (
      <div 
        className={`sot-glass-card p-5 sot-fade-in ${isVisible ? 'visible' : ''}`}
        style={{ transitionDelay: `${index * 80}ms` }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
          >
            <IconComponent className="w-5 h-5" style={{ color: 'hsl(var(--z3-accent))' }} />
          </div>
          <div>
            <h3 className="font-bold text-sm">{module.name}</h3>
            <span className="text-xs" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
              {module.tagline}
            </span>
          </div>
        </div>
        <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
          {module.tagline}
        </p>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div 
        className={`sot-glass-card p-8 sot-fade-in ${isVisible ? 'visible' : ''} ${module.highlight ? 'ring-1 ring-[hsl(var(--z3-accent)/0.3)]' : ''}`}
        style={{ transitionDelay: `${index * 100}ms` }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
            >
              <IconComponent className="w-7 h-7" style={{ color: 'hsl(var(--z3-accent))' }} />
            </div>
            <div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/10">
                {module.category === 'client' ? 'Vermögen' : module.category === 'service' ? 'Betrieb' : 'Fundament'}
              </span>
              <h3 className="font-bold text-xl mt-1">{module.name}</h3>
            </div>
          </div>
          {module.highlight && (
            <span 
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ 
                backgroundColor: 'hsl(var(--z3-accent) / 0.15)',
                color: 'hsl(var(--z3-accent))'
              }}
            >
              Beliebt
            </span>
          )}
        </div>

        {/* Tagline & Description */}
        <p className="font-medium mb-2" style={{ color: 'hsl(var(--z3-accent))' }}>
          {module.tagline}
        </p>
        <p className="text-sm mb-6" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
          {module.description}
        </p>

        {/* Pain Points */}
        {module.painPoints && module.painPoints.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
              Das Problem
            </h4>
            <ul className="space-y-2">
              {module.painPoints.slice(0, 2).map((pain, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'hsl(0 70% 60%)' }} />
                  <span className="line-through" style={{ color: 'hsl(0 70% 60% / 0.8)' }}>{pain}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Features */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
            Die Lösung
          </h4>
          <div className="flex flex-wrap gap-2">
            {module.features.slice(0, 5).map((feature) => (
              <span 
                key={feature}
                className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5"
                style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}
              >
                <Check className="w-3 h-3" style={{ color: 'hsl(var(--z3-accent))' }} />
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link 
          to={`/website/sot/module/${module.code}`}
          className="sot-btn-ghost text-sm w-full justify-center group"
        >
          Mehr erfahren
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  // Default variant
  return (
    <div 
      className={`sot-glass-card p-6 sot-fade-in ${isVisible ? 'visible' : ''} ${module.highlight ? 'ring-1 ring-[hsl(var(--z3-accent)/0.3)]' : ''}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
        >
          <IconComponent className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
        </div>
        {module.highlight && (
          <span 
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{ 
              backgroundColor: 'hsl(var(--z3-accent) / 0.15)',
              color: 'hsl(var(--z3-accent))'
            }}
          >
            ★
          </span>
        )}
      </div>
      
      <span className="text-xs font-medium" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
        {module.category === 'client' ? 'Vermögen' : module.category === 'service' ? 'Betrieb' : 'Fundament'}
      </span>
      <h3 className="font-bold text-lg mb-1">{module.name}</h3>
      <p className="text-sm mb-4" style={{ color: 'hsl(var(--z3-accent))' }}>
        {module.tagline}
      </p>
      
      <p className="text-sm mb-4 line-clamp-2" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
        {module.description}
      </p>
      
      <div className="flex flex-wrap gap-1.5">
        {module.features.slice(0, 3).map((feature) => (
          <span 
            key={feature}
            className="text-xs px-2 py-1 rounded-full"
            style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}
          >
            {feature}
          </span>
        ))}
        {module.features.length > 3 && (
          <span 
            className="text-xs px-2 py-1 rounded-full"
            style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}
          >
            +{module.features.length - 3}
          </span>
        )}
      </div>
    </div>
  );
}