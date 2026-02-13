import type { SectionContent, SectionDesign } from './types';

interface ServiceItem {
  title: string;
  description: string;
  icon?: string;
}

interface Props {
  content: SectionContent;
  design: SectionDesign;
  branding?: { primary_color?: string };
}

export function SectionServices({ content, design, branding }: Props) {
  const title = (content.title as string) || 'Unsere Leistungen';
  const items = (content.items as ServiceItem[]) || [];

  return (
    <section className="py-16 px-6" style={{ backgroundColor: design.backgroundColor || 'hsl(var(--background))' }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item, i) => (
            <div key={i} className="flex gap-4 p-6 rounded-xl border border-border/30">
              {item.icon && (
                <div className="text-2xl shrink-0 w-10 h-10 flex items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${branding?.primary_color || 'hsl(var(--primary))'}20` }}
                >
                  {item.icon}
                </div>
              )}
              <div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
