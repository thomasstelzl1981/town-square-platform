/**
 * TLC Section: NK-Vorauszahlungsanpassung (§560 BGB)
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, ArrowUpDown, Copy } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import { usePrepaymentAdjustment, calculatePrepaymentAdjustment, generatePrepaymentAdjustmentText, type PrepaymentAdjustment } from '@/hooks/usePrepaymentAdjustment';
import { toast } from 'sonner';

interface Props {
  propertyId: string;
  leaseId: string;
  currentNkAdvance?: number;
  tenantName?: string;
  unitId?: string;
}

export function TLCPrepaymentSection({ propertyId, leaseId, currentNkAdvance = 0, tenantName, unitId }: Props) {
  const { isLoading } = usePrepaymentAdjustment(propertyId);
  const [totalActualCosts, setTotalActualCosts] = useState('');
  const [months, setMonths] = useState('12');
  const [buffer, setBuffer] = useState('10');
  const [result, setResult] = useState<ReturnType<typeof calculatePrepaymentAdjustment> | null>(null);
  const [letterText, setLetterText] = useState('');

  const handleCalculate = () => {
    const costs = parseFloat(totalActualCosts);
    if (!costs || costs <= 0) { toast.error('Bitte Gesamtkosten eingeben'); return; }
    const calc = calculatePrepaymentAdjustment(currentNkAdvance, costs, parseInt(months) || 12, parseFloat(buffer) || 10);
    setResult(calc);
    const adj: PrepaymentAdjustment = { leaseId, unitId: unitId || '', tenantName: tenantName || 'Mieter/in', currentPrepayment: currentNkAdvance, actualCostsMonthly: calc.monthlyActual, suggestedPrepayment: calc.suggested, adjustmentEur: calc.adjustment, adjustmentPercent: calc.adjustmentPercent, effectiveDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0], reason: 'Anpassung auf Basis der letzten Betriebskostenabrechnung.' };
    setLetterText(generatePrepaymentAdjustmentText(adj));
  };

  const handleCopyLetter = () => { navigator.clipboard.writeText(letterText); toast.success('Anschreiben kopiert'); };

  return (
    <div className="space-y-3">
      <h4 className={DESIGN.TYPOGRAPHY.LABEL}>
        <ArrowUpDown className="h-3.5 w-3.5 inline mr-1.5" />
        NK-Vorauszahlungsanpassung (§560)
      </h4>

      <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
        Aktuelle NK-Vorauszahlung: <strong>{currentNkAdvance.toFixed(2)} €/Monat</strong>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Gesamt-NK (Abrechnungszeitraum) €</Label><Input type="number" step="0.01" value={totalActualCosts} onChange={e => setTotalActualCosts(e.target.value)} className="h-7 text-xs" /></div>
        <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Monate</Label><Input type="number" value={months} onChange={e => setMonths(e.target.value)} className="h-7 text-xs" /></div>
        <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Puffer %</Label><Input type="number" value={buffer} onChange={e => setBuffer(e.target.value)} className="h-7 text-xs" /></div>
      </div>

      <Button size="sm" className="h-7 text-xs" onClick={handleCalculate}>
        <Calculator className="mr-1 h-3 w-3" />Berechnen
      </Button>

      {result && (
        <div className="space-y-2 pt-2 border-t">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-muted/40 rounded p-2"><p className="text-muted-foreground">Ø monatl. NK</p><p className="font-semibold">{result.monthlyActual.toFixed(2)} €</p></div>
            <div className="bg-muted/40 rounded p-2"><p className="text-muted-foreground">Vorschlag</p><p className="font-semibold">{result.suggested.toFixed(2)} €</p></div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant={result.adjustment > 0 ? 'destructive' : 'default'} className="text-[10px]">
              {result.adjustment > 0 ? '+' : ''}{result.adjustment.toFixed(2)} € ({result.adjustmentPercent.toFixed(1)}%)
            </Badge>
          </div>
        </div>
      )}

      {letterText && (
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Anschreiben-Entwurf</p>
            <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={handleCopyLetter}>
              <Copy className="mr-1 h-2.5 w-2.5" />Kopieren
            </Button>
          </div>
          <pre className="text-[10px] bg-muted/30 rounded p-2 whitespace-pre-wrap max-h-40 overflow-y-auto font-sans">{letterText}</pre>
        </div>
      )}
    </div>
  );
}
