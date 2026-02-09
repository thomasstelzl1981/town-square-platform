/**
 * PV Plant Detail — Akte/Dossier view (Sections A-H)
 */
import { useParams, useNavigate } from 'react-router-dom';
import { usePvPlant, usePvPlants } from '@/hooks/usePvPlants';
import { usePvMonitoring } from '@/hooks/usePvMonitoring';
import { generate24hCurve } from '@/components/photovoltaik/DemoLiveGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Sun, MapPin, Shield, Zap, Gauge, Settings, Activity,
  FolderOpen, Building2, FileText,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

function InfoRow({ label, value }: { label: string; value: string | number | boolean | null | undefined }) {
  const display = value === null || value === undefined ? '—' : typeof value === 'boolean' ? (value ? 'Ja' : 'Nein') : String(value);
  return (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{display}</span>
    </div>
  );
}

export default function PVPlantDetail() {
  const { pvPlantId } = useParams<{ pvPlantId: string }>();
  const navigate = useNavigate();
  const { data: plant, isLoading } = usePvPlant(pvPlantId);
  const { plants } = usePvPlants();
  const { liveData } = usePvMonitoring(plant ? [plant] : []);
  const live = plant ? liveData.get(plant.id) : undefined;
  const curve = useMemo(() => generate24hCurve(plant?.kwp ?? 10), [plant?.kwp]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Anlage nicht gefunden.</p>
        <Button variant="link" onClick={() => navigate('/portal/photovoltaik/anlagen')}>Zurück</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal/photovoltaik/anlagen')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{plant.name}</h2>
          <p className="text-sm text-muted-foreground">{plant.city} · {plant.kwp} kWp · {plant.wr_manufacturer || 'k.A.'}</p>
        </div>
        <Badge variant={plant.status === 'active' ? 'default' : 'secondary'}>
          {plant.status === 'active' ? 'Aktiv' : 'Inaktiv'}
        </Badge>
      </div>

      <Tabs defaultValue="stammdaten" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="stammdaten"><MapPin className="h-3.5 w-3.5 mr-1" />Standort</TabsTrigger>
          <TabsTrigger value="mastr"><Shield className="h-3.5 w-3.5 mr-1" />MaStR</TabsTrigger>
          <TabsTrigger value="netz"><Building2 className="h-3.5 w-3.5 mr-1" />Netzbetreiber</TabsTrigger>
          <TabsTrigger value="zaehler"><Gauge className="h-3.5 w-3.5 mr-1" />Zähler</TabsTrigger>
          <TabsTrigger value="technik"><Settings className="h-3.5 w-3.5 mr-1" />Technik</TabsTrigger>
          <TabsTrigger value="monitoring"><Activity className="h-3.5 w-3.5 mr-1" />Monitoring</TabsTrigger>
          <TabsTrigger value="dokumente"><FolderOpen className="h-3.5 w-3.5 mr-1" />Dokumente</TabsTrigger>
        </TabsList>

        {/* B) Standort */}
        <TabsContent value="stammdaten">
          <Card>
            <CardHeader><CardTitle className="text-base">Standort</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="Straße" value={plant.street ? `${plant.street} ${plant.house_number || ''}`.trim() : null} />
              <InfoRow label="PLZ" value={plant.postal_code} />
              <InfoRow label="Ort" value={plant.city} />
              <InfoRow label="Notizen" value={plant.location_notes} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* C) MaStR */}
        <TabsContent value="mastr">
          <Card>
            <CardHeader><CardTitle className="text-base">Bundesnetzagentur / MaStR</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="MaStR Zugang vorhanden" value={plant.mastr_account_present} />
              <InfoRow label="MaStR Anlagen-ID" value={plant.mastr_plant_id} />
              <InfoRow label="MaStR Einheit-ID" value={plant.mastr_unit_id} />
              <InfoRow label="Registrierungsstatus" value={plant.mastr_status} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* D) Netzbetreiber */}
        <TabsContent value="netz">
          <Card>
            <CardHeader><CardTitle className="text-base">Energieversorger / Netzbetreiber</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="Netzbetreiber" value={plant.grid_operator} />
              <InfoRow label="Stromlieferant" value={plant.energy_supplier} />
              <InfoRow label="Kundennummer" value={plant.customer_reference} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* E) Zähler */}
        <TabsContent value="zaehler">
          <Card>
            <CardHeader><CardTitle className="text-base">Einspeisezähler</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="Zählernummer" value={plant.feed_in_meter_no} />
              <InfoRow label="Messstellenbetreiber" value={plant.feed_in_meter_operator} />
              <InfoRow label="Startstand" value={plant.feed_in_start_reading} />
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-base">Bezugszähler</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="Zählernummer" value={plant.consumption_meter_no} />
              <InfoRow label="Messstellenbetreiber" value={plant.consumption_meter_operator} />
              <InfoRow label="Startstand" value={plant.consumption_start_reading} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* F) Technik */}
        <TabsContent value="technik">
          <Card>
            <CardHeader><CardTitle className="text-base">Technik</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="PV-Leistung" value={plant.kwp ? `${plant.kwp} kWp` : null} />
              <InfoRow label="WR-Hersteller" value={plant.wr_manufacturer} />
              <InfoRow label="WR-Modell" value={plant.wr_model} />
              <InfoRow label="Speicher vorhanden" value={plant.has_battery} />
              <InfoRow label="Speicher-Kapazität" value={plant.battery_kwh ? `${plant.battery_kwh} kWh` : null} />
              <InfoRow label="Inbetriebnahme" value={plant.commissioning_date} />
              <InfoRow label="Provider" value={plant.provider} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* G) Monitoring */}
        <TabsContent value="monitoring">
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card><CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Leistung</p>
                <p className="text-lg font-bold font-mono">{live?.currentPowerW.toLocaleString('de-DE') ?? '—'} <span className="text-xs font-normal">W</span></p>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Ertrag heute</p>
                <p className="text-lg font-bold font-mono">{live?.energyTodayKwh.toLocaleString('de-DE') ?? '—'} <span className="text-xs font-normal">kWh</span></p>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Monatsertrag</p>
                <p className="text-lg font-bold font-mono">{live?.energyMonthKwh.toLocaleString('de-DE') ?? '—'} <span className="text-xs font-normal">kWh</span></p>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={live?.isOnline ? 'default' : 'secondary'} className="mt-1">
                  {live?.isOnline ? 'Online' : 'Offline'}
                </Badge>
              </CardContent></Card>
            </div>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Tageskurve</CardTitle></CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={curve}>
                      <defs>
                        <linearGradient id="grad-detail" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="hour" tickFormatter={(v) => `${v}h`} fontSize={11} />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(1)} kW`} fontSize={11} width={50} />
                      <Tooltip formatter={(v: number) => [`${v.toLocaleString('de-DE')} W`, 'Leistung']} labelFormatter={(l) => `${l}:00 Uhr`} />
                      <Area type="monotone" dataKey="power_w" stroke="hsl(var(--primary))" fill="url(#grad-detail)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* H) Dokumente */}
        <TabsContent value="dokumente">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Dokumente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Die Dokumentenstruktur wurde automatisch angelegt. Verwalten Sie Ihre Unterlagen unter dem Reiter "Dokumente".
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate('/portal/photovoltaik/dokumente')}>
                <FileText className="h-4 w-4 mr-1" />
                Alle Dokumente anzeigen
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
