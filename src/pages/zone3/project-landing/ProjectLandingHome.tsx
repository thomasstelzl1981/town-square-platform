/**
 * ProjectLandingHome — Startseite der Projekt-Landing-Page
 * 
 * Hero (project image) + Search Engine + Unit List (dev_project_units)
 */
import { useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCachedSignedUrl } from '@/lib/imageCache';
import { Loader2, Building2, MapPin, Home, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
}

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
  const { calculate } = useInvestmentEngine();

  // Fetch project + units
  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project-landing-home', slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data: lp } = await supabase
        .from('landing_pages')
        .select('id, project_id, hero_headline, hero_subheadline, about_text')
        .eq('slug', slug)
        .in('status', ['draft', 'preview', 'active'])
        .maybeSingle();

      if (!lp?.project_id) return null;

      // Get project details (use only columns that exist)
      const { data: project } = await supabase
        .from('dev_projects')
        .select('id, name, city, address, postal_code, description, project_images, total_units_count, total_area_sqm, construction_year, afa_model, afa_rate_percent, grest_rate_percent, notary_rate_percent')
        .eq('id', lp.project_id)
        .maybeSingle();

      if (!project) return null;

      // Get units
      const { data: units } = await supabase
        .from('dev_project_units')
        .select('id, unit_number, floor, area_sqm, rooms_count, list_price, rent_net, status')
        .eq('project_id', project.id)
        .order('unit_number', { ascending: true });

      // Get hero image signed URL
      let heroImageUrl: string | null = null;
      const projectImages = (project as any).project_images as Record<string, any> | null;
      if (projectImages?.hero?.storagePath) {
        heroImageUrl = await getCachedSignedUrl(projectImages.hero.storagePath);
      }

      return { landingPage: lp, project: project as any, units: (units || []) as unknown as ProjectUnit[], heroImageUrl };
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
        };
      }
    }));

    setMetricsCache(newCache);
    setIsCalculating(false);
  }, [availableUnits, searchParams, calculate, projectData?.project]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  const formatFloor = (floor: number | null) => {
    if (floor === null || floor === undefined) return '–';
    if (floor === 0) return 'EG';
    if (floor < 0) return `${Math.abs(floor)}. UG`;
    return `${floor}. OG`;
  };

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

  const { landingPage, project, heroImageUrl } = projectData;

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative h-[50vh] min-h-[400px] flex items-end bg-cover bg-center"
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

      {/* Search Engine */}
      <section className="px-6 lg:px-10 -mt-8 relative z-10">
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

      {/* Key Facts */}
      <section className="px-6 lg:px-10 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {project.total_units_count && (
            <div className="text-center p-4 bg-[hsl(210,30%,97%)] rounded-xl">
              <div className="text-2xl font-bold text-[hsl(220,20%,10%)]">{project.total_units_count}</div>
              <div className="text-xs text-[hsl(215,16%,47%)] mt-1">Einheiten</div>
            </div>
          )}
          {project.total_area_sqm && (
            <div className="text-center p-4 bg-[hsl(210,30%,97%)] rounded-xl">
              <div className="text-2xl font-bold text-[hsl(220,20%,10%)]">{Math.round(project.total_area_sqm)} m²</div>
              <div className="text-xs text-[hsl(215,16%,47%)] mt-1">Gesamtfläche</div>
            </div>
          )}
          {project.construction_year && (
            <div className="text-center p-4 bg-[hsl(210,30%,97%)] rounded-xl">
              <div className="text-2xl font-bold text-[hsl(220,20%,10%)]">{project.construction_year}</div>
              <div className="text-xs text-[hsl(215,16%,47%)] mt-1">Baujahr</div>
            </div>
          )}
          <div className="text-center p-4 bg-[hsl(210,30%,97%)] rounded-xl">
            <div className="text-2xl font-bold text-[hsl(220,20%,10%)]">
              {availableUnits.filter(u => u.status === 'frei').length}
            </div>
            <div className="text-xs text-[hsl(215,16%,47%)] mt-1">Verfügbar</div>
          </div>
        </div>
      </section>

      {/* Units List */}
      <section className="px-6 lg:px-10 pb-16">
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
        ) : isCalculating ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[hsl(210,80%,55%)]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableUnits.map((unit) => {
              const metrics = metricsCache[unit.id];
              return (
                <Link key={unit.id} to={`/website/projekt/${slug}/einheit/${unit.id}`} className="block group">
                  <Card className="h-full hover:shadow-lg transition-shadow border-[hsl(214,32%,91%)] group-hover:border-[hsl(210,80%,55%)]">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-[hsl(215,16%,47%)]" />
                            <span className="font-semibold text-[hsl(220,20%,10%)]">{unit.unit_number}</span>
                          </div>
                          <div className="text-xs text-[hsl(215,16%,47%)] mt-1">
                            {[formatFloor(unit.floor), unit.area_sqm ? `${unit.area_sqm} m²` : null, unit.rooms_count ? `${unit.rooms_count} Zi.` : null].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        <Badge variant={unit.status === 'frei' ? 'default' : 'secondary'} className={unit.status === 'frei' ? 'bg-emerald-100 text-emerald-700 border-0' : ''}>
                          {unit.status === 'frei' ? 'Verfügbar' : unit.status === 'reserviert' ? 'Reserviert' : unit.status || '–'}
                        </Badge>
                      </div>
                      <div className="text-xl font-bold text-[hsl(220,20%,10%)] mb-1">
                        {unit.list_price ? formatCurrency(unit.list_price) : '–'}
                      </div>
                      {unit.rent_net && (
                        <div className="text-xs text-[hsl(215,16%,47%)]">
                          Miete: {formatCurrency(unit.rent_net)}/Monat
                          {unit.list_price && <span className="ml-2">· Rendite: {((unit.rent_net * 12 / unit.list_price) * 100).toFixed(1)}%</span>}
                        </div>
                      )}
                      {metrics && (
                        <div className="mt-3 pt-3 border-t border-[hsl(210,20%,92%)]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[hsl(215,16%,47%)]">Monatsbelastung nach Steuer</span>
                            <span className={`text-sm font-bold ${metrics.monthlyBurden <= 0 ? 'text-emerald-600' : 'text-[hsl(220,20%,10%)]'}`}>
                              {formatCurrency(metrics.monthlyBurden)}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-end mt-3 text-xs text-[hsl(210,80%,55%)] group-hover:translate-x-1 transition-transform">
                        <span>Exposé ansehen</span>
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
