/**
 * ValuationReportReader — Displays valuation results: ValueBand, KPIs, Methods, Financing
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Download, ArrowUpDown, Shield, Banknote, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import type {
  ValueBand,
  ValuationMethodResult,
  FinancingScenario,
  StressTestResult,
  LienProxy,
  DebtServiceResult,
  DataQuality,
  CompStats,
} from '@/engines/valuation/spec';

interface Props {
  valueBand: ValueBand | null;
  methods: ValuationMethodResult[];
  financing: FinancingScenario[];
  stressTests: StressTestResult[];
  lienProxy: LienProxy | null;
  debtService: DebtServiceResult | null;
  dataQuality: DataQuality | null;
  compStats: CompStats | null;
  executiveSummary?: string;
  onDownloadPdf?: () => void;
  className?: string;
}

const fmtEur = (v: number | null | undefined) =>
  v != null
    ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
    : '–';

const fmtPct = (v: number | null | undefined) =>
  v != null ? `${(v * 100).toFixed(1)}%` : '–';

const trafficColor: Record<string, string> = {
  green: 'text-emerald-600 bg-emerald-500/10',
  yellow: 'text-yellow-600 bg-yellow-500/10',
  red: 'text-red-600 bg-red-500/10',
};

export function ValuationReportReader({
  valueBand,
  methods,
  financing,
  stressTests,
  lienProxy,
  debtService,
  dataQuality,
  compStats,
  executiveSummary,
  onDownloadPdf,
  className,
}: Props) {
  if (!valueBand) return null;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header: Value Band */}
      <Card className={DESIGN.CARD.CONTENT}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Wertband (P25 – P75)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-muted-foreground">{fmtEur(valueBand.p25)}</span>
              <span className="text-2xl font-bold text-primary">{fmtEur(valueBand.p50)}</span>
              <span className="text-xs text-muted-foreground">{fmtEur(valueBand.p75)}</span>
            </div>
            <Badge variant="outline" className="mt-1.5 text-[10px]">
              Konfidenz: {valueBand.confidence} ({(valueBand.confidenceScore * 100).toFixed(0)}%)
            </Badge>
          </div>
          {onDownloadPdf && (
            <Button size="sm" variant="outline" onClick={onDownloadPdf}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              PDF
            </Button>
          )}
        </div>
      </Card>

      {/* Executive Summary */}
      {executiveSummary && (
        <Card className={DESIGN.CARD.READING}>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Executive Summary</p>
          <p className="text-sm leading-relaxed">{executiveSummary}</p>
        </Card>
      )}

      {/* Methods Breakdown */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Methoden</span>
          </div>
          {methods.map((m) => (
            <div key={m.method} className="flex items-center gap-3 text-sm">
              <span className="text-xs text-muted-foreground w-28 shrink-0 capitalize">{m.method.replace('_', ' ')}</span>
              <span className="font-medium flex-1">{fmtEur(m.value)}</span>
              <Badge variant="secondary" className="text-[10px]">{m.confidence}</Badge>
            </div>
          ))}
          <Separator />
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Gewichtung</p>
            {valueBand.weightingTable.map((w) => (
              <div key={w.method} className="flex items-center gap-2 text-xs">
                <span className="w-28 shrink-0 capitalize text-muted-foreground">{w.method.replace('_', ' ')}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${w.weight * 100}%` }}
                  />
                </div>
                <span className="text-muted-foreground w-10 text-right">{(w.weight * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financing Scenarios */}
      {financing.length > 0 && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Finanzierbarkeit</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {financing.map((f) => (
                <div key={f.name} className="p-3 rounded-lg border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium capitalize">{f.name}</span>
                    <Badge className={cn('text-[10px]', trafficColor[f.trafficLight])}>
                      {f.trafficLight === 'green' ? '✓' : f.trafficLight === 'yellow' ? '⚠' : '✗'}
                    </Badge>
                  </div>
                  <p className="text-lg font-bold">{fmtEur(f.monthlyRate)}<span className="text-xs text-muted-foreground font-normal">/mtl.</span></p>
                  <div className="text-[10px] text-muted-foreground space-y-0.5">
                    <p>LTV: {fmtPct(f.ltv)} · Zins: {fmtPct(f.interestRate)}</p>
                    <p>EK: {fmtEur(f.equity)} · Darlehen: {fmtEur(f.loanAmount)}</p>
                    {f.cashflowAfterDebt != null && (
                      <p className={f.cashflowAfterDebt >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                        CF n. KD: {fmtEur(f.cashflowAfterDebt)}/Jahr
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stress Tests */}
      {stressTests.length > 0 && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Stress-Tests</span>
            </div>
            {stressTests.map((st) => (
              <div key={st.label} className="flex items-center gap-3 text-xs">
                <span className="w-28 shrink-0 text-muted-foreground">{st.label}</span>
                <span className="flex-1 font-medium">{fmtEur(st.monthlyRate)}/mtl.</span>
                {st.dscr != null && <span className="text-muted-foreground">DSCR: {st.dscr.toFixed(2)}</span>}
                <Badge className={cn('text-[10px]', trafficColor[st.trafficLight])}>
                  {st.trafficLight}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Lien Proxy */}
      {lienProxy && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Beleihungswert (Proxy)</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] text-muted-foreground">Beleihung niedrig</p>
                <p className="font-medium">{fmtEur(lienProxy.lienValueLow)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Beleihung hoch</p>
                <p className="font-medium">{fmtEur(lienProxy.lienValueHigh)}</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Sicheres LTV-Fenster: {fmtPct(lienProxy.safeLtvWindow[0])} – {fmtPct(lienProxy.safeLtvWindow[1])}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Data Quality */}
      {dataQuality && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Datenlage</span>
              <Badge variant="outline" className="ml-auto text-[10px]">
                {dataQuality.completenessPercent.toFixed(0)}% vollständig
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-center">
              <div className="p-2 rounded-md bg-muted/50">
                <p className="font-semibold text-foreground">{dataQuality.fieldsVerified}</p>
                <p className="text-muted-foreground">Verifiziert</p>
              </div>
              <div className="p-2 rounded-md bg-muted/50">
                <p className="font-semibold text-foreground">{dataQuality.fieldsDerived}</p>
                <p className="text-muted-foreground">Abgeleitet</p>
              </div>
              <div className="p-2 rounded-md bg-muted/50">
                <p className="font-semibold text-foreground">{dataQuality.fieldsMissing}</p>
                <p className="text-muted-foreground">Fehlend</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
