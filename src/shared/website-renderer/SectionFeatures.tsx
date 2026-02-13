import type { SectionContent, SectionDesign } from './types';

interface FeatureItem {
  icon?: string;
  title: string;
  description: string;
}

interface Props {
  content: SectionContent;
  design: SectionDesign;
}

export function SectionFeatures({ content, design }: Props) {
  const title = (content.title as string) || 'Unsere Vorteile';
  const items = (content.items as FeatureItem[]) || [];

  return (
    <section className="py-16 px-6" style={{ backgroundColor: design.backgroundColor || 'hsl(var(--muted) / 0.3)' }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'hsl(var(--foreground))' }}>
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.length > 0 ? items.map((item, i) => (
            <div key={i} className="text-center p-6 rounded-xl bg-background border border-border/30">
              {item.icon && <div className="text-3xl mb-4">{item.icon}</div>}
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          )) : (
            <div className="col-span-full text-center text-muted-foreground text-sm">
              Fügen Sie Features hinzu
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
