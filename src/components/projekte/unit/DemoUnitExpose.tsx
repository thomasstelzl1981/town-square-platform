/**
 * DemoUnitExpose — Full Investment-Engine exposé with live sliders (no DB queries)
 * Extracted from UnitDetailPage.tsx (R-12)
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, ImageIcon, Map, MapPin, Maximize2, Calendar } from 'lucide-react';
import { useInvestmentEngine, defaultInput } from '@/hooks/useInvestmentEngine';
import type { CalculationInput } from '@/hooks/useInvestmentEngine';
import { MasterGraph } from '@/components/investment/MasterGraph';
import { Haushaltsrechnung } from '@/components/investment/Haushaltsrechnung';
import { InvestmentSliderPanel } from '@/components/investment/InvestmentSliderPanel';
import { DetailTable40Jahre } from '@/components/investment/DetailTable40Jahre';
import { FinanzierungSummary } from '@/components/investment/FinanzierungSummary';
import { DEMO_UNITS, DEMO_UNIT_DETAIL } from '@/components/projekte/demoProjectData';

export function DemoUnitExpose() {
  const navigate = useNavigate();
  const demoUnit = DEMO_UNITS[0];
  const detail = DEMO_UNIT_DETAIL;

  const { calculate, result: calcResult, isLoading: isCalculating } = useInvestmentEngine();

  const [params, setParams] = useState<CalculationInput>({
    ...defaultInput,
    purchasePrice: demoUnit.list_price,
    monthlyRent: demoUnit.rent_monthly,
    equity: Math.round(demoUnit.list_price * 0.2),
  });

  useEffect(() => { calculate(params); }, []);

  const handleParamsChange = (newParams: CalculationInput) => {
    setParams(newParams);
    calculate(newParams);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  return (
    <div className="p-6 space-y-6 relative">
      <div className="absolute top-4 right-4 z-10">
        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">
          Musterdaten
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal/projekte/projekte')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{demoUnit.unit_number} — {detail.title}</h1>
          <p className="text-muted-foreground mt-1">{detail.city} · Verkaufsexposé (Demo)</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 opacity-60">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video rounded-xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Beispielbilder</p>
              <p className="text-xs">Bildergalerie wird bei echten Objekten angezeigt</p>
            </div>
          </div>

          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <Badge className="mb-2">Eigentumswohnung</Badge>
                <h2 className="text-2xl font-bold">{detail.title}</h2>
                <p className="flex items-center gap-1 mt-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />{detail.postal_code} {detail.city}, {detail.address}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{formatCurrency(demoUnit.list_price)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/50">
              <div><p className="text-sm text-muted-foreground">Wohnfläche</p><p className="font-semibold flex items-center gap-1"><Maximize2 className="w-4 h-4" /> {demoUnit.area_sqm} m²</p></div>
              <div><p className="text-sm text-muted-foreground">Baujahr</p><p className="font-semibold flex items-center gap-1"><Calendar className="w-4 h-4" /> {detail.year_built}</p></div>
              <div><p className="text-sm text-muted-foreground">Zimmer</p><p className="font-semibold">{demoUnit.rooms}</p></div>
              <div><p className="text-sm text-muted-foreground">Mieteinnahmen</p><p className="font-semibold">{formatCurrency(params.monthlyRent)}/Mo</p></div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Beschreibung</h3>
              <p className="text-muted-foreground whitespace-pre-line">{detail.description}</p>
            </div>
          </div>

          {isCalculating ? (
            <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : calcResult ? (
            <MasterGraph projection={calcResult.projection} title="Wertentwicklung (40 Jahre)" variant="full" />
          ) : null}

          {calcResult && <Haushaltsrechnung result={calcResult} variant="ledger" showMonthly={true} />}
          {calcResult && <FinanzierungSummary purchasePrice={demoUnit.list_price} equity={params.equity} result={calcResult} />}
          {calcResult && <DetailTable40Jahre projection={calcResult.projection} defaultOpen={false} />}

          <div className="aspect-[2/1] rounded-xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Map className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Standort</p>
              <p className="text-xs">Google Maps wird bei echten Objekten angezeigt</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="sticky top-24">
            <InvestmentSliderPanel value={params} onChange={handleParamsChange} layout="vertical" showAdvanced={true} purchasePrice={demoUnit.list_price} />
          </div>
        </div>
      </div>
    </div>
  );
}
