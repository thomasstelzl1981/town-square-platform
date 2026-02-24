/**
 * ShopTab — Zone 2 Shop page, now loading products from service_shop_products DB
 * Hardcoded product data removed. Products managed via Zone 1 Service Desk.
 */
import { useState } from 'react';
import { DESIGN } from '@/config/designManifest';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ShoppingCart, ExternalLink, Plug, WifiOff, Search, Camera, Shield } from 'lucide-react';
import { useActiveServiceProducts } from '@/hooks/useServiceShopProducts';

// ─── Shop UI configs (display only, no product data) ────────────────────────
interface ShopUiConfig {
  name: string;
  tagline: string;
  description: string;
  accentClass: string;
  gradientClass: string;
  searchPlaceholder: string;
  categories: string[];
  credentialFields: { label: string; placeholder: string }[];
  extraInfo?: string;
}

const SHOPS: Record<string, ShopUiConfig> = {
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
  },
  'bueroshop24': {
    name: 'Büroshop24',
    tagline: 'Bürobedarf schnell & günstig',
    description: 'Schreibwaren, Druckerzubehör, Büromöbel und Technik – günstiger B2B-Büroausstatter mit Tageslieferung.',
    accentClass: 'from-blue-500/20 to-blue-600/5',
    gradientClass: 'text-blue-600 dark:text-blue-400',
    searchPlaceholder: 'Büroshop24 Sortiment durchsuchen…',
    categories: ['Schreibwaren', 'Druckerzubehör', 'Büromöbel', 'Ordnung & Ablage', 'Technik', 'Versand'],
    credentialFields: [
      { label: 'ADCELL Publisher ID', placeholder: 'Publisher ID' },
      { label: 'ADCELL Program ID', placeholder: 'Program ID' },
    ],
    extraInfo: 'Über 100.000 Artikel · Tageslieferung · Kauf auf Rechnung · ADCELL Affiliate',
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
    extraInfo: 'Laufzeiten: 12 · 24 · 36 Monate · Inkl. Service & Austausch',
  },
};

// ─── Dynamic Product Grid (from DB) ─────────────────────────────────────────
function ProductGrid({ shopKey, accentClass }: { shopKey: string; accentClass: string }) {
  const { data: products = [], isLoading } = useActiveServiceProducts(shopKey);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = products.filter(p =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        </CardContent>
      </Card>

      <div className={DESIGN.WIDGET_GRID.FULL}>
        {filtered.map(product => (
          <Card
            key={product.id}
            className="group cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
            onClick={() => product.external_url && window.open(product.external_url, '_blank', 'noopener')}
          >
            <CardContent className="p-3 flex flex-col items-center text-center gap-2">
              <div className="aspect-square w-full rounded-xl bg-muted/40 overflow-hidden">
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
              </div>
              <span className="text-xs font-medium leading-tight line-clamp-2">{product.name}</span>
              {product.price_label && (
                <span className={`text-xs font-semibold ${accentClass}`}>{product.price_label}</span>
              )}
              {product.badge && (
                <Badge variant="secondary" className="text-[10px]">{product.badge}</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

// ─── Smart Home Shop (from DB) ──────────────────────────────────────────────
function SmartHomeShop() {
  return (
    <PageShell>
      <ModulePageHeader title="Smart Home Shop" description="Kompatible IP-Kameras für Ihr Zuhause-Dashboard" />

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
          </div>
        </div>
      </Card>

      <ProductGrid shopKey="smart-home" accentClass="text-violet-600 dark:text-violet-400" />

      <Card className="border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">Warum Reolink & Amcrest?</p>
          <p>
            Beide Hersteller nutzen ein offenes HTTP-Snapshot-Protokoll, das direkte Kamerabilder ohne Cloud-Abo ermöglicht.
            Die Kameras werden über Ihr lokales Netzwerk oder per Port-Forwarding / VPN mit dem Dashboard verbunden.
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}

// ─── Standard Shop component ────────────────────────────────────────────────
export default function ShopTab({ shopKey }: { shopKey: string }) {
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

      <ProductGrid shopKey={shopKey} accentClass={shop.gradientClass} />

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
