import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText } from 'lucide-react';
import type { PhoneAssistantConfig } from '@/hooks/usePhoneAssistant';

interface Props {
  config: PhoneAssistantConfig;
  onUpdate: (u: Partial<PhoneAssistantConfig>) => void;
}

export function DocumentationCard({ config, onUpdate }: Props) {
  const doc = config.documentation;

  const setDoc = (key: string, val: any) => {
    onUpdate({ documentation: { ...doc, [key]: val } } as any);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-primary" />
          Dokumentation &amp; Benachrichtigung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">E-Mail Benachrichtigung</span>
          <Switch checked={doc.email_enabled} onCheckedChange={v => setDoc('email_enabled', v)} />
        </div>
        {doc.email_enabled && (
          <Input
            type="email"
            value={doc.email_target}
            onChange={e => setDoc('email_target', e.target.value)}
            placeholder="ihre@email.de"
          />
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm">Portal-Eintrag erstellen</span>
          <Switch checked={doc.portal_log_enabled} onCheckedChange={v => setDoc('portal_log_enabled', v)} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Automatische Zusammenfassung</span>
          <Switch checked={doc.auto_summary} onCheckedChange={v => setDoc('auto_summary', v)} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Aufgaben extrahieren</span>
          <Switch checked={doc.extract_tasks} onCheckedChange={v => setDoc('extract_tasks', v)} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Aufbewahrung</label>
          <Select
            value={String(doc.retention_days)}
            onValueChange={v => setDoc('retention_days', Number(v))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 Tage</SelectItem>
              <SelectItem value="90">90 Tage</SelectItem>
              <SelectItem value="365">365 Tage</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
