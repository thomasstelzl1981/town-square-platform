/**
 * SerienEmailsPage — MOD-14 Serien-E-Mail (Outbound-Light)
 * Dashboard with campaign list + CampaignWizard
 * Role-gated: only sales_partner can access
 */

import { useState } from 'react';
import { DESIGN } from '@/config/designManifest';
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

      {/* Campaign List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-foreground">Noch keine Kampagnen</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Erstellen Sie Ihre erste Serien-E-Mail, um personalisierte Nachrichten an Ihre Kontakte zu senden.
            </p>
            <Button onClick={() => setShowWizard(true)}>
              <Plus className="h-4 w-4 mr-2" /> Kampagne erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {campaigns.map(campaign => {
            const st = STATUS_MAP[campaign.status] || STATUS_MAP.draft;
            const StIcon = st.icon;
            return (
              <Card key={campaign.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <StIcon className={`h-4 w-4 ${campaign.status === 'sending' ? 'animate-spin' : ''} text-muted-foreground`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{campaign.name || campaign.subject_template || 'Ohne Titel'}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.recipients_count} Empfänger
                          {campaign.sent_at && ` · Gesendet ${format(new Date(campaign.sent_at), 'dd.MM.yyyy HH:mm', { locale: de })}`}
                          {!campaign.sent_at && ` · Erstellt ${format(new Date(campaign.created_at), 'dd.MM.yyyy', { locale: de })}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {campaign.status === 'sent' && campaign.sent_count > 0 && (
                        <span className="text-xs text-muted-foreground hidden md:block">
                          {campaign.sent_count}/{campaign.recipients_count} zugestellt
                        </span>
                      )}
                      <Badge variant={st.variant}>{st.label}</Badge>
                      {campaign.status === 'draft' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Trash2 className="h-4 w-4" />
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
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
