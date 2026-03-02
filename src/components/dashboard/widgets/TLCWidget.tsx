/**
 * TLCWidget — Tenancy Lifecycle Controller Dashboard Widget
 * 
 * Shows open tasks, deadlines, and events with traffic-light urgency indicators.
 * Data source: tenancy_tasks + tenancy_lifecycle_events + tenancy_deadlines
 */

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  Home,
  CalendarClock
} from 'lucide-react';
import { useLeaseLifecycle } from '@/hooks/useLeaseLifecycle';
import { useTenancyDeadlines } from '@/hooks/useTenancyDeadlines';
import { cn } from '@/lib/utils';
import { differenceInDays } from 'date-fns';

/** Traffic light color based on urgency */
function urgencyColor(urgentCount: number, highCount: number) {
  if (urgentCount > 0) return 'text-destructive';
  if (highCount > 0) return 'text-amber-500';
  return 'text-emerald-500';
}

function urgencyBg(urgentCount: number, highCount: number) {
  if (urgentCount > 0) return 'bg-destructive/10';
  if (highCount > 0) return 'bg-amber-500/10';
  return 'bg-emerald-500/10';
}

export function TLCWidget() {
  const { tasks, events, loading: tasksLoading } = useLeaseLifecycle();
  const { deadlines, isLoading: deadlinesLoading } = useTenancyDeadlines();

  const isLoading = tasksLoading || deadlinesLoading;

  const stats = useMemo(() => {
    const openTasks = tasks.filter(t => t.status === 'open' || t.status === 'in_progress');
    const urgentTasks = openTasks.filter(t => t.priority === 'urgent');
    const highTasks = openTasks.filter(t => t.priority === 'high');

    // Count by category
    const byCategory: Record<string, number> = {};
    for (const t of openTasks) {
      const cat = t.category || 'other';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }

    // Deadlines
    const today = new Date();
    const pendingDeadlines = (deadlines || []).filter((d: any) => d.status === 'pending');
    const overdueDeadlines = pendingDeadlines.filter((d: any) => differenceInDays(new Date(d.due_date), today) < 0);
    const urgentDeadlines = pendingDeadlines.filter((d: any) => {
      const days = differenceInDays(new Date(d.due_date), today);
      return days >= 0 && days <= 7;
    });

    // Recent events (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentEvents = events.filter(e => new Date(e.created_at) >= oneWeekAgo);
    const criticalEvents = recentEvents.filter(e => e.severity === 'critical');

    // Total action items = open tasks + overdue deadlines
    const totalActionItems = openTasks.length + overdueDeadlines.length;
    const totalUrgent = urgentTasks.length + overdueDeadlines.length;
    const totalHigh = highTasks.length + urgentDeadlines.length;

    return {
      total: totalActionItems,
      urgent: totalUrgent,
      high: totalHigh,
      openTasks: openTasks.length,
      pendingDeadlines: pendingDeadlines.length,
      overdueDeadlines: overdueDeadlines.length,
      byCategory,
      recentEvents: recentEvents.length,
      criticalEvents: criticalEvents.length,
    };
  }, [tasks, events, deadlines]);

  if (isLoading) {
    return (
      <Card className="relative aspect-square flex items-center justify-center bg-card/80 backdrop-blur-sm border-border/50">
        <CardContent className="flex flex-col items-center gap-2 text-muted-foreground">
          <Shield className="h-8 w-8 animate-pulse opacity-40" />
          <span className="text-xs">TLC lädt…</span>
        </CardContent>
      </Card>
    );
  }

  const StatusIcon = stats.urgent > 0 ? AlertTriangle : stats.high > 0 ? Clock : CheckCircle2;
  const statusLabel = stats.urgent > 0 
    ? `${stats.urgent} dringend` 
    : stats.high > 0 
      ? `${stats.high} wichtig` 
      : 'Alles im Griff';

  return (
    <Card className="relative aspect-square overflow-hidden bg-card/80 backdrop-blur-sm border-border/50 group hover:border-primary/30 transition-colors">
      <CardContent className="p-4 h-full flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('p-1.5 rounded-lg', urgencyBg(stats.urgent, stats.high))}>
              <Home className={cn('h-4 w-4', urgencyColor(stats.urgent, stats.high))} />
            </div>
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
              Mietverwaltung
            </span>
          </div>
          {stats.criticalEvents > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              {stats.criticalEvents}
            </Badge>
          )}
        </div>

        {/* Center: Big number */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className={cn(
            'text-4xl font-bold tabular-nums',
            urgencyColor(stats.urgent, stats.high)
          )}>
            {stats.total}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            offene Aktionen
          </span>
        </div>

        {/* Footer: Status + metrics */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <StatusIcon className={cn('h-3.5 w-3.5', urgencyColor(stats.urgent, stats.high))} />
            <span className={cn('text-xs font-medium', urgencyColor(stats.urgent, stats.high))}>
              {statusLabel}
            </span>
          </div>

          {/* Metrics row */}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            {stats.openTasks > 0 && (
              <span>{stats.openTasks} Aufgaben</span>
            )}
            {stats.pendingDeadlines > 0 && (
              <span className="flex items-center gap-0.5">
                <CalendarClock className="h-3 w-3" />
                {stats.pendingDeadlines} Fristen
              </span>
            )}
            {stats.overdueDeadlines > 0 && (
              <span className="text-destructive font-medium">
                {stats.overdueDeadlines} überfällig
              </span>
            )}
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-1">
            {Object.entries(stats.byCategory).slice(0, 3).map(([cat, count]) => (
              <span
                key={cat}
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                {cat === 'payment' ? 'Zahlung' : 
                 cat === 'rent_increase' ? 'Erhöhung' : 
                 cat === 'maintenance' ? 'Wartung' :
                 cat === 'deposit' ? 'Kaution' :
                 cat === 'move_in' ? 'Einzug' :
                 cat === 'move_out' ? 'Auszug' :
                 cat === 'meter_reading' ? 'Zähler' : cat} ({count})
              </span>
            ))}
          </div>

          {/* Events indicator */}
          {stats.recentEvents > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              {stats.recentEvents} Events diese Woche
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
