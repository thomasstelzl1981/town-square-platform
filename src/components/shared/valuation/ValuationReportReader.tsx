/**
 * ValuationReportReader — Premium Bewertungsgutachten Web-Reader
 * Editorial-quality report layout with visual location assets, premium comps, and CI-A design.
 * V7.0: Full premium redesign — editorial structure, visual maps, premium KPIs
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp, Download, ArrowUpDown, Shield, Banknote, BarChart3,
  Database, MapPin, Building2, FileText, AlertTriangle, CheckCircle2,
  Navigation, Clock, Compass, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import { ValuationLegalBlock } from './ValuationLegalBlock';
import type {
  ValueBand,
  ValuationMethodResult,
  FinancingScenario,
  StressTestResult,
  LienProxy,
  DebtServiceResult,
  DataQuality,
  CompStats,
  CompPosting,
  LocationAnalysis,
  LegalTitleBlock,
  ValuationSourceMode,
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
  sourceMode?: ValuationSourceMode;
  legalTitle?: LegalTitleBlock | null;
  location?: LocationAnalysis | null;
  comps?: CompPosting[];
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
  green: 'text-emerald-600 bg-emerald-500/10 border-emerald-200',
  yellow: 'text-yellow-600 bg-yellow-500/10 border-yellow-200',
  red: 'text-red-600 bg-red-500/10 border-red-200',
};

const trafficIcon: Record<string, string> = {
  green: '✓',
  yellow: '⚠',
  red: '✗',
};

/** Premium section header component */
function SectionHeader({ icon: Icon, title, subtitle, badge }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {badge}
      </div>
      <Separator className="mt-3" />
    </div>
  );
}

/** Premium KPI card */
function KpiCard({ label, value, sublabel, tone }: {
  label: string;
  value: string;
  sublabel?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'accent';
}) {
  const toneClasses: Record<string, string> = {
    default: 'bg-muted/40 border-border/40',
    success: 'bg-emerald-500/5 border-emerald-200/50',
    warning: 'bg-yellow-500/5 border-yellow-200/50',
    danger: 'bg-red-500/5 border-red-200/50',
    accent: 'bg-primary/5 border-primary/20',
  };
  return (
    <div className={cn('p-4 rounded-xl border text-center space-y-1.5', toneClasses[tone || 'default'])}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{label}</p>
      <p className="text-xl font-bold tracking-tight">{value}</p>
      {sublabel && <p className="text-[10px] text-muted-foreground">{sublabel}</p>}
    </div>
  );
}

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
  sourceMode,
  legalTitle,
  location,
  comps,
  onDownloadPdf,
  className,
}: Props) {
  if (!valueBand) return null;

  return (
    <div className={cn('space-y-6', className)}>

      {/* ═══════════════════════════════════════════════════════
          HERO: Value Band + Source Mode + PDF Action
          ═══════════════════════════════════════════════════════ */}
      <Card className="overflow-hidden">
        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />
        <CardContent className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              {sourceMode && (
                <Badge
                  variant={sourceMode === 'SSOT_FINAL' ? 'default' : 'outline'}
                  className={cn('text-[10px]', sourceMode === 'SSOT_FINAL' && 'bg-primary/90')}
                >
                  <Database className="h-3 w-3 mr-1" />
                  {sourceMode === 'SSOT_FINAL' ? 'SSOT (Final)' : 'Exposé Draft'}
                </Badge>
              )}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2">
                  SoT Bewertungsgutachten
                </p>
                <p className="text-xs text-muted-foreground mb-1">Wertband (P25 – P50 – P75)</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-sm text-muted-foreground font-medium">{fmtEur(valueBand.p25)}</span>
                  <span className="text-3xl font-bold text-primary tracking-tight">{fmtEur(valueBand.p50)}</span>
                  <span className="text-sm text-muted-foreground font-medium">{fmtEur(valueBand.p75)}</span>
                </div>
              </div>
            </div>
            {onDownloadPdf && (
              <Button size="sm" variant="outline" onClick={onDownloadPdf} className="shrink-0">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                PDF Gutachten
              </Button>
            )}
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              label="Marktwert"
              value={fmtEur(valueBand.p50)}
              sublabel="Punktschätzung"
              tone="accent"
            />
            <KpiCard
              label="Konfidenz"
              value={`${(valueBand.confidenceScore * 100).toFixed(0)}%`}
              sublabel={valueBand.confidence}
              tone={valueBand.confidenceScore >= 0.7 ? 'success' : valueBand.confidenceScore >= 0.4 ? 'warning' : 'danger'}
            />
            {dataQuality && (
              <KpiCard
                label="Datenlage"
                value={`${dataQuality.completenessPercent.toFixed(0)}%`}
                sublabel={`${dataQuality.fieldsVerified} verifiziert`}
                tone={dataQuality.completenessPercent >= 70 ? 'success' : 'warning'}
              />
            )}
            {lienProxy && (
              <KpiCard
                label="LTV-Fenster"
                value={`${fmtPct(lienProxy.safeLtvWindow[0])} – ${fmtPct(lienProxy.safeLtvWindow[1])}`}
                sublabel="Sicherer Bereich"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════
          EXECUTIVE SUMMARY
          ═══════════════════════════════════════════════════════ */}
      {executiveSummary && (
        <Card className={DESIGN.CARD.READING}>
          <SectionHeader
            icon={FileText}
            title="Executive Summary"
            subtitle="Zusammenfassung der Bewertungsergebnisse"
          />
          <p className="text-sm leading-relaxed text-foreground/90">{executiveSummary}</p>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════
          STANDORTANALYSE — Hero Visual Section
          ═══════════════════════════════════════════════════════ */}
      {location && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <SectionHeader
              icon={MapPin}
              title="Standortanalyse"
              subtitle="Lage, Umfeld & Erreichbarkeit"
              badge={
                <Badge variant="outline" className="text-xs font-semibold">
                  {location.overallScore}<span className="text-muted-foreground font-normal">/100</span>
                </Badge>
              }
            />

            {/* Maps — Hero Visual Row */}
            {(location.microMapUrl || location.macroMapUrl || (location as any).streetViewUrl) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {location.microMapUrl && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Mikrolage</p>
                    <div className="rounded-xl overflow-hidden border shadow-sm aspect-[4/3]">
                      <img
                        src={location.microMapUrl}
                        alt="Mikrolage"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}
                {location.macroMapUrl && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Makrolage</p>
                    <div className="rounded-xl overflow-hidden border shadow-sm aspect-[4/3]">
                      <img
                        src={location.macroMapUrl}
                        alt="Makrolage"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}
                {(location as any).streetViewUrl && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Straßenansicht</p>
                    <div className="rounded-xl overflow-hidden border shadow-sm aspect-[4/3]">
                      <img
                        src={(location as any).streetViewUrl}
                        alt="Street View"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dimension Scorecards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {location.dimensions.map((dim) => {
                const score = dim.score;
                const tone = score >= 8 ? 'text-emerald-600' : score >= 5 ? 'text-primary' : 'text-yellow-600';
                return (
                  <div key={dim.key} className="p-3 rounded-xl border bg-muted/20 text-center space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{dim.label}</p>
                    <p className={cn('text-2xl font-bold', tone)}>{dim.score}</p>
                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', score >= 8 ? 'bg-emerald-500' : score >= 5 ? 'bg-primary' : 'bg-yellow-500')}
                        style={{ width: `${score * 10}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* POIs — Visual Grid */}
            {location.dimensions.some(d => d.topPois?.length > 0) && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Nächste Einrichtungen
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {location.dimensions.filter(d => d.topPois?.length > 0).map(dim => (
                    <div key={dim.key} className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-muted/10">
                      <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Compass className="h-3 w-3 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium">{dim.label}</p>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {dim.topPois.slice(0, 3).map((poi, i) => (
                            <span key={i} className="inline-block">
                              {i > 0 && <span className="mx-1">·</span>}
                              {poi.name}
                              <span className="text-muted-foreground/60 ml-0.5">
                                ({poi.distanceMeters < 1000 ? `${poi.distanceMeters}m` : `${(poi.distanceMeters / 1000).toFixed(1)}km`})
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reachability */}
            {location.reachability?.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Erreichbarkeit</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {location.reachability.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/10 text-xs">
                      <Navigation className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-medium flex-1 min-w-0 truncate">{r.destinationName}</span>
                      <div className="flex items-center gap-2.5 shrink-0 text-muted-foreground">
                        {r.drivingMinutes != null && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {r.drivingMinutes}'
                          </span>
                        )}
                        {r.transitMinutes != null && (
                          <span className="flex items-center gap-1">🚇 {r.transitMinutes}'</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Narrative */}
            {location.narrative && (
              <div className="pt-2 border-t">
                <p className="text-xs leading-relaxed text-muted-foreground">{location.narrative}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════
          VERGLEICHSANGEBOTE — Premium Comps
          ═══════════════════════════════════════════════════════ */}
      {comps && comps.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <SectionHeader
              icon={Building2}
              title="Vergleichsangebote"
              subtitle={`${comps.length} Vergleichsobjekte aus ${compStats?.portalBreakdown ? Object.keys(compStats.portalBreakdown).length : '–'} Portalen`}
              badge={
                <Badge variant="outline" className="text-xs">
                  {comps.length} Treffer
                </Badge>
              }
            />

            {/* CompStats Summary — Premium KPI Row */}
            {compStats && (
              <div className="grid grid-cols-3 gap-3">
                <KpiCard label="Median €/m²" value={fmtEur(compStats.medianPriceSqm)} tone="accent" />
                <KpiCard label="P25 €/m²" value={fmtEur(compStats.p25PriceSqm)} sublabel="Unteres Quartil" />
                <KpiCard label="P75 €/m²" value={fmtEur(compStats.p75PriceSqm)} sublabel="Oberes Quartil" />
              </div>
            )}

            {/* Comp Table — Premium Layout */}
            <div className="rounded-xl border overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-4 py-2.5 bg-muted/30 border-b text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                <span>Objekt</span>
                <span className="text-right w-20">Preis</span>
                <span className="text-right w-14">Fläche</span>
                <span className="text-right w-16">€/m²</span>
                <span className="text-right w-14">Entf.</span>
              </div>
              {/* Table Rows */}
              {comps.slice(0, 10).map((c, idx) => (
                <div
                  key={c.id}
                  className={cn(
                    'grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-4 py-3 text-xs items-center transition-colors',
                    idx % 2 === 1 && 'bg-muted/10',
                    'hover:bg-muted/20'
                  )}
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <Badge variant="outline" className="text-[8px] shrink-0 px-1.5">{c.portal}</Badge>
                    <span className="font-medium truncate">{c.title || '–'}</span>
                    {c.rooms && <span className="text-muted-foreground shrink-0">{c.rooms} Zi</span>}
                    {c.yearBuilt && <span className="text-muted-foreground shrink-0">· {c.yearBuilt}</span>}
                  </div>
                  <span className="text-right font-semibold w-20">{fmtEur(c.price)}</span>
                  <span className="text-right text-muted-foreground w-14">{c.area}m²</span>
                  <span className="text-right font-medium w-16">{fmtEur(c.priceSqm)}</span>
                  <span className="text-right text-muted-foreground w-14">
                    {c.distanceKm != null ? `${c.distanceKm.toFixed(1)}km` : '–'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CompStats only (without postings list) */}
      {(!comps || comps.length === 0) && compStats && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <SectionHeader
              icon={Building2}
              title="Vergleichsmarkt"
              subtitle="Aggregierte Marktdaten"
            />
            <div className="grid grid-cols-3 gap-3">
              <KpiCard label="Median €/m²" value={fmtEur(compStats.medianPriceSqm)} tone="accent" />
              <KpiCard label="Objekte" value={compStats.dedupedCount.toString()} sublabel={`von ${compStats.count} roh`} />
              <KpiCard label="IQR €/m²" value={`${fmtEur(compStats.p25PriceSqm)} – ${fmtEur(compStats.p75PriceSqm)}`} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════
          BEWERTUNGSMETHODEN
          ═══════════════════════════════════════════════════════ */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <SectionHeader
            icon={BarChart3}
            title="Bewertungsmethoden"
            subtitle="Verfahrensübersicht & Gewichtung"
          />

          {/* Methods */}
          <div className="space-y-3">
            {methods.map((m) => (
              <div key={m.method} className="flex items-center gap-4 p-3 rounded-xl border bg-muted/10">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold capitalize">{m.method.replace('_', ' ')}</p>
                  {m.notes.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{m.notes[0]}</p>
                  )}
                </div>
                <span className="text-sm font-bold shrink-0">{fmtEur(m.value)}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-[10px] shrink-0',
                    m.confidence === 'high' && 'bg-emerald-500/10 text-emerald-600',
                    m.confidence === 'medium' && 'bg-yellow-500/10 text-yellow-600'
                  )}
                >
                  {m.confidence}
                </Badge>
              </div>
            ))}
          </div>

          {/* Weighting visual */}
          <div className="pt-3 border-t space-y-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Gewichtung</p>
            {valueBand.weightingTable.map((w) => (
              <div key={w.method} className="flex items-center gap-3 text-xs">
                <span className="w-28 shrink-0 capitalize text-muted-foreground font-medium">{w.method.replace('_', ' ')}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${w.weight * 100}%` }}
                  />
                </div>
                <span className="text-muted-foreground w-10 text-right font-medium">{(w.weight * 100).toFixed(0)}%</span>
                <span className="text-foreground w-24 text-right font-semibold">{fmtEur(w.value)}</span>
              </div>
            ))}
          </div>

          {/* Reasoning */}
          {valueBand.reasoning && (
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground leading-relaxed">{valueBand.reasoning}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════
          FINANZIERBARKEIT
          ═══════════════════════════════════════════════════════ */}
      {financing.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <SectionHeader
              icon={Banknote}
              title="Finanzierbarkeit"
              subtitle="Szenarienvergleich für typische Darlehensstrukturen"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {financing.map((f) => (
                <div key={f.name} className={cn('p-4 rounded-xl border space-y-3', trafficColor[f.trafficLight])}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold capitalize">{f.name}</span>
                    <span className="text-lg">{trafficIcon[f.trafficLight]}</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-tight">{fmtEur(f.monthlyRate)}</p>
                    <p className="text-[10px] text-muted-foreground">monatliche Rate</p>
                  </div>
                  <Separator />
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">LTV</span>
                      <span className="font-medium">{fmtPct(f.ltv)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Zins</span>
                      <span className="font-medium">{fmtPct(f.interestRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Eigenkapital</span>
                      <span className="font-medium">{fmtEur(f.equity)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Darlehen</span>
                      <span className="font-medium">{fmtEur(f.loanAmount)}</span>
                    </div>
                    {f.cashflowAfterDebt != null && (
                      <div className="flex justify-between pt-1.5 border-t">
                        <span className="text-muted-foreground">CF nach KD</span>
                        <span className={cn('font-semibold', f.cashflowAfterDebt >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                          {fmtEur(f.cashflowAfterDebt)}/a
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════
          STRESS-TESTS
          ═══════════════════════════════════════════════════════ */}
      {stressTests.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <SectionHeader
              icon={ArrowUpDown}
              title="Stress-Tests & Kapitaldienstfähigkeit"
              subtitle="Sensitivitätsanalyse bei Zins- und Mietveränderung"
            />
            <div className="rounded-xl border overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-4 py-2.5 bg-muted/30 border-b text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                <span>Szenario</span>
                <span className="text-right w-24">Rate/mtl.</span>
                <span className="text-right w-16">DSCR</span>
                <span className="text-center w-12">Status</span>
              </div>
              {stressTests.map((st, idx) => (
                <div
                  key={st.label}
                  className={cn(
                    'grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-4 py-3 text-xs items-center',
                    idx % 2 === 1 && 'bg-muted/10'
                  )}
                >
                  <span className="font-medium">{st.label}</span>
                  <span className="text-right font-semibold w-24">{fmtEur(st.monthlyRate)}</span>
                  <span className="text-right text-muted-foreground w-16">{st.dscr?.toFixed(2) || '–'}</span>
                  <div className="flex justify-center w-12">
                    <Badge className={cn('text-[9px] px-1.5', trafficColor[st.trafficLight])}>
                      {trafficIcon[st.trafficLight]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════
          BELEIHUNGSWERT
          ═══════════════════════════════════════════════════════ */}
      {lienProxy && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <SectionHeader
              icon={Shield}
              title="Beleihungswert (Proxy)"
              subtitle="Geschätzte Beleihungswertspanne nach BelWertV"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Marktwert P50" value={fmtEur(lienProxy.marketValueP50)} tone="accent" />
              <KpiCard label="Abschlag" value={fmtPct(lienProxy.totalDiscount)} />
              <KpiCard label="Beleihung niedrig" value={fmtEur(lienProxy.lienValueLow)} />
              <KpiCard label="Beleihung hoch" value={fmtEur(lienProxy.lienValueHigh)} />
            </div>

            {lienProxy.riskDrivers.length > 0 && (
              <div className="space-y-2 pt-3 border-t">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Risikotreiber</p>
                {lienProxy.riskDrivers.map((rd) => (
                  <div key={rd.factor} className="flex items-center gap-3 text-xs p-2 rounded-lg bg-red-500/5 border border-red-200/30">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    <span className="flex-1 font-medium">{rd.factor}</span>
                    <span className="text-red-600 font-semibold">−{fmtPct(rd.discountPercent)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════
          DATENLAGE
          ═══════════════════════════════════════════════════════ */}
      {dataQuality && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <SectionHeader
              icon={TrendingUp}
              title="Datenlage & Evidenzbasis"
              subtitle="Vollständigkeit und Herkunft der Bewertungsgrundlagen"
              badge={
                <Badge variant="outline" className="text-xs">
                  {dataQuality.completenessPercent.toFixed(0)}% vollständig
                </Badge>
              }
            />
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border bg-emerald-500/5 text-center space-y-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
                <p className="text-lg font-bold text-emerald-600">{dataQuality.fieldsVerified}</p>
                <p className="text-[10px] text-muted-foreground">Verifiziert</p>
              </div>
              <div className="p-3 rounded-xl border bg-yellow-500/5 text-center space-y-1">
                <Star className="h-4 w-4 text-yellow-600 mx-auto" />
                <p className="text-lg font-bold text-yellow-600">{dataQuality.fieldsDerived}</p>
                <p className="text-[10px] text-muted-foreground">Abgeleitet</p>
              </div>
              <div className="p-3 rounded-xl border bg-muted/30 text-center space-y-1">
                <AlertTriangle className="h-4 w-4 text-muted-foreground mx-auto" />
                <p className="text-lg font-bold">{dataQuality.fieldsMissing}</p>
                <p className="text-[10px] text-muted-foreground">Fehlend</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════
          RECHT & EIGENTUM
          ═══════════════════════════════════════════════════════ */}
      {legalTitle && sourceMode === 'SSOT_FINAL' && (
        <ValuationLegalBlock legalTitle={legalTitle} />
      )}
    </div>
  );
}
