/**
 * PV Plant Dossier — Full vertical scrollable Akte
 * All sections visible at once: KPIs, Monitoring, Standort, MaStR, Netz, Zähler, Technik, Dokumente
 * No tabs, no popups — one continuous flow.
 */
import { useMemo } from 'react';
import { DESIGN } from '@/config/designManifest';
import { PvPlant, usePvPlants } from '@/hooks/usePvPlants';
import { usePvMonitoring } from '@/hooks/usePvMonitoring';
import { generate24hCurve } from '@/components/photovoltaik/DemoLiveGenerator';
import { PV_REQUIRED_DOCS } from '@/hooks/usePvDMS';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sun, MapPin, Shield, Zap, Gauge, Settings, Activity,
  FolderOpen, Building2, Folder, Circle, BatteryCharging, TrendingUp, WifiOff,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function InfoRow({ label, value, editable, onChange }: {
  label: string;
  value: string | number | boolean | null | undefined;
  editable?: boolean;
  onChange?: (val: string) => void;
}) {
  const display = value === null || value === undefined ? '—' : typeof value === 'boolean' ? (value ? 'Ja' : 'Nein') : String(value);
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 gap-4">
      <span className="text-sm text-muted-foreground whitespace-nowrap">{label}</span>
      {editable && onChange ? (
        <Input
          className="max-w-[200px] h-8 text-sm text-right"
          value={display === '—' ? '' : display}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <span className="text-sm font-medium text-right">{display}</span>
      )}
    </div>
  );
}

const PV_DMS_FOLDERS = [
  '01_Stammdaten', '02_MaStR_BNetzA', '03_Netzbetreiber', '04_Zaehler',
  '05_Wechselrichter_und_Speicher', '06_Versicherung', '07_Steuer_USt_BWA', '08_Wartung_Service',
];

interface Props {
  plant: PvPlant;
  isDemo?: boolean;
}

export default function PVPlantDossier({ plant, isDemo }: Props) {
  const { liveData } = usePvMonitoring(plant ? [plant] : []);
  const live = liveData.get(plant.id);
  const curve = useMemo(() => generate24hCurve(plant.kwp ?? 10), [plant.kwp]);

  return (
    <div className="space-y-4">
      {/* ─── A) KPI Row ─── */}
      <div className={DESIGN.KPI_GRID.FULL}>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Leistung (kWp)</p>
          <p className="text-kpi font-mono">{plant.kwp ?? '—'}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Aktuelle Leistung</p>
          <p className="text-kpi font-mono">{live?.currentPowerW.toLocaleString('de-DE') ?? (isDemo ? '4.230' : '—')} <span className="text-xs font-normal">W</span></p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Ertrag heute</p>
          <p className="text-kpi font-mono">{live?.energyTodayKwh.toLocaleString('de-DE') ?? (isDemo ? '18,4' : '—')} <span className="text-xs font-normal">kWh</span></p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Status</p>
          <Badge variant={live?.isOnline || isDemo ? 'default' : 'secondary'} className="mt-1">
            {live?.isOnline || isDemo ? 'Online' : 'Offline'}
          </Badge>
        </CardContent></Card>
      </div>

      {/* ─── B) Monitoring — Tageskurve ─── */}
      <SectionCard icon={Activity} title="Live-Monitoring">
        <div className="grid gap-4 md:grid-cols-3 mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Monatsertrag</p>
              <p className="text-sm font-mono font-semibold">{live?.energyMonthKwh.toLocaleString('de-DE') ?? (isDemo ? '285' : '—')} kWh</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-xs text-muted-foreground">Jahresertrag (est.)</p>
              <p className="text-sm font-mono font-semibold">{isDemo ? '9.500' : plant.kwp ? Math.round(plant.kwp * 950).toLocaleString('de-DE') : '—'} kWh</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BatteryCharging className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Speicher</p>
              <p className="text-sm font-mono font-semibold">{plant.has_battery ? `${plant.battery_kwh ?? '—'} kWh` : 'Nicht vorhanden'}</p>
            </div>
          </div>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={curve}>
              <defs>
                <linearGradient id={`grad-dossier-${plant.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" tickFormatter={(v) => `${v}h`} fontSize={11} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(1)} kW`} fontSize={11} width={50} />
              <Tooltip formatter={(v: number) => [`${v.toLocaleString('de-DE')} W`, 'Leistung']} labelFormatter={(l) => `${l}:00 Uhr`} />
              <Area type="monotone" dataKey="power_w" stroke="hsl(var(--primary))" fill={`url(#grad-dossier-${plant.id})`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* ─── C) Standort ─── */}
      <SectionCard icon={MapPin} title="Standort">
        <InfoRow label="Straße" value={plant.street ? `${plant.street} ${plant.house_number || ''}`.trim() : null} />
        <InfoRow label="PLZ" value={plant.postal_code} />
        <InfoRow label="Ort" value={plant.city} />
        <InfoRow label="Notizen" value={plant.location_notes} />
      </SectionCard>

      {/* ─── D) MaStR / BNetzA ─── */}
      <SectionCard icon={Shield} title="Bundesnetzagentur / MaStR">
        <InfoRow label="MaStR Zugang vorhanden" value={plant.mastr_account_present} />
        <InfoRow label="MaStR Anlagen-ID" value={plant.mastr_plant_id} />
        <InfoRow label="MaStR Einheit-ID" value={plant.mastr_unit_id} />
        <InfoRow label="Registrierungsstatus" value={plant.mastr_status} />
      </SectionCard>

      {/* ─── E) Netzbetreiber ─── */}
      <SectionCard icon={Building2} title="Energieversorger / Netzbetreiber">
        <InfoRow label="Netzbetreiber" value={plant.grid_operator} />
        <InfoRow label="Stromlieferant" value={plant.energy_supplier} />
        <InfoRow label="Kundennummer" value={plant.customer_reference} />
      </SectionCard>

      {/* ─── F) Zähler ─── */}
      <SectionCard icon={Gauge} title="Zähler">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold mb-2">Einspeisezähler</p>
            <InfoRow label="Zählernummer" value={plant.feed_in_meter_no} />
            <InfoRow label="Messstellenbetreiber" value={plant.feed_in_meter_operator} />
            <InfoRow label="Startstand" value={plant.feed_in_start_reading} />
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Bezugszähler</p>
            <InfoRow label="Zählernummer" value={plant.consumption_meter_no} />
            <InfoRow label="Messstellenbetreiber" value={plant.consumption_meter_operator} />
            <InfoRow label="Startstand" value={plant.consumption_start_reading} />
          </div>
        </div>
      </SectionCard>

      {/* ─── G) Technik ─── */}
      <SectionCard icon={Settings} title="Technik">
        <InfoRow label="PV-Leistung" value={plant.kwp ? `${plant.kwp} kWp` : null} />
        <InfoRow label="WR-Hersteller" value={plant.wr_manufacturer} />
        <InfoRow label="WR-Modell" value={plant.wr_model} />
        <InfoRow label="Speicher vorhanden" value={plant.has_battery} />
        <InfoRow label="Speicher-Kapazität" value={plant.battery_kwh ? `${plant.battery_kwh} kWh` : null} />
        <InfoRow label="Inbetriebnahme" value={plant.commissioning_date} />
        <InfoRow label="Provider" value={plant.provider} />
      </SectionCard>

      {/* ─── H) Dokumente ─── */}
      <SectionCard icon={FolderOpen} title="Dokumente">
        <div className={DESIGN.KPI_GRID.FULL}>
          {PV_DMS_FOLDERS.map((f) => (
            <div key={f} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm hover:bg-muted/50 cursor-pointer">
              <Folder className="h-4 w-4 text-primary/70 shrink-0" />
              <span className="truncate">{f}</span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <p className="text-sm font-semibold mb-2">Pflichtdokumente</p>
          <div className="space-y-1.5">
            {PV_REQUIRED_DOCS.map((doc) => (
              <div key={doc.name} className="flex items-center gap-2 text-sm">
                <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                <span className="text-muted-foreground">{doc.name}</span>
                <Badge variant="outline" className="text-xs ml-auto">
                  {isDemo ? 'Vorhanden' : 'Fehlend'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
