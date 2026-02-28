/**
 * E-Mail-Anreicherung Card — Contact Enrichment Subscription Toggle
 * Extracted from AbrechnungTab for reuse in ArmstrongInfoPage
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

export function EmailEnrichmentCard() {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();

  const { data: enrichSub, isLoading } = useQuery({
    queryKey: ['enrichment-subscription', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return null;
      const { data, error } = await supabase
        .from('tenant_subscriptions')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('service_code', 'contact_enrichment')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!activeTenantId,
  });

  const { data: usageCount } = useQuery({
    queryKey: ['enrichment-usage', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return 0;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count, error } = await (supabase as any)
        .from('credit_ledger')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', activeTenantId)
        .eq('action_code', 'contact_enrichment')
        .gte('created_at', monthStart)
        .lt('amount', 0);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!activeTenantId,
  });

  const toggleMutation = useMutation({
    mutationFn: async (newActive: boolean) => {
      if (!activeTenantId) throw new Error('Kein aktiver Mandant');

      if (enrichSub) {
        const { error } = await supabase
          .from('tenant_subscriptions')
          .update({
            is_active: newActive,
            activated_at: newActive ? new Date().toISOString() : enrichSub.activated_at,
          })
          .eq('id', enrichSub.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tenant_subscriptions')
          .insert({
            tenant_id: activeTenantId,
            service_code: 'contact_enrichment',
            credits_per_month: 20,
            price_cents: 500,
            is_active: newActive,
            activated_at: newActive ? new Date().toISOString() : null,
          });
        if (error) throw error;
      }

      await supabase
        .from('tenant_extraction_settings')
        .upsert({
          tenant_id: activeTenantId,
          auto_enrich_contacts_email: newActive,
        }, { onConflict: 'tenant_id' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrichment-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['enrichment-usage'] });
      toast.success('E-Mail-Anreicherung aktualisiert');
    },
    onError: (err) => toast.error('Fehler: ' + (err as Error).message),
  });

  const isActive = enrichSub?.is_active ?? false;
  const creditsPerMonth = enrichSub?.credits_per_month ?? 20;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">E-Mail-Anreicherung</CardTitle>
              <CardDescription>Kontaktdaten aus E-Mail-Signaturen extrahieren</CardDescription>
            </div>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={(checked) => toggleMutation.mutate(checked)}
            disabled={toggleMutation.isPending || isLoading}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{usageCount ?? 0}</span> von {creditsPerMonth} Credits diesen Monat verbraucht
            </p>
            <p className="text-xs text-muted-foreground">
              20 Credits/Monat · 5,00 € · 1 Credit pro Anreicherung
            </p>
          </div>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Aktiv' : 'Inaktiv'}
          </Badge>
        </div>
        {isActive && (
          <div className="mt-3 w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${Math.min(((usageCount ?? 0) / creditsPerMonth) * 100, 100)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
