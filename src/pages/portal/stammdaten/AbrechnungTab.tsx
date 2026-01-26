import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, StatusBadge, EmptyState } from '@/components/shared';
import { Loader2, CreditCard, FileText, TrendingUp, Download } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export function AbrechnungTab() {
  const { activeTenantId } = useAuth();

  // Fetch subscription/plan
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['subscription', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return null;
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plans(*)
        `)
        .eq('tenant_id', activeTenantId)
        .eq('status', 'active')
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

  const isLoading = subLoading || invLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const plan = subscription?.plans;
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const invoiceStatusMap: Record<string, 'success' | 'warning' | 'error' | 'muted'> = {
    paid: 'success',
    pending: 'warning',
    overdue: 'error',
    draft: 'muted',
    cancelled: 'muted',
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Aktueller Plan
          </CardTitle>
          <CardDescription>
            Ihr aktives Abonnement und verfügbare Credits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plan ? (
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="text-2xl font-bold">{plan.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(plan.price_cents)} / {plan.interval === 'monthly' ? 'Monat' : 'Jahr'}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">
                  <StatusBadge status={subscription.status} />
                </div>
                {subscription.current_period_end && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Nächste Abrechnung: {format(new Date(subscription.current_period_end), 'dd.MM.yyyy', { locale: de })}
                  </p>
                )}
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Credits</p>
                <p className="text-2xl font-bold">∞</p>
                <p className="text-sm text-muted-foreground mt-1">Unbegrenzt in diesem Plan</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/50 p-6 text-center">
              <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground" />
              <h3 className="mt-3 font-medium">Kein aktiver Plan</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sie nutzen derzeit die kostenlose Version.
              </p>
              <Button className="mt-4">Plan upgraden</Button>
            </div>
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
          <CardDescription>
            Übersicht aller Rechnungen und Zahlungen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices && invoices.length > 0 ? (
            <DataTable
              data={invoices}
              columns={[
                { 
                  key: 'invoice_number', 
                  header: 'Rechnungsnr.',
                  sortable: true 
                },
                {
                  key: 'issued_at',
                  header: 'Datum',
                  sortable: true,
                  render: (value) => value ? format(new Date(value as string), 'dd.MM.yyyy', { locale: de }) : '-',
                },
                {
                  key: 'amount_cents',
                  header: 'Betrag',
                  sortable: true,
                  render: (value) => formatCurrency(value as number),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (value) => (
                    <StatusBadge 
                      status={value as string} 
                      variant={invoiceStatusMap[value as string] || 'default'} 
                    />
                  ),
                },
                {
                  key: 'pdf_url',
                  header: '',
                  render: (value) => value ? (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={value as string} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : null,
                },
              ]}
              emptyMessage="Keine Rechnungen vorhanden"
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="Keine Rechnungen"
              description="Es wurden noch keine Rechnungen erstellt."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
