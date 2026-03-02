/**
 * TLC Section: Rechnungsprüfung (SKR04 + Budget-Check)
 * via useInvoiceVerification
 */
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, Receipt, CheckCircle, AlertTriangle, XCircle, Search } from 'lucide-react';
import { useInvoiceVerification, verifyInvoice, suggestBwaKonto, type InvoiceItem, type BudgetLimit } from '@/hooks/useInvoiceVerification';

interface Props {
  propertyId: string;
}

export function TLCInvoiceSection({ propertyId }: Props) {
  const [open, setOpen] = useState(false);
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [verificationResult, setVerificationResult] = useState<ReturnType<typeof verifyInvoice> | null>(null);

  const handleVerify = () => {
    if (!vendor || !amount) return;
    const invoice: InvoiceItem = {
      id: 'check-' + Date.now(),
      invoiceNumber: invoiceNumber || '',
      vendor,
      description,
      amount: parseFloat(amount) || 0,
      currency: 'EUR',
      invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      bwaKontoNummer: null,
      propertyId,
      status: 'pending',
    };
    const result = verifyInvoice(invoice, [], {});
    setVerificationResult(result);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-8 text-xs">
          <span className="flex items-center gap-2">
            <Receipt className="h-3.5 w-3.5" />
            Rechnungsprüfung (SKR04)
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 px-1 pt-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Lieferant *</Label>
            <Input value={vendor} onChange={e => setVendor(e.target.value)} className="h-7 text-xs" placeholder="z.B. Stadtwerke" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Betrag (€) *</Label>
            <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="h-7 text-xs" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Beschreibung</Label>
          <Input value={description} onChange={e => setDescription(e.target.value)} className="h-7 text-xs" placeholder="z.B. Heizungswartung Q1" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Rechnungs-Nr.</Label>
            <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="h-7 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Rechnungsdatum</Label>
            <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="h-7 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Fällig am</Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-7 text-xs" />
          </div>
        </div>

        <Button size="sm" className="h-7 text-xs" onClick={handleVerify}>
          <Search className="mr-1 h-3 w-3" />Prüfen
        </Button>

        {verificationResult && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              {verificationResult.isValid ? (
                <Badge variant="default" className="text-[10px]"><CheckCircle className="mr-1 h-2.5 w-2.5" />Valide</Badge>
              ) : (
                <Badge variant="destructive" className="text-[10px]"><XCircle className="mr-1 h-2.5 w-2.5" />Fehler</Badge>
              )}
              {verificationResult.bwaMatch && (
                <Badge variant="secondary" className="text-[10px]">
                  BWA: {verificationResult.bwaMatch.code} — {verificationResult.bwaMatch.name}
                </Badge>
              )}
              {verificationResult.suggestedKonto && !verificationResult.bwaMatch && (
                <Badge variant="outline" className="text-[10px]">
                  Vorschlag: Konto {verificationResult.suggestedKonto}
                </Badge>
              )}
            </div>

            {verificationResult.warnings.length > 0 && (
              <div className="space-y-1">
                {verificationResult.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px] text-amber-600">
                    <AlertTriangle className="h-2.5 w-2.5 mt-0.5 shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {verificationResult.errors.length > 0 && (
              <div className="space-y-1">
                {verificationResult.errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px] text-destructive">
                    <XCircle className="h-2.5 w-2.5 mt-0.5 shrink-0" />
                    <span>{e}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
