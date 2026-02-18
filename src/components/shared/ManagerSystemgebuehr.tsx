/**
 * ManagerSystemgebuehr — Shared Component für erfolgsabhängige Systemgebühr
 * 
 * Wird von MOD-09 (Immo), MOD-11 (Finance), MOD-12 (Akquise) genutzt.
 * SoT ist KEIN Tippgeber — die Systemgebühr ist eine Plattformgebühr.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { calcSystemFee } from '@/engines/provision/engine';
import { aggregateCommissions } from '@/engines/provision/engine';
import type { SystemFeeConfig } from '@/engines/provision/spec';

const eurFormat = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

interface ManagerSystemgebuehrProps {
  config: SystemFeeConfig;
}

function useAgreement(templateCode: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['system-fee-agreement', templateCode, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data: template } = await supabase
        .from('agreement_templates')
        .select('*')
        .eq('code', templateCode)
        .eq('is_active', true)
        .maybeSingle();

      if (!template) return { template: null, consent: null };

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

function useCommissions(commissionType: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['system-fee-commissions', commissionType, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('liable_user_id', user.id)
        .eq('commission_type', commissionType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}

export function ManagerSystemgebuehr({ config }: ManagerSystemgebuehrProps) {
  const { user, activeTenantId } = useAuth();
  const {
    data: agreementData,
    isLoading: loadingAgreement,
    refetch: refetchAgreement,
  } = useAgreement(config.agreementTemplateCode);
  const { data: commissions = [], isLoading: loadingCommissions } = useCommissions(
    config.commissionType,
  );

  const handleAcceptAgreement = async () => {
    if (!agreementData?.template || !user?.id || !activeTenantId) return;
    try {
      const { error } = await supabase.from('user_consents').insert([
        {
          user_id: user.id,
          template_id: agreementData.template.id,
          template_version: agreementData.template.version,
          consented_at: new Date().toISOString(),
          ip_address: 'platform',
          status: 'accepted' as const,
          tenant_id: activeTenantId,
        },
      ]);
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

  // KPIs via Engine
  const agg = aggregateCommissions(
    commissions.map((c) => ({
      amount: c.gross_commission || c.amount || 0,
      status: c.status || 'pending',
    })),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agreement Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-primary" />
            Systemgebühr-Vereinbarung
          </CardTitle>
          <CardDescription>{config.description}</CardDescription>
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
                    {format(new Date(agreementData.consent!.consented_at), 'dd.MM.yyyy', {
                      locale: de,
                    })}
                  </span>
                </span>
              </div>
              <Badge variant="default">Aktiv</Badge>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Bitte akzeptieren Sie die Systemgebühr-Vereinbarung, um Mandate bearbeiten zu können.
              </p>
              <Button onClick={handleAcceptAgreement} size="sm">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Vereinbarung akzeptieren
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Provision gesamt</p>
            <p className="text-2xl font-bold">{eurFormat.format(agg.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Systemgebühr ({config.systemFeePct}%)</p>
            <p className="text-2xl font-bold text-destructive">
              {eurFormat.format(agg.total * (config.systemFeePct / 100))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Ihr Netto</p>
            <p className="text-2xl font-bold text-primary">
              {eurFormat.format(agg.total * (1 - config.systemFeePct / 100))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commission History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Abrechnungshistorie</CardTitle>
          <CardDescription>
            Übersicht Ihrer Provisionen und der Systemgebühr an System of a Town.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fall-ID</TableHead>
                  <TableHead>Provision (brutto)</TableHead>
                  <TableHead>Systemgebühr</TableHead>
                  <TableHead>Ihr Netto</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Noch keine Abrechnungen vorhanden.
                    </TableCell>
                  </TableRow>
                ) : (
                  commissions.map((c) => {
                    const gross = c.gross_commission || c.amount || 0;
                    const result = calcSystemFee({
                      grossCommission: gross,
                      systemFeePct: config.systemFeePct,
                    });
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">
                          {c.reference_id?.slice(0, 8) || '—'}
                        </TableCell>
                        <TableCell>{eurFormat.format(gross)}</TableCell>
                        <TableCell className="text-destructive">
                          {eurFormat.format(result.systemFee)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {eurFormat.format(result.managerNetto)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={c.status === 'paid' ? 'default' : 'secondary'}>
                            {c.status === 'paid'
                              ? 'Bezahlt'
                              : c.status === 'invoiced'
                                ? 'Abgerechnet'
                                : 'Offen'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
