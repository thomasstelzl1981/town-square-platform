/**
 * PMServices — Terminkalender (vereinfacht, ohne Mitarbeiter-CRUD)
 * Mitarbeiterverwaltung liegt jetzt in PMPersonal.tsx
 */
import { useState, useMemo } from 'react';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMyProvider, useBookings } from '@/hooks/usePetBookings';
import { useProviderStaff } from '@/hooks/usePetStaff';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/shared/PageShell';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday, eachDayOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function PMServices() {
  const { data: provider } = useMyProvider();
  const { data: staff = [] } = useProviderStaff(provider?.id);
  const { data: bookings = [] } = useBookings(provider ? { providerId: provider.id } : undefined);

  const [currentDate, setCurrentDate] = useState(new Date());

  const activeStaff = staff.filter(s => s.is_active);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) }), [weekStart]);

  const serviceBookings = bookings.filter(b => !['cancelled', 'no_show'].includes(b.status));

  if (!provider) {
    return (
      <PageShell>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Services</h1>
          </div>
          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
            <p className="text-muted-foreground">Kein Provider-Profil gefunden.</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Services — Terminkalender</h1>
          </div>
          <Link to="/portal/petmanager/mitarbeiter">
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-1" /> Mitarbeiter verwalten
            </Button>
          </Link>
        </div>

        {/* Terminkalender */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Wochenübersicht</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[140px] text-center">
                {format(weekStart, 'dd. MMM', { locale: de })} – {format(addDays(weekStart, 6), 'dd. MMM yyyy', { locale: de })}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="link" size="sm" className="text-xs h-5" onClick={() => setCurrentDate(new Date())}>Heute</Button>
            </div>
          </div>

          {activeStaff.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Noch keine Mitarbeiter angelegt.{' '}
                <Link to="/portal/petmanager/mitarbeiter" className="text-primary underline">Mitarbeiter anlegen →</Link>
              </p>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-4 overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="text-left p-2 border-b font-medium text-muted-foreground w-28">Mitarbeiter</th>
                      {weekDays.map(day => (
                        <th key={day.toISOString()} className={cn(
                          'p-2 border-b font-medium text-center min-w-[80px]',
                          isToday(day) ? 'text-primary bg-primary/5' : 'text-muted-foreground',
                        )}>
                          <div>{format(day, 'EEE', { locale: de })}</div>
                          <div className="text-[10px]">{format(day, 'dd.MM.')}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeStaff.map(member => (
                      <tr key={member.id} className="border-b last:border-0">
                        <td className="p-2 font-medium">
                          <div>{member.name}</div>
                          <span className="text-[10px] text-muted-foreground">{member.role}</span>
                        </td>
                        {weekDays.map(day => {
                          const dateKey = format(day, 'yyyy-MM-dd');
                          const dayBookings = serviceBookings.filter(b => b.scheduled_date === dateKey);
                          return (
                            <td key={day.toISOString()} className={cn(
                              'p-1 text-center border-l',
                              isToday(day) && 'bg-primary/5',
                            )}>
                              {dayBookings.length > 0 ? (
                                <div className="flex flex-col gap-0.5">
                                  {dayBookings.slice(0, 3).map(b => (
                                    <div key={b.id} className="rounded bg-primary/15 px-1 py-0.5 text-[9px] truncate">
                                      {b.scheduled_time_start?.slice(0, 5)} {b.service?.title}
                                    </div>
                                  ))}
                                  {dayBookings.length > 3 && <span className="text-[9px] text-muted-foreground">+{dayBookings.length - 3}</span>}
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground/30">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}
