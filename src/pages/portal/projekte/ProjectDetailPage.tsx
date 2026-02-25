/**
 * Project Detail Page - Projektakte (10-Block-Struktur)
 * MOD-13 PROJEKTE
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DESIGN } from '@/config/designManifest';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ArrowLeft, Building2, MapPin, LayoutGrid, Calculator, 
  Euro, FileText, BookOpen, Users, FileSignature, Globe,
  Pencil, MoreHorizontal, Trash2
} from 'lucide-react';
import { useProjectDossier, useDevProjects } from '@/hooks/useDevProjects';
import { useProjectUnits } from '@/hooks/useProjectUnits';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UnitStatusBadge, 
  ProjectPricingBlock,
  ProjectDocumentsBlock,
  ProjectReservationsBlock,
  ProjectSalesBlock,
  ProjectContractsBlock,
  ProjectPublicationBlock,
  ProjectAufteilerCalculation,
} from '@/components/projekte';
import { ProjectDeleteDialog } from '@/components/projekte/ProjectDeleteDialog';
import { LoadingState } from '@/components/shared/LoadingState';
import { CreatePropertyFromUnits } from '@/components/projekte/CreatePropertyFromUnits';
import { calculateProjectKPIs, calculateAufteiler } from '@/types/projekte';
import type { ProjectStatus, ProjectPortfolioRow } from '@/types/projekte';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  // New Aufteiler lifecycle statuses
  draft_intake: { label: 'KI-Import', variant: 'outline' },
  draft_ready: { label: 'Bereit', variant: 'outline' },
  in_sales_setup: { label: 'Vorbereitung', variant: 'secondary' },
  in_distribution: { label: 'Im Vertrieb', variant: 'default' },
  sellout_in_progress: { label: 'Abverkauf', variant: 'default' },
  sold_out: { label: 'Ausverkauft', variant: 'secondary' },
  closed: { label: 'Geschlossen', variant: 'outline' },
  // Legacy statuses (backward compatibility)
  draft: { label: 'Entwurf', variant: 'outline' },
  active: { label: 'Aktiv', variant: 'default' },
  paused: { label: 'Pausiert', variant: 'secondary' },
  completed: { label: 'Abgeschlossen', variant: 'secondary' },
  archived: { label: 'Archiviert', variant: 'outline' },
};

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('de-DE', { 
    style: 'currency', 
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: dossier, isLoading } = useProjectDossier(projectId);
  const { units, stats: unitStats } = useProjectUnits(projectId);
  const { deleteProject } = useDevProjects();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!dossier) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Projekt nicht gefunden</p>
        <Button variant="link" onClick={() => navigate('/portal/projekte/projekte')}>
          Zurück zum Portfolio
        </Button>
      </div>
    );
  }

  const { project, context, calculation } = dossier;
  const kpis = calculateProjectKPIs(project, units, calculation);
  const statusConfig = STATUS_CONFIG[project.status];

  // Calculate aufteiler if we have the data
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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/portal/projekte/projekte')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground mt-1">
              <span className="font-mono">{project.project_code}</span>
              {project.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {project.city}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {context.name}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Projekt löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete Dialog */}
      <ProjectDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        project={{
          id: project.id,
          project_code: project.project_code,
          name: project.name,
          city: project.city,
          postal_code: project.postal_code,
          project_type: (project as any).project_type || null,
          status: project.status,
          total_units_count: project.total_units_count || units.length,
          units_available: units.filter(u => u.status === 'available').length,
          units_reserved: units.filter(u => u.status === 'reserved').length,
          units_sold: units.filter(u => u.status === 'sold').length,
          purchase_price: project.purchase_price,
          total_sale_target: project.total_sale_target,
          sale_revenue_actual: null,
          profit_margin_percent: null,
          progress_percent: 0,
          kaufy_listed: false,
          kaufy_featured: false,
          landingpage_enabled: false,
        } as ProjectPortfolioRow}
        tenantId={profile?.active_tenant_id}
        onConfirmDelete={async (id) => {
          const result = await deleteProject.mutateAsync(id);
          navigate('/portal/projekte/projekte');
          return result;
        }}
      />

      {/* Quick KPIs */}
      <div className={DESIGN.KPI_GRID.FULL}>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Einheiten</div>
            <div className="text-2xl font-bold">{kpis.totalUnits}</div>
            <div className="flex gap-2 mt-1 text-xs">
              <span className="text-green-600">{kpis.unitsAvailable} frei</span>
              <span className="text-yellow-600">{kpis.unitsReserved} res.</span>
              <span className="text-blue-600">{kpis.unitsSold} verk.</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Fortschritt</div>
            <div className="flex items-center gap-2">
              <Progress value={kpis.progressPercent} className="flex-1" />
              <span className="text-lg font-bold">{kpis.progressPercent}%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Rohgewinn</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(aufteilerCalc?.gross_profit || kpis.grossProfit)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Marge</div>
            <div className="text-2xl font-bold">
              {(aufteilerCalc?.profit_margin_percent || kpis.marginPercent).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Dossier Sections */}
      <Tabs defaultValue="units" className="space-y-4">
        <TabsList className="grid grid-cols-5 lg:grid-cols-10 h-auto">
          <TabsTrigger value="identity" className="flex items-center gap-1 text-xs">
            <Building2 className="h-3 w-3" />
            <span className="hidden lg:inline">Identität</span>
          </TabsTrigger>
          <TabsTrigger value="location" className="flex items-center gap-1 text-xs">
            <MapPin className="h-3 w-3" />
            <span className="hidden lg:inline">Standort</span>
          </TabsTrigger>
          <TabsTrigger value="units" className="flex items-center gap-1 text-xs">
            <LayoutGrid className="h-3 w-3" />
            <span className="hidden lg:inline">Einheiten</span>
          </TabsTrigger>
          <TabsTrigger value="calculation" className="flex items-center gap-1 text-xs">
            <Calculator className="h-3 w-3" />
            <span className="hidden lg:inline">Kalkulation</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-1 text-xs">
            <Euro className="h-3 w-3" />
            <span className="hidden lg:inline">Preise</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1 text-xs">
            <FileText className="h-3 w-3" />
            <span className="hidden lg:inline">Dokumente</span>
          </TabsTrigger>
          <TabsTrigger value="reservations" className="flex items-center gap-1 text-xs">
            <BookOpen className="h-3 w-3" />
            <span className="hidden lg:inline">Reserv.</span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-1 text-xs">
            <Users className="h-3 w-3" />
            <span className="hidden lg:inline">Vertrieb</span>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center gap-1 text-xs">
            <FileSignature className="h-3 w-3" />
            <span className="hidden lg:inline">Verträge</span>
          </TabsTrigger>
          <TabsTrigger value="publication" className="flex items-center gap-1 text-xs">
            <Globe className="h-3 w-3" />
            <span className="hidden lg:inline">Marketing</span>
          </TabsTrigger>
        </TabsList>

        {/* A - Identity */}
        <TabsContent value="identity">
          <Card>
            <CardHeader>
              <CardTitle>A. Identität & Status</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-muted-foreground">Projekt-Code</label>
                <p className="font-mono">{project.project_code}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Status</label>
                <p><Badge variant={statusConfig.variant}>{statusConfig.label}</Badge></p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Verkäufer-Gesellschaft</label>
                <p>{context.name}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Rechtsform</label>
                <p>{context.legal_form || '—'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-muted-foreground">Beschreibung</label>
                <p>{project.description || 'Keine Beschreibung'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* B - Location */}
        <TabsContent value="location">
          <Card>
            <CardHeader>
              <CardTitle>B. Standort & Story</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-muted-foreground">Adresse</label>
                <p>{project.address || '—'}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">PLZ / Stadt</label>
                <p>{project.postal_code} {project.city}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Bundesland</label>
                <p>{project.state || '—'}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Land</label>
                <p>{project.country}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* C - Units */}
        <TabsContent value="units">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle>C. Einheiten ({units.length})</CardTitle>
              <div className="flex items-center gap-2">
                <CreatePropertyFromUnits
                  projectId={project.id}
                  projectName={project.name}
                  projectAddress={project.address || ''}
                  projectCity={project.city || ''}
                  projectPostalCode={project.postal_code}
                  projectYearBuilt={undefined}
                  units={units}
                />
                <Button size="sm">+ Einheit hinzufügen</Button>
              </div>
            </CardHeader>
            <CardContent>
              {units.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Noch keine Einheiten angelegt</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Nr.</th>
                        <th className="text-left py-2">Etage</th>
                        <th className="text-right py-2">Fläche</th>
                        <th className="text-right py-2">Zimmer</th>
                        <th className="text-right py-2">Listenpreis</th>
                        <th className="text-right py-2">€/m²</th>
                        <th className="text-center py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {units.map((unit) => (
                        <tr key={unit.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 font-medium">{unit.unit_number}</td>
                          <td className="py-2">{unit.floor === 0 ? 'EG' : unit.floor === -1 ? 'UG' : unit.floor != null ? `${unit.floor}. OG` : '—'}</td>
                          <td className="py-2 text-right">{unit.area_sqm?.toFixed(1)} m²</td>
                          <td className="py-2 text-right">{unit.rooms_count}</td>
                          <td className="py-2 text-right">{formatCurrency(unit.list_price)}</td>
                          <td className="py-2 text-right">{formatCurrency(unit.price_per_sqm)}</td>
                          <td className="py-2 text-center">
                            <UnitStatusBadge status={unit.status} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* D - Calculation (Interactive) */}
        <TabsContent value="calculation">
          <ProjectAufteilerCalculation project={project} units={units} />
        </TabsContent>

        {/* E - Pricing */}
        <TabsContent value="pricing">
          <ProjectPricingBlock project={project} units={units} />
        </TabsContent>

        {/* F - Documents */}
        <TabsContent value="documents">
          <ProjectDocumentsBlock project={project} />
        </TabsContent>

        {/* G - Reservations */}
        <TabsContent value="reservations">
          <ProjectReservationsBlock projectId={project.id} units={units} />
        </TabsContent>

        {/* H - Sales */}
        <TabsContent value="sales">
          <ProjectSalesBlock 
            projectId={project.id} 
            reservations={dossier.reservations as any} 
            commissionRate={project.commission_rate_percent} 
          />
        </TabsContent>

        {/* I - Contracts */}
        <TabsContent value="contracts">
          <ProjectContractsBlock 
            projectId={project.id} 
            reservations={dossier.reservations as any} 
            documents={dossier.documents as any} 
          />
        </TabsContent>

        {/* J - Publication */}
        <TabsContent value="publication">
          <ProjectPublicationBlock project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
