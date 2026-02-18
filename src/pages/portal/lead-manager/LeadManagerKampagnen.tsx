/**
 * Lead Manager — Kampagnen Tab (MOD-10)
 * Liste aller social_mandates des Managers
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Megaphone, Plus, Calendar, MapPin, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { DESIGN } from '@/config/designManifest';

const BRAND_LABELS: Record<string, string> = {
  futureroom: 'FutureRoom',
  kaufy: 'Kaufy',
  lennox_friends: 'Lennox & Friends',
  acquiary: 'Acquiary',
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  submitted: { label: 'Eingereicht', variant: 'outline' },
  live: { label: 'Live', variant: 'default' },
  paused: { label: 'Pausiert', variant: 'secondary' },
  stopped: { label: 'Gestoppt', variant: 'destructive' },
  completed: { label: 'Abgeschlossen', variant: 'secondary' },
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100);
}

export default function LeadManagerKampagnen() {
  const { user, activeTenantId } = useAuth();
  const navigate = useNavigate();

  const { data: mandates, isLoading } = useQuery({
    queryKey: ['lead-manager-kampagnen', activeTenantId, user?.id],
    queryFn: async () => {
      if (!activeTenantId || !user?.id) return [];
      const { data } = await supabase
        .from('social_mandates')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('partner_user_id', user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!activeTenantId && !!user?.id,
  });

  return (
    <PageShell>
      <ModulePageHeader
        title="KAMPAGNEN"
        description="Alle beauftragten Social-Media-Mandate"
        actions={
          <Button onClick={() => navigate('/portal/lead-manager/studio/planen')} className="gap-2">
            <Plus className="h-4 w-4" /> Neue Kampagne
          </Button>
        }
      />

      {isLoading ? (
        <div className={DESIGN.WIDGET_GRID.FULL}>
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : mandates && mandates.length > 0 ? (
        <div className={DESIGN.WIDGET_GRID.FULL}>
          {mandates.map(m => {
            const status = STATUS_CONFIG[m.status] || { label: m.status, variant: 'outline' as const };
            return (
              <Card key={m.id} className="glass-card hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/portal/lead-manager/kampagnen/${m.id}`)}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{BRAND_LABELS[m.brand_context] || m.brand_context}</Badge>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formatCurrency(m.budget_total_cents || 0)}</span>
                    </div>
                    {m.start_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(m.start_date).toLocaleDateString('de-DE')} – {m.end_date ? new Date(m.end_date).toLocaleDateString('de-DE') : '—'}</span>
                      </div>
                    )}
                    {m.regions && Array.isArray(m.regions) && (m.regions as string[]).length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{(m.regions as string[]).join(', ')}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Erstellt: {new Date(m.created_at).toLocaleDateString('de-DE')}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <EmptyState
              icon={Megaphone}
              title="Noch keine Kampagnen"
              description="Plane und beauftrage deine erste Kampagne im Studio."
              action={{
                label: 'Kampagne planen',
                onClick: () => navigate('/portal/lead-manager/studio/planen'),
              }}
            />
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
