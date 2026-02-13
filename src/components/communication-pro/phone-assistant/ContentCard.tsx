import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare } from 'lucide-react';
import type { PhoneAssistantConfig } from '@/hooks/usePhoneAssistant';

interface Props {
  config: PhoneAssistantConfig;
  onUpdate: (u: Partial<PhoneAssistantConfig>) => void;
}

export function ContentCard({ config, onUpdate }: Props) {
  const charCount = config.behavior_prompt?.length ?? 0;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4 text-primary" />
          Begrüßung &amp; Verhalten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Erste Begrüßung</label>
          <Input
            value={config.first_message}
            onChange={e => onUpdate({ first_message: e.target.value })}
            placeholder="Hallo! Du sprichst mit dem Assistenten von {Name}. Wie kann ich helfen?"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Verhalten (Kurz-Prompt)</label>
          <Textarea
            value={config.behavior_prompt}
            onChange={e => {
              if (e.target.value.length <= 2000) onUpdate({ behavior_prompt: e.target.value });
            }}
            placeholder="Ziel: Anliegen erfassen, Rückrufgrund + Dringlichkeit + Kontaktdaten. Kurz und professionell."
            rows={4}
          />
          <p className="text-xs text-muted-foreground text-right">{charCount} / 2000</p>
        </div>
      </CardContent>
    </Card>
  );
}
