/**
 * BWATab — DATEV-konforme BWA + SuSa für eine Vermietereinheit
 * Nutzt den SKR04-Kontenplan und echte Daten statt Prozent-Schätzungen
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertCircle, FileDown, ArrowRightLeft } from 'lucide-react';
import { calcDatevBWA, calcSuSa } from '@/engines/bewirtschaftung/bwaDatev';
import { calculateAfaBasis, calculateAfaAmount } from '@/engines/vvSteuer/engine';
import type { DatevBWAInput } from '@/engines/bewirtschaftung/bwaDatevSpec';
import { cn } from '@/lib/utils';

interface BWATabProps {
  /** All property IDs of the VE */
  propertyIds: string[];
  veName: string;
  tenantId: string;
}

const fmt = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Zeitraum = 'vorjahr' | 'lfd_quartal' | 'custom';
type Ansicht = 'bwa' | 'susa';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth(); // 0-based
const lastQuartalEnd = (() => {
  const q = Math.floor(currentMonth / 3);
  if (q === 0) return `${currentYear - 1}-12-31`;
  return `${currentYear}-${String(q * 3).padStart(2, '0')}-${q === 1 ? '31' : q === 2 ? '30' : '30'}`;
})();

function getZeitraumDates(z: Zeitraum): { von: string; bis: string } {
  switch (z) {
    case 'vorjahr':
      return { von: `${currentYear - 1}-01-01`, bis: `${currentYear - 1}-12-31` };
    case 'lfd_quartal':
      return { von: `${currentYear}-01-01`, bis: lastQuartalEnd };
    default:
      return { von: `${currentYear - 1}-01-01`, bis: `${currentYear - 1}-12-31` };
  }
}

export function BWATab({ propertyIds, veName, tenantId }: BWATabProps) {
  const { activeTenantId } = useAuth();
  const tid = activeTenantId || tenantId;
  const [zeitraum, setZeitraum] = useState<Zeitraum>('vorjahr');
  const [ansicht, setAnsicht] = useState<Ansicht>('bwa');
  const { von, bis } = getZeitraumDates(zeitraum);

  // Fetch all data for BWA calculation
  const { data, isLoading } = useQuery({
    queryKey: ['datev-bwa', propertyIds.join(','), von, bis, tid],
    queryFn: async () => {
      if (!tid || propertyIds.length === 0) return null;

      const [unitsRes, financingRes, accountingRes, annualRes, nkPeriodsRes] = await Promise.all([
        supabase.from('units').select('id, property_id, area_sqm, unit_type').eq('tenant_id', tid).in('property_id', propertyIds),
        (supabase as any).from('property_financing').select('property_id, annual_interest, current_balance, interest_rate, is_active').eq('tenant_id', tid).in('property_id', propertyIds),
        (supabase as any).from('property_accounting').select('property_id, building_share_percent, afa_rate_percent').eq('tenant_id', tid).in('property_id', propertyIds),
        (supabase as any).from('vv_annual_data').select('property_id, income_other, income_insurance_payout, cost_maintenance, cost_management_fee, cost_bank_fees, cost_legal_advisory, cost_other, cost_disagio, cost_financing_fees').eq('tenant_id', tid).in('property_id', propertyIds).eq('tax_year', parseInt(von.substring(0, 4))),
        (supabase as any).from('nk_periods').select('id, property_id').eq('tenant_id', tid).in('property_id', propertyIds).gte('period_start', von).lte('period_end', bis),
      ]);

      const units = unitsRes.data || [];
      const unitIds = units.map((u: any) => u.id);

      let leases: any[] = [];
      if (unitIds.length > 0) {
        const { data: ld } = await supabase.from('leases')
          .select('id, unit_id, rent_cold_eur, nk_advance_eur, status')
          .eq('tenant_id', tid).eq('status', 'active').in('unit_id', unitIds);
        leases = ld || [];
      }

      const periodIds = (nkPeriodsRes.data || []).map((p: any) => p.id);
      let nkItems: any[] = [];
      if (periodIds.length > 0) {
        const { data: ni } = await (supabase as any).from('nk_cost_items').select('nk_period_id, category_code, amount_total_house').in('nk_period_id', periodIds);
        nkItems = ni || [];
      }

      // Get properties for purchase_price
      const { data: props } = await supabase.from('properties').select('id, purchase_price, year_built').in('id', propertyIds);

      return { units, leases, financing: financingRes.data || [], accounting: accountingRes.data || [], annual: annualRes.data || [], nkItems, properties: props || [] };
    },
    enabled: !!tid && propertyIds.length > 0,
  });

  const bwaResult = useMemo(() => {
    if (!data) return null;

    // Aggregate all leases
    const stellplatzUnitIds = data.units.filter((u: any) => u.unit_type === 'stellplatz' || u.unit_type === 'garage').map((u: any) => u.id);
    const wohnLeases = data.leases.filter((l: any) => !stellplatzUnitIds.includes(l.unit_id));
    const stellLeases = data.leases.filter((l: any) => stellplatzUnitIds.includes(l.unit_id));

    // NK costs by category
    const nkKosten: Record<string, number> = {};
    for (const item of data.nkItems) {
      const code = item.category_code || 'sonstig';
      nkKosten[code] = (nkKosten[code] || 0) + (item.amount_total_house || 0);
    }

    // Aggregate annual data across all properties
    const annualAgg = data.annual.reduce((acc: any, a: any) => ({
      incomeOther: acc.incomeOther + (a.income_other || 0),
      insurancePayout: acc.insurancePayout + (a.income_insurance_payout || 0),
      maintenance: acc.maintenance + (a.cost_maintenance || 0),
      management: acc.management + (a.cost_management_fee || 0),
      bankFees: acc.bankFees + (a.cost_bank_fees || 0),
      legal: acc.legal + (a.cost_legal_advisory || 0),
      other: acc.other + (a.cost_other || 0),
      disagio: acc.disagio + (a.cost_disagio || 0),
      finFees: acc.finFees + (a.cost_financing_fees || 0),
    }), { incomeOther: 0, insurancePayout: 0, maintenance: 0, management: 0, bankFees: 0, legal: 0, other: 0, disagio: 0, finFees: 0 });

    // Financing
    const activeFinancing = data.financing.filter((f: any) => f.is_active !== false);
    const zinsaufwand = activeFinancing.reduce((s: number, f: any) => {
      if (f.annual_interest > 0) return s + f.annual_interest;
      if (f.current_balance && f.interest_rate) return s + (f.current_balance * f.interest_rate / 100);
      return s;
    }, 0);

    // AfA
    let totalAfa = 0;
    for (const prop of data.properties) {
      const acc = data.accounting.find((a: any) => a.property_id === prop.id);
      if (prop.purchase_price && acc) {
        const basis = calculateAfaBasis(prop.purchase_price, 0, acc.building_share_percent || 70);
        totalAfa += calculateAfaAmount(basis, acc.afa_rate_percent || 2);
      }
    }

    const input: DatevBWAInput = {
      mietertragWohnraum: wohnLeases.reduce((s: number, l: any) => s + (l.rent_cold_eur || 0) * 12, 0),
      mietertragStellplaetze: stellLeases.reduce((s: number, l: any) => s + (l.rent_cold_eur || 0) * 12, 0),
      nkVorauszahlungen: data.leases.reduce((s: number, l: any) => s + (l.nk_advance_eur || 0) * 12, 0),
      sonstigeErtraege: annualAgg.incomeOther,
      versicherungserstattungen: annualAgg.insurancePayout,
      nkKosten,
      instandhaltung: annualAgg.maintenance,
      verwaltung: annualAgg.management,
      steuerberatung: 0,
      bankgebuehren: annualAgg.bankFees,
      rechtsberatung: annualAgg.legal,
      sonstigeVerwaltung: annualAgg.other,
      zinsaufwand,
      sonstigeFinanzierung: annualAgg.disagio + annualAgg.finFees,
      afaGebaeude: totalAfa,
      afaBga: 0,
    };

    return calcDatevBWA(input, veName, von, bis);
  }, [data, veName, von, bis]);

  const susaResult = useMemo(() => {
    if (!bwaResult) return null;
    return calcSuSa(bwaResult);
  }, [bwaResult]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!bwaResult || !data) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Keine Daten für den gewählten Zeitraum vorhanden.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Select value={zeitraum} onValueChange={v => setZeitraum(v as Zeitraum)}>
            <SelectTrigger className="w-[220px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vorjahr">Vorjahr ({currentYear - 1})</SelectItem>
              <SelectItem value="lfd_quartal">Lfd. Jahr bis letztes Quartal</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-xs">{von} — {bis}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={ansicht === 'bwa' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAnsicht('bwa')}
          >
            BWA
          </Button>
          <Button
            variant={ansicht === 'susa' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAnsicht('susa')}
          >
            <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
            SuSa
          </Button>
        </div>
      </div>

      {ansicht === 'bwa' ? (
        <BWAView bwa={bwaResult} />
      ) : (
        susaResult && <SuSaView susa={susaResult} />
      )}
    </div>
  );
}

function BWAView({ bwa }: { bwa: NonNullable<ReturnType<typeof calcDatevBWA>> }) {
  const ertragsKats = bwa.kategorien.filter(k => k.code === 'BWA-10' || k.code === 'BWA-20');
  const aufwandKats = bwa.kategorien.filter(k => !['BWA-10', 'BWA-20'].includes(k.code));

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">BWA — {bwa.veName}</h3>
          <p className="text-xs text-muted-foreground">{bwa.zeitraumVon} bis {bwa.zeitraumBis}</p>
        </div>

        <div className="divide-y">
          {/* Erträge */}
          {ertragsKats.map(kat => (
            <KategorieBlock key={kat.code} kat={kat} />
          ))}

          {/* Gesamtleistung */}
          <div className="px-4 py-3 bg-muted/30">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm">GESAMTLEISTUNG</span>
              <span className="font-bold text-sm">{fmt(bwa.gesamtleistung)} €</span>
            </div>
          </div>

          {/* Aufwand */}
          {aufwandKats.map(kat => (
            <KategorieBlock key={kat.code} kat={kat} isAufwand />
          ))}

          {/* Gesamtaufwand */}
          <div className="px-4 py-3 bg-muted/30">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm">GESAMTAUFWAND</span>
              <span className="font-bold text-sm text-destructive">{fmt(bwa.gesamtaufwand)} €</span>
            </div>
          </div>

          {/* Betriebsergebnis */}
          <div className="px-4 py-4 bg-primary/5">
            <div className="flex justify-between items-center">
              <span className="font-bold">BETRIEBSERGEBNIS</span>
              <span className={cn(
                "font-bold text-lg",
                bwa.betriebsergebnis >= 0 ? "text-primary" : "text-destructive"
              )}>
                {fmt(bwa.betriebsergebnis)} €
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KategorieBlock({ kat, isAufwand }: { kat: ReturnType<typeof calcDatevBWA>['kategorien'][0]; isAufwand?: boolean }) {
  if (kat.konten.length === 0 && kat.summe === 0) return null;

  return (
    <div className="px-4 py-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{kat.code}: {kat.name}</span>
      </div>
      {kat.konten.map(konto => (
        <div key={konto.kontoNr} className="flex justify-between items-center py-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-xs w-10">{konto.kontoNr}</span>
            <span>{konto.name}</span>
            <Badge variant="outline" className="text-[9px] h-4">{konto.quelle}</Badge>
          </div>
          <span className={isAufwand ? 'text-destructive' : ''}>{fmt(konto.betrag)} €</span>
        </div>
      ))}
      <Separator className="my-1" />
      <div className="flex justify-between items-center text-sm font-medium">
        <span>Summe {kat.code}</span>
        <span className={isAufwand ? 'text-destructive' : ''}>{fmt(kat.summe)} €</span>
      </div>
    </div>
  );
}

function SuSaView({ susa }: { susa: NonNullable<ReturnType<typeof calcSuSa>> }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">SuSa — {susa.veName}</h3>
          <p className="text-xs text-muted-foreground">{susa.zeitraumVon} bis {susa.zeitraumBis}</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 font-mono">Kto</TableHead>
              <TableHead>Bezeichnung</TableHead>
              <TableHead className="text-right w-24">EB</TableHead>
              <TableHead className="text-right w-24">Soll</TableHead>
              <TableHead className="text-right w-24">Haben</TableHead>
              <TableHead className="text-right w-16">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {susa.eintraege.map(e => (
              <TableRow key={e.kontoNr}>
                <TableCell className="font-mono text-xs">{e.kontoNr}</TableCell>
                <TableCell className="text-sm">{e.name}</TableCell>
                <TableCell className="text-right text-sm">{fmt(e.eb)}</TableCell>
                <TableCell className="text-right text-sm">{e.soll > 0 ? fmt(e.soll) : '—'}</TableCell>
                <TableCell className="text-right text-sm">{e.haben > 0 ? fmt(e.haben) : '—'}</TableCell>
                <TableCell className="text-right text-sm font-medium">
                  <Badge variant="outline" className={cn("text-[10px]", e.saldoSeite === 'S' ? 'text-destructive' : 'text-primary')}>
                    {e.saldoSeite}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="font-bold">SUMMEN</TableCell>
              <TableCell className="text-right font-bold">{fmt(0)}</TableCell>
              <TableCell className="text-right font-bold">{fmt(susa.summenSoll)}</TableCell>
              <TableCell className="text-right font-bold">{fmt(susa.summenHaben)}</TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

export default BWATab;
