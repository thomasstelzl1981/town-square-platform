/**
 * ProjectOverviewCard — ImmoScout24-style global property overview
 * Shows image gallery placeholder + description + key facts grid
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Home, Car, Ruler, Calendar, Flame, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEMO_PROJECT_DESCRIPTION } from './demoProjectData';

interface ProjectOverviewCardProps {
  isDemo?: boolean;
  /** Future: pass real project data here */
  projectData?: typeof DEMO_PROJECT_DESCRIPTION;
}

function eur(v: number) {
  return v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export function ProjectOverviewCard({ isDemo, projectData }: ProjectOverviewCardProps) {
  const data = projectData || DEMO_PROJECT_DESCRIPTION;
  const [activeImage, setActiveImage] = useState(0);

  const keyFacts = [
    { icon: Home, label: 'Wohneinheiten', value: `${data.total_units} WE` },
    { icon: Car, label: 'Stellplätze', value: `${data.total_parking_spaces} TG` },
    { icon: Ruler, label: 'Wohnfläche', value: `ca. ${data.total_living_area.toLocaleString('de-DE')} m²` },
    { icon: Calendar, label: 'Baujahr', value: `${data.year_built} / San. ${data.renovation_year}` },
    { icon: Flame, label: 'Heizart', value: data.heating_type },
    { icon: Zap, label: 'Energieklasse', value: data.energy_class },
  ];

  return (
    <Card className={cn('overflow-hidden', isDemo && 'opacity-60 select-none')}>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
          {/* Left: Image Gallery Placeholder (2/5) */}
          <div className="md:col-span-2 relative bg-muted/30 min-h-[300px] md:min-h-[400px] flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-3">
                <Building2 className="h-16 w-16 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground/50">
                  {isDemo ? 'Beispielbilder' : 'Bilder hochladen'}
                </p>
              </div>
            </div>

            {/* Navigation dots */}
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
              {Array.from({ length: data.images_count }).map((_, i) => (
                <button
                  key={i}
                  className={cn(
                    'w-2.5 h-2.5 rounded-full transition-colors',
                    i === activeImage ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                  onClick={() => setActiveImage(i)}
                />
              ))}
            </div>

            {/* Prev/Next arrows */}
            {data.images_count > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                  onClick={() => setActiveImage((prev) => (prev - 1 + data.images_count) % data.images_count)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                  onClick={() => setActiveImage((prev) => (prev + 1) % data.images_count)}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Right: Description + Key Facts (3/5) */}
          <div className="md:col-span-3 p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold tracking-tight">{data.headline}</h3>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{data.address}, {data.postal_code} {data.city}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-primary">{eur(data.total_sale_price)}</p>
                <p className="text-[11px] text-muted-foreground">Gesamtverkaufspreis</p>
              </div>
            </div>

            {isDemo && (
              <Badge variant="outline" className="text-[10px] italic text-muted-foreground">Musterdaten</Badge>
            )}

            {/* Description paragraphs */}
            <div className="space-y-2.5 text-sm text-muted-foreground leading-relaxed">
              {data.description.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {/* Key facts grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t">
              {keyFacts.map((fact) => (
                <div key={fact.label} className="flex items-start gap-2.5 py-1.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
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
        </div>
      </CardContent>
    </Card>
  );
}
