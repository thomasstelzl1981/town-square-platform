/**
 * Finanzierungsrechner — Angebotsrechner für FM Dashboard
 * Eingaben: Kaufpreis, EK, Zinsbindung, Tilgung, Beschäftigung, Einkommen, Objektart
 * Ergebnis: Monatliche Rate, Effektivzins, LTV-Ampel, Restschuld, Tilgungsplan-Tabelle + PDF
 */
import { useState, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Calculator, FileDown, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import { calcAnnuity } from '@/engines/finanzierung/engine';
import { PdfExportButton, usePdfContentRef } from '@/components/pdf';

// ─── Constants ──────────────────────────────────────────────
const EUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const EUR2 = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const PCT = (v: number) => `${v.toFixed(2).replace('.', ',')} %`;

const ZINSBINDUNG_OPTIONS = [5, 10, 15, 20, 25, 30] as const;

const BESCHAEFTIGUNG_OPTIONS = [
  { value: 'angestellt', label: 'Angestellt' },
  { value: 'beamter', label: 'Beamter' },
  { value: 'selbstaendig', label: 'Selbständig' },
  { value: 'rentner', label: 'Rentner' },
] as const;

const OBJEKTART_OPTIONS = [
  { value: 'etw', label: 'Eigentumswohnung' },
  { value: 'efh', label: 'Einfamilienhaus' },
  { value: 'mfh', label: 'Mehrfamilienhaus' },
  { value: 'grundstueck', label: 'Grundstück' },
] as const;

// Base rates by Zinsbindung (simulated market data)
const BASE_RATES: Record<number, number> = {
  5: 3.15, 10: 3.45, 15: 3.62, 20: 3.78, 25: 3.90, 30: 4.05,
};

// Employment adjustment
const EMPLOYMENT_SPREAD: Record<string, number> = {
  angestellt: 0,
  beamter: -0.10,
  selbstaendig: 0.30,
  rentner: 0.15,
};

// LTV adjustment
function ltvSpread(ltv: number): number {
  if (ltv <= 0.6) return -0.15;
  if (ltv <= 0.8) return 0;
  if (ltv <= 0.9) return 0.20;
  return 0.45;
}

function ltvBadge(ltv: number) {
  if (ltv <= 0.8) return { label: `${(ltv * 100).toFixed(0)}%`, variant: 'default' as const, color: 'bg-emerald-500/15 text-emerald-700 border-emerald-200' };
  if (ltv <= 0.9) return { label: `${(ltv * 100).toFixed(0)}%`, variant: 'outline' as const, color: 'bg-amber-500/15 text-amber-700 border-amber-200' };
  return { label: `${(ltv * 100).toFixed(0)}%`, variant: 'destructive' as const, color: 'bg-red-500/15 text-red-700 border-red-200' };
}

// ─── Helpers ────────────────────────────────────────────────
function parseNum(v: string): number {
  return parseFloat(v.replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
}

// ─── Component ──────────────────────────────────────────────
export default function FinanzierungsRechner() {
  const pdfRef = usePdfContentRef();

  // Inputs
  const [kaufpreis, setKaufpreis] = useState('');
  const [eigenkapital, setEigenkapital] = useState('');
  const [zinsbindung, setZinsbindung] = useState(10);
  const [tilgung, setTilgung] = useState(1.5);
  const [beschaeftigung, setBeschaeftigung] = useState('angestellt');
  const [nettoEinkommen, setNettoEinkommen] = useState('');
  const [objektart, setObjektart] = useState('etw');
  const [calculated, setCalculated] = useState(false);

  const kp = parseNum(kaufpreis);
  const ek = parseNum(eigenkapital);
  const nk = kp * 0.08; // ~8% Nebenkosten (Grunderwerbsteuer, Notar, Makler)
  const darlehen = Math.max(0, kp + nk - ek);
  const ltv = kp > 0 ? darlehen / kp : 0;
  const netto = parseNum(nettoEinkommen);

  // Interest rate calculation
  const baseRate = BASE_RATES[zinsbindung] ?? 3.45;
  const spread = (EMPLOYMENT_SPREAD[beschaeftigung] ?? 0) + ltvSpread(ltv);
  const zinssatz = Math.max(1.0, baseRate + spread);

  // Annuity calculation
  const result = useMemo(() => {
    if (darlehen <= 0) return null;
    return calcAnnuity({
      loanAmount: darlehen,
      interestRatePercent: zinssatz,
      repaymentRatePercent: tilgung,
      fixedRatePeriodYears: zinsbindung,
    });
  }, [darlehen, zinssatz, tilgung, zinsbindung]);

  const ltvInfo = ltvBadge(ltv);

  const handleBerechnen = () => {
    setCalculated(true);
  };

  const isValid = kp > 0 && darlehen > 0;

  return (
    <div className="space-y-4">
      <div ref={pdfRef}>
        {/* Two-column: Inputs + Results */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* LEFT: Inputs (3 cols) */}
          <Card className="lg:col-span-3 border-0 shadow-card">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calculator className="h-4 w-4 text-primary" />
                </div>
                <h4 className="text-sm font-bold">Eingaben</h4>
              </div>

              {/* Row 1: Kaufpreis + Eigenkapital */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Kaufpreis</Label>
                  <Input
                    placeholder="z.B. 400.000"
                    value={kaufpreis}
                    onChange={e => { setKaufpreis(e.target.value); setCalculated(false); }}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Eigenkapital</Label>
                  <Input
                    placeholder="z.B. 80.000"
                    value={eigenkapital}
                    onChange={e => { setEigenkapital(e.target.value); setCalculated(false); }}
                  />
                </div>
              </div>

              {/* Computed: Nebenkosten + Darlehensbetrag */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/40 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-muted-foreground">Nebenkosten (~8%)</p>
                  <p className="text-sm font-mono font-semibold">{kp > 0 ? EUR.format(nk) : '—'}</p>
                </div>
                <div className="bg-muted/40 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-muted-foreground">Darlehensbetrag</p>
                  <p className="text-sm font-mono font-semibold">{darlehen > 0 ? EUR.format(darlehen) : '—'}</p>
                </div>
              </div>

              {/* Row 2: Zinsbindung */}
              <div>
                <Label className="text-xs text-muted-foreground">Zinsbindung</Label>
                <div className="flex gap-1.5 mt-1">
                  {ZINSBINDUNG_OPTIONS.map(y => (
                    <Button
                      key={y}
                      size="sm"
                      variant={zinsbindung === y ? 'default' : 'outline'}
                      className="flex-1 text-xs h-8"
                      onClick={() => { setZinsbindung(y); setCalculated(false); }}
                    >
                      {y}J
                    </Button>
                  ))}
                </div>
              </div>

              {/* Row 3: Tilgungssatz (SLIDER — adjustable!) */}
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Anfängliche Tilgung</Label>
                  <span className="text-sm font-mono font-bold text-primary">{tilgung.toFixed(1).replace('.', ',')} %</span>
                </div>
                <Slider
                  min={1.0}
                  max={5.0}
                  step={0.1}
                  value={[tilgung]}
                  onValueChange={([v]) => { setTilgung(v); setCalculated(false); }}
                  className="mt-2"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                  <span>1,0%</span>
                  <span>5,0%</span>
                </div>
              </div>

              {/* Row 4: Beschäftigung + Objektart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Beschäftigungsverhältnis</Label>
                  <Select value={beschaeftigung} onValueChange={v => { setBeschaeftigung(v); setCalculated(false); }}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BESCHAEFTIGUNG_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Objektart</Label>
                  <Select value={objektart} onValueChange={v => { setObjektart(v); setCalculated(false); }}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OBJEKTART_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 5: Netto-Einkommen */}
              <div>
                <Label className="text-xs text-muted-foreground">Monatl. Netto-Einkommen</Label>
                <Input
                  placeholder="z.B. 4.500"
                  value={nettoEinkommen}
                  onChange={e => { setNettoEinkommen(e.target.value); setCalculated(false); }}
                />
              </div>

              {/* CTA */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleBerechnen}
                disabled={!isValid}
              >
                <Calculator className="h-4 w-4 mr-2" />
                Finanzierung berechnen
              </Button>
            </CardContent>
          </Card>

          {/* RIGHT: Results (2 cols) */}
          <Card className="lg:col-span-2 border-0 shadow-card">
            <CardContent className="p-5 space-y-4">
              <h4 className="text-sm font-bold">Ergebnis</h4>

              {!calculated || !result ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground opacity-60">
                  <TrendingDown className="h-10 w-10 mb-2" />
                  <p className="text-xs">Bitte Eingaben ausfüllen und berechnen</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Monthly Rate — hero stat */}
                  <div className="bg-primary/5 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monatliche Rate</p>
                    <p className="text-3xl font-bold font-mono text-primary mt-1">{EUR2.format(result.monthlyRate)}</p>
                  </div>

                  {/* Key figures grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-muted-foreground">Sollzins (nom.)</p>
                      <p className="text-sm font-mono font-semibold">{PCT(zinssatz)}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-muted-foreground">Tilgung p.a.</p>
                      <p className="text-sm font-mono font-semibold">{PCT(tilgung)}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-muted-foreground">LTV</p>
                      <Badge className={cn('text-[10px] font-mono', ltvInfo.color)}>{ltvInfo.label}</Badge>
                    </div>
                    <div className="bg-muted/30 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-muted-foreground">Restschuld n. {zinsbindung}J</p>
                      <p className="text-sm font-mono font-semibold">{EUR.format(result.remainingDebt)}</p>
                    </div>
                  </div>

                  {/* Additional info */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Zinsen gesamt ({zinsbindung}J)</span>
                      <span className="font-mono">{EUR.format(result.totalInterest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tilgung gesamt ({zinsbindung}J)</span>
                      <span className="font-mono">{EUR.format(result.totalRepayment)}</span>
                    </div>
                    {netto > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Belastungsquote</span>
                        <span className="font-mono">{((result.monthlyRate / netto) * 100).toFixed(1).replace('.', ',')}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* TILGUNGSPLAN TABLE */}
        {calculated && result && result.schedule.length > 0 && (
          <Card className="border-0 shadow-card mt-4">
            <CardContent className="p-5">
              <h4 className="text-sm font-bold mb-3">Tilgungsplan</h4>
              <div className="overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Jahr</TableHead>
                      <TableHead className="text-xs text-right">Restschuld Beginn</TableHead>
                      <TableHead className="text-xs text-right">Zinsen</TableHead>
                      <TableHead className="text-xs text-right">Tilgung</TableHead>
                      <TableHead className="text-xs text-right">Jahresrate</TableHead>
                      <TableHead className="text-xs text-right">Restschuld Ende</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.schedule.map(row => (
                      <TableRow key={row.year}>
                        <TableCell className="text-xs font-mono">{row.year}</TableCell>
                        <TableCell className="text-xs font-mono text-right">{EUR.format(row.startBalance)}</TableCell>
                        <TableCell className="text-xs font-mono text-right">{EUR.format(row.interestPaid)}</TableCell>
                        <TableCell className="text-xs font-mono text-right">{EUR.format(row.principalPaid)}</TableCell>
                        <TableCell className="text-xs font-mono text-right">{EUR.format(row.interestPaid + row.principalPaid)}</TableCell>
                        <TableCell className="text-xs font-mono text-right">{EUR.format(row.endBalance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* PDF Export */}
      {calculated && result && (
        <div className="flex justify-end">
          <PdfExportButton
            contentRef={pdfRef}
            options={{
              title: 'Finanzierungsangebot',
              subtitle: `${OBJEKTART_OPTIONS.find(o => o.value === objektart)?.label || objektart} — Kaufpreis ${EUR.format(kp)}`,
              module: 'Finanzierungsmanager',
              metadata: {
                'Darlehensbetrag': EUR.format(darlehen),
                'Zinssatz': PCT(zinssatz),
                'Tilgung': PCT(tilgung),
                'Zinsbindung': `${zinsbindung} Jahre`,
              },
            }}
            variant="default"
            label="Als PDF-Angebot exportieren"
          />
        </div>
      )}
    </div>
  );
}
