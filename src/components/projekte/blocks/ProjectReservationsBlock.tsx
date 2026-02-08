/**
 * Project Reservations Block (Block G)
 * MOD-13 PROJEKTE
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  BookOpen, Plus, MoreHorizontal, Check, Calendar, 
  XCircle, RefreshCw, Clock, CheckCircle, AlertCircle 
} from 'lucide-react';
import { useProjectReservations } from '@/hooks/useProjectReservations';
import { CreateReservationDialog } from '../CreateReservationDialog';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { DevProjectUnit, DevProjectReservation, ReservationStatus } from '@/types/projekte';

const STATUS_CONFIG: Record<ReservationStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Ausstehend', variant: 'outline', icon: Clock },
  confirmed: { label: 'Bestätigt', variant: 'default', icon: Check },
  notary_scheduled: { label: 'Notartermin', variant: 'secondary', icon: Calendar },
  completed: { label: 'Abgeschlossen', variant: 'default', icon: CheckCircle },
  cancelled: { label: 'Storniert', variant: 'destructive', icon: XCircle },
  expired: { label: 'Abgelaufen', variant: 'outline', icon: AlertCircle },
};

interface ProjectReservationsBlockProps {
  projectId: string;
  units: DevProjectUnit[];
}

export function ProjectReservationsBlock({ projectId, units }: ProjectReservationsBlockProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { reservations, updateStatus, stats, isLoading } = useProjectReservations(projectId);

  const handleStatusChange = async (reservation: DevProjectReservation, newStatus: ReservationStatus) => {
    await updateStatus.mutateAsync({ id: reservation.id, status: newStatus });
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return format(new Date(date), 'dd.MM.yyyy', { locale: de });
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '—';
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle>G. Reservierungen</CardTitle>
            <Badge variant="secondary">{stats.total}</Badge>
          </div>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Neue Reservierung
          </Button>
        </CardHeader>
        <CardContent>
          {/* Stats Row */}
          <div className="grid grid-cols-6 gap-2 mb-4 text-sm">
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-semibold">{stats.pending}</div>
              <div className="text-muted-foreground text-xs">Ausstehend</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-semibold">{stats.confirmed}</div>
              <div className="text-muted-foreground text-xs">Bestätigt</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-semibold">{stats.notaryScheduled}</div>
              <div className="text-muted-foreground text-xs">Notar</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-semibold text-green-600">{stats.completed}</div>
              <div className="text-muted-foreground text-xs">Verkauft</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-semibold text-red-600">{stats.cancelled}</div>
              <div className="text-muted-foreground text-xs">Storniert</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-semibold">{formatCurrency(stats.totalReservedValue)}</div>
              <div className="text-muted-foreground text-xs">Volumen</div>
            </div>
          </div>

          {reservations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Noch keine Reservierungen</p>
              <p className="text-sm">Erstellen Sie eine neue Reservierung für eine verfügbare Einheit.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Einheit</th>
                    <th className="text-left py-2 px-2">Käufer</th>
                    <th className="text-left py-2 px-2">Partner</th>
                    <th className="text-right py-2 px-2">Preis</th>
                    <th className="text-center py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Reserviert</th>
                    <th className="text-left py-2 px-2">Ablauf</th>
                    <th className="text-right py-2 px-2">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((reservation) => {
                    const statusConfig = STATUS_CONFIG[reservation.status];
                    const StatusIcon = statusConfig.icon;
                    const isExpiringSoon = reservation.expiry_date && 
                      new Date(reservation.expiry_date) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) &&
                      reservation.status === 'pending';

                    return (
                      <tr key={reservation.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-2 font-medium">
                          {reservation.unit?.unit_number || 'N/A'}
                        </td>
                        <td className="py-2 px-2">
                          {reservation.buyer_contact 
                            ? `${reservation.buyer_contact.first_name} ${reservation.buyer_contact.last_name}`
                            : '—'}
                        </td>
                        <td className="py-2 px-2">
                          {reservation.partner_org?.name || '—'}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {formatCurrency(reservation.reserved_price)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <Badge variant={statusConfig.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="py-2 px-2">{formatDate(reservation.reservation_date)}</td>
                        <td className="py-2 px-2">
                          <span className={isExpiringSoon ? 'text-red-600 font-medium' : ''}>
                            {formatDate(reservation.expiry_date)}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {reservation.status === 'pending' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(reservation, 'confirmed')}>
                                  <Check className="h-4 w-4 mr-2" />
                                  Bestätigen
                                </DropdownMenuItem>
                              )}
                              {reservation.status === 'confirmed' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(reservation, 'notary_scheduled')}>
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Notartermin eintragen
                                </DropdownMenuItem>
                              )}
                              {reservation.status === 'notary_scheduled' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(reservation, 'completed')}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Abschließen
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {!['completed', 'cancelled'].includes(reservation.status) && (
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleStatusChange(reservation, 'cancelled')}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Stornieren
                                </DropdownMenuItem>
                              )}
                              {reservation.status === 'cancelled' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(reservation, 'pending')}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Reaktivieren
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateReservationDialog
        projectId={projectId}
        units={units}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
