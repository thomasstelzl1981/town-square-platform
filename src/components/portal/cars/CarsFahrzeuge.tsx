/**
 * CarsFahrzeuge — Merged Autos + Bikes: editable vehicle records with DMS & Vimcar logbook
 * All editing is inline — no popup dialogs.
 */
import { useState } from 'react';
import { useDossierAutoResearch } from '@/hooks/useDossierAutoResearch';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { EntityStorageTree } from '@/components/shared/EntityStorageTree';

import { toast } from 'sonner';
import {
  Plus, Search, Car, Bike, Gauge, Calendar, User, Shield,
  ChevronDown, FileText, ShieldCheck, AlertTriangle, BookOpen, FolderOpen, X,
  Check, Pencil, Wifi, Save, Loader2
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getActiveWidgetGlow, DESIGN } from '@/config/designManifest';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { DesktopOnly } from '@/components/shared/DesktopOnly';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { isDemoId } from '@/engines/demoData/engine';
import { GOLDEN_PATH_PROCESSES } from '@/manifests/goldenPathProcesses';

const GP_FAHRZEUG = GOLDEN_PATH_PROCESSES.find(p => p.id === 'GP-FAHRZEUG')!;

type VehicleStatus = 'active' | 'inactive' | 'sold' | 'returned';

const statusLabels: Record<VehicleStatus, string> = {
  active: 'Aktiv', inactive: 'Inaktiv', sold: 'Verkauft', returned: 'Zurückgegeben',
};
const statusColors: Record<VehicleStatus, string> = {
  active: 'bg-status-success/10 text-status-success border-status-success/20',
  inactive: 'bg-muted text-muted-foreground border-muted-foreground/20',
  sold: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  returned: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
};

const VEHICLE_IMAGES: Record<string, string> = {
  'BMW M4': 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=400&h=250&fit=crop',
  'Mercedes GLE': 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=400&h=250&fit=crop',
  'Porsche 911': 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=400&h=250&fit=crop',
  'BMW R 1300': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=250&fit=crop',
  'Ducati Panigale': 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&h=250&fit=crop',
  'Harley-Davidson': 'https://images.unsplash.com/photo-1558980394-4c7c9299fe96?w=400&h=250&fit=crop',
};
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=250&fit=crop';

const DEMO_VEHICLES = [
  {
    id: 'demo-1', public_id: 'FZ-001', license_plate: 'M-AB 1234', make: 'BMW', model: 'M4 Competition G82',
    status: 'active' as VehicleStatus, holder_name: 'Max Mustermann', holder_address: 'Leopoldstr. 28, 80802 München',
    primary_driver_name: 'Max Mustermann', current_mileage_km: 23450, hu_valid_until: '2027-03-15',
    vin: 'WBS33AZ0XNCJ12345', color: 'Isle of Man Grün', fuel_type: 'Benzin', power_kw: 375,
    first_registration_date: '2023-03-15', engine_ccm: 2993, seats: 4, doors: 2,
    body_type: 'Coupé', weight_kg: 1725, co2_g_km: 227, vehicle_type: 'auto',
  },
  {
    id: 'demo-2', public_id: 'FZ-002', license_plate: 'M-MB 5678', make: 'Mercedes-Benz', model: 'GLE 450 4MATIC',
    status: 'active' as VehicleStatus, holder_name: 'Max Mustermann', holder_address: 'Leopoldstr. 28, 80802 München',
    primary_driver_name: 'Lisa Mustermann', current_mileage_km: 45200, hu_valid_until: '2026-11-01',
    vin: 'W1N1671611A456789', color: 'Obsidianschwarz', fuel_type: 'Mild-Hybrid (Benzin)', power_kw: 270,
    first_registration_date: '2022-06-20', engine_ccm: 2999, seats: 5, doors: 5,
    body_type: 'SUV', weight_kg: 2305, co2_g_km: 219, vehicle_type: 'auto',
  },
  {
    id: 'demo-3', public_id: 'FZ-003', license_plate: 'M-P 9911', make: 'Porsche', model: '911 Carrera S 992',
    status: 'active' as VehicleStatus, holder_name: 'Max Mustermann', holder_address: 'Leopoldstr. 28, 80802 München',
    primary_driver_name: 'Max Mustermann', current_mileage_km: 12800, hu_valid_until: '2027-08-20',
    vin: 'WP0AB2A98NS234567', color: 'Kreide', fuel_type: 'Benzin', power_kw: 331,
    first_registration_date: '2024-01-10', engine_ccm: 2981, seats: 4, doors: 2,
    body_type: 'Coupé', weight_kg: 1565, co2_g_km: 229, vehicle_type: 'auto',
  },
  {
    id: 'bike-1', public_id: 'FZ-004', license_plate: 'M-BM 1300', make: 'BMW', model: 'R 1300 GS Adventure',
    status: 'active' as VehicleStatus, holder_name: 'Max Mustermann', holder_address: 'Leopoldstr. 28, 80802 München',
    primary_driver_name: 'Max Mustermann', current_mileage_km: 8420, hu_valid_until: '2027-09-01',
    vin: 'WB10E1305PR123456', color: 'GS Trophy', fuel_type: 'Benzin', power_kw: 107,
    first_registration_date: '2025-01-15', engine_ccm: 1300, seats: 2, doors: 0,
    body_type: 'Motorrad', weight_kg: 268, co2_g_km: 125, vehicle_type: 'bike',
  },
  {
    id: 'bike-2', public_id: 'FZ-005', license_plate: 'M-DC 4444', make: 'Ducati', model: 'Panigale V4 S',
    status: 'active' as VehicleStatus, holder_name: 'Max Mustermann', holder_address: 'Leopoldstr. 28, 80802 München',
    primary_driver_name: 'Max Mustermann', current_mileage_km: 3150, hu_valid_until: '2028-04-01',
    vin: 'ZDMH400AAPB567890', color: 'Ducati Rot', fuel_type: 'Benzin', power_kw: 158,
    first_registration_date: '2025-03-01', engine_ccm: 1103, seats: 2, doors: 0,
    body_type: 'Motorrad', weight_kg: 195, co2_g_km: 165, vehicle_type: 'bike',
  },
  {
    id: 'bike-3', public_id: 'FZ-006', license_plate: 'M-HD 2024', make: 'Harley-Davidson', model: 'Road Glide Special',
    status: 'active' as VehicleStatus, holder_name: 'Max Mustermann', holder_address: 'Leopoldstr. 28, 80802 München',
    primary_driver_name: 'Max Mustermann', current_mileage_km: 15800, hu_valid_until: '2027-01-01',
    vin: '1HD1KTP16PB654321', color: 'Vivid Black', fuel_type: 'Benzin', power_kw: 67,
    first_registration_date: '2024-05-10', engine_ccm: 1868, seats: 2, doors: 0,
    body_type: 'Motorrad', weight_kg: 390, co2_g_km: 195, vehicle_type: 'bike',
  },
];

const DEMO_INSURANCES: Record<string, Record<string, string>> = {
  'demo-1': { insurer: 'Allianz', policy_number: 'AZ-2024-78912', coverage_type: 'Vollkasko', annual_premium: '2.840,00 €', sf_class_liability: 'SF 12', sf_class_comprehensive: 'SF 10', deductible_partial: '150 €', deductible_comprehensive: '500 €' },
  'demo-2': { insurer: 'HUK-COBURG', policy_number: 'HUK-2022-45601', coverage_type: 'Vollkasko', annual_premium: '1.920,00 €', sf_class_liability: 'SF 15', sf_class_comprehensive: 'SF 12', deductible_partial: '150 €', deductible_comprehensive: '300 €' },
  'demo-3': { insurer: 'AXA Versicherung', policy_number: 'AXA-2024-11234', coverage_type: 'Vollkasko', annual_premium: '3.450,00 €', sf_class_liability: 'SF 8', sf_class_comprehensive: 'SF 8', deductible_partial: '150 €', deductible_comprehensive: '1.000 €' },
  'bike-1': { insurer: 'HUK-COBURG', policy_number: 'HUK-2025-11234', coverage_type: 'Vollkasko', annual_premium: '680,00 €', sf_class_liability: 'SF 8', sf_class_comprehensive: 'SF 6', deductible_partial: '150 €', deductible_comprehensive: '300 €' },
  'bike-2': { insurer: 'Allianz', policy_number: 'AZ-2025-55678', coverage_type: 'Vollkasko', annual_premium: '920,00 €', sf_class_liability: 'SF 5', sf_class_comprehensive: 'SF 5', deductible_partial: '150 €', deductible_comprehensive: '500 €' },
  'bike-3': { insurer: 'HDI', policy_number: 'HDI-2024-33456', coverage_type: 'Teilkasko', annual_premium: '450,00 €', sf_class_liability: 'SF 10', sf_class_comprehensive: '—', deductible_partial: '150 €', deductible_comprehensive: '—' },
};

const INSURANCE_FIELD_LABELS: Record<string, string> = {
  insurer: 'Versicherer',
  policy_number: 'Policen-Nr.',
  coverage_type: 'Deckungsart',
  annual_premium: 'Jahresbeitrag',
  sf_class_liability: 'SF-Klasse KH',
  sf_class_comprehensive: 'SF-Klasse VK',
  deductible_partial: 'SB Teilkasko',
  deductible_comprehensive: 'SB Vollkasko',
};

const DEMO_TRIPS = [
  { id: 't1', date: '12.02.2026', start: 'München', end: 'Stuttgart', km: 234, purpose: 'Geschäftlich' as const, customer: 'Huber GmbH' },
  { id: 't2', date: '10.02.2026', start: 'München', end: 'Nürnberg', km: 167, purpose: 'Geschäftlich' as const, customer: 'Meyer AG' },
  { id: 't3', date: '08.02.2026', start: 'München', end: 'Starnberg', km: 42, purpose: 'Privat' as const, customer: '' },
  { id: 't4', date: '05.02.2026', start: 'München', end: 'Augsburg', km: 68, purpose: 'Geschäftlich' as const, customer: 'Schmidt & Partner' },
  { id: 't5', date: '03.02.2026', start: 'München', end: 'Garmisch', km: 89, purpose: 'Privat' as const, customer: '' },
];

const isBike = (v: any) => v.vehicle_type === 'bike' || v.body_type === 'Motorrad';

export default function CarsFahrzeuge() {
  const { activeTenantId } = useAuth();
  const { triggerResearch } = useDossierAutoResearch();
  const [search, setSearch] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newVehicleData, setNewVehicleData] = useState<Record<string, string>>({});
  const [isSavingNew, setIsSavingNew] = useState(false);

  const { data: dbVehicles, refetch } = useQuery({
    queryKey: ['cars_vehicles', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('cars_vehicles')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const { isEnabled } = useDemoToggles();
  const showDemoWidget = isEnabled('GP-FAHRZEUG');
  // Filter out demo vehicles (both client-side IDs and DB-seeded IDs) when toggle is OFF
  const DEMO_CLIENT_IDS = new Set(['demo-1','demo-2','demo-3','bike-1','bike-2','bike-3']);
  const realDbVehicles = dbVehicles?.filter((v: any) => !DEMO_CLIENT_IDS.has(v.id) && !isDemoId(v.id)) || [];
  const allDbVehicles = showDemoWidget ? (dbVehicles || []) : realDbVehicles;
  const vehicles = allDbVehicles.length ? allDbVehicles : (showDemoWidget ? DEMO_VEHICLES : []);
  const isDemo = !realDbVehicles.length && showDemoWidget;

  const filteredVehicles = vehicles.filter((v: any) => {
    const s = search.toLowerCase();
    return v.license_plate?.toLowerCase().includes(s) || v.make?.toLowerCase().includes(s) || v.model?.toLowerCase().includes(s);
  });

  const getImage = (v: any) => {
    const key = Object.keys(VEHICLE_IMAGES).find(k => `${v.make} ${v.model}`.includes(k));
    return key ? VEHICLE_IMAGES[key] : DEFAULT_IMAGE;
  };

  const getHuStatus = (dateStr: string | null) => {
    if (!dateStr) return { text: '—', urgency: 'none' as const };
    const date = new Date(dateStr);
    const daysUntil = differenceInDays(date, new Date());
    const formatted = format(date, 'MM/yyyy', { locale: de });
    if (daysUntil < 0) return { text: formatted, urgency: 'expired' as const };
    if (daysUntil < 30) return { text: formatted, urgency: 'warning' as const };
    return { text: formatted, urgency: 'ok' as const };
  };

  const selectedVehicle = vehicles.find((v: any) => v.id === selectedVehicleId) as any;

  const handleCreateInline = () => {
    setSelectedVehicleId(null);
    setIsCreatingNew(true);
    setNewVehicleData({});
  };

  const handleSaveNewVehicle = async () => {
    if (!activeTenantId) return;
    if (!newVehicleData.license_plate?.trim()) {
      toast.error('Kennzeichen ist erforderlich');
      return;
    }
    setIsSavingNew(true);
    try {
      const { data: newVehicle, error } = await supabase.from('cars_vehicles').insert({
        tenant_id: activeTenantId,
        license_plate: newVehicleData.license_plate.toUpperCase().trim(),
        make: newVehicleData.make || null,
        model: newVehicleData.model || null,
        first_registration_date: newVehicleData.first_registration_date || null,
        holder_name: newVehicleData.holder_name || null,
        current_mileage_km: newVehicleData.current_mileage_km ? parseInt(newVehicleData.current_mileage_km) : null,
        hu_valid_until: newVehicleData.hu_valid_until || null,
        hsn: newVehicleData.hsn || null,
        tsn: newVehicleData.tsn || null,
      }).select('id, make, model').single();
      if (error) throw error;

      // Trigger Armstrong dossier auto-research
      if (newVehicle) {
        const query = [newVehicleData.make, newVehicleData.model, newVehicleData.first_registration_date?.slice(0, 4)].filter(Boolean).join(' ');
        triggerResearch({ entityType: 'vehicle', entityId: newVehicle.id, searchQuery: query || newVehicleData.license_plate });
      }

      toast.success('Fahrzeug angelegt');
      setIsCreatingNew(false);
      setNewVehicleData({});
      refetch();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Kennzeichen bereits vorhanden');
      } else {
        toast.error(error.message || 'Fehler beim Anlegen');
      }
    } finally {
      setIsSavingNew(false);
    }
  };

  return (
    <PageShell>
      <ModulePageHeader
        title="Fahrzeuge"
        description="Autos & Motorräder verwalten — Klicken Sie auf ein Fahrzeug für die vollständige Akte"
        actions={
          <DesktopOnly>
            <Button onClick={handleCreateInline}>
              <Plus className="h-4 w-4 mr-2" /> Fahrzeug hinzufügen
            </Button>
          </DesktopOnly>
        }
      />

      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Suchen..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <WidgetGrid>
        {filteredVehicles.map((vehicle: any) => {
          const huStatus = getHuStatus(vehicle.hu_valid_until);
          const isSelected = selectedVehicleId === vehicle.id;
          return (
            <WidgetCell key={vehicle.id}>
               <Card
                className={cn(
                  "glass-card overflow-hidden cursor-pointer group transition-all h-full",
                  isDemo ? DESIGN.DEMO_WIDGET.CARD : getActiveWidgetGlow('teal'),
                  isSelected ? "border-primary ring-2 ring-primary/20" : "border-primary/10 hover:border-primary/30"
                )}
                onClick={() => { setIsCreatingNew(false); setSelectedVehicleId(isSelected ? null : vehicle.id); }}
              >
                <div className="relative h-[55%] bg-muted/30 overflow-hidden">
                  <img src={getImage(vehicle)} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  <div className="absolute top-2 left-3 flex items-center gap-1.5">
                    {isDemo && <Badge className={cn(DESIGN.DEMO_WIDGET.BADGE, "text-[9px]")}>DEMO</Badge>}
                    <Badge variant="outline" className={cn("text-[9px]", statusColors[vehicle.status as VehicleStatus])}>{statusLabels[vehicle.status as VehicleStatus]}</Badge>
                    {isBike(vehicle) && (
                      <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">
                        <Bike className="h-2.5 w-2.5 mr-0.5" /> Bike
                      </Badge>
                    )}
                  </div>
                  <div className="absolute bottom-2 left-3">
                    <div className="bg-background/90 backdrop-blur-sm rounded-md px-3 py-1 border border-border/50">
                      <span className="font-mono font-bold text-sm tracking-wider">{vehicle.license_plate}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <ChevronDown className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
                <CardContent className="p-3 space-y-2 h-[45%] flex flex-col justify-between">
                  <h3 className="font-semibold text-sm">{vehicle.make} {vehicle.model}</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    <MiniInfo icon={User} label="Halter" value={vehicle.holder_name || '—'} />
                    <MiniInfo icon={Gauge} label="KM" value={vehicle.current_mileage_km?.toLocaleString('de-DE') || '—'} />
                    <MiniInfo icon={Calendar} label="HU" value={huStatus.text} urgent={huStatus.urgency === 'expired'} />
                    <MiniInfo icon={Shield} label="Vers." value="Aktiv" />
                  </div>
                </CardContent>
              </Card>
            </WidgetCell>
          );
        })}
      </WidgetGrid>

      {/* Inline Neuanlage — Desktop only */}
      {isCreatingNew && (
        <Card className="glass-card border-primary/20 animate-in slide-in-from-top-2 duration-300">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Car className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Neues Fahrzeug anlegen</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsCreatingNew(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Separator />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'license_plate', label: 'Kennzeichen *', placeholder: 'B-XY 1234' },
                { key: 'make', label: 'Hersteller', placeholder: 'BMW' },
                { key: 'model', label: 'Modell', placeholder: 'M4 Competition' },
                { key: 'first_registration_date', label: 'Erstzulassung', placeholder: '', type: 'date' },
                { key: 'holder_name', label: 'Halter', placeholder: 'Max Mustermann' },
                { key: 'current_mileage_km', label: 'KM-Stand', placeholder: '45000', type: 'number' },
                { key: 'hu_valid_until', label: 'HU gültig bis', placeholder: '', type: 'date' },
                { key: 'hsn', label: 'HSN', placeholder: '0603' },
                { key: 'tsn', label: 'TSN', placeholder: 'BNH' },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</Label>
                  <Input
                    type={f.type || 'text'}
                    placeholder={f.placeholder}
                    value={newVehicleData[f.key] || ''}
                    onChange={e => setNewVehicleData(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
              <Button variant="outline" size="sm" onClick={() => setIsCreatingNew(false)}>Abbrechen</Button>
              <Button size="sm" onClick={handleSaveNewVehicle} disabled={isSavingNew} className="gap-2">
                {isSavingNew ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Fahrzeug anlegen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inline Fahrzeugakte */}
      {selectedVehicle && (
        <Card className="glass-card border-primary/20 animate-in slide-in-from-top-2 duration-300">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isBike(selectedVehicle) ? <Bike className="h-5 w-5 text-primary" /> : <Car className="h-5 w-5 text-primary" />}
                <h2 className="text-lg font-bold">{selectedVehicle.make} {selectedVehicle.model}</h2>
                <Badge variant="outline" className={cn("text-xs", statusColors[selectedVehicle.status as VehicleStatus])}>
                  {statusLabels[selectedVehicle.status as VehicleStatus]}
                </Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedVehicleId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            <EditableAkteSection
              icon={FileText}
              title="Basisdaten"
              vehicleId={selectedVehicle.id}
              isDemo={isDemo}
              fields={[
                { key: 'license_plate', label: 'Kennzeichen', value: selectedVehicle.license_plate },
                { key: 'vin', label: 'FIN (VIN)', value: selectedVehicle.vin || '' },
                { key: 'make', label: 'Hersteller', value: selectedVehicle.make || '' },
                { key: 'model', label: 'Modell', value: selectedVehicle.model || '' },
                { key: 'color', label: 'Farbe', value: selectedVehicle.color || '' },
                { key: 'fuel_type', label: 'Kraftstoff', value: selectedVehicle.fuel_type || '' },
                { key: 'power_kw', label: 'Leistung (kW/PS)', value: selectedVehicle.power_kw ? `${selectedVehicle.power_kw} kW (${Math.round(selectedVehicle.power_kw * 1.36)} PS)` : '' },
                { key: 'first_registration_date', label: 'Erstzulassung', value: selectedVehicle.first_registration_date ? format(new Date(selectedVehicle.first_registration_date), 'dd.MM.yyyy') : '' },
                { key: 'engine_ccm', label: 'Hubraum (ccm)', value: selectedVehicle.engine_ccm?.toLocaleString('de-DE') || '' },
                { key: 'body_type', label: 'Karosserie', value: selectedVehicle.body_type || '' },
                { key: 'seats', label: 'Sitze', value: String(selectedVehicle.seats || '') },
                ...(isBike(selectedVehicle) ? [] : [{ key: 'doors', label: 'Türen', value: String(selectedVehicle.doors || '') }]),
                { key: 'weight_kg', label: 'Gewicht (kg)', value: selectedVehicle.weight_kg?.toLocaleString('de-DE') || '' },
                { key: 'co2_g_km', label: 'CO₂ (g/km)', value: String(selectedVehicle.co2_g_km || '') },
                { key: 'current_mileage_km', label: 'KM-Stand', value: selectedVehicle.current_mileage_km?.toLocaleString('de-DE') || '' },
                { key: 'hu_valid_until', label: 'HU gültig bis', value: selectedVehicle.hu_valid_until ? format(new Date(selectedVehicle.hu_valid_until), 'dd.MM.yyyy') : '' },
                { key: 'holder_name', label: 'Halter', value: selectedVehicle.holder_name || '' },
                { key: 'holder_address', label: 'Halter-Adresse', value: selectedVehicle.holder_address || '' },
                { key: 'primary_driver_name', label: 'Hauptfahrer', value: selectedVehicle.primary_driver_name || '' },
              ]}
              onSaved={() => refetch()}
            />

            <Separator />

            <EditableAkteSection
              icon={ShieldCheck}
              title="Versicherung"
              vehicleId={selectedVehicle.id}
              isDemo={isDemo}
              fields={Object.entries(DEMO_INSURANCES[selectedVehicle.id] || {}).map(([key, value]) => ({
                key,
                label: INSURANCE_FIELD_LABELS[key] || key.replace(/_/g, ' '),
                value: value,
              }))}
              onSaved={() => refetch()}
            />

            <Separator />

            <AkteSection icon={AlertTriangle} title="Schäden">
              <p className="text-sm text-muted-foreground">Keine Schäden erfasst</p>
            </AkteSection>

            <Separator />

            <VimcarLogbook />

            <Separator />

            <AkteSection icon={FolderOpen} title="Datenraum">
              {activeTenantId ? (
                <EntityStorageTree
                  tenantId={activeTenantId}
                  entityType="vehicle"
                  entityId={selectedVehicle.id}
                  moduleCode="MOD_17"
                />
              ) : (
                <p className="text-sm text-muted-foreground">Kein Tenant aktiv</p>
              )}
            </AkteSection>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}

// ── Helpers ─────────────────────────────────────────────────────

function MiniInfo({ icon: Icon, label, value, urgent }: { icon: typeof Car; label: string; value: string; urgent?: boolean }) {
  return (
    <div className="flex items-start gap-1">
      <Icon className={cn("h-3 w-3 mt-0.5 shrink-0", urgent ? "text-destructive" : "text-muted-foreground")} />
      <div className="min-w-0">
        <p className="text-[8px] text-muted-foreground uppercase">{label}</p>
        <p className={cn("text-[11px] truncate", urgent && "text-destructive font-medium")}>{value}</p>
      </div>
    </div>
  );
}

function AkteSection({ icon: Icon, title, children }: { icon: typeof Car; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  );
}

interface FieldDef { key: string; label: string; value: string }

function EditableAkteSection({ icon: Icon, title, vehicleId, isDemo, fields, onSaved }: {
  icon: typeof Car; title: string; vehicleId: string; isDemo: boolean;
  fields: FieldDef[]; onSaved: () => void;
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const startEdit = (key: string, currentValue: string) => {
    setEditingKey(key);
    setEditValues(prev => ({ ...prev, [key]: currentValue }));
  };

  const saveField = async (key: string) => {
    const newValue = editValues[key];
    setEditingKey(null);
    if (isDemo) { toast.success(`${key} aktualisiert (Demo-Modus)`); return; }
    try {
      const { error } = await supabase.from('cars_vehicles').update({ [key]: newValue } as any).eq('id', vehicleId);
      if (error) throw error;
      toast.success('Feld aktualisiert');
      onSaved();
    } catch { toast.error('Fehler beim Speichern'); }
  };

  return (
    <AkteSection icon={Icon} title={title}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {fields.map((f) => (
          <div key={f.key} className="group/field">
            <dt className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</dt>
            {editingKey === f.key ? (
              <div className="flex items-center gap-1 mt-0.5">
                <Input value={editValues[f.key] ?? f.value} onChange={(e) => setEditValues(prev => ({ ...prev, [f.key]: e.target.value }))} className="h-7 text-sm px-2" autoFocus onKeyDown={(e) => e.key === 'Enter' && saveField(f.key)} />
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => saveField(f.key)}><Check className="h-3 w-3 text-status-success" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditingKey(null)}><X className="h-3 w-3" /></Button>
              </div>
            ) : (
              <dd className="text-sm font-medium cursor-text hover:text-primary transition-colors flex items-center gap-1" onClick={() => startEdit(f.key, f.value)}>
                {f.value || '—'}
                <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/field:opacity-100 transition-opacity" />
              </dd>
            )}
          </div>
        ))}
      </div>
    </AkteSection>
  );
}

function VimcarLogbook() {
  return (
    <AkteSection icon={BookOpen} title="Fahrtenbuch">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline" className="text-[10px] bg-status-success/10 text-status-success border-status-success/20">
          <Wifi className="h-3 w-3 mr-1" /> GPS verbunden
        </Badge>
      </div>
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <div className="grid grid-cols-6 gap-0 bg-muted/30 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50">
          <span>Datum</span><span>Start</span><span>Ziel</span><span className="text-right">km</span><span>Zweck</span><span>Kunde</span>
        </div>
        {DEMO_TRIPS.map((trip) => (
          <div key={trip.id} className="grid grid-cols-6 gap-0 px-3 py-2 text-sm border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
            <span className="text-muted-foreground">{trip.date}</span>
            <span>{trip.start}</span>
            <span>{trip.end}</span>
            <span className="text-right font-mono">{trip.km}</span>
            <span>
              <Badge variant="outline" className={cn("text-[9px]", trip.purpose === 'Geschäftlich' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground')}>
                {trip.purpose}
              </Badge>
            </span>
            <span className="text-muted-foreground truncate">{trip.customer || '—'}</span>
          </div>
        ))}
      </div>
    </AkteSection>
  );
}
