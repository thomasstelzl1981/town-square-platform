/**
 * ResearchOrderWidget — Widget-Card für ein Research Order im WidgetGrid
 */
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getActiveWidgetGlow } from '@/config/designManifest';
import type { ResearchOrder } from '@/hooks/useResearchOrders';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
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
  const [open, setOpen] = useState(false);

  return (
    <Card
      className={cn(
        'glass-card p-4 cursor-pointer transition-all hover:ring-2 hover:ring-primary/40 relative group h-full flex flex-col',
        getActiveWidgetGlow('violet'),
        isActive && 'ring-2 ring-primary shadow-lg'
      )}
      onClick={onClick}
    >
      {/* Delete button */}
      {onDelete && (
        <>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setOpen(true);
            }}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-destructive/50"
            aria-label={`${order.title || 'Auftrag'} löschen`}
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <AlertDialog open={open} onOpenChange={(v) => { if (!v) setOpen(false); }}>
            <AlertDialogContent onClick={e => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Auftrag löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Der Rechercheauftrag „{order.title || 'Ohne Titel'}" wird unwiderruflich gelöscht.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-2">
                <button
                  type="button"
                  className="mt-2 sm:mt-0 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  onClick={() => setOpen(false)}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2"
                  onClick={() => {
                    onDelete(order.id);
                    setOpen(false);
                  }}
                >
                  Löschen
                </button>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-foreground truncate flex-1 mr-2">
          {order.title || 'Ohne Titel'}
        </h4>
        <Badge variant={status.variant} className="text-xs shrink-0">
          {status.label}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
        {order.intent_text || 'Noch nicht konfiguriert'}
      </p>

      <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
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
      className="glass-card p-4 cursor-pointer transition-all hover:ring-2 hover:ring-primary/40 flex flex-col items-center justify-center h-full border-dashed"
      onClick={onClick}
    >
      <Plus className="h-8 w-8 text-muted-foreground mb-2" />
      <span className="text-sm font-medium text-muted-foreground">
        Neuer Rechercheauftrag
      </span>
    </Card>
  );
}
