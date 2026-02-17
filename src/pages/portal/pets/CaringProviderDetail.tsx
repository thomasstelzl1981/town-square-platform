/**
 * PetManagerAkte — Anbieter-Dossier mit Galerie, Profil, Leistungen, Kalender & Buchung
 */
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Mail, Star, Clock, PawPrint, X, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useProviderDetail } from '@/hooks/usePetProviderSearch';
import { usePublicProviderAvailability, usePublicProviderServices } from '@/hooks/usePublicPetProvider';
import { useCreateBooking } from '@/hooks/usePetBookings';
import { usePets } from '@/hooks/usePets';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isBefore, startOfDay, addMonths, differenceInCalendarDays } from 'date-fns';
import { de } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';

const SERVICE_LABELS: Record<string, string> = {
  boarding: 'Pension / Urlaubsbetreuung',
  daycare: 'Tagesstätte',
  walking: 'Gassi-Service',
  grooming: 'Hundesalon',
  puppy_class: 'Welpenspielstunde',
};

export default function CaringProviderDetail() {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: provider, isLoading } = useProviderDetail(providerId);
  const { data: availability = [] } = usePublicProviderAvailability(providerId);
  const { data: services = [] } = usePublicProviderServices(providerId);
  const { data: pets = [] } = usePets();

  // Service selection
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const selectedService = services.find(s => s.id === selectedServiceId);
  const isBoarding = selectedService?.category === 'boarding';

  // Calendar
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Booking
  const [selectedPet, setSelectedPet] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<{ service: string; date: string; pet: string; price: string } | null>(null);
  const createBooking = useCreateBooking();

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Gallery images
  const galleryImages: string[] = (provider as any)?.gallery_images || [];
  const coverImage = (provider as any)?.cover_image_url;
  const allImages = galleryImages.length > 0 ? galleryImages : coverImage ? [coverImage] : [];

  // Auto-select first service
  useMemo(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  // Availability map: day_of_week → slots
  const availabilityByDay = useMemo(() => {
    const map = new Map<number, typeof availability>();
    for (const slot of availability) {
      if (!slot.is_active) continue;
      const existing = map.get(slot.day_of_week) || [];
      existing.push(slot);
      map.set(slot.day_of_week, existing);
    }
    return map;
  }, [availability]);

  // Available/blocked days for 2 months
  const { availableDays, blockedDays } = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(addMonths(calendarMonth, 1));
    const days = eachDayOfInterval({ start, end });
    const today = startOfDay(new Date());
    const avail: Date[] = [];
    const blocked: Date[] = [];
    for (const day of days) {
      if (isBefore(day, today)) continue;
      const dow = getDay(day);
      if (availabilityByDay.has(dow)) avail.push(day);
      else blocked.push(day);
    }
    return { availableDays: avail, blockedDays: blocked };
  }, [calendarMonth, availabilityByDay]);

  // Slots for selected date
  const slotsForDate = useMemo(() => {
    if (!selectedDate) return [];
    const dow = getDay(selectedDate);
    return availabilityByDay.get(dow) || [];
  }, [selectedDate, availabilityByDay]);

  const handleBooking = async () => {
    if (!selectedService || !providerId) return;

    const pet = pets.find(p => p.id === selectedPet);
    const scheduledDate = isBoarding
      ? dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : ''
      : selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

    if (!scheduledDate) return;

    const slot = slotsForDate.find(s => s.id === selectedSlot);
    const scheduledTimeStart = isBoarding ? undefined : slot?.start_time?.slice(0, 5);

    // Berechne Preis: Pension = Tage * Tagespreis, sonst Einzelpreis
    let priceCents = selectedService.price_cents;
    if (isBoarding && dateRange?.from && dateRange?.to) {
      const days = differenceInCalendarDays(dateRange.to, dateRange.from);
      priceCents = days * selectedService.price_cents;
    }

    try {
      await createBooking.mutateAsync({
        pet_id: selectedPet,
        service_id: selectedService.id,
        provider_id: providerId,
        scheduled_date: scheduledDate,
        scheduled_time_start: scheduledTimeStart,
        duration_minutes: selectedService.duration_minutes,
        price_cents: priceCents,
        client_notes: notes || undefined,
      });

      setBookingSuccess({
        service: SERVICE_LABELS[selectedService.category] || selectedService.title,
        date: isBoarding && dateRange?.from && dateRange?.to
          ? `${format(dateRange.from, 'dd.MM.yyyy')} – ${format(dateRange.to, 'dd.MM.yyyy')}`
          : format(new Date(scheduledDate), 'dd.MM.yyyy', { locale: de }),
        pet: pet?.name || '',
        price: `${(priceCents / 100).toFixed(2)} €`,
      });

      // Reset form
      setSelectedDate(undefined);
      setDateRange(undefined);
      setSelectedSlot('');
      setSelectedPet('');
      setNotes('');
    } catch {
      // Error toast is handled by useCreateBooking
    }
  };

  const formatPrice = (cents: number, type: string) => {
    const eur = (cents / 100).toFixed(0);
    const suffix = type === 'per_day' ? '/Tag' : type === 'per_hour' ? '/Std.' : '';
    return `${eur} €${suffix}`;
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </PageShell>
    );
  }

  if (!provider) {
    return (
      <PageShell>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />Zurück
        </Button>
        <p className="text-muted-foreground text-center py-8">Anbieter nicht gefunden.</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />Zurück
        </Button>
        <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">PetManagerAkte</span>
      </div>

      {/* ═══ OBERER BEREICH: Galerie + Profil ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Bildergalerie */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {allImages.length > 0 ? (
              <div className="relative w-full aspect-[4/3]">
                <button
                  onClick={() => setLightboxIndex(galleryIndex)}
                  className="w-full h-full focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg"
                >
                  <img
                    src={allImages[galleryIndex]}
                    alt={`Bild ${galleryIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
                {allImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90 rounded-full"
                      onClick={() => setGalleryIndex((galleryIndex - 1 + allImages.length) % allImages.length)}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90 rounded-full"
                      onClick={() => setGalleryIndex((galleryIndex + 1) % allImages.length)}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                    <span className="absolute bottom-2 right-2 text-xs bg-background/70 px-2 py-1 rounded">
                      {galleryIndex + 1} / {allImages.length}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full aspect-[4/3] bg-gradient-to-br from-muted/40 to-muted/10 flex items-center justify-center">
                <PawPrint className="h-16 w-16 text-muted-foreground/20" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profil & Info */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <h1 className="text-xl font-bold">{provider.company_name}</h1>

            <div className="space-y-1.5 text-sm text-muted-foreground">
              {provider.address && (
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 flex-shrink-0" />{provider.address}</span>
              )}
              {provider.phone && (
                <a href={`tel:${provider.phone}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <Phone className="h-4 w-4 flex-shrink-0" />{provider.phone}
                </a>
              )}
              {provider.email && (
                <a href={`mailto:${provider.email}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <Mail className="h-4 w-4 flex-shrink-0" />{provider.email}
                </a>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-4 w-4',
                    i < Math.round(provider.rating_avg || 0) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30',
                  )}
                />
              ))}
              {provider.rating_avg != null && (
                <span className="text-sm text-muted-foreground ml-1">{Number(provider.rating_avg).toFixed(1)}</span>
              )}
            </div>

            {/* Bio */}
            {provider.bio && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Über uns</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{provider.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ UNTERER BEREICH: Leistungen + Kalender ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Leistungen */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PawPrint className="h-4 w-4" />Leistungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {services.length > 0 ? (
              <RadioGroup value={selectedServiceId} onValueChange={(v) => {
                setSelectedServiceId(v);
                setSelectedDate(undefined);
                setDateRange(undefined);
                setSelectedSlot('');
              }}>
                <div className="space-y-2">
                  {services.map(s => (
                    <label
                      key={s.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                        selectedServiceId === s.id
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border/30 hover:border-border/60'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={s.id} />
                        <div>
                          <p className="text-sm font-medium">{SERVICE_LABELS[s.category] || s.category}</p>
                          <p className="text-xs text-muted-foreground">{s.title}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {formatPrice(s.price_cents, s.price_type)}
                      </Badge>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            ) : (
              <p className="text-sm text-muted-foreground">Keine Leistungen verfügbar.</p>
            )}

            {selectedService && (
              <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/20">
                <p className="text-sm font-semibold">
                  {formatPrice(selectedService.price_cents, selectedService.price_type)}
                </p>
                {selectedService.description && (
                  <p className="text-xs text-muted-foreground mt-1">{selectedService.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Dauer: {selectedService.duration_minutes} Min.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kalender */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />Verfügbarkeit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 mb-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-emerald-500/40 border border-emerald-500/60" />Verfügbar</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-destructive/40 border border-destructive/60" />Nicht verfügbar</span>
            </div>

            {isBoarding ? (
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range as DateRange);
                  setSelectedDate(undefined);
                }}
                onMonthChange={setCalendarMonth}
                numberOfMonths={isMobile ? 1 : 2}
                locale={de}
                modifiers={{ available: availableDays, blocked: blockedDays }}
                modifiersClassNames={{
                  available: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25',
                  blocked: 'bg-destructive/10 text-destructive/50',
                }}
                disabled={[{ before: new Date() }]}
                className="rounded-md border"
              />
            ) : (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={d => { setSelectedDate(d); setSelectedSlot(''); setDateRange(undefined); }}
                onMonthChange={setCalendarMonth}
                numberOfMonths={isMobile ? 1 : 2}
                locale={de}
                modifiers={{ available: availableDays, blocked: blockedDays }}
                modifiersClassNames={{
                  available: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25',
                  blocked: 'bg-destructive/10 text-destructive/50',
                }}
                disabled={[{ before: new Date() }]}
                className="rounded-md border"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ SLOT-AUSWAHL / BUCHUNGSBEREICH ═══ */}
      {/* Pension: Range-Zusammenfassung */}
      {isBoarding && dateRange?.from && (
        <Card className="mb-4 border-teal-500/20">
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-sm font-semibold">Pensionsaufenthalt</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Von</Label>
                <p className="font-medium">{format(dateRange.from, 'dd. MMMM yyyy', { locale: de })}</p>
              </div>
              {dateRange.to && (
                <div>
                  <Label className="text-xs text-muted-foreground">Bis</Label>
                  <p className="font-medium">{format(dateRange.to, 'dd. MMMM yyyy', { locale: de })}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tier</Label>
                <Select value={selectedPet} onValueChange={setSelectedPet}>
                  <SelectTrigger><SelectValue placeholder="Tier wählen…" /></SelectTrigger>
                  <SelectContent>
                    {pets.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2"><PawPrint className="h-3 w-3" />{p.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Anmerkungen</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Besondere Wünsche…" rows={2} />
              </div>
            </div>

            <Button onClick={handleBooking} className="w-full" disabled={!selectedPet || !dateRange.to || createBooking.isPending}>
              {createBooking.isPending ? 'Wird gesendet…' : 'Termin anfragen'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Einzel-Service: Tagesauswahl + Zeitslots */}
      {!isBoarding && selectedDate && slotsForDate.length > 0 && (
        <Card className="mb-4 border-teal-500/20">
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-sm font-semibold">
              Termin am {format(selectedDate, 'dd. MMMM yyyy', { locale: de })}
            </h3>

            <div className="flex flex-wrap gap-2">
              {slotsForDate.map(slot => (
                <Button
                  key={slot.id}
                  variant={selectedSlot === slot.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSlot(slot.id)}
                >
                  {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tier</Label>
                <Select value={selectedPet} onValueChange={setSelectedPet}>
                  <SelectTrigger><SelectValue placeholder="Tier wählen…" /></SelectTrigger>
                  <SelectContent>
                    {pets.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2"><PawPrint className="h-3 w-3" />{p.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Anmerkungen</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Besondere Wünsche…" rows={2} />
              </div>
            </div>

            <Button onClick={handleBooking} className="w-full" disabled={!selectedSlot || !selectedPet || createBooking.isPending}>
              {createBooking.isPending ? 'Wird gesendet…' : 'Termin anfragen'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ═══ BUCHUNGSBESTÄTIGUNG ═══ */}
      {bookingSuccess && (
        <Card className="mb-4 border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Buchungsanfrage gesendet!</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{bookingSuccess.service}</span>
                  <span className="text-muted-foreground">Datum</span>
                  <span className="font-medium">{bookingSuccess.date}</span>
                  <span className="text-muted-foreground">Tier</span>
                  <span className="font-medium">{bookingSuccess.pet}</span>
                  <span className="text-muted-foreground">Preis</span>
                  <span className="font-medium">{bookingSuccess.price}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Der Anbieter wird Ihre Anfrage prüfen und bestätigen.</p>
                <Button variant="outline" size="sm" onClick={() => setBookingSuccess(null)} className="mt-2">
                  Weitere Buchung
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isBoarding && selectedDate && slotsForDate.length === 0 && (
        <Card className="mb-4">
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            An diesem Tag sind keine Zeitfenster verfügbar.
          </CardContent>
        </Card>
      )}

      {/* ═══ LIGHTBOX ═══ */}
      <Dialog open={lightboxIndex !== null} onOpenChange={() => setLightboxIndex(null)}>
        <DialogContent className="max-w-3xl p-2 bg-background/95 backdrop-blur">
          {lightboxIndex !== null && allImages[lightboxIndex] && (
            <div className="relative">
              <img
                src={allImages[lightboxIndex]}
                alt={`Galeriebild ${lightboxIndex + 1}`}
                className="w-full max-h-[80vh] object-contain rounded-lg"
              />
              {allImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90"
                    onClick={() => setLightboxIndex((lightboxIndex - 1 + allImages.length) % allImages.length)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90"
                    onClick={() => setLightboxIndex((lightboxIndex + 1) % allImages.length)}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
              <span className="absolute bottom-2 right-2 text-xs bg-background/70 px-2 py-1 rounded">
                {lightboxIndex + 1} / {allImages.length}
              </span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
