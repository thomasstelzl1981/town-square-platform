/**
 * CaringProviderDetail — Orchestrator (MOD-22)
 * R-16 Refactoring: 599 → ~160 lines
 */
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useProviderDetail } from '@/hooks/usePetProviderSearch';
import { usePublicProviderAvailability, usePublicProviderServices, usePublicProviderBlockedDates } from '@/hooks/usePublicPetProvider';
import { useCreateCase } from '@/hooks/usePetServiceCases';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/hooks/usePets';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isBefore, startOfDay, addMonths, differenceInCalendarDays } from 'date-fns';
import { de } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import {
  ProviderGallery, ProviderProfileCard, ProviderServicesCard,
  ProviderBookingSection, SERVICE_LABELS,
} from '@/components/petmanager/provider';

export default function CaringProviderDetail() {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: provider, isLoading } = useProviderDetail(providerId);
  const { data: availability = [] } = usePublicProviderAvailability(providerId);
  const { data: services = [] } = usePublicProviderServices(providerId);
  const { data: blockedDatesList = [] } = usePublicProviderBlockedDates(providerId);
  const { data: pets = [] } = usePets();
  const createCase = useCreateCase();
  const { user, profile } = useAuth();

  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedSlot, setSelectedSlot] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedPet, setSelectedPet] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<{ service: string; date: string; pet: string; price: string } | null>(null);

  const selectedService = services.find(s => s.id === selectedServiceId);
  const isBoarding = selectedService?.category === 'boarding';

  useMemo(() => { if (services.length > 0 && !selectedServiceId) setSelectedServiceId(services[0].id); }, [services, selectedServiceId]);

  const blockedDateSet = useMemo(() => new Set(blockedDatesList.map(d => d.blocked_date)), [blockedDatesList]);
  const availabilityByDay = useMemo(() => {
    const map = new Map<number, typeof availability>();
    for (const slot of availability) { if (!slot.is_active) continue; const e = map.get(slot.day_of_week) || []; e.push(slot); map.set(slot.day_of_week, e); }
    return map;
  }, [availability]);

  const { availableDays, blockedDays } = useMemo(() => {
    const start = startOfMonth(calendarMonth); const end = endOfMonth(addMonths(calendarMonth, 1));
    const days = eachDayOfInterval({ start, end }); const today = startOfDay(new Date());
    const avail: Date[] = []; const blocked: Date[] = [];
    for (const day of days) { if (isBefore(day, today)) continue; const dateStr = format(day, 'yyyy-MM-dd'); if (!blockedDateSet.has(dateStr) && availabilityByDay.has(getDay(day))) avail.push(day); else blocked.push(day); }
    return { availableDays: avail, blockedDays: blocked };
  }, [calendarMonth, availabilityByDay, blockedDateSet]);

  const slotsForDate = useMemo(() => selectedDate ? availabilityByDay.get(getDay(selectedDate)) || [] : [], [selectedDate, availabilityByDay]);

  const handleBooking = async () => {
    if (!selectedService || !providerId) return;
    const pet = pets.find(p => p.id === selectedPet);
    const scheduledDate = isBoarding ? (dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '') : (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '');
    if (!scheduledDate) return;
    const serviceTypeMap: Record<string, string> = { boarding: 'pension', daycare: 'daycare', walking: 'walking', grooming: 'grooming', puppy_class: 'training' };
    let priceCents = selectedService.price_cents;
    if (isBoarding && dateRange?.from && dateRange?.to) priceCents = differenceInCalendarDays(dateRange.to, dateRange.from) * selectedService.price_cents;
    const scheduledEnd = isBoarding && dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : scheduledDate;
    try {
      await createCase.mutateAsync({ provider_id: providerId, service_id: selectedService.id, service_type: (serviceTypeMap[selectedService.category] || 'other') as any, pet_id: selectedPet || null, customer_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null, customer_email: user?.email || null, customer_notes: notes || null, scheduled_start: scheduledDate, scheduled_end: scheduledEnd, tenant_id: provider?.tenant_id || '' });
      setBookingSuccess({ service: SERVICE_LABELS[selectedService.category] || selectedService.title, date: isBoarding && dateRange?.from && dateRange?.to ? `${format(dateRange.from, 'dd.MM.yyyy')} – ${format(dateRange.to, 'dd.MM.yyyy')}` : format(new Date(scheduledDate), 'dd.MM.yyyy', { locale: de }), pet: pet?.name || '', price: `${(priceCents / 100).toFixed(2)} €` });
      setSelectedDate(undefined); setDateRange(undefined); setSelectedSlot(''); setSelectedPet(''); setNotes('');
    } catch { /* handled by hook */ }
  };

  if (isLoading) return <PageShell><div className="flex items-center justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div></PageShell>;
  if (!provider) return <PageShell><Button variant="ghost" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Zurück</Button><p className="text-muted-foreground text-center py-8">Anbieter nicht gefunden.</p></PageShell>;

  const calendarModifiers = { available: availableDays, blocked: blockedDays };
  const calendarClassNames = { available: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25', blocked: 'bg-destructive/10 text-destructive/50' };

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)} size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Zurück</Button>
        <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">PetManagerAkte</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ProviderGallery galleryImages={(provider as any)?.gallery_images || []} coverImageUrl={(provider as any)?.cover_image_url} />
        <ProviderProfileCard provider={provider} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ProviderServicesCard services={services} selectedServiceId={selectedServiceId} onServiceChange={(v) => { setSelectedServiceId(v); setSelectedDate(undefined); setDateRange(undefined); setSelectedSlot(''); }} />
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Verfügbarkeit</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 mb-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-emerald-500/40 border border-emerald-500/60" />Verfügbar</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-destructive/40 border border-destructive/60" />Nicht verfügbar</span>
            </div>
            {isBoarding ? (
              <Calendar mode="range" selected={dateRange} onSelect={(range) => { setDateRange(range as DateRange); setSelectedDate(undefined); }} onMonthChange={setCalendarMonth} numberOfMonths={isMobile ? 1 : 2} locale={de} modifiers={calendarModifiers} modifiersClassNames={calendarClassNames} disabled={[{ before: new Date() }]} className="rounded-md border" />
            ) : (
              <Calendar mode="single" selected={selectedDate} onSelect={d => { setSelectedDate(d); setSelectedSlot(''); setDateRange(undefined); }} onMonthChange={setCalendarMonth} numberOfMonths={isMobile ? 1 : 2} locale={de} modifiers={calendarModifiers} modifiersClassNames={calendarClassNames} disabled={[{ before: new Date() }]} className="rounded-md border" />
            )}
          </CardContent>
        </Card>
      </div>

      <ProviderBookingSection isBoarding={isBoarding} dateRange={dateRange} selectedDate={selectedDate} slotsForDate={slotsForDate} selectedSlot={selectedSlot} onSlotChange={setSelectedSlot} pets={pets} selectedPet={selectedPet} onPetChange={setSelectedPet} notes={notes} onNotesChange={setNotes} onBook={handleBooking} isPending={createCase.isPending} bookingSuccess={bookingSuccess} onResetSuccess={() => setBookingSuccess(null)} />
    </PageShell>
  );
}
