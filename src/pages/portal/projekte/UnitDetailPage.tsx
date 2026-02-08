/**
 * Unit Detail Page - Individual unit dossier within a project
 * MOD-13 PROJEKTE
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Home, Euro, FileText, Users, Save, Clock, CheckCircle, XCircle } from 'lucide-react';
import { LoadingState } from '@/components/shared/LoadingState';
import { UnitStatusBadge } from '@/components/projekte';
import type { DevProjectUnit, DevProjectReservation } from '@/types/projekte';

export default function UnitDetailPage() {
  const { projectId, unitId } = useParams<{ projectId: string; unitId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  // Fetch unit with project info
  const { data: unitData, isLoading, error } = useQuery({
    queryKey: ['project-unit-detail', unitId],
    queryFn: async () => {
      if (!unitId) return null;

      const { data: unit, error: unitError } = await supabase
        .from('dev_project_units')
        .select(`
          *,
          project:dev_projects(id, name, project_code, city)
        `)
        .eq('id', unitId)
        .single();

      if (unitError) throw unitError;

      // Fetch reservation if exists (use explicit hint for partner_org)
      const { data: reservation, error: resError } = await supabase
        .from('dev_project_reservations')
        .select(`
          *,
          buyer_contact:contacts(id, first_name, last_name, email, phone)
        `)
        .eq('unit_id', unitId)
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (resError && resError.code !== 'PGRST116') throw resError;

      // Fetch partner org separately if needed
      let partnerOrg = null;
      if (reservation?.partner_org_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('id', reservation.partner_org_id)
          .single();
        partnerOrg = org;
      }

      // Fetch DMS folder for this unit
      const { data: dmsFolder } = await supabase
        .from('storage_nodes')
        .select('*')
        .eq('dev_project_unit_id', unitId)
        .eq('node_type', 'folder')
        .maybeSingle();

      return {
        unit: unit as DevProjectUnit & { project: { id: string; name: string; project_code: string; city: string } },
        reservation: reservation ? { ...reservation, partner_org: partnerOrg } as DevProjectReservation : null,
        dmsFolder,
      };
    },
    enabled: !!unitId,
  });

  // Update unit mutation
  const updateUnit = useMutation({
    mutationFn: async (updates: Partial<DevProjectUnit>) => {
      const { data, error } = await supabase
        .from('dev_project_units')
        .update(updates)
        .eq('id', unitId!)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-unit-detail', unitId] });
      queryClient.invalidateQueries({ queryKey: ['dev-projects'] });
      toast.success('Einheit aktualisiert');
    },
    onError: (error: Error) => {
      toast.error('Fehler: ' + error.message);
    },
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !unitData) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <div className="mt-4 text-destructive">
          Einheit nicht gefunden oder Fehler beim Laden.
        </div>
      </div>
    );
  }

  const { unit, reservation, dmsFolder } = unitData;

  const formatCurrency = (value: number | null) =>
    value != null
      ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)
      : '–';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/portal/projekte/${projectId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Home className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold">WE-{unit.unit_number}</h1>
            <UnitStatusBadge status={unit.status} />
          </div>
          <p className="text-muted-foreground mt-1">
            {unit.project.name} · {unit.project.city}
          </p>
        </div>
      </div>

      <Tabs defaultValue="stammdaten" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stammdaten">
            <Home className="mr-2 h-4 w-4" />
            Stammdaten
          </TabsTrigger>
          <TabsTrigger value="preise">
            <Euro className="mr-2 h-4 w-4" />
            Preise
          </TabsTrigger>
          <TabsTrigger value="reservierung">
            <Users className="mr-2 h-4 w-4" />
            Reservierung
          </TabsTrigger>
          <TabsTrigger value="dokumente">
            <FileText className="mr-2 h-4 w-4" />
            Dokumente
          </TabsTrigger>
        </TabsList>

        {/* Block C: Stammdaten */}
        <TabsContent value="stammdaten">
          <Card>
            <CardHeader>
              <CardTitle>Einheiten-Stammdaten</CardTitle>
              <CardDescription>Grundlegende Informationen zur Einheit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Einheitennummer</Label>
                  <Input value={unit.unit_number} disabled className="mt-1.5" />
                </div>
                <div>
                  <Label>Etage</Label>
                  <Input 
                    type="number"
                    value={unit.floor ?? ''} 
                    onChange={(e) => updateUnit.mutate({ floor: parseInt(e.target.value) || null })}
                    className="mt-1.5" 
                  />
                </div>
                <div>
                  <Label>Wohnfläche (m²)</Label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={unit.area_sqm ?? ''} 
                    onChange={(e) => updateUnit.mutate({ area_sqm: parseFloat(e.target.value) || null })}
                    className="mt-1.5" 
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Zimmer</Label>
                  <Input 
                    type="number"
                    step="0.5"
                    value={unit.rooms_count ?? ''} 
                    onChange={(e) => updateUnit.mutate({ rooms_count: parseFloat(e.target.value) || null })}
                    className="mt-1.5" 
                  />
                </div>
                <div>
                  <Label>Grundbuchblatt</Label>
                  <Input 
                    value={unit.grundbuchblatt ?? ''} 
                    onChange={(e) => updateUnit.mutate({ grundbuchblatt: e.target.value || null })}
                    className="mt-1.5" 
                  />
                </div>
                <div>
                  <Label>TE-Nummer</Label>
                  <Input 
                    value={unit.te_number ?? ''} 
                    onChange={(e) => updateUnit.mutate({ te_number: e.target.value || null })}
                    className="mt-1.5" 
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Aktuelle Vermietung</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label>Mietername</Label>
                    <Input 
                      value={unit.tenant_name ?? ''} 
                      onChange={(e) => updateUnit.mutate({ tenant_name: e.target.value || null })}
                      className="mt-1.5" 
                    />
                  </div>
                  <div>
                    <Label>Aktuelle Miete (€)</Label>
                    <Input 
                      type="number"
                      value={unit.current_rent ?? ''} 
                      onChange={(e) => updateUnit.mutate({ current_rent: parseFloat(e.target.value) || null })}
                      className="mt-1.5" 
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label>Notizen</Label>
                <Textarea 
                  value={unit.notes ?? ''} 
                  onChange={(e) => updateUnit.mutate({ notes: e.target.value || null })}
                  className="mt-1.5 min-h-[100px]" 
                  placeholder="Interne Notizen zur Einheit..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Block E: Preise */}
        <TabsContent value="preise">
          <Card>
            <CardHeader>
              <CardTitle>Preise & Provision</CardTitle>
              <CardDescription>Verkaufspreise und Provisionsberechnung</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Listenpreis (€)</Label>
                  <Input 
                    type="number"
                    value={unit.list_price ?? ''} 
                    onChange={(e) => updateUnit.mutate({ list_price: parseFloat(e.target.value) || null })}
                    className="mt-1.5" 
                  />
                </div>
                <div>
                  <Label>Mindestpreis (€)</Label>
                  <Input 
                    type="number"
                    value={unit.min_price ?? ''} 
                    onChange={(e) => updateUnit.mutate({ min_price: parseFloat(e.target.value) || null })}
                    className="mt-1.5" 
                  />
                </div>
                <div>
                  <Label>Preis pro m²</Label>
                  <Input 
                    value={unit.area_sqm && unit.list_price 
                      ? formatCurrency(unit.list_price / unit.area_sqm) 
                      : '–'
                    } 
                    disabled 
                    className="mt-1.5" 
                  />
                </div>
              </div>

              <Separator />

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Kalkulation</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Listenpreis</span>
                    <span className="font-medium">{formatCurrency(unit.list_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mindestpreis</span>
                    <span className="font-medium">{formatCurrency(unit.min_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verhandlungsspielraum</span>
                    <span className="font-medium">
                      {unit.list_price && unit.min_price 
                        ? formatCurrency(unit.list_price - unit.min_price) 
                        : '–'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aktuelle Mietrendite</span>
                    <span className="font-medium">
                      {unit.current_rent && unit.list_price 
                        ? `${((unit.current_rent * 12) / unit.list_price * 100).toFixed(2)}%` 
                        : '–'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Block G: Reservierung */}
        <TabsContent value="reservierung">
          <Card>
            <CardHeader>
              <CardTitle>Reservierungsstatus</CardTitle>
              <CardDescription>
                {reservation 
                  ? 'Aktive Reservierung vorhanden' 
                  : 'Keine aktive Reservierung'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reservation ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <StatusBadge status={reservation.status} />
                    <span className="text-sm text-muted-foreground">
                      seit {new Date(reservation.reservation_date).toLocaleDateString('de-DE')}
                    </span>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">Käufer</Label>
                      <p className="font-medium">
                        {reservation.buyer_contact 
                          ? `${reservation.buyer_contact.first_name} ${reservation.buyer_contact.last_name}` 
                          : '–'}
                      </p>
                      {reservation.buyer_contact?.email && (
                        <p className="text-sm text-muted-foreground">{reservation.buyer_contact.email}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Partner</Label>
                      <p className="font-medium">
                        {reservation.partner_org?.name ?? '–'}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">Reservierungspreis</Label>
                      <p className="font-medium">{formatCurrency(reservation.reserved_price)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Ablaufdatum</Label>
                      <p className="font-medium">
                        {reservation.expiry_date 
                          ? new Date(reservation.expiry_date).toLocaleDateString('de-DE') 
                          : '–'}
                      </p>
                    </div>
                  </div>

                  {reservation.notary_date && (
                    <div>
                      <Label className="text-muted-foreground">Notartermin</Label>
                      <p className="font-medium">
                        {new Date(reservation.notary_date).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  )}

                  {reservation.notes && (
                    <div>
                      <Label className="text-muted-foreground">Notizen</Label>
                      <p className="text-sm">{reservation.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Diese Einheit ist aktuell frei verfügbar.</p>
                  <p className="text-sm mt-2">
                    Eine Reservierung kann über die Projektakte erstellt werden.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Block F: Dokumente */}
        <TabsContent value="dokumente">
          <Card>
            <CardHeader>
              <CardTitle>Einheiten-Dokumente</CardTitle>
              <CardDescription>
                Dokumente speziell für WE-{unit.unit_number}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dmsFolder ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{dmsFolder.name}</span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Dokumente können im DMS-Modul hochgeladen werden.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Kein DMS-Ordner für diese Einheit gefunden.</p>
                  <p className="text-sm mt-2">
                    Beim Anlegen neuer Projekte wird automatisch eine Ordnerstruktur erstellt.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component for reservation status
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: typeof Clock; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { icon: Clock, label: 'Ausstehend', variant: 'secondary' },
    confirmed: { icon: CheckCircle, label: 'Bestätigt', variant: 'default' },
    notary_scheduled: { icon: Clock, label: 'Notar geplant', variant: 'default' },
    completed: { icon: CheckCircle, label: 'Abgeschlossen', variant: 'default' },
    cancelled: { icon: XCircle, label: 'Storniert', variant: 'destructive' },
    expired: { icon: XCircle, label: 'Abgelaufen', variant: 'destructive' },
  };

  const { icon: Icon, label, variant } = config[status] || config.pending;

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
