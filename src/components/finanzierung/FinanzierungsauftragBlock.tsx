/**
 * MOD-07: Finanzierungsauftrag — Inline consent block for submitting a finance request.
 * Analog to SalesMandateDialog but rendered inline at the bottom of the AnfrageTab.
 * 
 * Shows:
 * - Summary of object + financing
 * - 3 mandatory consent checkboxes
 * - Submit button → useSubmitFinanceRequest
 * 
 * Only visible when request status is 'draft' or 'collecting'.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FileCheck, Building2, Loader2, ShieldCheck } from 'lucide-react';
import { useSubmitFinanceRequest } from '@/hooks/useSubmitFinanceRequest';

interface FinanzierungsauftragBlockProps {
  requestId: string;
  objectAddress?: string | null;
  purchasePrice?: number | null;
  loanAmount?: number | null;
  status: string;
}

export function FinanzierungsauftragBlock({
  requestId,
  objectAddress,
  purchasePrice,
  loanAmount,
  status,
}: FinanzierungsauftragBlockProps) {
  const navigate = useNavigate();
  const submitMutation = useSubmitFinanceRequest();

  const [dataConsent, setDataConsent] = useState(false);
  const [mandateConsent, setMandateConsent] = useState(false);
  const [sharingConsent, setSharingConsent] = useState(false);

  // Only show for submittable statuses
  if (status !== 'draft' && status !== 'collecting') return null;

  const canSubmit = dataConsent && mandateConsent && sharingConsent && !submitMutation.isPending;

  const formatCurrency = (val: number | null | undefined) =>
    val
      ? new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR',
          maximumFractionDigits: 0,
        }).format(val)
      : '—';

  const handleSubmit = () => {
    submitMutation.mutate(
      { requestId, onSuccess: () => navigate('/portal/finanzierung/status') },
    );
  };

  return (
    <Card className="border-primary/30 bg-primary/[0.02]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Finanzierungsauftrag
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-medium">Zusammenfassung</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Objekt</p>
              <p className="font-medium">{objectAddress || 'Noch nicht angegeben'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Kaufpreis</p>
              <p className="font-medium">{formatCurrency(purchasePrice)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Kreditbedarf</p>
              <p className="font-medium">{formatCurrency(loanAmount)}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Consents */}
        <div className="space-y-4">
          <p className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Vereinbarung
          </p>

          <div className="flex items-start gap-3">
            <Checkbox
              id="fin-data-consent"
              checked={dataConsent}
              onCheckedChange={(c) => setDataConsent(c as boolean)}
            />
            <Label htmlFor="fin-data-consent" className="text-sm leading-relaxed cursor-pointer">
              Ich bestätige die Richtigkeit aller Angaben in meiner Selbstauskunft und den
              Objektdaten.
            </Label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="fin-mandate-consent"
              checked={mandateConsent}
              onCheckedChange={(c) => setMandateConsent(c as boolean)}
            />
            <Label htmlFor="fin-mandate-consent" className="text-sm leading-relaxed cursor-pointer">
              Ich beauftrage die System of a Town GmbH mit der Einholung von
              Finanzierungsangeboten und der Vermittlung einer Finanzierung.
            </Label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="fin-sharing-consent"
              checked={sharingConsent}
              onCheckedChange={(c) => setSharingConsent(c as boolean)}
            />
            <Label htmlFor="fin-sharing-consent" className="text-sm leading-relaxed cursor-pointer">
              Ich bin einverstanden, dass meine Daten und Unterlagen an Banken und bei uns unter
              Vertrag stehende Finanzierungsmanager weitergegeben werden.
            </Label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            size="lg"
            className="gap-2"
          >
            {submitMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileCheck className="h-4 w-4" />
            )}
            {submitMutation.isPending ? 'Wird eingereicht...' : 'Finanzierungsauftrag erteilen'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
