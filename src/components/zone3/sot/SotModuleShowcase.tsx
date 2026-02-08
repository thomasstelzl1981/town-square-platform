/**
 * SoT Module Showcase — Grid Display with Categories
 */
import { SOT_WEBSITE_MODULES, MODULE_CATEGORIES, SotWebsiteModule } from '@/data/sotWebsiteModules';
import { SotModuleCard } from './SotModuleCard';
import { useSotScrollAnimation } from '@/hooks/useSotScrollAnimation';

interface SotModuleShowcaseProps {
  showCategories?: boolean;
  limit?: number;
  highlightOnly?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export function SotModuleShowcase({ 
  showCategories = true, 
  limit,
  highlightOnly = false,
  variant = 'default'
}: SotModuleShowcaseProps) {
  const { ref, isVisible } = useSotScrollAnimation();
  
  let modules = highlightOnly 
    ? SOT_WEBSITE_MODULES.filter(m => m.highlight)
    : SOT_WEBSITE_MODULES;
    
  if (limit) {
    modules = modules.slice(0, limit);
  }

  if (showCategories && !highlightOnly) {
    // Group by category
    const categories = Object.entries(MODULE_CATEGORIES) as [SotWebsiteModule['category'], typeof MODULE_CATEGORIES.foundation][];
    
    return (
      <div ref={ref} className="space-y-20">
        {categories.map(([categoryKey, category]) => {
          const categoryModules = modules.filter(m => m.category === categoryKey);
          if (categoryModules.length === 0) return null;
          
          return (
            <section key={categoryKey}>
              <div className={`mb-8 sot-fade-in ${isVisible ? 'visible' : ''}`}>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="sot-label" style={{ color: 'hsl(var(--z3-accent))' }}>
                    {category.label}
                  </h3>
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}
                  >
                    {categoryModules.length} Module
                  </span>
                </div>
                <p className="sot-subheadline text-lg">{category.tagline || category.description}</p>
              </div>
              
              <div className={`grid gap-6 ${
                variant === 'detailed' 
                  ? 'md:grid-cols-1 lg:grid-cols-2' 
                  : 'md:grid-cols-2 lg:grid-cols-3'
              }`}>
                {categoryModules.map((module, index) => (
                  <SotModuleCard 
                    key={module.code} 
                    module={module} 
                    index={index}
                    isVisible={isVisible}
                    variant={variant}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  // Simple grid without categories
  return (
    <div 
      ref={ref} 
      className={`grid gap-6 ${
        variant === 'detailed' 
          ? 'md:grid-cols-1 lg:grid-cols-2' 
          : variant === 'compact'
            ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            : 'md:grid-cols-2 lg:grid-cols-3'
      }`}
    >
      {modules.map((module, index) => (
        <SotModuleCard 
          key={module.code} 
          module={module} 
          index={index}
          isVisible={isVisible}
          variant={variant}
        />
      ))}
    </div>
  );
}
