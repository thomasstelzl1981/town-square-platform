/**
 * ProjectLandingExpose — Einheit-Detail mit Investment Engine
 * Data source: dev_project_units (NOT listings)
 */
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Building2, ArrowLeft, Home, Ruler, Layers, DoorOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { useInvestmentEngine, defaultInput, type CalculationInput } from '@/hooks/useInvestmentEngine';

export default function ProjectLandingExpose() {
  const { slug, unitId } = useParams<{ slug: string; unitId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['project-landing-expose', slug, unitId],
    queryFn: async () => {
      if (!slug || !unitId) return null;

      const { data: unit } = await supabase
        .from('dev_project_units')
        .select('id, unit_number, floor, area_sqm, rooms_count, list_price, rent_net, hausgeld, status, project_id')
        .eq('id', unitId)
        .maybeSingle();

      if (!unit) return null;

      const { data: project } = await supabase
        .from('dev_projects')
        .select('id, name, city, address, postal_code, afa_model, afa_rate_percent, grest_rate_percent, notary_rate_percent, construction_year, tenant_id')
        .eq('id', (unit as any).project_id)
        .maybeSingle();

      return { unit: unit as any, project: project as any };
    },
    enabled: !!slug && !!unitId,
    staleTime: 5 * 60 * 1000,
  });

  const [calcParams, setCalcParams] = useState({
    equity: 50000, taxableIncome: 60000,
    maritalStatus: 'single' as 'single' | 'married',
    hasChurchTax: false, interestRate: 3.5, repaymentRate: 2.0,
  });

  const { calculate } = useInvestmentEngine();

  const calcInput: CalculationInput | null = useMemo(() => {
    if (!data?.unit) return null;
    const u = data.unit;
    const p = data.project;
    const monthlyRent = u.rent_net || (u.list_price * 0.04 / 12);
    return {
      ...defaultInput,
      purchasePrice: u.list_price || 0,
      monthlyRent,
      equity: calcParams.equity,
      taxableIncome: calcParams.taxableIncome,
      maritalStatus: calcParams.maritalStatus,
      hasChurchTax: calcParams.hasChurchTax,
      interestRate: calcParams.interestRate,
      repaymentRate: calcParams.repaymentRate,
      ...(p?.afa_model && { afaModel: p.afa_model }),
      ...(p?.afa_rate_percent && { afaRate: p.afa_rate_percent }),
      ...(p?.grest_rate_percent && { transferTaxRate: p.grest_rate_percent }),
      ...(p?.notary_rate_percent && { notaryRate: p.notary_rate_percent }),
    };
  }, [data, calcParams]);

  const { data: calcResult } = useQuery({
    queryKey: ['project-expose-calc', calcInput],
    queryFn: () => calcInput ? calculate(calcInput) : null,
    enabled: !!calcInput,
    staleTime: 0,
  });

  const fmt = (val: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  const fmtFloor = (f: number | null) => { if (f === null) return '–'; if (f === 0) return 'EG'; if (f < 0) return `${Math.abs(f)}. UG`; return `${f}. OG`; };

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[hsl(210,80%,55%)]" /></div>;
  if (!data) return <div className="text-center py-24"><Building2 className="w-12 h-12 mx-auto text-[hsl(215,16%,47%)] mb-4" /><p className="text-[hsl(215,16%,47%)]">Einheit nicht gefunden.</p></div>;

  const { unit: u, project } = data;

  return (
    <div className="py-8 px-6 lg:px-10">
      <Link to={`/website/projekt/${slug}`} className="inline-flex items-center gap-2 text-sm text-[hsl(210,80%,55%)] hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" />Zurück zur Übersicht
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-[hsl(220,20%,10%)]">Einheit {u.unit_number}</h1>
              <Badge variant={u.status === 'frei' ? 'default' : 'secondary'} className={u.status === 'frei' ? 'bg-emerald-100 text-emerald-700 border-0' : ''}>
                {u.status === 'frei' ? 'Verfügbar' : u.status || '–'}
              </Badge>
            </div>
            <p className="text-[hsl(215,16%,47%)]">{project?.name} · {[project?.address, project?.postal_code, project?.city].filter(Boolean).join(', ')}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Home, value: u.list_price ? fmt(u.list_price) : '–', label: 'Kaufpreis' },
              { icon: Ruler, value: u.area_sqm ? `${u.area_sqm} m²` : '–', label: 'Wohnfläche' },
              { icon: Layers, value: fmtFloor(u.floor), label: 'Etage' },
              { icon: DoorOpen, value: u.rooms_count || '–', label: 'Zimmer' },
            ].map((f, i) => (
              <Card key={i} className="border-[hsl(214,32%,91%)]">
                <CardContent className="p-4 text-center">
                  <f.icon className="h-5 w-5 mx-auto mb-1 text-[hsl(210,80%,55%)]" />
                  <div className="text-lg font-bold text-[hsl(220,20%,10%)]">{f.value}</div>
                  <div className="text-xs text-[hsl(215,16%,47%)]">{f.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-[hsl(214,32%,91%)]">
            <CardContent className="p-6">
              <h3 className="font-semibold text-[hsl(220,20%,10%)] mb-4">Finanzdaten</h3>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-[hsl(215,16%,47%)]">Kaltmiete/Monat</span>
                <span className="font-medium text-right">{u.rent_net ? fmt(u.rent_net) : '–'}</span>
                <span className="text-[hsl(215,16%,47%)]">Hausgeld/Monat</span>
                <span className="font-medium text-right">{u.hausgeld ? fmt(u.hausgeld) : '–'}</span>
                {u.rent_net && u.list_price && (<><span className="text-[hsl(215,16%,47%)]">Bruttomietrendite</span><span className="font-medium text-right">{((u.rent_net * 12 / u.list_price) * 100).toFixed(2)}%</span></>)}
                {u.list_price && u.area_sqm && (<><span className="text-[hsl(215,16%,47%)]">Preis/m²</span><span className="font-medium text-right">{fmt(u.list_price / u.area_sqm)}</span></>)}
              </div>
            </CardContent>
          </Card>

          {calcResult && (
            <Card className="border-[hsl(210,80%,55%,0.3)] bg-[hsl(210,80%,55%,0.03)]">
              <CardContent className="p-6">
                <h3 className="font-semibold text-[hsl(220,20%,10%)] mb-4">Investment-Ergebnis</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-xs text-[hsl(215,16%,47%)] mb-1">Monatsbelastung nach Steuer</div>
                    <div className={`text-2xl font-bold ${calcResult.summary.monthlyBurden <= 0 ? 'text-emerald-600' : 'text-[hsl(220,20%,10%)]'}`}>{fmt(calcResult.summary.monthlyBurden)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[hsl(215,16%,47%)] mb-1">Rendite nach Steuer</div>
                    <div className="text-2xl font-bold text-[hsl(220,20%,10%)]">{calcResult.summary.roiAfterTax.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-[hsl(215,16%,47%)] mb-1">Darlehensbetrag</div>
                    <div className="text-2xl font-bold text-[hsl(220,20%,10%)]">{fmt(calcResult.summary.loanAmount)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Link to={`/website/projekt/${slug}/beratung`}>
            <Button className="w-full h-12 rounded-lg bg-[hsl(220,20%,10%)] hover:bg-[hsl(220,20%,20%)] text-base">
              Beratungsgespräch vereinbaren
            </Button>
          </Link>
        </div>

        {/* Right: Calculator Panel */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="border-[hsl(214,32%,91%)]">
            <CardContent className="p-5">
              <h3 className="font-semibold text-[hsl(220,20%,10%)] mb-4 text-sm">Investment-Rechner</h3>
              <div className="space-y-4">
                {[
                  { label: 'Eigenkapital', key: 'equity' as const },
                  { label: 'Zu versteuerndes Einkommen', key: 'taxableIncome' as const },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-[hsl(215,16%,47%)] mb-1 block">{f.label}</label>
                    <input type="number" value={calcParams[f.key]} onChange={(e) => setCalcParams(p => ({ ...p, [f.key]: parseInt(e.target.value) || 0 }))} className="w-full h-9 px-3 rounded-lg border border-[hsl(214,32%,91%)] bg-white text-sm" />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-[hsl(215,16%,47%)] mb-1 block">Familienstand</label>
                  <select value={calcParams.maritalStatus} onChange={(e) => setCalcParams(p => ({ ...p, maritalStatus: e.target.value as any }))} className="w-full h-9 px-3 rounded-lg border border-[hsl(214,32%,91%)] bg-white text-sm">
                    <option value="single">Ledig</option>
                    <option value="married">Verheiratet</option>
                  </select>
                </div>
                {[
                  { label: 'Zinssatz (%)', key: 'interestRate' as const },
                  { label: 'Tilgung (%)', key: 'repaymentRate' as const },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-[hsl(215,16%,47%)] mb-1 block">{f.label}</label>
                    <input type="number" step="0.1" value={calcParams[f.key]} onChange={(e) => setCalcParams(p => ({ ...p, [f.key]: parseFloat(e.target.value) || 0 }))} className="w-full h-9 px-3 rounded-lg border border-[hsl(214,32%,91%)] bg-white text-sm" />
                  </div>
                ))}
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={calcParams.hasChurchTax} onChange={(e) => setCalcParams(p => ({ ...p, hasChurchTax: e.target.checked }))} className="rounded" />
                  <span className="text-xs">Kirchensteuer</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
