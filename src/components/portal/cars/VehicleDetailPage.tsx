import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft, 
  Car, 
  FileText, 
  AlertTriangle,
  BookOpen,
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ClaimCreateDialog } from './ClaimCreateDialog';

type VehicleStatus = 'active' | 'inactive' | 'sold' | 'returned';
type ClaimStatus = 'draft' | 'open' | 'awaiting_docs' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'closed';
type DamageType = 'accident' | 'theft' | 'glass' | 'vandalism' | 'storm' | 'animal' | 'fire' | 'other';
type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid_petrol' | 'hybrid_diesel' | 'lpg' | 'cng' | 'hydrogen';

const statusLabels: Record<VehicleStatus, string> = {
  active: 'Aktiv',
  inactive: 'Inaktiv',
  sold: 'Verkauft',
  returned: 'Zurückgegeben',
};

const statusVariants: Record<VehicleStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  sold: 'outline',
  returned: 'outline',
};


const claimStatusLabels: Record<ClaimStatus, string> = {
  draft: 'Entwurf',
  open: 'Offen',
  awaiting_docs: 'Warte auf Docs',
  submitted: 'Eingereicht',
  in_review: 'In Prüfung',
  approved: 'Genehmigt',
  rejected: 'Abgelehnt',
  closed: 'Abgeschlossen',
};

const damageTypeLabels: Record<DamageType, string> = {
  accident: 'Unfall',
  theft: 'Diebstahl',
  glass: 'Glasschaden',
  vandalism: 'Vandalismus',
  storm: 'Sturmschaden',
  animal: 'Wildschaden',
  fire: 'Brandschaden',
  other: 'Sonstiges',
};

const fuelTypeLabels: Record<FuelType, string> = {
  petrol: 'Benzin',
  diesel: 'Diesel',
  electric: 'Elektro',
  hybrid_petrol: 'Hybrid (Benzin)',
  hybrid_diesel: 'Hybrid (Diesel)',
  lpg: 'Autogas (LPG)',
  cng: 'Erdgas (CNG)',
  hydrogen: 'Wasserstoff',
};

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value || '—'}</dd>
    </div>
  );
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('akte');
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteVehicle = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('cars_vehicles').delete().eq('id', id);
      if (error) throw error;
      toast.success('Fahrzeug gelöscht');
      queryClient.invalidateQueries({ queryKey: ['cars_vehicles'] });
      navigate('/portal/cars/fahrzeuge');
    } catch (err: any) {
      toast.error(`Fehler: ${err.message}`);
    }
    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  // Fetch vehicle
  const { data: vehicle, isLoading: vehicleLoading } = useQuery({
    queryKey: ['cars_vehicle', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('cars_vehicles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch financing
  const { data: financing } = useQuery({
    queryKey: ['cars_financing', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('cars_financing')
        .select('*')
        .eq('vehicle_id', id)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch claims

  // Fetch claims
  const { data: claims } = useQuery({
    queryKey: ['cars_claims', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('cars_claims')
        .select('*')
        .eq('vehicle_id', id)
        .order('damage_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch logbook connection
  const { data: logbookConnection } = useQuery({
    queryKey: ['cars_logbook_connections', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('cars_logbook_connections')
        .select('*')
        .eq('vehicle_id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch trips
  const { data: trips } = useQuery({
    queryKey: ['cars_trips', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('cars_trips')
        .select('*')
        .eq('vehicle_id', id)
        .order('start_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  if (vehicleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Fahrzeug nicht gefunden</h3>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/portal/cars/fahrzeuge')}>
            Zurück zur Übersicht
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return format(new Date(dateStr), 'dd.MM.yyyy', { locale: de });
  };

  const formatCurrency = (cents: number | null) => {
    if (cents === null) return '—';
    return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  };

  const financeTypeLabels: Record<string, string> = {
    owned: 'Eigentum',
    financed: 'Finanziert',
    leased: 'Leasing',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal/cars/fahrzeuge')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{vehicle.license_plate}</h1>
            <Badge variant={statusVariants[vehicle.status as VehicleStatus]}>
              {statusLabels[vehicle.status as VehicleStatus]}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {vehicle.make && vehicle.model ? `${vehicle.make} ${vehicle.model}` : 'Fahrzeug'}
            {vehicle.variant && ` ${vehicle.variant}`}
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Bearbeiten
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="akte" className="gap-2">
            <FileText className="h-4 w-4" />
            Akte
          </TabsTrigger>
          <TabsTrigger value="schaeden" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Schäden ({claims?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="fahrtenbuch" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Fahrtenbuch
          </TabsTrigger>
          <TabsTrigger value="dokumente" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Dokumente
          </TabsTrigger>
        </TabsList>

        {/* Akte Tab */}
        <TabsContent value="akte" className="space-y-6 mt-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <FieldGroup title="Fahrzeug">
                <Field label="Kennzeichen" value={vehicle.license_plate} />
                <Field label="VIN" value={vehicle.vin} />
                <Field label="HSN" value={vehicle.hsn} />
                <Field label="TSN" value={vehicle.tsn} />
                <Field label="Hersteller" value={vehicle.make} />
                <Field label="Modell" value={vehicle.model} />
                <Field label="Variante" value={vehicle.variant} />
                <Field label="Erstzulassung" value={formatDate(vehicle.first_registration_date)} />
                <Field label="Leistung" value={vehicle.power_kw ? `${vehicle.power_kw} kW` : null} />
                <Field label="Hubraum" value={vehicle.engine_ccm ? `${vehicle.engine_ccm} ccm` : null} />
                <Field label="Kraftstoff" value={vehicle.fuel_type ? fuelTypeLabels[vehicle.fuel_type as FuelType] || vehicle.fuel_type : null} />
                <Field label="CO2" value={vehicle.co2_g_km ? `${vehicle.co2_g_km} g/km` : null} />
                <Field label="Leergewicht" value={vehicle.weight_kg ? `${vehicle.weight_kg} kg` : null} />
                <Field label="Sitze" value={vehicle.seats} />
                <Field label="Farbe" value={vehicle.color} />
                <Field label="Karosserie" value={vehicle.body_type} />
              </FieldGroup>

              <Separator />

              <FieldGroup title="KM-Stand & Prüfungen">
                <Field label="Aktueller KM" value={vehicle.current_mileage_km?.toLocaleString('de-DE')} />
                <Field label="Stand vom" value={formatDate(vehicle.mileage_updated_at)} />
                <Field label="Jährliche Fahrleistung" value={vehicle.annual_mileage_km ? `${vehicle.annual_mileage_km.toLocaleString('de-DE')} km` : null} />
                <Field label="HU gültig bis" value={formatDate(vehicle.hu_valid_until)} />
                <Field label="AU gültig bis" value={formatDate(vehicle.au_valid_until)} />
              </FieldGroup>

              <Separator />

              <FieldGroup title="Halter & Fahrer">
                <Field label="Halter" value={vehicle.holder_name} />
                <Field label="Adresse" value={vehicle.holder_address} />
                <Field label="Hauptfahrer" value={vehicle.primary_driver_name} />
                <Field label="Geb. Hauptfahrer" value={formatDate(vehicle.primary_driver_birthdate)} />
              </FieldGroup>

              <Separator />

              <FieldGroup title="Finanzierung / Leasing">
                {financing ? (
                  <>
                    <Field label="Typ" value={financeTypeLabels[financing.finance_type]} />
                    <Field label="Anbieter" value={financing.provider_name} />
                    <Field label="Vertragsnummer" value={financing.contract_number} />
                    <Field label="Laufzeit" value={`${formatDate(financing.start_date)} – ${formatDate(financing.end_date)}`} />
                    <Field label="Monatsrate" value={formatCurrency(financing.monthly_rate_cents)} />
                    <Field label="Restwert" value={formatCurrency(financing.residual_value_cents)} />
                    <Field label="KM-Limit" value={financing.total_km_limit?.toLocaleString('de-DE')} />
                    <Field label="Zinssatz" value={financing.interest_rate_percent ? `${financing.interest_rate_percent}%` : null} />
                  </>
                ) : (
                  <div className="col-span-4 text-sm text-muted-foreground">
                    Keine Finanzierung/Leasing hinterlegt
                  </div>
                )}
              </FieldGroup>

              <Separator />

              <FieldGroup title="Status & Notizen">
                <Field label="Status" value={
                  <Badge variant={statusVariants[vehicle.status as VehicleStatus]}>
                    {statusLabels[vehicle.status as VehicleStatus]}
                  </Badge>
                } />
                <div className="col-span-3">
                  <Field label="Notizen" value={vehicle.notes} />
                </div>
              </FieldGroup>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Schäden Tab */}
        <TabsContent value="schaeden" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Schäden</CardTitle>
                <CardDescription>Gemeldete Schadensfälle</CardDescription>
              </div>
              <Button size="sm" onClick={() => setClaimDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Schaden melden
              </Button>
            </CardHeader>
            <CardContent>
              {claims && claims.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Beschreibung</TableHead>
                      <TableHead className="text-right">Kosten</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.map((claim) => (
                      <TableRow key={claim.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>{formatDate(claim.damage_date)}</TableCell>
                        <TableCell>{damageTypeLabels[claim.damage_type as DamageType] || claim.damage_type}</TableCell>
                        <TableCell className="max-w-xs truncate">{claim.description || '—'}</TableCell>
                        <TableCell className="text-right">
                          {claim.final_cost_cents 
                            ? formatCurrency(claim.final_cost_cents)
                            : claim.estimated_cost_cents 
                              ? `~${formatCurrency(claim.estimated_cost_cents)}`
                              : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {claimStatusLabels[claim.status as ClaimStatus]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Keine Schäden erfasst</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setClaimDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schaden melden
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fahrtenbuch Tab */}
        <TabsContent value="fahrtenbuch" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider-Verbindung</CardTitle>
            </CardHeader>
            <CardContent>
              {logbookConnection && logbookConnection.status === 'connected' ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="default">Verbunden</Badge>
                    <span className="font-medium capitalize">{logbookConnection.provider}</span>
                    <span className="text-sm text-muted-foreground">
                      Letzte Sync: {logbookConnection.last_sync_at ? formatDate(logbookConnection.last_sync_at) : 'Nie'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Jetzt synchronisieren</Button>
                    <Button variant="ghost" size="sm">Verbindung trennen</Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">Kein Fahrtenbuch verbunden</p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm">Vimcar verbinden</Button>
                    <Button variant="ghost" size="sm">Manuell erfassen</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Fahrten</CardTitle>
              <Button variant="outline" size="sm">Export</Button>
            </CardHeader>
            <CardContent>
              {trips && trips.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Strecke</TableHead>
                      <TableHead>Kategorie</TableHead>
                      <TableHead className="text-right">KM</TableHead>
                      <TableHead>Zweck</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>{formatDate(trip.start_at)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {trip.start_address} → {trip.end_address}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{trip.classification}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{Number(trip.distance_km).toFixed(1)} km</TableCell>
                        <TableCell className="max-w-xs truncate">{trip.purpose || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Keine Fahrten erfasst</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dokumente Tab */}
        <TabsContent value="dokumente" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dokumente</CardTitle>
              <CardDescription>Alle Dokumente zu diesem Fahrzeug</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>DMS-Integration folgt</p>
                <p className="text-sm mt-1">Dokumente werden im globalen DMS unter /Car-Management/Fahrzeuge/{vehicle.license_plate}/ abgelegt</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {id && (
        <>
          <ClaimCreateDialog
            open={claimDialogOpen}
            onOpenChange={setClaimDialogOpen}
            vehicleId={id}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['cars_claims', id] });
              setClaimDialogOpen(false);
            }}
          />
        </>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fahrzeug löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Das Fahrzeug und alle verknüpften Daten werden unwiderruflich gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteVehicle} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
