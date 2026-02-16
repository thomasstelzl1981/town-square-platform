/**
 * Zone 1 — Pet Governance: Finanzen
 * Aggregierte Umsatzzahlen nach Provider
 */
import { useState, useEffect, useMemo } from 'react';
import { CreditCard, TrendingUp, AlertTriangle, Receipt } from 'lucide-react';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';

interface InvoiceSummary {
  status: string;
  amount_cents: number;
  paid_at: string | null;
  created_at: string;
  provider_id: string | null;
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

export default function PetmanagerFinanzen() {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('pet_invoices')
        .select('status, amount_cents, paid_at, created_at, provider_id')
        .order('created_at', { ascending: false });
      setInvoices((data as InvoiceSummary[]) || []);
      setLoading(false);
    })();
  }, []);

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount_cents, 0);
  const openAmount = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.amount_cents, 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;
  const totalInvoices = invoices.length;

  const revenueData = useMemo(() => {
    const months: { month: string; umsatz: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const total = invoices
        .filter(inv => inv.status === 'paid' && inv.paid_at &&
          new Date(inv.paid_at) >= start && new Date(inv.paid_at) <= end)
        .reduce((s, inv) => s + inv.amount_cents, 0);
      months.push({ month: format(d, 'MMM yy', { locale: de }), umsatz: total / 100 });
    }
    return months;
  }, [invoices]);

  return (
    <OperativeDeskShell
      title="Finanz-Governance"
      subtitle="Umsatz · Forderungen · Abrechnungen"
      moduleCode="MOD-05"
    >
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" />Gesamtumsatz</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-foreground">{loading ? '…' : formatCents(totalRevenue)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Offene Forderungen</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-foreground">{loading ? '…' : formatCents(openAmount)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><CreditCard className="h-4 w-4" />Rechnungen gesamt</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-foreground">{loading ? '…' : totalInvoices}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Überfällig</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-destructive">{loading ? '…' : overdueCount}</p></CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm"><Receipt className="h-4 w-4" />Umsatzentwicklung (6 Monate)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={v => `${v} €`} />
                <Tooltip formatter={(v: number) => [`${v.toFixed(2)} €`, 'Umsatz']} />
                <Bar dataKey="umsatz" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Status-Übersicht</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {['draft', 'sent', 'paid', 'overdue', 'cancelled'].map(status => {
                const count = invoices.filter(i => i.status === status).length;
                const labels: Record<string, string> = { draft: 'Entwurf', sent: 'Versendet', paid: 'Bezahlt', overdue: 'Überfällig', cancelled: 'Storniert' };
                return (
                  <Badge key={status} variant={status === 'overdue' ? 'destructive' : 'secondary'} className="gap-1">
                    {labels[status]}: {count}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </OperativeDeskShell>
  );
}
