/**
 * PMDashboard — Pet Manager Dashboard (Manager-Module-Workflow-Pattern)
 * Visitenkarte + Kapazitäts-Widget + KPIs + Nächste Buchungen
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/shared/KPICard';
import { useMyProvider, useBookings } from '@/hooks/usePetBookings';
import { usePetCapacity, useWeeklyBookingCount, useMonthlyRevenue } from '@/hooks/usePetCapacity';
import { PawPrint, Calendar, Users, TrendingUp, MapPin, Phone, Mail, Clock, AlertTriangle } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

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
  const { data: allBookings = [] } = useBookings(provider ? { providerId: provider.id } : undefined);

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
        <div className="flex items-center gap-3">
          <PawPrint className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Pet Manager Dashboard</h1>
        </div>
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
          <p className="text-muted-foreground">Kein Provider-Profil gefunden. Bitte wenden Sie sich an den Administrator.</p>
        </div>
      </div>
    );
  }

  const capacityPercent = capacity ? Math.round((capacity.bookedToday / Math.max(capacity.totalCapacity, 1)) * 100) : 0;

  return (
    <div className={DESIGN.SPACING.SECTION}>
      {/* DASHBOARD HEADER: Visitenkarte + Kapazität */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Visitenkarte (2 Spalten) */}
        <Card className={cn(DESIGN.CARD.CONTENT, 'md:col-span-2')}>
          <div className="flex items-start gap-4">
            <div className={cn(DESIGN.HEADER.WIDGET_ICON_BOX, 'h-14 w-14 rounded-2xl')}>
              <PawPrint className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">{provider.company_name}</h2>
                <Badge variant="outline" className="text-xs">
                  {FACILITY_LABELS[(provider as any).facility_type] || 'Franchise-Partner'}
                </Badge>
                <Badge variant={provider.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                  {provider.status === 'active' ? 'Aktiv' : provider.status}
                </Badge>
              </div>
              {provider.bio && <p className="text-sm text-muted-foreground mt-1">{provider.bio}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
                {provider.address && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{provider.address}</span>
                )}
                {provider.phone && (
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{provider.phone}</span>
                )}
                {provider.email && (
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{provider.email}</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Kapazitäts-Widget */}
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
            {/* Progress bar */}
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
        <KPICard label="Offene Anfragen" value={pendingCount} icon={Clock} subtitle={pendingCount > 0 ? 'Prüfung nötig' : 'Keine'} subtitleClassName={pendingCount > 0 ? 'text-amber-500' : undefined} />
        <KPICard
          label="Monatsumsatz"
          value={`${((monthlyRevenue ?? 0) / 100).toLocaleString('de-DE', { minimumFractionDigits: 0 })} €`}
          icon={TrendingUp}
          subtitle={format(new Date(), 'MMMM yyyy', { locale: de })}
        />
      </div>

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
  );
}
