/**
 * Vertrieb Tab - Reservations & Sales Management + Sales Desk Approval
 * MOD-13 PROJEKTE — P0 Redesign
 * 
 * NEVER shows EmptyState only — KPIs always visible, Freigabe section at bottom.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, CalendarCheck, CheckCircle, XCircle, Clock, TrendingUp, Plus, Eye, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useDevProjects } from '@/hooks/useDevProjects';
import { useProjectReservations } from '@/hooks/useProjectReservations';
import { useProjectUnits } from '@/hooks/useProjectUnits';
import { LoadingState } from '@/components/shared/LoadingState';
import { CreateReservationDialog } from '@/components/projekte';
import { SalesApprovalSection } from '@/components/projekte/SalesApprovalSection';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { isDemoMode, DEMO_PROJECT, DEMO_PROJECT_DESCRIPTION } from '@/components/projekte/demoProjectData';

export default function VertriebTab() {
  const navigate = useNavigate();
  const { portfolioRows, isLoadingPortfolio, projects } = useDevProjects();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const isDemo = isDemoMode(projects);
  const activeProjectId = isDemo ? DEMO_PROJECT.id : (selectedProject || projects[0]?.id);
  const { reservations, isLoading: isLoadingReservations, updateReservation } = useProjectReservations(isDemo ? undefined : activeProjectId);
  const { units } = useProjectUnits(isDemo ? undefined : activeProjectId);

  if (isLoadingPortfolio) return <LoadingState />;

  // Stats — use demo fallback when no real projects
  const totalUnits = isDemo ? DEMO_PROJECT.total_units_count : portfolioRows.reduce((sum, r) => sum + r.total_units_count, 0);
  const totalSold = isDemo ? 0 : portfolioRows.reduce((sum, r) => sum + r.units_sold, 0);
  const totalReserved = isDemo ? 0 : portfolioRows.reduce((sum, r) => sum + r.units_reserved, 0);
  const totalAvailable = isDemo ? DEMO_PROJECT.units_available : portfolioRows.reduce((sum, r) => sum + r.units_available, 0);
  const totalValue = isDemo ? DEMO_PROJECT.total_sale_target : portfolioRows.reduce((sum, r) => sum + (r.total_sale_target || 0), 0);
  const soldValue = isDemo ? 0 : portfolioRows.reduce((sum, r) => {
    const unitValue = r.total_sale_target && r.total_units_count ? r.total_sale_target / r.total_units_count : 0;
    return sum + (unitValue * r.units_sold);
  }, 0);

  const formatCurrency = (value: number | null) =>
    value != null ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(value) : '–';

  const handleStatusUpdate = async (reservationId: string, newStatus: string) => {
    try {
      await updateReservation.mutateAsync({ id: reservationId, status: newStatus as any });
      toast.success('Status aktualisiert');
    } catch { toast.error('Fehler beim Aktualisieren'); }
  };

  const partnerStats = reservations.reduce((acc, res) => {
    const partnerId = res.partner_org?.id || 'direct';
    const partnerName = res.partner_org?.name || 'Direktvertrieb';
    if (!acc[partnerId]) acc[partnerId] = { name: partnerName, reservations: 0, sold: 0, volume: 0, commission: 0 };
    acc[partnerId].reservations++;
    if (res.status === 'completed') {
      acc[partnerId].sold++;
      acc[partnerId].volume += res.reserved_price || 0;
      acc[partnerId].commission += (res.reserved_price || 0) * 0.03;
    }
    return acc;
  }, {} as Record<string, { name: string; reservations: number; sold: number; volume: number; commission: number }>);

  const activeProject = isDemo ? null : projects.find(p => p.id === activeProjectId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight uppercase">Vertrieb & Reservierungen</h2>
          <p className="text-muted-foreground">Übersicht über Reservierungen und Partner-Performance</p>
        </div>
        <div className="flex items-center gap-3">
          {projects.length > 1 && (
            <Select value={activeProjectId || ''} onValueChange={(val) => setSelectedProject(val)}>
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Projekt wählen" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}{p.address ? ` — ${p.address}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {projects.length > 0 && (
            <Button onClick={() => setShowCreateDialog(true)}><Plus className="mr-2 h-4 w-4" />Neue Reservierung</Button>
          )}
        </div>
      </div>

      {/* KPI Cards — ALWAYS visible */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Einheiten gesamt</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnits}</div>
            <p className="text-xs text-muted-foreground">in {portfolioRows.length} Projekten</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verkauft</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalSold}</div>
            <p className="text-xs text-muted-foreground">{totalUnits > 0 ? Math.round((totalSold / totalUnits) * 100) : 0}% des Bestands</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserviert</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalReserved}</div>
            <p className="text-xs text-muted-foreground">{totalAvailable} noch verfügbar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verkaufswert</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(soldValue)}</div>
            <p className="text-xs text-muted-foreground">von {formatCurrency(totalValue)} Ziel</p>
          </CardContent>
        </Card>
      </div>

      {/* Reservations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5" />Aktive Reservierungen</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingReservations ? (
            <LoadingState />
          ) : reservations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine aktiven Reservierungen vorhanden.</p>
              <p className="text-xs mt-1">Reservierungen erscheinen hier, sobald Einheiten reserviert werden.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Einheit</TableHead>
                  <TableHead>Käufer</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Preis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ablauf</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.slice(0, 10).map((res) => (
                  <TableRow key={res.id}>
                    <TableCell className="font-medium">WE-{res.unit?.unit_number}</TableCell>
                    <TableCell>{res.buyer_contact ? `${res.buyer_contact.first_name} ${res.buyer_contact.last_name}` : '–'}</TableCell>
                    <TableCell>{res.partner_org?.name || 'Direktvertrieb'}</TableCell>
                    <TableCell>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(res.reserved_price || 0)}</TableCell>
                    <TableCell><ReservationStatusBadge status={res.status} /></TableCell>
                    <TableCell>{res.expiry_date ? new Date(res.expiry_date).toLocaleDateString('de-DE') : '–'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/portal/projekte/${res.project_id}`)}><Eye className="mr-2 h-4 w-4" />Zur Projektakte</DropdownMenuItem>
                          {res.status === 'pending' && <DropdownMenuItem onClick={() => handleStatusUpdate(res.id, 'confirmed')}><CheckCircle className="mr-2 h-4 w-4" />Bestätigen</DropdownMenuItem>}
                          {res.status === 'confirmed' && <DropdownMenuItem onClick={() => handleStatusUpdate(res.id, 'notary_scheduled')}><CalendarCheck className="mr-2 h-4 w-4" />Notartermin planen</DropdownMenuItem>}
                          {res.status === 'notary_scheduled' && <DropdownMenuItem onClick={() => handleStatusUpdate(res.id, 'completed')}><CheckCircle className="mr-2 h-4 w-4" />Abschließen</DropdownMenuItem>}
                          {!['completed', 'cancelled'].includes(res.status) && <DropdownMenuItem onClick={() => handleStatusUpdate(res.id, 'cancelled')} className="text-destructive"><XCircle className="mr-2 h-4 w-4" />Stornieren</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Partner Performance */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Partner-Performance</CardTitle></CardHeader>
        <CardContent>
          {Object.keys(partnerStats).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Partner-Zuordnungen werden nach der ersten Reservierung angezeigt.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead className="text-right">Reservierungen</TableHead>
                  <TableHead className="text-right">Verkäufe</TableHead>
                  <TableHead className="text-right">Volumen</TableHead>
                  <TableHead className="text-right">Provision (3%)</TableHead>
                  <TableHead className="text-right">Conversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(partnerStats).map(([id, stats]) => (
                  <TableRow key={id}>
                    <TableCell className="font-medium">{stats.name}</TableCell>
                    <TableCell className="text-right">{stats.reservations}</TableCell>
                    <TableCell className="text-right">{stats.sold}</TableCell>
                    <TableCell className="text-right">{formatCurrency(stats.volume)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(stats.commission)}</TableCell>
                    <TableCell className="text-right">{stats.reservations > 0 ? `${Math.round((stats.sold / stats.reservations) * 100)}%` : '–'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ═══ Vertriebsauftrag & Distribution ═══ */}
      <SalesApprovalSection
        projectId={activeProjectId}
        projectName={isDemo ? DEMO_PROJECT.name : activeProject?.name}
        projectAddress={isDemo ? `${DEMO_PROJECT_DESCRIPTION.address}, ${DEMO_PROJECT_DESCRIPTION.postal_code} ${DEMO_PROJECT_DESCRIPTION.city}` : (activeProject?.address || '')}
        totalUnits={totalUnits}
        projectVolume={totalValue}
        isDemo={isDemo}
      />

      {/* Create Reservation Dialog */}
      {showCreateDialog && projects.length > 0 && activeProjectId && (
        <CreateReservationDialog
          projectId={activeProjectId}
          units={units}
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  );
}

function ReservationStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: 'Ausstehend', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    confirmed: { label: 'Bestätigt', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    notary_scheduled: { label: 'Notar geplant', className: 'bg-purple-100 text-purple-800 border-purple-200' },
    completed: { label: 'Abgeschlossen', className: 'bg-green-100 text-green-800 border-green-200' },
    cancelled: { label: 'Storniert', className: 'bg-red-100 text-red-800 border-red-200' },
    expired: { label: 'Abgelaufen', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  };
  const { label, className } = config[status] || config.pending;
  return <Badge variant="outline" className={className}>{label}</Badge>;
}
