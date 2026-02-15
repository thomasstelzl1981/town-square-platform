/**
 * MediaWidgetGrid — 4er-Grid mit Verkaufs-Media-Widgets
 * 
 * Wird in MOD-08 (Suche) und MOD-09 (Beratung) identisch eingesetzt.
 * Klick auf ein Widget öffnet die zugehörige Fullscreen-Präsentation.
 */
import { useState } from 'react';
import { Presentation, Play, Monitor } from 'lucide-react';
import { WidgetGrid } from './WidgetGrid';
import { WidgetCell } from './WidgetCell';
import { MediaWidget } from './MediaWidget';
import { SlideshowViewer } from './slideshow/SlideshowViewer';
import { TITLE_TO_KEY, type PresentationKey } from './slideshow/slideData';

const MEDIA_ITEMS = [
  {
    title: 'Verkaufspräsentation',
    subtitle: 'Unsere Investment-Strategie im Überblick',
    icon: Presentation,
    type: 'presentation' as const,
  },
  {
    title: 'Rendite erklärt',
    subtitle: 'So funktioniert Ihre Kapitalanlage',
    icon: Play,
    type: 'video' as const,
  },
  {
    title: 'Steuervorteil',
    subtitle: 'Steueroptimierung mit Immobilien',
    icon: Play,
    type: 'video' as const,
  },
  {
    title: 'Verwaltung',
    subtitle: 'Unsere Software im Einsatz',
    icon: Monitor,
    type: 'video' as const,
  },
] as const;

export function MediaWidgetGrid() {
  const [activePresentation, setActivePresentation] = useState<PresentationKey | null>(null);

  const handleClick = (title: string) => {
    const key = TITLE_TO_KEY[title];
    if (key) setActivePresentation(key);
  };

  return (
    <>
      <WidgetGrid variant="widget">
        {MEDIA_ITEMS.map((item) => (
          <WidgetCell key={item.title}>
            <MediaWidget
              title={item.title}
              subtitle={item.subtitle}
              icon={item.icon}
              type={item.type}
              onClick={() => handleClick(item.title)}
            />
          </WidgetCell>
        ))}
      </WidgetGrid>

      {activePresentation && (
        <SlideshowViewer
          presentationKey={activePresentation}
          onClose={() => setActivePresentation(null)}
        />
      )}
    </>
  );
}
