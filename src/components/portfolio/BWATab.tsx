/**
 * BWATab — DATEV-konforme BWA (Kurzfristige Erfolgsrechnung) + SuSa
 * SKR04, Immobilien V+V
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
import { Loader2, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { calcDatevBWA, calcSuSa } from '@/engines/bewirtschaftung/bwaDatev';
import { calculateAfaBasis, calculateAfaAmount } from '@/engines/vvSteuer/engine';
import type { DatevBWAInput, DatevBWAResult, DatevBWAKategorie, SuSaResult, SuSaBilanzInput } from '@/engines/bewirtschaftung/bwaDatevSpec';
import { cn } from '@/lib/utils';

interface BWATabProps {
  propertyIds: string[];
  veName: string;
  tenantId: string;
}

const fmt = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n: number, base: number) => base === 0 ? '—' : `${(n / base * 100).toFixed(1)} %`;

type Zeitraum = 'vorjahr' | 'lfd_quartal';
type Ansicht = 'bwa' | 'susa';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();
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

  const { data, isLoading } = useQuery({
    queryKey: ['datev-bwa', propertyIds.join(','), von, bis, tid],
    queryFn: async () => {
      if (!tid || propertyIds.length === 0) return null;

      const [unitsRes, financingRes, accountingRes, annualRes, nkPeriodsRes] = await Promise.all([
        supabase.from('units').select('id, property_id, area_sqm, unit_type').eq('tenant_id', tid).in('property_id', propertyIds),
        (supabase as any).from('property_financing').select('id, property_id, bank_name, loan_number, annual_interest, current_balance, interest_rate, is_active').eq('tenant_id', tid).in('property_id', propertyIds),
        (supabase as any).from('property_accounting').select('property_id, building_share_percent, afa_rate_percent, ak_building, ak_ground').eq('tenant_id', tid).in('property_id', propertyIds),
        (supabase as any).from('vv_annual_data').select('property_id, income_other, income_insurance_payout, cost_maintenance, cost_management_fee, cost_bank_fees, cost_legal_advisory, cost_other, cost_disagio, cost_financing_fees').eq('tenant_id', tid).in('property_id', propertyIds).eq('tax_year', parseInt(von.substring(0, 4))),
        (supabase as any).from('nk_periods').select('id, property_id').eq('tenant_id', tid).in('property_id', propertyIds).gte('period_start', von).lte('period_end', bis),
      ]);

      const units = unitsRes.data || [];
      const unitIds = units.map((u: any) => u.id);

      let leases: any[] = [];
      if (unitIds.length > 0) {
        const { data: ld } = await supabase.from('leases')
          .select('id, unit_id, rent_cold_eur, nk_advance_eur, deposit_amount_eur, status')
          .eq('tenant_id', tid).eq('status', 'active').in('unit_id', unitIds);
        leases = ld || [];
      }

      const periodIds = (nkPeriodsRes.data || []).map((p: any) => p.id);
      let nkItems: any[] = [];
      if (periodIds.length > 0) {
        const { data: ni } = await (supabase as any).from('nk_cost_items').select('nk_period_id, category_code, amount_total_house').in('nk_period_id', periodIds);
        nkItems = ni || [];
      }

      const { data: props } = await supabase.from('properties').select('id, purchase_price, year_built').in('id', propertyIds);

      // Bank accounts for SuSa
      let bankAccounts: any[] = [];
      const { data: ba } = await (supabase as any).from('bank_accounts').select('id, current_balance').eq('tenant_id', tid);
      bankAccounts = ba || [];

      return {
        units, leases,
        financing: financingRes.data || [],
        accounting: accountingRes.data || [],
        annual: annualRes.data || [],
        nkItems,
        properties: props || [],
        bankAccounts,
      };
    },
    enabled: !!tid && propertyIds.length > 0,
  });

  const { bwaResult, susaResult } = useMemo(() => {
    if (!data) return { bwaResult: null, susaResult: null };

    // NK costs by category
    const nkByCode: Record<string, number> = {};
    for (const item of data.nkItems) {
      const code = item.category_code || 'sonstig';
      nkByCode[code] = (nkByCode[code] || 0) + (item.amount_total_house || 0);
    }

    // Aggregate annual data
    const ann = data.annual.reduce((acc: any, a: any) => ({
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

    // Darlehen einzeln
    const activeFinancing = data.financing.filter((f: any) => f.is_active !== false);
    const darlehen = activeFinancing.map((f: any) => {
      let zins = f.annual_interest > 0 ? f.annual_interest : (f.current_balance && f.interest_rate ? f.current_balance * f.interest_rate / 100 : 0);
      return {
        id: f.id,
        bankName: f.bank_name || 'Darlehen',
        loanNumber: f.loan_number || '',
        zinsaufwand: zins,
      };
    });

    // AfA
    let totalAfa = 0;
    for (const prop of data.properties) {
      const acc = data.accounting.find((a: any) => a.property_id === prop.id);
      if (prop.purchase_price && acc) {
        const basis = calculateAfaBasis(prop.purchase_price, 0, acc.building_share_percent || 70);
        totalAfa += calculateAfaAmount(basis, acc.afa_rate_percent || 2);
      }
    }

    // Mieteinnahmen gesamt
    const mietertragGesamt = data.leases.reduce((s: number, l: any) => s + (l.rent_cold_eur || 0) * 12, 0);
    const nkVorauszahlungen = data.leases.reduce((s: number, l: any) => s + (l.nk_advance_eur || 0) * 12, 0);

    const input: DatevBWAInput = {
      mietertragGesamt,
      nkVorauszahlungen,
      sonstigeBetrErloese: ann.incomeOther,
      versicherungserstattungen: ann.insurancePayout,
      gasStromWasser: (nkByCode['wasser_abwasser'] || 0) + (nkByCode['allgemeinstrom'] || 0),
      grundstuecksaufwand: (nkByCode['gartenpflege'] || 0) + (nkByCode['strassenreinigung'] || 0),
      grundsteuer: nkByCode['grundsteuer'] || 0,
      versicherungAllgemein: nkByCode['haftpflicht'] || 0,
      gebaeudeversicherung: nkByCode['gebaeudeversicherung'] || 0,
      beitraege: 0,
      sonstigeAbgaben: nkByCode['muell_entsorgung'] || 0,
      afaSachanlagen: 0,
      afaGebaeude: totalAfa,
      afaGwg: 0,
      instandhaltung: ann.maintenance,
      verwaltung: ann.management,
      rechtsberatung: ann.legal,
      bankgebuehren: ann.bankFees,
      abfallbeseitigung: 0,
      darlehen,
      sonstigeFinanzierung: ann.disagio + ann.finFees,
    };

    const bwa = calcDatevBWA(input, veName, von, bis);

    // SuSa Bilanz-Input
    let akGrundstuecke = 0, akGebaeude = 0, kumulierteAfa = 0;
    for (const prop of data.properties) {
      const acc = data.accounting.find((a: any) => a.property_id === prop.id);
      if (acc) {
        akGrundstuecke += acc.ak_ground || 0;
        akGebaeude += acc.ak_building || 0;
        // Approximate cumulative AfA (years since purchase * annual AfA)
        const yearBuilt = prop.year_built || 2000;
        const purchaseYear = yearBuilt; // simplified
        const years = parseInt(von.substring(0, 4)) - purchaseYear;
        if (years > 0 && prop.purchase_price && acc) {
          const basis = calculateAfaBasis(prop.purchase_price, 0, acc.building_share_percent || 70);
          kumulierteAfa += calculateAfaAmount(basis, acc.afa_rate_percent || 2) * years;
        }
      }
    }

    const bankguthaben = data.bankAccounts.reduce((s: number, b: any) => s + (b.current_balance || 0), 0);
    const kautionen = data.leases.reduce((s: number, l: any) => s + (l.deposit_amount_eur || 0), 0);

    const bilanzInput: SuSaBilanzInput = {
      akGrundstuecke,
      akGebaeude,
      kumulierteAfaGebaeude: kumulierteAfa,
      bankguthaben,
      mietforderungen: 0,
      darlehenSalden: activeFinancing.map((f: any, i: number) => ({
        kontoNr: `33${(10 + i).toString()}`,
        name: `Darlehen ${f.bank_name || ''} ${f.loan_number || ''}`.trim(),
        saldo: f.current_balance || 0,
      })),
      kautionen,
    };

    const susa = calcSuSa(bwa, bilanzInput);
    return { bwaResult: bwa, susaResult: susa };
  }, [data, veName, von, bis]);

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
          <Button variant={ansicht === 'bwa' ? 'default' : 'outline'} size="sm" onClick={() => setAnsicht('bwa')}>BWA</Button>
          <Button variant={ansicht === 'susa' ? 'default' : 'outline'} size="sm" onClick={() => setAnsicht('susa')}>
            <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />SuSa
          </Button>
        </div>
      </div>

      {ansicht === 'bwa' ? <BWAView bwa={bwaResult} /> : susaResult && <SuSaView susa={susaResult} />}
    </div>
  );
}

// ── BWA View ────────────────────────────────────────────────────────────────

function BWAView({ bwa }: { bwa: DatevBWAResult }) {
  const gl = bwa.gesamtleistung;
  const gk = bwa.gesamtkosten;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">Kurzfristige Erfolgsrechnung — {bwa.veName}</h3>
          <p className="text-xs text-muted-foreground">{bwa.zeitraumVon} bis {bwa.zeitraumBis} · DATEV-BWA (SKR04)</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 font-mono text-xs">Kto</TableHead>
              <TableHead>Berichtsposition</TableHead>
              <TableHead className="text-right w-28">EUR</TableHead>
              <TableHead className="text-right w-20">% Ges.L.</TableHead>
              <TableHead className="text-right w-20">% Ges.K.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* ── LEISTUNG ── */}
            <SectionHeader label="LEISTUNG" />
            <KatRows kat={bwa.umsatzerloese} gl={gl} gk={gk} />
            <KatRows kat={bwa.nkUmlagen} gl={gl} gk={gk} />
            <SubtotalRow label="Gesamtleistung" value={bwa.gesamtleistung} bold />
            <SubtotalRow label="Rohertrag" value={bwa.rohertrag} />
            {bwa.sonstigeBetrErloese > 0 && (
              <TableRow>
                <TableCell />
                <TableCell className="text-sm">So. betriebl. Erlöse</TableCell>
                <TableCell className="text-right text-sm">{fmt(bwa.sonstigeBetrErloese)}</TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">{pct(bwa.sonstigeBetrErloese, gl)}</TableCell>
                <TableCell />
              </TableRow>
            )}
            <SubtotalRow label="Betrieblicher Rohertrag" value={bwa.betriebsRohertrag} bold />

            {/* ── KOSTENARTEN ── */}
            <SectionHeader label="KOSTENARTEN" />
            <KatRows kat={bwa.personalkosten} gl={gl} gk={gk} isAufwand />
            <KatRows kat={bwa.raumkosten} gl={gl} gk={gk} isAufwand />
            <KatRows kat={bwa.betrieblicheSteuern} gl={gl} gk={gk} isAufwand />
            <KatRows kat={bwa.versicherungen} gl={gl} gk={gk} isAufwand />
            <KatRows kat={bwa.abschreibungen} gl={gl} gk={gk} isAufwand />
            <KatRows kat={bwa.reparatur} gl={gl} gk={gk} isAufwand />
            <KatRows kat={bwa.sonstigeKosten} gl={gl} gk={gk} isAufwand />
            <SubtotalRow label="Gesamtkosten" value={bwa.gesamtkosten} bold isNegative />

            {/* ── BETRIEBSERGEBNIS ── */}
            <ErgebnisRow label="BETRIEBSERGEBNIS" value={bwa.betriebsergebnis} highlight />

            {/* ── NEUTRALES ERGEBNIS ── */}
            <SectionHeader label="NEUTRALES ERGEBNIS" />
            <KatRows kat={bwa.zinsaufwand} gl={gl} gk={gk} isAufwand />
            <SubtotalRow label="Neutraler Aufwand" value={bwa.neutralerAufwand} isNegative />
            <KatRows kat={bwa.neutralerErtrag} gl={gl} gk={gk} />
            <SubtotalRow label="Neutrales Ergebnis" value={bwa.neutralesErgebnis} />

            {/* ── VORL. ERGEBNIS ── */}
            <ErgebnisRow label="Ergebnis vor Steuern" value={bwa.ergebnisVorSteuern} />
            <ErgebnisRow label="VORLÄUFIGES ERGEBNIS" value={bwa.vorlaeufligesErgebnis} highlight />
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <TableRow className="bg-muted/40">
      <TableCell colSpan={5} className="py-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </TableCell>
    </TableRow>
  );
}

function KatRows({ kat, gl, gk, isAufwand }: { kat: DatevBWAKategorie; gl: number; gk: number; isAufwand?: boolean }) {
  if (kat.konten.length === 0 && kat.summe === 0) {
    // Show category header with 0,00
    return (
      <TableRow className="text-muted-foreground">
        <TableCell />
        <TableCell className="text-sm italic">{kat.name}</TableCell>
        <TableCell className="text-right text-sm">0,00</TableCell>
        <TableCell className="text-right text-xs">0,0 %</TableCell>
        <TableCell className="text-right text-xs">0,0 %</TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {kat.konten.map(k => (
        <TableRow key={k.kontoNr}>
          <TableCell className="font-mono text-xs text-muted-foreground">{k.kontoNr}</TableCell>
          <TableCell className="text-sm">{k.name}</TableCell>
          <TableCell className={cn("text-right text-sm", isAufwand && "text-destructive")}>{isAufwand ? `-${fmt(k.betrag)}` : fmt(k.betrag)}</TableCell>
          <TableCell className="text-right text-xs text-muted-foreground">{pct(k.betrag, gl)}</TableCell>
          <TableCell className="text-right text-xs text-muted-foreground">{isAufwand ? pct(k.betrag, gk) : '—'}</TableCell>
        </TableRow>
      ))}
      {kat.konten.length > 1 && (
        <TableRow className="border-t">
          <TableCell />
          <TableCell className="text-sm font-medium">Σ {kat.name}</TableCell>
          <TableCell className={cn("text-right text-sm font-medium", isAufwand && "text-destructive")}>{isAufwand ? `-${fmt(kat.summe)}` : fmt(kat.summe)}</TableCell>
          <TableCell className="text-right text-xs text-muted-foreground">{pct(kat.summe, gl)}</TableCell>
          <TableCell className="text-right text-xs text-muted-foreground">{isAufwand ? pct(kat.summe, gk) : '—'}</TableCell>
        </TableRow>
      )}
    </>
  );
}

function SubtotalRow({ label, value, bold, isNegative }: { label: string; value: number; bold?: boolean; isNegative?: boolean }) {
  return (
    <TableRow className="bg-muted/20">
      <TableCell />
      <TableCell className={cn("text-sm", bold && "font-bold")}>{label}</TableCell>
      <TableCell className={cn("text-right text-sm", bold && "font-bold", isNegative && "text-destructive")}>
        {isNegative ? `-${fmt(value)}` : fmt(value)}
      </TableCell>
      <TableCell />
      <TableCell />
    </TableRow>
  );
}

function ErgebnisRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <TableRow className={highlight ? "bg-primary/5" : "bg-muted/30"}>
      <TableCell />
      <TableCell className="font-bold text-sm">{label}</TableCell>
      <TableCell className={cn("text-right font-bold text-sm", value >= 0 ? "text-primary" : "text-destructive")}>
        {fmt(value)} €
      </TableCell>
      <TableCell />
      <TableCell />
    </TableRow>
  );
}

// ── SuSa View ───────────────────────────────────────────────────────────────

const KLASSE_NAMEN: Record<number, string> = {
  0: 'Anlagevermögen',
  1: 'Umlaufvermögen',
  2: 'Eigenkapital',
  3: 'Verbindlichkeiten',
  4: 'Erträge',
  6: 'Aufwendungen',
  7: 'Zinsen / Steuern',
  9: 'Saldenvorträge',
};

function SuSaView({ susa }: { susa: SuSaResult }) {
  // Group by class
  const klassen = Object.keys(KLASSE_NAMEN).map(Number).filter(k => {
    return susa.eintraege.some(e => e.klasse === k) || susa.summenProKlasse[k];
  });

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">Summen- und Saldenliste — {susa.veName}</h3>
          <p className="text-xs text-muted-foreground">{susa.zeitraumVon} bis {susa.zeitraumBis} · DATEV-SuSa (SKR04)</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 font-mono">Kto</TableHead>
              <TableHead>Bezeichnung</TableHead>
              <TableHead className="text-right w-24">EB</TableHead>
              <TableHead className="text-right w-24">Soll</TableHead>
              <TableHead className="text-right w-24">Haben</TableHead>
              <TableHead className="text-right w-24">Saldo</TableHead>
              <TableHead className="text-right w-12">S/H</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {klassen.map(kl => {
              const entries = susa.eintraege.filter(e => e.klasse === kl);
              const ksum = susa.summenProKlasse[kl] || { soll: 0, haben: 0 };
              return (
                <KlasseBlock key={kl} klasse={kl} entries={entries} sumSoll={ksum.soll} sumHaben={ksum.haben} />
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="font-bold">SUMMEN</TableCell>
              <TableCell className="text-right font-bold">{fmt(susa.summenSoll)}</TableCell>
              <TableCell className="text-right font-bold">{fmt(susa.summenHaben)}</TableCell>
              <TableCell />
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

function KlasseBlock({ klasse, entries, sumSoll, sumHaben }: { klasse: number; entries: SuSaResult['eintraege']; sumSoll: number; sumHaben: number }) {
  return (
    <>
      <TableRow className="bg-muted/40">
        <TableCell colSpan={7} className="py-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Klasse {klasse}: {KLASSE_NAMEN[klasse] || `Klasse ${klasse}`}
          </span>
        </TableCell>
      </TableRow>
      {entries.map(e => (
        <TableRow key={e.kontoNr}>
          <TableCell className="font-mono text-xs">{e.kontoNr}</TableCell>
          <TableCell className="text-sm">{e.name}</TableCell>
          <TableCell className="text-right text-sm">{e.eb > 0 ? fmt(e.eb) : '—'}</TableCell>
          <TableCell className="text-right text-sm">{e.soll > 0 ? fmt(e.soll) : '—'}</TableCell>
          <TableCell className="text-right text-sm">{e.haben > 0 ? fmt(e.haben) : '—'}</TableCell>
          <TableCell className="text-right text-sm font-medium">{fmt(e.saldo)}</TableCell>
          <TableCell className="text-right">
            <Badge variant="outline" className={cn("text-[10px]", e.saldoSeite === 'S' ? 'text-destructive' : 'text-primary')}>
              {e.saldoSeite}
            </Badge>
          </TableCell>
        </TableRow>
      ))}
      <TableRow className="border-t bg-muted/20">
        <TableCell />
        <TableCell className="text-sm font-medium">Σ Klasse {klasse}</TableCell>
        <TableCell />
        <TableCell className="text-right text-sm font-medium">{fmt(sumSoll)}</TableCell>
        <TableCell className="text-right text-sm font-medium">{fmt(sumHaben)}</TableCell>
        <TableCell />
        <TableCell />
      </TableRow>
    </>
  );
}

export default BWATab;
