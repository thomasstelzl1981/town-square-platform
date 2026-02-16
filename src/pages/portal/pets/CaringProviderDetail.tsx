/**
 * CaringProviderDetail — Anbieter-Profil + Kalender + Slot-Buchung
 * Visuell komplett, Buchung vorerst nicht funktional verknüpft (Zone-1-Orchestrierung nötig).
 */
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Mail, Star, Clock, PawPrint } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { useProviderDetail } from '@/hooks/usePetProviderSearch';
import { useProviderAvailability, useProviderServices } from '@/hooks/usePetBookings';
import { usePets } from '@/hooks/usePets';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isBefore, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import type { DayContentProps } from 'react-day-picker';

const SERVICE_LABELS: Record<string, string> = {
  boarding: 'Pension',
  daycare: 'Tagesstätte',
  walking: 'Gassi-Service',
  grooming: 'Hundesalon',
  puppy_class: 'Welpenspielstunde',
};

export default function CaringProviderDetail() {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const { data: provider, isLoading } = useProviderDetail(providerId);
  const { data: availability = [] } = useProviderAvailability(providerId);
  const { data: services = [] } = useProviderServices(providerId);
  const { data: pets = [] } = usePets();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [selectedPet, setSelectedPet] = useState('');
  const [notes, setNotes] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Build availability map: day_of_week (0=Sun) → slots
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

  // Available and blocked days in current month
  const { availableDays, blockedDays } = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start, end });
    const today = startOfDay(new Date());
    const avail: Date[] = [];
    const blocked: Date[] = [];

    for (const day of days) {
      if (isBefore(day, today)) continue;
      const dow = getDay(day); // 0=Sun
      if (availabilityByDay.has(dow)) {
        avail.push(day);
      } else {
        blocked.push(day);
      }
    }
    return { availableDays: avail, blockedDays: blocked };
  }, [calendarMonth, availabilityByDay]);

  // Slots for selected date
  const slotsForDate = useMemo(() => {
    if (!selectedDate) return [];
    const dow = getDay(selectedDate);
    return availabilityByDay.get(dow) || [];
  }, [selectedDate, availabilityByDay]);

  const handleBooking = () => {
    toast.info('Buchung wird später über Zone 1 orchestriert. Feature kommt bald!');
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
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />Zurück
      </Button>

      {/* Cover Image / Placeholder */}
      <div className="w-full h-48 rounded-xl bg-gradient-to-br from-teal-500/20 via-emerald-500/10 to-primary/5 border border-border/30 mb-6 flex items-center justify-center">
        {(provider as any).cover_image_url ? (
          <img src={(provider as any).cover_image_url} alt={provider.company_name} className="w-full h-full object-cover rounded-xl" />
        ) : (
          <PawPrint className="h-16 w-16 text-muted-foreground/20" />
        )}
      </div>

      {/* Profile */}
      <div className="mb-8 space-y-4">
        <h1 className="text-2xl font-bold">{provider.company_name}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {provider.address && (
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{provider.address}</span>
          )}
          {provider.phone && (
            <a href={`tel:${provider.phone}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Phone className="h-4 w-4" />{provider.phone}
            </a>
          )}
          {provider.email && (
            <a href={`mailto:${provider.email}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Mail className="h-4 w-4" />{provider.email}
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
            <p className="text-sm text-muted-foreground">{provider.bio}</p>
          </div>
        )}

        {/* Services */}
        {services.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {services.map(s => (
              <Badge key={s.id} variant="secondary">
                {SERVICE_LABELS[s.category] || s.category} — {s.title}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Calendar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" />Verfügbarkeit
          </h3>

          <div className="flex items-start gap-3 mb-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-emerald-500/40 border border-emerald-500/60" />Verfügbar</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-destructive/40 border border-destructive/60" />Ausgebucht</span>
          </div>

          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={d => { setSelectedDate(d); setSelectedSlot(''); }}
            onMonthChange={setCalendarMonth}
            locale={de}
            modifiers={{
              available: availableDays,
              blocked: blockedDays,
            }}
            modifiersClassNames={{
              available: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25',
              blocked: 'bg-destructive/10 text-destructive/50',
            }}
            disabled={[{ before: new Date() }]}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {/* Slot Selection */}
      {selectedDate && slotsForDate.length > 0 && (
        <Card className="mb-6 border-teal-500/20">
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
                  <SelectTrigger>
                    <SelectValue placeholder="Tier wählen…" />
                  </SelectTrigger>
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
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Besondere Wünsche…"
                  rows={2}
                />
              </div>
            </div>

            <Button onClick={handleBooking} className="w-full" disabled={!selectedSlot || !selectedPet}>
              Termin anfragen
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedDate && slotsForDate.length === 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            An diesem Tag sind keine Zeitfenster verfügbar.
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
