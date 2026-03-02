/**
 * TLC Deadlines Section — Fristen-Management for a lease/property
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarClock, CheckCircle, Bell } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { DESIGN } from '@/config/designManifest';

interface Deadline {
  id: string;
  deadline_type: string;
  title: string;
  description: string | null;
  due_date: string;
  status: string;
  remind_days_before: number | null;
  completed_at: string | null;
}

interface Props {
  deadlines: Deadline[];
  onComplete?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

const typeLabels: Record<string, string> = {
  RENT_INCREASE: 'Mieterhöhung',
  LEASE_END: 'Vertragsende',
  NOTICE_PERIOD: 'Kündigungsfrist',
  DEPOSIT_RETURN: 'Kautionsrückzahlung',
  NK_SETTLEMENT: 'NK-Abrechnung',
  INSPECTION: 'Inspektion',
  INSURANCE_RENEWAL: 'Versicherung',
  MAINTENANCE: 'Wartung',
  CUSTOM: 'Sonstig',
};

export function TLCDeadlinesSection({ deadlines, onComplete, onDismiss }: Props) {
  const pending = deadlines.filter(d => d.status === 'pending');
  const today = new Date();

  if (deadlines.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className={DESIGN.TYPOGRAPHY.LABEL}>
          <CalendarClock className="h-3.5 w-3.5 inline mr-1.5" />
          Fristen ({pending.length} offen)
        </h4>
        {pending.some(d => differenceInDays(new Date(d.due_date), today) <= 7) && (
          <Bell className="h-3 w-3 text-amber-500 animate-pulse" />
        )}
      </div>
      <div className="space-y-1">
        {deadlines.map(deadline => {
          const dueDate = new Date(deadline.due_date);
          const daysLeft = differenceInDays(dueDate, today);
          const isOverdue = daysLeft < 0;
          const isUrgent = daysLeft >= 0 && daysLeft <= 7;

          return (
            <div
              key={deadline.id}
              className="flex items-start gap-2 p-2 rounded-lg border bg-card text-xs"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{deadline.title}</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {typeLabels[deadline.deadline_type] || deadline.deadline_type}
                  </Badge>
                </div>
                {deadline.description && (
                  <p className="text-muted-foreground mt-0.5 line-clamp-1">{deadline.description}</p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={
                    isOverdue ? 'text-red-500 font-medium' :
                    isUrgent ? 'text-amber-500 font-medium' :
                    'text-muted-foreground'
                  }>
                    {format(dueDate, 'dd.MM.yyyy', { locale: de })}
                    {isOverdue ? ` (${Math.abs(daysLeft)} Tage überfällig)` :
                     isUrgent ? ` (${daysLeft} Tage)` : ''}
                  </span>
                  {deadline.status === 'completed' && (
                    <span className="text-emerald-500">✓ Erledigt</span>
                  )}
                </div>
              </div>
              {deadline.status === 'pending' && onComplete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0"
                  onClick={() => onComplete(deadline.id)}
                >
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
