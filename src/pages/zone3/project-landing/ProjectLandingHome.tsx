/**
 * ProjectLandingHome — Startseite der Projekt-Landing-Page
 * 
 * Hero + Photo Carousel + Highlights + Location + Search Engine + Unit Table
 */
import { useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resolveStorageSignedUrl } from '@/lib/storage-url';
import { Loader2, Building2, MapPin, ChevronLeft, ChevronRight, Star, TrendingUp, Shield, Home, ArrowRight } from 'lucide-react';
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
  current_rent: number | null;
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

    // Gallery: exterior, interior, surroundings + hero as first gallery image
    if (['hero', 'exterior', 'interior', 'surroundings'].includes(slotKey)) {
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

const HIGHLIGHT_ICONS = [TrendingUp, Shield, Home, Star, Building2];

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
        .select('id, project_id, hero_headline, hero_subheadline, about_text, location_description, highlights_json, imprint_text, footer_company_name, footer_address, contact_email, contact_phone')
        .eq('slug', slug)
        .in('status', ['draft', 'preview', 'active'])
        .maybeSingle();

      if (!lp?.project_id) return null;

      const { data: project } = await supabase
        .from('dev_projects')
        .select('id, name, city, address, postal_code, description, full_description, location_description, total_units_count, total_area_sqm, construction_year, afa_model, afa_rate_percent, grest_rate_percent, notary_rate_percent')
        .eq('id', lp.project_id)
        .maybeSingle();

      if (!project) return null;

      const { data: units } = await supabase
        .from('dev_project_units')
        .select('id, unit_number, floor, area_sqm, rooms_count, list_price, rent_net, current_rent, status')
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
      const monthlyRent = unit.rent_net || unit.current_rent || (price * 0.04 / 12);

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
  const locationText = landingPage.location_description || (project as any).location_description || '';
  const highlights: string[] = Array.isArray((landingPage as any).highlights_json) ? (landingPage as any).highlights_json : [];

  // Gallery carousel
  const galleryCount = galleryImages.length;
  const prevImage = () => setCarouselIndex(i => (i - 1 + galleryCount) % galleryCount);
  const nextImage = () => setCarouselIndex(i => (i + 1) % galleryCount);

  // Summary for table
  const totalArea = availableUnits.reduce((s, u) => s + (u.area_sqm || 0), 0);
  const totalPrice = availableUnits.reduce((s, u) => s + (u.list_price || 0), 0);
  const totalRentAnnual = availableUnits.reduce((s, u) => s + ((u.rent_net || u.current_rent || 0) * 12), 0);
  const avgYield = totalPrice > 0 ? (totalRentAnnual / totalPrice) * 100 : 0;
  const calculatedUnits = availableUnits.filter(u => metricsCache[u.id]);
  const avgBurden = calculatedUnits.length > 0
    ? calculatedUnits.reduce((s, u) => s + (metricsCache[u.id]?.monthlyBurden || 0), 0) / calculatedUnits.length
    : 0;

  // Price range
  const prices = availableUnits.map(u => u.list_price).filter(Boolean) as number[];
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  return (
    <div>
      {/* ─── Hero Section ─── */}
      <section
        className="relative h-[500px] md:h-[560px] flex items-end overflow-hidden"
        style={{
          backgroundImage: heroImageUrl
            ? `url(${heroImageUrl})`
            : 'linear-gradient(135deg, hsl(220,25%,12%) 0%, hsl(215,30%,22%) 50%, hsl(210,35%,28%) 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
        }}
      >
        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

        <div className="relative w-full px-6 lg:px-10 pb-12 md:pb-16 max-w-[1400px] mx-auto">
          {/* Key facts as floating badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {project.total_units_count && (
              <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs font-medium border border-white/20">
                {project.total_units_count} Einheiten
              </span>
            )}
            {avgYield > 0 && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-sm text-emerald-200 text-xs font-medium border border-emerald-400/30">
                Ø {avgYield.toFixed(1)}% Rendite
              </span>
            )}
            {prices.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs font-medium border border-white/20">
                ab {eur(minPrice)}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight max-w-3xl">
            {landingPage.hero_headline || project.name}
          </h1>
          {(landingPage.hero_subheadline || project.city) && (
            <p className="text-lg md:text-xl text-white/85 max-w-2xl leading-relaxed">
              {landingPage.hero_subheadline || `Ihr Investment in ${project.city}`}
            </p>
          )}
          {project.city && (
            <div className="flex items-center gap-2 mt-5 text-white/60">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{[project.address, project.postal_code, project.city].filter(Boolean).join(', ')}</span>
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-wrap gap-3 mt-8">
            <a href="#investment-rechner">
              <Button size="lg" className="rounded-full bg-white text-[hsl(220,20%,10%)] hover:bg-white/90 font-semibold px-8 shadow-2xl">
                Investment berechnen
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <Link to={`/website/projekt/${slug}/beratung`}>
              <Button size="lg" variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10 px-8">
                Beratung anfragen
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Highlights Strip ─── */}
      {highlights.length > 0 && (
        <section className="bg-[hsl(220,20%,10%)] py-6">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {highlights.slice(0, 5).map((h, i) => {
                const Icon = HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length];
                return (
                  <div key={i} className="flex items-center gap-3 text-white/90">
                    <div className="p-2 rounded-lg bg-white/10 shrink-0">
                      <Icon className="h-4 w-4 text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium leading-tight">{h}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── Photo Gallery + Description ─── */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Foto-Carousel */}
          <div className="relative rounded-2xl overflow-hidden bg-[hsl(210,30%,97%)] aspect-[4/3] shadow-lg">
            {galleryCount > 0 ? (
              <>
                <img
                  src={galleryImages[carouselIndex].url}
                  alt={`Projektbild ${carouselIndex + 1}`}
                  className="w-full h-full object-cover transition-opacity duration-500"
                />
                {galleryCount > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors backdrop-blur-sm"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors backdrop-blur-sm"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    {/* Dot indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {galleryImages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCarouselIndex(i)}
                          className={cn(
                            "w-2 h-2 rounded-full transition-all",
                            i === carouselIndex ? "bg-white w-6" : "bg-white/50 hover:bg-white/75"
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <Building2 className="h-16 w-16 text-[hsl(215,16%,70%)]" />
                <p className="text-sm text-[hsl(215,16%,47%)]">Bilder werden geladen...</p>
              </div>
            )}
          </div>

          {/* Right: Object Description + Key Facts */}
          <div className="flex flex-col justify-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">Über das Projekt</span>
            <h2 className="text-2xl md:text-3xl font-bold text-[hsl(220,20%,10%)] mb-5">
              {project.name}
            </h2>
            {aboutText ? (
              <p className="text-[hsl(215,16%,37%)] leading-relaxed text-[15px]">
                {aboutText}
              </p>
            ) : (
              <p className="text-[hsl(215,16%,47%)] italic">Beschreibung wird mit KI generiert...</p>
            )}

            {/* Key Facts Grid */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              {project.total_units_count && (
                <div className="p-4 rounded-xl bg-[hsl(210,30%,97%)] border border-[hsl(214,32%,91%)]">
                  <p className="text-2xl font-bold text-[hsl(220,20%,10%)]">{project.total_units_count}</p>
                  <p className="text-xs text-[hsl(215,16%,47%)] mt-1">Wohneinheiten</p>
                </div>
              )}
              {project.total_area_sqm && (
                <div className="p-4 rounded-xl bg-[hsl(210,30%,97%)] border border-[hsl(214,32%,91%)]">
                  <p className="text-2xl font-bold text-[hsl(220,20%,10%)]">{Math.round(project.total_area_sqm)} m²</p>
                  <p className="text-xs text-[hsl(215,16%,47%)] mt-1">Gesamtfläche</p>
                </div>
              )}
              {project.construction_year && (
                <div className="p-4 rounded-xl bg-[hsl(210,30%,97%)] border border-[hsl(214,32%,91%)]">
                  <p className="text-2xl font-bold text-[hsl(220,20%,10%)]">{project.construction_year}</p>
                  <p className="text-xs text-[hsl(215,16%,47%)] mt-1">Baujahr</p>
                </div>
              )}
              {avgYield > 0 && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-2xl font-bold text-emerald-700">{avgYield.toFixed(1)}%</p>
                  <p className="text-xs text-emerald-600 mt-1">Ø Bruttorendite</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Location Section ─── */}
      {locationText && (
        <section className="bg-[hsl(210,30%,97%)] py-12 md:py-16">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
            <div className="max-w-3xl mx-auto text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-[hsl(210,80%,55%)] mb-3 block">Standort</span>
              <h2 className="text-2xl md:text-3xl font-bold text-[hsl(220,20%,10%)] mb-6">
                Die Lage — {project.city || 'Ihr neuer Standort'}
              </h2>
              <div className="flex items-center justify-center gap-2 mb-6 text-[hsl(215,16%,47%)]">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{[project.address, project.postal_code, project.city].filter(Boolean).join(', ')}</span>
              </div>
              <p className="text-[hsl(215,16%,37%)] leading-relaxed text-[15px]">
                {locationText}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ─── Investment-Rechner ─── */}
      <section id="investment-rechner" className="max-w-[1400px] mx-auto px-6 lg:px-10 py-12 md:py-16">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3 block">Investment-Engine</span>
          <h2 className="text-2xl md:text-3xl font-bold text-[hsl(220,20%,10%)] mb-3">
            Ihre persönliche Berechnung
          </h2>
          <p className="text-[hsl(215,16%,47%)] max-w-xl mx-auto">
            Geben Sie Ihr Einkommen und Eigenkapital ein — wir berechnen die monatliche Belastung nach Steuer für jede Einheit.
          </p>
        </div>

        <Card className="shadow-xl border-0 max-w-4xl mx-auto">
          <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-xs font-medium text-[hsl(215,16%,47%)] mb-1.5 block">Zu versteuerndes Einkommen</label>
                <input type="number" value={searchParams.zvE} onChange={(e) => setSearchParams(p => ({ ...p, zvE: parseInt(e.target.value) || 0 }))} className="w-full h-11 px-3 rounded-xl border border-[hsl(214,32%,91%)] bg-white text-sm focus:ring-2 focus:ring-[hsl(220,20%,10%)] focus:border-transparent outline-none transition" />
              </div>
              <div>
                <label className="text-xs font-medium text-[hsl(215,16%,47%)] mb-1.5 block">Eigenkapital</label>
                <input type="number" value={searchParams.equity} onChange={(e) => setSearchParams(p => ({ ...p, equity: parseInt(e.target.value) || 0 }))} className="w-full h-11 px-3 rounded-xl border border-[hsl(214,32%,91%)] bg-white text-sm focus:ring-2 focus:ring-[hsl(220,20%,10%)] focus:border-transparent outline-none transition" />
              </div>
              <div>
                <label className="text-xs font-medium text-[hsl(215,16%,47%)] mb-1.5 block">Familienstand</label>
                <select value={searchParams.maritalStatus} onChange={(e) => setSearchParams(p => ({ ...p, maritalStatus: e.target.value as 'single' | 'married' }))} className="w-full h-11 px-3 rounded-xl border border-[hsl(214,32%,91%)] bg-white text-sm focus:ring-2 focus:ring-[hsl(220,20%,10%)] focus:border-transparent outline-none transition">
                  <option value="single">Ledig</option>
                  <option value="married">Verheiratet</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm cursor-pointer h-11">
                  <input type="checkbox" checked={searchParams.hasChurchTax} onChange={(e) => setSearchParams(p => ({ ...p, hasChurchTax: e.target.checked }))} className="rounded" />
                  <span>Kirchensteuer</span>
                </label>
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} disabled={isCalculating} className="w-full h-11 rounded-xl bg-[hsl(220,20%,10%)] hover:bg-[hsl(220,20%,20%)] font-semibold">
                  {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Berechnen'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ─── Units Table ─── */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 pb-16">
        <h2 className="text-2xl font-bold text-[hsl(220,20%,10%)] mb-6">
          Verfügbare Einheiten
          <span className="text-base font-normal text-[hsl(215,16%,47%)] ml-2">({availableUnits.length})</span>
        </h2>

        {!hasSearched ? (
          <div className="text-center py-16 bg-[hsl(210,30%,97%)] rounded-2xl border border-[hsl(214,32%,91%)]">
            <div className="p-4 rounded-2xl bg-white shadow-sm inline-block mb-4">
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-[hsl(220,20%,10%)] mb-2">Investment-Berechnung starten</h3>
            <p className="text-[hsl(215,16%,47%)] max-w-md mx-auto mb-6">
              Geben Sie oben Ihr Einkommen und Eigenkapital ein, um die individuelle Monatsbelastung nach Steuer zu berechnen.
            </p>
            <a href="#investment-rechner">
              <Button variant="outline" className="rounded-full">
                Zum Rechner
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        ) : (
          <div className="rounded-2xl border border-[hsl(214,32%,91%)] bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-[hsl(210,30%,97%)]">
                    <th className="px-3 py-3 text-left font-semibold text-[hsl(215,16%,47%)]">WE-Nr</th>
                    <th className="px-3 py-3 text-center font-semibold text-[hsl(215,16%,47%)]">Zimmer</th>
                    <th className="px-3 py-3 text-center font-semibold text-[hsl(215,16%,47%)]">Etage</th>
                    <th className="px-3 py-3 text-right font-semibold text-[hsl(215,16%,47%)]">Fläche m²</th>
                    <th className="px-3 py-3 text-right font-semibold text-[hsl(215,16%,47%)]">Kaufpreis</th>
                    <th className="px-3 py-3 text-right font-semibold text-[hsl(215,16%,47%)]">Miete/Mo</th>
                    <th className="px-3 py-3 text-right font-semibold text-[hsl(215,16%,47%)]">Bruttorendite</th>
                    <th className="px-3 py-3 text-right font-semibold text-[hsl(215,16%,47%)]">Steuereffekt/Mo</th>
                    <th className="px-3 py-3 text-right font-semibold text-[hsl(215,16%,47%)]">Monatsbelastung</th>
                    <th className="px-3 py-3 text-center font-semibold text-[hsl(215,16%,47%)]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {availableUnits.map((unit) => {
                    const metrics = metricsCache[unit.id];
                    const unitRent = unit.rent_net || unit.current_rent || 0;
                    const yieldPercent = unit.list_price && unitRent
                      ? (unitRent * 12 / unit.list_price) * 100 : 0;
                    const monthlyTaxEffect = metrics?.yearlyTaxSavings ? metrics.yearlyTaxSavings / 12 : null;
                    const monthlyBurden = metrics?.monthlyBurden ?? null;
                    const status = STATUS_LABELS[unit.status || 'frei'] || STATUS_LABELS.frei;

                    return (
                      <tr
                        key={unit.id}
                        className="border-b border-[hsl(214,32%,91%)]/50 transition-colors hover:bg-[hsl(210,30%,97%)] cursor-pointer"
                        onClick={() => window.location.href = `/website/projekt/${slug}/einheit/${unit.id}`}
                      >
                        <td className="px-3 py-2.5 font-medium text-[hsl(220,20%,10%)]">{unit.unit_number}</td>
                        <td className="px-3 py-2.5 text-center">{unit.rooms_count ? `${unit.rooms_count}-Zi` : '—'}</td>
                        <td className="px-3 py-2.5 text-center">{formatFloor(unit.floor)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{unit.area_sqm ? `${unit.area_sqm.toFixed(1)} m²` : '—'}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{unit.list_price ? eur(unit.list_price) : '—'}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{unit.rent_net ? eur(unit.rent_net) : '—'}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-medium">{yieldPercent > 0 ? `${yieldPercent.toFixed(2)} %` : '—'}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {isCalculating ? (
                            <span className="text-[hsl(215,16%,47%)] animate-pulse">···</span>
                          ) : monthlyTaxEffect !== null ? (
                            <span className="text-emerald-600 font-medium">{eurSigned(Math.round(monthlyTaxEffect))}</span>
                          ) : (
                            <span className="text-[hsl(215,16%,47%)]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
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
                        <td className="px-3 py-2.5 text-center">
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
                    <td className="px-3 py-3">Summe / Ø</td>
                    <td className="px-3 py-3 text-center">{availableUnits.length} WE</td>
                    <td className="px-3 py-3" />
                    <td className="px-3 py-3 text-right tabular-nums">{totalArea.toFixed(1)} m²</td>
                    <td className="px-3 py-3 text-right tabular-nums">{eur(totalPrice)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{eur(totalRentAnnual / 12)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">Ø {avgYield.toFixed(2)} %</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {hasSearched && calculatedUnits.length > 0 ? (
                        <span className="text-emerald-600">Ø {eurSigned(Math.round(
                          calculatedUnits.reduce((s, u) => s + ((metricsCache[u.id]?.yearlyTaxSavings || 0) / 12), 0) / calculatedUnits.length
                        ))}</span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {hasSearched && calculatedUnits.length > 0 ? (
                        <span className={cn('font-bold', avgBurden >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                          Ø {eurSigned(Math.round(avgBurden))}/Mo
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ─── CTA Section ─── */}
      <section className="bg-[hsl(220,20%,10%)] py-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Interesse an diesem Projekt?
          </h2>
          <p className="text-white/70 max-w-xl mx-auto mb-8">
            Unsere Berater stehen Ihnen für eine unverbindliche Beratung zur Verfügung. Wir berechnen Ihre individuelle Situation und finden die passende Einheit.
          </p>
          <Link to={`/website/projekt/${slug}/beratung`}>
            <Button size="lg" className="rounded-full bg-white text-[hsl(220,20%,10%)] hover:bg-white/90 font-semibold px-10 shadow-2xl">
              Beratung anfragen
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
