/**
 * Portfolio Table for Developer Projects with Aufteiler KPIs
 * MOD-13 PROJEKTE - Extended 14-Column Layout
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, MoreHorizontal, Pencil, Trash2, Globe, Star, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import type { ProjectPortfolioRow, ProjectStatus } from '@/types/projekte';

interface Props {
  rows: ProjectPortfolioRow[];
  isLoading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
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

const PROJECT_TYPE_LABELS: Record<string, string> = {
  neubau: 'Neubau',
  aufteilung: 'Aufteilung',
};

function formatCurrency(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('de-DE', { 
    style: 'currency', 
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProjectPortfolioTable({ rows, isLoading, onEdit, onDelete }: Props) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Keine Projekte vorhanden</p>
      </div>
    );
  }

  // Calculate aggregated summary values
  const totalPurchasePrice = rows.reduce((sum, r) => sum + (r.purchase_price || 0), 0);
  const totalSaleTarget = rows.reduce((sum, r) => sum + (r.total_sale_target || 0), 0);
  const totalRevenueActual = rows.reduce((sum, r) => sum + (r.sale_revenue_actual || 0), 0);
  const totalUnits = rows.reduce((sum, r) => sum + r.total_units_count, 0);
  const totalAvailable = rows.reduce((sum, r) => sum + r.units_available, 0);
  const totalReserved = rows.reduce((sum, r) => sum + r.units_reserved, 0);
  const totalSold = rows.reduce((sum, r) => sum + r.units_sold, 0);
  const overallProgress = totalUnits > 0 ? Math.round((totalSold / totalUnits) * 100) : 0;

  return (
    <TooltipProvider>
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[100px]">Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[120px]">PLZ / Stadt</TableHead>
              <TableHead className="w-[90px]">Typ</TableHead>
              <TableHead className="text-center w-[100px]">Status</TableHead>
              <TableHead className="text-center w-[60px]">Ges.</TableHead>
              <TableHead className="text-center w-[50px]">Frei</TableHead>
              <TableHead className="text-center w-[50px]">Res.</TableHead>
              <TableHead className="text-center w-[50px]">Verk.</TableHead>
              <TableHead className="w-[100px]">Fortschritt</TableHead>
              <TableHead className="text-right w-[110px]">Umsatz SOLL</TableHead>
              <TableHead className="text-right w-[110px]">Umsatz IST</TableHead>
              <TableHead className="text-right w-[80px]">Marge</TableHead>
              <TableHead className="text-center w-[70px]">Flags</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const statusConfig = STATUS_CONFIG[row.status] || STATUS_CONFIG.draft;
              const projectTypeLabel = row.project_type ? (PROJECT_TYPE_LABELS[row.project_type] || row.project_type) : '—';
              
              return (
                <TableRow 
                  key={row.id} 
                  className="cursor-pointer"
                  onClick={() => navigate(`/portal/projekte/${row.id}`)}
                >
                  {/* 1. Code */}
                  <TableCell className="font-mono text-sm">
                    {row.project_code}
                  </TableCell>
                  
                  {/* 2. Name */}
                  <TableCell>
                    <p className="font-medium truncate max-w-[200px]">{row.name}</p>
                  </TableCell>
                  
                  {/* 3. PLZ / Stadt */}
                  <TableCell className="text-sm text-muted-foreground">
                    {row.postal_code || row.city ? (
                      <span>{row.postal_code} {row.city}</span>
                    ) : '—'}
                  </TableCell>
                  
                  {/* 4. Typ */}
                  <TableCell className="text-sm">
                    {projectTypeLabel}
                  </TableCell>
                  
                  {/* 5. Status */}
                  <TableCell className="text-center">
                    <Badge variant={statusConfig.variant} className="text-xs">
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  
                  {/* 6. Einheiten gesamt */}
                  <TableCell className="text-center font-medium">
                    {row.total_units_count}
                  </TableCell>
                  
                  {/* 7. Frei */}
                  <TableCell className="text-center">
                    <span className="text-emerald-600 dark:text-emerald-400">{row.units_available}</span>
                  </TableCell>
                  
                  {/* 8. Reserviert */}
                  <TableCell className="text-center">
                    <span className="text-amber-600 dark:text-amber-400">{row.units_reserved}</span>
                  </TableCell>
                  
                  {/* 9. Verkauft */}
                  <TableCell className="text-center">
                    <span className="text-sky-600 dark:text-sky-400">{row.units_sold}</span>
                  </TableCell>
                  
                  {/* 10. Abverkaufsquote / Fortschritt */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={row.progress_percent} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {row.progress_percent}%
                      </span>
                    </div>
                  </TableCell>
                  
                  {/* 11. Umsatz SOLL */}
                  <TableCell className="text-right text-sm">
                    {formatCurrency(row.total_sale_target)}
                  </TableCell>
                  
                  {/* 12. Umsatz IST */}
                  <TableCell className="text-right text-sm font-medium">
                    {formatCurrency(row.sale_revenue_actual)}
                  </TableCell>
                  
                  {/* 13. Marge SOLL */}
                  <TableCell className="text-right">
                    {row.profit_margin_percent !== null ? (
                      <span className={row.profit_margin_percent >= 20 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                        {row.profit_margin_percent}%
                      </span>
                    ) : '—'}
                  </TableCell>
                  
                  {/* 14. Flags (Kaufy/Featured/Landingpage) */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {row.kaufy_listed && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Globe className="h-3.5 w-3.5 text-primary" />
                          </TooltipTrigger>
                          <TooltipContent>Kaufy gelistet</TooltipContent>
                        </Tooltip>
                      )}
                      {row.kaufy_featured && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Star className="h-3.5 w-3.5 text-amber-500" />
                          </TooltipTrigger>
                          <TooltipContent>Premium-Platzierung</TooltipContent>
                        </Tooltip>
                      )}
                      {row.landingpage_enabled && (
                        <Tooltip>
                          <TooltipTrigger>
                            <FileText className="h-3.5 w-3.5 text-sky-500" />
                          </TooltipTrigger>
                          <TooltipContent>Landingpage aktiv</TooltipContent>
                        </Tooltip>
                      )}
                      {!row.kaufy_listed && !row.kaufy_featured && !row.landingpage_enabled && (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* Actions */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/portal/projekte/${row.id}`); }}>
                          <Eye className="mr-2 h-4 w-4" />
                          Öffnen
                        </DropdownMenuItem>
                        {onEdit && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(row.id); }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Bearbeiten
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); onDelete(row.id); }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Löschen
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Summary Row */}
        <div className="border-t bg-muted/30 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <span className="font-medium">{rows.length} Projekte</span>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <div>
                <span className="text-muted-foreground">Einheiten: </span>
                <span className="font-medium">{totalUnits}</span>
                <span className="text-muted-foreground mx-1">|</span>
                <span className="text-emerald-600 dark:text-emerald-400">{totalAvailable}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-amber-600 dark:text-amber-400">{totalReserved}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-sky-600 dark:text-sky-400">{totalSold}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Umsatz SOLL: </span>
                <span className="font-medium">{formatCurrency(totalSaleTarget)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Umsatz IST: </span>
                <span className="font-medium">{formatCurrency(totalRevenueActual)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Fortschritt: </span>
                <span className="font-medium">{overallProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
