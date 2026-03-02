/**
 * TLC Lifecycle Events Section — Chronologie/Audit-Trail for a lease
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';
import { Activity, ChevronDown, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { LifecycleEvent } from '@/hooks/useLeaseLifecycle';

interface Props {
  events: LifecycleEvent[];
  onResolve?: (eventId: string) => void;
}

const severityConfig: Record<string, { icon: typeof Info; color: string; label: string }> = {
  info: { icon: Info, color: 'text-blue-500', label: 'Info' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', label: 'Warnung' },
  critical: { icon: XCircle, color: 'text-red-500', label: 'Kritisch' },
  action_required: { icon: AlertTriangle, color: 'text-orange-500', label: 'Aktion nötig' },
};

export function TLCEventsSection({ events, onResolve }: Props) {
  const [open, setOpen] = useState(false);
  const unresolved = events.filter(e => !e.resolved_at);

  if (events.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-8 text-xs">
          <span className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5" />
            Lifecycle-Events ({events.length})
            {unresolved.length > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 ml-1">
                {unresolved.length} offen
              </Badge>
            )}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 mt-1">
        {events.slice(0, 20).map(event => {
          const config = severityConfig[event.severity] || severityConfig.info;
          const Icon = config.icon;
          return (
            <div
              key={event.id}
              className="flex items-start gap-2 p-2 rounded-lg border bg-card text-xs"
            >
              <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${config.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium truncate">{event.title}</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">
                    {event.event_type.replace(/_/g, ' ')}
                  </Badge>
                </div>
                {event.description && (
                  <p className="text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
                )}
                <p className="text-muted-foreground/60 mt-0.5">
                  {format(new Date(event.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                  {event.resolved_at && ' • ✓ Erledigt'}
                </p>
              </div>
              {!event.resolved_at && onResolve && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0"
                  onClick={() => onResolve(event.id)}
                >
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                </Button>
              )}
            </div>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
