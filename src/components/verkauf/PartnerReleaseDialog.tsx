import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Users, Euro, AlertTriangle } from 'lucide-react';

interface PartnerReleaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingTitle: string;
  askingPrice: number;
  onConfirm: (commissionRate: number) => Promise<void>;
  isLoading?: boolean;
}

export const PartnerReleaseDialog = ({
  open,
  onOpenChange,
  listingTitle,
  askingPrice,
  onConfirm,
  isLoading
}: PartnerReleaseDialogProps) => {
  const [commissionRate, setCommissionRate] = useState([7]);
  const [partnerReleaseConsent, setPartnerReleaseConsent] = useState(false);
  const [systemFeeConsent, setSystemFeeConsent] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const estimatedCommission = askingPrice * (commissionRate[0] / 100);

  const handleConfirm = async () => {
    await onConfirm(commissionRate[0]);
    setPartnerReleaseConsent(false);
    setSystemFeeConsent(false);
    setCommissionRate([7]);
  };

  const canConfirm = partnerReleaseConsent && systemFeeConsent && !isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Partner-Netzwerk Freigabe
          </DialogTitle>
          <DialogDescription>
            Ihr Objekt wird für unsere verifizierten Vertriebspartner sichtbar. 
            Leads von der Kaufy-Website gehen ebenfalls an unsere Partner.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Object Info */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">{listingTitle}</p>
            <p className="text-sm text-muted-foreground">
              Kaufpreis: {formatCurrency(askingPrice)}
            </p>
          </div>

          {/* Commission Slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="font-medium">Provision für Partner</Label>
              <span className="text-lg font-bold">{commissionRate[0].toFixed(1)}% netto</span>
            </div>
            <Slider
              value={commissionRate}
              onValueChange={setCommissionRate}
              min={3}
              max={15}
              step={0.5}
              className="py-2"
            />
            <p className="text-sm text-muted-foreground">
              Ca. {formatCurrency(estimatedCommission)} bei erfolgreichem Verkauf (wird vom Käufer gezahlt)
            </p>
          </div>

          <Separator />

          {/* System Fee Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Euro className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Ihre Kosten bei erfolgreicher Vermittlung</p>
                <p className="text-sm text-muted-foreground">
                  Bei Verkauf über unser Netzwerk zahlen Sie als Verkäufer:
                </p>
              </div>
            </div>
            <div className="ml-7 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Bei Beauftragung Kaufvertragsentwurf</span>
                  <span className="font-medium">100 €</span>
                </div>
                <div className="flex justify-between">
                  <span>Nach Notartermin (bei BNL-Eingang)</span>
                  <span className="font-medium">1.900 €</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Gesamt (erfolgsabhängig)</span>
                  <span>2.000 €</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Consents */}
          <div className="space-y-4">
            <p className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Zustimmungen
            </p>
            
            <div className="flex items-start gap-3">
              <Checkbox 
                id="partner-release" 
                checked={partnerReleaseConsent}
                onCheckedChange={(checked) => setPartnerReleaseConsent(checked as boolean)}
              />
              <Label htmlFor="partner-release" className="text-sm leading-relaxed cursor-pointer">
                Ich gebe das Objekt für das Partner-Netzwerk frei und akzeptiere die 
                Provisionsvereinbarung. <span className="text-muted-foreground">(PARTNER_RELEASE)</span>
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox 
                id="system-fee" 
                checked={systemFeeConsent}
                onCheckedChange={(checked) => setSystemFeeConsent(checked as boolean)}
              />
              <Label htmlFor="system-fee" className="text-sm leading-relaxed cursor-pointer">
                Ich akzeptiere die Systemgebühr von 2.000 EUR bei erfolgreichem 
                Verkauf über das Netzwerk. <span className="text-muted-foreground">(SYSTEM_SUCCESS_FEE_2000)</span>
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
            <Users className="h-4 w-4" />
            {isLoading ? 'Aktiviere...' : 'Partner-Freigabe aktivieren'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerReleaseDialog;
