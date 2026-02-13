import type { SectionContent, SectionDesign } from './types';

interface GalleryItem {
  image_url: string;
  caption?: string;
}

interface Props {
  content: SectionContent;
  design: SectionDesign;
}

export function SectionGallery({ content, design }: Props) {
  const title = (content.title as string) || 'Galerie';
  const items = (content.items as GalleryItem[]) || [];

  return (
    <section className="py-16 px-6" style={{ backgroundColor: design.backgroundColor || 'hsl(var(--background))' }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl overflow-hidden group">
              <img
                src={item.image_url}
                alt={item.caption || `Bild ${i + 1}`}
                className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {item.caption && (
                <p className="text-xs text-muted-foreground mt-2 text-center">{item.caption}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
