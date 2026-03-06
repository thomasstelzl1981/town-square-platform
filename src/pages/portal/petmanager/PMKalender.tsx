/**
 * PMKalender — Wochen- und Monatskalender für Pet Manager (PLC-basiert)
 */
import { useState, useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMyProvider } from '@/hooks/usePetBookings';
import { useCasesForProvider, type CaseWithComputed } from '@/hooks/usePetServiceCases';
import { PLC_PHASE_LABELS, type PLCPhase } from '@/engines/plc/spec';
import {
  format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks,
  startOfMonth, endOfMonth, addMonths, subMonths,
  isToday, eachDayOfInterval,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { isDemoId } from '@/engines/demoData';

// ─── Phase colors ─────────────────────────────────────────
const PHASE_BG: Record<string, string> = {
  requested: 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300',
  provider_confirmed: 'bg-primary/15 border-primary/30 text-primary',
  deposit_pending: 'bg-blue-500/20 border-blue-500/40 text-blue-700 dark:text-blue-300',
  deposit_paid: 'bg-blue-600/20 border-blue-600/40 text-blue-700 dark:text-blue-300',
  checked_in: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
  closed_completed: 'bg-muted border-border text-muted-foreground',
  closed_cancelled: 'bg-destructive/10 border-destructive/20 text-destructive line-through',
  closed_no_show: 'bg-destructive/10 border-destructive/20 text-destructive',
  disputed: 'bg-red-500/20 border-red-500/40 text-red-700 dark:text-red-300',
};

const PHASE_DOT: Record<string, string> = {
  requested: 'bg-amber-500',
  provider_confirmed: 'bg-primary',
  deposit_pending: 'bg-blue-500',
  deposit_paid: 'bg-blue-600',
  checked_in: 'bg-emerald-500',
  closed_completed: 'bg-muted-foreground',
  closed_cancelled: 'bg-destructive',
  closed_no_show: 'bg-destructive',
  disputed: 'bg-red-500',
};

// ─── Helpers ──────────────────────────────────────────────
function groupByDate(cases: CaseWithComputed[]) {
  const map = new Map<string, CaseWithComputed[]>();
  cases.forEach(c => {
    const key = c.scheduled_start?.slice(0, 10);
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  });
  return map;
}

function capacityColor(count: number, max: number) {
  if (count === 0) return '';
  const ratio = count / max;
  if (ratio >= 1) return 'bg-destructive/15 text-destructive';
  if (ratio >= 0.7) return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
  return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
}

// ─── Case Block (compact) ─────────────────────────────────
function CaseBlock({ c }: { c: CaseWithComputed }) {
  return (
    <div className={cn(
      'rounded px-1.5 py-0.5 text-[10px] leading-tight border truncate',
      PHASE_BG[c.current_phase] || 'bg-muted border-border',
    )}>
      <span className="font-medium">{c.customer_name || c.customer_email || 'Kunde'}</span>
    </div>
  );
}

// ─── WEEK VIEW ────────────────────────────────────────────
function WeekView({ cases, weekStart }: { cases: CaseWithComputed[]; weekStart: Date }) {
  const grouped = useMemo(() => groupByDate(cases), [cases]);
  const days = useMemo(() => eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) }), [weekStart]);

  return (
    <div className="grid grid-cols-7 gap-1 md:gap-2">
      {days.map(day => {
        const key = format(day, 'yyyy-MM-dd');
        const dayCases = grouped.get(key) || [];
        const today = isToday(day);
        return (
          <div key={key} className={cn(
            'min-h-[120px] md:min-h-[160px] rounded-lg border p-1.5 md:p-2 flex flex-col',
            today && 'ring-2 ring-primary/50 bg-primary/5',
            !today && 'bg-card',
          )}>
            <div className="flex items-center justify-between mb-1">
              <span className={cn('text-xs font-medium', today ? 'text-primary' : 'text-muted-foreground')}>
                {format(day, 'EEE', { locale: de })}
              </span>
              <span className={cn('text-xs rounded-full w-5 h-5 flex items-center justify-center', today && 'bg-primary text-primary-foreground font-bold')}>
                {format(day, 'd')}
              </span>
            </div>
            <div className="flex-1 space-y-0.5 overflow-y-auto">
              {dayCases
                .filter(c => !c.current_phase.startsWith('closed_cancelled'))
                .map(c => <CaseBlock key={c.id} c={c} />)}
            </div>
            {dayCases.length > 0 && (
              <div className="mt-1 flex gap-0.5">
                {dayCases.filter(c => !c.current_phase.startsWith('closed_cancelled')).map(c => (
                  <span key={c.id} className={cn('w-1.5 h-1.5 rounded-full', PHASE_DOT[c.current_phase] || 'bg-muted-foreground')} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── MONTH VIEW ───────────────────────────────────────────
function MonthView({ cases, monthStart, maxCapacity }: { cases: CaseWithComputed[]; monthStart: Date; maxCapacity: number }) {
  const grouped = useMemo(() => groupByDate(cases), [cases]);
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allDays = useMemo(() => eachDayOfInterval({ start: calStart, end: calEnd }), [calStart, calEnd]);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {allDays.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const dayCases = (grouped.get(key) || []).filter(c => !c.current_phase.startsWith('closed_cancelled'));
          const count = dayCases.length;
          const inMonth = day.getMonth() === monthStart.getMonth();
          const today = isToday(day);

          return (
            <div key={key} className={cn(
              'aspect-square rounded-md border flex flex-col items-center justify-center p-1 relative',
              !inMonth && 'opacity-30',
              today && 'ring-2 ring-primary/50',
              count > 0 ? capacityColor(count, maxCapacity) : 'bg-card',
            )}>
              <span className={cn('text-xs', today && 'font-bold text-primary')}>{format(day, 'd')}</span>
              {count > 0 && <span className="text-[10px] font-semibold mt-0.5">{count}</span>}
              {count > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayCases.slice(0, 4).map(c => (
                    <span key={c.id} className={cn('w-1 h-1 rounded-full', PHASE_DOT[c.current_phase])} />
                  ))}
                  {count > 4 && <span className="text-[8px] text-muted-foreground">+</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Angefragt</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Bestätigt</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Eingecheckt</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground" /> Abgeschlossen</span>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────
export default function PMKalender() {
  const { data: provider } = useMyProvider();
  const { data: rawCases = [], isLoading } = useCasesForProvider(provider?.id);
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-PET');
  const cases = demoEnabled ? rawCases : rawCases.filter(c => !isDemoId(c.id));
  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const monthStart = startOfMonth(currentDate);
  const maxCapacity = (provider as any)?.max_daily_capacity || 10;

  const nav = (dir: 'prev' | 'next') => {
    if (view === 'week') {
      setCurrentDate(dir === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(dir === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    }
  };

  // Stats based on PLC phases
  const stats = useMemo(() => [
    { label: 'Anfragen', count: cases.filter(c => c.current_phase === 'requested').length, dot: 'bg-amber-500' },
    { label: 'Bestätigt', count: cases.filter(c => ['provider_confirmed', 'deposit_pending', 'deposit_paid'].includes(c.current_phase)).length, dot: 'bg-primary' },
    { label: 'Eingecheckt', count: cases.filter(c => c.current_phase === 'checked_in').length, dot: 'bg-emerald-500' },
    { label: 'Abgeschlossen', count: cases.filter(c => c.current_phase === 'closed_completed').length, dot: 'bg-muted-foreground' },
  ], [cases]);

  if (!provider) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Kalender</h1>
        </div>
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
          <p className="text-muted-foreground">Kein Provider-Profil gefunden.</p>
        </div>
      </div>
    );
  }

  return (
    <PageShell>
    <div className="space-y-4">
      <ModulePageHeader
        title="Kalender"
        description="Wochen- und Monatsansicht deiner Buchungen"
        actions={
          <Tabs value={view} onValueChange={(v) => setView(v as 'week' | 'month')}>
            <TabsList className="h-8">
              <TabsTrigger value="week" className="text-xs px-3 h-6">Woche</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-3 h-6">Monat</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => nav('prev')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold">
            {view === 'week'
              ? `${format(weekStart, 'dd. MMM', { locale: de })} – ${format(addDays(weekStart, 6), 'dd. MMM yyyy', { locale: de })}`
              : format(monthStart, 'MMMM yyyy', { locale: de })
            }
          </p>
          <Button variant="link" size="sm" className="text-xs h-5 text-muted-foreground" onClick={() => setCurrentDate(new Date())}>
            Heute
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => nav('next')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : view === 'week' ? (
            <WeekView cases={cases} weekStart={weekStart} />
          ) : (
            <MonthView cases={cases} monthStart={monthStart} maxCapacity={maxCapacity} />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-lg border bg-card p-3 flex items-center gap-2">
            <span className={cn('w-2 h-2 rounded-full shrink-0', s.dot)} />
            <span className="text-xs text-muted-foreground">{s.label}</span>
            <span className="ml-auto text-sm font-bold">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
    </PageShell>
  );
}
