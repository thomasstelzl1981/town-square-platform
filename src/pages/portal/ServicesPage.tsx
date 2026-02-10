/**
 * Shops Page (MOD-16) — Amazon Business, OTTO Office, Miete24, Bestellungen
 */

import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { WorkflowSubbar, SERVICES_WORKFLOW_STEPS } from '@/components/shared/WorkflowSubbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  ShoppingCart, ExternalLink, Plug, WifiOff, Plus,
  Package, FileText, Upload, Clock, X,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Shop Tab Template
// ---------------------------------------------------------------------------
interface ShopConfig {
  name: string;
  description: string;
  credentialFields: { label: string; placeholder: string }[];
}

const SHOPS: Record<string, ShopConfig> = {
  amazon: {
    name: 'Amazon Business',
    description: 'Bürobedarf, IT-Zubehör und mehr für Ihr Unternehmen über Amazon Business.',
    credentialFields: [
      { label: 'API Key', placeholder: 'PA-API Access Key' },
      { label: 'Partner Tag', placeholder: 'z.B. meinshop-21' },
    ],
  },
  'otto-office': {
    name: 'OTTO Office',
    description: 'Bürobedarf, Druckerzubehör und Büromöbel über OTTO Office.',
    credentialFields: [
      { label: 'Affiliate ID', placeholder: 'Awin Publisher ID' },
      { label: 'API Key', placeholder: 'OTTO Office API Key' },
    ],
  },
  miete24: {
    name: 'Miete24',
    description: 'IT-Geräte, Büroausstattung und Technik flexibel mieten statt kaufen.',
    credentialFields: [
      { label: 'Partner ID', placeholder: 'Miete24 Partner ID' },
      { label: 'API Secret', placeholder: 'Miete24 API Secret' },
    ],
  },
};

function ShopTab({ shopKey }: { shopKey: string }) {
  const shop = SHOPS[shopKey];
  if (!shop) return null;

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      {/* Hero Card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <ShoppingCart className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">{shop.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{shop.description}</p>
          </div>
          <Button className="gap-2" onClick={() => console.log(`Open ${shop.name}`)}>
            <ExternalLink className="h-4 w-4" />
            Shop öffnen
          </Button>
        </CardHeader>
      </Card>

      {/* Integration Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Integration</CardTitle>
          </div>
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <WifiOff className="h-3 w-3" />
            Nicht verbunden
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {shop.credentialFields.map((field) => (
            <div key={field.label} className="space-y-1.5">
              <Label>{field.label}</Label>
              <Input placeholder={field.placeholder} disabled />
            </div>
          ))}
          <Button variant="outline" disabled className="mt-2">
            Verbindung testen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bestellungen Tab — Widget-Pattern
// ---------------------------------------------------------------------------
const ORDER_STATUSES = ['Entwurf', 'Eingereicht', 'Bestellt', 'Versendet', 'Abgeschlossen', 'Storniert'];
const SHOP_OPTIONS = ['Amazon Business', 'OTTO Office', 'Miete24'];
const POSITION_COLUMNS = ['Pos', 'Artikel', 'SKU', 'Menge', 'Einheit', 'Einzelpreis netto', 'MwSt%', 'Gesamt netto', 'Gesamt brutto', 'Link', 'Bemerkung'];

function OrderDetail() {
  return (
    <div className="space-y-6">
      {/* Header Fields */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Bestell-ID</Label>
              <Input value="---" readOnly className="bg-muted/30" />
            </div>
            <div className="space-y-1.5">
              <Label>Shop</Label>
              <select className="flex h-10 w-full rounded-2xl border-0 bg-muted/60 dark:bg-muted/40 px-4 py-2 text-sm">
                <option value="">— Auswählen —</option>
                {SHOP_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select className="flex h-10 w-full rounded-2xl border-0 bg-muted/60 dark:bg-muted/40 px-4 py-2 text-sm">
                {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Auftraggeber</Label>
              <Input placeholder="Name" />
            </div>
            <div className="space-y-1.5">
              <Label>Kostenstelle / Projekt</Label>
              <Input placeholder="z.B. KST-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Zahlungsart</Label>
              <select className="flex h-10 w-full rounded-2xl border-0 bg-muted/60 dark:bg-muted/40 px-4 py-2 text-sm">
                <option value="">— Auswählen —</option>
                <option>Rechnung</option>
                <option>Kreditkarte</option>
                <option>Lastschrift</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Bestelldatum</Label>
              <Input type="date" />
            </div>
            <div className="space-y-1.5">
              <Label>Lieferdatum</Label>
              <Input type="date" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="space-y-1.5">
              <Label>Lieferadresse</Label>
              <Textarea placeholder="Straße, PLZ Ort" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Rechnungsadresse</Label>
              <Textarea placeholder="Straße, PLZ Ort" rows={2} />
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <Label>Notizen</Label>
            <Textarea placeholder="Interne Bemerkungen…" rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Positionen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" /> Positionen
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/40">
                {POSITION_COLUMNS.map((col) => (
                  <th key={col} className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border/20 hover:bg-muted/20">
                  <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                  {Array.from({ length: POSITION_COLUMNS.length - 1 }).map((_, j) => (
                    <td key={j} className="px-2 py-1.5">
                      <input className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground/40" placeholder="—" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Summenblock */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-end gap-1 text-sm">
            <div className="flex gap-8">
              <span className="text-muted-foreground">Zwischensumme netto:</span>
              <span className="font-medium w-28 text-right">0,00 €</span>
            </div>
            <div className="flex gap-8">
              <span className="text-muted-foreground">MwSt Summe:</span>
              <span className="font-medium w-28 text-right">0,00 €</span>
            </div>
            <div className="flex gap-8 border-t border-border/40 pt-1 mt-1">
              <span className="font-semibold">Gesamt brutto:</span>
              <span className="font-semibold w-28 text-right">0,00 €</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verlauf + Anhänge */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Verlauf
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Noch keine Einträge</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" /> Anhänge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border/40 rounded-xl p-6 flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-6 w-6" />
              <span className="text-sm">Dateien hier ablegen oder klicken</span>
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
          <p className="text-sm text-muted-foreground">Keine Bestellungen vorhanden</p>
        </div>
        <Button className="gap-2" onClick={() => console.log('Neue Bestellung')}>
          <Plus className="h-4 w-4" />
          Neue Bestellung
        </Button>
      </div>

      {/* Widget-pattern tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap gap-1 bg-muted/30 p-1">
          <TabsTrigger value="order-1" className="gap-2 text-sm">
            <FileText className="h-3.5 w-3.5" />
            Bestellung #—
            <X className="h-3 w-3 ml-1 opacity-50" />
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
  const content = moduleContents['MOD-16'];

  return (
    <div className="flex flex-col h-full">
      <WorkflowSubbar steps={SERVICES_WORKFLOW_STEPS} moduleBase="services" />
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route index element={<ModuleHowItWorks content={content} />} />
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
