/**
 * MOD-18 Finanzanalyse — Tab 3: Verträge & Fixkosten
 * Fixkosten Summary, Abos (read-only), Versicherungen (read-only)
 */
import { useMemo } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFinanzanalyseData } from '@/hooks/useFinanzanalyseData';
import { useNavigate } from 'react-router-dom';
import {
  Receipt, FileText, Shield, AlertTriangle,
  ExternalLink, Repeat, Copy, ArrowRight
} from 'lucide-react';

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

export default function VertraegeFixkostenTab() {
  const { transactions, kpis, isLoading } = useFinanzanalyseData();
  const navigate = useNavigate();

  const recurring = useMemo(() => {
    const merchantCount = new Map<string, { count: number; totalAbs: number; amounts: number[] }>();
    for (const tx of transactions) {
      if ((tx.amount_eur || 0) >= 0) continue;
      const m = tx.counterparty || 'Unbekannt';
      const entry = merchantCount.get(m) || { count: 0, totalAbs: 0, amounts: [] };
      entry.count += 1;
      entry.totalAbs += Math.abs(tx.amount_eur || 0);
      entry.amounts.push(Math.abs(tx.amount_eur || 0));
      merchantCount.set(m, entry);
    }
    return Array.from(merchantCount.entries())
      .filter(([, v]) => v.count >= 3)
      .map(([merchant, v]) => ({
        merchant,
        count: v.count,
        avgAmount: v.totalAbs / v.count,
        total: v.totalAbs,
        isSubscription: v.amounts.every(a => Math.abs(a - v.amounts[0]) < 1),
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  const subscriptions = recurring.filter(r => r.isSubscription);
  const otherRecurring = recurring.filter(r => !r.isSubscription);
  const totalFixMonthly = subscriptions.reduce((s, r) => s + r.avgAmount, 0);

  const duplicates = useMemo(() => {
    const found: { a: string; b: string; hint: string }[] = [];
    for (let i = 0; i < subscriptions.length; i++) {
      for (let j = i + 1; j < subscriptions.length; j++) {
        const a = subscriptions[i];
        const b = subscriptions[j];
        if (Math.abs(a.avgAmount - b.avgAmount) < 5 && a.merchant.substring(0, 4).toLowerCase() === b.merchant.substring(0, 4).toLowerCase()) {
          found.push({ a: a.merchant, b: b.merchant, hint: 'Ähnlicher Name & Betrag' });
        }
      }
    }
    return found;
  }, [subscriptions]);

  if (transactions.length === 0) {
    return (
      <PageShell>
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium">Noch keine Vertragsdaten</p>
            <p className="text-sm text-muted-foreground mt-1">
              Verbinden Sie Ihre Konten, um Abos und Fixkosten automatisch zu erkennen.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/portal/finanzierungsmanager')}>
              Finanzmanager öffnen
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Receipt className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{fmt(totalFixMonthly)}</p>
            <p className="text-xs text-muted-foreground">Fixkosten / Monat</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Repeat className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{subscriptions.length}</p>
            <p className="text-xs text-muted-foreground">Abonnements erkannt</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{kpis.insuranceCount}</p>
            <p className="text-xs text-muted-foreground">Versicherungen</p>
          </CardContent>
        </Card>
      </div>

      {/* Abonnements */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              Erkannte Abonnements
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/portal/finanzierungsmanager')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Im Finanzmanager öffnen
            </Button>
          </div>
          <CardDescription>Automatisch erkannt aus wiederkehrenden Zahlungen mit gleichem Betrag</CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length > 0 ? (
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div key={sub.merchant} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{sub.merchant}</p>
                    <p className="text-xs text-muted-foreground">{sub.count}x in 12 Monaten</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-medium">{fmt(sub.avgAmount)}/Monat</p>
                    <p className="text-xs text-muted-foreground">{fmt(sub.total)} gesamt</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Keine regelmäßigen Abonnements erkannt.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Weitere wiederkehrende Zahlungen */}
      {otherRecurring.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Weitere wiederkehrende Zahlungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {otherRecurring.slice(0, 10).map((r) => (
                <div key={r.merchant} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{r.merchant}</p>
                    <p className="text-xs text-muted-foreground">{r.count}x | ∅ {fmt(r.avgAmount)}</p>
                  </div>
                  <span className="font-mono text-sm">{fmt(r.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duplikate */}
      {duplicates.length > 0 && (
        <Card className="mt-6 border-destructive/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <Copy className="h-5 w-5" />
              Mögliche Duplikate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {duplicates.map((d, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                <div>
                  <p className="text-sm"><span className="font-medium">{d.a}</span> <ArrowRight className="h-3 w-3 inline" /> <span className="font-medium">{d.b}</span></p>
                  <p className="text-xs text-muted-foreground">{d.hint}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
