/**
 * CameraSetupWizard — 5-Abschnitte Inline-Wizard für FRITZ!Box Camera Connect
 * Öffnet sich inline unterhalb des Widget-Grids.
 */
import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Camera, ChevronDown, ChevronRight, CheckCircle2, XCircle, AlertTriangle,
  Loader2, Copy, ExternalLink, Shield, Wifi, BatteryMedium, Cable, X,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CameraFormData } from '@/hooks/useCameras';

// ── Vendor Presets ──
const VENDOR_PRESETS: Record<string, { label: string; snapshotPath: string; defaultPort: number; authType: string }> = {
  reolink: { label: 'Reolink', snapshotPath: '/cgi-bin/api.cgi?cmd=Snap&channel=0', defaultPort: 80, authType: 'digest' },
  amcrest: { label: 'Amcrest', snapshotPath: '/cgi-bin/snapshot.cgi?channel=1', defaultPort: 80, authType: 'digest' },
  other: { label: 'Andere / Unbekannt', snapshotPath: '/snapshot.cgi', defaultPort: 80, authType: 'basic' },
};

interface ProbeResult {
  reachability: 'ok' | 'timeout' | 'dns_fail' | 'refused';
  auth: 'ok' | 'unauthorized' | 'digest_required' | 'forbidden' | 'no_credentials' | 'skipped';
  snapshot: 'ok' | 'not_jpeg' | 'bad_path' | 'no_image' | 'skipped';
  latency_ms: number;
  hints: string[];
}

interface CameraSetupWizardProps {
  onComplete: (data: CameraFormData & { vendor?: string; model?: string; connection_type?: string; local_ip?: string; internal_port?: number; external_domain?: string; external_port?: number }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CameraSetupWizard({ onComplete, onCancel, isLoading }: CameraSetupWizardProps) {
  // Section open states
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 1: true });
  const toggleSection = (n: number) => setOpenSections(p => ({ ...p, [n]: !p[n] }));

  // Form state
  const [vendor, setVendor] = useState('amcrest');
  const [model, setModel] = useState('');
  const [connectionType, setConnectionType] = useState('poe');
  const [cameraName, setCameraName] = useState('');
  const [localIp, setLocalIp] = useState('');
  const [internalPort, setInternalPort] = useState(VENDOR_PRESETS.amcrest.defaultPort.toString());
  const [authUser, setAuthUser] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [domainType, setDomainType] = useState('myfritz');
  const [externalDomain, setExternalDomain] = useState('');
  const [externalPort, setExternalPort] = useState('8080');
  const [refreshInterval, setRefreshInterval] = useState('30');
  const [isActive, setIsActive] = useState(true);

  // Probe state
  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<ProbeResult | null>(null);

  const preset = VENDOR_PRESETS[vendor] || VENDOR_PRESETS.other;

  // Build snapshot URL from parts
  const buildSnapshotUrl = useCallback(() => {
    const domain = externalDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const port = externalPort || '80';
    const path = preset.snapshotPath;
    return `http://${domain}:${port}${path}`;
  }, [externalDomain, externalPort, preset]);

  // Run external probe
  const runProbe = async () => {
    const url = buildSnapshotUrl();
    if (!externalDomain) {
      toast.error('Bitte externe Domain eingeben');
      return;
    }
    setProbing(true);
    setProbeResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Nicht angemeldet'); setProbing(false); return; }
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${baseUrl}/functions/v1/sot-camera-probe`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snapshot_url: url,
          auth_user: authUser || undefined,
          auth_pass: authPass || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        setProbeResult(data as ProbeResult);
        // Auto-open section 5 if all green
        if (data.reachability === 'ok' && data.auth === 'ok' && data.snapshot === 'ok') {
          setOpenSections(p => ({ ...p, 5: true }));
        }
      }
    } catch (e) {
      toast.error('Probe-Anfrage fehlgeschlagen');
    } finally {
      setProbing(false);
    }
  };

  // Save
  const handleSave = () => {
    if (!cameraName.trim()) { toast.error('Bitte Kamera-Name eingeben'); return; }
    const snapshotUrl = buildSnapshotUrl();
    onComplete({
      name: cameraName.trim(),
      snapshot_url: snapshotUrl,
      auth_user: authUser || undefined,
      auth_pass: authPass || undefined,
      refresh_interval_sec: parseInt(refreshInterval) || 30,
      vendor,
      model: model || undefined,
      connection_type: connectionType,
      local_ip: localIp || undefined,
      internal_port: parseInt(internalPort) || 80,
      external_domain: externalDomain || undefined,
      external_port: parseInt(externalPort) || undefined,
    });
  };

  const allGreen = probeResult?.reachability === 'ok' && probeResult?.auth === 'ok' && probeResult?.snapshot === 'ok';

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'ok') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'skipped') return <span className="h-4 w-4 rounded-full bg-muted-foreground/30 block" />;
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  const SectionHeader = ({ num, title, complete }: { num: number; title: string; complete?: boolean }) => (
    <CollapsibleTrigger className="flex items-center gap-3 w-full py-3 text-left hover:bg-muted/50 px-4 rounded-lg transition-colors" onClick={() => toggleSection(num)}>
      <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold ${complete ? 'bg-green-500/20 text-green-600' : 'bg-primary/10 text-primary'}`}>
        {complete ? <CheckCircle2 className="h-4 w-4" /> : num}
      </div>
      <span className="font-medium flex-1">{title}</span>
      {openSections[num] ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </CollapsibleTrigger>
  );

  return (
    <Card className="glass-card border-primary/20 mt-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Kamera verbinden</CardTitle>
              <CardDescription>Schritt für Schritt Ihre IP-Kamera über FRITZ!Box einrichten</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">

        {/* ── Section 1: Kamera auswählen ── */}
        <Collapsible open={openSections[1]}>
          <SectionHeader num={1} title="Kamera auswählen" complete={!!vendor} />
          <CollapsibleContent className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Hersteller</Label>
                <Select value={vendor} onValueChange={(v) => { setVendor(v); setInternalPort(VENDOR_PRESETS[v]?.defaultPort?.toString() || '80'); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(VENDOR_PRESETS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Modell (optional)</Label>
                <Input value={model} onChange={e => setModel(e.target.value)} placeholder="z.B. IP5M-T1179EW" />
              </div>
              <div className="space-y-2">
                <Label>Verbindungstyp</Label>
                <div className="flex gap-2">
                  {[
                    { v: 'poe', icon: Cable, label: 'PoE' },
                    { v: 'wifi', icon: Wifi, label: 'WiFi' },
                    { v: 'battery', icon: BatteryMedium, label: 'Akku' },
                  ].map(t => (
                    <Button key={t.v} variant={connectionType === t.v ? 'default' : 'outline'} size="sm" onClick={() => setConnectionType(t.v)} className="flex-1">
                      <t.icon className="h-3.5 w-3.5 mr-1" />{t.label}
                    </Button>
                  ))}
                </div>
                {connectionType === 'battery' && (
                  <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Akkubetrieb: Nur mit Home Hub empfohlen</p>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Wir verbinden per Live-Snapshot. Keine Cloud-App nötig.</p>
            <Button size="sm" onClick={() => setOpenSections(p => ({ ...p, 1: false, 2: true }))}>Weiter</Button>
          </CollapsibleContent>
        </Collapsible>

        {/* ── Section 2: Lokale Basisdaten ── */}
        <Collapsible open={openSections[2]}>
          <SectionHeader num={2} title="Lokale Basisdaten" complete={!!cameraName && !!localIp} />
          <CollapsibleContent className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kamera-Name</Label>
                <Input value={cameraName} onChange={e => setCameraName(e.target.value)} placeholder="z.B. Eingang" />
              </div>
              <div className="space-y-2">
                <Label>Lokale IP-Adresse</Label>
                <Input value={localIp} onChange={e => setLocalIp(e.target.value)} placeholder="192.168.178.34" />
                <p className="text-xs text-muted-foreground">In FRITZ!Box unter Heimnetz → Netzwerk sichtbar</p>
              </div>
              <div className="space-y-2">
                <Label>Interner Port</Label>
                <Input value={internalPort} onChange={e => setInternalPort(e.target.value)} placeholder="80" />
              </div>
              <div className="space-y-2">
                <Label>Snapshot-Preset</Label>
                <Input value={preset.snapshotPath} readOnly className="bg-muted/50 font-mono text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kamera-Benutzer</Label>
                <Input value={authUser} onChange={e => setAuthUser(e.target.value)} placeholder="admin" />
              </div>
              <div className="space-y-2">
                <Label>Kamera-Passwort</Label>
                <Input type="password" value={authPass} onChange={e => setAuthPass(e.target.value)} placeholder="••••••••" />
              </div>
            </div>
            <Button size="sm" onClick={() => setOpenSections(p => ({ ...p, 2: false, 3: true }))}>Weiter</Button>
          </CollapsibleContent>
        </Collapsible>

        {/* ── Section 3: FRITZ!Box Portfreigabe ── */}
        <Collapsible open={openSections[3]}>
          <SectionHeader num={3} title="FRITZ!Box extern erreichbar machen" complete={!!externalDomain} />
          <CollapsibleContent className="px-4 pb-4 space-y-4">
            <div className="space-y-3">
              <Label>Zugangsart</Label>
              <RadioGroup value={domainType} onValueChange={setDomainType} className="space-y-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="myfritz" id="myfritz" />
                  <Label htmlFor="myfritz" className="font-normal">MyFRITZ-Adresse (empfohlen)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="dyndns" id="dyndns" />
                  <Label htmlFor="dyndns" className="font-normal">DynDNS-Domain</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="public_ip" id="public_ip" />
                  <Label htmlFor="public_ip" className="font-normal flex items-center gap-1">Öffentliche IP direkt <Badge variant="outline" className="text-[10px]">Profi</Badge></Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{domainType === 'myfritz' ? 'MyFRITZ-Adresse' : domainType === 'dyndns' ? 'DynDNS-Domain' : 'Öffentliche IP'}</Label>
                <Input value={externalDomain} onChange={e => setExternalDomain(e.target.value)} placeholder={domainType === 'myfritz' ? 'xxxx.myfritz.net' : domainType === 'dyndns' ? 'meinhaus.dyndns.org' : '203.0.113.42'} />
              </div>
              <div className="space-y-2">
                <Label>Externer Port</Label>
                <Input value={externalPort} onChange={e => setExternalPort(e.target.value)} placeholder="8080" />
              </div>
            </div>

            {/* Anleitung */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2"><ExternalLink className="h-4 w-4" /> Portfreigabe einrichten</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>FRITZ!Box öffnen → Internet → Freigaben → Portfreigaben</li>
                <li>Gerät auswählen → Neue Freigabe → Portfreigabe</li>
                <li>Protokoll: <strong>TCP</strong></li>
                <li>Von Port: <strong>{externalPort || '8080'}</strong> → an Computer: <strong>{localIp || '192.168.178.XX'}</strong> → an Port: <strong>{internalPort || '80'}</strong></li>
              </ol>
              <Button variant="outline" size="sm" onClick={() => {
                navigator.clipboard.writeText(`Protokoll: TCP | Von Port: ${externalPort} → an ${localIp} → an Port: ${internalPort}`);
                toast.success('In Zwischenablage kopiert');
              }}>
                <Copy className="h-3 w-3 mr-1" /> Portfreigabe-Daten kopieren
              </Button>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
              <Shield className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">Nutzen Sie ein starkes Kamera-Passwort und einen eigenen Kamera-Benutzer ohne Adminrechte.</p>
            </div>

            <Button size="sm" onClick={() => setOpenSections(p => ({ ...p, 3: false, 4: true }))}>Weiter</Button>
          </CollapsibleContent>
        </Collapsible>

        {/* ── Section 4: Externer Verbindungstest ── */}
        <Collapsible open={openSections[4]}>
          <SectionHeader num={4} title="Externer Verbindungstest" complete={allGreen} />
          <CollapsibleContent className="px-4 pb-4 space-y-4">
            <p className="text-sm text-muted-foreground">SoT testet aus der Cloud, ob Ihre Kamera extern erreichbar ist.</p>
            
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-xs font-mono text-muted-foreground break-all">{buildSnapshotUrl()}</p>
            </div>

            <Button onClick={runProbe} disabled={probing || !externalDomain}>
              {probing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Teste Verbindung…</> : 'Extern testen'}
            </Button>

            {probeResult && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-card border">
                    <StatusIcon status={probeResult.reachability} />
                    <div>
                      <p className="text-xs font-medium">Erreichbar</p>
                      <p className="text-[10px] text-muted-foreground">{probeResult.reachability === 'ok' ? `${probeResult.latency_ms}ms` : probeResult.reachability}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-card border">
                    <StatusIcon status={probeResult.auth} />
                    <div>
                      <p className="text-xs font-medium">Login</p>
                      <p className="text-[10px] text-muted-foreground">{probeResult.auth}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-card border">
                    <StatusIcon status={probeResult.snapshot} />
                    <div>
                      <p className="text-xs font-medium">Snapshot</p>
                      <p className="text-[10px] text-muted-foreground">{probeResult.snapshot}</p>
                    </div>
                  </div>
                </div>

                {probeResult.hints.length > 0 && (
                  <div className="space-y-2">
                    {probeResult.hints.map((hint, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-destructive/5 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                        <p className="text-xs text-destructive">{hint}</p>
                      </div>
                    ))}
                  </div>
                )}

                {allGreen && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="text-sm text-green-700 dark:text-green-400 font-medium">Alles grün! Kamera ist bereit.</p>
                  </div>
                )}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* ── Section 5: Speichern ── */}
        <Collapsible open={openSections[5]}>
          <SectionHeader num={5} title="Speichern & Live-Kachel" complete={false} />
          <CollapsibleContent className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Aktualisierungsintervall</Label>
                <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Alle 10 Sekunden</SelectItem>
                    <SelectItem value="30">Alle 30 Sekunden</SelectItem>
                    <SelectItem value="60">Jede Minute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>Kamera aktiv</Label>
              </div>
            </div>

            {!allGreen && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Der externe Test war noch nicht komplett erfolgreich. Sie können trotzdem speichern und später erneut testen.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={isLoading || !cameraName.trim()} className="flex-1">
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
                Kamera speichern
              </Button>
              <Button variant="outline" onClick={onCancel}>Abbrechen</Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

      </CardContent>
    </Card>
  );
}
