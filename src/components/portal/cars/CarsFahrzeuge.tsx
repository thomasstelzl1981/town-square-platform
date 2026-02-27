/**
 * CarsFahrzeuge — Merged Autos + Bikes: editable vehicle records with DMS & Vimcar logbook
 * All editing is inline — no popup dialogs.
 */
import { useState, useEffect, useCallback } from 'react';
import { useDossierAutoResearch } from '@/hooks/useDossierAutoResearch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRecordCardDMS } from '@/hooks/useRecordCardDMS';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { EntityStorageTree } from '@/components/shared/EntityStorageTree';
import { CarServiceFlow } from './CarServiceFlow';
import { useImageSlotUpload } from '@/hooks/useImageSlotUpload';
import { useDropzone } from 'react-dropzone';

import { toast } from 'sonner';
import {
  Plus, Search, Car, Bike, Gauge, Calendar, User, Shield,
  ChevronDown, FileText, AlertTriangle, BookOpen, FolderOpen, X, Wrench,
  Check, Pencil, Wifi, Save, Loader2, Trash2, Camera
} from 'lucide-react';
import { WidgetDeleteOverlay } from '@/components/shared/WidgetDeleteOverlay';
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




const isBike = (v: any) => v.vehicle_type === 'bike' || v.body_type === 'Motorrad';

export default function CarsFahrzeuge() {
  const { activeTenantId } = useAuth();
  const { triggerResearch } = useDossierAutoResearch();
  const { createDMS } = useRecordCardDMS();
  const [search, setSearch] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newVehicleData, setNewVehicleData] = useState<Record<string, string>>({});
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [vehicleImages, setVehicleImages] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  // Image slot upload hook — entityId is dynamic per vehicle, so we use a dummy config
  // and call loadSlotImages per vehicle
  const imageSlot = useImageSlotUpload({
    moduleCode: 'MOD-17',
    entityId: selectedVehicleId || '_',
    tenantId: activeTenantId || '',
    entityType: 'vehicle',
  });

  // Load images for all vehicles when list changes
  const loadAllVehicleImages = useCallback(async (vehicles: any[]) => {
    if (!activeTenantId || !vehicles.length) return;
    const newMap: Record<string, string> = {};
    for (const v of vehicles) {
      const slots = await imageSlot.loadSlotImages(v.id, 'vehicle');
      if (slots.hero?.url) {
        newMap[v.id] = slots.hero.url;
      }
    }
    if (Object.keys(newMap).length > 0) {
      setVehicleImages(prev => ({ ...prev, ...newMap }));
    }
  }, [activeTenantId, imageSlot.loadSlotImages]);
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);

  const deleteVehicleMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      setDeletingVehicleId(vehicleId);
      const { error } = await supabase.from('cars_vehicles').delete().eq('id', vehicleId);
      if (error) throw error;
    },
    onSuccess: () => {
      setDeletingVehicleId(null);
      if (selectedVehicleId === deletingVehicleId) setSelectedVehicleId(null);
      toast.success('Fahrzeug gelöscht');
      queryClient.invalidateQueries({ queryKey: ['cars_vehicles'] });
    },
    onError: (err: Error) => {
      setDeletingVehicleId(null);
      toast.error(`Fehler: ${err.message}`);
    },
  });

  const { data: dbVehicles, refetch } = useQuery({
    queryKey: ['cars_vehicles', activeTenantId] as const,
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
  // Filter out demo vehicles (DB-seeded IDs) when toggle is OFF
  const realDbVehicles = dbVehicles?.filter((v: any) => !isDemoId(v.id)) || [];
  const vehicles = showDemoWidget ? (dbVehicles || []) : realDbVehicles;
  const isDemo = !realDbVehicles.length && showDemoWidget;

  const filteredVehicles = vehicles.filter((v: any) => {
    const s = search.toLowerCase();
    return v.license_plate?.toLowerCase().includes(s) || v.make?.toLowerCase().includes(s) || v.model?.toLowerCase().includes(s);
  });

  // Load vehicle images when vehicles data changes or tenantId becomes available
  useEffect(() => {
    if (vehicles?.length && activeTenantId) {
      loadAllVehicleImages(vehicles);
    }
  }, [vehicles?.length, activeTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  const getImage = (v: any) => {
    // Priority: uploaded image > Unsplash fallback > default
    if (vehicleImages[v.id]) return vehicleImages[v.id];
    const key = Object.keys(VEHICLE_IMAGES).find(k => `${v.make} ${v.model}`.includes(k));
    return key ? VEHICLE_IMAGES[key] : DEFAULT_IMAGE;
  };

  const handleVehicleImageUpload = async (vehicleId: string, file: File) => {
    const result = await imageSlot.uploadToSlot('hero', file, vehicleId);
    if (result) {
      // Reload image for this vehicle
      const slots = await imageSlot.loadSlotImages(vehicleId, 'vehicle');
      if (slots.hero?.url) {
        setVehicleImages(prev => ({ ...prev, [vehicleId]: slots.hero.url }));
      }
    }
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

      // Create DMS folder + Sortierkachel
      if (newVehicle && activeTenantId) {
        const entityName = [newVehicleData.license_plate, newVehicleData.make, newVehicleData.model].filter(Boolean).join(' ');
        createDMS.mutate({
          entityType: 'vehicle',
          entityId: newVehicle.id,
          entityName,
          tenantId: activeTenantId,
          keywords: [newVehicleData.license_plate, newVehicleData.make, newVehicleData.model].filter(Boolean),
        });
      }

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
          <>
            <div className="relative max-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Suchen..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
            </div>
            <Button variant="glass" size="icon-round" onClick={handleCreateInline}>
              <Plus className="h-5 w-5" />
            </Button>
          </>
        }
      />

      <WidgetGrid>
        {filteredVehicles.map((vehicle: any) => {
          const huStatus = getHuStatus(vehicle.hu_valid_until);
          const isSelected = selectedVehicleId === vehicle.id;
          const vehicleIsDemo = isDemo || isDemoId(vehicle.id);
          return (
            <WidgetCell key={vehicle.id}>
               <Card
                className={cn(
                  "glass-card overflow-hidden cursor-pointer group transition-all h-full relative",
                  vehicleIsDemo
                    ? cn(DESIGN.DEMO_WIDGET.CARD, "ring-2 ring-emerald-400 border-emerald-400 shadow-sm")
                    : getActiveWidgetGlow('teal'),
                  isSelected ? "border-primary ring-2 ring-primary/20" : !vehicleIsDemo && "border-primary/10 hover:border-primary/30"
                )}
                 onClick={() => { setIsCreatingNew(false); setSelectedVehicleId(isSelected ? null : vehicle.id); }}
               >
                {!vehicleIsDemo && (
                  <WidgetDeleteOverlay
                    title={`${vehicle.make} ${vehicle.model}`}
                    onConfirmDelete={() => deleteVehicleMutation.mutate(vehicle.id)}
                    isDeleting={deletingVehicleId === vehicle.id}
                  />
                )}
                <VehicleCardImage
                  vehicle={vehicle}
                  imageUrl={getImage(vehicle)}
                  isUploading={imageSlot.uploadingSlot === 'hero' && selectedVehicleId === vehicle.id}
                  onUpload={(file) => {
                    setSelectedVehicleId(vehicle.id);
                    handleVehicleImageUpload(vehicle.id, file);
                  }}
                  badges={
                    <>
                      {vehicleIsDemo && <Badge className={cn(DESIGN.DEMO_WIDGET.BADGE, "text-[9px]")}>DEMO</Badge>}
                      <Badge variant="outline" className={cn("text-[9px]", statusColors[vehicle.status as VehicleStatus])}>{statusLabels[vehicle.status as VehicleStatus]}</Badge>
                      {isBike(vehicle) && (
                        <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">
                          <Bike className="h-2.5 w-2.5 mr-0.5" /> Bike
                        </Badge>
                      )}
                    </>
                  }
                  licensePlate={vehicle.license_plate}
                  isSelected={isSelected}
                />
                <CardContent className="p-3 space-y-2 h-[45%] flex flex-col justify-between">
                  <h3 className="font-semibold text-sm">{vehicle.make} {vehicle.model}</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    <MiniInfo icon={User} label="Halter" value={vehicle.holder_name || '—'} />
                    <MiniInfo icon={Gauge} label="KM" value={vehicle.current_mileage_km?.toLocaleString('de-DE') || '—'} />
                    <MiniInfo icon={Calendar} label="HU" value={huStatus.text} urgent={huStatus.urgency === 'expired'} />
                    <MiniInfo icon={Wrench} label="Service" value="Bereit" />
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

            <CarServiceFlow
              vehicleId={selectedVehicle.id}
              holderAddress={selectedVehicle.holder_address}
              isDemo={isDemo}
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

function VehicleCardImage({ vehicle, imageUrl, isUploading, onUpload, badges, licensePlate, isSelected }: {
  vehicle: any; imageUrl: string; isUploading: boolean;
  onUpload: (file: File) => void;
  badges?: React.ReactNode; licensePlate?: string; isSelected?: boolean;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    noClick: false,
    onDrop: (files) => { if (files[0]) onUpload(files[0]); },
  });

  return (
    <div className="relative h-[55%] bg-muted/30 overflow-hidden">
      <img src={imageUrl} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      {badges && (
        <div className="absolute top-2 left-3 flex items-center gap-1.5 z-10">
          {badges}
        </div>
      )}
      {licensePlate && (
        <div className="absolute bottom-2 left-3 z-10">
          <div className="bg-background/90 backdrop-blur-sm rounded-md px-3 py-1 border border-border/50">
            <span className="font-mono font-bold text-sm tracking-wider">{licensePlate}</span>
          </div>
        </div>
      )}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10">
          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
            <ChevronDown className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
        </div>
      )}
      {/* Upload overlay */}
      <div
        {...getRootProps()}
        onClick={(e) => { e.stopPropagation(); getRootProps().onClick?.(e); }}
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity cursor-pointer z-20",
          isDragActive ? "opacity-100 bg-primary/30 backdrop-blur-sm" : "opacity-0 hover:opacity-100"
        )}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />
        ) : (
          <div className="flex flex-col items-center gap-1 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2">
            <Camera className="h-5 w-5 text-primary" />
            <span className="text-[10px] font-medium text-foreground">Foto ändern</span>
          </div>
        )}
      </div>
    </div>
  );
}

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
        <div className="px-3 py-4 text-sm text-muted-foreground text-center">
          Keine Fahrten erfasst — Vimcar-Integration aktivieren für automatisches Tracking
        </div>
      </div>
    </AkteSection>
  );
}
