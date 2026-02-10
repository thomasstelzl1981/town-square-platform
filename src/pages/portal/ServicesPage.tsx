/**
 * Shops Page (MOD-16) — Amazon Business, OTTO Office, Miete24, Bestellungen
 */

import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { WorkflowSubbar, SERVICES_WORKFLOW_STEPS } from '@/components/shared/WorkflowSubbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  ShoppingCart, ExternalLink, Plug, WifiOff, Plus,
  Package, FileText, Upload, Clock, X, Search,
  Monitor, Printer, Laptop, Mouse, Armchair,
  Headphones,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Shop Configuration
// ---------------------------------------------------------------------------
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
    priceFormat: (i) => `ab ${(19.9 + i * 15).toFixed(2).replace('.', ',')} €/Monat`,
    extraInfo: 'Laufzeiten: 12 · 24 · 36 Monate · Inkl. Service & Austausch',
  },
};

const PRODUCT_ICONS = [Package, Printer, Armchair, ShoppingCart, Headphones, Monitor];

// ---------------------------------------------------------------------------
// Shop Tab — Visuell lebendig
// ---------------------------------------------------------------------------
function ShopTab({ shopKey }: { shopKey: string }) {
  const shop = SHOPS[shopKey];
  if (!shop) return null;

  return (
    <div className="space-y-6 p-4 max-w-5xl mx-auto">
      {/* Hero with gradient */}
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

      {/* Search bar */}
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

      {/* Product grid placeholders */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {shop.productLabels.map((label, i) => {
          const Icon = PRODUCT_ICONS[i % PRODUCT_ICONS.length];
          return (
            <Card key={i} className="group cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5">
              <CardContent className="p-3 flex flex-col items-center text-center gap-2">
                <div className="aspect-square w-full rounded-xl bg-muted/40 flex items-center justify-center">
                  <Icon className="h-8 w-8 text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors" />
                </div>
                <span className="text-xs font-medium leading-tight line-clamp-2">{label}</span>
                <span className={`text-xs ${shop.gradientClass} font-semibold`}>{shop.priceFormat(i)}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Integration — collapsed accordion */}
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bestellungen Tab — Widget-Pattern
// ---------------------------------------------------------------------------
const ORDER_STATUSES = ['Entwurf', 'Eingereicht', 'Bestellt', 'Versendet', 'Abgeschlossen', 'Storniert'];
const SHOP_OPTIONS = ['Amazon Business', 'OTTO Office', 'Miete24'];
const POSITION_COLUMNS = ['Pos', 'Artikel', 'SKU', 'Menge', 'Einheit', 'EP netto', 'MwSt%', 'Σ netto', 'Σ brutto', 'Link', 'Bemerkung'];

function OrderDetail() {
  return (
    <div className="space-y-5">
      {/* Order header bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="text-xs gap-1.5 px-3 py-1">
          <FileText className="h-3 w-3" />
          Bestell-ID: —
        </Badge>
        <Badge variant="secondary" className="text-xs px-3 py-1">
          Entwurf
        </Badge>
        <span className="text-xs text-muted-foreground ml-auto">Erstellt: —</span>
      </div>

      {/* Header Fields */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Shop</Label>
              <select className="flex h-9 w-full rounded-xl border-0 bg-muted/60 dark:bg-muted/40 px-3 py-1.5 text-sm">
                <option value="">— Auswählen —</option>
                {SHOP_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <select className="flex h-9 w-full rounded-xl border-0 bg-muted/60 dark:bg-muted/40 px-3 py-1.5 text-sm">
                {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Auftraggeber</Label>
              <Input placeholder="Name" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Kostenstelle / Projekt</Label>
              <Input placeholder="z.B. KST-001" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bestelldatum</Label>
              <Input type="date" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Lieferdatum</Label>
              <Input type="date" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Zahlungsart</Label>
              <select className="flex h-9 w-full rounded-xl border-0 bg-muted/60 dark:bg-muted/40 px-3 py-1.5 text-sm">
                <option value="">— Auswählen —</option>
                <option>Rechnung</option>
                <option>Kreditkarte</option>
                <option>Lastschrift</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div className="space-y-1">
              <Label className="text-xs">Lieferadresse</Label>
              <Textarea placeholder="Straße, PLZ Ort" rows={2} className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Rechnungsadresse</Label>
              <Textarea placeholder="Straße, PLZ Ort" rows={2} className="text-sm" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <Label className="text-xs">Notizen</Label>
            <Textarea placeholder="Interne Bemerkungen…" rows={2} className="text-sm" />
          </div>
        </CardContent>
      </Card>

      {/* Positionen */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4" /> Positionen
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 pb-3">
          <table className="w-full text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-border/50">
                {POSITION_COLUMNS.map((col) => (
                  <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className={`border-b border-border/10 hover:bg-muted/20 ${i % 2 === 1 ? 'bg-muted/5' : ''}`}>
                  <td className="px-3 py-2 text-muted-foreground/60 w-10">{i + 1}</td>
                  {Array.from({ length: POSITION_COLUMNS.length - 1 }).map((_, j) => (
                    <td key={j} className="px-3 py-2">
                      <input className="w-full bg-transparent border-0 outline-none text-xs placeholder:text-muted-foreground/30 focus:placeholder:text-muted-foreground/50" placeholder="—" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Summenblock */}
      <Card className="bg-muted/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col items-end gap-1.5 text-sm">
            <div className="flex gap-6 items-center">
              <span className="text-muted-foreground text-xs">Zwischensumme netto</span>
              <span className="font-medium w-24 text-right">0,00 €</span>
            </div>
            <div className="flex gap-6 items-center">
              <span className="text-muted-foreground text-xs">MwSt Summe</span>
              <span className="font-medium w-24 text-right">0,00 €</span>
            </div>
            <div className="flex gap-6 items-center border-t border-border/40 pt-2 mt-1">
              <span className="font-bold text-sm">Gesamt brutto</span>
              <span className="font-bold w-24 text-right text-base">0,00 €</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verlauf + Anhänge */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" /> Verlauf
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xs text-muted-foreground">Noch keine Einträge</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Upload className="h-3.5 w-3.5" /> Anhänge
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="border-2 border-dashed border-border/30 rounded-xl p-4 flex flex-col items-center gap-1.5 text-muted-foreground">
              <Upload className="h-5 w-5 opacity-40" />
              <span className="text-xs">Dateien ablegen oder klicken</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BestellungenTab() {
  const [activeTab, setActiveTab] = useState('order-1');

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      {/* Order list header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Bestellungen</h2>
          <p className="text-xs text-muted-foreground">Verwalten Sie Ihre Bestellungen als Widgets</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => console.log('Neue Bestellung')}>
          <Plus className="h-4 w-4" />
          Neue Bestellung
        </Button>
      </div>

      {/* Widget-pattern tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap gap-1 bg-muted/30 p-1">
          <TabsTrigger value="order-1" className="gap-2 text-xs px-3">
            <FileText className="h-3 w-3" />
            Bestellung #—
            <X className="h-3 w-3 ml-1 opacity-40" />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="order-1" className="mt-4">
          <OrderDetail />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function ServicesPage() {
  return (
    <div className="flex flex-col h-full">
      <WorkflowSubbar steps={SERVICES_WORKFLOW_STEPS} moduleBase="services" />
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route index element={<Navigate to="amazon" replace />} />
          <Route path="amazon" element={<ShopTab shopKey="amazon" />} />
          <Route path="otto-office" element={<ShopTab shopKey="otto-office" />} />
          <Route path="miete24" element={<ShopTab shopKey="miete24" />} />
          <Route path="bestellungen" element={<BestellungenTab />} />
          <Route path="*" element={<Navigate to="/portal/services" replace />} />
        </Routes>
      </div>
    </div>
  );
}
