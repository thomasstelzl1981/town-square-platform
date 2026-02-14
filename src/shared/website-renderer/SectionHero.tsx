import type { SectionContent, SectionDesign } from './types';
import { EditableText, EditableImage } from './EditableHelpers';

interface Props {
  content: SectionContent;
  design: SectionDesign;
  branding?: { primary_color?: string };
  editable?: boolean;
  onContentChange?: (field: string, value: any) => void;
}

export function SectionHero({ content, design, branding, editable, onContentChange }: Props) {
  const headline = (content.headline as string) || 'Willkommen';
  const subline = (content.subline as string) || '';
  const ctaText = (content.cta_text as string) || '';
  const ctaLink = (content.cta_link as string) || '#contact';
  const bgImage = content.background_image_url as string;
  const overlayOpacity = (content.overlay_opacity as number) ?? 0.4;
  const up = (f: string, v: any) => onContentChange?.(f, v);

  return (
    <section
      className="relative min-h-[60vh] flex items-center justify-center text-center"
      style={{
        backgroundColor: design.backgroundColor || 'hsl(var(--background))',
        backgroundImage: !editable && bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Background image — editable or static */}
      {bgImage && !editable && (
        <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }} />
      )}
      {editable && (
        <div className="absolute inset-0">
          <EditableImage
            src={bgImage || ''}
            onChange={v => up('background_image_url', v)}
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }} />
        </div>
      )}

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-20">
        {editable ? (
          <EditableText
            value={headline}
            onChange={v => up('headline', v)}
            tag="h1"
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
            style={{ color: bgImage ? '#fff' : 'hsl(var(--foreground))' }}
            placeholder="Headline eingeben..."
          />
        ) : (
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
            style={{ color: bgImage ? '#fff' : 'hsl(var(--foreground))' }}>
            {headline}
          </h1>
        )}

        {editable ? (
          <EditableText
            value={subline}
            onChange={v => up('subline', v)}
            tag="p"
            className="text-lg md:text-xl mb-8 opacity-90"
            style={{ color: bgImage ? '#fff' : 'hsl(var(--muted-foreground))' }}
            placeholder="Subline eingeben..."
          />
        ) : subline ? (
          <p className="text-lg md:text-xl mb-8 opacity-90"
            style={{ color: bgImage ? '#fff' : 'hsl(var(--muted-foreground))' }}>
            {subline}
          </p>
        ) : null}

        {(ctaText || editable) && (
          editable ? (
            <EditableText
              value={ctaText}
              onChange={v => up('cta_text', v)}
              tag="span"
              className="inline-block px-8 py-3 rounded-lg font-semibold text-white"
              style={{ backgroundColor: branding?.primary_color || 'hsl(var(--primary))' }}
              placeholder="Button-Text..."
            />
          ) : ctaText ? (
            <a href={ctaLink}
              className="inline-block px-8 py-3 rounded-lg font-semibold text-white transition-transform hover:scale-105"
              style={{ backgroundColor: branding?.primary_color || 'hsl(var(--primary))' }}>
              {ctaText}
            </a>
          ) : null
        )}
      </div>
    </section>
  );
}
