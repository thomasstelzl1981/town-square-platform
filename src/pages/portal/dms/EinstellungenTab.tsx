import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HardDrive, Zap, Sparkles, Shield, Check } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { DESIGN } from '@/config/designManifest';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataEngineInfoCard } from '@/components/dms/DataEngineInfoCard';
import { StorageExtractionCard } from '@/components/dms/StorageExtractionCard';
import { PosteingangAuslesungCard } from '@/components/dms/PosteingangAuslesungCard';
import { PostserviceCard } from '@/components/dms/PostserviceCard';

interface StoragePlan {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  features: { storage_gb: number; credits_monthly: number };
  display_order: number;
}

const PLAN_ICONS: Record<string, typeof HardDrive> = {
  Free: HardDrive,
  Basic: Zap,
  Pro: Sparkles,
  Business: Shield,
};

export function EinstellungenTab() {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();

  // ── Storage Plans ──
  const { data: storagePlans = [] } = useQuery({
    queryKey: ['storage-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return (data || []) as unknown as StoragePlan[];
    },
  });

  const { data: orgData } = useQuery({
    queryKey: ['org-storage', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('storage_plan_id, storage_quota_bytes')
        .eq('id', activeTenantId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!activeTenantId,
  });

  const currentPlanId = orgData?.storage_plan_id || '00000000-0000-0000-0000-000000000001';
  const currentQuota = orgData?.storage_quota_bytes || 5368709120;
  const usedBytes = 0;
  const usedPercent = Math.round((usedBytes / currentQuota) * 100);

  const changePlanMutation = useMutation({
    mutationFn: async (plan: StoragePlan) => {
      if (!activeTenantId) throw new Error('Kein Mandant');
      const quotaBytes = plan.features.storage_gb * 1024 * 1024 * 1024;
      const { error } = await supabase
        .from('organizations')
        .update({ storage_plan_id: plan.id, storage_quota_bytes: quotaBytes })
        .eq('id', activeTenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-storage'] });
      toast.success('Speicherplan aktualisiert');
    },
    onError: () => toast.error('Planwechsel fehlgeschlagen'),
  });

  const formatGB = (bytes: number) => `${(bytes / (1024 * 1024 * 1024)).toFixed(0)} GB`;
  const formatCredits = (cents: number) => `${Math.round(cents / 25)} Credits`;

  const currentPlan = storagePlans.find(p => p.id === currentPlanId);

  return (
    <PageShell>
      <ModulePageHeader title="Intelligenz" description="KI-gesteuerte Dokumentenverarbeitung — Posteingang automatisieren und Ihren Datenraum für Armstrong aktivieren" />

      <div className={DESIGN.WIDGET_GRID.FULL}>

        {/* ═══ KACHEL 1: DATENRAUM FÜR ARMSTRONG AKTIVIEREN ═══ */}
        <StorageExtractionCard tenantId={activeTenantId} />

        {/* ═══ KACHEL 2: POSTEINGANGS-AUSLESUNG ═══ */}
        <PosteingangAuslesungCard />

        {/* ═══ KACHEL 3: SPEICHERPLATZ ═══ */}
        <Card className="glass-card flex flex-col overflow-hidden">
          <div className="p-6 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <HardDrive className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Speicherplatz</h3>
                <p className="text-xs text-muted-foreground">Aktueller Plan: {currentPlan?.name || 'Free'}</p>
              </div>
            </div>
          </div>

          <CardContent className="flex-1 p-6 space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Verwendet</span>
                <span className="font-medium text-foreground">{formatGB(usedBytes)} / {formatGB(currentQuota)}</span>
              </div>
              <Progress value={usedPercent} className="h-2" />
              <p className="text-xs text-muted-foreground">{usedPercent}% belegt</p>
            </div>

            <div className="space-y-2.5">
              {storagePlans.map((plan) => {
                const isActive = plan.id === currentPlanId;
                const PlanIcon = PLAN_ICONS[plan.name] || HardDrive;
                return (
                  <button
                    key={plan.id}
                    onClick={() => {
                      if (!isActive && plan.price_cents > 0) {
                        toast.info('Vertrag erforderlich – bitte kontaktieren Sie uns für ein Upgrade.');
                        return;
                      }
                      if (!isActive) changePlanMutation.mutate(plan);
                    }}
                    disabled={isActive || changePlanMutation.isPending}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                        : plan.price_cents > 0 ? 'border-border/50 opacity-60 cursor-not-allowed' : 'border-border/50 hover:border-primary/30 hover:bg-primary/5'
                    }`}
                  >
                    <PlanIcon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{plan.name}</span>
                        <span className="text-xs text-muted-foreground">{plan.features.storage_gb} GB</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {plan.price_cents === 0 ? 'Kostenlos' : `${formatCredits(plan.price_cents)}/Monat`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {plan.features.credits_monthly > 0 ? `${plan.features.credits_monthly} Credits` : ''}
                        </span>
                      </div>
                    </div>
                    {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">Abrechnung monatlich in Credits</p>
          </CardContent>
        </Card>

        {/* ═══ KACHEL 4: DIGITALER POSTSERVICE ═══ */}
        <PostserviceCard />

        {/* ═══ KACHEL 5: DOCUMENT INTELLIGENCE ENGINE ═══ */}
        <DataEngineInfoCard />
      </div>
    </PageShell>
  );
}
