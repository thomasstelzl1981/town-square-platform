/**
 * SerienEmailsPage — MOD-14 Serien-E-Mail (Outbound-Light)
 * Dashboard with campaign list + CampaignWizard
 * Role-gated: only sales_partner can access
 */

import { useState } from 'react';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMailCampaigns } from '@/hooks/useMailCampaigns';
import { CampaignWizard } from '@/components/portal/communication-pro/CampaignWizard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mail, Plus, Send, Users, CheckCircle2, AlertCircle,
  Clock, Trash2, Loader2, ShieldAlert,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { useDemoToggles } from '@/hooks/useDemoToggles';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: typeof Send }> = {
  draft: { label: 'Entwurf', variant: 'outline', icon: Clock },
  sending: { label: 'Wird gesendet', variant: 'default', icon: Loader2 },
  sent: { label: 'Gesendet', variant: 'secondary', icon: CheckCircle2 },
  failed: { label: 'Fehlgeschlagen', variant: 'destructive', icon: AlertCircle },
};

export function SerienEmailsPage() {
  const { user } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const { campaigns, isLoading, deleteCampaign } = useMailCampaigns();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-SERIEN-EMAIL');

  // Role-gate: check if user has sales_partner role
  const { data: hasSalesRole, isLoading: roleLoading } = useQuery({
    queryKey: ['user-has-sales-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      const roles = (data || []).map(r => r.role);
      return roles.includes('sales_partner') || roles.includes('platform_admin');
    },
    enabled: !!user?.id,
  });

  if (roleLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasSalesRole) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4 text-center">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold">Zugriff eingeschränkt</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Serien-E-Mails sind nur für Vertriebspartner verfügbar. 
          Bitte kontaktieren Sie Ihren Administrator, um die entsprechende Rolle zu erhalten.
        </p>
      </div>
    );
  }

  if (showWizard) {
    return (
      <div className="p-4 md:p-6">
        <CampaignWizard
          onClose={() => setShowWizard(false)}
          onSuccess={() => setShowWizard(false)}
        />
      </div>
    );
  }

  const totalRecipients = campaigns.reduce((s, c) => s + (c.recipients_count || 0), 0);
  const sentCampaigns = campaigns.filter(c => c.status === 'sent').length;

  return (
    <PageShell>
      <ModulePageHeader
        title="SERIEN-E-MAILS"
        description="Personalisierter Massenversand an Ihre Kontakte"
        actions={
          <Button onClick={() => setShowWizard(true)}>
            <Plus className="h-4 w-4 mr-2" /> Neue Serien-E-Mail
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className={DESIGN.KPI_GRID.FULL}>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Kampagnen</p>
                <p className="text-2xl font-bold mt-1">{campaigns.length}</p>
                <p className="text-xs text-muted-foreground">{sentCampaigns} gesendet</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Send className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Empfänger gesamt</p>
                <p className="text-2xl font-bold mt-1">{totalRecipients.toLocaleString('de-DE')}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Zugestellt</p>
                <p className="text-2xl font-bold mt-1">
                  {campaigns.reduce((s, c) => s + (c.sent_count || 0), 0).toLocaleString('de-DE')}
                </p>
                <p className="text-xs text-destructive">
                  {campaigns.reduce((s, c) => s + (c.failed_count || 0), 0)} fehlgeschlagen
                </p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Widgets */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <WidgetGrid>
          {/* Demo Widget */}
          {demoEnabled && (
            <WidgetCell>
              <Card className={cn("h-full cursor-pointer transition-colors", DESIGN.DEMO_WIDGET.CARD, DESIGN.DEMO_WIDGET.HOVER)}>
                <CardContent className="p-4 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={cn(DESIGN.DEMO_WIDGET.BADGE, "text-[10px]")}>Demo</Badge>
                      <Badge variant="secondary" className="text-[10px]">Aktiv</Badge>
                    </div>
                    <h3 className="font-semibold text-sm">Willkommens-Sequenz</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">3-Schritt-Sequenz für Neukunden</p>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Empfänger</span>
                      <span className="font-mono font-semibold">42</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Öffnungsrate</span>
                      <span className="font-mono">68%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Schritte</span>
                      <span className="font-mono">3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </WidgetCell>
          )}

          {/* Real Campaigns */}
          {campaigns.map(campaign => {
            const st = STATUS_MAP[campaign.status] || STATUS_MAP.draft;
            const StIcon = st.icon;
            return (
              <WidgetCell key={campaign.id}>
                <Card className="h-full hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                          <StIcon className={`h-3.5 w-3.5 ${campaign.status === 'sending' ? 'animate-spin' : ''} text-muted-foreground`} />
                        </div>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </div>
                      <h3 className="font-semibold text-sm truncate">{campaign.name || campaign.subject_template || 'Ohne Titel'}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {campaign.recipients_count} Empfänger
                      </p>
                    </div>
                    <div className="mt-3 space-y-1">
                      {campaign.status === 'sent' && campaign.sent_count > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Zugestellt</span>
                          <span className="font-mono">{campaign.sent_count}/{campaign.recipients_count}</span>
                        </div>
                      )}
                      {campaign.status === 'draft' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-full text-destructive">
                              <Trash2 className="h-3 w-3 mr-1" /> Löschen
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Kampagne löschen?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Diese Kampagne und alle zugehörigen Empfänger werden unwiderruflich gelöscht.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteCampaign.mutate(campaign.id)}>
                                Löschen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </WidgetCell>
            );
          })}

          {/* CTA Widget */}
          <WidgetCell>
            <Card
              className="glass-card border-dashed border-2 h-full flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
              onClick={() => setShowWizard(true)}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Neue Kampagne</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Serien-E-Mail erstellen</p>
                </div>
              </CardContent>
            </Card>
          </WidgetCell>
        </WidgetGrid>
      )}
    </PageShell>
  );
}
