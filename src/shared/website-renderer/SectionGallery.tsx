import type { SectionContent, SectionDesign } from './types';
import { EditableText, EditableImage } from './EditableHelpers';

interface GalleryItem {
  image_url: string;
  caption?: string;
}

interface Props {
  content: SectionContent;
  design: SectionDesign;
  editable?: boolean;
  onContentChange?: (field: string, value: any) => void;
}

export function SectionGallery({ content, design, editable, onContentChange }: Props) {
  const title = (content.title as string) || 'Galerie';
  const items = (content.items as GalleryItem[]) || [];
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl overflow-hidden group">
              {editable ? (
                <EditableImage
                  src={item.image_url}
                  onChange={v => updateItem(i, 'image_url', v)}
                  className="w-full aspect-square"
                />
              ) : (
                <img
                  src={item.image_url}
                  alt={item.caption || `Bild ${i + 1}`}
                  className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
              {editable ? (
                <EditableText value={item.caption || ''} onChange={v => updateItem(i, 'caption', v)} tag="p" className="text-xs text-muted-foreground mt-2 text-center" placeholder="Bildunterschrift..." />
              ) : item.caption ? (
                <p className="text-xs text-muted-foreground mt-2 text-center">{item.caption}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
