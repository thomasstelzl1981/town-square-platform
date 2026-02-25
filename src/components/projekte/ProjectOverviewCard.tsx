/**
 * ProjectOverviewCard — 2-Column: Slideshow + Facts left, Description right
 * Shows real project data from DB. Demo fallback ONLY when isDemo=true.
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, Car, Ruler, Calendar, Flame, Zap, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEMO_PROJECT_DESCRIPTION, DEMO_PROJECT_IMAGES } from './demoProjectData';
import type { ProjectPortfolioRow } from '@/types/projekte';

import demoExterior from '@/assets/demo-project-exterior.jpg';
import demoLivingroom from '@/assets/demo-project-livingroom.jpg';
import demoKitchen from '@/assets/demo-project-kitchen.jpg';
import demoBathroom from '@/assets/demo-project-bathroom.jpg';

const IMAGE_MAP: Record<string, string> = {
  exterior: demoExterior,
  livingroom: demoLivingroom,
  kitchen: demoKitchen,
  bathroom: demoBathroom,
};

/** Extended props — real project data comes from DB fields */
interface ProjectOverviewCardProps {
  isDemo?: boolean;
  selectedProject?: ProjectPortfolioRow;
  unitCount?: number;
  /** Full project record from dev_projects (includes description, address, etc.) */
  fullProject?: {
    description?: string | null;
    address?: string | null;
    city?: string | null;
    postal_code?: string | null;
    purchase_price?: number | null;
    total_sale_target?: number | null;
    total_units_count?: number;
    intake_data?: Record<string, unknown> | null;
  };
}

function eur(v: number) {
  return v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export function ProjectOverviewCard({ isDemo, selectedProject, unitCount, fullProject }: ProjectOverviewCardProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  // ── STRICT RULE: Demo data ONLY when isDemo=true ──────────────────────
  const demoData = isDemo ? DEMO_PROJECT_DESCRIPTION : null;
  const images = isDemo ? DEMO_PROJECT_IMAGES : [];

  // Headline + Address: prefer selectedProject, then fullProject, then demo
  const headline = selectedProject?.name || demoData?.headline || '—';
  const address = selectedProject
    ? [fullProject?.address, `${selectedProject.postal_code || ''} ${selectedProject.city || ''}`].filter(Boolean).join(', ').trim()
    : demoData
      ? `${demoData.address}, ${demoData.postal_code} ${demoData.city}`
      : '—';

  const totalUnits = unitCount ?? selectedProject?.total_units_count ?? demoData?.total_units ?? 0;
  const totalSalePrice = selectedProject?.total_sale_target ?? selectedProject?.purchase_price ?? demoData?.total_sale_price ?? 0;

  // Description: real project from DB, or demo paragraphs
  const descriptionParagraphs: string[] = (() => {
    if (fullProject?.description) return [fullProject.description];
    if (demoData) return demoData.description;
    return [];
  })();

  // Key Facts: real data or demo or "—"
  const keyFacts = [
    { icon: Home, label: 'Wohneinheiten', value: `${totalUnits} WE` },
    { icon: Car, label: 'Stellplätze', value: demoData ? `${demoData.total_parking_spaces} TG` : '—' },
    { icon: Ruler, label: 'Wohnfläche', value: demoData ? `ca. ${demoData.total_living_area.toLocaleString('de-DE')} m²` : '—' },
    { icon: Calendar, label: 'Baujahr', value: demoData ? `${demoData.year_built} / San. ${demoData.renovation_year}` : '—' },
    { icon: Flame, label: 'Heizart', value: demoData?.heating_type || '—' },
    { icon: Zap, label: 'Energieklasse', value: demoData?.energy_class || '—' },
  ];

  const prev = () => setActiveIdx((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setActiveIdx((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <Card className={cn('overflow-hidden', isDemo && 'opacity-60 select-none')}>
      <CardContent className="p-6 space-y-4">
        {/* Headline row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight">{headline}</h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{address || '—'}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            {totalSalePrice > 0 ? (
              <>
                <p className="text-lg font-bold text-primary">{eur(totalSalePrice)}</p>
                <p className="text-[11px] text-muted-foreground">Gesamtverkaufspreis</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">Preis ausstehend</p>
            )}
          </div>
        </div>

        {isDemo && (
          <Badge variant="outline" className="text-[10px] italic text-muted-foreground">Musterdaten</Badge>
        )}

        {/* 2-Column: Left (Slideshow + Facts) | Right (Description) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-2 border-t">
          {/* Left column — 2/5 */}
          <div className="md:col-span-2 space-y-4">
            {/* Slideshow — only if images available (demo mode) */}
            {images.length > 0 ? (
              <div className="relative rounded-xl overflow-hidden bg-muted/30">
                <img
                  src={IMAGE_MAP[images[activeIdx].importKey]}
                  alt={images[activeIdx].label}
                  className="w-full h-[200px] object-cover"
                />
                <span className="absolute top-2 left-2 bg-background/70 backdrop-blur-sm text-xs font-medium px-2 py-0.5 rounded-md">
                  {images[activeIdx].label}
                </span>
                <button
                  onClick={prev}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center hover:bg-background/80 transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center hover:bg-background/80 transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIdx(i)}
                      className={cn(
                        'w-2 h-2 rounded-full transition',
                        i === activeIdx ? 'bg-primary' : 'bg-background/60'
                      )}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-muted/20 border border-dashed border-muted-foreground/20 h-[200px] flex flex-col items-center justify-center gap-2">
                <ImageOff className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground/60">Bilder im DMS hinterlegen</p>
              </div>
            )}

            {/* Key Facts 2x3 grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {keyFacts.map((fact) => (
                <div key={fact.label} className="flex items-center gap-2 py-1">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <fact.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">{fact.label}</p>
                    <p className="text-xs font-medium">{fact.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — 3/5: Description */}
          <div className="md:col-span-3 space-y-2.5 text-sm text-muted-foreground leading-relaxed">
            {descriptionParagraphs.length > 0 ? (
              descriptionParagraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))
            ) : (
              <p className="italic text-muted-foreground/60">
                Keine Beschreibung vorhanden. Die Beschreibung wird beim Exposé-Import automatisch generiert.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
