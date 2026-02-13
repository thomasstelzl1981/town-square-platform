/**
 * MOD-18 Finanzanalyse — Einstellungen
 * Analyse-Parameter und Datenquellen konfigurieren
 */
import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Building2, CreditCard, Car, Sun } from 'lucide-react';
import { toast } from 'sonner';

interface DataSource {
  id: string;
  label: string;
  icon: React.ElementType;
  module: string;
  enabled: boolean;
}

export default function EinstellungenTile() {
  const [sources, setSources] = useState<DataSource[]>([
    { id: 'properties', label: 'Immobilien', icon: Building2, module: 'MOD-04', enabled: true },
    { id: 'finance', label: 'Finanzierungen', icon: CreditCard, module: 'MOD-07', enabled: true },
    { id: 'vehicles', label: 'Fahrzeuge', icon: Car, module: 'MOD-17', enabled: true },
    { id: 'pv', label: 'Photovoltaik', icon: Sun, module: 'MOD-19', enabled: false },
  ]);

  const [currency, setCurrency] = useState('EUR');
  const [period, setPeriod] = useState('monthly');

  const toggleSource = (id: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
    toast.success('Einstellung gespeichert');
  };

  return (
    <PageShell>
      <ModulePageHeader title="Einstellungen" description="Analyse-Parameter konfigurieren" />

      <div className="space-y-6 max-w-2xl">
        {/* Data Sources */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Datenquellen
            </CardTitle>
            <CardDescription>Wählen Sie, welche Module in die Analyse einbezogen werden</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <source.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{source.label}</p>
                    <Badge variant="outline" className="text-xs">{source.module}</Badge>
                  </div>
                </div>
                <Switch checked={source.enabled} onCheckedChange={() => toggleSource(source.id)} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Anzeige</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Währung</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="CHF">CHF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Standardansicht</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="quarterly">Quartalsweise</SelectItem>
                  <SelectItem value="yearly">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
