import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2 } from 'lucide-react';
import type { PhoneAssistantConfig } from '@/hooks/usePhoneAssistant';

interface Props {
  config: PhoneAssistantConfig;
  onUpdate: (u: Partial<PhoneAssistantConfig>) => void;
}

const RULE_CHECKS = [
  { key: 'ask_clarify_once', label: 'Einmal nachfragen, wenn unverständlich' },
  { key: 'collect_name', label: 'Name erfassen' },
  { key: 'confirm_callback_number', label: 'Rückrufnummer bestätigen' },
  { key: 'collect_reason', label: 'Grund des Anrufs erfassen' },
  { key: 'collect_urgency', label: 'Dringlichkeit abfragen' },
  { key: 'collect_preferred_times', label: 'Wunschzeiten abfragen' },
] as const;

export function RulesCard({ config, onUpdate }: Props) {
  const rules = config.rules;

  const toggleRule = (key: string, val: boolean) => {
    onUpdate({ rules: { ...rules, [key]: val } } as any);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings2 className="h-4 w-4 text-primary" />
          Reaktionslogik
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {RULE_CHECKS.map(r => (
            <div key={r.key} className="flex items-center gap-2">
              <Checkbox
                checked={rules[r.key as keyof typeof rules] as boolean}
                onCheckedChange={v => toggleRule(r.key, !!v)}
              />
              <label className="text-sm">{r.label}</label>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Max. Gesprächsdauer</label>
          <Select
            value={String(rules.max_call_seconds)}
            onValueChange={v => onUpdate({ rules: { ...rules, max_call_seconds: Number(v) } } as any)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="60">60 Sekunden</SelectItem>
              <SelectItem value="120">120 Sekunden</SelectItem>
              <SelectItem value="180">180 Sekunden</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
