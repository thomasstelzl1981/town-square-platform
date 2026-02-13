/**
 * CarsAutos — Vehicle widgets with inline Fahrzeugakte (no pop-ups)
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, Search, Car, Camera, Gauge, Calendar, User, Shield, 
  ChevronDown, ChevronUp, FileText, ShieldCheck, AlertTriangle, BookOpen, FolderOpen, X
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { VehicleCreateDialog } from './VehicleCreateDialog';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';

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
  'BMW': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=250&fit=crop',
  'Mercedes-Benz': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=250&fit=crop',
  'Porsche': 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=250&fit=crop',
  'Audi': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=250&fit=crop',
};
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=250&fit=crop';

// Demo vehicles when DB is empty
const DEMO_VEHICLES = [
  { id: 'demo-1', public_id: 'FZ-001', license_plate: 'M-AB 1234', make: 'BMW', model: 'M4 Competition', status: 'active' as VehicleStatus, holder_name: 'Max Mustermann', current_mileage_km: 23450, hu_valid_until: '2027-03-15' },
  { id: 'demo-2', public_id: 'FZ-002', license_plate: 'M-MB 5678', make: 'Mercedes-Benz', model: 'GLE 450 4MATIC', status: 'active' as VehicleStatus, holder_name: 'Max Mustermann', current_mileage_km: 45200, hu_valid_until: '2026-11-01' },
  { id: 'demo-3', public_id: 'FZ-003', license_plate: 'M-P 9911', make: 'Porsche', model: '911 Carrera S', status: 'active' as VehicleStatus, holder_name: 'Max Mustermann', current_mileage_km: 12800, hu_valid_until: '2027-08-20' },
];

export default function CarsAutos() {
  const { activeTenantId } = useAuth();
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const { data: dbVehicles, isLoading, refetch } = useQuery({
    queryKey: ['cars_vehicles', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('cars_vehicles')
        .select('id, public_id, license_plate, make, model, holder_name, current_mileage_km, hu_valid_until, status')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const vehicles = dbVehicles?.length ? dbVehicles : DEMO_VEHICLES;

  const filteredVehicles = vehicles.filter((v) => {
    const s = search.toLowerCase();
    return v.license_plate.toLowerCase().includes(s) || v.make?.toLowerCase().includes(s) || v.model?.toLowerCase().includes(s);
  });

  const getImage = (make: string | null) => (make && VEHICLE_IMAGES[make]) || DEFAULT_IMAGE;

  const getHuStatus = (dateStr: string | null) => {
    if (!dateStr) return { text: '—', urgency: 'none' as const };
    const date = new Date(dateStr);
    const daysUntil = differenceInDays(date, new Date());
    const formatted = format(date, 'MM/yyyy', { locale: de });
    if (daysUntil < 0) return { text: formatted, urgency: 'expired' as const };
    if (daysUntil < 30) return { text: formatted, urgency: 'warning' as const };
    return { text: formatted, urgency: 'ok' as const };
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <PageShell>
      <ModulePageHeader
        title="Autos"
        description="Fahrzeugverwaltung — Klicken Sie auf ein Fahrzeug für die vollständige Akte"
        actions={
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Fahrzeug hinzufügen
          </Button>
        }
      />

      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Suchen..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Vehicle Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {filteredVehicles.map((vehicle) => {
          const huStatus = getHuStatus(vehicle.hu_valid_until);
          const isSelected = selectedVehicleId === vehicle.id;
          return (
            <Card
              key={vehicle.id}
              className={cn(
                "glass-card overflow-hidden cursor-pointer group transition-all",
                isSelected ? "border-primary ring-2 ring-primary/20" : "border-primary/10 hover:border-primary/30"
              )}
              onClick={() => setSelectedVehicleId(isSelected ? null : vehicle.id)}
            >
              <div className="relative h-36 bg-muted/30 overflow-hidden">
                <img src={getImage(vehicle.make)} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <div className="absolute top-2 left-3">
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
              <CardContent className="p-3 space-y-2">
                <h3 className="font-semibold text-sm">{vehicle.make} {vehicle.model}</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  <MiniInfo icon={User} label="Halter" value={vehicle.holder_name || '—'} />
                  <MiniInfo icon={Gauge} label="KM" value={vehicle.current_mileage_km?.toLocaleString('de-DE') || '—'} />
                  <MiniInfo icon={Calendar} label="HU" value={huStatus.text} urgent={huStatus.urgency === 'expired'} />
                  <MiniInfo icon={Shield} label="Vers." value="Aktiv" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
            <AkteSection icon={FileText} title="Basisdaten">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AkteField label="Kennzeichen" value={selectedVehicle.license_plate} editable />
                <AkteField label="Hersteller" value={selectedVehicle.make || '—'} editable />
                <AkteField label="Modell" value={selectedVehicle.model || '—'} editable />
                <AkteField label="Halter" value={selectedVehicle.holder_name || '—'} editable />
                <AkteField label="KM-Stand" value={selectedVehicle.current_mileage_km?.toLocaleString('de-DE') || '—'} editable />
                <AkteField label="HU gültig bis" value={selectedVehicle.hu_valid_until ? format(new Date(selectedVehicle.hu_valid_until), 'dd.MM.yyyy') : '—'} editable />
                <AkteField label="Erstzulassung" value="15.03.2023" editable />
                <AkteField label="Kraftstoff" value="Benzin" editable />
              </div>
            </AkteSection>

            <Separator />

            {/* Versicherungen */}
            <AkteSection icon={ShieldCheck} title="Versicherungen">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AkteField label="Versicherer" value="Allianz" editable />
                <AkteField label="Policen-Nr." value="AZ-2024-78912" editable />
                <AkteField label="Deckung" value="Vollkasko" editable />
                <AkteField label="Jahresbeitrag" value="1.248,00 €" editable />
                <AkteField label="SF-Klasse KH" value="SF 12" editable />
                <AkteField label="SF-Klasse VK" value="SF 10" editable />
                <AkteField label="SB TK" value="150 €" editable />
                <AkteField label="SB VK" value="500 €" editable />
              </div>
            </AkteSection>

            <Separator />

            {/* Schäden */}
            <AkteSection icon={AlertTriangle} title="Schäden">
              <p className="text-sm text-muted-foreground">Keine Schäden erfasst</p>
            </AkteSection>

            <Separator />

            {/* Fahrtenbuch */}
            <AkteSection icon={BookOpen} title="Fahrtenbuch">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AkteField label="Letzte Fahrt" value="12.02.2026" />
                <AkteField label="Strecke" value="München → Stuttgart" />
                <AkteField label="Distanz" value="234 km" />
                <AkteField label="Zweck" value="Geschäftlich" />
              </div>
            </AkteSection>

            <Separator />

            {/* Dokumente */}
            <AkteSection icon={FolderOpen} title="Dokumente">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Fahrzeugschein', 'Fahrzeugbrief', 'Leasingvertrag', 'TÜV-Bericht'].map((doc) => (
                  <div key={doc} className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-muted/20">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs truncate">{doc}</span>
                  </div>
                ))}
              </div>
            </AkteSection>
          </CardContent>
        </Card>
      )}

      <VehicleCreateDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onSuccess={() => { refetch(); setCreateDialogOpen(false); }} />
    </PageShell>
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

function AkteField({ label, value, editable }: { label: string; value: string; editable?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</dt>
      <dd className={cn("text-sm font-medium", editable && "cursor-text hover:text-primary transition-colors")}>{value}</dd>
    </div>
  );
}
