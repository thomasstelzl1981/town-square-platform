/**
 * CarsAutos — Editable vehicle records with DMS Datenraum & Vimcar-style logbook
 */
import { useState, useCallback, useMemo } from 'react';
import { useDossierAutoResearch } from '@/hooks/useDossierAutoResearch';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StorageFileManager } from '@/components/dms/StorageFileManager';
import { useUniversalUpload } from '@/hooks/useUniversalUpload';
import { toast } from 'sonner';
import {
  Plus, Search, Car, Gauge, Calendar, User, Shield,
  ChevronDown, FileText, ShieldCheck, AlertTriangle, BookOpen, FolderOpen, X,
  Check, Pencil, Radio, Wifi, WifiOff
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { VehicleCreateDialog } from './VehicleCreateDialog';
import { cn } from '@/lib/utils';
import { getActiveWidgetGlow, DESIGN } from '@/config/designManifest';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { isDemoId } from '@/engines/demoData/engine';

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

// Model-specific images
const VEHICLE_IMAGES: Record<string, string> = {
  'BMW M4': 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=400&h=250&fit=crop',
  'Mercedes GLE': 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=400&h=250&fit=crop',
  'Porsche 911': 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=400&h=250&fit=crop',
};
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=250&fit=crop';

// Realistic demo vehicles
const DEMO_VEHICLES = [
  {
    id: 'demo-1', public_id: 'FZ-001', license_plate: 'M-AB 1234', make: 'BMW', model: 'M4 Competition G82',
    status: 'active' as VehicleStatus, holder_name: 'Max Mustermann', holder_address: 'Leopoldstr. 28, 80802 München',
    primary_driver_name: 'Max Mustermann', current_mileage_km: 23450, hu_valid_until: '2027-03-15',
    vin: 'WBS33AZ0XNCJ12345', color: 'Isle of Man Grün', fuel_type: 'Benzin', power_kw: 375,
    first_registration_date: '2023-03-15', engine_ccm: 2993, seats: 4, doors: 2,
    body_type: 'Coupé', weight_kg: 1725, co2_g_km: 227,
  },
  {
    id: 'demo-2', public_id: 'FZ-002', license_plate: 'M-MB 5678', make: 'Mercedes-Benz', model: 'GLE 450 4MATIC',
    status: 'active' as VehicleStatus, holder_name: 'Max Mustermann', holder_address: 'Leopoldstr. 28, 80802 München',
    primary_driver_name: 'Lisa Mustermann', current_mileage_km: 45200, hu_valid_until: '2026-11-01',
    vin: 'W1N1671611A456789', color: 'Obsidianschwarz', fuel_type: 'Mild-Hybrid (Benzin)', power_kw: 270,
    first_registration_date: '2022-06-20', engine_ccm: 2999, seats: 5, doors: 5,
    body_type: 'SUV', weight_kg: 2305, co2_g_km: 219,
  },
  {
    id: 'demo-3', public_id: 'FZ-003', license_plate: 'M-P 9911', make: 'Porsche', model: '911 Carrera S 992',
    status: 'active' as VehicleStatus, holder_name: 'Max Mustermann', holder_address: 'Leopoldstr. 28, 80802 München',
    primary_driver_name: 'Max Mustermann', current_mileage_km: 12800, hu_valid_until: '2027-08-20',
    vin: 'WP0AB2A98NS234567', color: 'Kreide', fuel_type: 'Benzin', power_kw: 331,
    first_registration_date: '2024-01-10', engine_ccm: 2981, seats: 4, doors: 2,
    body_type: 'Coupé', weight_kg: 1565, co2_g_km: 229,
  },
];

const DEMO_INSURANCES: Record<string, Record<string, string>> = {
  'demo-1': { insurer: 'Allianz', policy_number: 'AZ-2024-78912', coverage_type: 'Vollkasko', annual_premium: '2.840,00 €', sf_class_liability: 'SF 12', sf_class_comprehensive: 'SF 10', deductible_partial: '150 €', deductible_comprehensive: '500 €' },
  'demo-2': { insurer: 'HUK-COBURG', policy_number: 'HUK-2022-45601', coverage_type: 'Vollkasko', annual_premium: '1.920,00 €', sf_class_liability: 'SF 15', sf_class_comprehensive: 'SF 12', deductible_partial: '150 €', deductible_comprehensive: '300 €' },
  'demo-3': { insurer: 'AXA Versicherung', policy_number: 'AXA-2024-11234', coverage_type: 'Vollkasko', annual_premium: '3.450,00 €', sf_class_liability: 'SF 8', sf_class_comprehensive: 'SF 8', deductible_partial: '150 €', deductible_comprehensive: '1.000 €' },
};

const DEMO_TRIPS = [
  { id: 't1', date: '12.02.2026', start: 'München', end: 'Stuttgart', km: 234, purpose: 'Geschäftlich' as const, customer: 'Huber GmbH' },
  { id: 't2', date: '10.02.2026', start: 'München', end: 'Nürnberg', km: 167, purpose: 'Geschäftlich' as const, customer: 'Meyer AG' },
  { id: 't3', date: '08.02.2026', start: 'München', end: 'Starnberg', km: 42, purpose: 'Privat' as const, customer: '' },
  { id: 't4', date: '05.02.2026', start: 'München', end: 'Augsburg', km: 68, purpose: 'Geschäftlich' as const, customer: 'Schmidt & Partner' },
  { id: 't5', date: '03.02.2026', start: 'München', end: 'Garmisch', km: 89, purpose: 'Privat' as const, customer: '' },
];

export default function CarsAutos() {
  const { activeTenantId, activeOrganization } = useAuth();
  const { triggerResearch } = useDossierAutoResearch();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-FAHRZEUG');

  // ----- Vehicle data from DB or demo -----
  const { data: dbVehicles, isLoading, refetch } = useQuery({
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

  const DEMO_CLIENT_IDS = new Set(['demo-1','demo-2','demo-3']);
  const realDbVehicles = dbVehicles?.filter((v: any) => !DEMO_CLIENT_IDS.has(v.id) && !isDemoId(v.id)) || [];
  const allDbVehicles = demoEnabled ? (dbVehicles || []) : realDbVehicles;
  const vehicles = allDbVehicles.length ? allDbVehicles : (demoEnabled ? DEMO_VEHICLES : []);
  const isDemo = !realDbVehicles.length && demoEnabled;

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

  return (
    <PageShell>
      <ModulePageHeader
        title="Autos"
        description="Fahrzeugverwaltung — Klicken Sie auf ein Fahrzeug für die vollständige Akte"
        actions={
          <Button variant="glass" size="icon-round" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Suchen..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Vehicle Widget Grid */}
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
                onClick={() => setSelectedVehicleId(isSelected ? null : vehicle.id)}
              >
                <div className="relative h-[55%] bg-muted/30 overflow-hidden">
                  <img src={getImage(vehicle)} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  <div className="absolute top-2 left-3 flex gap-1">
                    {isDemo && <Badge className={cn(DESIGN.DEMO_WIDGET.BADGE, "text-[9px]")}>DEMO</Badge>}
                    <Badge variant="outline" className={cn("text-[9px]", statusColors[vehicle.status as VehicleStatus])}>{statusLabels[vehicle.status as VehicleStatus]}</Badge>
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

      {/* Inline Fahrzeugakte */}
      {selectedVehicle && (
        <Card className="glass-card border-primary/20 animate-in slide-in-from-top-2 duration-300">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Car className="h-5 w-5 text-primary" />
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

            {/* Basisdaten */}
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
                { key: 'doors', label: 'Türen', value: String(selectedVehicle.doors || '') },
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

            {/* Versicherungen */}
            <EditableInsuranceSection vehicleId={selectedVehicle.id} isDemo={isDemo} demoData={DEMO_INSURANCES[selectedVehicle.id]} />

            <Separator />

            {/* Schäden */}
            <AkteSection icon={AlertTriangle} title="Schäden">
              <p className="text-sm text-muted-foreground">Keine Schäden erfasst</p>
            </AkteSection>

            <Separator />

            {/* Fahrtenbuch — Vimcar-Style */}
            <VimcarLogbook vehicleId={selectedVehicle.id} isDemo={isDemo} />

            <Separator />

            {/* Datenraum — StorageFileManager */}
            <AkteSection icon={FolderOpen} title="Datenraum">
              <VehicleDatenraum vehicleId={selectedVehicle.id} tenantId={activeTenantId || ''} isDemo={isDemo} />
            </AkteSection>
          </CardContent>
        </Card>
      )}

      <VehicleCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => { refetch(); setCreateDialogOpen(false); }}
        onVehicleCreated={(vehicleId, searchQuery) => {
          triggerResearch({ entityType: 'vehicle', entityId: vehicleId, searchQuery });
        }}
      />
    </PageShell>
  );
}

// ── Mini Info (widget cards) ────────────────────────────────────
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

// ── Section Wrapper ─────────────────────────────────────────────
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

// ── Editable Akte Field ─────────────────────────────────────────
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
    if (isDemo) {
      toast.success(`${key} aktualisiert (Demo-Modus)`);
      return;
    }
    try {
      const { error } = await supabase
        .from('cars_vehicles')
        .update({ [key]: newValue } as any)
        .eq('id', vehicleId);
      if (error) throw error;
      toast.success('Feld aktualisiert');
      onSaved();
    } catch {
      toast.error('Fehler beim Speichern');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, key: string) => {
    if (e.key === 'Enter') saveField(key);
    if (e.key === 'Escape') setEditingKey(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm uppercase tracking-wide">{title}</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {fields.map(f => (
          <div key={f.key}>
            <dt className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</dt>
            {editingKey === f.key ? (
              <div className="flex items-center gap-1 mt-0.5">
                <Input
                  autoFocus
                  value={editValues[f.key] ?? f.value}
                  onChange={e => setEditValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                  onBlur={() => saveField(f.key)}
                  onKeyDown={e => handleKeyDown(e, f.key)}
                  className="h-7 text-sm px-2"
                />
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => saveField(f.key)}>
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <dd
                className="text-sm font-medium cursor-text hover:text-primary transition-colors flex items-center gap-1 group/field"
                onClick={() => startEdit(f.key, f.value)}
              >
                {f.value || '—'}
                <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/field:opacity-100 transition-opacity" />
              </dd>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Editable Insurance Section ──────────────────────────────────
function EditableInsuranceSection({ vehicleId, isDemo, demoData }: { vehicleId: string; isDemo: boolean; demoData?: Record<string, string> }) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>(demoData || {
    insurer: '—', policy_number: '—', coverage_type: '—', annual_premium: '—',
    sf_class_liability: '—', sf_class_comprehensive: '—', deductible_partial: '—', deductible_comprehensive: '—',
  });

  const fields = [
    { key: 'insurer', label: 'Versicherer' },
    { key: 'policy_number', label: 'Policen-Nr.' },
    { key: 'coverage_type', label: 'Deckung' },
    { key: 'annual_premium', label: 'Jahresbeitrag' },
    { key: 'sf_class_liability', label: 'SF-Klasse KH' },
    { key: 'sf_class_comprehensive', label: 'SF-Klasse VK' },
    { key: 'deductible_partial', label: 'SB TK' },
    { key: 'deductible_comprehensive', label: 'SB VK' },
  ];

  const save = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
    setEditingKey(null);
    toast.success(`${key} aktualisiert${isDemo ? ' (Demo)' : ''}`);
  };

  return (
    <AkteSection icon={ShieldCheck} title="Versicherungen">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {fields.map(f => (
          <div key={f.key}>
            <dt className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</dt>
            {editingKey === f.key ? (
              <div className="flex items-center gap-1 mt-0.5">
                <Input
                  autoFocus
                  defaultValue={values[f.key]}
                  onBlur={e => save(f.key, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') save(f.key, (e.target as HTMLInputElement).value); if (e.key === 'Escape') setEditingKey(null); }}
                  className="h-7 text-sm px-2"
                />
              </div>
            ) : (
              <dd
                className="text-sm font-medium cursor-text hover:text-primary transition-colors flex items-center gap-1 group/field"
                onClick={() => setEditingKey(f.key)}
              >
                {values[f.key] || '—'}
                <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/field:opacity-100 transition-opacity" />
              </dd>
            )}
          </div>
        ))}
      </div>
    </AkteSection>
  );
}

// ── Vimcar-Style Logbook ────────────────────────────────────────
function VimcarLogbook({ vehicleId, isDemo }: { vehicleId: string; isDemo: boolean }) {
  const [trips, setTrips] = useState(DEMO_TRIPS);
  const [editingCell, setEditingCell] = useState<{ tripId: string; field: string } | null>(null);
  const [addingTrip, setAddingTrip] = useState(false);
  const [newTrip, setNewTrip] = useState({ date: '', start: '', end: '', km: '', purpose: 'Geschäftlich' as 'Geschäftlich' | 'Privat', customer: '' });

  const totalKm = trips.reduce((s, t) => s + t.km, 0);
  const businessKm = trips.filter(t => t.purpose === 'Geschäftlich').reduce((s, t) => s + t.km, 0);
  const businessPct = totalKm ? Math.round((businessKm / totalKm) * 100) : 0;

  const updateTrip = (tripId: string, field: string, value: string) => {
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, [field]: field === 'km' ? Number(value) || 0 : value } : t));
    setEditingCell(null);
    toast.success('Fahrt aktualisiert');
  };

  const addTrip = () => {
    if (!newTrip.date || !newTrip.start || !newTrip.end) { toast.error('Bitte alle Pflichtfelder ausfüllen'); return; }
    setTrips(prev => [{ id: `t${Date.now()}`, date: newTrip.date, start: newTrip.start, end: newTrip.end, km: Number(newTrip.km) || 0, purpose: newTrip.purpose, customer: newTrip.customer }, ...prev]);
    setNewTrip({ date: '', start: '', end: '', km: '', purpose: 'Geschäftlich', customer: '' });
    setAddingTrip(false);
    toast.success('Fahrt hinzugefügt');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm uppercase tracking-wide">Fahrtenbuch</h3>
          {/* Vimcar badge */}
          <Badge variant="outline" className="text-[9px] gap-1 border-amber-500/30 text-amber-600 bg-amber-500/5">
            <WifiOff className="h-2.5 w-2.5" />
            Vimcar — Nicht verbunden
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAddingTrip(!addingTrip)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Fahrt erfassen
        </Button>
      </div>

      {/* Monthly summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Gesamt km</p>
          <p className="text-lg font-bold">{totalKm.toLocaleString('de-DE')}</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Geschäftlich</p>
          <p className="text-lg font-bold text-primary">{businessPct}%</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Privat</p>
          <p className="text-lg font-bold">{100 - businessPct}%</p>
        </div>
      </div>

      {/* Add trip row */}
      {addingTrip && (
        <div className="grid grid-cols-6 gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
          <Input placeholder="TT.MM.JJJJ" value={newTrip.date} onChange={e => setNewTrip(p => ({ ...p, date: e.target.value }))} className="h-8 text-xs" />
          <Input placeholder="Start" value={newTrip.start} onChange={e => setNewTrip(p => ({ ...p, start: e.target.value }))} className="h-8 text-xs" />
          <Input placeholder="Ziel" value={newTrip.end} onChange={e => setNewTrip(p => ({ ...p, end: e.target.value }))} className="h-8 text-xs" />
          <Input placeholder="km" type="number" value={newTrip.km} onChange={e => setNewTrip(p => ({ ...p, km: e.target.value }))} className="h-8 text-xs" />
          <Select value={newTrip.purpose} onValueChange={(v: any) => setNewTrip(p => ({ ...p, purpose: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Geschäftlich">Geschäftlich</SelectItem>
              <SelectItem value="Privat">Privat</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <Input placeholder="Kunde" value={newTrip.customer} onChange={e => setNewTrip(p => ({ ...p, customer: e.target.value }))} className="h-8 text-xs flex-1" />
            <Button size="sm" className="h-8 px-2" onClick={addTrip}><Check className="h-3 w-3" /></Button>
          </div>
        </div>
      )}

      {/* Trip table */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border/50">
              <th className="text-left text-[10px] font-medium text-muted-foreground uppercase p-2.5">Datum</th>
              <th className="text-left text-[10px] font-medium text-muted-foreground uppercase p-2.5">Start</th>
              <th className="text-left text-[10px] font-medium text-muted-foreground uppercase p-2.5">Ziel</th>
              <th className="text-right text-[10px] font-medium text-muted-foreground uppercase p-2.5">km</th>
              <th className="text-left text-[10px] font-medium text-muted-foreground uppercase p-2.5">Zweck</th>
              <th className="text-left text-[10px] font-medium text-muted-foreground uppercase p-2.5">Kunde</th>
            </tr>
          </thead>
          <tbody>
            {trips.map(trip => (
              <tr key={trip.id} className="border-b border-border/30 hover:bg-muted/10">
                {(['date', 'start', 'end', 'km', 'purpose', 'customer'] as const).map(field => {
                  const isEditing = editingCell?.tripId === trip.id && editingCell?.field === field;
                  const val = String(trip[field]);
                  return (
                    <td key={field} className={cn("p-2.5", field === 'km' && 'text-right')}>
                      {isEditing ? (
                        <Input
                          autoFocus
                          defaultValue={val}
                          onBlur={e => updateTrip(trip.id, field, e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') updateTrip(trip.id, field, (e.target as HTMLInputElement).value); if (e.key === 'Escape') setEditingCell(null); }}
                          className="h-7 text-xs px-1"
                        />
                      ) : (
                        <span
                          className="cursor-text hover:text-primary transition-colors"
                          onClick={() => setEditingCell({ tripId: trip.id, field })}
                        >
                          {field === 'purpose' ? (
                            <Badge variant="outline" className={cn("text-[9px]", trip.purpose === 'Geschäftlich' ? 'border-primary/30 text-primary bg-primary/5' : 'border-muted-foreground/30')}>
                              {val}
                            </Badge>
                          ) : field === 'km' ? val + ' km' : val || '—'}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Vehicle Datenraum (StorageFileManager) ──────────────────────
function VehicleDatenraum({ vehicleId, tenantId, isDemo }: { vehicleId: string; tenantId: string; isDemo: boolean }) {
  const { activeOrganization } = useAuth();
  const queryClient = useQueryClient();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const { data: nodes = [], isLoading: nodesLoading } = useQuery({
    queryKey: ['storage-nodes-vehicle', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_nodes')
        .select('id, tenant_id, parent_id, name, node_type, auto_created, created_at, module_code, property_id, scope_hint, sort_index, doc_type_hint')
        .eq('module_code', 'MOD_17')
        .eq('scope_hint', vehicleId)
        .eq('tenant_id', tenantId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!vehicleId && !!tenantId && !isDemo,
  });

  const { data: documentLinks = [] } = useQuery({
    queryKey: ['document-links-vehicle', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_links')
        .select('id, document_id, node_id, object_type, object_id')
        .eq('object_id', vehicleId)
        .eq('object_type', 'vehicle')
        .eq('tenant_id', tenantId);
      if (error) throw error;
      return data;
    },
    enabled: !!vehicleId && !!tenantId && !isDemo,
  });

  const docIds = documentLinks.map(l => l.document_id).filter(Boolean);
  const { data: documents = [] } = useQuery({
    queryKey: ['vehicle-documents', vehicleId, docIds],
    queryFn: async () => {
      if (docIds.length === 0) return [];
      const { data, error } = await supabase
        .from('documents')
        .select('id, public_id, name, file_path, mime_type, size_bytes, created_at, uploaded_by')
        .in('id', docIds);
      if (error) throw error;
      return data;
    },
    enabled: docIds.length > 0 && !isDemo,
  });

  const { upload: universalUpload } = useUniversalUpload();

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['storage-nodes-vehicle', vehicleId] });
    queryClient.invalidateQueries({ queryKey: ['document-links-vehicle', vehicleId] });
    queryClient.invalidateQueries({ queryKey: ['vehicle-documents', vehicleId] });
  }, [queryClient, vehicleId]);

  const handleUploadFiles = useCallback(async (files: File[]) => {
    if (!activeOrganization) return;
    setIsUploading(true);
    let successCount = 0;
    for (const file of files) {
      try {
        const result = await universalUpload(file, {
          moduleCode: 'MOD_17',
          entityId: vehicleId,
          objectType: 'vehicle',
          objectId: vehicleId,
          parentNodeId: selectedNodeId || undefined,
          source: 'vehicle-datenraum',
        });
        if (result.error) throw new Error(result.error);
        successCount++;
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Fehler beim Upload von ${file.name}`);
      }
    }
    setIsUploading(false);
    if (successCount > 0) {
      toast.success(`${successCount} Datei(en) hochgeladen`);
      invalidate();
    }
  }, [activeOrganization, universalUpload, vehicleId, selectedNodeId, invalidate]);

  const handleDownload = useCallback(async (documentId: string) => {
    setIsDownloading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sot-dms-download-url`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.session?.access_token}` },
          body: JSON.stringify({ document_id: documentId }),
        }
      );
      if (!response.ok) throw new Error('Download fehlgeschlagen');
      const { download_url } = await response.json();
      window.open(download_url, '_blank');
    } catch {
      toast.error('Download fehlgeschlagen');
    }
    setIsDownloading(false);
  }, []);

  const handleDeleteDocument = useCallback(async (documentId: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('document_links').delete().eq('document_id', documentId).eq('object_id', vehicleId);
      if (error) throw error;
      toast.success('Dokument entfernt');
      invalidate();
    } catch { toast.error('Fehler beim Löschen'); }
    setIsDeleting(false);
  }, [vehicleId, invalidate]);

  const handleDeleteFolder = useCallback(async (nodeId: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('storage_nodes').delete().eq('id', nodeId);
      if (error) throw error;
      toast.success('Ordner gelöscht');
      invalidate();
    } catch { toast.error('Fehler beim Löschen'); }
    setIsDeleting(false);
  }, [invalidate]);

  const handleCreateFolder = useCallback(async (name: string, parentId: string | null) => {
    setIsCreatingFolder(true);
    try {
      const { error } = await supabase.from('storage_nodes').insert({
        tenant_id: tenantId,
        module_code: 'MOD_17',
        scope_hint: vehicleId,
        parent_id: parentId,
        name,
        node_type: 'folder',
        auto_created: false,
      });
      if (error) throw error;
      toast.success('Ordner erstellt');
      invalidate();
    } catch { toast.error('Fehler beim Erstellen'); }
    setIsCreatingFolder(false);
  }, [tenantId, vehicleId, invalidate]);

  const handleBulkDownload = useCallback(async (ids: Set<string>) => { for (const id of ids) await handleDownload(id); }, [handleDownload]);
  const handleBulkDelete = useCallback(async (ids: Set<string>) => { for (const id of ids) await handleDeleteDocument(id); }, [handleDeleteDocument]);

  const displayNodes = useMemo(() => {
    if (nodes.length === 0) return nodes;
    const nodeIds = new Set(nodes.map((n: any) => n.id));
    const rootNode = nodes.find((n: any) => !n.parent_id || !nodeIds.has(n.parent_id));
    if (!rootNode) return nodes;
    return nodes
      .filter((n: any) => n.id !== rootNode.id)
      .map((n: any) => n.parent_id === rootNode.id ? { ...n, parent_id: null } : n);
  }, [nodes]);

  if (isDemo) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">Datenraum wird nach Verbindung eines Fahrzeugs mit der Datenbank aktiviert. Im Demo-Modus werden Beispieldateien angezeigt.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Fahrzeugschein.pdf', 'Fahrzeugbrief.pdf', 'Leasingvertrag.pdf', 'TÜV-Bericht_2027.pdf', 'Versicherungspolice.pdf', 'Fahrzeugbild.jpg'].map(doc => (
            <div key={doc} className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs truncate">{doc}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <StorageFileManager
      nodes={displayNodes}
      documents={documents.filter((d: any) => {
        const link = documentLinks.find((l: any) => l.document_id === d.id);
        return selectedNodeId ? link?.node_id === selectedNodeId : true;
      })}
      allDocuments={documents}
      documentLinks={documentLinks}
      onUploadFiles={handleUploadFiles}
      onDownload={handleDownload}
      onDeleteDocument={handleDeleteDocument}
      onDeleteFolder={handleDeleteFolder}
      onCreateFolder={handleCreateFolder}
      onBulkDownload={handleBulkDownload}
      onBulkDelete={handleBulkDelete}
      isUploading={isUploading}
      isDownloading={isDownloading}
      isDeleting={isDeleting}
      isCreatingFolder={isCreatingFolder}
      selectedNodeId={selectedNodeId}
      onSelectNode={setSelectedNodeId}
    />
  );
}
