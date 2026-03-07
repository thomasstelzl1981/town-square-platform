/**
 * ValuationPdfPipeline — 4-stage PDF generation with visual control
 * 
 * Stage 1: Data Inventory (instant)
 * Stage 2: AI Text Generation (sot-valuation-intro)
 * Stage 3: PDF Rendering (generateValuationPdfBlob)
 * Stage 4: Visual Control (iframe preview + download/discard)
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2, Circle, Loader2, FileText, Sparkles,
  Download, X, Eye, AlertTriangle, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { generateValuationPdfBlob, type ValuationPdfData } from './ValuationPdfGenerator';
import type {
  ValueBand, ValuationMethodResult, FinancingScenario, StressTestResult,
  LienProxy, DataQuality, CompStats, CompPosting, LocationAnalysis,
  CanonicalPropertySnapshot, LegalTitleBlock, ValuationSourceMode,
  BeleihungswertResult, GeminiResearchResult,
} from '@/engines/valuation/spec';
import type { DocumentSlot } from './ValuationDocumentGrid';

// ─── Types ───────────────────────────────────────────────────────────

interface AiNarratives {
  objektbeschreibung?: string;
  methodik?: string;
  standortNarrativ?: string;
  propertyAssessment?: string;
}

type PipelineStage = 'inventory' | 'ai_texts' | 'rendering' | 'preview';

interface InventoryItem {
  label: string;
  available: boolean;
  detail?: string;
}

interface Props {
  snapshot: CanonicalPropertySnapshot | null;
  valueBand: ValueBand;
  methods: ValuationMethodResult[];
  financing: FinancingScenario[];
  stressTests: StressTestResult[];
  lienProxy: LienProxy | null;
  dataQuality: DataQuality | null;
  compStats: CompStats | null;
  comps: CompPosting[];
  location: LocationAnalysis | null;
  executiveSummary: string;
  caseId: string;
  sourceMode?: ValuationSourceMode;
  legalTitle?: LegalTitleBlock | null;
  beleihungswert?: BeleihungswertResult | null;
  geminiResearch?: GeminiResearchResult | null;
  photos?: string[];
  documents?: DocumentSlot[];
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────

export function ValuationPdfPipeline({
  snapshot, valueBand, methods, financing, stressTests,
  lienProxy, dataQuality, compStats, comps, location,
  executiveSummary, caseId, sourceMode, legalTitle,
  beleihungswert, geminiResearch, photos, documents,
  onClose,
}: Props) {
  const [stage, setStage] = useState<PipelineStage>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [aiNarratives, setAiNarratives] = useState<AiNarratives>({});
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStatus, setAiStatus] = useState('');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  // ─── Stage 1: Data Inventory ─────────────────────────────────────

  useEffect(() => {
    const items: InventoryItem[] = [
      {
        label: 'Objektdaten (Snapshot)',
        available: !!(snapshot?.address || snapshot?.city),
        detail: snapshot ? [snapshot.objectType, snapshot.yearBuilt ? `Bj. ${snapshot.yearBuilt}` : null].filter(Boolean).join(' · ') : undefined,
      },
      {
        label: 'Grundbuchdaten',
        available: !!(legalTitle && (legalTitle.landRegisterCourt || legalTitle.landRegisterSheet)),
      },
      {
        label: 'Standortanalyse',
        available: !!(location && location.overallScore > 0),
        detail: location ? `Score ${location.overallScore}/100` : undefined,
      },
      {
        label: 'Karten (Mikro/Makro)',
        available: !!(location?.microMapBase64 || location?.microMapUrl || location?.macroMapBase64 || location?.macroMapUrl),
      },
      {
        label: 'StreetView',
        available: !!(location?.streetViewBase64 || location?.streetViewUrl),
      },
      {
        label: 'Vergleichsobjekte',
        available: !!(compStats && compStats.count > 0),
        detail: compStats ? `${compStats.dedupedCount} Objekte` : undefined,
      },
      {
        label: 'Ertragswert',
        available: !!methods.find(m => m.method === 'ertrag' && m.value > 0),
      },
      {
        label: 'Beleihungswert',
        available: !!(beleihungswert && beleihungswert.beleihungswert > 0),
      },
      {
        label: 'KI-Marktdaten',
        available: !!(geminiResearch?.bodenrichtwert || geminiResearch?.liegenschaftszins),
      },
      {
        label: 'Standort-Narrativ',
        available: !!(location?.narrative),
      },
      {
        label: 'Objekt-Assessment',
        available: !!(location?.propertyAssessment),
      },
      {
        label: 'Objektfotos',
        available: !!(photos && photos.length > 0),
        detail: photos?.length ? `${photos.length} Fotos` : undefined,
      },
      {
        label: 'Finanzierung',
        available: financing.length > 0,
      },
    ];
    setInventory(items);

    // Auto-advance after 1.5s
    const timer = setTimeout(() => setStage('ai_texts'), 1500);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Stage 2: AI Text Generation ─────────────────────────────────

  useEffect(() => {
    if (stage !== 'ai_texts') return;
    let cancelled = false;

    const generateTexts = async () => {
      setAiProgress(10);
      setAiStatus('Prüfe vorhandene Texte…');

      // Reuse existing narratives from location analysis
      const narratives: AiNarratives = {};
      if (location?.narrative) {
        narratives.standortNarrativ = location.narrative;
      }
      if (location?.propertyAssessment) {
        narratives.propertyAssessment = location.propertyAssessment;
      }

      setAiProgress(30);
      setAiStatus('Generiere Objektbeschreibung & Methodik…');

      try {
        const { data, error: fnError } = await supabase.functions.invoke('sot-valuation-intro', {
          body: { snapshot, valueBand, methods, beleihungswert },
        });

        if (cancelled) return;

        if (fnError) throw new Error(fnError.message);
        if (data?.objektbeschreibung) narratives.objektbeschreibung = data.objektbeschreibung;
        if (data?.methodik) narratives.methodik = data.methodik;
      } catch (e) {
        console.warn('AI intro generation failed, continuing without:', e);
      }

      if (cancelled) return;
      setAiNarratives(narratives);
      setAiProgress(100);
      setAiStatus('Texte bereit');

      // Auto-advance
      setTimeout(() => { if (!cancelled) setStage('rendering'); }, 800);
    };

    generateTexts();
    return () => { cancelled = true; };
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Stage 3: PDF Rendering ──────────────────────────────────────

  useEffect(() => {
    if (stage !== 'rendering') return;
    let cancelled = false;

    const render = async () => {
      try {
        const pdfData: ValuationPdfData = {
          snapshot: snapshot || {} as CanonicalPropertySnapshot,
          valueBand: valueBand ?? { p50: 0, p25: 0, p75: 0, confidence: 'low' as any, confidenceScore: 0, weightingTable: [], reasoning: '' },
          methods: methods || [],
          financing: financing || [],
          stressTests: stressTests || [],
          lienProxy: lienProxy || null,
          dataQuality: dataQuality || null,
          compStats: compStats || null,
          comps: comps || [],
          location: location || null,
          executiveSummary: executiveSummary || '',
          caseId: caseId || 'unknown',
          generatedAt: new Date().toISOString(),
          sourceMode: sourceMode || 'SSOT_FINAL',
          legalTitle: legalTitle || null,
          beleihungswert: beleihungswert || null,
          geminiResearch: geminiResearch || null,
          aiNarratives,
          photos: photos || [],
        };

        console.log('[PDF Pipeline] Starting render with data keys:', Object.keys(pdfData).filter(k => !!(pdfData as any)[k]).join(', '));
        
        const { blob, pageCount: pages } = await generateValuationPdfBlob(pdfData);
        if (cancelled) return;

        setPdfBlob(blob);
        setPageCount(pages);

        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setPdfUrl(url);
        setStage('preview');
      } catch (e) {
        if (cancelled) return;
        const errorMsg = e instanceof Error ? e.message : 'Unbekannter Fehler';
        const errorStack = e instanceof Error ? e.stack : '';
        console.error('[PDF Pipeline] Render error:', errorMsg, '\nStack:', errorStack);
        setError(`PDF-Fehler: ${errorMsg}`);
      }
    };

    render();
    return () => { cancelled = true; };
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handlers ────────────────────────────────────────────────────

  const handleDownload = useCallback(() => {
    if (!pdfBlob) return;
    const caseShort = (caseId || 'unknown').slice(0, 8);
    const filename = `Kurzgutachten-${caseShort}-${new Date().toISOString().slice(0, 10)}.pdf`;
    const a = document.createElement('a');
    a.href = pdfUrl!;
    a.download = filename;
    a.click();
  }, [pdfBlob, pdfUrl, caseId]);

  // ─── Stage Config ────────────────────────────────────────────────

  const stages: { key: PipelineStage; label: string; icon: React.ReactNode }[] = [
    { key: 'inventory', label: 'Daten-Inventur', icon: <FileText className="h-3.5 w-3.5" /> },
    { key: 'ai_texts', label: 'KI-Texte', icon: <Sparkles className="h-3.5 w-3.5" /> },
    { key: 'rendering', label: 'PDF-Rendering', icon: <FileText className="h-3.5 w-3.5" /> },
    { key: 'preview', label: 'Sichtkontrolle', icon: <Eye className="h-3.5 w-3.5" /> },
  ];

  const stageIndex = stages.findIndex(s => s.key === stage);

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">PDF-Gutachten erzeugen</h3>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Stage indicators */}
          <div className="flex items-center gap-1">
            {stages.map((s, i) => {
              const isActive = i === stageIndex;
              const isDone = i < stageIndex;
              return (
                <div key={s.key} className="flex items-center gap-1 flex-1">
                  <div className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-colors w-full justify-center',
                    isDone && 'bg-primary/10 text-primary',
                    isActive && 'bg-primary text-primary-foreground',
                    !isDone && !isActive && 'bg-muted text-muted-foreground',
                  )}>
                    {isDone ? <CheckCircle2 className="h-3 w-3" /> : isActive ? <Loader2 className="h-3 w-3 animate-spin" /> : <Circle className="h-3 w-3" />}
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{i + 1}</span>
                  </div>
                  {i < stages.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive/30">
          <CardContent className="py-6 text-center space-y-3">
            <AlertTriangle className="h-6 w-6 text-destructive mx-auto" />
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="outline" onClick={onClose}>Schließen</Button>
          </CardContent>
        </Card>
      )}

      {/* Stage 1: Inventory */}
      {stage === 'inventory' && (
        <Card>
          <CardContent className="py-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Daten-Inventur</p>
              <Badge variant="outline" className="text-[10px]">
                {inventory.filter(i => i.available).length}/{inventory.length} Sektionen
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {inventory.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  {item.available
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    : <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  }
                  <span className={cn(item.available ? 'text-foreground' : 'text-muted-foreground')}>
                    {item.label}
                  </span>
                  {item.detail && (
                    <span className="text-muted-foreground/70 text-[10px]">({item.detail})</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stage 2: AI Texts */}
      {stage === 'ai_texts' && (
        <Card>
          <CardContent className="py-8 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <p className="text-sm font-medium">{aiStatus || 'KI-Texte werden generiert…'}</p>
            </div>
            <Progress value={aiProgress} className="h-2 max-w-xs mx-auto" />
            <p className="text-[10px] text-muted-foreground text-center">
              Objektbeschreibung, Methodik, Standort-Narrativ
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stage 3: Rendering */}
      {stage === 'rendering' && !error && (
        <Card>
          <CardContent className="py-8 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <p className="text-sm font-medium">PDF wird gerendert…</p>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Karten, Tabellen und Diagramme werden eingebettet
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stage 4: Preview */}
      {stage === 'preview' && pdfUrl && (
        <div className="space-y-3">
          <Card>
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-[10px] bg-emerald-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Fertig
                </Badge>
                <span className="text-xs text-muted-foreground">{pageCount} Seiten</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={onClose}>
                  Verwerfen
                </Button>
                <Button size="sm" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  PDF Herunterladen
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* PDF Preview */}
          <div className="rounded-lg border overflow-hidden bg-muted/30" style={{ height: '70vh' }}>
            <iframe
              src={pdfUrl}
              className="w-full h-full"
              title="Gutachten Vorschau"
            />
          </div>
        </div>
      )}
    </div>
  );
}
