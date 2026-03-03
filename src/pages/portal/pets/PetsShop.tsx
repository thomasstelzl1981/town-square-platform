/**
 * PetsShop — 4 CI-Widgets: Lennox Tracker, Lennox Style, Ernährung, Zooplus
 * ALL products loaded from service_shop_products DB (Zone 1 SSOT)
 */
import { useState } from 'react';
import { ShoppingCart, MapPin, ExternalLink, Radar, Store, PawPrint, Search, UtensilsCrossed, Activity, Shield, Battery, Droplets, Heart, Check } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import lennoxHeroImg from '@/assets/lennox-hero.jpg';
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
import { useActiveServiceProducts } from '@/hooks/useServiceShopProducts';

const SPECIES_LABELS: Record<string, string> = {
  dog: 'Hund', cat: 'Katze', bird: 'Vogel', rabbit: 'Kaninchen',
  hamster: 'Hamster', fish: 'Fisch', reptile: 'Reptil', horse: 'Pferd', other: 'Sonstiges',
};

type ShopWidget = 'tracker' | 'style' | 'ernaehrung' | 'zooplus';

const WIDGETS: { key: ShopWidget; title: string; icon: typeof Store; description: string; badge?: string }[] = [
  { key: 'tracker', title: 'Lennox Tracker', icon: Radar, description: 'GPS-Tracker für Ihr Tier bestellen' },
  { key: 'style', title: 'Lennox Style', icon: PawPrint, description: 'Premium Hundezubehör — eigene Kollektion' },
  { key: 'ernaehrung', title: 'Ernährung', icon: UtensilsCrossed, description: 'Lakefields — Naturbelassenes Hundefutter' },
  { key: 'zooplus', title: 'Zooplus', icon: Store, description: 'Premium Tierbedarf bei Zooplus' },
];

/* ── Generic Product Grid (from DB via service_shop_products) ─── */
function ProductGrid({ shopKey, accentColor }: { shopKey: string; accentColor: string }) {
  const { data: products = [], isLoading } = useActiveServiceProducts(shopKey);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubCat, setActiveSubCat] = useState<string | null>(null);

  const subCategories = [...new Set(products.map(p => p.sub_category).filter(Boolean))];
  const filtered = products.filter(p => {
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = !activeSubCat || p.sub_category === activeSubCat;
    return matchSearch && matchCat;
  });

  if (isLoading) return <div className="py-12 text-center text-sm text-muted-foreground">Lade Produkte…</div>;
  if (products.length === 0) return (
    <div className="py-12 text-center rounded-lg border border-dashed border-border">
      <p className="text-sm text-muted-foreground">Produkte werden in Kürze hinzugefügt.</p>
    </div>
  );

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10" placeholder="Produkte suchen…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          {subCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {subCategories.map(cat => (
                <Badge key={cat} variant={activeSubCat === cat ? 'default' : 'secondary'} className="cursor-pointer hover:bg-accent transition-colors text-xs" onClick={() => setActiveSubCat(prev => prev === cat ? null : cat)}>
                  {cat}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className={DESIGN.WIDGET_GRID.FULL}>
        {filtered.map(product => (
          <Card key={product.id} className="group cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5" onClick={() => product.external_url && window.open(product.external_url, '_blank')}>
            <CardContent className="p-3 flex flex-col items-center text-center gap-2">
              <div className="aspect-square w-full rounded-xl bg-muted/40 overflow-hidden relative">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ShoppingCart className="h-8 w-8 text-muted-foreground/30" /></div>
                )}
                {product.badge && <Badge className="absolute top-2 left-2 text-white text-[10px] border-0" style={{ backgroundColor: accentColor }}>{product.badge}</Badge>}
                {product.external_url && <div className="absolute top-2 right-2"><ExternalLink className="h-3.5 w-3.5 text-white/70 drop-shadow-md" /></div>}
              </div>
              <span className="text-xs font-medium leading-tight line-clamp-2">{product.name}</span>
              {product.price_label && <span className="text-xs font-semibold" style={{ color: accentColor }}>{product.price_label}</span>}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

/* ── Lennox Tracker Section ─── */
function TrackerSection() {
  const { data: trackerProducts = [], isLoading } = useActiveServiceProducts('pet-tracker');
  const trackers = trackerProducts.filter(p => p.sub_category === 'Tracker');
  const subscription = trackerProducts.find(p => p.sub_category === 'Abo');

  if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Lade Produkte…</div>;

  return (
    <>
      {/* Hero */}
      <Card className="overflow-hidden border-0 relative">
        <div className="relative">
          <img src={lennoxHeroImg} alt="Lennox GPS Tracker – Hund mit Tracker" className="w-full h-64 sm:h-80 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-10">
            <Badge className="w-fit mb-3 bg-teal-500/90 text-white border-0 text-[10px]">GPS-Tracker</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Lennox GPS Tracker</h2>
            <p className="text-white/80 mt-2 max-w-md text-sm sm:text-base">Immer wissen, wo dein Liebling ist. Echtzeit-Ortung, Aktivitätstracking und Geofencing.</p>
          </div>
        </div>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { icon: MapPin, title: 'Live-Ortung', desc: 'Weltweite Echtzeit-Verfolgung per GPS, WLAN & Mobilfunk' },
          { icon: Activity, title: 'Aktivitätstracking', desc: 'Schritte, Ruhezeiten und Fitness deines Vierbeiners' },
          { icon: Shield, title: 'Geofencing', desc: 'Sichere Zonen definieren und Benachrichtigungen erhalten' },
          { icon: Battery, title: 'Bis 30 Tage Akku', desc: 'Intelligentes Power-Management, USB-C Laden' },
          { icon: Droplets, title: 'Wasserdicht IP67', desc: 'Robust bei Regen, Schlamm und Badespaß' },
          { icon: Heart, title: 'Gesundheitsdaten', desc: 'Schlaf, Aktivität und Auffälligkeiten erkennen' },
        ].map((f, i) => {
          const Icon = f.icon;
          return (
            <Card key={i} className="border-teal-500/10 hover:border-teal-500/30 transition-colors">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="p-2 rounded-lg bg-teal-500/10 w-fit"><Icon className="h-5 w-5 text-teal-600 dark:text-teal-400" /></div>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{f.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tracker Products */}
      {trackers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Unsere Tracker</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trackers.map(v => {
              const md = (v.metadata as Record<string, unknown>) ?? {};
              return (
                <Card key={v.id} className={`relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md ${v.badge === 'Bestseller' ? 'border-teal-500/40 shadow-[0_0_20px_-5px_hsl(180_60%_40%/0.2)]' : 'border-border/40'}`}>
                  {v.badge && <Badge className="absolute top-3 right-3 bg-teal-500 text-white border-0 text-[10px]">{v.badge}</Badge>}
                  <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden bg-muted/30">
                      {v.image_url && <img src={v.image_url} alt={v.name} className="w-full h-full object-contain" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{v.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{v.description}</p>
                      <div className="flex items-center justify-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        {md.weight && <span>{String(md.weight)}</span>}
                        {md.ip_rating && <span>• {String(md.ip_rating)}</span>}
                        {md.battery_days && <span>• {String(md.battery_days)} Tage Akku</span>}
                      </div>
                    </div>
                    <p className="text-xl font-bold text-teal-600 dark:text-teal-400">{v.price_label}</p>
                    {v.external_url && (
                      <Button variant="outline" size="sm" className="w-full gap-2 border-teal-500/30 hover:bg-teal-500/5" onClick={() => window.open(v.external_url!, '_blank')}>
                        <ExternalLink className="h-3.5 w-3.5" /> Details ansehen
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Single Subscription */}
      {subscription && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Abo-Modell</h3>
          <Card className="border-teal-500/20">
            <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-4">
              <div className="p-3 rounded-xl bg-teal-500/10">
                <Radar className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <p className="font-bold text-sm">{subscription.name}</p>
                  {subscription.badge && <Badge className="bg-teal-500 text-white border-0 text-[10px]">{subscription.badge}</Badge>}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{subscription.description}</p>
                {(() => {
                  const md = (subscription.metadata as Record<string, unknown>) ?? {};
                  const features = Array.isArray(md.features) ? md.features as string[] : [];
                  return features.length > 0 ? (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                      {features.map((f, i) => (
                        <span key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Check className="h-3 w-3 text-teal-500 flex-shrink-0" />{f}
                        </span>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
              <p className="text-xl font-bold text-teal-600 dark:text-teal-400 whitespace-nowrap">{subscription.price_label}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

export default function PetsShop() {
  const [activeWidget, setActiveWidget] = useState<ShopWidget | null>(null);
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
      <ModulePageHeader title="Shop" description="Produkte und Partner-Angebote für deine Tiere" />

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

      {/* ── Lennox Tracker ─────────────────────────── */}
      {activeWidget === 'tracker' && (
        <div className="space-y-6">
          <TrackerSection />
        </div>
      )}

      {/* ── Lennox Style (from DB) ─────────────────────── */}
      {activeWidget === 'style' && (
        <div className="space-y-4">
          <Card className="overflow-hidden border-0">
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm shadow-sm">
                  <PawPrint className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">LENNOX Style</h2>
                  <p className="text-sm text-muted-foreground mt-1">Premium Hundezubehör — Designed for Dogs</p>
                </div>
              </div>
            </div>
          </Card>
          <ProductGrid shopKey="pet-style" accentColor="hsl(160, 60%, 35%)" />
        </div>
      )}

      {/* ── Ernährung (from DB) ─────────────────────────── */}
      {activeWidget === 'ernaehrung' && (
        <div className="space-y-4">
          <Card className="overflow-hidden border-0">
            <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/5 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm shadow-sm">
                  <UtensilsCrossed className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-amber-600 dark:text-amber-400">Lakefields</h2>
                  <p className="text-sm text-muted-foreground mt-1">Hochwertiges und naturbelassenes Hundefutter</p>
                </div>
                <Button className="gap-2 shadow-sm" onClick={() => window.open('https://www.lakefields.de/Hundefutter/', '_blank')}>
                  <ExternalLink className="h-4 w-4" /> Shop öffnen
                </Button>
              </div>
            </div>
          </Card>
          <ProductGrid shopKey="pet-ernaehrung" accentColor="hsl(38, 92%, 50%)" />
        </div>
      )}

      {/* ── Zooplus (from DB) ────────────────────────── */}
      {activeWidget === 'zooplus' && (
        <div className="space-y-4">
          <Card className="overflow-hidden border-0">
            <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/5 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm shadow-sm">
                  <Store className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-orange-600 dark:text-orange-400">Zooplus</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Europas führender Online-Shop für Haustierbedarf</p>
                </div>
                <Button className="gap-2 shadow-sm bg-orange-600 hover:bg-orange-700 text-white" onClick={() => window.open('https://www.zooplus.de', '_blank')}>
                  <ExternalLink className="h-4 w-4" /> Zum Shop
                </Button>
              </div>
            </div>
          </Card>
          <ProductGrid shopKey="pet-zooplus" accentColor="hsl(25, 95%, 53%)" />
        </div>
      )}

      {/* Booking Dialog (kept for future use) */}
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
