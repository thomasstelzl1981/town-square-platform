/**
 * Unit Detail Page - Individual unit dossier within a project
 * MOD-13 PROJEKTE
 * 
 * Demo mode: When unitId starts with 'demo-unit-', renders a full
 * Investment-Engine exposé with live sliders (no DB queries).
 */

import { useState, useEffect } from 'react';
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
import { ArrowLeft, Home, Euro, FileText, Users, Save, Clock, CheckCircle, XCircle, MapPin, Maximize2, Calendar, Building2, Loader2, ImageIcon, Map } from 'lucide-react';
import { LoadingState } from '@/components/shared/LoadingState';
import { UnitStatusBadge } from '@/components/projekte';
import { cn } from '@/lib/utils';
import type { DevProjectUnit, DevProjectReservation } from '@/types/projekte';

// Investment Engine imports
import { useInvestmentEngine, defaultInput } from '@/hooks/useInvestmentEngine';
import type { CalculationInput } from '@/hooks/useInvestmentEngine';
import { MasterGraph } from '@/components/investment/MasterGraph';
import { Haushaltsrechnung } from '@/components/investment/Haushaltsrechnung';
import { InvestmentSliderPanel } from '@/components/investment/InvestmentSliderPanel';
import { DetailTable40Jahre } from '@/components/investment/DetailTable40Jahre';
import { FinanzierungSummary } from '@/components/investment/FinanzierungSummary';

// Demo data
import { DEMO_UNITS, DEMO_UNIT_DETAIL } from '@/components/projekte/demoProjectData';

// ─── Demo Exposé ────────────────────────────────────────────────────────

function DemoUnitExpose() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const demoUnit = DEMO_UNITS[0];
  const detail = DEMO_UNIT_DETAIL;

  const { calculate, result: calcResult, isLoading: isCalculating } = useInvestmentEngine();

  const [params, setParams] = useState<CalculationInput>({
    ...defaultInput,
    purchasePrice: demoUnit.list_price,
    monthlyRent: demoUnit.rent_monthly,
    equity: Math.round(demoUnit.list_price * 0.2),
  });

  useEffect(() => {
    calculate(params);
  }, []);

  const handleParamsChange = (newParams: CalculationInput) => {
    setParams(newParams);
    calculate(newParams);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  return (
    <div className="p-6 space-y-6 relative">
      {/* Musterdaten Badge */}
      <div className="absolute top-4 right-4 z-10">
        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">
          Musterdaten
        </Badge>
      </div>

      {/* Back button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal/projekte/projekte')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{demoUnit.unit_number} — {detail.title}</h1>
          <p className="text-muted-foreground mt-1">
            {DEMO_UNIT_DETAIL.city} · Verkaufsexposé (Demo)
          </p>
        </div>
      </div>

      {/* 3-column grid: content (2/3) + sidebar (1/3) */}
      <div className="grid lg:grid-cols-3 gap-8 opacity-60">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery Placeholder */}
          <div className="aspect-video rounded-xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Beispielbilder</p>
              <p className="text-xs">Bildergalerie wird bei echten Objekten angezeigt</p>
            </div>
          </div>

          {/* Property Header */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <Badge className="mb-2">Eigentumswohnung</Badge>
                <h2 className="text-2xl font-bold">{detail.title}</h2>
                <p className="flex items-center gap-1 mt-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {detail.postal_code} {detail.city}, {detail.address}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(demoUnit.list_price)}
                </p>
              </div>
            </div>

            {/* Key Facts Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/50">
              <div>
                <p className="text-sm text-muted-foreground">Wohnfläche</p>
                <p className="font-semibold flex items-center gap-1">
                  <Maximize2 className="w-4 h-4" /> {demoUnit.area_sqm} m²
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Baujahr</p>
                <p className="font-semibold flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> {detail.year_built}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Zimmer</p>
                <p className="font-semibold">{demoUnit.rooms}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mieteinnahmen</p>
                <p className="font-semibold">{formatCurrency(params.monthlyRent)}/Mo</p>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Beschreibung</h3>
              <p className="text-muted-foreground whitespace-pre-line">{detail.description}</p>
            </div>
          </div>

          {/* MasterGraph */}
          {isCalculating ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : calcResult ? (
            <MasterGraph
              projection={calcResult.projection}
              title="Wertentwicklung (40 Jahre)"
              variant="full"
            />
          ) : null}

          {/* Haushaltsrechnung */}
          {calcResult && (
            <Haushaltsrechnung
              result={calcResult}
              variant="ledger"
              showMonthly={true}
            />
          )}

          {/* FinanzierungSummary */}
          {calcResult && (
            <FinanzierungSummary
              purchasePrice={demoUnit.list_price}
              equity={params.equity}
              result={calcResult}
            />
          )}

          {/* DetailTable40Jahre */}
          {calcResult && (
            <DetailTable40Jahre
              projection={calcResult.projection}
              defaultOpen={false}
            />
          )}

          {/* Map Placeholder */}
          <div className="aspect-[2/1] rounded-xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Map className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Standort</p>
              <p className="text-xs">Google Maps wird bei echten Objekten angezeigt</p>
            </div>
          </div>
        </div>

        {/* Right Column — Sticky Slider Panel */}
        <div className="space-y-6">
          <div className="sticky top-24">
            <InvestmentSliderPanel
              value={params}
              onChange={handleParamsChange}
              layout="vertical"
              showAdvanced={true}
              purchasePrice={demoUnit.list_price}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Real Unit Detail Page ──────────────────────────────────────────────

export default function UnitDetailPage() {
  const { projectId, unitId } = useParams<{ projectId: string; unitId: string }>();

  // Demo mode detection
  if (unitId?.startsWith('demo-unit-')) {
    return <DemoUnitExpose />;
  }

  return <RealUnitDetailPage />;
}

function RealUnitDetailPage() {
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

      let partnerOrg = null;
      if (reservation?.partner_org_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('id', reservation.partner_org_id)
          .single();
        partnerOrg = org;
      }

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
