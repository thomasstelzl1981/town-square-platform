/**
 * TLC Tasks Section — Open tasks/tickets for a lease
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';
import { ListTodo, ChevronDown, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { TenancyTask } from '@/hooks/useLeaseLifecycle';
import type { TenancyTaskStatus } from '@/engines/tenancyLifecycle/spec';

interface Props {
  tasks: TenancyTask[];
  onUpdateStatus?: (taskId: string, status: TenancyTaskStatus) => void;
}

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-500/10 text-red-500 border-red-500/20',
  high: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  medium: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  low: 'bg-muted text-muted-foreground border-border',
};

const categoryLabels: Record<string, string> = {
  payment: 'Zahlung',
  rent_increase: 'Mieterhöhung',
  maintenance: 'Wartung',
  deposit: 'Kaution',
  move_in: 'Einzug',
  move_out: 'Auszug',
  meter_reading: 'Zähler',
  contract: 'Vertrag',
  communication: 'Kommunikation',
  insurance: 'Versicherung',
};

export function TLCTasksSection({ tasks, onUpdateStatus }: Props) {
  const [open, setOpen] = useState(false);
  const openTasks = tasks.filter(t => t.status === 'open' || t.status === 'in_progress');

  if (tasks.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-8 text-xs">
          <span className="flex items-center gap-2">
            <ListTodo className="h-3.5 w-3.5" />
            Aufgaben ({openTasks.length} offen)
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 mt-1">
        {tasks.slice(0, 20).map(task => (
          <div
            key={task.id}
            className="flex items-start gap-2 p-2 rounded-lg border bg-card text-xs"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium">{task.title}</span>
                <Badge
                  variant="outline"
                  className={`text-[9px] px-1 py-0 ${priorityColors[task.priority] || ''}`}
                >
                  {task.priority === 'urgent' ? 'Dringend' : task.priority === 'high' ? 'Hoch' : task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                </Badge>
                {task.category && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {categoryLabels[task.category] || task.category}
                  </Badge>
                )}
              </div>
              {task.description && (
                <p className="text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
              )}
              <div className="flex items-center gap-2 text-muted-foreground/60 mt-0.5">
                {task.due_date && (
                  <span>Fällig: {format(new Date(task.due_date), 'dd.MM.yyyy', { locale: de })}</span>
                )}
                <span>{task.status === 'in_progress' ? '⏳ In Bearbeitung' : task.status === 'resolved' ? '✓ Erledigt' : ''}</span>
              </div>
            </div>
            {(task.status === 'open' || task.status === 'in_progress') && onUpdateStatus && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 shrink-0"
                onClick={() => onUpdateStatus(task.id, 'resolved')}
              >
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              </Button>
            )}
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
