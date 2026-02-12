import { useState } from 'react';
import { DESIGN } from '@/config/designManifest';
import { toast } from 'sonner';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Package, FileText, Upload, Clock, X, Plus } from 'lucide-react';

const ORDER_STATUSES = ['Entwurf', 'Eingereicht', 'Bestellt', 'Versendet', 'Abgeschlossen', 'Storniert'];
const SHOP_OPTIONS = ['Amazon Business', 'OTTO Office', 'Miete24'];
const POSITION_COLUMNS = ['Pos', 'Artikel', 'SKU', 'Menge', 'Einheit', 'EP netto', 'MwSt%', 'Σ netto', 'Σ brutto', 'Link', 'Bemerkung'];

function OrderDetail() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="text-xs gap-1.5 px-3 py-1">
          <FileText className="h-3 w-3" />
          Bestell-ID: —
        </Badge>
        <Badge variant="secondary" className="text-xs px-3 py-1">Entwurf</Badge>
        <span className="text-xs text-muted-foreground ml-auto">Erstellt: —</span>
      </div>

      <Card>
        <CardContent className="pt-5 pb-4">
          <div className={DESIGN.KPI_GRID.FULL}>
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
          <div className={`${DESIGN.FORM_GRID.FULL} mt-3`}>
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
                  <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">{col}</th>
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

      <div className={DESIGN.FORM_GRID.FULL}>
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

export default function BestellungenTab() {
  const [activeTab, setActiveTab] = useState('order-1');

  return (
    <PageShell>
      <ModulePageHeader
        title="Bestellungen"
        description="Verwalten Sie Ihre Bestellungen als Widgets"
        actions={
          <Button size="sm" className="gap-2" onClick={() => toast.info('Bestellformular wird vorbereitet…')}>
            <Plus className="h-4 w-4" />
            Neue Bestellung
          </Button>
        }
      />

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
    </PageShell>
  );
}
