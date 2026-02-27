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
import { FileUploader } from '@/components/shared/FileUploader';
import { Loader2, FileSpreadsheet, CheckCircle2, AlertCircle, Upload, Sparkles, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { getXlsx } from '@/lib/lazyXlsx';

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

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  initialFile?: File | null;
}

const formatCurrency = (val: number | null | undefined) =>
  val != null ? `${val.toLocaleString('de-DE')} €` : '–';

export function ExcelImportDialog({ open, onOpenChange, tenantId, initialFile }: ExcelImportDialogProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [aiRows, setAiRows] = useState<AiPropertyRow[]>([]);
  const [aiSummary, setAiSummary] = useState<Record<string, unknown> | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [parseStep, setParseStep] = useState<'idle' | 'reading' | 'ai-mapping' | 'done'>('idle');

  // Auto-process initialFile when dialog opens with a pre-selected file
  useEffect(() => {
    if (open && initialFile && !file && parseStep === 'idle') {
      setFile(initialFile);
      parseAndMapExcel(initialFile);
    }
  }, [open, initialFile]);

  const parseAndMapExcel = useCallback(async (file: File) => {
    setIsParsing(true);
    setParseStep('reading');

    try {
      // Step 1: Parse Excel with SheetJS
      const XLSX = await getXlsx();
      const data = await file.arrayBuffer();
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

      // Step 2: Send to AI for intelligent mapping
      setParseStep('ai-mapping');

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
            fileName: file.name,
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
      // Select all rows by default
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
          // Map AI row to sot-property-crud schema
          // Compute annual_income: prefer jahresmiete, fallback kaltmiete × 12
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
          };

          // Attach loan data if any finance fields exist
          if (row.restschuld || row.annuitaetMonat || row.bank) {
            (propertyData as Record<string, unknown>).loan_data = {
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
  };

  const confidenceColor = (c: number) =>
    c >= 0.8 ? 'text-green-600' : c >= 0.5 ? 'text-yellow-600' : 'text-destructive';

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) resetState();
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            KI-gestützter Portfolio Import
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              AI
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Laden Sie eine beliebige Excel-Datei hoch – die KI erkennt automatisch Spalten und Datenstruktur.
          </DialogDescription>
        </DialogHeader>

        {/* Upload Zone */}
        {!file ? (
          <div className="py-8">
            <FileUploader onFilesSelected={handleFileSelect} accept=".xlsx,.xls,.csv">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-lg font-medium mb-1">Excel-Datei auswählen</p>
                <p className="text-sm text-muted-foreground">
                  Unterstützte Formate: .xlsx, .xls, .csv – beliebige Spaltenstruktur
                </p>
              </div>
            </FileUploader>
          </div>
        ) : isParsing ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            {parseStep === 'reading' && (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Datei wird gelesen…</span>
              </>
            )}
            {parseStep === 'ai-mapping' && (
              <>
                <Brain className="h-8 w-8 animate-pulse text-primary" />
                <span className="text-sm font-medium">KI analysiert Spaltenstruktur…</span>
                <span className="text-xs text-muted-foreground">Erkennung von Adressen, Flächen, Mieten, Darlehen</span>
              </>
            )}
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
              {aiSummary && (
                <Badge variant="outline" className="text-xs">
                  Ø Konfidenz: {Math.round(((aiSummary as Record<string, number>).avgConfidence || 0) * 100)}%
                </Badge>
              )}
            </div>

            {/* AI Issues */}
            {aiSummary && Array.isArray((aiSummary as Record<string, unknown>).issues) &&
              ((aiSummary as Record<string, string[]>).issues).length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">Hinweise der KI:</p>
                <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 text-xs space-y-0.5">
                  {((aiSummary as Record<string, string[]>).issues).map((issue, i) => (
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
                    <TableHead className="text-center">BJ</TableHead>
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
                      <TableCell className="text-center text-xs">
                        {row.baujahr ?? '–'}
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
                `${selectedRows.size} Objekte importieren`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
