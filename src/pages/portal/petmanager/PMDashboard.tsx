/**
 * PMDashboard — Pet Manager Dashboard (PLC-Engine V3.0)
 * Reads from pet_service_cases (SSOT) instead of legacy pet_z1_booking_requests
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KPICard } from '@/components/shared/KPICard';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { ManagerVisitenkarte } from '@/components/shared/ManagerVisitenkarte';
import { useMyProvider } from '@/hooks/usePetBookings';
import { usePetCapacity, useWeeklyBookingCount, useMonthlyRevenue } from '@/hooks/usePetCapacity';
import { useCasesForProvider, useTransitionCase } from '@/hooks/usePetServiceCases';
import { PLC_PHASE_LABELS } from '@/engines/plc/spec';
import { Calendar, Users, TrendingUp, Clock, AlertTriangle, Check, XCircle, Inbox } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { PageShell } from '@/components/shared/PageShell';

const FACILITY_LABELS: Record<string, string> = {
  daycare: 'Tagesstätte',
  pension: 'Tierpension',
  mobile: 'Mobiler Service',
  salon: 'Hundesalon',
};

export default function PMDashboard() {
  const { data: provider, isLoading: provLoading } = useMyProvider();
  const { data: capacity } = usePetCapacity(provider?.id);
  const { data: weeklyCount } = useWeeklyBookingCount(provider?.id);
  const { data: monthlyRevenue } = useMonthlyRevenue(provider?.id);
  const { data: cases = [] } = useCasesForProvider(provider?.id);
  const transitionCase = useTransitionCase();

  // ── Cases by phase ──
  const incomingCases = cases.filter(c => c.current_phase === 'provider_selected');
  const activeCases = cases.filter(c => ['provider_confirmed', 'checked_in'].includes(c.current_phase));
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCases = activeCases.filter(c => c.scheduled_start?.startsWith(todayStr));

  const upcomingCases = cases
    .filter(c => ['provider_selected', 'provider_confirmed', 'checked_in'].includes(c.current_phase))
    .sort((a, b) => (a.scheduled_start ?? '').localeCompare(b.scheduled_start ?? ''))
    .slice(0, 5);

  const handleConfirm = (caseId: string) => {
    transitionCase.mutate({
      case_id: caseId,
      event_type: 'provider.confirmed',
      actor_type: 'provider',
    });
  };

  const handleDecline = (caseId: string) => {
    transitionCase.mutate({
      case_id: caseId,
      event_type: 'provider.declined',
      actor_type: 'provider',
    });
  };

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
        <KPICard label="Heute" value={todayCases.length} icon={Calendar} subtitle="Bestätigte Termine" />
        <KPICard label="Diese Woche" value={weeklyCount ?? 0} icon={TrendingUp} subtitle="Buchungen" />
        <KPICard label="Offene Anfragen" value={incomingCases.length} icon={Clock} subtitle={incomingCases.length > 0 ? 'Prüfung nötig' : 'Keine'} subtitleClassName={incomingCases.length > 0 ? 'text-amber-500' : undefined} />
        <KPICard
          label="Monatsumsatz"
          value={`${((monthlyRevenue ?? 0) / 100).toLocaleString('de-DE', { minimumFractionDigits: 0 })} €`}
          icon={TrendingUp}
          subtitle={format(new Date(), 'MMMM yyyy', { locale: de })}
        />
      </div>

      {/* EINGEHENDE CASES (Phase: provider_selected) */}
      {incomingCases.length > 0 && (
        <Card className={DESIGN.CARD.SECTION}>
          <div className={DESIGN.CARD.SECTION_HEADER}>
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Eingehende Anfragen</span>
              <Badge variant="outline" className="text-[10px]">{incomingCases.length}</Badge>
            </div>
          </div>
          <CardContent className="p-4">
            <div className={DESIGN.LIST.GAP}>
              {incomingCases.map(c => (
                <div key={c.id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.customer_name || c.customer_email || 'Unbekannt'}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.service_type && PLC_PHASE_LABELS[c.current_phase]}
                      {c.scheduled_start && ` · ${format(parseISO(c.scheduled_start), 'dd.MM.yyyy', { locale: de })}`}
                    </p>
                    {c.customer_notes && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">"{c.customer_notes}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-destructive border-destructive/30"
                      onClick={() => handleDecline(c.id)}
                      disabled={transitionCase.isPending}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Ablehnen
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs"
                      onClick={() => handleConfirm(c.id)}
                      disabled={transitionCase.isPending}
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

      {/* Nächste Termine */}
      <Card className={DESIGN.CARD.SECTION}>
        <div className={DESIGN.CARD.SECTION_HEADER}>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Nächste Termine</span>
          </div>
        </div>
        <CardContent className="p-4">
          {upcomingCases.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Keine anstehenden Termine</p>
          ) : (
            <div className={DESIGN.LIST.GAP}>
              {upcomingCases.map(c => (
                <div key={c.id} className={DESIGN.LIST.ROW}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-xs text-muted-foreground w-20 shrink-0">
                      {c.scheduled_start && format(parseISO(c.scheduled_start), 'dd.MM.', { locale: de })}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.customer_name || c.customer_email || 'Unbekannt'}</p>
                      <p className="text-xs text-muted-foreground">{c.service_type}</p>
                    </div>
                  </div>
                  <Badge variant={c.current_phase === 'provider_selected' ? 'outline' : 'default'} className="text-[10px] shrink-0">
                    {PLC_PHASE_LABELS[c.current_phase]}
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
