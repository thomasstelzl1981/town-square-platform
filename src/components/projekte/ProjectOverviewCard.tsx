/**
 * ProjectOverviewCard — 2-Column: Slideshow + Facts left, Description right
 * Supports dynamic project data via selectedProject prop
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, Car, Ruler, Calendar, Flame, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
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

interface ProjectOverviewCardProps {
  isDemo?: boolean;
  selectedProject?: ProjectPortfolioRow;
  unitCount?: number;
  projectData?: typeof DEMO_PROJECT_DESCRIPTION;
}

function eur(v: number) {
  return v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export function ProjectOverviewCard({ isDemo, selectedProject, unitCount, projectData }: ProjectOverviewCardProps) {
  const data = projectData || DEMO_PROJECT_DESCRIPTION;
  const [activeIdx, setActiveIdx] = useState(0);
  const images = DEMO_PROJECT_IMAGES;

  // If we have a real selected project, override headline/address/units
  const headline = selectedProject?.name || data.headline;
  const address = selectedProject ? `${selectedProject.postal_code || ''} ${selectedProject.city || ''}`.trim() : `${data.address}, ${data.postal_code} ${data.city}`;
  const totalUnits = unitCount ?? data.total_units;
  const totalSalePrice = selectedProject?.purchase_price || data.total_sale_price;

  const prev = () => setActiveIdx((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setActiveIdx((i) => (i === images.length - 1 ? 0 : i + 1));

  const keyFacts = [
    { icon: Home, label: 'Wohneinheiten', value: `${totalUnits} WE` },
    { icon: Car, label: 'Stellplätze', value: `${data.total_parking_spaces} TG` },
    { icon: Ruler, label: 'Wohnfläche', value: `ca. ${data.total_living_area.toLocaleString('de-DE')} m²` },
    { icon: Calendar, label: 'Baujahr', value: `${data.year_built} / San. ${data.renovation_year}` },
    { icon: Flame, label: 'Heizart', value: data.heating_type },
    { icon: Zap, label: 'Energieklasse', value: data.energy_class },
  ];

  return (
    <Card className={cn('overflow-hidden', isDemo && 'opacity-60 select-none')}>
      <CardContent className="p-6 space-y-4">
        {/* Headline row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight">{headline}</h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{address}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-primary">{eur(totalSalePrice)}</p>
            <p className="text-[11px] text-muted-foreground">Gesamtverkaufspreis</p>
          </div>
        </div>

        {isDemo && (
          <Badge variant="outline" className="text-[10px] italic text-muted-foreground">Musterdaten</Badge>
        )}

        {/* 2-Column: Left (Slideshow + Facts) | Right (Description) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-2 border-t">
          {/* Left column — 2/5 */}
          <div className="md:col-span-2 space-y-4">
            {/* Slideshow */}
            <div className="relative rounded-xl overflow-hidden bg-muted/30">
              <img
                src={IMAGE_MAP[images[activeIdx].importKey]}
                alt={images[activeIdx].label}
                className="w-full h-[200px] object-cover"
              />
              {/* Label */}
              <span className="absolute top-2 left-2 bg-background/70 backdrop-blur-sm text-xs font-medium px-2 py-0.5 rounded-md">
                {images[activeIdx].label}
              </span>
              {/* Arrows */}
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
              {/* Dots */}
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

          {/* Right column — 3/5: Description full height */}
          <div className="md:col-span-3 space-y-2.5 text-sm text-muted-foreground leading-relaxed">
            {data.description.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
