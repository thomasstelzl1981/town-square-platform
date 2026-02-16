/**
 * PetsShop — Service-Katalog browsen + Buchung absenden
 */
import { useState } from 'react';
import { ShoppingCart, Clock, MapPin, Star, PawPrint } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useAllActiveServices, useCreateBooking, type PetService } from '@/hooks/usePetBookings';
import { usePets } from '@/hooks/usePets';

const CATEGORY_LABELS: Record<string, string> = {
  grooming: 'Pflege', boarding: 'Pension', walking: 'Gassi', training: 'Training',
  veterinary: 'Tierarzt', sitting: 'Betreuung', daycare: 'Tagesbetreuung',
  transport: 'Transport', nutrition: 'Ernährung', other: 'Sonstiges',
};

const SPECIES_LABELS: Record<string, string> = {
  dog: 'Hund', cat: 'Katze', bird: 'Vogel', rabbit: 'Kaninchen',
  hamster: 'Hamster', fish: 'Fisch', reptile: 'Reptil', horse: 'Pferd', other: 'Sonstiges',
};

export default function PetsShop() {
  const { data: services = [], isLoading } = useAllActiveServices();
  const { data: pets = [] } = usePets();
  const createBooking = useCreateBooking();

  const [selectedService, setSelectedService] = useState<PetService | null>(null);
  const [bookingForm, setBookingForm] = useState({ pet_id: '', scheduled_date: '', scheduled_time_start: '', client_notes: '' });
  const [filterCategory, setFilterCategory] = useState('all');

  const filtered = filterCategory === 'all' ? services : services.filter(s => s.category === filterCategory);
  const categories = [...new Set(services.map(s => s.category))];

  const handleBook = async () => {
    if (!selectedService || !bookingForm.pet_id || !bookingForm.scheduled_date) return;
    await createBooking.mutateAsync({
      pet_id: bookingForm.pet_id,
      service_id: selectedService.id,
      provider_id: selectedService.provider_id,
      scheduled_date: bookingForm.scheduled_date,
      scheduled_time_start: bookingForm.scheduled_time_start || undefined,
      duration_minutes: selectedService.duration_minutes,
      price_cents: selectedService.price_cents,
      client_notes: bookingForm.client_notes || undefined,
    });
    setSelectedService(null);
    setBookingForm({ pet_id: '', scheduled_date: '', scheduled_time_start: '', client_notes: '' });
  };

  return (
    <PageShell>
      <ModulePageHeader title="SHOP & SERVICES" description="Finden und buchen Sie Services für Ihre Tiere" />

      {/* Filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        <Badge
          variant={filterCategory === 'all' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilterCategory('all')}
        >
          Alle
        </Badge>
        {categories.map(c => (
          <Badge
            key={c}
            variant={filterCategory === c ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilterCategory(c)}
          >
            {CATEGORY_LABELS[c] || c}
          </Badge>
        ))}
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-12">Laden…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-medium text-muted-foreground">Keine Services verfügbar</h3>
          <p className="mt-2 text-sm text-muted-foreground/70">Aktuell sind keine aktiven Services im Katalog.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(service => (
            <Card key={service.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setSelectedService(service); setBookingForm({ pet_id: '', scheduled_date: '', scheduled_time_start: '', client_notes: '' }); }}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{service.title}</p>
                    <p className="text-xs text-muted-foreground">{(service as any).provider?.company_name}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{CATEGORY_LABELS[service.category] || service.category}</Badge>
                </div>
                {service.description && <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{service.duration_minutes} Min.</span>
                  <span className="font-medium text-foreground">
                    {service.price_type === 'on_request' ? 'Auf Anfrage' : `${(service.price_cents / 100).toFixed(2)} €`}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Dialog */}
      <Dialog open={!!selectedService} onOpenChange={open => { if (!open) setSelectedService(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Service buchen: {selectedService?.title}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Tier auswählen *</Label>
              <Select value={bookingForm.pet_id} onValueChange={v => setBookingForm(f => ({ ...f, pet_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Tier wählen…" /></SelectTrigger>
                <SelectContent>
                  {pets.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2"><PawPrint className="h-3 w-3" />{p.name} ({SPECIES_LABELS[p.species] || p.species})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Datum *</Label>
                <Input type="date" value={bookingForm.scheduled_date} onChange={e => setBookingForm(f => ({ ...f, scheduled_date: e.target.value }))} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <Label>Uhrzeit</Label>
                <Input type="time" value={bookingForm.scheduled_time_start} onChange={e => setBookingForm(f => ({ ...f, scheduled_time_start: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Anmerkungen</Label>
              <Textarea value={bookingForm.client_notes} onChange={e => setBookingForm(f => ({ ...f, client_notes: e.target.value }))} placeholder="Besondere Wünsche…" rows={2} />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <div className="text-sm">
                <span className="text-muted-foreground">Preis: </span>
                <span className="font-medium">
                  {selectedService?.price_type === 'on_request' ? 'Auf Anfrage' : `${((selectedService?.price_cents || 0) / 100).toFixed(2)} €`}
                </span>
              </div>
              <Button onClick={handleBook} disabled={createBooking.isPending || !bookingForm.pet_id || !bookingForm.scheduled_date}>
                Buchung anfragen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
