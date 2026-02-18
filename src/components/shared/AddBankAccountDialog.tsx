import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, FileSpreadsheet, CheckCircle2, XCircle } from 'lucide-react';
import { FileUploader } from '@/components/shared/FileUploader';
import { getXlsx } from '@/lib/lazyXlsx';

interface AddBankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BankAccountFormData {
  account_name: string;
  iban: string;
  bank_name: string;
  is_default: boolean;
  owner_type: string;
  owner_id: string;
}

interface OwnerOption {
  id: string;
  label: string;
  type: 'person' | 'property' | 'pv_plant';
}

interface CsvRow {
  account_name: string;
  iban: string;
  bank_name: string;
  owner_hint: string;
  ibanValid: boolean;
}

const defaultFormData: BankAccountFormData = {
  account_name: '', iban: '', bank_name: '', is_default: false,
  owner_type: '', owner_id: '',
};

function validateIBAN(iban: string): boolean {
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/;
  return ibanRegex.test(cleanIban) && cleanIban.length >= 15 && cleanIban.length <= 34;
}

function formatIBAN(iban: string): string {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  return clean.replace(/(.{4})/g, '$1 ').trim();
}

function encodeOwnerValue(type: string, id: string) {
  return `${type}::${id}`;
}

function decodeOwnerValue(val: string): { type: string; id: string } {
  const [type, id] = val.split('::');
  return { type: type || '', id: id || '' };
}

// --- CSV / XLSX parsing helpers ---

const COLUMN_MAP: Record<string, keyof Pick<CsvRow, 'account_name' | 'iban' | 'bank_name' | 'owner_hint'>> = {
  kontobezeichnung: 'account_name',
  kontoname: 'account_name',
  account_name: 'account_name',
  iban: 'iban',
  bank: 'bank_name',
  bank_name: 'bank_name',
  bankname: 'bank_name',
  zuordnung: 'owner_hint',
  owner: 'owner_hint',
};

function mapHeaders(headers: string[]) {
  return headers.map(h => {
    const key = h.trim().toLowerCase().replace(/[^a-z_äöü]/g, '');
    return COLUMN_MAP[key] || null;
  });
}

function parseCsvText(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  // Auto-detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  const rawHeaders = firstLine.split(delimiter);
  const mapped = mapHeaders(rawHeaders);

  return lines.slice(1).map(line => {
    const cols = line.split(delimiter);
    const row: CsvRow = { account_name: '', iban: '', bank_name: '', owner_hint: '', ibanValid: false };
    mapped.forEach((field, i) => {
      if (field && cols[i]) {
        (row as any)[field] = cols[i].trim();
      }
    });
    row.iban = row.iban.replace(/\s/g, '').toUpperCase();
    row.ibanValid = validateIBAN(row.iban);
    return row;
  }).filter(r => r.iban || r.account_name);
}

async function parseXlsxFile(file: File): Promise<CsvRow[]> {
  const XLSX = await getXlsx();
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  if (json.length < 2) return [];

  const mapped = mapHeaders(json[0].map(String));
  return json.slice(1).map(cols => {
    const row: CsvRow = { account_name: '', iban: '', bank_name: '', owner_hint: '', ibanValid: false };
    mapped.forEach((field, i) => {
      if (field && cols[i] != null) {
        (row as any)[field] = String(cols[i]).trim();
      }
    });
    row.iban = row.iban.replace(/\s/g, '').toUpperCase();
    row.ibanValid = validateIBAN(row.iban);
    return row;
  }).filter(r => r.iban || r.account_name);
}

export function AddBankAccountDialog({ open, onOpenChange }: AddBankAccountDialogProps) {
  const queryClient = useQueryClient();
  const { activeTenantId } = useAuth();
  const [formData, setFormData] = useState<BankAccountFormData>(defaultFormData);
  const [ibanError, setIbanError] = useState<string | null>(null);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('einzeln');

  // Load all owner options in one query
  const { data: allOptions = [] } = useQuery({
    queryKey: ['all-owner-options', activeTenantId],
    queryFn: async (): Promise<OwnerOption[]> => {
      if (!activeTenantId) return [];
      const [personsRes, propsRes, pvRes] = await Promise.all([
        supabase.from('household_persons').select('id, first_name, last_name').eq('tenant_id', activeTenantId),
        supabase.from('properties').select('id, name').eq('tenant_id', activeTenantId),
        supabase.from('pv_plants').select('id, name').eq('tenant_id', activeTenantId),
      ]);
      const persons: OwnerOption[] = (personsRes.data || []).map((p: any) => ({
        id: p.id, label: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Person', type: 'person',
      }));
      const properties: OwnerOption[] = (propsRes.data || []).map((p: any) => ({
        id: p.id, label: p.name || 'Immobilie', type: 'property',
      }));
      const pvPlants: OwnerOption[] = (pvRes.data || []).map((p: any) => ({
        id: p.id, label: p.name || 'PV-Anlage', type: 'pv_plant',
      }));
      return [...persons, ...properties, ...pvPlants];
    },
    enabled: !!activeTenantId && open,
  });

  const personOptions = allOptions.filter(o => o.type === 'person');
  const propertyOptions = allOptions.filter(o => o.type === 'property');
  const pvOptions = allOptions.filter(o => o.type === 'pv_plant');

  const currentOwnerValue = formData.owner_type && formData.owner_id
    ? encodeOwnerValue(formData.owner_type, formData.owner_id)
    : '';

  const createAccount = useMutation({
    mutationFn: async (data: BankAccountFormData) => {
      if (!activeTenantId) throw new Error('Keine Organisation aktiv');
      const cleanIban = data.iban.replace(/\s/g, '').toUpperCase();

      if (data.is_default) {
        await supabase.from('msv_bank_accounts').update({ is_default: false }).eq('tenant_id', activeTenantId);
      }

      const { error } = await supabase.from('msv_bank_accounts').insert({
        tenant_id: activeTenantId,
        account_name: data.account_name,
        iban: cleanIban,
        bank_name: data.bank_name || null,
        is_default: data.is_default,
        status: 'pending',
        owner_type: data.owner_type || null,
        owner_id: data.owner_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Bankkonto hinzugefügt');
      queryClient.invalidateQueries({ queryKey: ['msv-bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['msv_bank_accounts'] });
      setFormData(defaultFormData);
      setIbanError(null);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Fehler beim Hinzufügen: ' + error.message);
    },
  });

  // Batch import mutation
  const batchImport = useMutation({
    mutationFn: async (rows: CsvRow[]) => {
      if (!activeTenantId) throw new Error('Keine Organisation aktiv');
      const validRows = rows.filter(r => r.ibanValid);
      if (validRows.length === 0) throw new Error('Keine gültigen Zeilen vorhanden');

      const inserts = validRows.map(r => ({
        tenant_id: activeTenantId,
        account_name: r.account_name || r.iban,
        iban: r.iban,
        bank_name: r.bank_name || null,
        status: 'pending' as const,
      }));

      const { error } = await supabase.from('msv_bank_accounts').insert(inserts);
      if (error) throw error;
      return validRows.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} Konten importiert`);
      queryClient.invalidateQueries({ queryKey: ['msv-bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['msv_bank_accounts'] });
      setCsvRows([]);
      setCsvFileName(null);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Import fehlgeschlagen: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_name.trim()) { toast.error('Bitte geben Sie einen Kontonamen ein'); return; }
    if (!validateIBAN(formData.iban)) { setIbanError('Ungültiges IBAN-Format'); return; }
    setIbanError(null);
    createAccount.mutate(formData);
  };

  const handleIbanChange = (value: string) => {
    const formatted = formatIBAN(value);
    setFormData(prev => ({ ...prev, iban: formatted }));
    if (value.replace(/\s/g, '').length >= 15) {
      setIbanError(!validateIBAN(value) ? 'Ungültiges IBAN-Format' : null);
    } else {
      setIbanError(null);
    }
  };

  const handleOwnerChange = (encoded: string) => {
    const { type, id } = decodeOwnerValue(encoded);
    setFormData(prev => ({ ...prev, owner_type: type, owner_id: id }));
  };

  const handleFilesSelected = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setCsvFileName(file.name);

    try {
      let rows: CsvRow[];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        rows = await parseXlsxFile(file);
      } else {
        const text = await file.text();
        rows = parseCsvText(text);
      }

      if (rows.length === 0) {
        toast.error('Keine Daten gefunden. Erwartete Spalten: Kontobezeichnung, IBAN, Bank');
        return;
      }
      setCsvRows(rows);
    } catch (err: any) {
      toast.error('Fehler beim Lesen der Datei: ' + err.message);
    }
  };

  const validCount = csvRows.filter(r => r.ibanValid).length;
  const invalidCount = csvRows.length - validCount;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setCsvRows([]); setCsvFileName(null); setActiveTab('einzeln'); } }}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Bankkonto hinzufügen
          </DialogTitle>
          <DialogDescription>
            Fügen Sie ein Konto manuell hinzu oder importieren Sie mehrere per CSV/XLSX.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="einzeln">Einzeln</TabsTrigger>
            <TabsTrigger value="csv">
              <FileSpreadsheet className="h-4 w-4 mr-1.5" />
              CSV-Import
            </TabsTrigger>
          </TabsList>

          {/* --- Tab: Einzeln (existing form) --- */}
          <TabsContent value="einzeln">
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="account_name">Kontobezeichnung *</Label>
                <Input id="account_name" placeholder="z.B. Mietkonto Haupthaus"
                  value={formData.account_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="iban">IBAN *</Label>
                <Input id="iban" placeholder="DE89 3704 0044 0532 0130 00"
                  value={formData.iban}
                  onChange={(e) => handleIbanChange(e.target.value)}
                  className={ibanError ? 'border-destructive' : ''} />
                {ibanError && <p className="text-xs text-destructive">{ibanError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank</Label>
                <Input id="bank_name" placeholder="z.B. Commerzbank"
                  value={formData.bank_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>Zuordnung</Label>
                <Select value={currentOwnerValue} onValueChange={handleOwnerChange}>
                  <SelectTrigger><SelectValue placeholder="Zuordnung wählen…" /></SelectTrigger>
                  <SelectContent>
                    {personOptions.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Personen</SelectLabel>
                        {personOptions.map(o => (
                          <SelectItem key={o.id} value={encodeOwnerValue('person', o.id)}>{o.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {propertyOptions.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Vermietereinheiten</SelectLabel>
                        {propertyOptions.map(o => (
                          <SelectItem key={o.id} value={encodeOwnerValue('property', o.id)}>{o.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {pvOptions.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>PV-Anlagen</SelectLabel>
                        {pvOptions.map(o => (
                          <SelectItem key={o.id} value={encodeOwnerValue('pv_plant', o.id)}>{o.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {allOptions.length === 0 && (
                      <SelectItem value="__empty__" disabled>Keine Einträge vorhanden</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="is_default" className="cursor-pointer">Als Standard setzen</Label>
                  <p className="text-xs text-muted-foreground">Wird für neue Mietverhältnisse verwendet</p>
                </div>
                <Switch id="is_default" checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                <Button type="submit" disabled={createAccount.isPending}>
                  {createAccount.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Konto hinzufügen
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* --- Tab: CSV-Import --- */}
          <TabsContent value="csv">
            <div className="space-y-4 pt-2">
              {csvRows.length === 0 ? (
                <>
                  <FileUploader
                    accept=".csv,.xlsx,.xls"
                    onFilesSelected={handleFilesSelected}
                    label="CSV oder XLSX hier ablegen"
                    hint="Erwartete Spalten: Kontobezeichnung, IBAN, Bank, Zuordnung (optional)"
                  />
                  <div className="rounded-lg border border-dashed p-3">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Beispiel-Format:</p>
                    <pre className="text-[11px] text-muted-foreground font-mono">
{`Kontobezeichnung;IBAN;Bank;Zuordnung
Mietkonto Haus A;DE89370400440532013000;Commerzbank;
Sparkonto;DE27100777770209299700;Deutsche Bank;`}
                    </pre>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{csvFileName}</p>
                    <div className="flex items-center gap-2">
                      {validCount > 0 && (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {validCount} gültig
                        </Badge>
                      )}
                      {invalidCount > 0 && (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          {invalidCount} fehlerhaft
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="max-h-[280px] overflow-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted">
                        <tr className="text-left text-xs text-muted-foreground">
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Kontobezeichnung</th>
                          <th className="py-2 px-3">IBAN</th>
                          <th className="py-2 px-3">Bank</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.map((row, i) => (
                          <tr key={i} className={row.ibanValid ? 'bg-emerald-500/5' : 'bg-destructive/5'}>
                            <td className="py-1.5 px-3">
                              {row.ibanValid
                                ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                : <XCircle className="h-4 w-4 text-destructive" />
                              }
                            </td>
                            <td className="py-1.5 px-3 text-xs">{row.account_name || '—'}</td>
                            <td className="py-1.5 px-3 text-xs font-mono">{formatIBAN(row.iban) || '—'}</td>
                            <td className="py-1.5 px-3 text-xs">{row.bank_name || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button type="button" variant="outline" onClick={() => { setCsvRows([]); setCsvFileName(null); }}>
                      Andere Datei
                    </Button>
                    <Button
                      onClick={() => batchImport.mutate(csvRows)}
                      disabled={validCount === 0 || batchImport.isPending}
                    >
                      {batchImport.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {validCount} Konten importieren
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
