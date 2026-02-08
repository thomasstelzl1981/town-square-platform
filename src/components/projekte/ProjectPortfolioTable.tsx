/**
 * Portfolio Table for Developer Projects with Aufteiler KPIs
 * MOD-13 PROJEKTE
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import type { ProjectPortfolioRow, ProjectStatus } from '@/types/projekte';

interface Props {
  rows: ProjectPortfolioRow[];
  isLoading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Entwurf', variant: 'outline' },
  active: { label: 'Aktiv', variant: 'default' },
  paused: { label: 'Pausiert', variant: 'secondary' },
  completed: { label: 'Abgeschlossen', variant: 'secondary' },
  archived: { label: 'Archiviert', variant: 'outline' },
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

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[120px]">Code</TableHead>
            <TableHead>Name / Standort</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Einheiten</TableHead>
            <TableHead className="text-right">Kaufpreis</TableHead>
            <TableHead className="text-right">Verkaufsziel</TableHead>
            <TableHead className="text-right">Marge</TableHead>
            <TableHead className="w-[140px]">Fortschritt</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const statusConfig = STATUS_CONFIG[row.status];
            
            return (
              <TableRow 
                key={row.id} 
                className="cursor-pointer"
                onClick={() => navigate(`/portal/projekte/${row.id}`)}
              >
                <TableCell className="font-mono text-sm">
                  {row.project_code}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{row.name}</p>
                    {row.city && (
                      <p className="text-sm text-muted-foreground">{row.city}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={statusConfig.variant}>
                    {statusConfig.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm">
                    <span className="text-green-600">{row.units_available}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-yellow-600">{row.units_reserved}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-blue-600">{row.units_sold}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Frei / Res. / Verk.
                  </p>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(row.purchase_price)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(row.total_sale_target)}
                </TableCell>
                <TableCell className="text-right">
                  {row.profit_margin_percent !== null ? (
                    <span className={row.profit_margin_percent >= 20 ? 'text-green-600 font-medium' : ''}>
                      {row.profit_margin_percent}%
                    </span>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={row.progress_percent} className="h-2 flex-1" />
                    <span className="text-sm text-muted-foreground w-10 text-right">
                      {row.progress_percent}%
                    </span>
                  </div>
                </TableCell>
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
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{rows.length} Projekte</span>
          <div className="flex gap-6">
            <div>
              <span className="text-muted-foreground">Gesamt-Kaufpreis: </span>
              <span className="font-medium">
                {formatCurrency(rows.reduce((sum, r) => sum + (r.purchase_price || 0), 0))}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Gesamt-Verkaufsziel: </span>
              <span className="font-medium">
                {formatCurrency(rows.reduce((sum, r) => sum + (r.total_sale_target || 0), 0))}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Einheiten: </span>
              <span className="font-medium">
                {rows.reduce((sum, r) => sum + r.total_units_count, 0)} gesamt
                {' / '}
                <span className="text-green-600">{rows.reduce((sum, r) => sum + r.units_available, 0)} frei</span>
                {' / '}
                <span className="text-blue-600">{rows.reduce((sum, r) => sum + r.units_sold, 0)} verkauft</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
