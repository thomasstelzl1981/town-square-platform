/**
 * TransactionCsvImportDialog — Import bank transactions from CSV/XLSX
 * Supports duplicate detection via composite key (booking_date + amount_eur + purpose_text)
 */
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { FileUploader } from '@/components/shared/FileUploader';
import { getXlsx } from '@/lib/lazyXlsx';

interface TransactionCsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountRef: string; // account ID or IBAN used as account_ref
  onImportComplete: () => void;
}

interface ParsedRow {
  booking_date: string;
  value_date: string;
  booking_type: string;
  counterparty: string;
  counterparty_iban: string;
  purpose_text: string;
  amount_eur: number;
  saldo: number;
  status: 'new' | 'duplicate' | 'invalid';
}

// ─── Column mapping ──────────────────────────────────────

const COLUMN_MAP: Record<string, string> = {
  datum: 'booking_date',
  date: 'booking_date',
  booking_date: 'booking_date',
  buchungsdatum: 'booking_date',
  valuta: 'value_date',
  value_date: 'value_date',
  wertstellung: 'value_date',
  buchungsart: 'booking_type',
  art: 'booking_type',
  type: 'booking_type',
  gegenpartei: 'counterparty',
  counterparty: 'counterparty',
  auftraggeber: 'counterparty',
  empfaenger: 'counterparty',
  'auftraggeber / empfänger': 'counterparty',
  iban: 'counterparty_iban',
  iban_gegenpartei: 'counterparty_iban',
  verwendungszweck: 'purpose_text',
  purpose: 'purpose_text',
  zweck: 'purpose_text',
  betrag: 'amount_eur',
  amount: 'amount_eur',
  saldo: 'saldo',
  balance: 'saldo',
};

function mapHeaders(headers: string[]) {
  return headers.map(h => {
    const key = h.trim().toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9_/ ]/g, '').trim().replace(/\s+/g, '_');
    // try direct match first, then cleaned
    return COLUMN_MAP[h.trim().toLowerCase()] || COLUMN_MAP[key] || null;
  });
}

function parseAmount(val: string): number {
  // Handle German format: 1.234,56 or -1.234,56
  const cleaned = val.replace(/\s/g, '');
  if (cleaned.includes(',')) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  }
  return parseFloat(cleaned);
}

function parseDate(val: string): string {
  // Accept YYYY-MM-DD, DD.MM.YYYY, DD/MM/YYYY
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const dotMatch = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dotMatch) return `${dotMatch[3]}-${dotMatch[2]}-${dotMatch[1]}`;
  const slashMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) return `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`;
  return trimmed; // fallback
}

function rowFromCols(mapped: (string | null)[], cols: string[]): Omit<ParsedRow, 'status'> | null {
  const raw: Record<string, string> = {};
  mapped.forEach((field, i) => {
    if (field && cols[i] != null) {
      raw[field] = cols[i].trim();
    }
  });

  if (!raw.booking_date || !raw.amount_eur) return null;

  const amount = parseAmount(raw.amount_eur);
  if (isNaN(amount)) return null;

  return {
    booking_date: parseDate(raw.booking_date),
    value_date: raw.value_date ? parseDate(raw.value_date) : parseDate(raw.booking_date),
    booking_type: raw.booking_type || '',
    counterparty: raw.counterparty || '',
    counterparty_iban: raw.counterparty_iban || '',
    purpose_text: raw.purpose_text || '',
    amount_eur: amount,
    saldo: raw.saldo ? parseAmount(raw.saldo) : 0,
  };
}

function parseCsvText(text: string): Omit<ParsedRow, 'status'>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delimiter);
  const mapped = mapHeaders(headers);

  return lines.slice(1)
    .map(line => rowFromCols(mapped, line.split(delimiter)))
    .filter((r): r is Omit<ParsedRow, 'status'> => r !== null);
}

async function parseXlsxFile(file: File): Promise<Omit<ParsedRow, 'status'>[]> {
  const XLSX = await getXlsx();
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  if (json.length < 2) return [];

  const mapped = mapHeaders(json[0].map(String));
  return json.slice(1)
    .map(cols => rowFromCols(mapped, cols.map(c => String(c ?? ''))))
    .filter((r): r is Omit<ParsedRow, 'status'> => r !== null);
}

// ─── Duplicate key ───────────────────────────────────────

function dupKey(bookingDate: string, amount: number, purpose: string): string {
  return `${bookingDate}|${amount}|${purpose.trim().toLowerCase()}`;
}

// ─── Component ───────────────────────────────────────────

export function TransactionCsvImportDialog({
  open, onOpenChange, accountRef, onImportComplete,
}: TransactionCsvImportDialogProps) {
  const { activeTenantId } = useAuth();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const newRows = rows.filter(r => r.status === 'new');
  const dupRows = rows.filter(r => r.status === 'duplicate');
  const invalidRows = rows.filter(r => r.status === 'invalid');

  function fmt(v: number) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const handleFilesSelected = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setFileName(file.name);
    setChecking(true);

    try {
      let parsed: Omit<ParsedRow, 'status'>[];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        parsed = await parseXlsxFile(file);
      } else {
        const text = await file.text();
        parsed = parseCsvText(text);
      }

      if (parsed.length === 0) {
        toast.error('Keine Daten gefunden. Erwartete Spalten: Datum, Betrag, Verwendungszweck');
        setChecking(false);
        return;
      }

      // Load existing transactions for duplicate check
      const { data: existing } = await supabase
        .from('bank_transactions')
        .select('booking_date, amount_eur, purpose_text')
        .eq('account_ref', accountRef);

      const existingKeys = new Set(
        (existing || []).map(e => dupKey(e.booking_date, Number(e.amount_eur), e.purpose_text || ''))
      );

      const taggedRows: ParsedRow[] = parsed.map(r => {
        const key = dupKey(r.booking_date, r.amount_eur, r.purpose_text);
        const isDuplicate = existingKeys.has(key);
        return { ...r, status: isDuplicate ? 'duplicate' as const : 'new' as const };
      });

      setRows(taggedRows);
    } catch (err: any) {
      toast.error('Fehler beim Lesen: ' + err.message);
    } finally {
      setChecking(false);
    }
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!activeTenantId) throw new Error('Keine Organisation aktiv');
      if (newRows.length === 0) throw new Error('Keine neuen Zeilen zum Import');

      const inserts = newRows.map(r => ({
        tenant_id: activeTenantId,
        account_ref: accountRef,
        booking_date: r.booking_date,
        value_date: r.value_date || null,
        amount_eur: r.amount_eur,
        counterparty: r.counterparty || null,
        purpose_text: r.purpose_text || null,
        match_status: 'unmatched',
      }));

      // Batch in chunks of 100
      for (let i = 0; i < inserts.length; i += 100) {
        const chunk = inserts.slice(i, i + 100);
        const { error } = await supabase.from('bank_transactions').insert(chunk);
        if (error) throw error;
      }

      return inserts.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} Umsätze importiert`);
      setRows([]);
      setFileName(null);
      onImportComplete();
      onOpenChange(false);
    },
    onError: (err) => toast.error('Import fehlgeschlagen: ' + err.message),
  });

  const handleClose = (v: boolean) => {
    if (!v) { setRows([]); setFileName(null); }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Umsätze importieren
          </DialogTitle>
          <DialogDescription>
            CSV oder XLSX mit Kontobewegungen hochladen. Duplikate werden automatisch erkannt.
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          <div className="space-y-4">
            {checking ? (
              <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Datei wird analysiert…
              </div>
            ) : (
              <>
                <FileUploader
                  accept=".csv,.xlsx,.xls"
                  onFilesSelected={handleFilesSelected}
                  label="CSV oder XLSX hier ablegen"
                  hint="Erwartete Spalten: Datum, Valuta, Buchungsart, Gegenpartei, IBAN, Verwendungszweck, Betrag, Saldo"
                />
                <div className="rounded-lg border border-dashed p-3">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Beispiel-Format:</p>
                  <pre className="text-[11px] text-muted-foreground font-mono">
{`Datum;Valuta;Buchungsart;Gegenpartei;IBAN;Verwendungszweck;Betrag;Saldo
2025-01-01;2025-01-02;Gutschrift;Bergmann, Klaus;DE12500105170648489890;Miete WE-01;1150.00;6350.00`}
                  </pre>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3 flex-1 min-h-0 flex flex-col">
            {/* Summary badges */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{fileName}</p>
              <div className="flex items-center gap-2">
                {newRows.length > 0 && (
                  <Badge variant="default" className="gap-1 bg-emerald-600">
                    <CheckCircle2 className="h-3 w-3" />
                    {newRows.length} neu
                  </Badge>
                )}
                {dupRows.length > 0 && (
                  <Badge variant="secondary" className="gap-1 text-amber-700 bg-amber-100">
                    <AlertTriangle className="h-3 w-3" />
                    {dupRows.length} Duplikate
                  </Badge>
                )}
                {invalidRows.length > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    {invalidRows.length} fehlerhaft
                  </Badge>
                )}
              </div>
            </div>

            {/* Preview table */}
            <div className="flex-1 min-h-0 overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2">Datum</th>
                    <th className="py-2 px-2">Gegenpartei</th>
                    <th className="py-2 px-2">Verwendungszweck</th>
                    <th className="py-2 px-2 text-right">Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className={
                        row.status === 'new' ? 'bg-emerald-500/5' :
                        row.status === 'duplicate' ? 'bg-amber-500/10' :
                        'bg-destructive/5'
                      }
                    >
                      <td className="py-1.5 px-2">
                        {row.status === 'new' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                        {row.status === 'duplicate' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                        {row.status === 'invalid' && <XCircle className="h-4 w-4 text-destructive" />}
                      </td>
                      <td className="py-1.5 px-2 text-xs whitespace-nowrap">{fmtDate(row.booking_date)}</td>
                      <td className="py-1.5 px-2 text-xs">{row.counterparty || '—'}</td>
                      <td className="py-1.5 px-2 text-xs text-muted-foreground truncate max-w-[200px]">{row.purpose_text || '—'}</td>
                      <td className={`py-1.5 px-2 text-xs text-right font-medium whitespace-nowrap ${row.amount_eur >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                        {row.amount_eur >= 0 ? '+' : ''}{fmt(row.amount_eur)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => { setRows([]); setFileName(null); }}>
                Andere Datei
              </Button>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={newRows.length === 0 || importMutation.isPending}
              >
                {importMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {newRows.length} Umsätze importieren
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
