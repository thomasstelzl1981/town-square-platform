/**
 * ProjectDetailPage — Orchestrator
 * R-31: 456 → ~120 lines
 */
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2, MapPin, LayoutGrid, Calculator,
  Euro, FileText, BookOpen, Users, FileSignature, Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProjectDossier, useDevProjects } from '@/hooks/useDevProjects';
import { useProjectUnits } from '@/hooks/useProjectUnits';
import { useAuth } from '@/contexts/AuthContext';
import {
  ProjectPricingBlock, ProjectDocumentsBlock, ProjectReservationsBlock,
  ProjectSalesBlock, ProjectContractsBlock, ProjectPublicationBlock,
  ProjectAufteilerCalculation,
} from '@/components/projekte';
import { LoadingState } from '@/components/shared/LoadingState';
import { ProjectDetailHeader } from '@/components/projekte/ProjectDetailHeader';
import { ProjectUnitsTable } from '@/components/projekte/ProjectUnitsTable';
import { ProjectIdentityTab, ProjectLocationTab } from '@/components/projekte/ProjectInfoTabs';
import { calculateProjectKPIs, calculateAufteiler } from '@/types/projekte';

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: dossier, isLoading } = useProjectDossier(projectId);
  const { units } = useProjectUnits(projectId);
  const { deleteProject } = useDevProjects();

  if (isLoading) return <LoadingState />;

  if (!dossier) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Projekt nicht gefunden</p>
        <Button variant="link" onClick={() => navigate('/portal/projekte/projekte')}>Zurück zum Portfolio</Button>
      </div>
    );
  }

  const { project, context, calculation } = dossier;
  const kpis = calculateProjectKPIs(project, units, calculation);

  const aufteilerCalc = project.purchase_price && project.total_sale_target ? calculateAufteiler({
    purchase_price: project.purchase_price,
    ancillary_cost_percent: project.ancillary_cost_percent,
    renovation_total: project.renovation_budget || 0,
    sales_commission_percent: project.commission_rate_percent,
    holding_period_months: project.holding_period_months,
    total_sale_proceeds: project.total_sale_target,
    units_count: units.length || project.total_units_count,
  }) : null;

  return (
    <div className="p-6 space-y-6">
      <ProjectDetailHeader
        project={project} context={context} units={units}
        kpis={kpis} aufteilerCalc={aufteilerCalc}
        tenantId={profile?.active_tenant_id}
        onDelete={(id) => deleteProject.mutateAsync(id)}
      />

      <Tabs defaultValue="units" className="space-y-4">
        <TabsList className="grid grid-cols-5 lg:grid-cols-10 h-auto">
          <TabsTrigger value="identity" className="flex items-center gap-1 text-xs"><Building2 className="h-3 w-3" /><span className="hidden lg:inline">Identität</span></TabsTrigger>
          <TabsTrigger value="location" className="flex items-center gap-1 text-xs"><MapPin className="h-3 w-3" /><span className="hidden lg:inline">Standort</span></TabsTrigger>
          <TabsTrigger value="units" className="flex items-center gap-1 text-xs"><LayoutGrid className="h-3 w-3" /><span className="hidden lg:inline">Einheiten</span></TabsTrigger>
          <TabsTrigger value="calculation" className="flex items-center gap-1 text-xs"><Calculator className="h-3 w-3" /><span className="hidden lg:inline">Kalkulation</span></TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-1 text-xs"><Euro className="h-3 w-3" /><span className="hidden lg:inline">Preise</span></TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1 text-xs"><FileText className="h-3 w-3" /><span className="hidden lg:inline">Dokumente</span></TabsTrigger>
          <TabsTrigger value="reservations" className="flex items-center gap-1 text-xs"><BookOpen className="h-3 w-3" /><span className="hidden lg:inline">Reserv.</span></TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-1 text-xs"><Users className="h-3 w-3" /><span className="hidden lg:inline">Vertrieb</span></TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center gap-1 text-xs"><FileSignature className="h-3 w-3" /><span className="hidden lg:inline">Verträge</span></TabsTrigger>
          <TabsTrigger value="publication" className="flex items-center gap-1 text-xs"><Globe className="h-3 w-3" /><span className="hidden lg:inline">Marketing</span></TabsTrigger>
        </TabsList>

        <TabsContent value="identity"><ProjectIdentityTab project={project} context={context} /></TabsContent>
        <TabsContent value="location"><ProjectLocationTab project={project} /></TabsContent>
        <TabsContent value="units"><ProjectUnitsTable project={project} units={units} /></TabsContent>
        <TabsContent value="calculation"><ProjectAufteilerCalculation project={project} units={units} /></TabsContent>
        <TabsContent value="pricing"><ProjectPricingBlock project={project} units={units} /></TabsContent>
        <TabsContent value="documents"><ProjectDocumentsBlock project={project} /></TabsContent>
        <TabsContent value="reservations"><ProjectReservationsBlock projectId={project.id} units={units} /></TabsContent>
        <TabsContent value="sales"><ProjectSalesBlock projectId={project.id} reservations={dossier.reservations as any} commissionRate={project.commission_rate_percent} /></TabsContent>
        <TabsContent value="contracts"><ProjectContractsBlock projectId={project.id} reservations={dossier.reservations as any} documents={dossier.documents as any} /></TabsContent>
        <TabsContent value="publication"><ProjectPublicationBlock project={project} /></TabsContent>
      </Tabs>
    </div>
  );
}
