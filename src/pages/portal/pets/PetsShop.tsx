/**
 * PetsShop — 4 CI-Widgets: Unser Shop, Lennox Tracker, Zooplus, Fressnapf
 */
import { useState } from 'react';
import { ShoppingCart, MapPin, ExternalLink, Radar, Store, PawPrint, Clock } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAllActiveServices, useCreateBooking, type PetService } from '@/hooks/usePetBookings';
import { usePets } from '@/hooks/usePets';

const SPECIES_LABELS: Record<string, string> = {
  dog: 'Hund', cat: 'Katze', bird: 'Vogel', rabbit: 'Kaninchen',
  hamster: 'Hamster', fish: 'Fisch', reptile: 'Reptil', horse: 'Pferd', other: 'Sonstiges',
};

const CATEGORY_LABELS: Record<string, string> = {
  grooming: 'Pflege', boarding: 'Pension', walking: 'Gassi', training: 'Training',
  veterinary: 'Tierarzt', sitting: 'Betreuung', daycare: 'Tagesbetreuung',
  transport: 'Transport', nutrition: 'Ernährung', other: 'Sonstiges',
};

type ShopWidget = 'shop' | 'lennox' | 'zooplus' | 'fressnapf';

const WIDGETS: { key: ShopWidget; title: string; icon: typeof Store; description: string; badge?: string }[] = [
  { key: 'shop', title: 'Unser Shop', icon: Store, description: 'Produkte & Services aus unserem Katalog' },
  { key: 'lennox', title: 'Lennox Tracker', icon: Radar, description: 'GPS-Tracker für Ihr Tier bestellen' },
  { key: 'zooplus', title: 'Zooplus', icon: ShoppingCart, description: 'Tierbedarf bei Zooplus', badge: 'Partner' },
  { key: 'fressnapf', title: 'Fressnapf', icon: ShoppingCart, description: 'Tierbedarf bei Fressnapf', badge: 'Partner' },
];

export default function PetsShop() {
  const [activeWidget, setActiveWidget] = useState<ShopWidget | null>(null);
  const { data: services = [], isLoading } = useAllActiveServices();
  const { data: pets = [] } = usePets();
  const createBooking = useCreateBooking();

  const [selectedService, setSelectedService] = useState<PetService | null>(null);
  const [bookingForm, setBookingForm] = useState({ pet_id: '', scheduled_date: '', scheduled_time_start: '', client_notes: '' });

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

  const toggleWidget = (key: ShopWidget) => setActiveWidget(prev => prev === key ? null : key);

  return (
    <PageShell>
      <ModulePageHeader title="SHOP" description="Produkte und Partner-Angebote für Ihre Tiere" />

      {/* CI-Widget Navigation */}
      <WidgetGrid variant="widget" className="mb-6">
        {WIDGETS.map(w => {
          const Icon = w.icon;
          const isActive = activeWidget === w.key;
          return (
            <WidgetCell key={w.key}>
              <button
                onClick={() => toggleWidget(w.key)}
                className={`w-full h-full rounded-xl border p-4 flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer
                  ${isActive
                    ? 'border-teal-500/50 bg-teal-500/5 shadow-[0_0_20px_-5px_hsl(var(--teal-glow,180_60%_40%)/0.3)]'
                    : 'border-border/40 bg-card hover:border-teal-500/30 hover:bg-teal-500/5'
                  }`}
              >
                <div className={`p-3 rounded-lg ${isActive ? 'bg-teal-500/15 text-teal-600' : 'bg-muted/50 text-muted-foreground'}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium">{w.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{w.description}</p>
                </div>
                {w.badge && <Badge variant="outline" className="text-[10px]">{w.badge}</Badge>}
              </button>
            </WidgetCell>
          );
        })}
      </WidgetGrid>

      {/* Inline Content */}
      {activeWidget === 'shop' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Unser Katalog</h3>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Laden…</p>
          ) : services.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center">
              <Store className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">Aktuell keine Produkte verfügbar.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.map(service => (
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
        </div>
      )}

      {activeWidget === 'lennox' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Lennox GPS-Tracker</h3>
          <Card className="border-teal-500/20">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-xl bg-teal-500/10">
                  <Radar className="h-10 w-10 text-teal-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold">Lennox GPS-Tracker</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Wissen Sie immer, wo Ihr Liebling ist. Der Lennox Tracker bietet Echtzeit-GPS-Ortung, 
                    Aktivitätstracking und Geofencing — direkt in Ihrer Tierakte sichtbar.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="outline">Live-Standort</Badge>
                    <Badge variant="outline">Aktivitäts­tracking</Badge>
                    <Badge variant="outline">Geofencing</Badge>
                    <Badge variant="outline">Wasserdicht</Badge>
                  </div>
                </div>
              </div>
              <div className="border-t border-border/30 pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ab</p>
                  <p className="text-2xl font-bold">49,99 €</p>
                  <p className="text-xs text-muted-foreground">zzgl. 3,99 €/Monat Abo</p>
                </div>
                <Button className="gap-2" disabled>
                  <ShoppingCart className="h-4 w-4" /> Bald verfügbar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeWidget === 'zooplus' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Zooplus Partner-Shop</h3>
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Tierbedarf, Futter und Zubehör bei unserem Partner Zooplus.</p>
              <Button variant="outline" className="gap-2" onClick={() => window.open('https://www.zooplus.de', '_blank')}>
                <ExternalLink className="h-4 w-4" /> Zu Zooplus
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeWidget === 'fressnapf' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Fressnapf Partner-Shop</h3>
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Alles für Ihr Tier bei unserem Partner Fressnapf.</p>
              <Button variant="outline" className="gap-2" onClick={() => window.open('https://www.fressnapf.de', '_blank')}>
                <ExternalLink className="h-4 w-4" /> Zu Fressnapf
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Booking Dialog (for Unser Shop catalog) */}
      <Dialog open={!!selectedService} onOpenChange={open => { if (!open) setSelectedService(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bestellen: {selectedService?.title}</DialogTitle></DialogHeader>
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
                Bestellen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
