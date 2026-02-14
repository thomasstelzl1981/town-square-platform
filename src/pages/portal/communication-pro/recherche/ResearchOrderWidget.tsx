/**
 * ResearchOrderWidget — Widget-Card für ein Research Order im WidgetGrid
 */
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Globe, Database, Cpu, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResearchOrder } from '@/hooks/useResearchOrders';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Entwurf', variant: 'outline' },
  queued: { label: 'Warteschlange', variant: 'secondary' },
  running: { label: 'Läuft…', variant: 'default' },
  needs_review: { label: 'Prüfung', variant: 'secondary' },
  done: { label: 'Fertig', variant: 'default' },
  failed: { label: 'Fehler', variant: 'destructive' },
  cancelled: { label: 'Abgebrochen', variant: 'outline' },
};

const PROVIDER_ICONS: Record<string, typeof Globe> = {
  firecrawl: Globe,
  epify: Database,
  apollo: Search,
};

interface Props {
  order: ResearchOrder;
  isActive: boolean;
  onClick: () => void;
}

export function ResearchOrderWidget({ order, isActive, onClick }: Props) {
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.draft;
  const providers = order.provider_plan_json || {};

  return (
    <Card
      className={cn(
        'glass-card p-4 cursor-pointer transition-all hover:ring-2 hover:ring-primary/40',
        isActive && 'ring-2 ring-primary shadow-lg'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-foreground truncate flex-1 mr-2">
          {order.title || 'Ohne Titel'}
        </h4>
        <Badge variant={status.variant} className="text-xs shrink-0">
          {status.label}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
        {order.intent_text || 'Kein Suchintent definiert'}
      </p>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          {Object.entries(PROVIDER_ICONS).map(([key, Icon]) => (
            providers[key] !== false && (
              <Icon key={key} className="h-3 w-3 text-muted-foreground/60" />
            )
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span>max {order.max_results}</span>
          {order.results_count > 0 && (
            <span className="font-medium text-foreground">
              {order.results_count} Treffer
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

interface CreateProps {
  onClick: () => void;
}

export function ResearchOrderCreateWidget({ onClick }: CreateProps) {
  return (
    <Card
      className="glass-card p-4 cursor-pointer transition-all hover:ring-2 hover:ring-primary/40 flex flex-col items-center justify-center min-h-[120px] border-dashed"
      onClick={onClick}
    >
      <Plus className="h-8 w-8 text-muted-foreground mb-2" />
      <span className="text-sm font-medium text-muted-foreground">
        Neuer Rechercheauftrag
      </span>
    </Card>
  );
}
