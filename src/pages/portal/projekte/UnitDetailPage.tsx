/**
 * Unit Detail Page — Orchestrator for individual unit dossier within a project
 * MOD-13 PROJEKTE
 * 
 * R-12 Refactoring: 708 → ~150 lines
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Home, Euro, FileText, Users } from 'lucide-react';
import { LoadingState } from '@/components/shared/LoadingState';
import { UnitStatusBadge } from '@/components/projekte';
import type { DevProjectUnit, DevProjectReservation } from '@/types/projekte';
import {
  DemoUnitExpose,
  UnitStammdatenTab,
  UnitPreiseTab,
  UnitReservierungTab,
  UnitDokumenteTab,
} from '@/components/projekte/unit';

export default function UnitDetailPage() {
  const { unitId } = useParams<{ projectId: string; unitId: string }>();

  if (unitId?.startsWith('demo-unit-')) {
    return <DemoUnitExpose />;
  }

  return <RealUnitDetailPage />;
}

function RealUnitDetailPage() {
  const { projectId, unitId } = useParams<{ projectId: string; unitId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: unitData, isLoading, error } = useQuery({
    queryKey: ['project-unit-detail', unitId],
    queryFn: async () => {
      if (!unitId) return null;
      const { data: unit, error: unitError } = await supabase
        .from('dev_project_units')
        .select(`*, project:dev_projects(id, name, project_code, city)`)
        .eq('id', unitId).single();
      if (unitError) throw unitError;

      const { data: reservation, error: resError } = await supabase
        .from('sales_reservations')
        .select(`*, buyer_contact:contacts!sales_reservations_buyer_contact_id_fkey(id, first_name, last_name, email, phone)`)
        .eq('unit_id', unitId).not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (resError && resError.code !== 'PGRST116') throw resError;

      let partnerOrg = null;
      if (reservation?.partner_org_id) {
        const { data: org } = await supabase.from('organizations').select('id, name').eq('id', reservation.partner_org_id).single();
        partnerOrg = org;
      }

      const { data: dmsFolder } = await supabase
        .from('storage_nodes').select('*')
        .eq('dev_project_unit_id', unitId).eq('node_type', 'folder').maybeSingle();

      return {
        unit: unit as DevProjectUnit & { project: { id: string; name: string; project_code: string; city: string } },
        reservation: reservation ? { ...reservation, partner_org: partnerOrg } as DevProjectReservation : null,
        dmsFolder,
      };
    },
    enabled: !!unitId,
  });

  const updateUnit = useMutation({
    mutationFn: async (updates: Partial<DevProjectUnit>) => {
      const { data, error } = await supabase.from('dev_project_units').update(updates).eq('id', unitId!).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-unit-detail', unitId] });
      queryClient.invalidateQueries({ queryKey: ['dev-projects'] });
      toast.success('Einheit aktualisiert');
    },
    onError: (error: Error) => toast.error('Fehler: ' + error.message),
  });

  if (isLoading) return <LoadingState />;

  if (error || !unitData) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" />Zurück</Button>
        <div className="mt-4 text-destructive">Einheit nicht gefunden oder Fehler beim Laden.</div>
      </div>
    );
  }

  const { unit, reservation, dmsFolder } = unitData;
  const formatCurrency = (value: number | null) =>
    value != null ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value) : '–';

  return (
    <div className="p-6 space-y-6">
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
          <p className="text-muted-foreground mt-1">{unit.project.name} · {unit.project.city}</p>
        </div>
      </div>

      <Tabs defaultValue="stammdaten" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stammdaten"><Home className="mr-2 h-4 w-4" />Stammdaten</TabsTrigger>
          <TabsTrigger value="preise"><Euro className="mr-2 h-4 w-4" />Preise</TabsTrigger>
          <TabsTrigger value="reservierung"><Users className="mr-2 h-4 w-4" />Reservierung</TabsTrigger>
          <TabsTrigger value="dokumente"><FileText className="mr-2 h-4 w-4" />Dokumente</TabsTrigger>
        </TabsList>

        <TabsContent value="stammdaten">
          <UnitStammdatenTab unit={unit} onUpdate={(u) => updateUnit.mutate(u)} />
        </TabsContent>
        <TabsContent value="preise">
          <UnitPreiseTab unit={unit} onUpdate={(u) => updateUnit.mutate(u)} formatCurrency={formatCurrency} />
        </TabsContent>
        <TabsContent value="reservierung">
          <UnitReservierungTab reservation={reservation} formatCurrency={formatCurrency} />
        </TabsContent>
        <TabsContent value="dokumente">
          <UnitDokumenteTab unitNumber={unit.unit_number} dmsFolder={dmsFolder} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
