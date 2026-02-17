/**
 * FMProvisionen — Commission agreements & history for Finance Managers
 * Shows the Tippgeber agreement (25% to SoT) and commission history table.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

function useFinanceTippAgreement() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['finance-tipp-agreement', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      // Get the template
      const { data: template } = await supabase
        .from('agreement_templates')
        .select('*')
        .eq('code', 'FINANCE_TIPP_AGREEMENT')
        .eq('is_active', true)
        .maybeSingle();

      if (!template) return { template: null, consent: null };

      // Check if user already accepted
      const { data: consent } = await supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', user.id)
        .eq('template_id', template.id)
        .maybeSingle();

      return { template, consent };
    },
    enabled: !!user?.id,
  });
}

function useFinanceCommissions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['finance-commissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('liable_user_id', user.id)
        .eq('commission_type', 'finance_tipp')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}

export default function FMProvisionen() {
  const { user, activeTenantId } = useAuth();
  const { data: agreementData, isLoading: loadingAgreement, refetch: refetchAgreement } = useFinanceTippAgreement();
  const { data: commissions = [], isLoading: loadingCommissions } = useFinanceCommissions();

  const handleAcceptAgreement = async () => {
    if (!agreementData?.template || !user?.id || !activeTenantId) return;
    try {
      const { error } = await supabase.from('user_consents').insert([{
        user_id: user.id,
        template_id: agreementData.template.id,
        template_version: agreementData.template.version,
        consented_at: new Date().toISOString(),
        ip_address: 'platform',
        status: 'accepted' as const,
        tenant_id: activeTenantId,
      }]);
      if (error) throw error;
      toast.success('Vereinbarung akzeptiert');
      refetchAgreement();
    } catch (err) {
      toast.error('Fehler beim Akzeptieren: ' + (err as Error).message);
    }
  };

  const isLoading = loadingAgreement || loadingCommissions;
  const hasAccepted = !!agreementData?.consent;
  const template = agreementData?.template;

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ModulePageHeader
        title="Provisionen"
        description="Deine Provisionsvereinbarungen mit System of a Town"
      />

      {/* Agreement Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-primary" />
            Tippgeber-Vereinbarung
          </CardTitle>
          <CardDescription>
            Als Finanzierungsmanager führen Sie 25% der Finanzierungsprovision
            als Tippgeberprovision an System of a Town ab.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!template ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Vereinbarungsvorlage nicht verfügbar. Bitte kontaktieren Sie den Support.</span>
            </div>
          ) : hasAccepted ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>
                  Vereinbarung akzeptiert am{' '}
                  <span className="font-medium">
                    {format(new Date(agreementData.consent!.consented_at), 'dd.MM.yyyy', { locale: de })}
                  </span>
                </span>
              </div>
              <Badge variant="default">
                Aktiv
              </Badge>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Bitte akzeptieren Sie die Tippgeber-Vereinbarung, um Finanzierungsmandate bearbeiten zu können.
              </p>
              <Button onClick={handleAcceptAgreement} size="sm">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Vereinbarung akzeptieren
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Provisionshistorie</CardTitle>
          <CardDescription>
            Übersicht Ihrer Finanzierungsprovisionen und der Tippgeberprovision an System of a Town.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fall-ID</TableHead>
                <TableHead>Brutto</TableHead>
                <TableHead>25% SoT</TableHead>
                <TableHead>Netto</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Noch keine Provisionen vorhanden.
                  </TableCell>
                </TableRow>
              ) : (
                commissions.map((c) => {
                  const gross = c.gross_commission || c.amount || 0;
                  const platformFee = c.platform_fee || gross * 0.25;
                  const net = gross - platformFee;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">
                        {c.reference_id?.slice(0, 8) || '—'}
                      </TableCell>
                      <TableCell>{eurFormat.format(gross)}</TableCell>
                      <TableCell className="text-destructive">{eurFormat.format(platformFee)}</TableCell>
                      <TableCell className="font-medium">{eurFormat.format(net)}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === 'paid' ? 'default' : 'secondary'}>
                          {c.status === 'paid' ? 'Bezahlt' : c.status === 'invoiced' ? 'Abgerechnet' : 'Offen'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
