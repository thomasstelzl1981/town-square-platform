/**
 * ProjectLandingHome — Startseite der Projekt-Landing-Page
 * 
 * Hero + Photo Carousel + Object Description + Search Engine + Unit Table
 */
import { useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resolveStorageSignedUrl } from '@/lib/storage-url';
import { Loader2, Building2, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useInvestmentEngine, defaultInput, type CalculationInput } from '@/hooks/useInvestmentEngine';

interface ProjectUnit {
  id: string;
  unit_number: string;
  floor: number | null;
  area_sqm: number | null;
  rooms_count: number | null;
  list_price: number | null;
  rent_net: number | null;
  status: string | null;
}

interface UnitMetrics {
  monthlyBurden: number;
  roiAfterTax: number;
  loanAmount: number;
  yearlyTaxSavings?: number;
}

interface ProjectImage {
  url: string;
  slotKey: string;
}

/** Load ALL signed image URLs from document_links for a project (multi-image) */
async function loadAllProjectImages(projectId: string): Promise<{ hero: string | null; gallery: ProjectImage[] }> {
  let heroUrl: string | null = null;
  const gallery: ProjectImage[] = [];

  const { data: links } = await supabase
    .from('document_links')
    .select('slot_key, documents!inner(id, storage_path)')
    .eq('object_id', projectId)
    .eq('object_type', 'project')
    .eq('link_status', 'linked')
    .order('created_at', { ascending: true });

  if (!links?.length) return { hero: null, gallery: [] };

  for (const link of links) {
    const slotKey = (link as any).slot_key as string;
    if (!slotKey) continue;
    const storagePath = (link as any).documents?.storage_path;
    if (!storagePath) continue;

    const { data } = await supabase.storage
      .from('tenant-documents')
      .createSignedUrl(storagePath, 3600);
    if (!data?.signedUrl) continue;

    const url = resolveStorageSignedUrl(data.signedUrl);

    if (slotKey === 'hero' && !heroUrl) {
      heroUrl = url;
    }

    // Gallery: exterior, interior, surroundings (not hero, not logo)
    if (['exterior', 'interior', 'surroundings'].includes(slotKey)) {
      gallery.push({ url, slotKey });
    }
  }

  return { hero: heroUrl, gallery };
}

// ─── Formatters ─────────────────────────────────────────────────
function eur(v: number) {
  return v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

function eurSigned(v: number) {
  const prefix = v >= 0 ? '+' : '';
  return `${prefix}${v.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €`;
}

function formatFloor(floor: number | null) {
  if (floor === null || floor === undefined) return '–';
  if (floor === 0) return 'EG';
  if (floor < 0) return `${Math.abs(floor)}. UG`;
  return `${floor}. OG`;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  frei: { label: 'Frei', className: 'bg-emerald-100 text-emerald-800' },
  available: { label: 'Frei', className: 'bg-emerald-100 text-emerald-800' },
  reserviert: { label: 'Reserviert', className: 'bg-amber-100 text-amber-800' },
  reserved: { label: 'Reserviert', className: 'bg-amber-100 text-amber-800' },
  verkauft: { label: 'Verkauft', className: 'bg-sky-100 text-sky-800' },
  sold: { label: 'Verkauft', className: 'bg-sky-100 text-sky-800' },
};

export default function ProjectLandingHome() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useState({
    zvE: 60000,
    equity: 50000,
    maritalStatus: 'single' as 'single' | 'married',
    hasChurchTax: false,
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [metricsCache, setMetricsCache] = useState<Record<string, UnitMetrics>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const { calculate } = useInvestmentEngine();

  // Fetch project + units + images
  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project-landing-home', slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data: lp } = await supabase
        .from('landing_pages')
        .select('id, project_id, hero_headline, hero_subheadline, about_text, location_description')
        .eq('slug', slug)
        .in('status', ['draft', 'preview', 'active'])
        .maybeSingle();

      if (!lp?.project_id) return null;

      const { data: project } = await supabase
        .from('dev_projects')
        .select('id, name, city, address, postal_code, description, full_description, total_units_count, total_area_sqm, construction_year, afa_model, afa_rate_percent, grest_rate_percent, notary_rate_percent')
        .eq('id', lp.project_id)
        .maybeSingle();

      if (!project) return null;

      const { data: units } = await supabase
        .from('dev_project_units')
        .select('id, unit_number, floor, area_sqm, rooms_count, list_price, rent_net, status')
        .eq('project_id', project.id)
        .order('unit_number', { ascending: true });

      const images = await loadAllProjectImages(project.id);

      return {
        landingPage: lp,
        project: project as any,
        units: (units || []) as unknown as ProjectUnit[],
        heroImageUrl: images.hero,
        galleryImages: images.gallery,
      };
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  const availableUnits = useMemo(() =>
    (projectData?.units || []).filter(u => u.status !== 'verkauft'),
    [projectData?.units]
  );

  const handleSearch = useCallback(async () => {
    if (!availableUnits.length) return;
    setIsCalculating(true);
    setHasSearched(true);

    const project = projectData?.project;
    const newCache: Record<string, UnitMetrics> = {};

    await Promise.all(availableUnits.map(async (unit) => {
      const price = unit.list_price;
      if (!price) return;
      const monthlyRent = unit.rent_net || (price * 0.04 / 12);

      const input: CalculationInput = {
        ...defaultInput,
        purchasePrice: price,
        monthlyRent,
        equity: searchParams.equity,
        taxableIncome: searchParams.zvE,
        maritalStatus: searchParams.maritalStatus,
        hasChurchTax: searchParams.hasChurchTax,
        ...(project?.afa_model && { afaModel: project.afa_model }),
        ...(project?.afa_rate_percent && { afaRate: project.afa_rate_percent }),
        ...(project?.grest_rate_percent && { transferTaxRate: project.grest_rate_percent }),
        ...(project?.notary_rate_percent && { notaryRate: project.notary_rate_percent }),
      };

      const result = await calculate(input);
      if (result) {
        newCache[unit.id] = {
          monthlyBurden: result.summary.monthlyBurden,
          roiAfterTax: result.summary.roiAfterTax,
          loanAmount: result.summary.loanAmount,
          yearlyTaxSavings: result.summary.yearlyTaxSavings,
        };
      }
    }));

    setMetricsCache(newCache);
    setIsCalculating(false);
  }, [availableUnits, searchParams, calculate, projectData?.project]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(210,80%,55%)]" />
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="text-center py-24">
        <Building2 className="w-12 h-12 mx-auto text-[hsl(215,16%,47%)] mb-4" />
        <h2 className="text-xl font-semibold text-[hsl(220,20%,10%)]">Projekt nicht gefunden</h2>
        <p className="text-[hsl(215,16%,47%)] mt-2">Diese Projekt-Seite existiert nicht oder ist nicht aktiv.</p>
      </div>
    );
  }

  const { landingPage, project, heroImageUrl, galleryImages } = projectData;
  const aboutText = (landingPage as any).about_text || landingPage.location_description || project.full_description || project.description || '';

  // Gallery carousel
  const galleryCount = galleryImages.length;
  const prevImage = () => setCarouselIndex(i => (i - 1 + galleryCount) % galleryCount);
  const nextImage = () => setCarouselIndex(i => (i + 1) % galleryCount);

  // Summary for table footer
  const totalArea = availableUnits.reduce((s, u) => s + (u.area_sqm || 0), 0);
  const totalPrice = availableUnits.reduce((s, u) => s + (u.list_price || 0), 0);
  const totalRentAnnual = availableUnits.reduce((s, u) => s + (u.rent_net || 0) * 12, 0);
  const avgYield = totalPrice > 0 ? (totalRentAnnual / totalPrice) * 100 : 0;
  const calculatedUnits = availableUnits.filter(u => metricsCache[u.id]);
  const avgBurden = calculatedUnits.length > 0
    ? calculatedUnits.reduce((s, u) => s + (metricsCache[u.id]?.monthlyBurden || 0), 0) / calculatedUnits.length
    : 0;

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative h-[400px] flex items-end bg-cover bg-center"
        style={{
          backgroundImage: heroImageUrl
            ? `linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%), url(${heroImageUrl})`
            : 'linear-gradient(135deg, hsl(220,20%,15%) 0%, hsl(220,30%,25%) 100%)',
        }}
      >
        <div className="w-full px-6 lg:px-10 pb-10">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
            {landingPage.hero_headline || project.name}
          </h1>
          {landingPage.hero_subheadline && (
            <p className="text-lg md:text-xl text-white/80 max-w-2xl">
              {landingPage.hero_subheadline}
            </p>
          )}
          {project.city && (
            <div className="flex items-center gap-2 mt-4 text-white/70">
              <MapPin className="h-4 w-4" />
              <span>{[project.address, project.postal_code, project.city].filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>
      </section>

      {/* Photo Carousel + Object Description (two-column) */}
      <section className="px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Foto-Carousel */}
          <div className="relative rounded-2xl overflow-hidden bg-[hsl(210,30%,97%)] aspect-[4/3]">
            {galleryCount > 0 ? (
              <>
                <img
                  src={galleryImages[carouselIndex].url}
                  alt={`Projektbild ${carouselIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                {galleryCount > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-medium">
                      {carouselIndex + 1}/{galleryCount}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="h-16 w-16 text-[hsl(215,16%,47%)]" />
              </div>
            )}
          </div>

          {/* Right: Object Description + Key Facts */}
          <div className="flex flex-col justify-center">
            <h2 className="text-xl font-bold text-[hsl(220,20%,10%)] mb-3">Objektbeschreibung</h2>
            {aboutText ? (
              <p className="text-sm text-[hsl(215,16%,47%)] leading-relaxed line-clamp-5">
                {aboutText}
              </p>
            ) : (
              <p className="text-sm text-[hsl(215,16%,47%)] italic">Keine Beschreibung verfügbar.</p>
            )}

            {/* Key Facts as inline badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              {project.total_units_count && (
                <Badge variant="secondary" className="text-xs">{project.total_units_count} Einheiten</Badge>
              )}
              {project.total_area_sqm && (
                <Badge variant="secondary" className="text-xs">{Math.round(project.total_area_sqm)} m²</Badge>
              )}
              {project.construction_year && (
                <Badge variant="secondary" className="text-xs">Baujahr {project.construction_year}</Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {availableUnits.filter(u => u.status === 'frei').length} verfügbar
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Search Engine */}
      <section className="px-6 lg:px-10">
        <Card className="shadow-xl border-0">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-[hsl(215,16%,47%)] uppercase tracking-wide mb-4">
              Investment-Rechner
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-xs font-medium text-[hsl(215,16%,47%)] mb-1 block">Zu versteuerndes Einkommen</label>
                <input type="number" value={searchParams.zvE} onChange={(e) => setSearchParams(p => ({ ...p, zvE: parseInt(e.target.value) || 0 }))} className="w-full h-10 px-3 rounded-lg border border-[hsl(214,32%,91%)] bg-white text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-[hsl(215,16%,47%)] mb-1 block">Eigenkapital</label>
                <input type="number" value={searchParams.equity} onChange={(e) => setSearchParams(p => ({ ...p, equity: parseInt(e.target.value) || 0 }))} className="w-full h-10 px-3 rounded-lg border border-[hsl(214,32%,91%)] bg-white text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-[hsl(215,16%,47%)] mb-1 block">Familienstand</label>
                <select value={searchParams.maritalStatus} onChange={(e) => setSearchParams(p => ({ ...p, maritalStatus: e.target.value as 'single' | 'married' }))} className="w-full h-10 px-3 rounded-lg border border-[hsl(214,32%,91%)] bg-white text-sm">
                  <option value="single">Ledig</option>
                  <option value="married">Verheiratet</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm cursor-pointer h-10">
                  <input type="checkbox" checked={searchParams.hasChurchTax} onChange={(e) => setSearchParams(p => ({ ...p, hasChurchTax: e.target.checked }))} className="rounded" />
                  <span>Kirchensteuer</span>
                </label>
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} disabled={isCalculating} className="w-full h-10 rounded-lg bg-[hsl(220,20%,10%)] hover:bg-[hsl(220,20%,20%)]">
                  {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Berechnen'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Units Table */}
      <section className="px-6 lg:px-10 py-8 pb-16">
        <h2 className="text-2xl font-bold text-[hsl(220,20%,10%)] mb-6">
          Verfügbare Einheiten
          <span className="text-base font-normal text-[hsl(215,16%,47%)] ml-2">({availableUnits.length})</span>
        </h2>

        {!hasSearched ? (
          <div className="text-center py-12 bg-[hsl(210,30%,97%)] rounded-2xl">
            <Building2 className="w-12 h-12 mx-auto text-[hsl(215,16%,47%)] mb-4" />
            <h3 className="text-lg font-semibold text-[hsl(220,20%,10%)] mb-2">Investment-Berechnung starten</h3>
            <p className="text-[hsl(215,16%,47%)] max-w-md mx-auto">
              Geben Sie Ihr Einkommen und Eigenkapital ein, um die individuelle Monatsbelastung nach Steuer zu berechnen.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[hsl(214,32%,91%)] bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-[hsl(210,30%,97%)]">
                    <th className="px-3 py-2.5 text-left font-semibold text-[hsl(215,16%,47%)]">WE-Nr</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-[hsl(215,16%,47%)]">Zimmer</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-[hsl(215,16%,47%)]">Etage</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-[hsl(215,16%,47%)]">Fläche m²</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-[hsl(215,16%,47%)]">Kaufpreis</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-[hsl(215,16%,47%)]">Miete/Mo</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-[hsl(215,16%,47%)]">Bruttorendite</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-[hsl(215,16%,47%)]">Steuereffekt/Mo</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-[hsl(215,16%,47%)]">Monatsbelastung</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-[hsl(215,16%,47%)]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {availableUnits.map((unit) => {
                    const metrics = metricsCache[unit.id];
                    const yieldPercent = unit.list_price && unit.rent_net
                      ? (unit.rent_net * 12 / unit.list_price) * 100 : 0;
                    const monthlyTaxEffect = metrics?.yearlyTaxSavings ? metrics.yearlyTaxSavings / 12 : null;
                    const monthlyBurden = metrics?.monthlyBurden ?? null;
                    const status = STATUS_LABELS[unit.status || 'frei'] || STATUS_LABELS.frei;

                    return (
                      <tr
                        key={unit.id}
                        className="border-b border-[hsl(214,32%,91%)]/50 transition-colors hover:bg-[hsl(210,30%,97%)] cursor-pointer"
                        onClick={() => window.location.href = `/website/projekt/${slug}/einheit/${unit.id}`}
                      >
                        <td className="px-3 py-2 font-medium text-[hsl(220,20%,10%)]">{unit.unit_number}</td>
                        <td className="px-3 py-2 text-center">{unit.rooms_count ? `${unit.rooms_count}-Zi` : '—'}</td>
                        <td className="px-3 py-2 text-center">{formatFloor(unit.floor)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{unit.area_sqm ? `${unit.area_sqm.toFixed(1)} m²` : '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">{unit.list_price ? eur(unit.list_price) : '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{unit.rent_net ? eur(unit.rent_net) : '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium">{yieldPercent > 0 ? `${yieldPercent.toFixed(2)} %` : '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {isCalculating ? (
                            <span className="text-[hsl(215,16%,47%)] animate-pulse">···</span>
                          ) : monthlyTaxEffect !== null ? (
                            <span className="text-emerald-600 font-medium">{eurSigned(Math.round(monthlyTaxEffect))}</span>
                          ) : (
                            <span className="text-[hsl(215,16%,47%)]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {isCalculating ? (
                            <span className="text-[hsl(215,16%,47%)] animate-pulse">···</span>
                          ) : monthlyBurden !== null ? (
                            <span className={cn(
                              'font-bold',
                              monthlyBurden >= 0 ? 'text-emerald-600' : 'text-red-600'
                            )}>
                              {eurSigned(Math.round(monthlyBurden))}/Mo
                            </span>
                          ) : (
                            <span className="text-[hsl(215,16%,47%)]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={cn('inline-block px-2 py-0.5 rounded-full text-[10px] font-medium', status.className)}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[hsl(210,30%,97%)] font-semibold text-xs">
                    <td className="px-3 py-2.5">Summe / Ø</td>
                    <td className="px-3 py-2.5 text-center">{availableUnits.length} WE</td>
                    <td className="px-3 py-2.5" />
                    <td className="px-3 py-2.5 text-right tabular-nums">{totalArea.toFixed(1)} m²</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{eur(totalPrice)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{eur(totalRentAnnual / 12)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">Ø {avgYield.toFixed(2)} %</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {hasSearched && calculatedUnits.length > 0 ? (
                        <span className="text-emerald-600">Ø {eurSigned(Math.round(
                          calculatedUnits.reduce((s, u) => s + ((metricsCache[u.id]?.yearlyTaxSavings || 0) / 12), 0) / calculatedUnits.length
                        ))}</span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {hasSearched && calculatedUnits.length > 0 ? (
                        <span className={cn('font-bold', avgBurden >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                          Ø {eurSigned(Math.round(avgBurden))}/Mo
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2.5" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
