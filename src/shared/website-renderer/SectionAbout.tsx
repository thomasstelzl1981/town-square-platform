import type { SectionContent, SectionDesign } from './types';
import { EditableText, EditableImage } from './EditableHelpers';

interface Props {
  content: SectionContent;
  design: SectionDesign;
  editable?: boolean;
  onContentChange?: (field: string, value: any) => void;
}

export function SectionAbout({ content, design, editable, onContentChange }: Props) {
  const title = (content.title as string) || 'Über uns';
  const text = (content.text as string) || '';
  const imageUrl = content.image_url as string;
  const up = (f: string, v: any) => onContentChange?.(f, v);

  return (
    <section className="py-16 px-6" style={{ backgroundColor: design.backgroundColor || 'hsl(var(--background))' }}>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          {editable ? (
            <EditableText value={title} onChange={v => up('title', v)} tag="h2" className="text-3xl font-bold mb-6" />
          ) : (
            <h2 className="text-3xl font-bold mb-6">{title}</h2>
          )}
          {editable ? (
            <EditableText value={text} onChange={v => up('text', v)} tag="p" className="text-muted-foreground leading-relaxed whitespace-pre-line" multiline placeholder="Beschreiben Sie Ihr Unternehmen..." />
          ) : (
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{text}</p>
          )}
        </div>
        {editable ? (
          <div className="rounded-xl overflow-hidden">
            <EditableImage src={imageUrl || ''} onChange={v => up('image_url', v)} />
          </div>
        ) : imageUrl ? (
          <div className="rounded-xl overflow-hidden">
            <img src={imageUrl} alt={title} className="w-full h-auto object-cover" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
