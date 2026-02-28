/**
 * Registry Import Card — BaFin / IHK Register Import Widget
 * Used in ArmstrongInfoPage to trigger bulk registry imports.
 */
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const IMPORT_CATEGORIES = [
  { value: 'bank_retail', label: 'Filialbank (BaFin)' },
  { value: 'bank_private', label: 'Privatbank (BaFin)' },
  { value: 'insurance_broker_34d', label: 'Versicherungsmakler §34d (IHK)' },
  { value: 'financial_broker_34f', label: 'Finanzanlagenvermittler §34f (IHK)' },
  { value: 'fee_advisor_34h', label: 'Honorar-Berater §34h (IHK)' },
  { value: 'mortgage_broker_34i', label: 'Immobiliardarlehensvermittler §34i (IHK)' },
  { value: 'loan_broker', label: 'Kreditvermittler (IHK)' },
] as const;

interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  message?: string;
}

export function RegistryImportCard() {
  const { activeTenantId } = useAuth();
  const [category, setCategory] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Bitte eine CSV-Datei auswählen');
        return;
      }
      setCsvFile(file);
      setResult(null);
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!activeTenantId || !category || !csvFile) {
      toast.error('Bitte Kategorie und CSV-Datei auswählen');
      return;
    }

    setIsImporting(true);
    setResult(null);

    try {
      const csvContent = await csvFile.text();

      const { data, error } = await supabase.functions.invoke('sot-registry-import', {
        body: {
          source: category.startsWith('bank') ? 'bafin_register' : 'ihk_register',
          tenant_id: activeTenantId,
          category_code: category,
          csv_content: csvContent,
        },
      });

      if (error) throw error;

      const importResult: ImportResult = {
        imported: data?.imported ?? 0,
        skipped: data?.skipped ?? 0,
        errors: data?.errors ?? 0,
        message: data?.message,
      };

      setResult(importResult);
      toast.success(`${importResult.imported} Kontakte importiert`);
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Import fehlgeschlagen: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    } finally {
      setIsImporting(false);
    }
  }, [activeTenantId, category, csvFile]);

  const selectedLabel = IMPORT_CATEGORIES.find(c => c.value === category)?.label;
  const isBafin = category.startsWith('bank');
  const total = result ? result.imported + result.skipped + result.errors : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base">Register-Import (BaFin / IHK)</CardTitle>
            <CardDescription>Banken und Vermittler aus offiziellen Registern importieren</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Kategorie</label>
          <Select value={category} onValueChange={(v) => { setCategory(v); setResult(null); }}>
            <SelectTrigger>
              <SelectValue placeholder="Register-Typ wählen…" />
            </SelectTrigger>
            <SelectContent>
              {IMPORT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* CSV Upload */}
        {category && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {isBafin ? 'BaFin-Register CSV' : 'IHK-Vermittlerregister CSV'}
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors text-sm">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{csvFile ? csvFile.name : 'CSV auswählen…'}</span>
                <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
              </label>
              {csvFile && (
                <Badge variant="secondary" className="gap-1">
                  <FileText className="h-3 w-3" />
                  {(csvFile.size / 1024).toFixed(0)} KB
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isBafin
                ? 'CSV vom BaFin-Institutsregister (Semikolon-getrennt, Spalten: Bezeichnung, Sitz, …)'
                : 'CSV vom IHK-Vermittlerregister (Semikolon-getrennt)'}
            </p>
          </div>
        )}

        {/* Import Button */}
        {category && csvFile && (
          <Button
            onClick={handleImport}
            disabled={isImporting}
            className="w-full"
          >
            {isImporting ? 'Import läuft…' : `Import starten (${selectedLabel})`}
          </Button>
        )}

        {/* Progress / Results */}
        {isImporting && (
          <div className="space-y-2">
            <Progress value={undefined} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">Import wird verarbeitet…</p>
          </div>
        )}

        {result && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              {result.errors === 0
                ? <CheckCircle2 className="h-4 w-4 text-primary" />
                : <AlertCircle className="h-4 w-4 text-destructive" />
              }
              Import abgeschlossen
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">{result.imported}</p>
                <p className="text-xs text-muted-foreground">Importiert</p>
              </div>
              <div>
                <p className="text-lg font-bold text-muted-foreground">{result.skipped}</p>
                <p className="text-xs text-muted-foreground">Duplikate</p>
              </div>
              <div>
                <p className="text-lg font-bold text-destructive">{result.errors}</p>
                <p className="text-xs text-muted-foreground">Fehler</p>
              </div>
            </div>
            {total > 0 && (
              <Progress value={(result.imported / total) * 100} className="h-1.5" />
            )}
            <p className="text-xs text-muted-foreground">
              Nächster Schritt: Enrichment per Google Places + Firecrawl
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}