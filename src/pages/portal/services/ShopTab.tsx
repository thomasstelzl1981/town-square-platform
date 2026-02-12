import { DESIGN } from '@/config/designManifest';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ShoppingCart, ExternalLink, Plug, WifiOff, Search } from 'lucide-react';

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

export default function ShopTab({ shopKey }: { shopKey: string }) {
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
