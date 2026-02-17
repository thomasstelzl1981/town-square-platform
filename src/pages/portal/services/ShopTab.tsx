import { DESIGN } from '@/config/designManifest';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShoppingCart, ExternalLink, Plug, WifiOff, Search, Camera, Info, Shield } from 'lucide-react';

import amazonPaper from '@/assets/services/amazon-paper.jpg';
import amazonUsbhub from '@/assets/services/amazon-usbhub.jpg';
import amazonChair from '@/assets/services/amazon-chair.jpg';
import amazonInk from '@/assets/services/amazon-ink.jpg';
import amazonHeadset from '@/assets/services/amazon-headset.jpg';
import amazonWhiteboard from '@/assets/services/amazon-whiteboard.jpg';
import ottoBinders from '@/assets/services/otto-binders.jpg';
import ottoToner from '@/assets/services/otto-toner.jpg';
import ottoDeskpad from '@/assets/services/otto-deskpad.jpg';
import ottoShredder from '@/assets/services/otto-shredder.jpg';
import ottoEnvelopes from '@/assets/services/otto-envelopes.jpg';
import ottoDesklamp from '@/assets/services/otto-desklamp.jpg';
import miete24Macbook from '@/assets/services/miete24-macbook.jpg';
import miete24Monitor from '@/assets/services/miete24-monitor.jpg';
import miete24Printer from '@/assets/services/miete24-printer.jpg';
import miete24M365 from '@/assets/services/miete24-m365.jpg';
import miete24Iphone from '@/assets/services/miete24-iphone.jpg';
import miete24Mouse from '@/assets/services/miete24-mouse.jpg';

// ─── Smart Home product catalog ─────────────────────────────────────────────
interface SmartHomeProduct {
  name: string;
  manufacturer: string;
  price: string;
  highlight: string;
  category: 'outdoor' | 'indoor' | 'baby';
  amazonUrl: string;
}

const SMART_HOME_PRODUCTS: SmartHomeProduct[] = [
  // Outdoor
  { name: 'RLC-810A', manufacturer: 'Reolink', price: '54,99 €', highlight: '4K PoE, Nachtsicht, wetterfest IP66', category: 'outdoor', amazonUrl: 'https://www.amazon.de/dp/B08B7XWKM3?tag=immoportal-21' },
  { name: 'RLC-520A', manufacturer: 'Reolink', price: '44,99 €', highlight: '5MP PoE Dome, kompakt & vandalensicher', category: 'outdoor', amazonUrl: 'https://www.amazon.de/dp/B09KZG8GG5?tag=immoportal-21' },
  { name: 'RLC-842A', manufacturer: 'Reolink', price: '79,99 €', highlight: '4K PoE Dome, Farb-Nachtsicht, IK10', category: 'outdoor', amazonUrl: 'https://www.amazon.de/dp/B0B5C5MVGL?tag=immoportal-21' },
  { name: 'IP4M-1026B', manufacturer: 'Amcrest', price: '49,99 €', highlight: '4MP PoE Bullet, IR-Nachtsicht 30m', category: 'outdoor', amazonUrl: 'https://www.amazon.de/dp/B083G9KT4C?tag=immoportal-21' },
  // Indoor
  { name: 'E1 Zoom', manufacturer: 'Reolink', price: '49,99 €', highlight: 'PTZ, 5MP, WLAN, 3× optischer Zoom', category: 'indoor', amazonUrl: 'https://www.amazon.de/dp/B07VD1DWG3?tag=immoportal-21' },
  { name: 'IP2M-841', manufacturer: 'Amcrest', price: '34,99 €', highlight: 'PTZ, 1080p, WLAN, 2-Wege-Audio', category: 'indoor', amazonUrl: 'https://www.amazon.de/dp/B0145OQTPG?tag=immoportal-21' },
  { name: 'Argus PT Ultra', manufacturer: 'Reolink', price: '89,99 €', highlight: 'Akku + Solar-Option, 4K, PTZ', category: 'indoor', amazonUrl: 'https://www.amazon.de/dp/B0BXJNJ58D?tag=immoportal-21' },
  // Baby
  { name: 'ASH21 (Apollo)', manufacturer: 'Amcrest', price: '39,99 €', highlight: 'Nachtlicht, Schlaflieder, 2-Wege-Audio', category: 'baby', amazonUrl: 'https://www.amazon.de/dp/B094GVYQFC?tag=immoportal-21' },
  { name: 'IP2M-841B (weiß)', manufacturer: 'Amcrest', price: '34,99 €', highlight: 'Indoor PTZ, leise Motoren, Privacymodus', category: 'baby', amazonUrl: 'https://www.amazon.de/dp/B0145OQTPG?tag=immoportal-21' },
  { name: 'E1 Pro', manufacturer: 'Reolink', price: '44,99 €', highlight: '4MP, WLAN, Personen-/Tiererkennung', category: 'indoor', amazonUrl: 'https://www.amazon.de/dp/B084BNNRL6?tag=immoportal-21' },
];

const CATEGORY_LABELS: Record<string, string> = {
  outdoor: 'Outdoor',
  indoor: 'Indoor',
  baby: 'Baby-Monitor',
};
const CATEGORY_COLORS: Record<string, string> = {
  outdoor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  indoor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  baby: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
};

// ─── Standard shop configs ──────────────────────────────────────────────────
interface ShopConfig {
  name: string;
  tagline: string;
  description: string;
  accentClass: string;
  gradientClass: string;
  searchPlaceholder: string;
  categories: string[];
  credentialFields: { label: string; placeholder: string }[];
  productLabels: string[];
  productImages: string[];
  priceFormat: (i: number) => string;
  extraInfo?: string;
}

const SHOPS: Record<string, ShopConfig> = {
  amazon: {
    name: 'Amazon Business',
    tagline: 'Millionen Produkte für Ihr Unternehmen',
    description: 'Bürobedarf, IT-Zubehör, Reinigungsmittel und mehr – mit Mengenrabatten und Rechnungskauf für Geschäftskunden.',
    accentClass: 'from-orange-500/20 to-orange-600/5',
    gradientClass: 'text-orange-600 dark:text-orange-400',
    searchPlaceholder: 'Produkte auf Amazon Business suchen…',
    categories: ['Bürobedarf', 'IT-Zubehör', 'Reinigung', 'Breakroom', 'Büromöbel', 'Elektronik'],
    credentialFields: [
      { label: 'PA-API Access Key', placeholder: 'AKIAIOSFODNN7...' },
      { label: 'Partner Tag', placeholder: 'z.B. meinshop-21' },
    ],
    productLabels: ['Druckerpapier A4 500 Blatt', 'USB-C Hub 7-in-1', 'Bürostuhl ergonomisch', 'Tintenpatrone Multipack', 'Headset Bluetooth', 'Whiteboard 90×60cm'],
    productImages: [amazonPaper, amazonUsbhub, amazonChair, amazonInk, amazonHeadset, amazonWhiteboard],
    priceFormat: (i) => `${(4.99 + i * 12.5).toFixed(2).replace('.', ',')} €`,
  },
  'otto-office': {
    name: 'OTTO Office',
    tagline: '75.000+ Artikel für Büro & Betrieb',
    description: 'Schreibwaren, Druckerzubehör, Büromöbel und Technik – Deutschlands großer B2B-Büroausstatter.',
    accentClass: 'from-blue-500/20 to-blue-600/5',
    gradientClass: 'text-blue-600 dark:text-blue-400',
    searchPlaceholder: 'OTTO Office Sortiment durchsuchen…',
    categories: ['Schreibwaren', 'Druckerzubehör', 'Büromöbel', 'Ordnung & Ablage', 'Technik', 'Versand'],
    credentialFields: [
      { label: 'Affiliate ID (Awin)', placeholder: 'Publisher ID' },
      { label: 'API Key', placeholder: 'OTTO Office API Key' },
    ],
    productLabels: ['Ordner A4 breit 10er-Pack', 'Lasertoner schwarz XL', 'Schreibtischunterlage', 'Aktenvernichter P-4', 'Briefumschläge DL 500St', 'LED-Schreibtischlampe'],
    productImages: [ottoBinders, ottoToner, ottoDeskpad, ottoShredder, ottoEnvelopes, ottoDesklamp],
    priceFormat: (i) => `${(3.49 + i * 8.9).toFixed(2).replace('.', ',')} €`,
    extraInfo: '75.000+ Artikel · Lieferung ab 1 Tag · Kauf auf Rechnung',
  },
  miete24: {
    name: 'Miete24',
    tagline: 'IT & Bürogeräte flexibel mieten',
    description: 'Laptops, Monitore, Drucker und Software flexibel mieten statt kaufen – ab 12 Monaten Laufzeit, inklusive Service.',
    accentClass: 'from-emerald-500/20 to-emerald-600/5',
    gradientClass: 'text-emerald-600 dark:text-emerald-400',
    searchPlaceholder: 'Geräte zum Mieten suchen…',
    categories: ['Laptops', 'Monitore', 'Drucker', 'Software', 'Smartphones', 'Zubehör'],
    credentialFields: [
      { label: 'Partner ID', placeholder: 'Miete24 Partner ID' },
      { label: 'API Secret', placeholder: 'Miete24 API Secret' },
    ],
    productLabels: ['MacBook Pro 14" M3', 'Dell UltraSharp 27" 4K', 'HP LaserJet Pro MFP', 'Microsoft 365 Business', 'iPhone 15 Pro', 'Logitech MX Master 3S'],
    productImages: [miete24Macbook, miete24Monitor, miete24Printer, miete24M365, miete24Iphone, miete24Mouse],
    priceFormat: (i) => `ab ${(19.9 + i * 15).toFixed(2).replace('.', ',')} €/Monat`,
    extraInfo: 'Laufzeiten: 12 · 24 · 36 Monate · Inkl. Service & Austausch',
  },
};

// ─── Smart Home Shop component ──────────────────────────────────────────────
function SmartHomeShop() {
  return (
    <PageShell>
      <ModulePageHeader title="Smart Home Shop" description="Kompatible IP-Kameras für Ihr Zuhause-Dashboard" />

      {/* Hero */}
      <Card className="overflow-hidden border-0">
        <div className="bg-gradient-to-br from-violet-500/20 to-violet-600/5 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm shadow-sm">
              <Camera className="h-7 w-7 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-violet-600 dark:text-violet-400">Smart Home Kameras</h2>
              <p className="text-sm text-muted-foreground mt-1">Snapshot-kompatible IP-Kameras für Ihr Dashboard</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4 max-w-2xl">
            Diese Kameras sind direkt mit Ihrem Zuhause-Dashboard kompatibel. Verbinden Sie Ihre Kamera und sehen Sie
            Live-Snapshots direkt in der Übersicht — ohne Cloud-Abo, ohne Drittanbieter-App.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-0 gap-1">
              <Shield className="h-3 w-3" />Snapshot-kompatibel
            </Badge>
            <Badge variant="outline" className="text-xs">Reolink</Badge>
            <Badge variant="outline" className="text-xs">Amcrest</Badge>
          </div>
        </div>
      </Card>

      {/* Filter badges */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {['Alle', 'Outdoor', 'Indoor', 'Baby-Monitor'].map((cat) => (
              <Badge key={cat} variant="secondary" className="cursor-pointer hover:bg-accent transition-colors text-xs">
                {cat}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product grid */}
      <TooltipProvider>
        <div className={DESIGN.WIDGET_GRID.FULL}>
          {SMART_HOME_PRODUCTS.map((product, i) => (
            <Card key={i} className="group cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5">
              <CardContent className="p-4 flex flex-col gap-3">
                {/* Camera icon placeholder */}
                <div className="aspect-square w-full rounded-xl bg-muted/40 flex items-center justify-center">
                  <Camera className="h-12 w-12 text-muted-foreground/30" />
                </div>

                {/* Info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold leading-tight">{product.name}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground flex-shrink-0 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px] text-xs">
                        Dieses Gerät kann direkt in Ihrem Zuhause-Dashboard Kamerabilder anzeigen.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{product.manufacturer}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{product.highlight}</p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1">
                  <Badge className={`text-[10px] border-0 ${CATEGORY_COLORS[product.category]}`}>
                    {CATEGORY_LABELS[product.category]}
                  </Badge>
                  <Badge className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-0">
                    <Shield className="h-2.5 w-2.5 mr-0.5" />Snapshot
                  </Badge>
                </div>

                {/* Price + CTA */}
                <div className="flex items-center justify-between mt-auto pt-1">
                  <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{product.price}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[10px] h-7 gap-1"
                    onClick={() => window.open(product.amazonUrl, '_blank', 'noopener')}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Bei Amazon
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TooltipProvider>

      {/* Info note */}
      <Card className="border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">Warum Reolink & Amcrest?</p>
          <p>
            Beide Hersteller nutzen ein offenes HTTP-Snapshot-Protokoll, das direkte Kamerabilder ohne Cloud-Abo ermöglicht.
            Die Kameras werden über Ihr lokales Netzwerk oder per Port-Forwarding / VPN mit dem Dashboard verbunden.
          </p>
          <p>
            <strong>Voraussetzungen:</strong> Lokale IP-Adresse, Port-Forwarding oder VPN (z.B. FRITZ!Box WireGuard),
            HTTP Basic Auth aktiv.
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}

// ─── Standard Shop component ────────────────────────────────────────────────
export default function ShopTab({ shopKey }: { shopKey: string }) {
  // Smart Home gets its own layout
  if (shopKey === 'smart-home') return <SmartHomeShop />;

  const shop = SHOPS[shopKey];
  if (!shop) return null;

  return (
    <PageShell>
      <ModulePageHeader title="Shops" description="Einkaufen und Bestellen für Ihr Unternehmen" />
      <Card className="overflow-hidden border-0">
        <div className={`bg-gradient-to-br ${shop.accentClass} p-6 sm:p-8`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm shadow-sm">
              <ShoppingCart className={`h-7 w-7 ${shop.gradientClass}`} />
            </div>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${shop.gradientClass}`}>{shop.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{shop.tagline}</p>
            </div>
            <Button className="gap-2 shadow-sm" onClick={() => window.open('#', '_blank')}>
              <ExternalLink className="h-4 w-4" />
              Shop öffnen
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4 max-w-2xl">{shop.description}</p>
          {shop.extraInfo && (
            <p className={`text-xs font-medium mt-3 ${shop.gradientClass} opacity-80`}>{shop.extraInfo}</p>
          )}
        </div>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10" placeholder={shop.searchPlaceholder} />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {shop.categories.map((cat) => (
              <Badge key={cat} variant="secondary" className="cursor-pointer hover:bg-accent transition-colors text-xs">
                {cat}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className={DESIGN.WIDGET_GRID.FULL}>
        {shop.productLabels.map((label, i) => {
          const imgSrc = shop.productImages[i];
          return (
            <Card key={i} className="group cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5">
              <CardContent className="p-3 flex flex-col items-center text-center gap-2">
                <div className="aspect-square w-full rounded-xl bg-muted/40 overflow-hidden">
                  <img src={imgSrc} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <span className="text-xs font-medium leading-tight line-clamp-2">{label}</span>
                <span className={`text-xs ${shop.gradientClass} font-semibold`}>{shop.priceFormat(i)}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
              {shop.credentialFields.map((field) => (
                <div key={field.label} className="space-y-1.5">
                  <Label className="text-xs">{field.label}</Label>
                  <Input placeholder={field.placeholder} disabled className="text-sm" />
                </div>
              ))}
              <Button variant="outline" disabled size="sm">
                Verbindung testen
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </PageShell>
  );
}
