import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { FileUploader } from '@/components/shared/FileUploader';
import { Loader2, FileSpreadsheet, CheckCircle2, Upload, Sparkles, Brain, TrendingUp, Building2, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { getXlsx } from '@/lib/lazyXlsx';
import { cn } from '@/lib/utils';

/** AI-mapped property row from sot-excel-ai-import */
interface AiPropertyRow {
  code: string;
  art: string;
  adresse: string;
  ort: string;
  plz: string;
  nutzung?: string | null;
  qm?: number | null;
  einheiten?: number | null;
  baujahr?: number | null;
  kaltmiete?: number | null;
  jahresmiete?: number | null;
  marktwert?: number | null;
  kaufpreis?: number | null;
  restschuld?: number | null;
  annuitaetMonat?: number | null;
  tilgungMonat?: number | null;
  zinsfestschreibungBis?: string | null;
  ueberschussJahr?: number | null;
  bank?: string | null;
  confidence: number;
  notes?: string | null;
}

interface AiSummary {
  totalRows?: number;
  uniqueProperties?: number;
  avgConfidence?: number;
  totalPortfolioValue?: number;
  totalAnnualIncome?: number;
  totalDebt?: number;
  issues?: string[];
}

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  initialFile?: File | null;
}

const formatCurrency = (val: number | null | undefined) =>
  val != null ? `${val.toLocaleString('de-DE')} €` : '–';

const ANALYSIS_STEPS = [
  { key: 'reading', icon: FileSpreadsheet, label: 'Datei wird gelesen…', detail: 'Excel-Struktur wird analysiert', progress: 10 },
  { key: 'ai-analyzing', icon: Brain, label: 'KI analysiert Datenstruktur…', detail: 'Spalten werden erkannt und zugeordnet', progress: 30 },
  { key: 'ai-finance', icon: TrendingUp, label: 'Finanzwerte werden extrahiert…', detail: 'Mieten, Darlehen, Kaufpreise, Marktwerte', progress: 55 },
  { key: 'ai-properties', icon: Building2, label: 'Immobilien werden identifiziert…', detail: 'Adressen, Objektarten, Einheiten', progress: 75 },
  { key: 'ai-loans', icon: Landmark, label: 'Finanzierungen werden verknüpft…', detail: 'Banken, Restschulden, Annuitäten', progress: 90 },
] as const;

type ParseStep = 'idle' | 'reading' | 'ai-analyzing' | 'ai-finance' | 'ai-properties' | 'ai-loans' | 'done';

export function ExcelImportDialog({ open, onOpenChange, tenantId, initialFile }: ExcelImportDialogProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [aiRows, setAiRows] = useState<AiPropertyRow[]>([]);
  const [aiSummary, setAiSummary] = useState<AiSummary | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [parseStep, setParseStep] = useState<ParseStep>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Auto-process initialFile when dialog opens with a pre-selected file
  useEffect(() => {
    if (open && initialFile && !file && parseStep === 'idle') {
      setFile(initialFile);
      parseAndMapExcel(initialFile);
    }
  }, [open, initialFile]);

  // Timer for elapsed seconds during parsing
  useEffect(() => {
    if (!isParsing) {
      setElapsedSeconds(0);
      return;
    }
    const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isParsing]);

  // Simulate progress steps during AI analysis
  useEffect(() => {
    if (parseStep !== 'ai-analyzing') return;
    const timers = [
      setTimeout(() => setParseStep('ai-finance'), 4000),
      setTimeout(() => setParseStep('ai-properties'), 10000),
      setTimeout(() => setParseStep('ai-loans'), 18000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [parseStep]);

  const parseAndMapExcel = useCallback(async (excelFile: File) => {
    setIsParsing(true);
    setParseStep('reading');

    try {
      // Step 1: Parse Excel with SheetJS
      const XLSX = await getXlsx();
      const data = await excelFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Find header row (first non-empty row)
      let headerIdx = 0;
      for (let i = 0; i < rawRows.length; i++) {
        if (rawRows[i] && rawRows[i].some((c: unknown) => c != null && c !== '')) {
          headerIdx = i;
          break;
        }
      }

      const headers = rawRows[headerIdx]?.map((h: unknown) => String(h ?? '')) || [];
      const dataRows = rawRows.slice(headerIdx + 1).filter(
        (row) => row && row.some((c: unknown) => c != null && c !== '')
      );

      if (dataRows.length === 0) {
        toast.error('Keine Datenzeilen in der Excel-Datei gefunden');
        setIsParsing(false);
        setParseStep('idle');
        return;
      }

      // Step 2: Send to AI for deep analysis
      setParseStep('ai-analyzing');

      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sot-excel-ai-import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session?.access_token}`,
          },
          body: JSON.stringify({
            headers,
            rows: dataRows,
            fileName: excelFile.name,
          }),
        }
      );

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const errMsg = (errBody as Record<string, string>).error || 'KI-Analyse fehlgeschlagen';
        toast.error(errMsg);
        setIsParsing(false);
        setParseStep('idle');
        return;
      }

      const result = await response.json();

      if (!result.success || !result.data?.length) {
        toast.error(result.error || 'Keine Immobiliendaten erkannt');
        setIsParsing(false);
        setParseStep('idle');
        return;
      }

      setAiRows(result.data);
      setAiSummary(result.summary);
      setSelectedRows(new Set(result.data.map((_: AiPropertyRow, i: number) => i)));
      setParseStep('done');
    } catch (error) {
      console.error('Excel AI import error:', error);
      toast.error('Fehler bei der KI-Analyse der Excel-Datei');
      setParseStep('idle');
    }

    setIsParsing(false);
  }, []);

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      parseAndMapExcel(files[0]);
    }
  };

  const toggleRow = (idx: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === aiRows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(aiRows.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    if (!tenantId) return;

    const rowsToImport = aiRows.filter((_, i) => selectedRows.has(i));
    if (rowsToImport.length === 0) {
      toast.error('Keine Zeilen ausgewählt');
      return;
    }

    setIsImporting(true);
    let successCount = 0;

    try {
      const { data: session } = await supabase.auth.getSession();

      for (const row of rowsToImport) {
        try {
          const annualIncome = row.jahresmiete ?? (row.kaltmiete ? row.kaltmiete * 12 : undefined);

          const propertyData: Record<string, unknown> = {
            address: row.adresse,
            city: row.ort,
            postal_code: row.plz,
            property_type: row.art,
            usage_type: row.nutzung || 'residential',
            total_area_sqm: row.qm,
            purchase_price: row.kaufpreis,
            market_value: row.marktwert,
            annual_income: annualIncome,
            year_built: row.baujahr,
            units_count: row.einheiten,
          };

          if (row.restschuld || row.annuitaetMonat || row.bank) {
            propertyData.loan_data = {
              bank_name: row.bank || null,
              outstanding_balance_eur: row.restschuld || null,
              annuity_monthly_eur: row.annuitaetMonat || null,
              fixed_interest_end_date: row.zinsfestschreibungBis || null,
            };
          }

          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sot-property-crud`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.session?.access_token}`,
              },
              body: JSON.stringify({
                action: 'create',
                data: propertyData,
              }),
            }
          );

          if (response.ok) {
            successCount++;
          } else {
            const err = await response.json().catch(() => ({}));
            console.warn(`Import failed for ${row.code}:`, err);
          }
        } catch (error) {
          console.error('Import row error:', error);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} Objekt(e) erfolgreich importiert`);
        queryClient.invalidateQueries({ queryKey: ['properties'] });
        queryClient.invalidateQueries({ queryKey: ['portfolio-units-annual'] });
        queryClient.invalidateQueries({ queryKey: ['context-property-assignments'] });
        queryClient.invalidateQueries({ queryKey: ['landlord-contexts'] });
        onOpenChange(false);
        resetState();
      } else {
        toast.error('Import fehlgeschlagen – keine Objekte angelegt');
      }
    } catch (error) {
      toast.error('Import fehlgeschlagen');
    }

    setIsImporting(false);
  };

  const resetState = () => {
    setFile(null);
    setAiRows([]);
    setAiSummary(null);
    setSelectedRows(new Set());
    setParseStep('idle');
    setElapsedSeconds(0);
  };

  const confidenceColor = (c: number) =>
    c >= 0.8 ? 'text-green-600' : c >= 0.5 ? 'text-yellow-600' : 'text-destructive';

  const currentStepInfo = ANALYSIS_STEPS.find(s => s.key === parseStep);
  const currentProgress = currentStepInfo?.progress ?? 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetState();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            KI-gestützter Portfolio Import
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Gemini Pro
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Die KI analysiert jede Zahl in Ihrer Excel-Datei und ordnet sie korrekt zu — Adressen, Mieten, Darlehen, Marktwerte.
          </DialogDescription>
        </DialogHeader>

        {/* Upload Zone — ChatGPT-style */}
        {!file ? (
          <div className="py-8">
            <FileUploader onFilesSelected={handleFileSelect} accept=".xlsx,.xls,.csv">
              {(isDragOver: boolean) => (
                <div className={cn(
                  'border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer',
                  isDragOver
                    ? 'border-primary bg-primary/5 scale-[1.02] shadow-lg'
                    : 'border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/20'
                )}>
                  <div className={cn(
                    'mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors',
                    isDragOver ? 'bg-primary/10' : 'bg-muted'
                  )}>
                    <Upload className={cn('h-8 w-8 transition-colors', isDragOver ? 'text-primary' : 'text-muted-foreground')} />
                  </div>
                  <p className="text-lg font-semibold mb-1">Excel-Datei hier ablegen</p>
                  <p className="text-sm text-muted-foreground mb-3">oder klicken zum Auswählen</p>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] px-2 py-0">.xlsx</Badge>
                    <Badge variant="outline" className="text-[10px] px-2 py-0">.xls</Badge>
                    <Badge variant="outline" className="text-[10px] px-2 py-0">.csv</Badge>
                    <span className="text-muted-foreground/50">·</span>
                    <span>Beliebige Spaltenstruktur</span>
                  </div>
                </div>
              )}
            </FileUploader>
          </div>
        ) : isParsing ? (
          /* Analysis Progress — detailed multi-step */
          <div className="py-8 px-4">
            <div className="max-w-md mx-auto space-y-6">
              {/* Progress bar */}
              <div className="space-y-2">
                <Progress value={currentProgress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{elapsedSeconds}s</span>
                  <span>{currentProgress}%</span>
                </div>
              </div>

              {/* Steps timeline */}
              <div className="space-y-3">
                {ANALYSIS_STEPS.map((step, idx) => {
                  const stepIdx = ANALYSIS_STEPS.findIndex(s => s.key === parseStep);
                  const isActive = step.key === parseStep;
                  const isDone = idx < stepIdx;
                  const isFuture = idx > stepIdx;
                  const StepIcon = step.icon;

                  return (
                    <div
                      key={step.key}
                      className={cn(
                        'flex items-center gap-3 rounded-lg p-3 transition-all',
                        isActive && 'bg-primary/5 border border-primary/20',
                        isDone && 'opacity-60',
                        isFuture && 'opacity-30'
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        isActive && 'bg-primary/10',
                        isDone && 'bg-green-100 dark:bg-green-950',
                        isFuture && 'bg-muted'
                      )}>
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : isActive ? (
                          <StepIcon className="h-4 w-4 text-primary animate-pulse" />
                        ) : (
                          <StepIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm font-medium',
                          isActive && 'text-primary',
                          isFuture && 'text-muted-foreground'
                        )}>
                          {step.label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{step.detail}</p>
                      </div>
                      {isActive && <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Die KI liest jede Zahl und ordnet sie dem richtigen Feld zu · {file.name}
              </p>
            </div>
          </div>
        ) : parseStep === 'done' && aiRows.length > 0 ? (
          <>
            {/* Summary — enhanced with portfolio totals */}
            <div className="flex items-center gap-3 py-2 flex-wrap">
              <Badge variant="secondary" className="text-sm">
                {aiRows.length} Objekte erkannt
              </Badge>
              <Badge variant="default" className="text-sm bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {selectedRows.size} ausgewählt
              </Badge>
              {aiSummary?.avgConfidence != null && (
                <Badge variant="outline" className="text-xs">
                  Ø Konfidenz: {Math.round(aiSummary.avgConfidence * 100)}%
                </Badge>
              )}
              {aiSummary?.totalPortfolioValue != null && (
                <Badge variant="outline" className="text-xs">
                  Portfoliowert: {formatCurrency(aiSummary.totalPortfolioValue)}
                </Badge>
              )}
              {aiSummary?.totalAnnualIncome != null && (
                <Badge variant="outline" className="text-xs">
                  Mieteinnahmen/a: {formatCurrency(aiSummary.totalAnnualIncome)}
                </Badge>
              )}
              {aiSummary?.totalDebt != null && (
                <Badge variant="outline" className="text-xs">
                  Darlehen: {formatCurrency(aiSummary.totalDebt)}
                </Badge>
              )}
            </div>

            {/* AI Issues */}
            {aiSummary?.issues && aiSummary.issues.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">Hinweise der KI:</p>
                <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 text-xs space-y-0.5">
                  {aiSummary.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview Table */}
            <ScrollArea className="flex-1 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedRows.size === aiRows.length}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Art</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Ort</TableHead>
                    <TableHead className="text-right">m²</TableHead>
                    <TableHead className="text-right">Marktwert</TableHead>
                    <TableHead className="text-right">Miete/M</TableHead>
                    <TableHead className="text-right">Restschuld</TableHead>
                    <TableHead className="text-center">Bank</TableHead>
                    <TableHead className="text-center">Konfidenz</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aiRows.map((row, idx) => (
                    <TableRow
                      key={idx}
                      className={!selectedRows.has(idx) ? 'opacity-50' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.has(idx)}
                          onCheckedChange={() => toggleRow(idx)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.code}</TableCell>
                      <TableCell>{row.art}</TableCell>
                      <TableCell className="max-w-[180px] truncate" title={row.adresse}>
                        {row.adresse}
                      </TableCell>
                      <TableCell>{row.ort}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.qm?.toLocaleString('de-DE') ?? '–'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-xs">
                        {formatCurrency(row.marktwert)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-xs">
                        {row.kaltmiete != null
                          ? formatCurrency(row.kaltmiete)
                          : row.jahresmiete != null
                          ? formatCurrency(Math.round(row.jahresmiete / 12))
                          : '–'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-xs">
                        {formatCurrency(row.restschuld)}
                      </TableCell>
                      <TableCell className="text-center text-xs truncate max-w-[80px]" title={row.bank || ''}>
                        {row.bank || '–'}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-xs font-medium ${confidenceColor(row.confidence)}`}>
                          {Math.round(row.confidence * 100)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Notes from AI */}
            {aiRows.some((r) => r.notes) && (
              <div className="text-xs text-muted-foreground space-y-0.5 pt-1">
                {aiRows.filter((r) => r.notes).map((r, i) => (
                  <p key={i}>
                    <span className="font-mono">{r.code}:</span> {r.notes}
                  </p>
                ))}
              </div>
            )}
          </>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          {parseStep === 'done' && aiRows.length > 0 && (
            <Button onClick={handleImport} disabled={isImporting || selectedRows.size === 0}>
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird importiert…
                </>
              ) : (
                `${selectedRows.size} Objekte übernehmen`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
