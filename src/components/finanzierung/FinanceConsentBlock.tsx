/**
 * FinanceConsentBlock — Formaler Einreichungs-/Consent-Block
 * Wird vor der Fallanlage (GenerateCaseCard) angezeigt.
 */
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ShieldCheck } from 'lucide-react';

interface Props {
  consentData: boolean;
  consentCommission: boolean;
  consentDsgvo: boolean;
  onConsentDataChange: (v: boolean) => void;
  onConsentCommissionChange: (v: boolean) => void;
  onConsentDsgvoChange: (v: boolean) => void;
}

export function FinanceConsentBlock({
  consentData, consentCommission, consentDsgvo,
  onConsentDataChange, onConsentCommissionChange, onConsentDsgvoChange,
}: Props) {
  return (
    <Card className="glass-card border-primary/20">
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Einreichung & Einwilligung</h3>
        </div>
        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="consent-data"
              checked={consentData}
              onCheckedChange={(v) => onConsentDataChange(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="consent-data" className="text-xs leading-relaxed cursor-pointer">
              Ich bestätige, dass alle eingegebenen Daten korrekt und vollständig sind.
            </Label>
          </div>
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="consent-commission"
              checked={consentCommission}
              onCheckedChange={(v) => onConsentCommissionChange(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="consent-commission" className="text-xs leading-relaxed cursor-pointer">
              Ich beauftrage die Weiterleitung meiner Finanzierungsanfrage an geeignete Bankpartner gemäß § 34i GewO.
            </Label>
          </div>
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="consent-dsgvo"
              checked={consentDsgvo}
              onCheckedChange={(v) => onConsentDsgvoChange(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="consent-dsgvo" className="text-xs leading-relaxed cursor-pointer">
              Ich stimme der Verarbeitung meiner personenbezogenen Daten gemäß DSGVO zu.
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
