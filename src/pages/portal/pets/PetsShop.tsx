/**
 * PetsShop — 4 CI-Widgets: Ernährung, Lennox Tracker, Lennox Style, Fressnapf
 * Products loaded from pet_shop_products DB (SSOT from Z1)
 * LennoxTracker section remains hardcoded (product info, not shop items)
 */
import { useState } from 'react';
import { ShoppingCart, MapPin, ExternalLink, Radar, Store, PawPrint, Clock, Search, Plug, WifiOff, UtensilsCrossed, Activity, Shield, Battery, Droplets, Heart, Check } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import lennoxHeroImg from '@/assets/lennox-hero.jpg';
import lennoxProductImg from '@/assets/lennox-tracker-product.jpg';
import lennoxLifestyleImg from '@/assets/lennox-lifestyle.jpg';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAllActiveServices, useCreateBooking, type PetService } from '@/hooks/usePetBookings';
import { usePets } from '@/hooks/usePets';
import { useActiveShopProducts } from '@/hooks/usePetShopProducts';

const SPECIES_LABELS: Record<string, string> = {
  dog: 'Hund', cat: 'Katze', bird: 'Vogel', rabbit: 'Kaninchen',
  hamster: 'Hamster', fish: 'Fisch', reptile: 'Reptil', horse: 'Pferd', other: 'Sonstiges',
};

type ShopWidget = 'shop' | 'lennox' | 'zooplus' | 'fressnapf';

const WIDGETS: { key: ShopWidget; title: string; icon: typeof Store; description: string; badge?: string }[] = [
  { key: 'shop', title: 'Ernährung', icon: UtensilsCrossed, description: 'Lakefields — Naturbelassenes Hundefutter' },
  { key: 'lennox', title: 'Lennox Tracker', icon: Radar, description: 'GPS-Tracker für Ihr Tier bestellen' },
  { key: 'zooplus', title: 'Lennox Style', icon: PawPrint, description: 'Premium Hundezubehör — eigene Kollektion' },
  { key: 'fressnapf', title: 'Fressnapf', icon: ShoppingCart, description: 'Tierbedarf bei Fressnapf', badge: 'Partner' },
];

/* ── Generic Product Grid (from DB) ─────────────────── */
function ProductGrid({ category, accentColor }: { category: string; accentColor: string }) {
  const { data: products = [], isLoading } = useActiveShopProducts(category);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubCat, setActiveSubCat] = useState<string | null>(null);

  const subCategories = [...new Set(products.map(p => p.sub_category).filter(Boolean))];
  const filtered = products.filter(p => {
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = !activeSubCat || p.sub_category === activeSubCat;
    return matchSearch && matchCat;
  });

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Lade Produkte…</div>;
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center rounded-lg border border-dashed border-border">
        <p className="text-sm text-muted-foreground">Produkte werden in Kürze hinzugefügt.</p>
      </div>
    );
  }

  return (
    <>
      {/* Search + Category Badges */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Produkte suchen…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {subCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {subCategories.map(cat => (
                <Badge
                  key={cat}
                  variant={activeSubCat === cat ? 'default' : 'secondary'}
                  className="cursor-pointer hover:bg-accent transition-colors text-xs"
                  onClick={() => setActiveSubCat(prev => prev === cat ? null : cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Grid */}
      <div className={DESIGN.WIDGET_GRID.FULL}>
        {filtered.map(product => (
          <Card
            key={product.id}
            className="group cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
            onClick={() => product.external_url && window.open(product.external_url, '_blank')}
          >
            <CardContent className="p-3 flex flex-col items-center text-center gap-2">
              <div className="aspect-square w-full rounded-xl bg-muted/40 overflow-hidden relative">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                {product.badge && (
                  <Badge className={`absolute top-2 left-2 text-white text-[10px] border-0`} style={{ backgroundColor: accentColor }}>
                    {product.badge}
                  </Badge>
                )}
                {product.external_url && (
                  <div className="absolute top-2 right-2">
                    <ExternalLink className="h-3.5 w-3.5 text-white/70 drop-shadow-md" />
                  </div>
                )}
              </div>
              <span className="text-xs font-medium leading-tight line-clamp-2">{product.name}</span>
              {product.price_label && (
                <span className="text-xs font-semibold" style={{ color: accentColor }}>{product.price_label}</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
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

      {/* ── Ernährung (from DB) ─────────────────────────── */}
      {activeWidget === 'shop' && (
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
                  <ExternalLink className="h-4 w-4" />
                  Shop öffnen
                </Button>
              </div>
            </div>
          </Card>
          <ProductGrid category="ernaehrung" accentColor="hsl(38, 92%, 50%)" />
        </div>
      )}

      {/* ── Lennox Tracker (hardcoded product info) ─────── */}
      {activeWidget === 'lennox' && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <Card className="overflow-hidden border-0 relative">
            <div className="relative">
              <img src={lennoxHeroImg} alt="Lennox GPS Tracker – Hund mit Tracker" className="w-full h-64 sm:h-80 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-10">
                <Badge className="w-fit mb-3 bg-teal-500/90 text-white border-0 text-[10px]">GPS-Tracker</Badge>
                <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Lennox GPS Tracker</h2>
                <p className="text-white/80 mt-2 max-w-md text-sm sm:text-base">Immer wissen, wo dein Liebling ist. Echtzeit-Ortung, Aktivitätstracking und Geofencing.</p>
                <Button className="w-fit mt-4 gap-2 bg-teal-500 hover:bg-teal-600 text-white" disabled>
                  <ShoppingCart className="h-4 w-4" /> Jetzt vorbestellen
                </Button>
              </div>
            </div>
          </Card>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: MapPin, title: 'Live-Ortung', desc: 'Weltweite Echtzeit-Verfolgung per GPS, WLAN & Mobilfunk' },
              { icon: Activity, title: 'Aktivitätstracking', desc: 'Schritte, Ruhezeiten und Fitness deines Vierbeiners' },
              { icon: Shield, title: 'Geofencing', desc: 'Sichere Zonen definieren und Benachrichtigungen erhalten' },
              { icon: Battery, title: '14 Tage Akku', desc: 'Langlebiger Akku mit USB-C Schnellladung' },
              { icon: Droplets, title: 'Wasserdicht IP67', desc: 'Robust bei Regen, Schlamm und Badespaß' },
              { icon: Heart, title: 'Gesundheitswarnungen', desc: 'Auffälligkeiten bei Aktivität frühzeitig erkennen' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <Card key={i} className="border-teal-500/10 hover:border-teal-500/30 transition-colors">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="p-2 rounded-lg bg-teal-500/10 w-fit">
                      <Icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <p className="text-sm font-semibold">{f.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{f.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Product Variants */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Produktvarianten</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { name: 'LENNOX Mini', target: 'Kleine Hunde & Katzen bis 10 kg', price: '39,99 €', weight: '25 g', popular: false },
                { name: 'LENNOX Standard', target: 'Hunde von 10–25 kg', price: '49,99 €', weight: '35 g', popular: true },
                { name: 'LENNOX XL', target: 'Große Hunde ab 25 kg', price: '59,99 €', weight: '45 g', popular: false },
              ].map((v, i) => (
                <Card key={i} className={`relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md ${v.popular ? 'border-teal-500/40 shadow-[0_0_20px_-5px_hsl(180_60%_40%/0.2)]' : 'border-border/40'}`}>
                  {v.popular && <Badge className="absolute top-3 right-3 bg-teal-500 text-white border-0 text-[10px]">Beliebt</Badge>}
                  <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted/30">
                      <img src={lennoxProductImg} alt={v.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{v.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{v.target}</p>
                      <p className="text-[11px] text-muted-foreground">Gewicht: {v.weight}</p>
                    </div>
                    <p className="text-xl font-bold text-teal-600 dark:text-teal-400">{v.price}</p>
                    <Button variant="outline" size="sm" className="w-full gap-2 border-teal-500/30 hover:bg-teal-500/5" disabled>
                      <ShoppingCart className="h-3.5 w-3.5" /> Vorbestellen
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Subscription Plans */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Abo-Modelle</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { name: 'Basic', price: '2,99 €/Mo', features: ['Live-Ortung', 'Standort-Verlauf 24h', '1 Geofence-Zone'] },
                { name: 'Plus', price: '4,99 €/Mo', features: ['Live-Ortung', 'Standort-Verlauf 7 Tage', '5 Geofence-Zonen', 'Aktivitätstracking'], popular: true },
                { name: 'Premium', price: '6,99 €/Mo', features: ['Live-Ortung', 'Standort-Verlauf 365 Tage', 'Unbegrenzte Zonen', 'Aktivitäts- & Gesundheitstracking', 'Familien-Sharing'] },
              ].map((plan, i) => (
                <Card key={i} className={`transition-all ${(plan as any).popular ? 'border-teal-500/40' : 'border-border/40'}`}>
                  <CardContent className="p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm">{plan.name}</p>
                      {(plan as any).popular && <Badge className="bg-teal-500 text-white border-0 text-[10px]">Empfohlen</Badge>}
                    </div>
                    <p className="text-lg font-bold text-teal-600 dark:text-teal-400">{plan.price}</p>
                    <ul className="space-y-1.5">
                      {plan.features.map((f, fi) => (
                        <li key={fi} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Check className="h-3 w-3 text-teal-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Lifestyle Image */}
          <Card className="overflow-hidden border-0">
            <img src={lennoxLifestyleImg} alt="Lennox Tracker im Alltag" className="w-full h-48 sm:h-64 object-cover rounded-2xl" />
          </Card>
        </div>
      )}

      {/* ── Lennox Style (from DB) ─────────────────────── */}
      {activeWidget === 'zooplus' && (
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
          <ProductGrid category="lennox_style" accentColor="hsl(160, 60%, 35%)" />
        </div>
      )}

      {/* ── Fressnapf (from DB) ────────────────────────── */}
      {activeWidget === 'fressnapf' && (
        <div className="space-y-4">
          <Card className="overflow-hidden border-0">
            <div className="bg-gradient-to-br from-green-600/20 to-yellow-500/5 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm shadow-sm">
                  <Store className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">Fressnapf</h2>
                    <Badge variant="outline" className="text-[10px] border-yellow-500/50 text-yellow-600">Awin Partner</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Europas größte Fachmarktkette für Tierbedarf</p>
                </div>
                <Button className="gap-2 shadow-sm bg-green-600 hover:bg-green-700 text-white" onClick={() => window.open('https://www.fressnapf.de', '_blank')}>
                  <ExternalLink className="h-4 w-4" />
                  Zum Shop
                </Button>
              </div>
            </div>
          </Card>
          <ProductGrid category="fressnapf" accentColor="hsl(142, 71%, 29%)" />

          {/* Beliebte Kategorien */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Beliebte Kategorien</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { name: 'Hundenassfutter', url: 'https://www.fressnapf.de/c/hund/hundefutter/nassfutter/' },
                { name: 'Hundetrockenfutter', url: 'https://www.fressnapf.de/c/hund/hundefutter/trockenfutter/' },
                { name: 'Katzennassfutter', url: 'https://www.fressnapf.de/c/katze/katzenfutter/nassfutter/' },
                { name: 'Katzenstreu', url: 'https://www.fressnapf.de/c/katze/hygiene-pflege/katzenstreu/' },
                { name: 'Hundesnacks', url: 'https://www.fressnapf.de/c/hund/hundefutter/snacks/' },
                { name: 'Katzenspielzeug', url: 'https://www.fressnapf.de/c/katze/katzenspielzeug/' },
              ].map((cat, i) => (
                <Card
                  key={i}
                  className="group cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all hover:border-green-500/30"
                  onClick={() => window.open(cat.url, '_blank')}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <span className="text-sm font-medium">{cat.name}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-green-500 transition-colors" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
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
