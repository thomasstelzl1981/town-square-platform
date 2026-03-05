/**
 * ProviderBookingSection — Booking form for boarding (range) and single-service (slots)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PawPrint, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';

interface Slot { id: string; start_time: string; end_time: string }
interface Pet { id: string; name: string }
interface BookingSuccess { service: string; date: string; pet: string; price: string }

interface ProviderBookingSectionProps {
  isBoarding: boolean;
  dateRange?: DateRange;
  selectedDate?: Date;
  slotsForDate: Slot[];
  selectedSlot: string;
  onSlotChange: (id: string) => void;
  pets: Pet[];
  selectedPet: string;
  onPetChange: (id: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  onBook: () => void;
  isPending: boolean;
  bookingSuccess: BookingSuccess | null;
  onResetSuccess: () => void;
}

export function ProviderBookingSection({ isBoarding, dateRange, selectedDate, slotsForDate, selectedSlot, onSlotChange, pets, selectedPet, onPetChange, notes, onNotesChange, onBook, isPending, bookingSuccess, onResetSuccess }: ProviderBookingSectionProps) {
  const showBoardingForm = isBoarding && dateRange?.from;
  const showSlotForm = !isBoarding && selectedDate && slotsForDate.length > 0;
  const showNoSlots = !isBoarding && selectedDate && slotsForDate.length === 0;

  const petSelector = (
    <div>
      <Label>Tier</Label>
      <Select value={selectedPet} onValueChange={onPetChange}>
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
  );

  const notesField = (
    <div>
      <Label>Anmerkungen</Label>
      <Textarea value={notes} onChange={e => onNotesChange(e.target.value)} placeholder="Besondere Wünsche…" rows={2} />
    </div>
  );

  return (
    <>
      {showBoardingForm && (
        <Card className="mb-4 border-teal-500/20">
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-sm font-semibold">Pensionsaufenthalt</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div><Label className="text-xs text-muted-foreground">Von</Label><p className="font-medium">{format(dateRange!.from!, 'dd. MMMM yyyy', { locale: de })}</p></div>
              {dateRange?.to && <div><Label className="text-xs text-muted-foreground">Bis</Label><p className="font-medium">{format(dateRange.to, 'dd. MMMM yyyy', { locale: de })}</p></div>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{petSelector}{notesField}</div>
            <Button onClick={onBook} className="w-full" disabled={!selectedPet || !dateRange?.to || isPending}>{isPending ? 'Wird gesendet…' : 'Termin anfragen'}</Button>
          </CardContent>
        </Card>
      )}

      {showSlotForm && (
        <Card className="mb-4 border-teal-500/20">
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-sm font-semibold">Termin am {format(selectedDate!, 'dd. MMMM yyyy', { locale: de })}</h3>
            <div className="flex flex-wrap gap-2">
              {slotsForDate.map(slot => (
                <Button key={slot.id} variant={selectedSlot === slot.id ? 'default' : 'outline'} size="sm" onClick={() => onSlotChange(slot.id)}>
                  {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{petSelector}{notesField}</div>
            <Button onClick={onBook} className="w-full" disabled={!selectedSlot || !selectedPet || isPending}>{isPending ? 'Wird gesendet…' : 'Termin anfragen'}</Button>
          </CardContent>
        </Card>
      )}

      {bookingSuccess && (
        <Card className="mb-4 border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Buchungsanfrage gesendet!</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Service</span><span className="font-medium">{bookingSuccess.service}</span>
                  <span className="text-muted-foreground">Datum</span><span className="font-medium">{bookingSuccess.date}</span>
                  <span className="text-muted-foreground">Tier</span><span className="font-medium">{bookingSuccess.pet}</span>
                  <span className="text-muted-foreground">Preis</span><span className="font-medium">{bookingSuccess.price}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Der Anbieter wird Ihre Anfrage prüfen und bestätigen.</p>
                <Button variant="outline" size="sm" onClick={onResetSuccess} className="mt-2">Weitere Buchung</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showNoSlots && (
        <Card className="mb-4">
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">An diesem Tag sind keine Zeitfenster verfügbar.</CardContent>
        </Card>
      )}
    </>
  );
}
