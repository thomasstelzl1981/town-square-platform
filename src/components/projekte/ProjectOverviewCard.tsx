/**
 * ProjectOverviewCard — Bilder oben, Facts links + Text rechts
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Home, Car, Ruler, Calendar, Flame, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEMO_PROJECT_DESCRIPTION } from './demoProjectData';

interface ProjectOverviewCardProps {
  isDemo?: boolean;
  projectData?: typeof DEMO_PROJECT_DESCRIPTION;
}

function eur(v: number) {
  return v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export function ProjectOverviewCard({ isDemo, projectData }: ProjectOverviewCardProps) {
  const data = projectData || DEMO_PROJECT_DESCRIPTION;

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
      <CardContent className="p-6 space-y-4">
        {/* Headline row */}
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

        {/* 4 Image Thumbnails */}
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="relative bg-muted/30 rounded-lg h-[140px] flex items-center justify-center"
            >
              <Building2 className="h-8 w-8 text-muted-foreground/30" />
              {isDemo && i === 0 && (
                <span className="absolute bottom-1.5 left-1.5 text-[9px] text-muted-foreground/40">Beispiel</span>
              )}
            </div>
          ))}
        </div>

        {/* Facts left + Description right */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t">
          {/* Left: Key Facts */}
          <div className="space-y-2">
            {keyFacts.map((fact) => (
              <div key={fact.label} className="flex items-center gap-2.5 py-1">
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

          {/* Right: Description */}
          <div className="md:col-span-2 space-y-2.5 text-sm text-muted-foreground leading-relaxed">
            {data.description.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
