/**
 * LedgerSummary — Aggregierte Stats aus contact_strategy_ledger
 */
import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DESIGN } from '@/config/designManifest';
import { useSchedulerStatus } from '@/hooks/useSchedulerControl';
import { BookOpen, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';

export const LedgerSummary = memo(function LedgerSummary() {
  const { data, isLoading } = useSchedulerStatus();
  const ledger = data?.ledger;

  if (isLoading) {
    return (
      <Card className={DESIGN.CARD.SECTION}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" /> Lade Ledger-Status...
        </div>
      </Card>
    );
  }

  const total = ledger?.total || 0;
  const completed = ledger?.completed || 0;
  const inProgress = ledger?.inProgress || 0;
  const pending = ledger?.pending || 0;

  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const inProgressPct = total > 0 ? Math.round((inProgress / total) * 100) : 0;
  const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0;

  return (
    <Card className={DESIGN.CARD.SECTION}>
      <div className="flex items-center gap-2 mb-4">
        <div className={DESIGN.HEADER.WIDGET_ICON_BOX}>
          <BookOpen className="h-4 w-4 text-primary" />
        </div>
        <h3 className={DESIGN.TYPOGRAPHY.SECTION_TITLE}>Strategy Ledger</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="h-3 w-3" /> Gesamt
          </div>
          <p className="text-2xl font-bold">{total.toLocaleString('de-DE')}</p>
        </div>

        {/* Completed */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-green-600" /> Abgeschlossen
          </div>
          <p className="text-2xl font-bold text-green-600">{completed.toLocaleString('de-DE')}</p>
          <div className="flex items-center gap-2">
            <Progress value={completedPct} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground">{completedPct}%</span>
          </div>
        </div>

        {/* In Progress */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 text-amber-600" /> In Bearbeitung
          </div>
          <p className="text-2xl font-bold text-amber-600">{inProgress.toLocaleString('de-DE')}</p>
          <div className="flex items-center gap-2">
            <Progress value={inProgressPct} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground">{inProgressPct}%</span>
          </div>
        </div>

        {/* Pending */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" /> Nicht gestartet
          </div>
          <p className="text-2xl font-bold">{pending.toLocaleString('de-DE')}</p>
          <div className="flex items-center gap-2">
            <Progress value={pendingPct} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground">{pendingPct}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
});
