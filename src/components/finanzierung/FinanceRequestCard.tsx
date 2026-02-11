/**
 * FinanceRequestCard — Reusable financing request card with localStorage persistence.
 * Used identically in MOD-07 (Anfrage) and MOD-11 (Finanzierungsakte).
 */
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Euro, FileText, Save } from 'lucide-react';
import { toast } from 'sonner';

export interface FinanceFormData {
  purpose: string;
  purchasePrice: string;
  modernization: string;
  notary: string;
  transferTax: string;
  broker: string;
  equity: string;
  loanRequest: string;
  fixedRateYears: string;
  repayment: string;
  maxMonthlyRate: string;
}

export const emptyFinanceData: FinanceFormData = {
  purpose: 'kauf',
  purchasePrice: '', modernization: '', notary: '', transferTax: '', broker: '',
  equity: '', loanRequest: '', fixedRateYears: '', repayment: '', maxMonthlyRate: '',
};

interface Props {
  storageKey: string;
  initialData?: Partial<FinanceFormData>;
  readOnly?: boolean;
}

function TR({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <TableRow>
      <TableCell className="text-xs text-muted-foreground py-1.5 px-3 w-[180px] border-r">{label}</TableCell>
      <TableCell className="text-sm py-1.5 px-3">{children}</TableCell>
    </TableRow>
  );
}

function TRComputed({ label, value }: { label: string; value: string }) {
  return (
    <TableRow className="bg-muted/30">
      <TableCell className="text-xs font-semibold py-1.5 px-3 w-[180px] border-r">{label}</TableCell>
      <TableCell className="text-sm font-semibold py-1.5 px-3">{value}</TableCell>
    </TableRow>
  );
}

const inputCls = "h-7 text-xs border-0 bg-transparent shadow-none";

export default function FinanceRequestCard({ storageKey, initialData, readOnly = false }: Props) {
  const key = `${storageKey}-finance`;

  const [data, setData] = useState<FinanceFormData>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return { ...emptyFinanceData, ...JSON.parse(stored) };
    } catch {}
    return { ...emptyFinanceData, ...initialData };
  });

  const set = (field: keyof FinanceFormData, value: string) =>
    setData(prev => ({ ...prev, [field]: value }));

  const n = (v: string) => (v ? Number(v) : 0);
  const fmt = (v: number) => v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const gesamtkosten = useMemo(() =>
    n(data.purchasePrice) + n(data.modernization) + n(data.notary) + n(data.transferTax) + n(data.broker),
    [data.purchasePrice, data.modernization, data.notary, data.transferTax, data.broker]
  );

  const finanzierungsbedarf = useMemo(() =>
    Math.max(0, gesamtkosten - n(data.equity)),
    [gesamtkosten, data.equity]
  );

  const handleSave = () => {
    localStorage.setItem(key, JSON.stringify(data));
    toast.success('Finanzierungsdaten zwischengespeichert');
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-2.5 border-b bg-muted/20">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Euro className="h-4 w-4" /> Beantragte Finanzierung
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kostenzusammenstellung und Finanzierungsplan
          </p>
        </div>

        {/* Finanzierungszweck */}
        <Table>
          <TableBody>
            <TR label="Finanzierungszweck">
              <Select value={data.purpose} onValueChange={v => set('purpose', v)} disabled={readOnly}>
                <SelectTrigger className={inputCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kauf">Kauf</SelectItem>
                  <SelectItem value="neubau">Neubau</SelectItem>
                  <SelectItem value="umschuldung">Umschuldung</SelectItem>
                  <SelectItem value="modernisierung">Modernisierung</SelectItem>
                </SelectContent>
              </Select>
            </TR>
          </TableBody>
        </Table>

        {/* Kostenzusammenstellung */}
        <div className="px-4 py-2 border-b border-t">
          <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <Euro className="h-3.5 w-3.5" /> Kostenzusammenstellung
          </h4>
        </div>
        <Table>
          <TableBody>
            <TR label="Kaufpreis / Baukosten (€)">
              <Input value={data.purchasePrice} onChange={e => set('purchasePrice', e.target.value)}
                type="number" placeholder="0" className={inputCls} readOnly={readOnly} />
            </TR>
            <TR label="Modernisierungskosten (€)">
              <Input value={data.modernization} onChange={e => set('modernization', e.target.value)}
                type="number" placeholder="0" className={inputCls} readOnly={readOnly} />
            </TR>
            <TR label="Notar und Grundbuch (€)">
              <Input value={data.notary} onChange={e => set('notary', e.target.value)}
                type="number" placeholder="0" className={inputCls} readOnly={readOnly} />
            </TR>
            <TR label="Grunderwerbsteuer (€)">
              <Input value={data.transferTax} onChange={e => set('transferTax', e.target.value)}
                type="number" placeholder="0" className={inputCls} readOnly={readOnly} />
            </TR>
            <TR label="Maklerprovision (€)">
              <Input value={data.broker} onChange={e => set('broker', e.target.value)}
                type="number" placeholder="0" className={inputCls} readOnly={readOnly} />
            </TR>
            <TRComputed label="Gesamtkosten (€)" value={`${fmt(gesamtkosten)} €`} />
          </TableBody>
        </Table>

        {/* Finanzierungsplan */}
        <div className="px-4 py-2 border-b border-t">
          <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <FileText className="h-3.5 w-3.5" /> Finanzierungsplan
          </h4>
        </div>
        <Table>
          <TableBody>
            <TR label="Eigenkapital (€)">
              <Input value={data.equity} onChange={e => set('equity', e.target.value)}
                type="number" placeholder="0" className={inputCls} readOnly={readOnly} />
            </TR>
            <TR label="Darlehenswunsch (€)">
              <Input value={data.loanRequest} onChange={e => set('loanRequest', e.target.value)}
                type="number" placeholder="0" className={inputCls} readOnly={readOnly} />
            </TR>
            <TR label="Zinsbindung (Jahre)">
              <Select value={data.fixedRateYears} onValueChange={v => set('fixedRateYears', v)} disabled={readOnly}>
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Jahre</SelectItem>
                  <SelectItem value="10">10 Jahre</SelectItem>
                  <SelectItem value="15">15 Jahre</SelectItem>
                  <SelectItem value="20">20 Jahre</SelectItem>
                  <SelectItem value="25">25 Jahre</SelectItem>
                  <SelectItem value="30">30 Jahre</SelectItem>
                </SelectContent>
              </Select>
            </TR>
            <TR label="Anfängliche Tilgung (%)">
              <Input value={data.repayment} onChange={e => set('repayment', e.target.value)}
                type="number" placeholder="z.B. 2" className={inputCls} readOnly={readOnly} />
            </TR>
            <TR label="Max. Monatsrate (€)">
              <Input value={data.maxMonthlyRate} onChange={e => set('maxMonthlyRate', e.target.value)}
                type="number" placeholder="0" className={inputCls} readOnly={readOnly} />
            </TR>
            <TRComputed label="Finanzierungsbedarf (€)" value={`${fmt(finanzierungsbedarf)} €`} />
          </TableBody>
        </Table>

        {!readOnly && (
          <div className="px-4 py-3 border-t flex justify-end">
            <Button variant="outline" size="sm" onClick={handleSave} className="gap-2">
              <Save className="h-3.5 w-3.5" /> Zwischenspeichern
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
