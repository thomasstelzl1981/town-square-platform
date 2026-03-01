import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Bot, Info } from 'lucide-react';
import type { PhoneAssistantConfig } from '@/hooks/usePhoneAssistant';

interface Props {
  brandLabel: string;
  config: PhoneAssistantConfig;
  onUpdate: (u: Partial<PhoneAssistantConfig>) => void;
}

export function ArmstrongIdentityCard({ brandLabel, config, onUpdate }: Props) {
  return (
    <Card className="glass-card border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-base">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span>Armstrong · {brandLabel}</span>
              <Badge variant="outline" className="text-[10px]">KI-Persona</Badge>
            </div>
            <p className="text-xs font-normal text-muted-foreground mt-0.5">
              Armstrong meldet sich immer als Assistent von {brandLabel}
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Begrüßung (first_message)</label>
          <Textarea
            value={config.first_message ?? ''}
            onChange={e => onUpdate({ first_message: e.target.value })}
            placeholder={`Guten Tag, Sie sprechen mit Armstrong von ${brandLabel}. Wie kann ich Ihnen helfen?`}
            rows={3}
            className="text-sm"
          />
        </div>

        <div className="rounded-md border border-primary/20 bg-primary/5 p-3 flex gap-2 text-xs text-muted-foreground">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>
            Der vollständige Persona-Prompt wird automatisch aus der Wissensbasis (unten) zusammengesetzt.
            Armstrong kennt die Firma, ihre Leistungen und Kontaktdaten — alles gesteuert über die Knowledge Items.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
