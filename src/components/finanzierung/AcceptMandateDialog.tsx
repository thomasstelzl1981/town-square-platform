/**
 * MOD-11: Accept Mandate Dialog
 * Requires commission confirmation before accepting a mandate
 */

import * as React from 'react';
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
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';

interface AcceptMandateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanAmount: number | null;
  applicantName: string;
  onAccept: () => Promise<void>;
  isPending: boolean;
}

export function AcceptMandateDialog({
  open,
  onOpenChange,
  loanAmount,
  applicantName,
  onAccept,
  isPending,
}: AcceptMandateDialogProps) {
  const [commissionConfirmed, setCommissionConfirmed] = React.useState(false);

  const commissionAmount = loanAmount ? loanAmount * 0.005 : 0;
  const formattedLoan = loanAmount
    ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(loanAmount)
    : '–';
  const formattedCommission = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(commissionAmount);

  const handleAccept = async () => {
    if (!commissionConfirmed) return;
    await onAccept();
    setCommissionConfirmed(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mandat annehmen</DialogTitle>
          <DialogDescription>
            Bitte bestätigen Sie die Provisionsvereinbarung, um das Mandat anzunehmen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mandate Summary */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Antragsteller</span>
                <span className="font-medium">{applicantName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Darlehensbetrag</span>
                <span className="font-medium">{formattedLoan}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2 mt-2">
                <span className="text-muted-foreground">Provision (0,5%)</span>
                <span className="font-semibold text-primary">{formattedCommission}</span>
              </div>
            </CardContent>
          </Card>

          {/* Commission Confirmation */}
          <div className="flex items-start gap-3 p-4 border rounded-lg bg-amber-50 border-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-amber-800 font-medium">
                Provisionsvereinbarung
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Mit der Annahme dieses Mandats stimmen Sie einer Provision von 0,5% des 
                Darlehensbetrags ({formattedCommission}) zu, die bei erfolgreicher Finanzierung fällig wird.
              </p>
            </div>
          </div>

          {/* Checkbox */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="commission-confirm"
              checked={commissionConfirmed}
              onCheckedChange={(checked) => setCommissionConfirmed(checked === true)}
            />
            <Label htmlFor="commission-confirm" className="text-sm cursor-pointer">
              Ich bestätige die Provisionsvereinbarung von 0,5% und möchte das Mandat annehmen.
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!commissionConfirmed || isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Mandat annehmen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
