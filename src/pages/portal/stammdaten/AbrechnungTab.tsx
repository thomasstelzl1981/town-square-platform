import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DataTable, StatusBadge, EmptyState, FormSection, FormInput } from '@/components/shared';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Loader2, CreditCard, FileText, TrendingUp, Download, Bot, MessageSquare, Save } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { AktionsKatalog } from '@/pages/portal/communication-pro/agenten/AktionsKatalog';
import { KostenDashboard } from '@/pages/portal/communication-pro/agenten/KostenDashboard';
import { toast } from 'sonner';

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
    <PageShell>
      <ModulePageHeader title="Abrechnung" description="Dein Plan, Credits und Rechnungen" />
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

      {/* Armstrong Section */}
      <Separator className="my-6" />
      
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Armstrong — KI-Aktionen & Credits</h2>
            <p className="text-sm text-muted-foreground">
              Übersicht aller verfügbaren KI-Aktionen und Ihres Credit-Verbrauchs.
            </p>
          </div>
        </div>

        <KostenDashboard />
        <WhatsAppArmstrongCard />
        <AktionsKatalog />
      </div>
    </PageShell>
  );
}

// =============================================================================
// WhatsApp Armstrong Card
// =============================================================================
function WhatsAppArmstrongCard() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const { data: waSettings } = useQuery({
    queryKey: ['whatsapp-user-settings', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.from('whatsapp_user_settings').select('*').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: waAccount } = useQuery({
    queryKey: ['whatsapp-account'],
    queryFn: async () => {
      const { data, error } = await supabase.from('whatsapp_accounts').select('system_phone_e164, status').maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const [ownerControlE164, setOwnerControlE164] = React.useState('');
  const [autoReplyEnabled, setAutoReplyEnabled] = React.useState(false);
  const [autoReplyText, setAutoReplyText] = React.useState('Vielen Dank für Ihre Nachricht. Wir melden uns in Kürze.');

  React.useEffect(() => {
    if (waSettings) {
      setOwnerControlE164(waSettings.owner_control_e164 || '');
      setAutoReplyEnabled(waSettings.auto_reply_enabled || false);
      setAutoReplyText(waSettings.auto_reply_text || 'Vielen Dank für Ihre Nachricht. Wir melden uns in Kürze.');
    }
  }, [waSettings]);

  const saveWaSettings = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not authenticated');
      const { data: tenantId } = await supabase.rpc('get_user_tenant_id');
      if (!tenantId) throw new Error('No organization found');
      const { error } = await supabase.from('whatsapp_user_settings').upsert({
        tenant_id: tenantId, user_id: userId,
        owner_control_e164: ownerControlE164 || null,
        auto_reply_enabled: autoReplyEnabled, auto_reply_text: autoReplyText,
      }, { onConflict: 'tenant_id,user_id' });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['whatsapp-user-settings'] }); toast.success('WhatsApp gespeichert'); },
    onError: (error) => { toast.error('Fehler: ' + (error as Error).message); },
  });

  const statusColor = waAccount?.status === 'connected' ? 'text-green-600' :
    waAccount?.status === 'error' ? 'text-destructive' : 'text-yellow-600';
  const statusLabel = waAccount?.status === 'connected' ? 'Verbunden' :
    waAccount?.status === 'error' ? 'Fehler' : 'Ausstehend';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          WhatsApp Business
        </CardTitle>
        <CardDescription>Verbindung und Armstrong-Steuerung</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {waAccount ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusColor}>● {statusLabel}</Badge>
                </div>
                <FormSection>
                  <FormInput label="Systemnummer" name="system_phone" value={waAccount.system_phone_e164} disabled
                    hint="WhatsApp Business Nummer" />
                </FormSection>
              </>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Noch nicht konfiguriert</p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <FormSection>
              <FormInput label="Owner-Control Nummer" name="owner_control_e164" type="tel"
                value={ownerControlE164} onChange={e => setOwnerControlE164(e.target.value)}
                placeholder="+49 170 1234567" hint="Für Armstrong-Befehle via WhatsApp" />
            </FormSection>
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
              <Bot className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Armstrong reagiert <strong>nur</strong> auf diese Nummer.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <div>
                <Label className="text-xs font-medium">Auto-Reply</Label>
                <p className="text-xs text-muted-foreground">Automatische Antwort</p>
              </div>
              <Switch checked={autoReplyEnabled} onCheckedChange={setAutoReplyEnabled} />
            </div>
            {autoReplyEnabled && (
              <Textarea value={autoReplyText} onChange={e => setAutoReplyText(e.target.value)}
                placeholder="Vielen Dank..." rows={2} className="text-xs" />
            )}
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => saveWaSettings.mutate()}
                disabled={saveWaSettings.isPending} className="gap-1.5">
                {saveWaSettings.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Speichern
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
