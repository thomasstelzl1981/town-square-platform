/**
 * PV Einstellungen Tab — Connectors + Monitoring Settings (always visible)
 */
import { ConnectorCard } from '@/components/photovoltaik/ConnectorCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sun, Wifi, Landmark, Settings } from 'lucide-react';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { PageShell } from '@/components/shared/PageShell';

export default function EinstellungenTab() {
  return (
    <PageShell>
      <ModulePageHeader title="Einstellungen" description="Integrationen und Monitoring-Konfiguration" />

      {/* Connectors */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Integrationen</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <ConnectorCard
            name="SMA"
            icon={Sun}
            status="prepared"
            description="Verbinden Sie Ihren SMA Sunny Portal Account per OAuth2 für automatisches Monitoring."
            fields={[
              { label: 'Methode', value: 'OAuth2', disabled: true },
            ]}
          />
          <ConnectorCard
            name="Solar-Log"
            icon={Wifi}
            status="prepared"
            description="Solar-Log Monitoring via LAN oder Cloud-Portal."
            fields={[
              { label: 'Modus', value: 'LAN / Cloud', disabled: true },
              { label: 'Host/IP', value: '—', disabled: true },
            ]}
          />
          <ConnectorCard
            name="finAPI"
            icon={Landmark}
            status="prepared"
            description="Bankkonto-Anbindung für automatische Einspeisevergütungs-Erfassung und USt-Vorbereitung."
            fields={[
              { label: 'Status', value: 'Roadmap', disabled: true },
            ]}
          />
        </div>
      </div>

      {/* Monitoring Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Monitoring-Einstellungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="demo-mode">Demo-Modus (synthetische Daten)</Label>
            <Switch id="demo-mode" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Refresh-Intervall</Label>
              <p className="text-xs text-muted-foreground">Aktualisierung der Live-Daten</p>
            </div>
            <span className="text-sm font-mono">7 Sekunden</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Offline-Schwelle</Label>
              <p className="text-xs text-muted-foreground">Ab wann gilt eine Anlage als offline</p>
            </div>
            <span className="text-sm font-mono">5 Minuten</span>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
