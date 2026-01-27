import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileCheck, Building2 } from 'lucide-react';

interface SalesMandateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingTitle: string;
  askingPrice: number;
  commissionRate: number;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export const SalesMandateDialog = ({
  open,
  onOpenChange,
  listingTitle,
  askingPrice,
  commissionRate,
  onConfirm,
  isLoading
}: SalesMandateDialogProps) => {
  const [dataConsent, setDataConsent] = useState(false);
  const [mandateConsent, setMandateConsent] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleConfirm = async () => {
    await onConfirm();
    setDataConsent(false);
    setMandateConsent(false);
  };

  const canConfirm = dataConsent && mandateConsent && !isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Verkaufsauftrag erteilen
          </DialogTitle>
          <DialogDescription>
            Sie erteilen hiermit den Auftrag zur Veröffentlichung Ihres Objekts 
            auf der System of a Town Plattform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Object Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-medium">Objektdaten</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Objekt</p>
                <p className="font-medium">{listingTitle}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Kaufpreis</p>
                <p className="font-medium">{formatCurrency(askingPrice)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Käufer-Provision</p>
                <p className="font-medium">
                  {commissionRate.toFixed(1)}% netto ({(commissionRate * 1.19).toFixed(2)}% brutto)
                </p>
              </div>
            </div>
          </div>

          {/* Consents */}
          <div className="space-y-4">
            <p className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Vereinbarung
            </p>
            
            <div className="flex items-start gap-3">
              <Checkbox 
                id="data-consent" 
                checked={dataConsent}
                onCheckedChange={(checked) => setDataConsent(checked as boolean)}
              />
              <Label htmlFor="data-consent" className="text-sm leading-relaxed cursor-pointer">
                Ich bestätige die Richtigkeit aller Angaben im Exposé.
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox 
                id="mandate-consent" 
                checked={mandateConsent}
                onCheckedChange={(checked) => setMandateConsent(checked as boolean)}
              />
              <Label htmlFor="mandate-consent" className="text-sm leading-relaxed cursor-pointer">
                Ich erteile den Verkaufsauftrag gemäß den Allgemeinen Geschäftsbedingungen. 
                <span className="text-muted-foreground ml-1">(SALES_MANDATE)</span>
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!canConfirm}
            className="gap-2"
          >
            <FileCheck className="h-4 w-4" />
            {isLoading ? 'Erteile...' : 'Auftrag erteilen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SalesMandateDialog;
