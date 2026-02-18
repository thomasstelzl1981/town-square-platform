/**
 * SoT Module Showcase — Grid Display with Categories
 */
import { useRef, useState, useEffect } from 'react';
import { SOT_WEBSITE_MODULES, MODULE_CATEGORIES, SotWebsiteModule } from '@/data/sotWebsiteModules';
import { SotModuleCard } from './SotModuleCard';

interface SotModuleShowcaseProps {
  showCategories?: boolean;
  limit?: number;
  highlightOnly?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

const CATEGORY_ORDER: SotWebsiteModule['category'][] = ['client', 'service', 'base'];

function useSimpleReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.05, rootMargin: '100px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function CategorySection({ categoryKey, modules, variant }: { categoryKey: SotWebsiteModule['category']; modules: SotWebsiteModule[]; variant: string }) {
  const { ref, visible } = useSimpleReveal();
  const category = MODULE_CATEGORIES[categoryKey];

  return (
    <section ref={ref} key={categoryKey}>
      <div className={`mb-6 lg:mb-8 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h3 className="sot-label" style={{ color: 'hsl(var(--z3-accent))' }}>
            {category.label}
          </h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}
          >
            {modules.length} {modules.length === 1 ? 'Modul' : 'Module'}
          </span>
        </div>
        <p className="sot-subheadline text-base lg:text-lg">{category.tagline || category.description}</p>
      </div>

      <div className={`grid gap-4 lg:gap-6 ${
        variant === 'detailed'
          ? 'grid-cols-1 lg:grid-cols-2'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      }`}>
        {modules.map((module, index) => (
          <SotModuleCard
            key={module.code}
            module={module}
            index={index}
            isVisible={visible}
            variant={variant as any}
          />
        ))}
      </div>
    </section>
  );
}

export function SotModuleShowcase({
  showCategories = true,
  limit,
  highlightOnly = false,
  variant = 'default'
}: SotModuleShowcaseProps) {
  let modules = highlightOnly
    ? SOT_WEBSITE_MODULES.filter(m => m.highlight)
    : SOT_WEBSITE_MODULES;

  if (limit) {
    modules = modules.slice(0, limit);
  }

  if (showCategories && !highlightOnly) {
    return (
      <div className="space-y-16 lg:space-y-20">
        {CATEGORY_ORDER.map((categoryKey) => {
          const categoryModules = modules.filter(m => m.category === categoryKey);
          if (categoryModules.length === 0) return null;
          return <CategorySection key={categoryKey} categoryKey={categoryKey} modules={categoryModules} variant={variant} />;
        })}
      </div>
    );
  }

  // Simple grid without categories
  return (
    <div className={`grid gap-4 lg:gap-6 ${
      variant === 'detailed'
        ? 'grid-cols-1 lg:grid-cols-2'
        : variant === 'compact'
          ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    }`}>
      {modules.map((module, index) => (
        <SotModuleCard
          key={module.code}
          module={module}
          index={index}
          isVisible={true}
          variant={variant}
        />
      ))}
    </div>
  );
}
