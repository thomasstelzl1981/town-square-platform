import type { SectionContent, SectionDesign } from './types';

interface Props {
  content: SectionContent;
  design: SectionDesign;
}

export function SectionAbout({ content, design }: Props) {
  const title = (content.title as string) || 'Über uns';
  const text = (content.text as string) || '';
  const imageUrl = content.image_url as string;

  return (
    <section className="py-16 px-6" style={{ backgroundColor: design.backgroundColor || 'hsl(var(--background))' }}>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-bold mb-6">{title}</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{text}</p>
        </div>
        {imageUrl && (
          <div className="rounded-xl overflow-hidden">
            <img src={imageUrl} alt={title} className="w-full h-auto object-cover" />
          </div>
        )}
      </div>
    </section>
  );
}
