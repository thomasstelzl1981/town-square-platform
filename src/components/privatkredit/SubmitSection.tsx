/**
 * SubmitSection — Final consents + submit button
 * Redesigned: glass-card wrapper, manifest typography
 */
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';

interface SubmitSectionProps {
  disabled?: boolean;
  consentDataCorrect: boolean;
  consentCreditCheck: boolean;
  onConsentDataCorrect: (v: boolean) => void;
  onConsentCreditCheck: (v: boolean) => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
  onSubmit: () => void;
}

export function SubmitSection({
  disabled, consentDataCorrect, consentCreditCheck,
  onConsentDataCorrect, onConsentCreditCheck,
  canSubmit, isSubmitting, isSubmitted, onSubmit,
}: SubmitSectionProps) {
  if (isSubmitted) {
    return (
      <Card className={cn(DESIGN.CARD.BASE, 'border-emerald-500/30 bg-emerald-500/5')}>
        <CardContent className="p-6 text-center space-y-3">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
          <h2 className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Eingereicht — wird geprüft</h2>
          <p className={DESIGN.TYPOGRAPHY.MUTED}>
            Ihr Antrag wurde erfolgreich an Europace übermittelt. Sie erhalten eine Benachrichtigung
            sobald eine Rückmeldung vorliegt.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(DESIGN.CARD.BASE, disabled && 'opacity-50 pointer-events-none')}>
      <div className={DESIGN.CARD.SECTION_HEADER}>
        <h2 className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Bestätigen & Abschicken</h2>
      </div>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="consent-data"
              checked={consentDataCorrect}
              onCheckedChange={v => onConsentDataCorrect(!!v)}
            />
            <Label htmlFor="consent-data" className="text-sm cursor-pointer leading-relaxed">
              Ich bestätige die Richtigkeit meiner Angaben
            </Label>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox
              id="consent-credit"
              checked={consentCreditCheck}
              onCheckedChange={v => onConsentCreditCheck(!!v)}
            />
            <Label htmlFor="consent-credit" className="text-sm cursor-pointer leading-relaxed">
              Ich willige in die Bonitätsprüfung und Datenübermittlung an die ausgewählte Bank ein
            </Label>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full sm:w-auto gap-2"
          disabled={!canSubmit || isSubmitting}
          onClick={onSubmit}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          An Europace übermitteln
        </Button>
      </CardContent>
    </Card>
  );
}
