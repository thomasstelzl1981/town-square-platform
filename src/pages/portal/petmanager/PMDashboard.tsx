/**
 * PMDashboard — Pet Manager Dashboard (Manager-Module-Workflow-Pattern V3.0)
 * ModulePageHeader + ManagerVisitenkarte + Kapazitäts-Widget + KPIs + Eingehende Anfragen + Nächste Buchungen
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KPICard } from '@/components/shared/KPICard';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { ManagerVisitenkarte } from '@/components/shared/ManagerVisitenkarte';
import { useMyProvider, useBookings } from '@/hooks/usePetBookings';
import { usePetCapacity, useWeeklyBookingCount, useMonthlyRevenue } from '@/hooks/usePetCapacity';
import { Calendar, Users, TrendingUp, Clock, AlertTriangle, Check, XCircle, Inbox } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { PageShell } from '@/components/shared/PageShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const FACILITY_LABELS: Record<string, string> = {
  daycare: 'Tagesstätte',
  pension: 'Tierpension',
  mobile: 'Mobiler Service',
  salon: 'Hundesalon',
};

export default function PMDashboard() {
  const queryClient = useQueryClient();
  const { data: provider, isLoading: provLoading } = useMyProvider();
  const { data: capacity } = usePetCapacity(provider?.id);
  const { data: weeklyCount } = useWeeklyBookingCount(provider?.id);
  const { data: monthlyRevenue } = useMonthlyRevenue(provider?.id);
  const { data: allBookings = [] } = useBookings(provider ? { providerId: provider.id } : undefined);

  // ── Incoming booking requests from Z3 ──────────────
  const { data: incomingRequests = [] } = useQuery({
    queryKey: ['pm-incoming-booking-requests', provider?.id],
    queryFn: async () => {
      const { data } = await (supabase.from('pet_z1_booking_requests' as any) as any)
        .select('*')
        .eq('provider_id', provider!.id)
        .in('status', ['pending'])
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!provider?.id,
  });

  const confirmMutation = useMutation({
    mutationFn: async (requestId: string) => {
      // Update the booking request status to confirmed
      const { error } = await (supabase.from('pet_z1_booking_requests' as any) as any)
        .update({
          status: 'confirmed',
          provider_confirmed_at: new Date().toISOString(),
        })
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-incoming-booking-requests'] });
      toast.success('Buchungsanfrage bestätigt');
    },
    onError: () => toast.error('Fehler bei der Bestätigung'),
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await (supabase.from('pet_z1_booking_requests' as any) as any)
        .update({ status: 'rejected' })
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-incoming-booking-requests'] });
      toast.success('Buchungsanfrage abgelehnt');
    },
    onError: () => toast.error('Fehler'),
  });

  const pendingCount = allBookings.filter(b => b.status === 'requested').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = allBookings
    .filter(b => b.scheduled_date === todayStr && ['confirmed', 'in_progress'].includes(b.status))
    .sort((a, b) => (a.scheduled_time_start || '').localeCompare(b.scheduled_time_start || ''));

  const upcomingBookings = allBookings
    .filter(b => b.scheduled_date >= todayStr && ['confirmed', 'in_progress', 'requested'].includes(b.status))
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date) || (a.scheduled_time_start || '').localeCompare(b.scheduled_time_start || ''))
    .slice(0, 5);

  if (provLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="space-y-6">
        <ModulePageHeader title="Pet Manager" description="Dein Dashboard für Tierpension und Services" />
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
          <p className="text-muted-foreground">Kein Provider-Profil gefunden. Bitte wenden Sie sich an den Administrator.</p>
        </div>
      </div>
    );
  }

  const capacityPercent = capacity ? Math.round((capacity.bookedToday / Math.max(capacity.totalCapacity, 1)) * 100) : 0;

  return (
    <PageShell>
    <div className={DESIGN.SPACING.SECTION}>
      {/* ModulePageHeader — CI-Standard */}
      <ModulePageHeader
        title="Pet Manager"
        description="Dein Dashboard für Tierpension und Services"
      />

      {/* DASHBOARD HEADER: ManagerVisitenkarte + Kapazität */}
      <div className={DESIGN.DASHBOARD_HEADER.GRID}>
        <ManagerVisitenkarte
          role="Inhaberin"
          gradientFrom="hsl(170,60%,40%)"
          gradientTo="hsl(180,55%,35%)"
          badgeText={provider.company_name || 'Lennox & Friends Dog Resorts'}
          extraBadge={FACILITY_LABELS[(provider as any).facility_type] || 'Tierpension'}
          overrideName={provider.company_name}
          overrideEmail={(provider as any).email}
          overridePhone={(provider as any).phone}
          overrideAddress={(provider as any).address}
        />

        <Card className={cn(DESIGN.CARD.CONTENT)}>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Tageskapazität</span>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">
              {capacity?.bookedToday ?? 0}
              <span className="text-lg text-muted-foreground font-normal"> / {capacity?.totalCapacity ?? 0}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Plätze belegt heute</p>
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  capacityPercent >= 90 ? 'bg-destructive' : capacityPercent >= 70 ? 'bg-amber-500' : 'bg-primary'
                )}
                style={{ width: `${Math.min(100, capacityPercent)}%` }}
              />
            </div>
            {capacity?.isFullyBooked && (
              <div className="flex items-center justify-center gap-1 mt-2 text-xs text-destructive">
                <AlertTriangle className="h-3 w-3" /> Ausgebucht
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* KPI-Leiste */}
      <div className={DESIGN.KPI_GRID.FULL}>
        <KPICard label="Heute" value={todayBookings.length} icon={Calendar} subtitle="Bestätigte Termine" />
        <KPICard label="Diese Woche" value={weeklyCount ?? 0} icon={TrendingUp} subtitle="Buchungen" />
        <KPICard label="Offene Anfragen" value={pendingCount + incomingRequests.length} icon={Clock} subtitle={pendingCount + incomingRequests.length > 0 ? 'Prüfung nötig' : 'Keine'} subtitleClassName={pendingCount + incomingRequests.length > 0 ? 'text-amber-500' : undefined} />
        <KPICard
          label="Monatsumsatz"
          value={`${((monthlyRevenue ?? 0) / 100).toLocaleString('de-DE', { minimumFractionDigits: 0 })} €`}
          icon={TrendingUp}
          subtitle={format(new Date(), 'MMMM yyyy', { locale: de })}
        />
      </div>

      {/* ══════════════════════════════════════════════════
          EINGEHENDE BUCHUNGSANFRAGEN (Z3 → Z2)
          ══════════════════════════════════════════════════ */}
      {incomingRequests.length > 0 && (
        <Card className={DESIGN.CARD.SECTION}>
          <div className={DESIGN.CARD.SECTION_HEADER}>
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Eingehende Anfragen</span>
              <Badge variant="outline" className="text-[10px]">{incomingRequests.length}</Badge>
            </div>
          </div>
          <CardContent className="p-4">
            <div className={DESIGN.LIST.GAP}>
              {incomingRequests.map((req: any) => (
                <div key={req.id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{req.service_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {req.preferred_date && format(parseISO(req.preferred_date), 'dd.MM.yyyy', { locale: de })}
                      {req.preferred_time && ` um ${req.preferred_time}`}
                      {req.pet_name && ` · ${req.pet_name}`}
                    </p>
                    {req.client_notes && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">"{req.client_notes}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-destructive border-destructive/30"
                      onClick={() => rejectMutation.mutate(req.id)}
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Ablehnen
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs"
                      onClick={() => confirmMutation.mutate(req.id)}
                      disabled={confirmMutation.isPending}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Annehmen
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nächste Buchungen */}
      <Card className={DESIGN.CARD.SECTION}>
        <div className={DESIGN.CARD.SECTION_HEADER}>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Nächste Termine</span>
          </div>
        </div>
        <CardContent className="p-4">
          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Keine anstehenden Termine</p>
          ) : (
            <div className={DESIGN.LIST.GAP}>
              {upcomingBookings.map(b => (
                <div key={b.id} className={DESIGN.LIST.ROW}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-xs text-muted-foreground w-20 shrink-0">
                      {format(parseISO(b.scheduled_date), 'dd.MM.', { locale: de })}
                      {b.scheduled_time_start && ` ${b.scheduled_time_start.slice(0, 5)}`}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{b.service?.title}</p>
                      <p className="text-xs text-muted-foreground">{b.pet?.name} ({b.pet?.species})</p>
                    </div>
                  </div>
                  <Badge variant={b.status === 'requested' ? 'outline' : 'default'} className="text-[10px] shrink-0">
                    {b.status === 'requested' ? 'Angefragt' : b.status === 'confirmed' ? 'Bestätigt' : b.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </PageShell>
  );
}
