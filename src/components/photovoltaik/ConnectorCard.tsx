import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plug, ExternalLink } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface ConnectorCardProps {
  name: string;
  icon: LucideIcon;
  status: 'not_connected' | 'prepared' | 'connected' | 'error';
  description: string;
  fields?: { label: string; value: string; disabled?: boolean }[];
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  not_connected: { label: 'Nicht verbunden', variant: 'outline' },
  prepared: { label: 'Vorbereitet', variant: 'secondary' },
  connected: { label: 'Verbunden', variant: 'default' },
  error: { label: 'Fehler', variant: 'destructive' },
};

export function ConnectorCard({ name, icon: Icon, status, description, fields }: ConnectorCardProps) {
  const cfg = statusConfig[status] || statusConfig.not_connected;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">{name}</CardTitle>
          </div>
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        {fields?.map((f) => (
          <div key={f.label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{f.label}</span>
            <span className={f.disabled ? 'text-muted-foreground/50' : ''}>{f.value}</span>
          </div>
        ))}
        <Button variant="outline" size="sm" disabled className="w-full gap-2">
          <Plug className="h-4 w-4" />
          Verbinden (coming soon)
        </Button>
      </CardContent>
    </Card>
  );
}
