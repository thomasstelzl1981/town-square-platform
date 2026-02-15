/**
 * ResearchOrderWidget — Widget-Card für ein Research Order im WidgetGrid
 */
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResearchOrder } from '@/hooks/useResearchOrders';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Entwurf', variant: 'outline' },
  queued: { label: 'Warteschlange', variant: 'secondary' },
  running: { label: 'Läuft…', variant: 'default' },
  needs_review: { label: 'Prüfung', variant: 'secondary' },
  done: { label: 'Fertig', variant: 'default' },
  failed: { label: 'Fehler', variant: 'destructive' },
  cancelled: { label: 'Abgebrochen', variant: 'outline' },
};

interface Props {
  order: ResearchOrder;
  isActive: boolean;
  onClick: () => void;
  onDelete?: (id: string) => void;
}

export function ResearchOrderWidget({ order, isActive, onClick, onDelete }: Props) {
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.draft;

  return (
    <Card
      className={cn(
        'glass-card p-4 cursor-pointer transition-all hover:ring-2 hover:ring-primary/40 relative group',
        isActive && 'ring-2 ring-primary shadow-lg'
      )}
      onClick={onClick}
    >
      {/* Delete button */}
      {onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              onClick={e => e.stopPropagation()}
              className="absolute top-2 right-2 h-6 w-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 z-10"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={e => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Auftrag löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Der Rechercheauftrag „{order.title || 'Ohne Titel'}" wird unwiderruflich gelöscht.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(order.id)}>Löschen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-foreground truncate flex-1 mr-2">
          {order.title || 'Ohne Titel'}
        </h4>
        <Badge variant={status.variant} className="text-xs shrink-0">
          {status.label}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
        {order.intent_text || 'Noch nicht konfiguriert'}
      </p>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>max {order.max_results}</span>
        {order.results_count > 0 && (
          <span className="font-medium text-foreground">
            {order.results_count} Treffer
          </span>
        )}
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
