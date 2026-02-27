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
import { Loader2, FileSpreadsheet, CheckCircle2, Upload, Sparkles, Brain, TrendingUp, Building2, Landmark, AlertTriangle, RefreshCw } from 'lucide-react';
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

interface ImportRowResult {
  code: string;
  address: string;
  loan_status: 'created' | 'skipped' | 'failed' | 'n/a';
  loan_error?: string;
  property_status: 'created' | 'matched' | 'failed';
}

export type ImportMode = 'full' | 'loan-only';

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  initialFile?: File | null;
  contextId?: string | null;
  mode?: ImportMode;
}

const formatCurrency = (val: number | null | undefined) =>
  val != null ? `${val.toLocaleString('de-DE')} €` : '–';

/** Parse money-like strings: "55.000", "1.294.020,50", plain numbers */
function parseMoneyLike(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === 'number') return isFinite(raw) ? raw : null;
  const s = String(raw).trim();
  if (!s) return null;
  const deMatch = s.match(/^-?\d{1,3}(\.\d{3})*(,\d+)?$/);
  if (deMatch) return parseFloat(s.replace(/\./g, '').replace(',', '.')) || null;
  const enMatch = s.match(/^-?\d{1,3}(,\d{3})*(\.\d+)?$/);
  if (enMatch) return parseFloat(s.replace(/,/g, '')) || null;
  const n = parseFloat(s.replace(',', '.'));
  return isFinite(n) ? n : null;
}

const ANALYSIS_STEPS = [
  { key: 'reading', icon: FileSpreadsheet, label: 'Datei wird gelesen…', detail: 'Excel-Struktur wird analysiert', progress: 10 },
  { key: 'ai-analyzing', icon: Brain, label: 'KI analysiert Datenstruktur…', detail: 'Spalten werden erkannt und zugeordnet', progress: 30 },
  { key: 'ai-finance', icon: TrendingUp, label: 'Finanzwerte werden extrahiert…', detail: 'Mieten, Darlehen, Kaufpreise, Marktwerte', progress: 55 },
  { key: 'ai-properties', icon: Building2, label: 'Immobilien werden identifiziert…', detail: 'Adressen, Objektarten, Einheiten', progress: 75 },
  { key: 'ai-loans', icon: Landmark, label: 'Finanzierungen werden verknüpft…', detail: 'Banken, Restschulden, Annuitäten', progress: 90 },
] as const;

type ParseStep = 'idle' | 'reading' | 'ai-analyzing' | 'ai-finance' | 'ai-properties' | 'ai-loans' | 'done';

export function ExcelImportDialog({ open, onOpenChange, tenantId, initialFile, contextId, mode = 'full' }: ExcelImportDialogProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [aiRows, setAiRows] = useState<AiPropertyRow[]>([]);
  const [aiSummary, setAiSummary] = useState<AiSummary | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [parseStep, setParseStep] = useState<ParseStep>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [importResults, setImportResults] = useState<ImportRowResult[]>([]);
  const [showProtocol, setShowProtocol] = useState(false);

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
    setImportResults([]);
    setShowProtocol(false);

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
    setImportResults([]);
    let propertyCount = 0;
    let loanCreated = 0;
    let loanFailed = 0;
    const results: ImportRowResult[] = [];

    try {
      const { data: session } = await supabase.auth.getSession();
      const isLoanOnly = mode === 'loan-only';

      for (const row of rowsToImport) {
        try {
          const parsedJahresmiete = parseMoneyLike(row.jahresmiete);
          const parsedKaltmiete = parseMoneyLike(row.kaltmiete);
          const annualIncome = parsedJahresmiete ?? (parsedKaltmiete ? parsedKaltmiete * 12 : undefined);

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

          // Pass landlord context ID for auto-assignment
          if (contextId) {
            propertyData.landlord_context_id = contextId;
          }

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
                action: isLoanOnly ? 'loan-upsert' : 'create',
                data: propertyData,
              }),
            }
          );

          const resBody = await response.json().catch(() => ({}));

          if (response.ok || (isLoanOnly && resBody.matched)) {
            propertyCount++;
            const loanStatus = resBody.loan_status || 'n/a';
            if (loanStatus === 'created') loanCreated++;
            if (loanStatus === 'failed') loanFailed++;

            results.push({
              code: row.code,
              address: row.adresse,
              property_status: isLoanOnly ? 'matched' : 'created',
              loan_status: loanStatus,
              loan_error: resBody.loan_error || undefined,
            });
          } else {
            results.push({
              code: row.code,
              address: row.adresse,
              property_status: 'failed',
              loan_status: 'n/a',
              loan_error: resBody.error || 'Unbekannter Fehler',
            });
            console.warn(`Import failed for ${row.code}:`, resBody);
          }
        } catch (error) {
          console.error('Import row error:', error);
          results.push({
            code: row.code,
            address: row.adresse,
            property_status: 'failed',
            loan_status: 'n/a',
            loan_error: String(error),
          });
        }
      }

      setImportResults(results);

      // Differentiated toast
      if (propertyCount > 0) {
        if (loanFailed > 0) {
          toast.warning(
            mode === 'loan-only'
              ? `${loanCreated} Darlehen übernommen, ${loanFailed} fehlgeschlagen`
              : `${propertyCount} Objekte angelegt, aber ${loanFailed} Darlehen nicht gespeichert`,
            { duration: 8000 }
          );
          setShowProtocol(true);
        } else if (loanCreated > 0) {
          toast.success(
            mode === 'loan-only'
              ? `${loanCreated} Darlehen erfolgreich nachgezogen`
              : `${propertyCount} Objekte, ${loanCreated} Darlehen übernommen`
          );
        } else {
          toast.success(
            mode === 'loan-only'
              ? `${propertyCount} Objekte gematcht, keine Darlehensdaten vorhanden`
              : `${propertyCount} Objekt(e) erfolgreich importiert`
          );
        }

        queryClient.invalidateQueries({ queryKey: ['properties'] });
        queryClient.invalidateQueries({ queryKey: ['portfolio-units-annual'] });
        queryClient.invalidateQueries({ queryKey: ['context-property-assignments'] });
        queryClient.invalidateQueries({ queryKey: ['landlord-contexts'] });
        queryClient.invalidateQueries({ queryKey: ['unit-dossier'] });
        queryClient.invalidateQueries({ queryKey: ['loans'] });

        if (!loanFailed) {
          onOpenChange(false);
          resetState();
        }
      } else {
        toast.error('Import fehlgeschlagen – keine Objekte angelegt');
        setShowProtocol(true);
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
    setImportResults([]);
    setShowProtocol(false);
  };

  const confidenceColor = (c: number) =>
    c >= 0.8 ? 'text-green-600' : c >= 0.5 ? 'text-yellow-600' : 'text-destructive';

  const currentStepInfo = ANALYSIS_STEPS.find(s => s.key === parseStep);
  const currentProgress = currentStepInfo?.progress ?? 0;

  const isLoanOnly = mode === 'loan-only';

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
            {isLoanOnly ? (
              <>
                <RefreshCw className="h-5 w-5" />
                Darlehen nachziehen
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-5 w-5" />
                KI-gestützter Portfolio Import
              </>
            )}
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Gemini Pro
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {isLoanOnly
              ? 'Bestehende Objekte werden per Adresse gematcht. Nur die Darlehensdaten werden neu eingelesen.'
              : 'Die KI analysiert jede Zahl in Ihrer Excel-Datei und ordnet sie korrekt zu — Adressen, Mieten, Darlehen, Marktwerte.'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Import Protocol — shown after import with issues */}
        {showProtocol && importResults.length > 0 ? (
          <div className="space-y-3 flex-1 overflow-auto">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Import-Protokoll
            </div>
            <ScrollArea className="max-h-[400px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead className="text-center">Objekt</TableHead>
                    <TableHead className="text-center">Darlehen</TableHead>
                    <TableHead>Fehler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importResults.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{r.code}</TableCell>
                      <TableCell className="text-xs max-w-[180px] truncate">{r.address}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={r.property_status === 'failed' ? 'destructive' : 'default'} className="text-[10px]">
                          {r.property_status === 'created' ? '✓' : r.property_status === 'matched' ? '⟷' : '✗'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={r.loan_status === 'created' ? 'default' : r.loan_status === 'failed' ? 'destructive' : 'secondary'}
                          className="text-[10px]"
                        >
                          {r.loan_status === 'created' ? '✓' : r.loan_status === 'failed' ? '✗' : '–'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-destructive max-w-[200px] truncate" title={r.loan_error}>
                        {r.loan_error || '–'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        ) : (
          <>
            {/* Upload Zone */}
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
              /* Analysis Progress */
              <div className="py-8 px-4">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="space-y-2">
                    <Progress value={currentProgress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{elapsedSeconds}s</span>
                      <span>{currentProgress}%</span>
                    </div>
                  </div>

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
                {/* Summary */}
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
                  {isLoanOnly && (
                    <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Nur Darlehen
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
          </>
        )}

        <DialogFooter>
          {showProtocol && (
            <Button variant="outline" onClick={() => { setShowProtocol(false); }}>
              Zurück zur Vorschau
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {showProtocol ? 'Schließen' : 'Abbrechen'}
          </Button>
          {parseStep === 'done' && aiRows.length > 0 && !showProtocol && (
            <Button onClick={handleImport} disabled={isImporting || selectedRows.size === 0}>
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLoanOnly ? 'Darlehen werden nachgezogen…' : 'Wird importiert…'}
                </>
              ) : isLoanOnly ? (
                `Darlehen für ${selectedRows.size} Objekte nachziehen`
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
