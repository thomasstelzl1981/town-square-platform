import { useState, useCallback } from 'react';
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
import { Loader2, FileSpreadsheet, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ImportRow {
  rowNum: number;
  code: string | null;
  property_type: string;
  city: string;
  address: string;
  postal_code: string | null;
  total_area_sqm: number | null;
  usage_type: string;
  annual_income: number | null;
  market_value: number | null;
  current_balance: number | null;
  monthly_rate: number | null;
  management_fee: number | null;
  errors: string[];
  isValid: boolean;
}

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
}

const COLUMN_MAPPING: Record<number, keyof ImportRow> = {
  0: 'code',
  1: 'property_type',
  2: 'city',
  3: 'address',
  4: 'total_area_sqm',
  5: 'usage_type',
  6: 'annual_income',
  7: 'market_value',
  8: 'current_balance',
  9: 'monthly_rate',
  10: 'management_fee',
};

export function ExcelImportDialog({ open, onOpenChange, tenantId }: ExcelImportDialogProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [skipErrors, setSkipErrors] = useState(true);

  const parseExcel = useCallback(async (file: File) => {
    setIsParsing(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Skip header row (row 0)
      const importRows: ImportRow[] = [];
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || !row.some(cell => cell !== null && cell !== '')) continue;

        const errors: string[] = [];
        
        // Parse values
        const code = row[0]?.toString() || null;
        const property_type = row[1]?.toString() || '';
        const city = row[2]?.toString() || '';
        const address = row[3]?.toString() || '';
        const postal_code = row[11]?.toString() || null;
        const total_area_sqm = parseFloat(row[4]) || null;
        const usage_type = row[5]?.toString() || 'residential';
        const annual_income = parseFloat(row[6]) || null;
        const market_value = parseFloat(row[7]) || null;
        const current_balance = parseFloat(row[8]) || null;
        const monthly_rate = parseFloat(row[9]) || null;
        const management_fee = parseFloat(row[10]) || null;

        // Validate required fields
        if (!property_type) errors.push('Art fehlt');
        if (!city) errors.push('Ort fehlt');
        if (!address) errors.push('Adresse fehlt');

        importRows.push({
          rowNum: i + 1,
          code,
          property_type,
          city,
          address,
          postal_code,
          total_area_sqm,
          usage_type,
          annual_income,
          market_value,
          current_balance,
          monthly_rate,
          management_fee,
          errors,
          isValid: errors.length === 0,
        });
      }

      setParsedData(importRows);
    } catch (error) {
      console.error('Excel parse error:', error);
      toast.error('Excel-Datei konnte nicht gelesen werden');
    }
    
    setIsParsing(false);
  }, []);

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      parseExcel(files[0]);
    }
  };

  const handleImport = async () => {
    if (!tenantId) return;
    
    const rowsToImport = skipErrors 
      ? parsedData.filter(r => r.isValid)
      : parsedData;

    if (rowsToImport.length === 0) {
      toast.error('Keine gültigen Zeilen zum Import');
      return;
    }

    setIsImporting(true);
    let successCount = 0;

    try {
      const { data: session } = await supabase.auth.getSession();
      
      for (const row of rowsToImport) {
        try {
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
                data: {
                  address: row.address,
                  city: row.city,
                  postal_code: row.postal_code,
                  property_type: row.property_type,
                  usage_type: row.usage_type,
                  total_area_sqm: row.total_area_sqm,
                  market_value: row.market_value,
                },
              }),
            }
          );

          if (response.ok) {
            successCount++;
          }
        } catch (error) {
          console.error('Import row error:', error);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} Objekt(e) importiert`);
        queryClient.invalidateQueries({ queryKey: ['properties'] });
        onOpenChange(false);
        resetState();
      } else {
        toast.error('Import fehlgeschlagen');
      }
    } catch (error) {
      toast.error('Import fehlgeschlagen');
    }

    setIsImporting(false);
  };

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setSkipErrors(true);
  };

  const validCount = parsedData.filter(r => r.isValid).length;
  const errorCount = parsedData.filter(r => !r.isValid).length;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetState();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Portfolio Excel Import
          </DialogTitle>
          <DialogDescription>
            Importieren Sie Immobilien aus einer Excel-Datei
          </DialogDescription>
        </DialogHeader>

        {!file ? (
          <div className="py-8">
            <FileUploader
              onFilesSelected={handleFileSelect}
              accept=".xlsx,.xls,.csv"
            >
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-lg font-medium mb-1">Excel-Datei auswählen</p>
                <p className="text-sm text-muted-foreground">
                  Unterstützte Formate: .xlsx, .xls, .csv
                </p>
              </div>
            </FileUploader>
          </div>
        ) : isParsing ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3">Datei wird analysiert...</span>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="flex items-center gap-4 py-2">
              <Badge variant="secondary" className="text-sm">
                {parsedData.length} Zeilen gefunden
              </Badge>
              <Badge variant="default" className="text-sm bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {validCount} gültig
              </Badge>
              {errorCount > 0 && (
                <Badge variant="destructive" className="text-sm">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errorCount} mit Fehlern
                </Badge>
              )}
            </div>

            {/* Preview Table */}
            <ScrollArea className="flex-1 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Art</TableHead>
                    <TableHead>Ort</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((row) => (
                    <TableRow key={row.rowNum} className={!row.isValid ? 'bg-destructive/5' : ''}>
                      <TableCell className="text-muted-foreground text-xs">
                        {row.rowNum}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.code || '–'}
                      </TableCell>
                      <TableCell>{row.property_type || '–'}</TableCell>
                      <TableCell>{row.city || '–'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {row.address || '–'}
                      </TableCell>
                      <TableCell>
                        {row.isValid ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            OK
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            {row.errors.join(', ')}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Options */}
            {errorCount > 0 && (
              <div className="flex items-center gap-2 py-2">
                <Checkbox
                  id="skip-errors"
                  checked={skipErrors}
                  onCheckedChange={(checked) => setSkipErrors(checked as boolean)}
                />
                <label htmlFor="skip-errors" className="text-sm cursor-pointer">
                  Fehlerhafte Zeilen überspringen
                </label>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          {parsedData.length > 0 && (
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird importiert...
                </>
              ) : (
                `${skipErrors ? validCount : parsedData.length} Objekte importieren`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
