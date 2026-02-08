/**
 * SoT Module Showcase — Grid Display of All Modules
 */
import { SOT_WEBSITE_MODULES, MODULE_CATEGORIES, SotWebsiteModule } from '@/data/sotWebsiteModules';
import { SotModuleCard } from './SotModuleCard';
import { useSotScrollAnimation, useSotStaggerAnimation } from '@/hooks/useSotScrollAnimation';

interface SotModuleShowcaseProps {
  showCategories?: boolean;
  limit?: number;
  highlightOnly?: boolean;
}

export function SotModuleShowcase({ 
  showCategories = true, 
  limit,
  highlightOnly = false 
}: SotModuleShowcaseProps) {
  const { ref, isVisible } = useSotScrollAnimation();
  
  let modules = highlightOnly 
    ? SOT_WEBSITE_MODULES.filter(m => m.highlight)
    : SOT_WEBSITE_MODULES;
    
  if (limit) {
    modules = modules.slice(0, limit);
  }

  if (showCategories) {
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
                <h3 className="sot-label mb-2" style={{ color: 'hsl(var(--z3-accent))' }}>
                  {category.label}
                </h3>
                <p className="sot-subheadline">{category.description}</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryModules.map((module, index) => (
                  <SotModuleCard 
                    key={module.code} 
                    module={module} 
                    index={index}
                    isVisible={isVisible}
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
    <div ref={ref} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {modules.map((module, index) => (
        <SotModuleCard 
          key={module.code} 
          module={module} 
          index={index}
          isVisible={isVisible}
        />
      ))}
    </div>
  );
}