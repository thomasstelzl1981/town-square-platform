import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Info, Phone } from 'lucide-react';
import type { PhoneAssistantConfig } from '@/hooks/usePhoneAssistant';

interface Props {
  config: PhoneAssistantConfig;
  onUpdate: (u: Partial<PhoneAssistantConfig>) => void;
}

export function StatusForwardingCard({ config, onUpdate }: Props) {
  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    pending: { label: 'Ausstehend', variant: 'secondary' },
    active: { label: 'Aktiv', variant: 'default' },
    error: { label: 'Fehler', variant: 'destructive' },
  };
  const s = statusMap[config.binding_status] ?? statusMap.pending;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Phone className="h-4 w-4 text-primary" />
          Status &amp; Rufweiterleitung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Assistent aktiv</span>
          <Switch checked={config.is_enabled} onCheckedChange={v => onUpdate({ is_enabled: v })} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Weiterleitungs-Nummer</label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={config.forwarding_number_e164 ?? ''}
              placeholder="Wird nach Provider-Connect vergeben"
              className="flex-1 bg-muted/20"
            />
            <Button variant="outline" size="icon" disabled title="Noch nicht verfügbar">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Badge variant={s.variant} className="mt-1">{s.label}</Badge>
        </div>

        <div className="rounded-md border border-primary/20 bg-primary/5 p-3 flex gap-2 text-xs text-muted-foreground">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>
            Empfehlung: Richten Sie bei Ihrem Mobilfunkanbieter eine Rufumleitung bei Nichtannahme (~30s) und bei Besetzt auf die oben angezeigte Nummer ein.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
