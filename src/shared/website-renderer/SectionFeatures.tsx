import type { SectionContent, SectionDesign } from './types';
import { EditableText } from './EditableHelpers';

interface FeatureItem {
  icon?: string;
  title: string;
  description: string;
}

interface Props {
  content: SectionContent;
  design: SectionDesign;
  editable?: boolean;
  onContentChange?: (field: string, value: any) => void;
}

export function SectionFeatures({ content, design, editable, onContentChange }: Props) {
  const title = (content.title as string) || 'Unsere Vorteile';
  const items = (content.items as FeatureItem[]) || [];
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
          <EditableText value={title} onChange={v => up('title', v)} tag="h2" className="text-3xl font-bold text-center mb-12" style={{ color: 'hsl(var(--foreground))' }} />
        ) : (
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'hsl(var(--foreground))' }}>{title}</h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.length > 0 ? items.map((item, i) => (
            <div key={i} className="text-center p-6 rounded-xl bg-background border border-border/30">
              {editable ? (
                <EditableText value={item.icon || ''} onChange={v => updateItem(i, 'icon', v)} tag="span" className="text-3xl mb-4 inline-block" placeholder="🔹" />
              ) : item.icon ? (
                <div className="text-3xl mb-4">{item.icon}</div>
              ) : null}
              {editable ? (
                <EditableText value={item.title} onChange={v => updateItem(i, 'title', v)} tag="h3" className="text-lg font-semibold mb-2" />
              ) : (
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              )}
              {editable ? (
                <EditableText value={item.description} onChange={v => updateItem(i, 'description', v)} tag="p" className="text-sm text-muted-foreground" multiline />
              ) : (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}
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
