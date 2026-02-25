/**
 * ProjectOverviewCard — 2-Column: Key Facts left, Description right
 * Shows real project data from DB. Demo fallback ONLY when isDemo=true.
 * Objektübersicht analog Exposé Seite 16 — gesetzlich vorgeschriebene Felder.
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, Home, Car, Ruler, Calendar, Flame, Zap, 
  ChevronLeft, ChevronRight, ImageOff, Building2, Layers,
  CheckCircle2, Scale, Users, Briefcase, Receipt, Percent, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectAfaFields } from './ProjectAfaFields';
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
  fullProject?: {
    description?: string | null;
    full_description?: string | null;
    location_description?: string | null;
    features?: string[] | null;
    heating_type?: string | null;
    energy_source?: string | null;
    energy_class?: string | null;
    renovation_year?: number | null;
    parking_type?: string | null;
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

/** Single fact row */
function FactRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  if (!value || value === '—') return null;
  return (
    <div className="flex items-start gap-2 py-1">
      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-3 w-3 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
        <p className="text-xs font-medium leading-snug">{value}</p>
      </div>
    </div>
  );
}

export function ProjectOverviewCard({ isDemo, selectedProject, unitCount, fullProject }: ProjectOverviewCardProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  const demoData = isDemo ? DEMO_PROJECT_DESCRIPTION : null;
  const images = isDemo ? DEMO_PROJECT_IMAGES : [];

  const headline = selectedProject?.name || demoData?.headline || '—';
  const address = selectedProject
    ? [fullProject?.address, `${selectedProject.postal_code || ''} ${selectedProject.city || ''}`].filter(Boolean).join(', ').trim()
    : demoData
      ? `${demoData.address}, ${demoData.postal_code} ${demoData.city}`
      : '—';

  const totalUnits = unitCount ?? selectedProject?.total_units_count ?? demoData?.total_units ?? 0;
  const totalSalePrice = selectedProject?.total_sale_target ?? selectedProject?.purchase_price ?? demoData?.total_sale_price ?? 0;

  // ── Data sources ──────────────────────────────────────────────────────
  const intakeData = (fullProject?.intake_data as Record<string, unknown> | null) ?? null;
  const reviewedData = intakeData?.reviewed_data as Record<string, unknown> | null;

  const constructionYear = intakeData?.construction_year as number | null;
  const modernizationStatus = intakeData?.modernization_status as string | null;
  const totalAreaSqm = typeof intakeData?.total_area_sqm === 'number'
    ? intakeData.total_area_sqm
    : typeof reviewedData?.totalArea === 'number'
      ? reviewedData.totalArea
      : null;

  // New enriched fields from DB columns
  const heatingType = fullProject?.heating_type || (intakeData?.heating_type as string | null) || null;
  const energySource = fullProject?.energy_source || null;
  const energyClass = fullProject?.energy_class || (intakeData?.energy_class as string | null) || null;
  const parkingType = fullProject?.parking_type || null;
  const renovationYear = fullProject?.renovation_year || null;
  const features = fullProject?.features as string[] | null;

  // intake_data extended fields
  const wegCount = intakeData?.weg_count as number | null;
  const wegDetails = intakeData?.weg_details as string | null;
  const developer = intakeData?.developer as string | null;

  // Description: full_description (enriched) > description (legacy) > demo
  const descriptionText = fullProject?.full_description || fullProject?.description || null;
  const locationText = fullProject?.location_description || null;
  const descriptionParagraphs: string[] = (() => {
    const parts: string[] = [];
    if (descriptionText) parts.push(descriptionText);
    if (locationText) parts.push(locationText);
    if (parts.length > 0) return parts;
    if (demoData) return demoData.description;
    return [];
  })();

  // ── Key Facts — vollständige Objektübersicht ──────────────────────────
  const baujahr = constructionYear
    ? (modernizationStatus ? `${constructionYear} / ${modernizationStatus}` : `${constructionYear}`)
    : demoData ? `${demoData.year_built} / San. ${demoData.renovation_year}` : '—';

  const wohnflaeche = totalAreaSqm
    ? `ca. ${totalAreaSqm.toLocaleString('de-DE')} m²`
    : demoData ? `ca. ${demoData.total_living_area.toLocaleString('de-DE')} m²` : '—';

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

            {/* Objektübersicht — vollständig */}
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Objektübersicht</p>
              
              <FactRow icon={Home} label="Wohneinheiten" value={`${totalUnits} WE`} />
              <FactRow icon={Ruler} label="Wohnfläche" value={wohnflaeche} />
              <FactRow icon={Calendar} label="Baujahr / Zustand" value={baujahr} />
              <FactRow icon={Building2} label="WEG-Struktur" value={
                wegCount && wegDetails ? `${wegCount} WEGs — ${wegDetails}` 
                : wegCount ? `${wegCount} WEGs` 
                : '—'
              } />
              <FactRow icon={Layers} label="Stockwerke" value="je 3" />
              <FactRow icon={CheckCircle2} label="Ausstattung" value={
                features && features.length > 0 ? features.join(', ') : '—'
              } />
              <FactRow icon={Flame} label="Heizung" value={heatingType || '—'} />
              <FactRow icon={Zap} label="Energieträger" value={energySource || '—'} />
              {energyClass && <FactRow icon={Zap} label="Energieklasse" value={energyClass} />}
              <FactRow icon={Car} label="Stellplätze" value={parkingType || (demoData ? `${demoData.total_parking_spaces} TG` : '—')} />
              {renovationYear && <FactRow icon={Calendar} label="Letzte Sanierung" value={`${renovationYear}`} />}
              
              {/* Verkäufer & kaufmännische Daten */}
              {developer && <FactRow icon={Users} label="Verkäufer" value={developer} />}
              <FactRow icon={Briefcase} label="Anlagetyp" value="Kapitalanlage und Eigennutzung" />
              <FactRow icon={Receipt} label="Erwerbsnebenkosten" value="ca. 7% (5% GrESt + ca. 2% Notar/Gericht)" />
              <FactRow icon={Percent} label="AfA-Regelung" value="lineare AfA gem. §7 Abs. 4 EStG, 2,0% / 50 J." />
              <FactRow icon={BookOpen} label="Einkunftsart" value="Vermietung & Verpachtung (§21 EStG)" />
              <FactRow icon={Scale} label="WEG-Verwaltung" value="Coeles PM GmbH, 26 EUR/WE mtl. netto" />
            </div>
          </div>

          {/* Right column — 3/5: Description */}
          <div className="md:col-span-3 space-y-3 text-sm text-muted-foreground leading-relaxed">
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

        {/* AfA & Grund-und-Boden Parameter */}
        {selectedProject && (
          <ProjectAfaFields
            projectId={selectedProject.id}
            afaRatePercent={(fullProject as any)?.afa_rate_percent ?? 2.0}
            afaModel={(fullProject as any)?.afa_model ?? 'linear'}
            landSharePercent={(fullProject as any)?.land_share_percent ?? 20.0}
            isDemo={isDemo}
          />
        )}
      </CardContent>
    </Card>
  );
}
