/**
 * ProjectDetailHeader — Header + KPI row + Delete Dialog
 * Extracted from ProjectDetailPage R-31
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DESIGN } from '@/config/designManifest';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Building2, MapPin, Pencil, MoreHorizontal, Trash2 } from 'lucide-react';
import { ProjectDeleteDialog } from '@/components/projekte/ProjectDeleteDialog';
import type { ProjectStatus, ProjectPortfolioRow } from '@/types/projekte';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  draft_intake: { label: 'KI-Import', variant: 'outline' },
  draft_ready: { label: 'Bereit', variant: 'outline' },
  in_sales_setup: { label: 'Vorbereitung', variant: 'secondary' },
  in_distribution: { label: 'Im Vertrieb', variant: 'default' },
  sellout_in_progress: { label: 'Abverkauf', variant: 'default' },
  sold_out: { label: 'Ausverkauft', variant: 'secondary' },
  closed: { label: 'Geschlossen', variant: 'outline' },
  draft: { label: 'Entwurf', variant: 'outline' },
  active: { label: 'Aktiv', variant: 'default' },
  paused: { label: 'Pausiert', variant: 'secondary' },
  completed: { label: 'Abgeschlossen', variant: 'secondary' },
  archived: { label: 'Archiviert', variant: 'outline' },
};

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

interface Props {
  project: any;
  context: any;
  units: any[];
  kpis: { totalUnits: number; unitsAvailable: number; unitsReserved: number; unitsSold: number; progressPercent: number; grossProfit: number; marginPercent: number };
  aufteilerCalc: { gross_profit?: number; profit_margin_percent?: number } | null;
  tenantId: string | undefined;
  onDelete: (id: string) => Promise<any>;
}

export function ProjectDetailHeader({ project, context, units, kpis, aufteilerCalc, tenantId, onDelete }: Props) {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const statusConfig = STATUS_CONFIG[project.status as ProjectStatus];

  return (
    <>
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
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{project.city}</span>
              )}
              <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{context.name}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon"><Pencil className="h-4 w-4" /></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />Projekt löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ProjectDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        project={{
          id: project.id, project_code: project.project_code, name: project.name,
          city: project.city, postal_code: project.postal_code,
          project_type: (project as any).project_type || null,
          status: project.status,
          total_units_count: project.total_units_count || units.length,
          units_available: units.filter((u: any) => u.status === 'available').length,
          units_reserved: units.filter((u: any) => u.status === 'reserved').length,
          units_sold: units.filter((u: any) => u.status === 'sold').length,
          purchase_price: project.purchase_price, total_sale_target: project.total_sale_target,
          sale_revenue_actual: null, profit_margin_percent: null, progress_percent: 0,
          kaufy_listed: false, kaufy_featured: false, landingpage_enabled: false,
        } as ProjectPortfolioRow}
        tenantId={tenantId}
        onConfirmDelete={async (id) => {
          const result = await onDelete(id);
          navigate('/portal/projekte/projekte');
          return result;
        }}
      />

      {/* Quick KPIs */}
      <div className={DESIGN.KPI_GRID.FULL}>
        <Card><CardContent className="pt-4">
          <div className="text-sm text-muted-foreground">Einheiten</div>
          <div className="text-2xl font-bold">{kpis.totalUnits}</div>
          <div className="flex gap-2 mt-1 text-xs">
            <span className="text-green-600">{kpis.unitsAvailable} frei</span>
            <span className="text-yellow-600">{kpis.unitsReserved} res.</span>
            <span className="text-blue-600">{kpis.unitsSold} verk.</span>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-sm text-muted-foreground">Fortschritt</div>
          <div className="flex items-center gap-2">
            <Progress value={kpis.progressPercent} className="flex-1" />
            <span className="text-lg font-bold">{kpis.progressPercent}%</span>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-sm text-muted-foreground">Rohgewinn</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(aufteilerCalc?.gross_profit || kpis.grossProfit)}
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-sm text-muted-foreground">Marge</div>
          <div className="text-2xl font-bold">
            {(aufteilerCalc?.profit_margin_percent || kpis.marginPercent).toFixed(1)}%
          </div>
        </CardContent></Card>
      </div>
    </>
  );
}
