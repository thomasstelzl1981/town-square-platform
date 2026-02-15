/**
 * MediaWidgetGrid — 4er-Grid mit Media-Widgets
 * 
 * variant="beratung" (default): Kunden-Präsentationen (MOD-08/09 Beratung)
 * variant="schulung": Berater-Ausbildung (MOD-09 Katalog)
 */
import { useState } from 'react';
import { Presentation, Play, Monitor, BookOpen, GraduationCap, MessageSquare, Laptop } from 'lucide-react';
import { WidgetGrid } from './WidgetGrid';
import { WidgetCell } from './WidgetCell';
import { MediaWidget } from './MediaWidget';
import { SlideshowViewer } from './slideshow/SlideshowViewer';
import { TITLE_TO_KEY, type PresentationKey } from './slideshow/slideData';

const BERATUNG_ITEMS = [
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

const SCHULUNG_ITEMS = [
  {
    title: 'Verkaufsleitfaden',
    subtitle: 'Gesprächsführung, Einwandbehandlung & Abschluss',
    icon: BookOpen,
    type: 'presentation' as const,
  },
  {
    title: 'Fachwissen Kapitalanlage',
    subtitle: 'AfA, Hebelwirkung, Finanzierung & Steuer',
    icon: GraduationCap,
    type: 'presentation' as const,
  },
  {
    title: 'Gesprächsleitfaden',
    subtitle: 'Bedarfsanalyse, Fragetechniken & Abläufe',
    icon: MessageSquare,
    type: 'presentation' as const,
  },
  {
    title: 'Plattform-Schulung',
    subtitle: 'Investment Engine, Marktplatz, DMS & Beratung',
    icon: Laptop,
    type: 'presentation' as const,
  },
] as const;

interface MediaWidgetGridProps {
  variant?: 'beratung' | 'schulung';
}

export function MediaWidgetGrid({ variant = 'beratung' }: MediaWidgetGridProps) {
  const [activePresentation, setActivePresentation] = useState<PresentationKey | null>(null);
  const items = variant === 'schulung' ? SCHULUNG_ITEMS : BERATUNG_ITEMS;

  const handleClick = (title: string) => {
    const key = TITLE_TO_KEY[title];
    if (key) setActivePresentation(key);
  };

  return (
    <>
      <WidgetGrid variant="widget">
        {items.map((item) => (
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
