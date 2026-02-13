/**
 * Employment Gate — Blocks self-employed users from the online loan process
 */
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertTriangle, UserCheck } from 'lucide-react';

interface EmploymentGateProps {
  value: string;
  onChange: (v: string) => void;
}

export function EmploymentGate({ value, onChange }: EmploymentGateProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Beschäftigungsstatus</h2>
      <p className="text-sm text-muted-foreground">
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
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-sm">Online-Prozess nicht verfügbar</p>
              <p className="text-sm text-muted-foreground">
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
    </section>
  );
}
