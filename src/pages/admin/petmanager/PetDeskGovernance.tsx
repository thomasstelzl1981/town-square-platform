/**
 * Pet Desk — Governance Tab: KPI Dashboard + Demo-Toggle
 * Moved from former PetmanagerDesk index view
 */
import { useState, useEffect } from 'react';
import { PawPrint, Users, CreditCard, ShieldCheck, BarChart3, Calendar, ClipboardList, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import { useDemoToggles } from '@/hooks/useDemoToggles';

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

interface DashboardData {
  providerCount: number;
  pendingProviders: number;
  activeServices: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  openInvoiceAmount: number;
  monthlyRevenue: number;
  totalRevenue: number;
  revenueByMonth: { month: string; umsatz: number }[];
  bookingsByStatus: { name: string; value: number }[];
}

const STATUS_COLORS = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))', 'hsl(var(--destructive))', '#f59e0b', '#10b981', '#6366f1'];

export default function PetDeskGovernance() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { isEnabled, toggle } = useDemoToggles();
  const demoEnabled = isEnabled('GP-PET');

  useEffect(() => {
    (async () => {
      const [providers, services, bookings, invoices] = await Promise.all([
        supabase.from('pet_providers').select('id, status'),
        supabase.from('pet_services').select('id, is_active'),
        supabase.from('pet_bookings').select('id, status, scheduled_date'),
        supabase.from('pet_invoices').select('status, amount_cents, paid_at, created_at'),
      ]);

      const providerList = providers.data || [];
      const serviceList = services.data || [];
      const bookingList = bookings.data || [];
      const invoiceList = invoices.data || [];

      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const monthlyRevenue = invoiceList
        .filter((i: any) => i.status === 'paid' && i.paid_at && new Date(i.paid_at) >= monthStart && new Date(i.paid_at) <= monthEnd)
        .reduce((s: number, i: any) => s + i.amount_cents, 0);

      const revenueByMonth: { month: string; umsatz: number }[] = [];
      for (let m = 5; m >= 0; m--) {
        const d = subMonths(now, m);
        const s = startOfMonth(d);
        const e = endOfMonth(d);
        const total = invoiceList
          .filter((i: any) => i.status === 'paid' && i.paid_at && new Date(i.paid_at) >= s && new Date(i.paid_at) <= e)
          .reduce((sum: number, i: any) => sum + i.amount_cents, 0);
        revenueByMonth.push({ month: format(d, 'MMM yy', { locale: de }), umsatz: total / 100 });
      }

      const statusCounts: Record<string, number> = {};
      bookingList.forEach((b: any) => { statusCounts[b.status] = (statusCounts[b.status] || 0) + 1; });
      const statusLabels: Record<string, string> = {
        requested: 'Angefragt', confirmed: 'Bestätigt', in_progress: 'Laufend',
        completed: 'Abgeschlossen', cancelled: 'Storniert', no_show: 'No-Show',
      };

      setData({
        providerCount: providerList.filter((p: any) => p.status === 'active').length,
        pendingProviders: providerList.filter((p: any) => p.status === 'pending').length,
        activeServices: serviceList.filter((s: any) => s.is_active).length,
        totalBookings: bookingList.length,
        completedBookings: bookingList.filter((b: any) => b.status === 'completed').length,
        cancelledBookings: bookingList.filter((b: any) => b.status === 'cancelled').length,
        openInvoiceAmount: invoiceList.filter((i: any) => i.status === 'sent' || i.status === 'overdue').reduce((s: number, i: any) => s + i.amount_cents, 0),
        monthlyRevenue,
        totalRevenue: invoiceList.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + i.amount_cents, 0),
        revenueByMonth,
        bookingsByStatus: Object.entries(statusCounts).map(([k, v]) => ({ name: statusLabels[k] || k, value: v })),
      });
      setLoading(false);
    })();
  }, []);

  const v = (val: number | string | undefined) => loading ? '…' : val;

  return (
    <div className="space-y-6">
      {/* Demo Toggle */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PawPrint className="h-4 w-4 text-primary" />
              <Label htmlFor="gp-pet-toggle" className="text-sm font-medium">Pet Manager Demo-Daten</Label>
            </div>
            <Switch
              id="gp-pet-toggle"
              checked={demoEnabled}
              onCheckedChange={() => toggle('GP-PET')}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Steuert die Sichtbarkeit der Demo-Kunden, -Tiere und -Buchungen in Zone 2 (Pet Manager).
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /><span className="text-xs font-medium">Aktive Provider</span></div>
            <p className="mt-2 text-2xl font-semibold text-foreground">{v(data?.providerCount)}</p>
            <p className="text-xs text-muted-foreground">{data?.pendingProviders || 0} ausstehend</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground"><CreditCard className="h-4 w-4" /><span className="text-xs font-medium">Offene Forderungen</span></div>
            <p className="mt-2 text-2xl font-semibold text-foreground">{v(data ? formatCents(data.openInvoiceAmount) : undefined)}</p>
            <p className="text-xs text-muted-foreground">Ausstehend</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground"><TrendingUp className="h-4 w-4" /><span className="text-xs font-medium">Monatsumsatz</span></div>
            <p className="mt-2 text-2xl font-semibold text-foreground">{v(data ? formatCents(data.monthlyRevenue) : undefined)}</p>
            <p className="text-xs text-muted-foreground">Gesamt: {data ? formatCents(data.totalRevenue) : '…'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /><span className="text-xs font-medium">Buchungen</span></div>
            <p className="mt-2 text-2xl font-semibold text-foreground">{v(data?.totalBookings)}</p>
            <p className="text-xs text-muted-foreground">{data?.completedBookings || 0} abgeschlossen · {data?.cancelledBookings || 0} storniert</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" />Umsatzentwicklung</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.revenueByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={val => `${val} €`} />
                <Tooltip formatter={(val: number) => [`${val.toFixed(2)} €`, 'Umsatz']} />
                <Bar dataKey="umsatz" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4" />Buchungen nach Status</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            {data?.bookingsByStatus?.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.bookingsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name}: ${value}`}>
                    {data.bookingsByStatus.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8">Keine Buchungsdaten</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <ClipboardList className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="text-2xl font-bold mt-2">{v(data?.activeServices)}</p>
            <p className="text-xs text-muted-foreground">Aktive Services</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <ShieldCheck className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="text-2xl font-bold mt-2">{v(data?.pendingProviders)}</p>
            <p className="text-xs text-muted-foreground">Offene Verifizierungen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <PawPrint className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="text-2xl font-bold mt-2">{v(data?.completedBookings)}</p>
            <p className="text-xs text-muted-foreground">Erledigte Buchungen</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
