import type { SectionContent, SectionDesign } from './types';

interface Props {
  content: SectionContent;
  design: SectionDesign;
  branding?: { primary_color?: string };
}

export function SectionHero({ content, design, branding }: Props) {
  const headline = (content.headline as string) || 'Willkommen';
  const subline = (content.subline as string) || '';
  const ctaText = (content.cta_text as string) || '';
  const ctaLink = (content.cta_link as string) || '#contact';
  const bgImage = content.background_image_url as string;
  const overlayOpacity = (content.overlay_opacity as number) ?? 0.4;

  return (
    <section
      className="relative min-h-[60vh] flex items-center justify-center text-center"
      style={{
        backgroundColor: design.backgroundColor || 'hsl(var(--background))',
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {bgImage && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
          style={{ color: bgImage ? '#fff' : 'hsl(var(--foreground))' }}
        >
          {headline}
        </h1>
        {subline && (
          <p className="text-lg md:text-xl mb-8 opacity-90"
            style={{ color: bgImage ? '#fff' : 'hsl(var(--muted-foreground))' }}
          >
            {subline}
          </p>
        )}
        {ctaText && (
          <a
            href={ctaLink}
            className="inline-block px-8 py-3 rounded-lg font-semibold text-white transition-transform hover:scale-105"
            style={{ backgroundColor: branding?.primary_color || 'hsl(var(--primary))' }}
          >
            {ctaText}
          </a>
        )}
      </div>
    </section>
  );
}
