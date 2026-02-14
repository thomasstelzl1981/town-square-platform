import type { SectionContent, SectionDesign } from './types';
import { EditableText } from './EditableHelpers';

interface ServiceItem {
  title: string;
  description: string;
  icon?: string;
}

interface Props {
  content: SectionContent;
  design: SectionDesign;
  branding?: { primary_color?: string };
  editable?: boolean;
  onContentChange?: (field: string, value: any) => void;
}

export function SectionServices({ content, design, branding, editable, onContentChange }: Props) {
  const title = (content.title as string) || 'Unsere Leistungen';
  const items = (content.items as ServiceItem[]) || [];
  const up = (f: string, v: any) => onContentChange?.(f, v);

  const updateItem = (idx: number, field: string, value: string) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    onContentChange?.('items', next);
  };

  return (
    <section className="py-16 px-6" style={{ backgroundColor: design.backgroundColor || 'hsl(var(--background))' }}>
      <div className="max-w-5xl mx-auto">
        {editable ? (
          <EditableText value={title} onChange={v => up('title', v)} tag="h2" className="text-3xl font-bold text-center mb-12" />
        ) : (
          <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item, i) => (
            <div key={i} className="flex gap-4 p-6 rounded-xl border border-border/30">
              {(item.icon || editable) && (
                <div className="text-2xl shrink-0 w-10 h-10 flex items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${branding?.primary_color || 'hsl(var(--primary))'}20` }}>
                  {editable ? (
                    <EditableText value={item.icon || ''} onChange={v => updateItem(i, 'icon', v)} tag="span" placeholder="🔹" />
                  ) : item.icon}
                </div>
              )}
              <div>
                {editable ? (
                  <EditableText value={item.title} onChange={v => updateItem(i, 'title', v)} tag="h3" className="font-semibold mb-1" />
                ) : (
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                )}
                {editable ? (
                  <EditableText value={item.description} onChange={v => updateItem(i, 'description', v)} tag="p" className="text-sm text-muted-foreground" multiline />
                ) : (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
