import type { SectionContent, SectionDesign } from './types';

interface TestimonialItem {
  name: string;
  role?: string;
  text: string;
  avatar_url?: string;
}

interface Props {
  content: SectionContent;
  design: SectionDesign;
}

export function SectionTestimonials({ content, design }: Props) {
  const title = (content.title as string) || 'Das sagen unsere Kunden';
  const items = (content.items as TestimonialItem[]) || [];

  return (
    <section className="py-16 px-6" style={{ backgroundColor: design.backgroundColor || 'hsl(var(--muted) / 0.3)' }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div key={i} className="bg-background rounded-xl p-6 border border-border/30">
              <p className="text-sm text-muted-foreground mb-4 italic">"{item.text}"</p>
              <div className="flex items-center gap-3">
                {item.avatar_url ? (
                  <img src={item.avatar_url} alt={item.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                    {item.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  {item.role && <p className="text-xs text-muted-foreground">{item.role}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
