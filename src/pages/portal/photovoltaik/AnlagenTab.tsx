/**
 * PV Anlagen Tab — Golden Path: WidgetGrid + Inline Dossier below
 * Demo widget opens pre-filled demo Akte, CTA opens inline creation form
 */
import { useState, useCallback } from 'react';
import { useDossierAutoResearch } from '@/hooks/useDossierAutoResearch';
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
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sun, Plus, Zap, Activity, Check, X, Trash2 } from 'lucide-react';
import { WidgetDeleteOverlay } from '@/components/shared/WidgetDeleteOverlay';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { LoadingState } from '@/components/shared/LoadingState';
import PVPlantDossier from './PVPlantDossier';
import { toast } from 'sonner';

type ViewMode = 'grid' | 'detail' | 'create';

export default function AnlagenTab() {
  const { plants, isLoading, createPlant, tenantId } = usePvPlants();
  const { liveData } = usePvMonitoring(plants);
  
  const { createDMSTree } = usePvDMS();
  const { profile } = useAuth();
  const { triggerResearch } = useDossierAutoResearch();
  

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const pvQueryClient = useQueryClient();
  const [deletingPlantId, setDeletingPlantId] = useState<string | null>(null);

  const deletePlantMutation = useMutation({
    mutationFn: async (plantId: string) => {
      setDeletingPlantId(plantId);
      const { error } = await supabase.from('pv_plants').delete().eq('id', plantId);
      if (error) throw error;
    },
    onSuccess: () => {
      setDeletingPlantId(null);
      if (selectedPlantId === deletingPlantId) { setViewMode('grid'); setSelectedPlantId(null); }
      toast.success('PV-Anlage gelöscht');
      pvQueryClient.invalidateQueries({ queryKey: ['pv-plants'] });
    },
    onError: (err: Error) => {
      setDeletingPlantId(null);
      toast.error(`Fehler: ${err.message}`);
    },
  });

  // Inline create form state — all fields
  const [formName, setFormName] = useState('');
  const [formStreet, setFormStreet] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formPostal, setFormPostal] = useState('');
  const [formKwp, setFormKwp] = useState('');
  const [formCommDate, setFormCommDate] = useState('');
  const [formProvider, setFormProvider] = useState('demo');
  const [formWrMfg, setFormWrMfg] = useState('');
  const [formWrModel, setFormWrModel] = useState('');
  const [formHasBattery, setFormHasBattery] = useState('nein');
  const [formBatteryKwh, setFormBatteryKwh] = useState('');
  // Connector
  const [formConnectorType, setFormConnectorType] = useState('demo_timo_leif');
  const [formInverterIp, setFormInverterIp] = useState('');
  const [formInverterPassword, setFormInverterPassword] = useState('');
  const [formPollInterval, setFormPollInterval] = useState('10');
  // MaStR
  const [formMastrPlantId, setFormMastrPlantId] = useState('');
  const [formMastrUnitId, setFormMastrUnitId] = useState('');
  const [formMastrStatus, setFormMastrStatus] = useState('');
  // Netzbetreiber
  const [formGridOperator, setFormGridOperator] = useState('');
  const [formEnergySupplier, setFormEnergySupplier] = useState('');
  const [formCustomerRef, setFormCustomerRef] = useState('');
  // Zähler
  const [formFeedInMeterNo, setFormFeedInMeterNo] = useState('');
  const [formFeedInMeterOp, setFormFeedInMeterOp] = useState('');
  const [formFeedInStart, setFormFeedInStart] = useState('');
  const [formConsMeterNo, setFormConsMeterNo] = useState('');
  const [formConsMeterOp, setFormConsMeterOp] = useState('');
  const [formConsStart, setFormConsStart] = useState('');
  const [saving, setSaving] = useState(false);


  const handleOpenPlant = useCallback((id: string) => {
    setViewMode('detail');
    setSelectedPlantId(id);
  }, []);

  const handleOpenCreate = useCallback(() => {
    setViewMode('create');
    setSelectedPlantId(null);
    setFormName(''); setFormStreet(''); setFormCity(''); setFormPostal('');
    setFormKwp(''); setFormCommDate(''); setFormProvider('demo');
    setFormWrMfg(''); setFormWrModel('');
    setFormHasBattery('nein'); setFormBatteryKwh('');
    setFormConnectorType('demo_timo_leif'); setFormInverterIp(''); setFormInverterPassword(''); setFormPollInterval('10');
    setFormMastrPlantId(''); setFormMastrUnitId(''); setFormMastrStatus('');
    setFormGridOperator(''); setFormEnergySupplier(''); setFormCustomerRef('');
    setFormFeedInMeterNo(''); setFormFeedInMeterOp(''); setFormFeedInStart('');
    setFormConsMeterNo(''); setFormConsMeterOp(''); setFormConsStart('');
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
        has_battery: formHasBattery === 'ja',
        battery_kwh: formBatteryKwh ? parseFloat(formBatteryKwh) : undefined,
        mastr_plant_id: formMastrPlantId || undefined,
        mastr_unit_id: formMastrUnitId || undefined,
        mastr_status: formMastrStatus || undefined,
        grid_operator: formGridOperator || undefined,
        energy_supplier: formEnergySupplier || undefined,
        customer_reference: formCustomerRef || undefined,
        feed_in_meter_no: formFeedInMeterNo || undefined,
        feed_in_meter_operator: formFeedInMeterOp || undefined,
        feed_in_start_reading: formFeedInStart ? parseFloat(formFeedInStart) : undefined,
        consumption_meter_no: formConsMeterNo || undefined,
        consumption_meter_operator: formConsMeterOp || undefined,
        consumption_start_reading: formConsStart ? parseFloat(formConsStart) : undefined,
      });
      await createDMSTree.mutateAsync({ plantId: plant.id, plantName: plant.name });
      // Auto-create connector if IP is provided
      if (formConnectorType === 'sma_webconnect' && formInverterIp) {
        try {
          const { data: connData } = await supabase.from('pv_connectors').insert({
            pv_plant_id: plant.id,
            tenant_id: plant.tenant_id,
            provider: 'sma_webconnect',
            status: 'configured',
            config_json: {
              inverter_ip: formInverterIp,
              password: formInverterPassword,
              poll_interval_sec: formPollInterval,
            },
          }).select().single();
        } catch { /* connector creation is best-effort */ }
      }
      // Trigger Armstrong dossier auto-research for PV
      const pvQuery = [formName, formKwp ? `${formKwp} kWp` : '', formWrMfg, formWrModel].filter(Boolean).join(' ');
      triggerResearch({ entityType: 'pv_plant', entityId: plant.id, searchQuery: pvQuery });

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
        {/* Plants */}
        {plants.map((plant) => {
          const live = liveData.get(plant.id);
          return (
            <WidgetCell key={plant.id}>
              <Card
                className={cn(
                  "h-full cursor-pointer transition-colors hover:border-primary/30 relative group",
                  viewMode === 'detail' && selectedPlantId === plant.id && 'ring-2 ring-primary'
                )}
                onClick={() => handleOpenPlant(plant.id)}
              >
                <WidgetDeleteOverlay
                    title={plant.name}
                    onConfirmDelete={() => deletePlantMutation.mutate(plant.id)}
                    isDeleting={deletingPlantId === plant.id}
                  />
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

            {/* ── Stammdaten ── */}
            <p className="text-sm font-semibold text-muted-foreground pt-2">Stammdaten</p>
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
            </div>

            {/* ── Technik ── */}
            <p className="text-sm font-semibold text-muted-foreground pt-4">Technik</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="pv-kwp">Leistung (kWp)</Label>
                <Input id="pv-kwp" type="number" step="0.1" placeholder="9.8" value={formKwp} onChange={(e) => setFormKwp(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pv-comm">Inbetriebnahme</Label>
                <Input id="pv-comm" type="date" value={formCommDate} onChange={(e) => setFormCommDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pv-wr-mfg">WR-Hersteller</Label>
                <Input id="pv-wr-mfg" placeholder="z.B. SMA" value={formWrMfg} onChange={(e) => setFormWrMfg(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pv-wr-model">WR-Modell</Label>
                <Input id="pv-wr-model" placeholder="z.B. Tripower 10.0" value={formWrModel} onChange={(e) => setFormWrModel(e.target.value)} />
              </div>
              <div>
                <Label>Speicher vorhanden</Label>
                <Select value={formHasBattery} onValueChange={setFormHasBattery}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nein">Nein</SelectItem>
                    <SelectItem value="ja">Ja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formHasBattery === 'ja' && (
                <div>
                  <Label htmlFor="pv-bat-kwh">Speicher-Kapazität (kWh)</Label>
                  <Input id="pv-bat-kwh" type="number" step="0.1" placeholder="10" value={formBatteryKwh} onChange={(e) => setFormBatteryKwh(e.target.value)} />
                </div>
              )}
              <div>
                <Label>Monitoring Provider</Label>
                <Select value={formProvider} onValueChange={setFormProvider}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo">Demo (synthetische Daten)</SelectItem>
                    <SelectItem value="sma">SMA</SelectItem>
                    <SelectItem value="solarlog">Solar-Log</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Connector ── */}
            <p className="text-sm font-semibold text-muted-foreground pt-4">Connector / Fernüberwachung</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Connector-Typ</Label>
                <Select value={formConnectorType} onValueChange={setFormConnectorType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo_timo_leif">Demo (Timo Leif)</SelectItem>
                    <SelectItem value="sma_webconnect">SMA WebConnect</SelectItem>
                    <SelectItem value="solarlog_http">Solar-Log HTTP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formConnectorType === 'sma_webconnect' && (
                <>
                  <div>
                    <Label htmlFor="pv-ip">Wechselrichter-IP</Label>
                    <Input id="pv-ip" placeholder="192.168.178.99" value={formInverterIp} onChange={(e) => setFormInverterIp(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="pv-pw">WebConnect-Passwort</Label>
                    <Input id="pv-pw" type="password" placeholder="Passwort" value={formInverterPassword} onChange={(e) => setFormInverterPassword(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="pv-interval">Polling-Intervall (Sek.)</Label>
                    <Input id="pv-interval" type="number" value={formPollInterval} onChange={(e) => setFormPollInterval(e.target.value)} />
                  </div>
                </>
              )}
            </div>

            {/* ── MaStR ── */}
            <p className="text-sm font-semibold text-muted-foreground pt-4">Bundesnetzagentur / MaStR</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="pv-mastr-plant">MaStR Anlagen-ID</Label>
                <Input id="pv-mastr-plant" placeholder="SEE912345678" value={formMastrPlantId} onChange={(e) => setFormMastrPlantId(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pv-mastr-unit">MaStR Einheit-ID</Label>
                <Input id="pv-mastr-unit" placeholder="SEE987654321" value={formMastrUnitId} onChange={(e) => setFormMastrUnitId(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pv-mastr-status">Registrierungsstatus</Label>
                <Input id="pv-mastr-status" placeholder="z.B. bestätigt" value={formMastrStatus} onChange={(e) => setFormMastrStatus(e.target.value)} />
              </div>
            </div>

            {/* ── Netzbetreiber ── */}
            <p className="text-sm font-semibold text-muted-foreground pt-4">Energieversorger / Netzbetreiber</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="pv-grid-op">Netzbetreiber</Label>
                <Input id="pv-grid-op" placeholder="z.B. Stromnetz Berlin" value={formGridOperator} onChange={(e) => setFormGridOperator(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pv-energy-sup">Stromlieferant</Label>
                <Input id="pv-energy-sup" placeholder="z.B. Vattenfall" value={formEnergySupplier} onChange={(e) => setFormEnergySupplier(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pv-cust-ref">Kundennummer</Label>
                <Input id="pv-cust-ref" placeholder="Kundennr." value={formCustomerRef} onChange={(e) => setFormCustomerRef(e.target.value)} />
              </div>
            </div>

            {/* ── Zähler ── */}
            <p className="text-sm font-semibold text-muted-foreground pt-4">Zähler</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className="text-xs font-semibold mb-2">Einspeisezähler</p>
              </div>
              <div>
                <Label htmlFor="pv-fi-no">Zählernummer</Label>
                <Input id="pv-fi-no" placeholder="EHZ-..." value={formFeedInMeterNo} onChange={(e) => setFormFeedInMeterNo(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pv-fi-op">Messstellenbetreiber</Label>
                <Input id="pv-fi-op" value={formFeedInMeterOp} onChange={(e) => setFormFeedInMeterOp(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pv-fi-start">Startstand</Label>
                <Input id="pv-fi-start" type="number" value={formFeedInStart} onChange={(e) => setFormFeedInStart(e.target.value)} />
              </div>
              <div className="md:col-span-2 pt-2">
                <p className="text-xs font-semibold mb-2">Bezugszähler</p>
              </div>
              <div>
                <Label htmlFor="pv-co-no">Zählernummer</Label>
                <Input id="pv-co-no" placeholder="EHZ-..." value={formConsMeterNo} onChange={(e) => setFormConsMeterNo(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pv-co-op">Messstellenbetreiber</Label>
                <Input id="pv-co-op" value={formConsMeterOp} onChange={(e) => setFormConsMeterOp(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pv-co-start">Startstand</Label>
                <Input id="pv-co-start" type="number" value={formConsStart} onChange={(e) => setFormConsStart(e.target.value)} />
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
