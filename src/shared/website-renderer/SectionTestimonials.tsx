import type { SectionContent, SectionDesign } from './types';
import { EditableText } from './EditableHelpers';

interface TestimonialItem {
  name: string;
  role?: string;
  text?: string;
  quote?: string;
  avatar_url?: string;
}

interface Props {
  content: SectionContent;
  design: SectionDesign;
  editable?: boolean;
  onContentChange?: (field: string, value: any) => void;
}

export function SectionTestimonials({ content, design, editable, onContentChange }: Props) {
  const title = (content.title as string) || 'Das sagen unsere Kunden';
  const items = (content.items as TestimonialItem[]) || [];
  const up = (f: string, v: any) => onContentChange?.(f, v);

  const updateItem = (idx: number, field: string, value: string) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    onContentChange?.('items', next);
  };

  return (
    <section className="py-16 px-6" style={{ backgroundColor: design.backgroundColor || 'hsl(var(--muted) / 0.3)' }}>
      <div className="max-w-5xl mx-auto">
        {editable ? (
          <EditableText value={title} onChange={v => up('title', v)} tag="h2" className="text-3xl font-bold text-center mb-12" />
        ) : (
          <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => {
            const quoteText = item.quote || item.text || '';
            return (
              <div key={i} className="bg-background rounded-xl p-6 border border-border/30">
                {editable ? (
                  <EditableText value={quoteText} onChange={v => updateItem(i, 'quote', v)} tag="p" className="text-sm text-muted-foreground mb-4 italic" multiline placeholder="Zitat eingeben..." />
                ) : (
                  <p className="text-sm text-muted-foreground mb-4 italic">"{quoteText}"</p>
                )}
                <div className="flex items-center gap-3">
                  {item.avatar_url ? (
                    <img src={item.avatar_url} alt={item.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                      {item.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    {editable ? (
                      <EditableText value={item.name} onChange={v => updateItem(i, 'name', v)} tag="p" className="text-sm font-semibold" />
                    ) : (
                      <p className="text-sm font-semibold">{item.name}</p>
                    )}
                    {editable ? (
                      <EditableText value={item.role || ''} onChange={v => updateItem(i, 'role', v)} tag="p" className="text-xs text-muted-foreground" placeholder="Rolle..." />
                    ) : item.role ? (
                      <p className="text-xs text-muted-foreground">{item.role}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
