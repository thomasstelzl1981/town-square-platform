/**
 * PMServices — Service-Kalender mit 30-Min-Slots pro Mitarbeiter
 * Mitarbeiter als Zeilen, Tage als Spalten (90 Tage scrollbar),
 * Slots basierend auf Arbeitszeiten, freie Tage/Urlaub ausgegraut.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Users, ChevronLeft, ChevronRight, Save, Trash2, X, PawPrint, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { useMyProvider, useBookings, useProviderServices, useCreateBooking, type PetBooking, type PetService } from '@/hooks/usePetBookings';
import { useProviderStaff, useAllStaffVacations, type PetStaff, type PetStaffVacation } from '@/hooks/usePetStaff';
import { usePets } from '@/hooks/usePets';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/shared/PageShell';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { isDemoId } from '@/engines/demoData';
import { format, addDays, isToday, eachDayOfInterval, isWeekend, parseISO, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const VISIBLE_DAYS = 90;
const COL_WIDTH_STAFF = 200;
const COL_WIDTH_DATE = 120;
const CELL_HEIGHT = 28;
const STAFF_HEADER_HEIGHT = 36;

const DAY_KEY_MAP: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
};

type WorkDay = { start: string; end: string } | null;
type WorkHours = Record<string, WorkDay>;

function getSlotCount(workDay: WorkDay): number {
  if (!workDay) return 0;
  const [sh, sm] = workDay.start.split(':').map(Number);
  const [eh, em] = workDay.end.split(':').map(Number);
  const totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
  return Math.max(0, Math.floor(totalMinutes / 30));
}

function generateSlots(workDay: WorkDay): string[] {
  if (!workDay) return [];
  const slots: string[] = [];
  const [sh, sm] = workDay.start.split(':').map(Number);
  const [eh, em] = workDay.end.split(':').map(Number);
  let current = sh * 60 + sm;
  const end = eh * 60 + em;
  while (current < end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    current += 30;
  }
  return slots;
}

function isOnVacation(day: Date, staffId: string, vacations: PetStaffVacation[]): boolean {
  return vacations.some(v => {
    if (v.staff_id !== staffId) return false;
    const start = parseISO(v.start_date);
    const end = parseISO(v.end_date);
    return isWithinInterval(day, { start, end });
  });
}

const SLOT_COLORS = [
  'bg-blue-400/70', 'bg-emerald-400/70', 'bg-amber-400/70', 'bg-rose-400/70',
  'bg-violet-400/70', 'bg-cyan-400/70', 'bg-orange-400/70', 'bg-teal-400/70',
];

interface BookingFormData {
  pet_id: string;
  service_id: string;
  staff_id: string;
  scheduled_date: string;
  scheduled_time_start: string;
  notes: string;
}

const EMPTY_BOOKING: BookingFormData = { pet_id: '', service_id: '', staff_id: '', scheduled_date: '', scheduled_time_start: '', notes: '' };

export default function PMServices() {
  const { data: provider } = useMyProvider();
  const { data: staff = [] } = useProviderStaff(provider?.id);
  const { data: rawBookings = [] } = useBookings(provider ? { providerId: provider.id } : undefined);
  const { data: services = [] } = useProviderServices(provider?.id);
  const { data: allPets = [] } = usePets();
  const createBooking = useCreateBooking();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-PET');
  const bookings = demoEnabled ? rawBookings : rawBookings.filter(b => !isDemoId(b.id));

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingFormData>(EMPTY_BOOKING);
  const [collapsedStaff, setCollapsedStaff] = useState<Set<string>>(new Set());

  const activeStaff = staff.filter(s => s.is_active);

  const toggleCollapse = useCallback((staffId: string) => {
    setCollapsedStaff(prev => {
      const next = new Set(prev);
      if (next.has(staffId)) next.delete(staffId);
      else next.add(staffId);
      return next;
    });
  }, []);

  const visibleDays = useMemo(() => {
    return eachDayOfInterval({ start: currentDate, end: addDays(currentDate, VISIBLE_DAYS - 1) });
  }, [currentDate]);

  const startDateStr = format(visibleDays[0], 'yyyy-MM-dd');
  const endDateStr = format(visibleDays[visibleDays.length - 1], 'yyyy-MM-dd');

  const { data: allVacations = [] } = useAllStaffVacations(provider?.id, startDateStr, endDateStr);

  const serviceBookings = useMemo(() =>
    bookings.filter(b => !['cancelled', 'no_show'].includes(b.status)),
    [bookings]
  );

  // Index bookings by staff_id + date + time
  const bookingIndex = useMemo(() => {
    const map = new Map<string, PetBooking>();
    serviceBookings.forEach(b => {
      // Key: staffId:date:time
      if (b.scheduled_time_start) {
        const key = `${(b as any).staff_id || ''}:${b.scheduled_date}:${b.scheduled_time_start.slice(0, 5)}`;
        map.set(key, b);
      }
    });
    return map;
  }, [serviceBookings]);

  // Bookings per staff+date for count
  const bookingsByStaffDate = useMemo(() => {
    const map = new Map<string, PetBooking[]>();
    serviceBookings.forEach(b => {
      const key = `${(b as any).staff_id || ''}:${b.scheduled_date}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });
    return map;
  }, [serviceBookings]);

  const navigateWeek = useCallback((dir: number) => {
    setCurrentDate(prev => addDays(prev, dir * 7));
  }, []);
  const goToday = useCallback(() => setCurrentDate(new Date()), []);

  const handleOpenBooking = (staffId?: string, date?: string, time?: string) => {
    setBookingForm({
      ...EMPTY_BOOKING,
      staff_id: staffId || '',
      scheduled_date: date || '',
      scheduled_time_start: time || '',
    });
    setShowBookingDialog(true);
  };

  const handleCloseBooking = () => { setShowBookingDialog(false); };

  const handleSaveBooking = async () => {
    if (!bookingForm.pet_id || !bookingForm.service_id || !bookingForm.scheduled_date || !bookingForm.scheduled_time_start) return;
    await createBooking.mutateAsync({
      pet_id: bookingForm.pet_id,
      service_id: bookingForm.service_id,
      provider_id: provider!.id,
      scheduled_date: bookingForm.scheduled_date,
      scheduled_time_start: bookingForm.scheduled_time_start,
    });
    handleCloseBooking();
  };

  if (!provider) {
    return (
      <PageShell>
        <div className="space-y-6">
          <ModulePageHeader title="Services" description="Terminkalender und Dienstleistungen" />
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
        <ModulePageHeader
          title="Services"
          description="Terminkalender und Dienstleistungen"
          actions={
            <div className="flex items-center gap-2">
              <Link to="/portal/petmanager/mitarbeiter">
                <Button variant="glass" size="icon-round" title="Mitarbeiter verwalten">
                  <Users className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="glass" size="icon-round" onClick={() => handleOpenBooking()} title="Neuer Termin">
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          }
        />

        {/* Buchungs-Dialog */}
        {showBookingDialog && (
          <Card className="relative z-10">
            <CardContent className="pt-5 pb-5 px-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Neuer Termin</h2>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCloseBooking}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Hund *</Label>
                  <Select value={bookingForm.pet_id} onValueChange={v => setBookingForm(f => ({ ...f, pet_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Hund auswählen..." /></SelectTrigger>
                    <SelectContent>
                      {allPets.map(pet => (
                        <SelectItem key={pet.id} value={pet.id}>
                          <span className="flex items-center gap-1.5">
                            <PawPrint className="h-3 w-3" /> {pet.name} {pet.breed ? `(${pet.breed})` : ''}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dienstleistung *</Label>
                  <Select value={bookingForm.service_id} onValueChange={v => setBookingForm(f => ({ ...f, service_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Service auswählen..." /></SelectTrigger>
                    <SelectContent>
                      {services.filter(s => s.is_active).map(svc => (
                        <SelectItem key={svc.id} value={svc.id}>
                          {svc.title} ({svc.duration_minutes} Min.)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mitarbeiter</Label>
                  <Select value={bookingForm.staff_id} onValueChange={v => setBookingForm(f => ({ ...f, staff_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Mitarbeiter auswählen..." /></SelectTrigger>
                    <SelectContent>
                      {activeStaff.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.role})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Datum *</Label>
                    <Input type="date" value={bookingForm.scheduled_date} onChange={e => setBookingForm(f => ({ ...f, scheduled_date: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Uhrzeit *</Label>
                    <Input type="time" step="1800" value={bookingForm.scheduled_time_start} onChange={e => setBookingForm(f => ({ ...f, scheduled_time_start: e.target.value }))} />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button onClick={handleSaveBooking} disabled={createBooking.isPending}>
                    <Save className="h-4 w-4 mr-1" /> Speichern
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Service-Kalender */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Service-Kalender</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateWeek(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[160px] text-center">
                {format(visibleDays[0], 'dd. MMM', { locale: de })} – {format(visibleDays[visibleDays.length - 1], 'dd. MMM yyyy', { locale: de })}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateWeek(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="link" size="sm" className="text-xs h-5" onClick={goToday}>Heute</Button>
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
            <div className="overflow-x-auto border rounded-lg bg-card">
              <table className="border-collapse text-xs" style={{ minWidth: `${COL_WIDTH_STAFF + VISIBLE_DAYS * COL_WIDTH_DATE}px` }}>
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 bg-muted/80 backdrop-blur-sm border-b border-r p-2 text-left font-medium text-muted-foreground"
                        style={{ minWidth: COL_WIDTH_STAFF }}>
                      Mitarbeiter
                    </th>
                    {visibleDays.map(day => (
                      <th key={day.toISOString()}
                          className={cn(
                            'p-1.5 border-b border-r font-medium text-center',
                            isToday(day) ? 'text-primary bg-primary/10' : 'text-muted-foreground',
                            isWeekend(day) && 'bg-muted/40',
                          )}
                          style={{ minWidth: COL_WIDTH_DATE }}>
                        <div className="text-[10px]">{format(day, 'EEE', { locale: de })}</div>
                        <div>{format(day, 'dd.MM.')}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeStaff.map((member, memberIdx) => {
                    const workHours = (member.work_hours || {}) as WorkHours;
                    const isCollapsed = collapsedStaff.has(member.id);

                    // Compute max slots for this member across all weekdays for sub-rows
                    const allWeekdaySlots = Object.values(DAY_KEY_MAP).map(dk => generateSlots(workHours[dk] as WorkDay));
                    const maxSlots = Math.max(...allWeekdaySlots.map(s => s.length), 0);
                    // Use a representative full set: union of all unique slot times sorted
                    const allSlotTimes = Array.from(new Set(allWeekdaySlots.flat())).sort();

                    return (
                      <React.Fragment key={member.id}>
                        {/* Staff header row */}
                        <tr className={cn('border-b border-border', memberIdx > 0 && 'border-t-2 border-t-border')}>
                          <td className="sticky left-0 z-10 bg-muted/60 backdrop-blur-sm border-r px-2 py-1 font-medium cursor-pointer select-none"
                              style={{ minWidth: COL_WIDTH_STAFF, height: STAFF_HEADER_HEIGHT }}
                              onClick={() => toggleCollapse(member.id)}>
                            <div className="flex items-center gap-1.5">
                              {isCollapsed ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                              <span className="truncate text-sm">{member.name}</span>
                              <span className="text-[10px] text-muted-foreground ml-1">({member.role})</span>
                            </div>
                          </td>
                          {visibleDays.map(day => {
                            const dayKey = DAY_KEY_MAP[day.getDay()];
                            const workDay = workHours[dayKey] as WorkDay;
                            const vacation = isOnVacation(day, member.id, allVacations);
                            const isOff = !workDay || vacation;
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const dayBookings = bookingsByStaffDate.get(`${member.id}:${dateStr}`) || [];
                            const totalSlots = workDay ? generateSlots(workDay).length : 0;

                            return (
                              <td key={day.toISOString()}
                                  className={cn(
                                    'border-r text-center text-[9px]',
                                    isOff && 'bg-muted/50',
                                    isToday(day) && !isOff && 'bg-primary/5',
                                    isWeekend(day) && !isOff && !isToday(day) && 'bg-muted/20',
                                  )}
                                  style={{ minWidth: COL_WIDTH_DATE, height: STAFF_HEADER_HEIGHT }}>
                                {isOff ? (
                                  <span className="text-muted-foreground/50">{vacation ? 'Urlaub' : 'Frei'}</span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    {dayBookings.length}/{totalSlots}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Slot sub-rows (hidden when collapsed) */}
                        {!isCollapsed && allSlotTimes.map((slotTime) => (
                          <tr key={`${member.id}-${slotTime}`} className="border-b border-border/30">
                            <td className="sticky left-0 z-10 bg-card border-r pl-7 pr-2 text-[10px] text-muted-foreground font-mono"
                                style={{ minWidth: COL_WIDTH_STAFF, height: CELL_HEIGHT }}>
                              {slotTime}
                            </td>
                            {visibleDays.map(day => {
                              const dayKey = DAY_KEY_MAP[day.getDay()];
                              const workDay = workHours[dayKey] as WorkDay;
                              const dateStr = format(day, 'yyyy-MM-dd');
                              const vacation = isOnVacation(day, member.id, allVacations);
                              const isOff = !workDay || vacation;

                              // Check if this slot is within the staff's working hours for this day
                              const daySlots = workDay ? generateSlots(workDay) : [];
                              const slotInRange = daySlots.includes(slotTime);

                              if (isOff || !slotInRange) {
                                return (
                                  <td key={day.toISOString()}
                                      className="border-r bg-muted/30"
                                      style={{ minWidth: COL_WIDTH_DATE, height: CELL_HEIGHT }} />
                                );
                              }

                              // Check for booking at this exact slot
                              const bookingKey = `${member.id}:${dateStr}:${slotTime}`;
                              const booking = bookingIndex.get(bookingKey);

                              if (booking) {
                                const colorIdx = activeStaff.indexOf(member) % SLOT_COLORS.length;
                                return (
                                  <td key={day.toISOString()}
                                      className={cn('border-r cursor-pointer', SLOT_COLORS[colorIdx])}
                                      style={{ minWidth: COL_WIDTH_DATE, height: CELL_HEIGHT }}
                                      title={`${booking.pet?.name || ''} – ${booking.service?.title || ''}`}
                                      onClick={() => handleOpenBooking(member.id, dateStr, slotTime)}>
                                    <div className="px-1 text-[9px] text-white truncate leading-[28px]">
                                      {booking.pet?.name || booking.service?.title || '•'}
                                    </div>
                                  </td>
                                );
                              }

                              return (
                                <td key={day.toISOString()}
                                    className={cn(
                                      'border-r cursor-pointer transition-colors hover:bg-primary/10',
                                      isToday(day) && 'bg-primary/5',
                                      isWeekend(day) && !isToday(day) && 'bg-muted/10',
                                    )}
                                    style={{ minWidth: COL_WIDTH_DATE, height: CELL_HEIGHT }}
                                    onClick={() => handleOpenBooking(member.id, dateStr, slotTime)} />
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
