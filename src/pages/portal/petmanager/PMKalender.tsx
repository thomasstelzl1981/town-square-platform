/**
 * PMKalender — Wochen- und Monatskalender für Pet Manager (P4.1 + P4.2)
 */
import { useState, useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, PawPrint, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMyProvider, useBookings, type PetBooking } from '@/hooks/usePetBookings';
import {
  format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks,
  startOfMonth, endOfMonth, addMonths, subMonths,
  isSameDay, isToday, parseISO, eachDayOfInterval, getDay,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { isDemoId } from '@/engines/demoData';

// ─── Status colors ────────────────────────────────────────
const STATUS_BG: Record<string, string> = {
  requested: 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300',
  confirmed: 'bg-primary/15 border-primary/30 text-primary',
  in_progress: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
  completed: 'bg-muted border-border text-muted-foreground',
  cancelled: 'bg-destructive/10 border-destructive/20 text-destructive line-through',
};

const STATUS_DOT: Record<string, string> = {
  requested: 'bg-amber-500',
  confirmed: 'bg-primary',
  in_progress: 'bg-emerald-500',
  completed: 'bg-muted-foreground',
  cancelled: 'bg-destructive',
};

// ─── Helpers ──────────────────────────────────────────────
function groupByDate(bookings: PetBooking[]) {
  const map = new Map<string, PetBooking[]>();
  bookings.forEach(b => {
    const key = b.scheduled_date;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(b);
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

// ─── Booking Block (compact) ──────────────────────────────
function BookingBlock({ booking }: { booking: PetBooking }) {
  return (
    <div className={cn(
      'rounded px-1.5 py-0.5 text-[10px] leading-tight border truncate',
      STATUS_BG[booking.status] || 'bg-muted border-border',
    )}>
      <span className="font-medium">{booking.pet?.name}</span>
      {booking.scheduled_time_start && (
        <span className="ml-1 opacity-70">{booking.scheduled_time_start.slice(0, 5)}</span>
      )}
    </div>
  );
}

// ─── WEEK VIEW ────────────────────────────────────────────
function WeekView({ bookings, weekStart }: { bookings: PetBooking[]; weekStart: Date }) {
  const grouped = useMemo(() => groupByDate(bookings), [bookings]);
  const days = useMemo(() => eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) }), [weekStart]);

  return (
    <div className="grid grid-cols-7 gap-1 md:gap-2">
      {days.map(day => {
        const key = format(day, 'yyyy-MM-dd');
        const dayBookings = grouped.get(key) || [];
        const today = isToday(day);
        return (
          <div key={key} className={cn(
            'min-h-[120px] md:min-h-[160px] rounded-lg border p-1.5 md:p-2 flex flex-col',
            today && 'ring-2 ring-primary/50 bg-primary/5',
            !today && 'bg-card',
          )}>
            <div className="flex items-center justify-between mb-1">
              <span className={cn(
                'text-xs font-medium',
                today ? 'text-primary' : 'text-muted-foreground',
              )}>
                {format(day, 'EEE', { locale: de })}
              </span>
              <span className={cn(
                'text-xs rounded-full w-5 h-5 flex items-center justify-center',
                today && 'bg-primary text-primary-foreground font-bold',
              )}>
                {format(day, 'd')}
              </span>
            </div>
            <div className="flex-1 space-y-0.5 overflow-y-auto">
              {dayBookings
                .filter(b => b.status !== 'cancelled')
                .sort((a, b) => (a.scheduled_time_start || '').localeCompare(b.scheduled_time_start || ''))
                .map(b => <BookingBlock key={b.id} booking={b} />)}
            </div>
            {dayBookings.length > 0 && (
              <div className="mt-1 flex gap-0.5">
                {dayBookings.filter(b => b.status !== 'cancelled').map(b => (
                  <span key={b.id} className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT[b.status] || 'bg-muted-foreground')} />
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
function MonthView({ bookings, monthStart, maxCapacity }: { bookings: PetBooking[]; monthStart: Date; maxCapacity: number }) {
  const grouped = useMemo(() => groupByDate(bookings), [bookings]);
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allDays = useMemo(() => eachDayOfInterval({ start: calStart, end: calEnd }), [calStart, calEnd]);

  return (
    <div>
      {/* Header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {allDays.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const dayBookings = (grouped.get(key) || []).filter(b => b.status !== 'cancelled');
          const count = dayBookings.length;
          const inMonth = day.getMonth() === monthStart.getMonth();
          const today = isToday(day);

          return (
            <div key={key} className={cn(
              'aspect-square rounded-md border flex flex-col items-center justify-center p-1 relative',
              !inMonth && 'opacity-30',
              today && 'ring-2 ring-primary/50',
              count > 0 ? capacityColor(count, maxCapacity) : 'bg-card',
            )}>
              <span className={cn(
                'text-xs',
                today && 'font-bold text-primary',
              )}>
                {format(day, 'd')}
              </span>
              {count > 0 && (
                <span className="text-[10px] font-semibold mt-0.5">
                  {count}
                </span>
              )}
              {/* Dot indicators */}
              {count > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayBookings.slice(0, 4).map(b => (
                    <span key={b.id} className={cn('w-1 h-1 rounded-full', STATUS_DOT[b.status])} />
                  ))}
                  {count > 4 && <span className="text-[8px] text-muted-foreground">+</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Angefragt</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Bestätigt</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Laufend</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground" /> Erledigt</span>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────
export default function PMKalender() {
  const { data: provider } = useMyProvider();
  const { data: rawBookings = [], isLoading } = useBookings(provider ? { providerId: provider.id } : undefined);
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-PET');
  const bookings = demoEnabled ? rawBookings : rawBookings.filter(b => !isDemoId(b.id));
  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const monthStart = startOfMonth(currentDate);

  const maxCapacity = (provider as any)?.max_daily_capacity || 10;

  const navigate = (dir: 'prev' | 'next') => {
    if (view === 'week') {
      setCurrentDate(dir === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(dir === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    }
  };

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
      {/* ModulePageHeader — CI-Standard */}
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

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('prev')}>
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
        <Button variant="ghost" size="sm" onClick={() => navigate('next')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : view === 'week' ? (
            <WeekView bookings={bookings} weekStart={weekStart} />
          ) : (
            <MonthView bookings={bookings} monthStart={monthStart} maxCapacity={maxCapacity} />
          )}
        </CardContent>
      </Card>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Anfragen', count: bookings.filter(b => b.status === 'requested').length, dot: 'bg-amber-500' },
          { label: 'Bestätigt', count: bookings.filter(b => b.status === 'confirmed').length, dot: 'bg-primary' },
          { label: 'Laufend', count: bookings.filter(b => b.status === 'in_progress').length, dot: 'bg-emerald-500' },
          { label: 'Erledigt', count: bookings.filter(b => b.status === 'completed').length, dot: 'bg-muted-foreground' },
        ].map(s => (
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
