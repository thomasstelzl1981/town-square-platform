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

// Define category order
const CATEGORY_ORDER: SotWebsiteModule['category'][] = ['foundation', 'management', 'finance', 'extensions'];

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
    return (
      <div ref={ref} className="space-y-16 lg:space-y-20">
        {CATEGORY_ORDER.map((categoryKey) => {
          const category = MODULE_CATEGORIES[categoryKey];
          const categoryModules = modules.filter(m => m.category === categoryKey);
          if (categoryModules.length === 0) return null;
          
          return (
            <section key={categoryKey}>
              <div className={`mb-6 lg:mb-8 sot-fade-in ${isVisible ? 'visible' : ''}`}>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="sot-label" style={{ color: 'hsl(var(--z3-accent))' }}>
                    {category.label}
                  </h3>
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}
                  >
                    {categoryModules.length} {categoryModules.length === 1 ? 'Modul' : 'Module'}
                  </span>
                </div>
                <p className="sot-subheadline text-base lg:text-lg">{category.tagline || category.description}</p>
              </div>
              
              <div className={`grid gap-4 lg:gap-6 ${
                variant === 'detailed' 
                  ? 'grid-cols-1 lg:grid-cols-2' 
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
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
      className={`grid gap-4 lg:gap-6 ${
        variant === 'detailed' 
          ? 'grid-cols-1 lg:grid-cols-2' 
          : variant === 'compact'
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
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
