/**
 * PV Plant Dossier — Full vertical scrollable Akte
 * All sections visible at once: KPIs, Monitoring, Connector, Standort, MaStR, Netz, Zähler, Technik, Dokumente
 * No tabs, no popups — one continuous flow. All fields editable with central save.
 */
import { useMemo, useState, useCallback } from 'react';
import { DESIGN } from '@/config/designManifest';
import { PvPlant, usePvPlants } from '@/hooks/usePvPlants';
import { usePvMonitoring } from '@/hooks/usePvMonitoring';
import { usePvConnectors, usePvMeasurements } from '@/hooks/usePvConnectors';
import { generate24hCurve } from '@/components/photovoltaik/DemoLiveGenerator';
import { PV_REQUIRED_DOCS } from '@/hooks/usePvDMS';
import { EntityStorageTree } from '@/components/shared/EntityStorageTree';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sun, MapPin, Shield, Zap, Gauge, Settings, Activity,
  FolderOpen, Building2, Circle, BatteryCharging, TrendingUp,
  Save, Loader2, Plug, Copy, CheckCircle, AlertCircle, WifiOff,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

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

interface Props {
  plant: PvPlant;
  isDemo?: boolean;
}

export default function PVPlantDossier({ plant, isDemo }: Props) {
  const { activeTenantId } = useAuth();
  const { liveData } = usePvMonitoring(plant ? [plant] : []);
  const live = liveData.get(plant.id);
  const curve = useMemo(() => generate24hCurve(plant.kwp ?? 10), [plant.kwp]);

  // Connector state
  const { connectors, upsertConnector } = usePvConnectors(plant.id);
  const { latestMeasurement, measurements24h } = usePvMeasurements(plant.id);
  const [connectorType, setConnectorType] = useState<string>(plant.active_connector || 'demo_timo_leif');
  const [connectorConfig, setConnectorConfig] = useState<Record<string, string>>({
    inverter_ip: '', inverter_port: '502', unit_id: '3', poll_interval_sec: '10', host: '',
  });

  // Load existing connector config
  const activeConnector = connectors.find(c => c.provider === connectorType);
  const connectorStatus = activeConnector?.status || 'not_configured';

  // Use real measurements if available, else demo
  const hasRealData = !!latestMeasurement && latestMeasurement.source !== 'demo';
  const displayPower = hasRealData ? (latestMeasurement?.current_power_w ?? 0) : (live?.currentPowerW ?? 0);
  const displayEnergyToday = hasRealData ? (latestMeasurement?.energy_today_kwh ?? 0) : (live?.energyTodayKwh ?? 0);

  // Chart data: real measurements or demo curve
  const chartData = useMemo(() => {
    if (measurements24h.length > 5) {
      return measurements24h.map(m => ({
        hour: new Date(m.ts).getHours() + new Date(m.ts).getMinutes() / 60,
        power_w: m.current_power_w ?? 0,
      }));
    }
    return curve;
  }, [measurements24h, curve]);

  // Editable form state
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const hasChanges = Object.keys(formData).length > 0;

  const updateField = useCallback((key: string, val: string) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  }, []);

  const getVal = (key: string, original: any) => {
    return key in formData ? formData[key] : original;
  };

  const handleSave = async () => {
    if (isDemo) { toast.success('Gespeichert (Demo-Modus)'); setFormData({}); return; }
    setIsSaving(true);
    try {
      const updates: Record<string, any> = {};
      for (const [key, val] of Object.entries(formData)) {
        // Convert numeric fields
        if (['kwp', 'battery_kwh', 'feed_in_start_reading', 'consumption_start_reading'].includes(key)) {
          updates[key] = val ? parseFloat(val) : null;
        } else if (['mastr_account_present', 'has_battery'].includes(key)) {
          updates[key] = val === 'Ja' || val === 'true';
        } else {
          updates[key] = val || null;
        }
      }
      const { error } = await supabase.from('pv_plants').update(updates).eq('id', plant.id);
      if (error) throw error;
      toast.success('Änderungen gespeichert');
      setFormData({});
    } catch (e: any) {
      toast.error(e.message || 'Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

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
          <p className="text-kpi font-mono">{displayPower.toLocaleString('de-DE')} <span className="text-xs font-normal">W</span></p>
          {hasRealData && <Badge variant="outline" className="text-[10px] mt-1">Live</Badge>}
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Ertrag heute</p>
          <p className="text-kpi font-mono">{displayEnergyToday.toLocaleString('de-DE', { maximumFractionDigits: 1 })} <span className="text-xs font-normal">kWh</span></p>
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
            <AreaChart data={chartData}>
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

      {/* ─── B2) Connector / Fernüberwachung ─── */}
      <SectionCard icon={Plug} title="Connector / Fernüberwachung">
        <div className="space-y-4">
          {/* Connector Type Selection */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Typ:</span>
            <Select value={connectorType} onValueChange={setConnectorType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sma_webconnect">SMA WebConnect</SelectItem>
                <SelectItem value="solarlog_http">Solar-Log HTTP</SelectItem>
                <SelectItem value="demo_timo_leif">Demo (Timo Leif)</SelectItem>
              </SelectContent>
            </Select>
            {/* Status Badge */}
            <Badge
              variant={connectorStatus === 'connected' ? 'default' : connectorStatus === 'error' ? 'destructive' : 'secondary'}
              className="gap-1"
            >
              {connectorStatus === 'connected' && <CheckCircle className="h-3 w-3" />}
              {connectorStatus === 'error' && <AlertCircle className="h-3 w-3" />}
              {connectorStatus === 'offline' && <WifiOff className="h-3 w-3" />}
              {connectorStatus === 'connected' ? 'Verbunden' :
               connectorStatus === 'configured' ? 'Konfiguriert' :
               connectorStatus === 'error' ? 'Fehler' :
               connectorStatus === 'offline' ? 'Offline' : 'Nicht konfiguriert'}
            </Badge>
          </div>

          {/* SMA WebConnect Config */}
          {connectorType === 'sma_webconnect' && (
            <div className="space-y-3 border border-border rounded-lg p-4">
              <p className="text-sm font-semibold">SMA WebConnect (Sunny Tripower)</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">Wechselrichter-IP</label>
                  <Input
                    placeholder="192.168.178.xxx"
                    value={connectorConfig.inverter_ip}
                    onChange={e => setConnectorConfig(p => ({ ...p, inverter_ip: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Passwort</label>
                  <Input
                    type="password"
                    placeholder="WebConnect-Passwort"
                    value={connectorConfig.password || ''}
                    onChange={e => setConnectorConfig(p => ({ ...p, password: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Polling-Intervall (Sek.)</label>
                  <Input
                    type="number"
                    value={connectorConfig.poll_interval_sec}
                    onChange={e => setConnectorConfig(p => ({ ...p, poll_interval_sec: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Unit-ID</label>
                  <Input
                    type="number"
                    value={connectorConfig.unit_id}
                    onChange={e => setConnectorConfig(p => ({ ...p, unit_id: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    upsertConnector.mutate({
                      provider: 'sma_webconnect',
                      config_json: connectorConfig,
                    });
                  }}
                  disabled={!connectorConfig.inverter_ip}
                >
                  Konfiguration speichern
                </Button>
              </div>

              {/* Bridge Instructions */}
              {activeConnector && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border space-y-3">
                  <p className="text-xs font-semibold">🔌 Bridge-Script — Lokale Verbindung zum Wechselrichter</p>
                  <p className="text-xs text-muted-foreground">
                    Dein Wechselrichter ist nur in deinem WLAN erreichbar. Das Bridge-Script läuft auf deinem Computer
                    (gleiches WLAN) und leitet die Daten an die Cloud weiter. Führe diesen Befehl einmalig auf deinem Computer aus:
                  </p>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground">1. Einmalig installieren (falls noch nicht geschehen):</p>
                    <code className="text-xs block bg-background p-2 rounded font-mono">pip install requests</code>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground">2. Bridge starten (ersetze nur DEIN_PASSWORT):</p>
                    <code className="text-xs block bg-background p-2 rounded font-mono break-all">
                      python tools/sma_bridge.py \{'\n'}
                      {'  '}--ip {connectorConfig.inverter_ip || '192.168.178.99'} \{'\n'}
                      {'  '}--password DEIN_PASSWORT \{'\n'}
                      {'  '}--plant-id {plant.id} \{'\n'}
                      {'  '}--tenant-id {plant.tenant_id} \{'\n'}
                      {'  '}--connector-id {activeConnector.id} \{'\n'}
                      {'  '}--interval {connectorConfig.poll_interval_sec || '10'}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs"
                    onClick={() => {
                      const cmd = `python tools/sma_bridge.py --ip ${connectorConfig.inverter_ip || '192.168.178.99'} --password DEIN_PASSWORT --plant-id ${plant.id} --tenant-id ${plant.tenant_id} --connector-id ${activeConnector.id} --interval ${connectorConfig.poll_interval_sec || '10'}`;
                      navigator.clipboard.writeText(cmd);
                      toast.success('Befehl kopiert — ersetze DEIN_PASSWORT mit deinem SMA-Passwort');
                    }}
                  >
                    <Copy className="h-3 w-3" /> Befehl kopieren
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Solar-Log Config */}
          {connectorType === 'solarlog_http' && (
            <div className="space-y-3 border border-border rounded-lg p-4">
              <p className="text-sm font-semibold">Solar-Log HTTP</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">Host / IP</label>
                  <Input
                    placeholder="192.168.178.xxx"
                    value={connectorConfig.host}
                    onChange={e => setConnectorConfig(p => ({ ...p, host: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Polling-Intervall (Sek.)</label>
                  <Input
                    type="number"
                    value={connectorConfig.poll_interval_sec}
                    onChange={e => setConnectorConfig(p => ({ ...p, poll_interval_sec: e.target.value }))}
                  />
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  upsertConnector.mutate({
                    provider: 'solarlog_http',
                    config_json: connectorConfig,
                  });
                }}
                disabled={!connectorConfig.host}
              >
                Konfiguration speichern
              </Button>
            </div>
          )}

          {/* Demo Mode */}
          {connectorType === 'demo_timo_leif' && (
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                Demo-Modus aktiv — synthetische Daten werden basierend auf der kWp-Leistung und Tageszeit generiert.
              </p>
            </div>
          )}

          {/* Last Sync Info */}
          {activeConnector?.last_sync_at && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              Letztes Update: {new Date(activeConnector.last_sync_at).toLocaleString('de-DE')}
            </div>
          )}
          {activeConnector?.last_error && (
            <div className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {activeConnector.last_error}
            </div>
          )}
          {hasRealData && (
            <Badge variant="outline" className="text-xs">
              Live-Daten aktiv (Quelle: {latestMeasurement?.source})
            </Badge>
          )}
        </div>
      </SectionCard>

      {/* ─── C) Standort ─── */}
      <SectionCard icon={MapPin} title="Standort">
        <InfoRow label="Straße" value={getVal('street', plant.street ? `${plant.street} ${plant.house_number || ''}`.trim() : null)} editable onChange={v => updateField('street', v)} />
        <InfoRow label="PLZ" value={getVal('postal_code', plant.postal_code)} editable onChange={v => updateField('postal_code', v)} />
        <InfoRow label="Ort" value={getVal('city', plant.city)} editable onChange={v => updateField('city', v)} />
        <InfoRow label="Notizen" value={getVal('location_notes', plant.location_notes)} editable onChange={v => updateField('location_notes', v)} />
      </SectionCard>

      {/* ─── D) MaStR / BNetzA ─── */}
      <SectionCard icon={Shield} title="Bundesnetzagentur / MaStR">
        <InfoRow label="MaStR Zugang vorhanden" value={getVal('mastr_account_present', plant.mastr_account_present)} editable onChange={v => updateField('mastr_account_present', v)} />
        <InfoRow label="MaStR Anlagen-ID" value={getVal('mastr_plant_id', plant.mastr_plant_id)} editable onChange={v => updateField('mastr_plant_id', v)} />
        <InfoRow label="MaStR Einheit-ID" value={getVal('mastr_unit_id', plant.mastr_unit_id)} editable onChange={v => updateField('mastr_unit_id', v)} />
        <InfoRow label="Registrierungsstatus" value={getVal('mastr_status', plant.mastr_status)} editable onChange={v => updateField('mastr_status', v)} />
      </SectionCard>

      {/* ─── E) Netzbetreiber ─── */}
      <SectionCard icon={Building2} title="Energieversorger / Netzbetreiber">
        <InfoRow label="Netzbetreiber" value={getVal('grid_operator', plant.grid_operator)} editable onChange={v => updateField('grid_operator', v)} />
        <InfoRow label="Stromlieferant" value={getVal('energy_supplier', plant.energy_supplier)} editable onChange={v => updateField('energy_supplier', v)} />
        <InfoRow label="Kundennummer" value={getVal('customer_reference', plant.customer_reference)} editable onChange={v => updateField('customer_reference', v)} />
      </SectionCard>

      {/* ─── F) Zähler ─── */}
      <SectionCard icon={Gauge} title="Zähler">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold mb-2">Einspeisezähler</p>
            <InfoRow label="Zählernummer" value={getVal('feed_in_meter_no', plant.feed_in_meter_no)} editable onChange={v => updateField('feed_in_meter_no', v)} />
            <InfoRow label="Messstellenbetreiber" value={getVal('feed_in_meter_operator', plant.feed_in_meter_operator)} editable onChange={v => updateField('feed_in_meter_operator', v)} />
            <InfoRow label="Startstand" value={getVal('feed_in_start_reading', plant.feed_in_start_reading)} editable onChange={v => updateField('feed_in_start_reading', v)} />
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Bezugszähler</p>
            <InfoRow label="Zählernummer" value={getVal('consumption_meter_no', plant.consumption_meter_no)} editable onChange={v => updateField('consumption_meter_no', v)} />
            <InfoRow label="Messstellenbetreiber" value={getVal('consumption_meter_operator', plant.consumption_meter_operator)} editable onChange={v => updateField('consumption_meter_operator', v)} />
            <InfoRow label="Startstand" value={getVal('consumption_start_reading', plant.consumption_start_reading)} editable onChange={v => updateField('consumption_start_reading', v)} />
          </div>
        </div>
      </SectionCard>

      {/* ─── G) Technik ─── */}
      <SectionCard icon={Settings} title="Technik">
        <InfoRow label="PV-Leistung" value={getVal('kwp', plant.kwp ? `${plant.kwp}` : null)} editable onChange={v => updateField('kwp', v)} />
        <InfoRow label="WR-Hersteller" value={getVal('wr_manufacturer', plant.wr_manufacturer)} editable onChange={v => updateField('wr_manufacturer', v)} />
        <InfoRow label="WR-Modell" value={getVal('wr_model', plant.wr_model)} editable onChange={v => updateField('wr_model', v)} />
        <InfoRow label="Speicher vorhanden" value={getVal('has_battery', plant.has_battery)} editable onChange={v => updateField('has_battery', v)} />
        <InfoRow label="Speicher-Kapazität" value={getVal('battery_kwh', plant.battery_kwh ? `${plant.battery_kwh}` : null)} editable onChange={v => updateField('battery_kwh', v)} />
        <InfoRow label="Inbetriebnahme" value={getVal('commissioning_date', plant.commissioning_date)} editable onChange={v => updateField('commissioning_date', v)} />
        <InfoRow label="Provider" value={getVal('provider', plant.provider)} editable onChange={v => updateField('provider', v)} />
      </SectionCard>

      {/* ─── H) Dokumente — EntityStorageTree ─── */}
      <SectionCard icon={FolderOpen} title="Dokumente">
        {activeTenantId ? (
          <EntityStorageTree
            tenantId={activeTenantId}
            entityType="pv_plant"
            entityId={plant.id}
            moduleCode="MOD_19"
          />
        ) : (
          <p className="text-sm text-muted-foreground">Kein Tenant aktiv</p>
        )}
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

      {/* ─── Save Button ─── */}
      {hasChanges && (
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Änderungen speichern
          </Button>
        </div>
      )}
    </div>
  );
}
