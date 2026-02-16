/**
 * BWATab — Bewirtschaftungsanalyse für eine Immobilie
 * Nutzt die BWA-Engine (src/engines/bewirtschaftung) als SSOT für alle Berechnungen.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, Minus, Loader2, AlertCircle } from 'lucide-react';
import { calcBWA, calcInstandhaltungsruecklage, calcLeerstandsquote, calcMietpotenzial } from '@/engines/bewirtschaftung/engine';
import type { BWACostItem, LeaseInfo } from '@/engines/bewirtschaftung/spec';

interface BWATabProps {
  propertyId: string;
  tenantId: string;
  unitId?: string;
  annualIncome?: number | null;
  yearBuilt?: number | null;
  purchasePrice?: number | null;
  totalAreaSqm?: number | null;
}

const fmt = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n: number) => (n * 100).toFixed(1) + ' %';

export function BWATab({ propertyId, tenantId, unitId, annualIncome, yearBuilt, purchasePrice, totalAreaSqm }: BWATabProps) {
  // Fetch leases for vacancy and rent data
  const { data: leases, isLoading } = useQuery({
    queryKey: ['bwa-leases', propertyId],
    queryFn: async () => {
      const q = supabase
        .from('leases' as any)
        .select('id, unit_id, rent_net, is_active, start_date, end_date, number_of_occupants')
        .eq('property_id', propertyId);
      const { data } = await q;
      return (data || []) as any[];
    },
  });

  // Fetch units for area/count info
  const { data: units } = useQuery({
    queryKey: ['bwa-units', propertyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('units')
        .select('id, area_sqm, rent_net')
        .eq('property_id', propertyId);
      return data || [];
    },
  });

  const bwaResult = useMemo(() => {
    const grossIncome = annualIncome || (leases || [])
      .filter((l: any) => l.is_active)
      .reduce((s: number, l: any) => s + (l.rent_net || 0) * 12, 0);

    // Estimated non-recoverable costs (simplified: 15% of gross)
    const estimatedCosts: BWACostItem[] = [
      { label: 'Verwaltung', amount: grossIncome * 0.04, category: 'verwaltung' },
      { label: 'Instandhaltung', amount: grossIncome * 0.06, category: 'instandhaltung' },
      { label: 'Versicherung', amount: grossIncome * 0.02, category: 'versicherung' },
      { label: 'Grundsteuer', amount: grossIncome * 0.02, category: 'grundsteuer' },
      { label: 'Sonstige', amount: grossIncome * 0.01, category: 'sonstig' },
    ];

    return calcBWA({
      grossRentalIncome: grossIncome,
      nonRecoverableCosts: estimatedCosts,
      annualDebtService: 0, // Could be enriched from financing data
      depreciation: purchasePrice ? purchasePrice * 0.02 : 0,
    });
  }, [annualIncome, leases, purchasePrice]);

  const instandhaltung = useMemo(() => {
    if (!yearBuilt || !purchasePrice) return null;
    return calcInstandhaltungsruecklage({
      buildingCost: purchasePrice * 0.75, // Approx building cost (excl. land)
      yearBuilt,
    });
  }, [yearBuilt, purchasePrice]);

  const leerstand = useMemo(() => {
    if (!units || units.length === 0) return null;
    const today = new Date();
    const leaseInfos: LeaseInfo[] = units.map((u: any) => {
      const activeLease = (leases || []).find((l: any) => l.unit_id === u.id && l.is_active);
      return {
        unitId: u.id,
        isVacant: !activeLease,
        vacantDays: activeLease ? 0 : 365,
        totalDays: 365,
      };
    });
    const avgRent = units.reduce((s: number, u: any) => s + (u.rent_net || 0), 0) / units.length;
    return calcLeerstandsquote(leaseInfos, avgRent);
  }, [units, leases]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* BWA Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          label="Brutto-Mieteinnahmen p.a."
          value={`${fmt(bwaResult.grossIncome)} €`}
        />
        <KPICard
          label="NOI (Net Operating Income)"
          value={`${fmt(bwaResult.noi)} €`}
          trend={bwaResult.noi > 0 ? 'up' : bwaResult.noi < 0 ? 'down' : 'neutral'}
        />
        <KPICard
          label="Kostenquote"
          value={pct(bwaResult.costRatio)}
          subtitle="Nicht umlagefähige Kosten / Einnahmen"
          trend={bwaResult.costRatio < 0.2 ? 'up' : bwaResult.costRatio > 0.35 ? 'down' : 'neutral'}
        />
      </div>

      {/* Cashflow */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Cashflow-Analyse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <Row label="Brutto-Mieteinnahmen" value={fmt(bwaResult.grossIncome)} />
            <Row label="− Nicht umlagefähige Kosten" value={fmt(bwaResult.totalCosts)} negative />
            <Separator />
            <Row label="= NOI" value={fmt(bwaResult.noi)} bold />
            <Row label="− Schuldendienst" value={fmt(0)} negative />
            <Separator />
            <Row label="= Cashflow vor Steuern" value={fmt(bwaResult.cashflowBeforeTax)} bold />
            <Row label="+ AfA" value={fmt(bwaResult.cashflowAfterDepreciation - bwaResult.cashflowBeforeTax)} />
            <Separator />
            <Row label="= Cashflow nach AfA" value={fmt(bwaResult.cashflowAfterDepreciation)} bold />
          </div>
        </CardContent>
      </Card>

      {/* Instandhaltungsrücklage */}
      {instandhaltung && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Instandhaltungsrücklage (Peters'sche Formel)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <Row label="Gebäudealter" value={`${instandhaltung.buildingAge} Jahre`} />
              <Row label="Peters-Faktor" value={pct(instandhaltung.petersFactor)} />
              <Row label="Empf. Rücklage p.a." value={`${fmt(instandhaltung.annualReserve)} €`} bold />
              <Row label="Empf. Rücklage mtl." value={`${fmt(instandhaltung.monthlyReserve)} €`} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leerstandsquote */}
      {leerstand && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Leerstandsanalyse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <Row label="Einheiten gesamt" value={String(leerstand.totalUnits)} />
              <Row label="Davon leer" value={String(leerstand.vacantUnits)} />
              <Row label="Leerstandsquote" value={pct(leerstand.vacancyRate)} />
              {leerstand.estimatedLoss > 0 && (
                <Row label="Geschätzte Mietausfälle p.a." value={`${fmt(leerstand.estimatedLoss)} €`} negative />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!annualIncome && (!leases || leases.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Keine Mietdaten vorhanden. Legen Sie Mietverträge an, um die BWA-Analyse zu nutzen.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Sub-Components ──

function KPICard({ label, value, subtitle, trend }: { label: string; value: string; subtitle?: string; trend?: 'up' | 'down' | 'neutral' }) {
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const color = trend === 'up' ? 'text-primary' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{value}</span>
          {trend && <Icon className={`h-4 w-4 ${color}`} />}
        </div>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, bold, negative }: { label: string; value: string; bold?: boolean; negative?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={bold ? 'font-semibold' : ''}>{label}</span>
      <span className={`${bold ? 'font-semibold' : ''} ${negative ? 'text-destructive' : ''}`}>
        {value} {!value.includes('€') && !value.includes('%') && !value.includes('Jahre') ? '' : ''}
      </span>
    </div>
  );
}

export default BWATab;
