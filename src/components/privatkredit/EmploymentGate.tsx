/**
 * Employment Gate — Blocks self-employed users from the online loan process
 * Wrapped in glass-card with manifest typography.
 */
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, UserCheck } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';

interface EmploymentGateProps {
  value: string;
  onChange: (v: string) => void;
}

export function EmploymentGate({ value, onChange }: EmploymentGateProps) {
  return (
    <Card className={DESIGN.CARD.BASE}>
      <div className={DESIGN.CARD.SECTION_HEADER}>
        <h2 className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Beschäftigungsstatus</h2>
      </div>
      <CardContent className="p-4 space-y-4">
        <p className={DESIGN.TYPOGRAPHY.MUTED}>
          Sind Sie angestellt oder selbständig?
        </p>

        <RadioGroup value={value} onValueChange={onChange} className="flex gap-6">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="employed" id="employed" />
            <Label htmlFor="employed" className="cursor-pointer">Angestellt</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="self_employed" id="self_employed" />
            <Label htmlFor="self_employed" className="cursor-pointer">Selbständig</Label>
          </div>
        </RadioGroup>

        {value === 'self_employed' && (
          <div className={`${DESIGN.INFO_BANNER.BASE} ${DESIGN.INFO_BANNER.WARNING} space-y-3`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium text-sm">Online-Prozess nicht verfügbar</p>
                <p className={DESIGN.TYPOGRAPHY.MUTED}>
                  Für Selbständige ist der Online-Prozess nicht geeignet.
                  Bitte wenden Sie sich an uns – wir verbinden Sie mit einem Spezialisten.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Spezialisten anfordern
            </Button>
          </div>
        )}

        {value === 'employed' && (
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <UserCheck className="h-4 w-4" />
            <span>Online-Antrag verfügbar</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
