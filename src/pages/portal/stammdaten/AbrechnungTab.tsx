import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, StatusBadge, EmptyState } from '@/components/shared';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Loader2, CreditCard, FileText, TrendingUp, Download, Bot, ArrowRight, History, TrendingDown } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import { format, subDays, startOfMonth, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { CreditTopUpDialog } from '@/components/shared/CreditTopUpDialog';
import { getServiceLabel, BILLING_CATEGORIES, type BillingCategory } from '@/config/billingConstants';

export function AbrechnungTab() {
  const { activeTenantId } = useAuth();

  // Fetch subscription/plan
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['subscription', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return null;
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`*, plans(*)`)
        .eq('tenant_id', activeTenantId)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!activeTenantId,
  });

  // Fetch credit balance
  const { data: creditBalance } = useQuery({
    queryKey: ['credit-balance', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return null;
      const { data, error } = await supabase
        .from('tenant_credit_balance')
        .select('balance_credits')
        .eq('tenant_id', activeTenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!activeTenantId,
  });

  // Fetch invoices
  const { data: invoices, isLoading: invLoading } = useQuery({
    queryKey: ['invoices', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // Fetch credit_ledger (last 90 days, debits)
  const ninetyDaysAgo = subDays(new Date(), 90).toISOString();
  const { data: ledgerEntries, isLoading: ledgerLoading } = useQuery({
    queryKey: ['credit-ledger', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('credit_ledger')
        .select('id, created_at, kind, amount, ref_type, ref_id')
        .eq('tenant_id', activeTenantId)
        .eq('kind', 'debit')
        .gte('created_at', ninetyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const isLoading = subLoading || invLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const plan = subscription?.plans;
  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

  const invoiceStatusMap: Record<string, 'success' | 'warning' | 'error' | 'muted'> = {
    paid: 'success', pending: 'warning', overdue: 'error', draft: 'muted', cancelled: 'muted',
  };

  // ── Usage history calculations ──
  const thisMonthStart = startOfMonth(new Date());
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));

  const thisMonthCredits = (ledgerEntries || [])
    .filter(e => new Date(e.created_at) >= thisMonthStart)
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const lastMonthCredits = (ledgerEntries || [])
    .filter(e => new Date(e.created_at) >= lastMonthStart && new Date(e.created_at) < thisMonthStart)
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Group by ref_type → category summary
  const categoryTotals: Record<string, number> = {};
  for (const entry of ledgerEntries || []) {
    const key = entry.ref_type || 'unknown';
    categoryTotals[key] = (categoryTotals[key] || 0) + (entry.amount || 0);
  }
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  return (
    <PageShell>
      <ModulePageHeader title="Abrechnung" description="Ihr Plan, Credits und Rechnungen" />

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Aktueller Plan
          </CardTitle>
          <CardDescription>Ihr aktives Abonnement und verfügbare Credits.</CardDescription>
        </CardHeader>
        <CardContent>
          {plan ? (
            <div className={DESIGN.KPI_GRID.FULL}>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="text-2xl font-bold">{plan.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(plan.price_cents)} / {plan.interval === 'monthly' ? 'Monat' : 'Jahr'}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1"><StatusBadge status={subscription.status} /></div>
                {subscription.current_period_end && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Nächste Abrechnung: {format(new Date(subscription.current_period_end), 'dd.MM.yyyy', { locale: de })}
                  </p>
                )}
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Credits</p>
                <p className="text-2xl font-bold">{creditBalance?.balance_credits ?? 0}</p>
                <div className="mt-2"><CreditTopUpDialog /></div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/50 p-6 text-center">
              <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground" />
              <h3 className="mt-3 font-medium">Kein aktiver Plan</h3>
              <p className="text-sm text-muted-foreground mt-1">Sie nutzen derzeit die kostenlose Version.</p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <div className="text-sm text-muted-foreground">
                  Credit-Saldo: <span className="font-semibold text-foreground">{creditBalance?.balance_credits ?? 0}</span>
                </div>
                <CreditTopUpDialog />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Verbrauchshistorie ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Verbrauchshistorie
          </CardTitle>
          <CardDescription>Credit-Verbrauch der letzten 90 Tage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Month comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Dieser Monat</p>
              <p className="text-2xl font-bold">{thisMonthCredits} <span className="text-sm font-normal text-muted-foreground">Credits</span></p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Letzter Monat</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{lastMonthCredits} <span className="text-sm font-normal text-muted-foreground">Credits</span></p>
                {thisMonthCredits > lastMonthCredits && lastMonthCredits > 0 && (
                  <TrendingUp className="h-4 w-4 text-destructive" />
                )}
                {thisMonthCredits < lastMonthCredits && lastMonthCredits > 0 && (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
          </div>

          {/* Category breakdown */}
          {sortedCategories.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-3">Verbrauch nach Service</p>
              <div className="space-y-2">
                {sortedCategories.slice(0, 8).map(([refType, total]) => {
                  const maxTotal = sortedCategories[0][1];
                  const widthPct = maxTotal > 0 ? Math.max(5, (total / maxTotal) * 100) : 5;
                  return (
                    <div key={refType} className="flex items-center gap-3">
                      <span className="text-sm w-48 truncate">{getServiceLabel(refType)}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">{total} Cr</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Line items table */}
          {ledgerLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (ledgerEntries && ledgerEntries.length > 0) ? (
            <DataTable
              data={ledgerEntries.slice(0, 50)}
              columns={[
                {
                  key: 'created_at',
                  header: 'Datum',
                  sortable: true,
                  render: (v) => v ? format(new Date(v as string), 'dd.MM.yy HH:mm', { locale: de }) : '-',
                },
                {
                  key: 'ref_type',
                  header: 'Service',
                  render: (v) => getServiceLabel(v as string),
                },
                {
                  key: 'amount',
                  header: 'Credits',
                  sortable: true,
                  render: (v) => <span className="font-medium">-{v as number}</span>,
                },
              ]}
              emptyMessage="Keine Verbrauchsdaten"
            />
          ) : (
            <EmptyState
              icon={History}
              title="Kein Verbrauch"
              description="In den letzten 90 Tagen wurden keine Credits verbraucht."
            />
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rechnungen
          </CardTitle>
          <CardDescription>Übersicht aller Rechnungen und Zahlungen.</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices && invoices.length > 0 ? (
            <DataTable
              data={invoices}
              columns={[
                { key: 'invoice_number', header: 'Rechnungsnr.', sortable: true },
                {
                  key: 'issued_at', header: 'Datum', sortable: true,
                  render: (value) => value ? format(new Date(value as string), 'dd.MM.yyyy', { locale: de }) : '-',
                },
                {
                  key: 'amount_cents', header: 'Betrag', sortable: true,
                  render: (value) => formatCurrency(value as number),
                },
                {
                  key: 'status', header: 'Status',
                  render: (value) => <StatusBadge status={value as string} variant={invoiceStatusMap[value as string] || 'default'} />,
                },
                {
                  key: 'pdf_url', header: '',
                  render: (value) => value ? (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={value as string} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
                    </Button>
                  ) : null,
                },
              ]}
              emptyMessage="Keine Rechnungen vorhanden"
            />
          ) : (
            <EmptyState icon={FileText} title="Keine Rechnungen" description="Es wurden noch keine Rechnungen erstellt." />
          )}
        </CardContent>
      </Card>

      {/* Link to Armstrong Hub */}
      <Card className="glass-card border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold">Armstrong — Verbrauch & Preise</h3>
                <p className="text-sm text-muted-foreground">KI-Aktionen, Credit-Verbrauch, System-Preisliste und Add-Ons</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/portal/armstrong">Ansehen <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
