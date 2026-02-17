/**
 * PetsShop — 4 CI-Widgets: Ernährung, Lennox Tracker, Lennox Style, Fressnapf
 */
import { useState } from 'react';
import { ShoppingCart, MapPin, ExternalLink, Radar, Store, PawPrint, Clock, Search, Plug, WifiOff, UtensilsCrossed, Activity, Shield, Battery, Droplets, Heart, Check } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import lennoxHeroImg from '@/assets/lennox-hero.jpg';
import lennoxProductImg from '@/assets/lennox-tracker-product.jpg';
import lennoxLifestyleImg from '@/assets/lennox-lifestyle.jpg';
import lennoxStyleProductsImg from '@/assets/lennox-style-products.png';
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

const SPECIES_LABELS: Record<string, string> = {
  dog: 'Hund', cat: 'Katze', bird: 'Vogel', rabbit: 'Kaninchen',
  hamster: 'Hamster', fish: 'Fisch', reptile: 'Reptil', horse: 'Pferd', other: 'Sonstiges',
};

const CATEGORY_LABELS: Record<string, string> = {
  grooming: 'Pflege', boarding: 'Pension', walking: 'Gassi', training: 'Training',
  veterinary: 'Tierarzt', sitting: 'Betreuung', daycare: 'Tagesbetreuung',
  transport: 'Transport', nutrition: 'Ernährung', other: 'Sonstiges',
};

/* ── Lakefields product data ─────────────────────────────── */
const LAKEFIELDS_CATEGORIES = ['Nassfutter', 'Trockenfutter', 'Snacks', 'Ergänzungsfuttermittel', 'Welpenfutter', 'Best-Seller'];

const LAKEFIELDS_PRODUCTS = [
  {
    name: 'Nassfutter-Menü Wild (400 g)',
    price: '3,89 €',
    image: 'https://lakefields.b-cdn.net/media/f3/de/f5/1761171770/nassfutter-wild-adult-lf-an1140_17611717700602593.webp?ts=1761171770',
    url: 'https://www.lakefields.de/Hundefutter/Nassfutter/Adult-Menue-Wild-400-g',
    category: 'Nassfutter',
  },
  {
    name: 'Nassfutter-Menü Rind (400 g)',
    price: '3,69 €',
    image: 'https://lakefields.b-cdn.net/media/04/bc/54/1761171799/nassfutter-rind-adult-lf-an2140_17611717992052295.webp?ts=1761171799',
    url: 'https://www.lakefields.de/Hundefutter/Nassfutter/Adult-Menue-Rind-400-g',
    category: 'Nassfutter',
  },
  {
    name: 'Nassfutter-Menü Lamm (400 g)',
    price: '3,89 €',
    image: 'https://lakefields.b-cdn.net/media/50/b4/4e/1761171618/nassfutter-lamm-adult-lf-an3140_1761171618393151.webp?ts=1761171618',
    url: 'https://www.lakefields.de/Hundefutter/Nassfutter/Adult-Menue-Lamm-400-g',
    category: 'Nassfutter',
  },
  {
    name: 'Nassfutter-Menü Huhn (400 g)',
    price: '3,69 €',
    image: 'https://lakefields.b-cdn.net/media/70/70/1d/1761171644/nassfutter-huhn-adult-lf-an4140_176117164369239.webp?ts=1761171644',
    url: 'https://www.lakefields.de/Hundefutter/Nassfutter/Adult-Menue-Huhn-400-g',
    category: 'Nassfutter',
  },
  {
    name: 'Nassfutter-Menü Pferd (400 g)',
    price: '4,29 €',
    image: 'https://lakefields.b-cdn.net/media/a7/b6/0b/1763104330/nassfutter-pferd-adult-lf-an7140_1763104329593948.webp?ts=1763104330',
    url: 'https://www.lakefields.de/Hundefutter/Nassfutter/Adult-Menue-Pferd-400-g',
    category: 'Nassfutter',
    badge: 'Neu',
  },
  {
    name: 'Nassfutter-Menü Rind Welpe (400 g)',
    price: '3,69 €',
    image: 'https://lakefields.b-cdn.net/media/3b/1c/02/1761171825/nassfutter-rind-welpe-lf-wn2140_17611718246539207.webp?ts=1761171825',
    url: 'https://www.lakefields.de/Hundefutter/Nassfutter/Welpe-Menue-Rind-400-g',
    category: 'Welpenfutter',
  },
];

type ShopWidget = 'shop' | 'lennox' | 'zooplus' | 'fressnapf';

const WIDGETS: { key: ShopWidget; title: string; icon: typeof Store; description: string; badge?: string }[] = [
  { key: 'shop', title: 'Ernährung', icon: UtensilsCrossed, description: 'Lakefields — Naturbelassenes Hundefutter' },
  { key: 'lennox', title: 'Lennox Tracker', icon: Radar, description: 'GPS-Tracker für Ihr Tier bestellen' },
  { key: 'zooplus', title: 'Lennox Style', icon: PawPrint, description: 'Premium Hundezubehör — eigene Kollektion' },
  { key: 'fressnapf', title: 'Fressnapf', icon: ShoppingCart, description: 'Tierbedarf bei Fressnapf', badge: 'Partner' },
];

export default function PetsShop() {
  const [activeWidget, setActiveWidget] = useState<ShopWidget | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
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

  /* ── Lakefields filter logic ─────────────────────────────── */
  const filteredProducts = LAKEFIELDS_PRODUCTS.filter(p => {
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = !activeCategory || p.category === activeCategory;
    return matchSearch && matchCat;
  });

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

      {/* ── Lakefields Ernährung Shop ─────────────────────────── */}
      {activeWidget === 'shop' && (
        <div className="space-y-4">
          {/* Header Banner */}
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
              <p className="text-sm text-muted-foreground mt-4 max-w-2xl">
                Nassfutter, Trockenfutter, Snacks und Ergänzungsfuttermittel — aus nachhaltiger Produktion in Deutschland.
              </p>
            </div>
          </Card>

          {/* Search + Category Badges */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Lakefields Produkte suchen…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {LAKEFIELDS_CATEGORIES.map(cat => (
                  <Badge
                    key={cat}
                    variant={activeCategory === cat ? 'default' : 'secondary'}
                    className="cursor-pointer hover:bg-accent transition-colors text-xs"
                    onClick={() => setActiveCategory(prev => prev === cat ? null : cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Product Grid */}
          <div className={DESIGN.WIDGET_GRID.FULL}>
            {filteredProducts.map((product, i) => (
              <Card
                key={i}
                className="group cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
                onClick={() => window.open(product.url, '_blank')}
              >
                <CardContent className="p-3 flex flex-col items-center text-center gap-2">
                  <div className="aspect-square w-full rounded-xl bg-muted/40 overflow-hidden relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.badge && (
                      <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-[10px]">
                        {product.badge}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs font-medium leading-tight line-clamp-2">{product.name}</span>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">{product.price}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Integration Accordion */}
          <Accordion type="single" collapsible>
            <AccordionItem value="integration" className="border rounded-2xl px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Plug className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Integration & Zugangsdaten</span>
                  <Badge variant="outline" className="gap-1 text-muted-foreground ml-2">
                    <WifiOff className="h-3 w-3" />
                    Nicht verbunden
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2 pb-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Partner-ID</Label>
                    <Input placeholder="Lakefields Partner ID" disabled className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">API Key</Label>
                    <Input placeholder="Lakefields API Key" disabled className="text-sm" />
                  </div>
                  <Button variant="outline" disabled size="sm">
                    Verbindung testen
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

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

          {/* Integration Accordion */}
          <Accordion type="single" collapsible>
            <AccordionItem value="integration" className="border rounded-2xl px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Plug className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Integration & Zugangsdaten</span>
                  <Badge variant="outline" className="gap-1 text-muted-foreground ml-2">
                    <WifiOff className="h-3 w-3" />
                    Nicht verbunden
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2 pb-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Partner-ID</Label>
                    <Input placeholder="Lennox Partner ID" disabled className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">API Key</Label>
                    <Input placeholder="Lennox API Key" disabled className="text-sm" />
                  </div>
                  <Button variant="outline" disabled size="sm">
                    Verbindung testen
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      {activeWidget === 'zooplus' && (() => {
        const LENNOX_STYLE_PRODUCTS = [
          { name: 'LENNOX Premium Leather Leash', desc: 'Hochwertige, dreifach verstellbare Lederleine', price: '39,90 €', row: 0, col: 0, cat: 'Leinen & Geschirr' },
          { name: 'LENNOX Adjustable Harness Pro', desc: 'Ergonomisches Y-Geschirr mit optimaler Druckverteilung', price: '49,90 €', row: 0, col: 1, cat: 'Leinen & Geschirr' },
          { name: 'LENNOX Car Seat Protector', desc: 'Strapazierfähiger Autositzschutz für sichere Fahrten', price: '59,90 €', row: 0, col: 2, cat: 'Unterwegs' },
          { name: 'LENNOX Treat Pouch Elite', desc: 'Stilvoller Leckerlibeutel mit Schnellzugriff', price: '29,90 €', row: 0, col: 3, cat: 'Training' },
          { name: 'LENNOX Interactive Chew Toy', desc: 'Robustes Intelligenzspielzeug für mentale Auslastung', price: '24,90 €', row: 1, col: 0, cat: 'Spielzeug' },
          { name: 'LENNOX Luxury Blanket', desc: 'Weiche Premium-Decke für Komfort zuhause oder unterwegs', price: '44,90 €', row: 1, col: 1, cat: 'Betten & Decken' },
          { name: 'LENNOX Training Clicker Pro', desc: 'Präziser Trainings-Clicker für positives Hundetraining', price: '9,90 €', row: 1, col: 2, cat: 'Training' },
          { name: 'LENNOX Travel Water Bottle', desc: 'Praktische 2-in-1 Trinkflasche mit integriertem Napf', price: '19,90 €', row: 1, col: 3, cat: 'Unterwegs' },
          { name: 'LENNOX Orthopedic Dog Bed', desc: 'Komfortables Hundebett mit stützender Polsterung', price: '89,90 €', row: 2, col: 0, cat: 'Betten & Decken' },
          { name: 'LENNOX Portable Dog Bowl', desc: 'Leicht faltbarer Reisenapf für Ausflüge und Touren', price: '14,90 €', row: 2, col: 1, cat: 'Unterwegs' },
          { name: 'LENNOX Grooming Brush Set', desc: 'Effektives Fellpflege-Set für glänzendes Hundefell', price: '34,90 €', row: 2, col: 2, cat: 'Pflege' },
          { name: 'LENNOX Reflective Night Collar', desc: 'Reflektierendes Halsband für Sichtbarkeit bei Dunkelheit', price: '22,90 €', row: 2, col: 3, cat: 'Leinen & Geschirr' },
        ];
        const STYLE_CATEGORIES = ['Alle', 'Leinen & Geschirr', 'Betten & Decken', 'Spielzeug', 'Unterwegs', 'Pflege', 'Training'];
        const [styleCat, setStyleCat] = [activeCategory, setActiveCategory];
        const filtered = LENNOX_STYLE_PRODUCTS.filter(p => !styleCat || styleCat === 'Alle' || p.cat === styleCat);

        return (
          <div className="space-y-4">
            {/* Header Banner */}
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
                <p className="text-sm text-muted-foreground mt-4 max-w-2xl">
                  12 handverlesene Produkte aus unserer eigenen Kollektion. Qualität, Design und Funktionalität für anspruchsvolle Hundebesitzer.
                </p>
              </div>
            </Card>

            {/* Category Badges */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {STYLE_CATEGORIES.map(cat => (
                    <Badge
                      key={cat}
                      variant={(styleCat === cat || (!styleCat && cat === 'Alle')) ? 'default' : 'secondary'}
                      className="cursor-pointer hover:bg-accent transition-colors text-xs"
                      onClick={() => setActiveCategory(cat === 'Alle' ? null : (prev => prev === cat ? null : cat))}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {filtered.map((product, i) => (
                <Card key={i} className="group cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 hover:border-emerald-500/30">
                  <CardContent className="p-3 flex flex-col gap-2">
                    <div className="relative aspect-square w-full rounded-xl bg-muted/40 overflow-hidden">
                      <img
                        src={lennoxStyleProductsImg}
                        alt={product.name}
                        className="absolute max-w-none group-hover:scale-105 transition-transform duration-300"
                        style={{
                          width: '400%',
                          height: '300%',
                          left: `${-product.col * 100}%`,
                          top: `${-product.row * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium leading-tight line-clamp-2">{product.name}</span>
                    <span className="text-[11px] text-muted-foreground line-clamp-1">{product.desc}</span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{product.price}</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Integration Accordion */}
            <Accordion type="single" collapsible>
              <AccordionItem value="integration" className="border rounded-2xl px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Plug className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Integration & Zugangsdaten</span>
                    <Badge variant="outline" className="gap-1 text-muted-foreground ml-2">
                      <WifiOff className="h-3 w-3" />
                      Nicht verbunden
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2 pb-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Shop-ID</Label>
                      <Input placeholder="Lennox Style Shop ID" disabled className="text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">API Key</Label>
                      <Input placeholder="Lennox Style API Key" disabled className="text-sm" />
                    </div>
                    <Button variant="outline" disabled size="sm">
                      Verbindung testen
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        );
      })()}

      {activeWidget === 'fressnapf' && (() => {
        const FRESSNAPF_CATEGORIES = ['Alle', 'Zahnpflege', 'Snacks', 'Futter', 'Pflege', 'Zubehör'];
        const FRESSNAPF_PRODUCTS = [
          { name: 'MultiFit Mint DentalCare Sticks Junior', price: '4,29 €', cat: 'Zahnpflege', badge: 'Exklusiv', url: 'https://www.fressnapf.de/p/multifit-mint-dentalcare-sticks-junior-multipack-28-stueck-1002921001/', image: 'https://media.os.fressnapf.com/cms/2024/04/Flyout-bilder-Dog-hund-xl.png?f=webp&t=prod_xxs' },
          { name: 'MultiFit Mint DentalCare Sticks S', price: '5,49 €', cat: 'Zahnpflege', badge: '4 Varianten', url: 'https://www.fressnapf.de/p/multifit-mint-dentalcare-sticks-multipack-s-1002921002/', image: 'https://media.os.fressnapf.com/cms/2024/04/Flyout-bilder-Cat-katze-xl.png?f=webp&t=prod_xxs' },
          { name: 'PREMIERE Dental Wrap Mini Rolls', price: '3,49 €', cat: 'Snacks', badge: 'Exklusiv', url: 'https://www.fressnapf.de/p/premiere-dental-wrap-mini-dental-rolls-8-stueck-1278304/', image: 'https://media.os.fressnapf.com/cms/2024/04/Flyout-kleintier-xl.png?f=webp&t=prod_xxs' },
          { name: 'TAKE CARE Zahncreme 100ml', price: '6,49 €', cat: 'Zahnpflege', badge: 'Exklusiv', url: 'https://www.fressnapf.de/p/take-care-zahncreme-100ml-1291566/', image: 'https://media.os.fressnapf.com/cms/2024/04/Flyout-bilder-bird-vogel-xl.png?f=webp&t=prod_xxs' },
          { name: 'TAKE CARE Silikon Finger', price: '8,49 €', cat: 'Pflege', badge: 'Exklusiv', url: 'https://www.fressnapf.de/p/take-care-silikon-finger-1291564/', image: 'https://media.os.fressnapf.com/cms/2024/04/Flyout-bilder-aqua-xl.png?f=webp&t=prod_xxs' },
          { name: 'TAKE CARE Zahn Lipid Gel', price: '13,99 €', cat: 'Zahnpflege', url: 'https://www.fressnapf.de/p/take-care-zahn-lipid-gel-1291567/', image: 'https://media.os.fressnapf.com/cms/2024/04/Flyout-bilder-terra-xl.png?f=webp&t=prod_xxs' },
          { name: 'TAKE CARE Zahnpflege Set', price: '12,49 €', cat: 'Pflege', badge: 'Exklusiv', url: 'https://www.fressnapf.de/p/take-care-zahnpflege-set-1291569/', image: 'https://media.os.fressnapf.com/cms/2024/04/Flyout-bilder-garden-garten-xl.png?f=webp&t=prod_xxs' },
          { name: 'TAKE CARE Zahnbürste', price: '6,49 €', cat: 'Pflege', badge: 'Exklusiv', url: 'https://www.fressnapf.de/p/take-care-zahnbuerste-1291568/', image: 'https://media.os.fressnapf.com/cms/2024/04/Flyout-bilder-VET-pet-health-xl.png?f=webp&t=prod_xxs' },
          { name: 'TAKE CARE Anti-Plaque Finger', price: '12,99 €', cat: 'Pflege', url: 'https://www.fressnapf.de/p/take-care-anti-plaque-finger-1291565/', image: 'https://media.os.fressnapf.com/cms/2024/04/Flyout-bilder-Dog-hund-xl.png?f=webp&t=prod_xxs' },
          { name: 'SELECT GOLD Sensitive Dental Snacks', price: '2,99 €', cat: 'Snacks', badge: 'Exklusiv', url: 'https://www.fressnapf.de/p/select-gold-sensitive-dental-snacks-alge-mini-99-g-1230943/', image: 'https://media.os.fressnapf.com/cms/2024/04/Flyout-bilder-Cat-katze-xl.png?f=webp&t=prod_xxs' },
        ];
        const [fCat, setFCat] = [activeCategory, setActiveCategory];
        const filtered = FRESSNAPF_PRODUCTS.filter(p => !fCat || fCat === 'Alle' || p.cat === fCat);

        return (
          <div className="space-y-4">
            {/* Header Banner */}
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
                    <p className="text-sm text-muted-foreground mt-1">Europas größte Fachmarktkette für Tierbedarf — über 31.000 Artikel</p>
                  </div>
                  <Button className="gap-2 shadow-sm bg-green-600 hover:bg-green-700 text-white" onClick={() => window.open('https://www.fressnapf.de', '_blank')}>
                    <ExternalLink className="h-4 w-4" />
                    Zum Shop
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4 max-w-2xl">
                  Futter, Snacks, Pflegeprodukte und Zubehör für Hund, Katze und Kleintiere. Über Awin-Affiliate verlinkt — Bestellungen direkt bei Fressnapf.
                </p>
              </div>
            </Card>

            {/* Category Badges */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {FRESSNAPF_CATEGORIES.map(cat => (
                    <Badge
                      key={cat}
                      variant={(fCat === cat || (!fCat && cat === 'Alle')) ? 'default' : 'secondary'}
                      className="cursor-pointer hover:bg-accent transition-colors text-xs"
                      onClick={() => setActiveCategory(cat === 'Alle' ? null : (prev => prev === cat ? null : cat))}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {filtered.map((product, i) => (
                <Card
                  key={i}
                  className="group cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 hover:border-green-500/30"
                  onClick={() => window.open(product.url, '_blank')}
                >
                  <CardContent className="p-3 flex flex-col gap-2">
                    <div className="relative aspect-square w-full rounded-xl bg-muted/40 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.badge && (
                        <Badge className="absolute top-2 left-2 bg-green-600 text-white text-[10px] border-0">
                          {product.badge}
                        </Badge>
                      )}
                      <div className="absolute top-2 right-2">
                        <ExternalLink className="h-3.5 w-3.5 text-white/70 drop-shadow-md" />
                      </div>
                    </div>
                    <span className="text-xs font-medium leading-tight line-clamp-2">{product.name}</span>
                    <span className="text-xs text-green-600 dark:text-green-400 font-semibold">{product.price}</span>
                  </CardContent>
                </Card>
              ))}
            </div>

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

            {/* Integration Accordion */}
            <Accordion type="single" collapsible>
              <AccordionItem value="integration" className="border rounded-2xl px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Plug className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Awin Integration</span>
                    <Badge variant="outline" className="gap-1 text-muted-foreground ml-2">
                      <WifiOff className="h-3 w-3" />
                      Nicht verbunden
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2 pb-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Awin Publisher-ID</Label>
                      <Input placeholder="Awin Publisher ID" disabled className="text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Awin API Key</Label>
                      <Input placeholder="Awin API Key" disabled className="text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Advertiser-ID (Fressnapf)</Label>
                      <Input placeholder="Fressnapf Advertiser ID" disabled className="text-sm" />
                    </div>
                    <Button variant="outline" disabled size="sm">
                      Verbindung testen
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        );
      })()}

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
