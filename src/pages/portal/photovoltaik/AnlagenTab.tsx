/**
 * PV Anlagen Tab — Golden Path: WidgetGrid + Inline Dossier below
 * Demo widget opens pre-filled demo Akte, CTA opens inline creation form
 */
import { useState, useCallback } from 'react';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { usePvPlants, PvPlant } from '@/hooks/usePvPlants';
import { usePvMonitoring } from '@/hooks/usePvMonitoring';
import { usePvDMS } from '@/hooks/usePvDMS';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sun, Plus, Zap, Activity, Check, X } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { LoadingState } from '@/components/shared/LoadingState';
import PVPlantDossier from './PVPlantDossier';
import { toast } from 'sonner';

// Demo plant data for the pre-filled Akte
const DEMO_PLANT: PvPlant = {
  id: '00000000-0000-4000-a000-000000000901',
  name: 'EFH SMA 9,8 kWp',
  status: 'active',
  street: 'Schadowstr.',
  house_number: '12',
  postal_code: '10117',
  city: 'Berlin',
  location_notes: 'Süd-Dach, 30° Neigung, keine Verschattung',
  kwp: 9.8,
  commissioning_date: '2024-06-15',
  wr_manufacturer: 'SMA',
  wr_model: 'Sunny Tripower 10.0',
  has_battery: true,
  battery_kwh: 10,
  mastr_account_present: true,
  mastr_plant_id: 'SEE912345678',
  mastr_unit_id: 'SEE987654321',
  mastr_status: 'confirmed',
  grid_operator: 'Stromnetz Berlin GmbH',
  energy_supplier: 'Vattenfall',
  customer_reference: 'VTF-2024-88321',
  feed_in_meter_no: 'EHZ-1ESM-0044721',
  feed_in_meter_operator: 'Stromnetz Berlin',
  feed_in_start_reading: 0,
  consumption_meter_no: 'EHZ-1ESM-0078834',
  consumption_meter_operator: 'Stromnetz Berlin',
  consumption_start_reading: 14520,
  provider: 'demo',
  active_connector: 'demo_timo_leif',
  last_sync_at: new Date().toISOString(),
  data_quality: 'complete',
  dms_root_node_id: '680b808e-7aaa-47f3-a92d-2ddf44e26bca',
  tenant_id: 'a0000000-0000-4000-a000-000000000001',
  owner_user_id: null,
  owner_org_id: null,
  created_at: '2024-06-15T10:00:00Z',
  updated_at: new Date().toISOString(),
};

type ViewMode = 'grid' | 'demo' | 'detail' | 'create';

export default function AnlagenTab() {
  const { plants, isLoading, createPlant, tenantId } = usePvPlants();
  const { liveData } = usePvMonitoring(plants);
  const { isEnabled } = useDemoToggles();
  const { createDMSTree } = usePvDMS();
  const { profile } = useAuth();
  const demoEnabled = isEnabled('GP-PV-ANLAGE');

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);

  // Inline create form state
  const [formName, setFormName] = useState('');
  const [formStreet, setFormStreet] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formPostal, setFormPostal] = useState('');
  const [formKwp, setFormKwp] = useState('');
  const [formCommDate, setFormCommDate] = useState('');
  const [formProvider, setFormProvider] = useState('demo');
  const [formWrMfg, setFormWrMfg] = useState('');
  const [formWrModel, setFormWrModel] = useState('');
  const [saving, setSaving] = useState(false);

  const handleOpenDemo = useCallback(() => {
    setViewMode('demo');
    setSelectedPlantId(null);
  }, []);

  const handleOpenPlant = useCallback((id: string) => {
    setViewMode('detail');
    setSelectedPlantId(id);
  }, []);

  const handleOpenCreate = useCallback(() => {
    setViewMode('create');
    setSelectedPlantId(null);
    setFormName('');
    setFormStreet('');
    setFormCity('');
    setFormPostal('');
    setFormKwp('');
    setFormCommDate('');
    setFormProvider('demo');
    setFormWrMfg('');
    setFormWrModel('');
  }, []);

  const handleCloseDetail = useCallback(() => {
    setViewMode('grid');
    setSelectedPlantId(null);
  }, []);

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const plant = await createPlant.mutateAsync({
        name: formName,
        street: formStreet || undefined,
        postal_code: formPostal || undefined,
        city: formCity || undefined,
        kwp: formKwp ? parseFloat(formKwp) : undefined,
        commissioning_date: formCommDate || undefined,
        provider: formProvider,
        wr_manufacturer: formWrMfg || undefined,
        wr_model: formWrModel || undefined,
      });
      await createDMSTree.mutateAsync({ plantId: plant.id, plantName: plant.name });
      setViewMode('detail');
      setSelectedPlantId(plant.id);
    } catch {
      // handled in hook
    } finally {
      setSaving(false);
    }
  };

  const selectedPlant = selectedPlantId ? plants.find(p => p.id === selectedPlantId) : null;

  if (isLoading) {
    return <PageShell><LoadingState /></PageShell>;
  }

  return (
    <PageShell>
      <ModulePageHeader
        title="ANLAGEN"
        description={`${plants.length > 0 ? `${plants.length} PV-Anlage${plants.length > 1 ? 'n' : ''}` : 'Ihr PV-Portfolio'}`}
      />

      <WidgetGrid>
        {/* Demo Widget */}
        {demoEnabled && (
          <WidgetCell>
            <Card
              className={cn(
                "h-full cursor-pointer transition-colors",
                DESIGN.DEMO_WIDGET.CARD,
                DESIGN.DEMO_WIDGET.HOVER,
                viewMode === 'demo' && 'ring-2 ring-primary'
              )}
              onClick={handleOpenDemo}
            >
              <CardContent className="p-4 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={cn(DESIGN.DEMO_WIDGET.BADGE, "text-[10px]")}>Demo</Badge>
                    <Badge variant="default" className="text-[10px]">Aktiv</Badge>
                  </div>
                  <h3 className="font-semibold text-sm">EFH SMA 9,8 kWp</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Berlin · SMA Sunny Tripower</p>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" /> Leistung</span>
                    <span className="font-mono font-semibold">4.230 W</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1"><Activity className="h-3 w-3" /> Heute</span>
                    <span className="font-mono">18,4 kWh</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Jahresertrag</span>
                    <span className="font-mono">9.500 kWh</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </WidgetCell>
        )}

        {/* Real Plants */}
        {plants.map((plant) => {
          const live = liveData.get(plant.id);
          return (
            <WidgetCell key={plant.id}>
              <Card
                className={cn(
                  "h-full cursor-pointer transition-colors hover:border-primary/30",
                  viewMode === 'detail' && selectedPlantId === plant.id && 'ring-2 ring-primary'
                )}
                onClick={() => handleOpenPlant(plant.id)}
              >
                <CardContent className="p-4 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Sun className="h-4 w-4 text-amber-500" />
                      <Badge variant={plant.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                        {plant.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm">{plant.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{plant.city || '–'} · {plant.wr_manufacturer || '–'}</p>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">kWp</span>
                      <span className="font-mono font-semibold">{plant.kwp ?? '–'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Leistung</span>
                      <span className="font-mono">{live ? `${live.currentPowerW.toLocaleString('de-DE')} W` : '–'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Heute</span>
                      <span className="font-mono">{live ? `${live.energyTodayKwh.toLocaleString('de-DE')} kWh` : '–'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </WidgetCell>
          );
        })}

        {/* CTA Widget */}
        <WidgetCell>
          <Card
            className={cn(
              "glass-card border-dashed border-2 h-full flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all",
              viewMode === 'create' && 'ring-2 ring-primary'
            )}
            onClick={handleOpenCreate}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Neue Anlage</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">PV-Anlage hinzufügen</p>
              </div>
            </CardContent>
          </Card>
        </WidgetCell>
      </WidgetGrid>

      {/* ─── Inline Detail / Create below the grid ─── */}

      {viewMode === 'demo' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Demo-Akte: EFH SMA 9,8 kWp</h3>
            <Button variant="ghost" size="sm" onClick={handleCloseDetail}>
              <X className="h-4 w-4 mr-1" /> Schließen
            </Button>
          </div>
          <PVPlantDossier plant={DEMO_PLANT} isDemo />
        </div>
      )}

      {viewMode === 'detail' && selectedPlant && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{selectedPlant.name}</h3>
            <Button variant="ghost" size="sm" onClick={handleCloseDetail}>
              <X className="h-4 w-4 mr-1" /> Schließen
            </Button>
          </div>
          <PVPlantDossier plant={selectedPlant} />
        </div>
      )}

      {viewMode === 'create' && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sun className="h-5 w-5 text-primary" /> Neue PV-Anlage erfassen
              </h3>
              <Button variant="ghost" size="sm" onClick={handleCloseDetail}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="pv-name">Anlagenname *</Label>
                <Input id="pv-name" placeholder="z.B. EFH Berlin 9,8 kWp" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pv-street">Straße</Label>
                <Input id="pv-street" placeholder="Musterstr. 1" value={formStreet} onChange={(e) => setFormStreet(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pv-city">Ort</Label>
                <Input id="pv-city" placeholder="Berlin" value={formCity} onChange={(e) => setFormCity(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pv-postal">PLZ</Label>
                <Input id="pv-postal" placeholder="10115" value={formPostal} onChange={(e) => setFormPostal(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pv-kwp">Leistung (kWp)</Label>
                <Input id="pv-kwp" type="number" step="0.1" placeholder="9.8" value={formKwp} onChange={(e) => setFormKwp(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pv-comm">Inbetriebnahme</Label>
                <Input id="pv-comm" type="date" value={formCommDate} onChange={(e) => setFormCommDate(e.target.value)} />
              </div>
              <div>
                <Label>Monitoring Provider</Label>
                <Select value={formProvider} onValueChange={setFormProvider}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo">Demo (synthetische Daten)</SelectItem>
                    <SelectItem value="sma">SMA (coming soon)</SelectItem>
                    <SelectItem value="solarlog">Solar-Log (coming soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pv-wr-mfg">WR-Hersteller</Label>
                <Input id="pv-wr-mfg" placeholder="z.B. SMA" value={formWrMfg} onChange={(e) => setFormWrMfg(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pv-wr-model">WR-Modell</Label>
                <Input id="pv-wr-model" placeholder="z.B. Tripower 10.0" value={formWrModel} onChange={(e) => setFormWrModel(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleCloseDetail}>Abbrechen</Button>
              <Button onClick={handleCreate} disabled={!formName.trim() || saving}>
                <Check className="h-4 w-4 mr-1" /> {saving ? 'Speichern...' : 'Anlage erstellen'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
