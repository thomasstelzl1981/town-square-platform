/**
 * ValuationReportReader — Kurzgutachten Web-Reader V9.0
 * 11 inline sections matching the 12-page PDF structure.
 * Scrollable vertical layout — every section visible in sequence.
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp, Download, Shield, Banknote, BarChart3,
  Database, MapPin, Building2, FileText, AlertTriangle, CheckCircle2,
  Navigation, Clock, Compass, Star, Landmark, Ruler, Hammer,
  ArrowUpDown, Scale, Search, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import { ValuationLegalBlock } from './ValuationLegalBlock';
import type {
  ValueBand, ValuationMethodResult, FinancingScenario, StressTestResult,
  LienProxy, DebtServiceResult, DataQuality, CompStats, CompPosting,
  LocationAnalysis, LegalTitleBlock, ValuationSourceMode,
  BeleihungswertResult, GeminiResearchResult, ValuationUnitDetail,
  CanonicalPropertySnapshot,
} from '@/engines/valuation/spec';

// ─── Props ────────────────────────────────────────────────────────────

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
  beleihungswert?: BeleihungswertResult | null;
  geminiResearch?: GeminiResearchResult | null;
  onDownloadPdf?: () => void;
  className?: string;
}

// ─── Formatting ───────────────────────────────────────────────────────

const fmtEur = (v: number | null | undefined) =>
  v != null
    ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
    : '–';

const fmtEur2 = (v: number | null | undefined) =>
  v != null
    ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
    : '–';

const fmtPct = (v: number | null | undefined) =>
  v != null ? `${(v * 100).toFixed(1)} %` : '–';

const fmtNum = (v: number | null | undefined, digits = 2) =>
  v != null ? v.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '–';

const trafficColor: Record<string, string> = {
  green: 'text-emerald-600 bg-emerald-500/10 border-emerald-200',
  yellow: 'text-yellow-600 bg-yellow-500/10 border-yellow-200',
  red: 'text-red-600 bg-red-500/10 border-red-200',
};
const trafficIcon: Record<string, string> = { green: '✓', yellow: '⚠', red: '✗' };

// ─── UI Primitives ────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, number: num, title, subtitle, badge }: {
  icon: React.ComponentType<{ className?: string }>;
  number?: number;
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
          <h3 className="text-sm font-semibold tracking-tight">
            {num != null && <span className="text-muted-foreground mr-1.5">{num}.</span>}
            {title}
          </h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {badge}
      </div>
      <Separator className="mt-3" />
    </div>
  );
}

function KpiCard({ label, value, sublabel, tone }: {
  label: string; value: string; sublabel?: string;
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

/** Two-column data row */
function DataRow({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-4 py-1.5">
      <span className={cn('text-xs', muted ? 'text-muted-foreground' : 'text-muted-foreground')}>{label}</span>
      <span className={cn('text-xs text-right', bold ? 'font-bold text-foreground' : 'font-medium')}>{value}</span>
    </div>
  );
}

/** Section divider line inside a card */
function SectionDivider() {
  return <div className="border-t my-3" />;
}

// ─── Helpers to extract params ────────────────────────────────────────

function getMethodParams(methods: ValuationMethodResult[], key: string): Record<string, number | string> {
  return methods.find(m => m.method === key)?.params ?? {};
}
function getMethodValue(methods: ValuationMethodResult[], key: string): number {
  return methods.find(m => m.method === key)?.value ?? 0;
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export function ValuationReportReader({
  valueBand, methods, financing, stressTests, lienProxy, debtService,
  dataQuality, compStats, executiveSummary, sourceMode, legalTitle,
  location, comps, beleihungswert, geminiResearch, onDownloadPdf, className,
}: Props) {
  if (!valueBand) return null;

  const ertragParams = getMethodParams(methods, 'ertragswert');
  const sachwertParams = getMethodParams(methods, 'sachwert_proxy');
  const compValue = getMethodValue(methods, 'comp_proxy');
  const ertragValue = getMethodValue(methods, 'ertragswert');
  const sachwertValue = getMethodValue(methods, 'sachwert_proxy');

  return (
    <div className={cn('space-y-5', className)}>

      {/* ═══════════════════════════════════════════════════════════════
          SEKTION 1 — DECKBLATT: Marktwert + Beleihungswert + StreetView
          ═══════════════════════════════════════════════════════════════ */}
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />

        {/* StreetView Hero */}
        {location?.streetViewUrl && (
          <div className="w-full aspect-[21/9] overflow-hidden">
            <img src={location.streetViewUrl} alt="Straßenansicht" className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}

        <CardContent className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              {sourceMode && (
                <Badge variant={sourceMode === 'SSOT_FINAL' ? 'default' : 'outline'} className={cn('text-[10px]', sourceMode === 'SSOT_FINAL' && 'bg-primary/90')}>
                  <Database className="h-3 w-3 mr-1" />
                  {sourceMode === 'SSOT_FINAL' ? 'SSOT (Final)' : 'Exposé Draft'}
                </Badge>
              )}
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                Kurzgutachten · Verkehrswertermittlung
              </p>
              <p className="text-xs text-muted-foreground">
                Stichtag: {new Date().toLocaleDateString('de-DE')}
              </p>
            </div>
            {onDownloadPdf && (
              <Button size="sm" variant="outline" onClick={onDownloadPdf} className="shrink-0">
                <Download className="h-3.5 w-3.5 mr-1.5" /> PDF Gutachten
              </Button>
            )}
          </div>

          {/* Hero KPIs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border-2 border-primary/20 bg-primary/5 text-center space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Marktwert</p>
              <p className="text-3xl font-bold tracking-tight text-primary">{fmtEur(valueBand.p50)}</p>
              <p className="text-xs text-muted-foreground">{fmtEur(valueBand.p25)} – {fmtEur(valueBand.p75)}</p>
            </div>
            {beleihungswert ? (
              <div className="p-5 rounded-xl border-2 border-emerald-200/50 bg-emerald-500/5 text-center space-y-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Beleihungswert</p>
                <p className="text-3xl font-bold tracking-tight text-emerald-700">{fmtEur(beleihungswert.beleihungswert)}</p>
                <p className="text-xs text-muted-foreground">{fmtPct(beleihungswert.beleihungswertQuote)} vom Marktwert</p>
              </div>
            ) : (
              <KpiCard
                label="Konfidenz"
                value={`${(valueBand.confidenceScore * 100).toFixed(0)}%`}
                sublabel={valueBand.confidence}
                tone={valueBand.confidenceScore >= 0.7 ? 'success' : valueBand.confidenceScore >= 0.4 ? 'warning' : 'danger'}
              />
            )}
          </div>

          {/* V9.1: MFH Unit-aware — Einheiten-Tabelle */}
          {location?.mfhMultiUnit && location.unitsDetail && location.unitsDetail.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                  <Building2 className="h-3 w-3 mr-1" />
                  MFH-Einheitenbewertung
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  Bewertung auf Basis einzelner Wohneinheiten (ETW-Vergleich)
                </span>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Einheit</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Fläche</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Zimmer</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Etage</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Kaltmiete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {location.unitsDetail.map((unit, idx) => (
                      <tr key={unit.id || idx} className="border-t">
                        <td className="px-3 py-1.5 font-medium">WE-{String(idx + 1).padStart(2, '0')}</td>
                        <td className="px-3 py-1.5 text-right">{unit.areaSqm > 0 ? `${fmtNum(unit.areaSqm, 1)} m²` : '–'}</td>
                        <td className="px-3 py-1.5 text-right">{unit.rooms ?? '–'}</td>
                        <td className="px-3 py-1.5 text-right">{unit.floor != null ? `${unit.floor}. OG` : '–'}</td>
                        <td className="px-3 py-1.5 text-right">{unit.rentCold != null ? fmtEur(unit.rentCold) : '–'}</td>
                      </tr>
                    ))}
                    <tr className="border-t bg-muted/30 font-medium">
                      <td className="px-3 py-1.5">Gesamt</td>
                      <td className="px-3 py-1.5 text-right">{fmtNum(location.unitsDetail.reduce((s, u) => s + (u.areaSqm || 0), 0), 1)} m²</td>
                      <td className="px-3 py-1.5 text-right">{location.unitsDetail.reduce((s, u) => s + (u.rooms || 0), 0) || '–'}</td>
                      <td className="px-3 py-1.5 text-right"></td>
                      <td className="px-3 py-1.5 text-right">{fmtEur(location.unitsDetail.reduce((s, u) => s + (u.rentCold || 0), 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Data quality row */}
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="Konfidenz" value={`${(valueBand.confidenceScore * 100).toFixed(0)}%`} sublabel={valueBand.confidence} tone={valueBand.confidenceScore >= 0.7 ? 'success' : 'warning'} />
            {dataQuality && <KpiCard label="Datenlage" value={`${dataQuality.completenessPercent.toFixed(0)}%`} sublabel={`${dataQuality.fieldsVerified} verifiziert`} tone={dataQuality.completenessPercent >= 70 ? 'success' : 'warning'} />}
            {lienProxy && <KpiCard label="LTV-Fenster" value={`${fmtPct(lienProxy.safeLtvWindow[0])} – ${fmtPct(lienProxy.safeLtvWindow[1])}`} sublabel="Sicherer Bereich" />}
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
          SEKTION 2 — GRUNDBUCH & EIGENTUM
          ═══════════════════════════════════════════════════════════════ */}
      {legalTitle && sourceMode === 'SSOT_FINAL' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <SectionHeader icon={Landmark} number={2} title="Grundbuch & Eigentum" subtitle="Grundbuchdaten, Eigentumsverhältnisse" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              {legalTitle.landRegisterCourt && <DataRow label="Amtsgericht" value={legalTitle.landRegisterCourt} />}
              {legalTitle.landRegisterSheet && <DataRow label="Grundbuchblatt" value={legalTitle.landRegisterSheet} />}
              {legalTitle.landRegisterVolume && <DataRow label="Band" value={legalTitle.landRegisterVolume} />}
              {legalTitle.parcelNumber && <DataRow label="Flurstück" value={legalTitle.parcelNumber} />}
              {legalTitle.ownershipSharePercent != null && <DataRow label="Eigentumsanteil" value={`${legalTitle.ownershipSharePercent}%`} />}
              {legalTitle.wegFlag && <DataRow label="WEG" value={`Ja${legalTitle.teNumber ? ` (TE: ${legalTitle.teNumber})` : ''}`} />}
              {legalTitle.meaShare != null && <DataRow label="MEA" value={legalTitle.meaShare.toString()} />}
            </div>
            <div className="flex gap-2 flex-wrap pt-2">
              <Badge variant={legalTitle.landRegisterExtractAvailable ? 'secondary' : 'outline'} className="text-[10px]">
                {legalTitle.landRegisterExtractAvailable ? '✓' : '✗'} Grundbuchauszug
              </Badge>
              <Badge variant={legalTitle.partitionDeclarationAvailable ? 'secondary' : 'outline'} className="text-[10px]">
                {legalTitle.partitionDeclarationAvailable ? '✓' : '✗'} Teilungserklärung
              </Badge>
            </div>
            {legalTitle.encumbrancesNote && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-yellow-500/10 text-yellow-700 text-[10px]">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{legalTitle.encumbrancesNote}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SEKTION 3 — STANDORTANALYSE (Maps, POIs, Erreichbarkeit)
          ═══════════════════════════════════════════════════════════════ */}
      {location && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <SectionHeader
              icon={MapPin} number={3} title="Standortanalyse" subtitle="Lage, Umfeld & Erreichbarkeit"
              badge={<Badge variant="outline" className="text-xs font-semibold">{location.overallScore}<span className="text-muted-foreground font-normal">/100</span></Badge>}
            />

            {/* Maps Row */}
            {(location.microMapUrl || location.macroMapUrl) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {location.microMapUrl && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Mikrolage</p>
                    <div className="rounded-xl overflow-hidden border shadow-sm aspect-[4/3]">
                      <img src={location.microMapUrl} alt="Mikrolage" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  </div>
                )}
                {location.macroMapUrl && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Makrolage</p>
                    <div className="rounded-xl overflow-hidden border shadow-sm aspect-[4/3]">
                      <img src={location.macroMapUrl} alt="Makrolage" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dimension Scores */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {location.dimensions.map((dim) => {
                const s = dim.score;
                const tone = s >= 8 ? 'text-emerald-600' : s >= 5 ? 'text-primary' : 'text-yellow-600';
                return (
                  <div key={dim.key} className="p-3 rounded-xl border bg-muted/20 text-center space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{dim.label}</p>
                    <p className={cn('text-2xl font-bold', tone)}>{dim.score}</p>
                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', s >= 8 ? 'bg-emerald-500' : s >= 5 ? 'bg-primary' : 'bg-yellow-500')} style={{ width: `${s * 10}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* POIs */}
            {location.dimensions.some(d => d.topPois?.length > 0) && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nächste Einrichtungen</p>
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
                        {r.drivingMinutes != null && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {r.drivingMinutes}'</span>}
                        {r.transitMinutes != null && <span className="flex items-center gap-1">🚇 {r.transitMinutes}'</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {location.narrative && (
              <div className="pt-2 border-t"><p className="text-xs leading-relaxed text-muted-foreground">{location.narrative}</p></div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SEKTION 4 — BODENWERT & RESTNUTZUNGSDAUER
          ═══════════════════════════════════════════════════════════════ */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <SectionHeader icon={Ruler} number={4} title="Bodenwert & Restnutzungsdauer" subtitle="Grundstückswert und RND-Berechnung" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bodenwert */}
            <div className="space-y-1 p-4 rounded-xl border bg-muted/10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2">Bodenwert</p>
              {ertragParams.plot_area_sqm && <DataRow label="Grundstücksfläche" value={`${fmtNum(Number(ertragParams.plot_area_sqm), 0)} m²`} />}
              {geminiResearch?.bodenrichtwert ? (
                <>
                  <DataRow label="Bodenrichtwert" value={`${fmtNum(geminiResearch.bodenrichtwert.bodenrichtwertEurSqm)} €/m²`} />
                  <DataRow label="Quelle" value={geminiResearch.bodenrichtwert.quelle} muted />
                  {geminiResearch.bodenrichtwert.artDerNutzung ? (
                    <DataRow label="Nutzungsart" value={geminiResearch.bodenrichtwert.artDerNutzung} muted />
                  ) : null}
                </>
              ) : (
                <DataRow label="Bodenrichtwert" value={ertragParams.bodenrichtwert_eur_sqm ? `${fmtNum(Number(ertragParams.bodenrichtwert_eur_sqm))} €/m²` : '–'} />
              )}
              <SectionDivider />
              <DataRow label="BODENWERT" value={fmtEur(Number(ertragParams.bodenwert) || 0)} bold />
            </div>

            {/* RND */}
            <div className="space-y-1 p-4 rounded-xl border bg-muted/10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2">Restnutzungsdauer</p>
              {ertragParams.gesamtnutzungsdauer && <DataRow label="Gesamtnutzungsdauer" value={`${ertragParams.gesamtnutzungsdauer} Jahre`} />}
              {ertragParams.alter && <DataRow label="Alter" value={`${ertragParams.alter} Jahre`} />}
              {ertragParams.core_renovated && ertragParams.renovation_year && (
                <DataRow label="Kernsanierung" value={`${ertragParams.renovation_year}`} />
              )}
              {Number(ertragParams.modernisierungsbonus) > 0 && (
                <div className="flex items-start gap-2 p-2 rounded-md bg-emerald-500/10 text-emerald-700 text-[10px] my-1">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>Modernisierungsbonus: +{ertragParams.modernisierungsbonus} Jahre (ImmoWertV-konform, Kernsanierung {ertragParams.renovation_year})</span>
                </div>
              )}
              <SectionDivider />
              <DataRow label="RESTNUTZUNGSDAUER" value={`${ertragParams.restnutzungsdauer || '–'} Jahre`} bold />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
          SEKTION 5 — ERTRAGSWERT (Marktwert)
          ═══════════════════════════════════════════════════════════════ */}
      {ertragValue > 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <SectionHeader icon={TrendingUp} number={5} title="Ertragswert (Marktwert)" subtitle="Ertragswertverfahren nach ImmoWertV" />

            <div className="space-y-1 p-4 rounded-xl border bg-muted/10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2">Rohertrag</p>
              <DataRow label="Jahresmiete (Ist)" value={fmtEur2(Number(ertragParams.annual_rent) || 0)} />
            </div>

            <div className="space-y-1 p-4 rounded-xl border bg-muted/10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2">Bewirtschaftungskosten (BWK)</p>
              {ertragParams.verwaltung && <DataRow label="Verwaltung" value={fmtEur2(Number(ertragParams.verwaltung))} />}
              {ertragParams.instandhaltung && <DataRow label="Instandhaltung" value={fmtEur2(Number(ertragParams.instandhaltung))} />}
              {ertragParams.mietausfall && <DataRow label="Mietausfallwagnis" value={fmtEur2(Number(ertragParams.mietausfall))} />}
              {ertragParams.nichtUmlagefaehig && <DataRow label="Modernisierungsrisiko" value={fmtEur2(Number(ertragParams.nichtUmlagefaehig))} />}
              <SectionDivider />
              <DataRow label="BWK Gesamt" value={`${fmtEur2(Number(ertragParams.bewirtschaftung_abzug) || 0)} (${fmtPct(Number(ertragParams.bewirtschaftung_rate) || 0)})`} bold />
            </div>

            <div className="space-y-1 p-4 rounded-xl border bg-primary/5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2">Ertragsableitung</p>
              <DataRow label="Reinertrag" value={fmtEur2(Number(ertragParams.reinertrag) || 0)} />
              <DataRow label="Liegenschaftszins" value={fmtPct(Number(ertragParams.cap_rate) || 0)} />
              {ertragParams.cap_rate_source && (
                <DataRow label="Quelle Liegenschaftszins" value={String(ertragParams.cap_rate_source)} muted />
              )}
              {geminiResearch?.liegenschaftszins && (
                <DataRow label="Quelle (Gemini)" value={geminiResearch.liegenschaftszins.quelle ?? String(geminiResearch.liegenschaftszins.quelle || '')} muted />
              )}
              <DataRow label="Restnutzungsdauer" value={`${ertragParams.restnutzungsdauer || '–'} Jahre`} />
              <DataRow label="Barwertfaktor" value={fmtNum(Number(ertragParams.barwertfaktor))} />
              <SectionDivider />
              <DataRow label="ERTRAGSWERT (MWT)" value={fmtEur(ertragValue)} bold />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SEKTION 6 — ERTRAGSWERT (Beleihungswert) — BelWertV
          ═══════════════════════════════════════════════════════════════ */}
      {beleihungswert && beleihungswert.ertragswertBelwertv > 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <SectionHeader
              icon={Shield} number={6} title="Ertragswert (Beleihungswert)"
              subtitle="Berechnung nach BelWertV mit 5,0% Liegenschaftszins"
              badge={<Badge variant="outline" className="text-[10px]">BelWertV</Badge>}
            />

            <div className="space-y-1 p-4 rounded-xl border bg-emerald-500/5">
              <DataRow label="Liegenschaftszins (BelWertV §12)" value="5,0 %" />
              <DataRow label="BWK (konservativ)" value={fmtEur2((beleihungswert as any).bwkBelwertv ?? (beleihungswert as any).bwk_belwertv ?? 0)} />
              <DataRow label="Reinertrag (BelWertV)" value={fmtEur2((beleihungswert as any).reinertagBelwertv ?? (beleihungswert as any).reinertrag_belwertv ?? 0)} />
              <DataRow label="Barwertfaktor (BelWertV)" value={fmtNum((beleihungswert as any).barwertfaktorBelwertv ?? (beleihungswert as any).barwertfaktor_belwertv ?? 0)} />
              <DataRow label="Sicherheitsabschlag" value={fmtPct(beleihungswert.sicherheitsabschlag)} />
              <SectionDivider />
              <DataRow label="ERTRAGSWERT (BWT)" value={fmtEur(beleihungswert.ertragswertBelwertv)} bold />
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 text-[10px] text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>Liegenschaftszins gem. §12 BelWertV mindestens 5,0% für Wohnimmobilien. Konservative BWK-Ansätze gem. BelWertV.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SEKTION 7 — SACHWERT (Marktwert + Beleihungswert)
          ═══════════════════════════════════════════════════════════════ */}
      {sachwertValue > 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <SectionHeader icon={Hammer} number={7} title="Sachwert" subtitle="Sachwertverfahren (NHK 2010)" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 p-4 rounded-xl border bg-muted/10">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2">Marktwert</p>
                <DataRow label="NHK 2010" value={`${fmtNum(Number(sachwertParams.base_cost_sqm) || 0, 0)} €/m²`} />
                <DataRow label="BPI-Index" value="1,38" />
                <DataRow label="Alterswertminderung" value={fmtPct(Number(sachwertParams.depreciation) || 0)} />
                {sachwertParams.gebaeude_sachwert && <DataRow label="Zeitwert Gebäude" value={fmtEur(Number(sachwertParams.gebaeude_sachwert))} />}
                {sachwertParams.marktanpassung && <DataRow label="Marktanpassung" value={fmtNum(Number(sachwertParams.marktanpassung))} />}
                <SectionDivider />
                <DataRow label="SACHWERT (MWT)" value={fmtEur(sachwertValue)} bold />
              </div>

              {beleihungswert && beleihungswert.sachwertBelwertv > 0 && (
                <div className="space-y-1 p-4 rounded-xl border bg-emerald-500/5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2">Beleihungswert</p>
                  <DataRow label="Sachwert vor Abschlag" value={fmtEur(sachwertValue)} />
                  <DataRow label="Sicherheitsabschlag 10%" value={`−${fmtEur(Math.round(sachwertValue * 0.1))}`} />
                  <SectionDivider />
                  <DataRow label="SACHWERT (BWT)" value={fmtEur(beleihungswert.sachwertBelwertv)} bold />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SEKTION 8 — VERGLEICHSWERT
          ═══════════════════════════════════════════════════════════════ */}
      {(comps && comps.length > 0) && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <SectionHeader icon={Building2} number={8} title="Vergleichswert" subtitle={`${comps.length} Vergleichsobjekte aus Immobilienportalen`}
              badge={<Badge variant="outline" className="text-xs">{comps.length} Treffer</Badge>}
            />

            {compStats && (
              <div className="grid grid-cols-3 gap-3">
                <KpiCard label="Median €/m²" value={fmtEur(compStats.medianPriceSqm)} tone="accent" />
                <KpiCard label="P25 €/m²" value={fmtEur(compStats.p25PriceSqm)} sublabel="Unteres Quartil" />
                <KpiCard label="P75 €/m²" value={fmtEur(compStats.p75PriceSqm)} sublabel="Oberes Quartil" />
              </div>
            )}

            {/* Comp Table */}
            <div className="rounded-xl border overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-4 py-2.5 bg-muted/30 border-b text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                <span>Objekt</span>
                <span className="text-right w-20">Preis</span>
                <span className="text-right w-14">Fläche</span>
                <span className="text-right w-16">€/m²</span>
                <span className="text-right w-14">Entf.</span>
              </div>
               {comps.slice(0, 10).map((c, idx) => (
                <div key={c.id} className={cn('grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-4 py-3 text-xs items-center transition-colors', idx % 2 === 1 && 'bg-muted/10', 'hover:bg-muted/20')}>
                  <div className="min-w-0 flex items-center gap-2">
                    <Badge variant="outline" className="text-[8px] shrink-0 px-1.5">{c.portal}</Badge>
                    {c.url ? (
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="font-medium truncate text-primary hover:underline">{c.title || '–'}</a>
                    ) : (
                      <span className="font-medium truncate">{c.title || '–'}</span>
                    )}
                  </div>
                  <span className="text-right font-semibold w-20">{fmtEur(c.price)}</span>
                  <span className="text-right text-muted-foreground w-14">{c.area}m²</span>
                  <span className="text-right font-medium w-16">{fmtEur(c.priceSqm)}</span>
                  <span className="text-right text-muted-foreground w-14">{c.distanceKm != null ? `${c.distanceKm.toFixed(1)}km` : '–'}</span>
                </div>
              ))}
            </div>

            {compValue > 0 && (
              <div className="p-4 rounded-xl border bg-primary/5">
                <DataRow label="VERGLEICHSWERT (MWT)" value={fmtEur(compValue)} bold />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CompStats only fallback */}
      {(!comps || comps.length === 0) && compStats && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <SectionHeader icon={Building2} number={8} title="Vergleichsmarkt" subtitle="Aggregierte Marktdaten" />
            <div className="grid grid-cols-3 gap-3">
              <KpiCard label="Median €/m²" value={fmtEur(compStats.medianPriceSqm)} tone="accent" />
              <KpiCard label="Objekte" value={compStats.dedupedCount.toString()} sublabel={`von ${compStats.count} roh`} />
              <KpiCard label="IQR €/m²" value={`${fmtEur(compStats.p25PriceSqm)} – ${fmtEur(compStats.p75PriceSqm)}`} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SEKTION 9 — VORSCHLAGSWERTE & AI-QUELLEN
          ═══════════════════════════════════════════════════════════════ */}
      {geminiResearch && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <SectionHeader icon={Search} number={9} title="Vorschlagswerte (KI-Recherche)" subtitle="Gemini-recherchierte Marktdaten"
              badge={<Badge variant="outline" className="text-[10px]">AI</Badge>}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Liegenschaftszins */}
              {geminiResearch.liegenschaftszins && (
                <div className="p-4 rounded-xl border bg-muted/10 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2">Liegenschaftszins</p>
                  <DataRow label="Empfohlen (MWT)" value={fmtPct(geminiResearch.liegenschaftszins.marktwertZins)} />
                  <DataRow label="Spanne" value={`${fmtPct(geminiResearch.liegenschaftszins.min)} – ${fmtPct(geminiResearch.liegenschaftszins.max)}`} />
                  <DataRow label="BelWertV (fest)" value="5,0 %" muted />
                  <DataRow label="Quelle" value={geminiResearch.liegenschaftszins.quelle} muted />
                  {geminiResearch.liegenschaftszins.begruendung && <DataRow label="Begründung" value={String(geminiResearch.liegenschaftszins.begruendung)} muted />}
                </div>
              )}

              {/* Bodenrichtwert */}
              {geminiResearch.bodenrichtwert && (
                <div className="p-4 rounded-xl border bg-muted/10 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2">Bodenrichtwert</p>
                  <DataRow label="Richtwert" value={`${fmtNum(geminiResearch.bodenrichtwert.bodenrichtwertEurSqm)} €/m²`} />
                  <DataRow label="Nutzungsart" value={geminiResearch.bodenrichtwert.artDerNutzung || '–'} />
                  <DataRow label="Quelle" value={geminiResearch.bodenrichtwert.quelle} muted />
                  {geminiResearch.bodenrichtwert.begruendung && <DataRow label="Begründung" value={String(geminiResearch.bodenrichtwert.begruendung)} muted />}
                </div>
              )}

              {/* Vergleichsmieten */}
              {geminiResearch.vergleichsmieten && (
                <div className="p-4 rounded-xl border bg-muted/10 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2">Vergleichsmieten</p>
                  <DataRow label="Min" value={`${fmtNum(geminiResearch.vergleichsmieten.mieteMin)} €/m²`} />
                  <DataRow label="Median" value={`${fmtNum(geminiResearch.vergleichsmieten.mieteMedian)} €/m²`} />
                  <DataRow label="Max" value={`${fmtNum(geminiResearch.vergleichsmieten.mieteMax)} €/m²`} />
                  <DataRow label="Quelle" value={geminiResearch.vergleichsmieten.quelle} muted />
                  {(geminiResearch.vergleichsmieten as any).begruendung && <DataRow label="Begründung" value={String((geminiResearch.vergleichsmieten as any).begruendung)} muted />}
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 text-[10px] text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>AI-generierte Marktdaten basieren auf öffentlich verfügbaren Quellen und können von amtlichen Werten abweichen. Keine Gewähr.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SEKTION 10 — KENNZAHLEN & FINANZIERUNG
          ═══════════════════════════════════════════════════════════════ */}
      {financing.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <SectionHeader icon={Banknote} number={10} title="Wirtschaftliche Kennzahlen & Finanzierung" subtitle="Renditekennzahlen und Finanzierungsszenarien" />

            {/* Financing scenarios */}
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
                    <div className="flex justify-between"><span className="text-muted-foreground">LTV</span><span className="font-medium">{fmtPct(f.ltv)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Zins</span><span className="font-medium">{fmtPct(f.interestRate)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">EK</span><span className="font-medium">{fmtEur(f.equity)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Darlehen</span><span className="font-medium">{fmtEur(f.loanAmount)}</span></div>
                    {f.cashflowAfterDebt != null && (
                      <div className="flex justify-between pt-1.5 border-t">
                        <span className="text-muted-foreground">CF nach KD</span>
                        <span className={cn('font-semibold', f.cashflowAfterDebt >= 0 ? 'text-emerald-600' : 'text-red-600')}>{fmtEur(f.cashflowAfterDebt)}/a</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SEKTION 11 — ERGEBNISÜBERSICHT
          ═══════════════════════════════════════════════════════════════ */}
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />
        <CardContent className="p-6 space-y-5">
          <SectionHeader icon={Scale} number={11} title="Ergebnisübersicht" subtitle="Zusammenfassung aller Bewertungsverfahren" />

          {/* Results Table */}
          <div className="rounded-xl border overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 px-4 py-2.5 bg-muted/30 border-b text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
              <span>Verfahren</span>
              <span className="text-right w-28">Marktwert</span>
              {beleihungswert && <span className="text-right w-28">Beleihungswert</span>}
            </div>

            {methods.map((m, idx) => (
              <div key={m.method} className={cn('grid grid-cols-[1fr_auto_auto] gap-x-6 px-4 py-3 text-xs items-center', idx % 2 === 1 && 'bg-muted/10')}>
                <span className="font-medium capitalize">{m.method.replace('_', ' ')}</span>
                <span className="text-right font-semibold w-28">{fmtEur(m.value)}</span>
                {beleihungswert && (
                  <span className="text-right text-muted-foreground w-28">
                    {m.method === 'ertragswert' ? fmtEur(beleihungswert.ertragswertBelwertv) :
                     m.method === 'sachwert_proxy' ? fmtEur(beleihungswert.sachwertBelwertv) : '–'}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Weighting */}
          <div className="space-y-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Gewichtung</p>
            {valueBand.weightingTable.map((w) => (
              <div key={w.method} className="flex items-center gap-3 text-xs">
                <span className="w-28 shrink-0 capitalize text-muted-foreground font-medium">{w.method.replace('_', ' ')}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${w.weight * 100}%` }} />
                </div>
                <span className="text-muted-foreground w-10 text-right font-medium">{(w.weight * 100).toFixed(0)}%</span>
                <span className="text-foreground w-24 text-right font-semibold">{fmtEur(w.value)}</span>
              </div>
            ))}
          </div>

          {valueBand.reasoning && (
            <div className="pt-3 border-t"><p className="text-xs text-muted-foreground leading-relaxed">{valueBand.reasoning}</p></div>
          )}

          {/* Final Result Hero */}
          <div className="grid grid-cols-2 gap-4 pt-3">
            <div className="p-5 rounded-xl border-2 border-primary/30 bg-primary/5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-1">MARKTWERT</p>
              <p className="text-3xl font-bold text-primary">{fmtEur(valueBand.p50)}</p>
            </div>
            {beleihungswert && (
              <div className="p-5 rounded-xl border-2 border-emerald-200/60 bg-emerald-500/5 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-1">BELEIHUNGSWERT</p>
                <p className="text-3xl font-bold text-emerald-700">{fmtEur(beleihungswert.beleihungswert)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
          SEKTION 12 — RECHTLICHE HINWEISE
          ═══════════════════════════════════════════════════════════════ */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <SectionHeader icon={FileText} number={12} title="Rechtliche Hinweise" subtitle="Haftungsausschluss und Annahmen" />
          <div className="text-xs leading-relaxed text-muted-foreground space-y-3">
            <p>
              Dieses Kurzgutachten dient ausschließlich der internen Werteinschätzung und stellt kein
              Verkehrswertgutachten nach §194 BauGB dar. Es ersetzt nicht die Bewertung durch einen
              öffentlich bestellten und vereidigten Sachverständigen.
            </p>
            <p>
              AI-gestützte Marktdaten (Liegenschaftszins, Bodenrichtwert, Vergleichsmieten) basieren
              auf öffentlich verfügbaren Quellen und können von amtlichen Werten abweichen.
            </p>
          </div>
          {executiveSummary && (
            <>
              <SectionDivider />
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Executive Summary</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{executiveSummary}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
