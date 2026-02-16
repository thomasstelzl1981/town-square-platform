/**
 * Zone 1 — Pet Governance: Monitor
 * Audit-Trail, Stornoquote, Anomalie-Alerts
 */
import { useState, useEffect, useMemo } from 'react';
import { Eye, Bell, FileText, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BookingEvent {
  id: string;
  status: string;
  scheduled_date: string;
  created_at: string;
  cancelled_at: string | null;
  completed_at: string | null;
  pet_name?: string;
  service_title?: string;
  provider_name?: string;
}

interface Alert {
  type: 'warning' | 'info' | 'error';
  message: string;
  timestamp: string;
}

export default function PetmanagerMonitor() {
  const [bookings, setBookings] = useState<BookingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('pet_bookings')
        .select('id, status, scheduled_date, created_at, cancelled_at, completed_at, pets!inner(name), pet_services!inner(title), pet_providers!inner(company_name)')
        .order('created_at', { ascending: false })
        .limit(200);

      setBookings(
        (data || []).map((b: any) => ({
          ...b,
          pet_name: b.pets?.name,
          service_title: b.pet_services?.title,
          provider_name: b.pet_providers?.company_name,
        }))
      );
      setLoading(false);
    })();
  }, []);

  // KPIs
  const totalBookings = bookings.length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;
  const noShowCount = bookings.filter(b => b.status === 'no_show').length;
  const cancelRate = totalBookings > 0 ? ((cancelledCount / totalBookings) * 100).toFixed(1) : '0.0';
  const completedCount = bookings.filter(b => b.status === 'completed').length;

  // Trend data: bookings per day (last 14 days)
  const trendData = useMemo(() => {
    const days: { date: string; buchungen: number; storniert: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayLabel = format(d, 'dd.MM', { locale: de });
      const dayBookings = bookings.filter(b => b.created_at.startsWith(dateStr));
      days.push({
        date: dayLabel,
        buchungen: dayBookings.length,
        storniert: dayBookings.filter(b => b.status === 'cancelled').length,
      });
    }
    return days;
  }, [bookings]);

  // Alerts
  const alerts = useMemo<Alert[]>(() => {
    const a: Alert[] = [];
    const rate = parseFloat(cancelRate);
    if (rate > 20) a.push({ type: 'error', message: `Stornoquote bei ${cancelRate}% — über Schwellwert (20%)`, timestamp: new Date().toISOString() });
    else if (rate > 10) a.push({ type: 'warning', message: `Stornoquote bei ${cancelRate}% — Beobachtung empfohlen`, timestamp: new Date().toISOString() });
    
    if (noShowCount > 0) a.push({ type: 'warning', message: `${noShowCount} No-Show Buchungen erfasst`, timestamp: new Date().toISOString() });

    const recentCancellations = bookings.filter(b => b.status === 'cancelled' && b.cancelled_at && new Date(b.cancelled_at) > subDays(new Date(), 1)).length;
    if (recentCancellations >= 3) a.push({ type: 'error', message: `${recentCancellations} Stornierungen in den letzten 24h`, timestamp: new Date().toISOString() });

    if (a.length === 0) a.push({ type: 'info', message: 'Keine Anomalien erkannt — System läuft normal', timestamp: new Date().toISOString() });
    return a;
  }, [bookings, cancelRate, noShowCount]);

  // Recent audit trail (last 20 status changes)
  const auditTrail = useMemo(() => {
    return bookings
      .filter(b => b.completed_at || b.cancelled_at)
      .slice(0, 20)
      .map(b => ({
        id: b.id,
        action: b.status === 'completed' ? 'Abgeschlossen' : b.status === 'cancelled' ? 'Storniert' : b.status === 'no_show' ? 'No-Show' : b.status,
        pet: b.pet_name || '—',
        service: b.service_title || '—',
        provider: b.provider_name || '—',
        timestamp: b.completed_at || b.cancelled_at || b.created_at,
        variant: b.status === 'completed' ? 'secondary' : 'destructive' as 'secondary' | 'destructive',
      }));
  }, [bookings]);

  return (
    <OperativeDeskShell
      title="Monitoring"
      subtitle="Franchise-KPIs · Alerts · Audit-Trail"
      moduleCode="MOD-05"
    >
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{loading ? '…' : totalBookings}</p><p className="text-xs text-muted-foreground">Buchungen gesamt</p></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-primary">{loading ? '…' : completedCount}</p><p className="text-xs text-muted-foreground">Abgeschlossen</p></CardContent></Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className={`text-2xl font-bold ${parseFloat(cancelRate) > 15 ? 'text-destructive' : 'text-muted-foreground'}`}>{loading ? '…' : `${cancelRate}%`}</p>
              <p className="text-xs text-muted-foreground">Stornoquote</p>
            </CardContent>
          </Card>
          <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-destructive">{loading ? '…' : noShowCount}</p><p className="text-xs text-muted-foreground">No-Shows</p></CardContent></Card>
        </div>

        {/* Alerts */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4" />Anomalie-Alerts</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${
                alert.type === 'error' ? 'border-destructive/50 bg-destructive/5' :
                alert.type === 'warning' ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20' :
                'border-border/30 bg-muted/30'
              }`}>
                {alert.type === 'error' ? <AlertTriangle className="h-4 w-4 text-destructive shrink-0" /> :
                 alert.type === 'warning' ? <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" /> :
                 <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                <p className="text-sm">{alert.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Trend Chart */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4" />Buchungstrend (14 Tage)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="buchungen" stroke="hsl(var(--primary))" strokeWidth={2} name="Buchungen" />
                <Line type="monotone" dataKey="storniert" stroke="hsl(var(--destructive))" strokeWidth={2} name="Storniert" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Audit Trail */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" />Audit-Trail (letzte 20)</CardTitle></CardHeader>
          <CardContent>
            {auditTrail.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Keine Einträge</p>
            ) : (
              <div className="space-y-2">
                {auditTrail.map(entry => (
                  <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 text-sm">
                    <Badge variant={entry.variant} className="text-[10px] shrink-0">{entry.action}</Badge>
                    <span className="truncate">{entry.service} — {entry.pet}</span>
                    <span className="text-xs text-muted-foreground ml-auto shrink-0">
                      {entry.provider} · {format(new Date(entry.timestamp), 'dd.MM. HH:mm', { locale: de })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OperativeDeskShell>
  );
}
