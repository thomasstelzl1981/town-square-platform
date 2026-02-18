import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Users } from 'lucide-react';
import { TermsGatePanel } from '@/components/shared/TermsGatePanel';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrencyWithCents } from '@/lib/formatters';

interface PartnerReleaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingTitle: string;
  askingPrice: number;
  listingId?: string;
  tenantId?: string;
  ownerUserId?: string;
  onConfirm: (commissionRate: number) => Promise<void>;
  isLoading?: boolean;
}

export const PartnerReleaseDialog = ({
  open,
  onOpenChange,
  listingTitle,
  askingPrice,
  listingId,
  tenantId,
  ownerUserId,
  onConfirm,
  isLoading
}: PartnerReleaseDialogProps) => {
  const { user, profile } = useAuth();
  const [commissionRate, setCommissionRate] = useState([7]);

  const grossCommission = askingPrice * (commissionRate[0] / 100);
  const ownerName = profile?.display_name || user?.email || 'Eigentümer';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

        <div className="space-y-6 py-2">
          {/* Object Info */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">{listingTitle}</p>
            <p className="text-sm text-muted-foreground">
              Kaufpreis: {formatCurrencyWithCents(askingPrice)}
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
              Ca. {formatCurrencyWithCents(grossCommission)} bei erfolgreichem Verkauf (wird vom Käufer gezahlt)
            </p>
          </div>

          <Separator />

          {/* TermsGatePanel replaces old checkboxes + fee display */}
          <TermsGatePanel
            templateCode="PARTNER_RELEASE_V1"
            templateVariables={{
              owner_name: ownerName,
              listing_title: listingTitle,
              asking_price: askingPrice.toLocaleString('de-DE'),
              commission_rate: `${commissionRate[0]}`,
              listing_id: listingId || '',
            }}
            referenceId={listingId || ''}
            referenceType="listing"
            liableUserId={ownerUserId || user?.id || ''}
            liableRole="owner"
            grossCommission={grossCommission}
            grossCommissionPct={commissionRate[0]}
            commissionType="sales"
            tenantId={tenantId || ''}
            onAccept={async () => {
              await onConfirm(commissionRate[0]);
            }}
            onCancel={() => onOpenChange(false)}
            isPending={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerReleaseDialog;
