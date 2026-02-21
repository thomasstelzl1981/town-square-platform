/**
 * EinstellungenTab — "Intelligenz" page for DMS.
 * Vertical block layout: KI-Steuerung → Datenraum-Scan → Speicher & Kosten → Postservice
 */

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { HardDrive, Zap, Sparkles, Shield, Check, Coins, Info } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StorageExtractionCard } from '@/components/dms/StorageExtractionCard';
import { PosteingangAuslesungCard } from '@/components/dms/PosteingangAuslesungCard';
import { PostserviceCard } from '@/components/dms/PostserviceCard';
import { CloudSyncCard } from '@/components/dms/CloudSyncCard';

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
  const currentPlan = storagePlans.find(p => p.id === currentPlanId);

  return (
    <PageShell>
      <ModulePageHeader
        title="Intelligenz"
        description="KI-gesteuerte Dokumentenverarbeitung — Posteingang automatisieren und Datenraum aktivieren"
      />

      <div className="space-y-6 max-w-4xl">
        {/* ── BLOCK 1: KI-Steuerung (Posteingangs-Auslesung) ── */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            KI-Steuerung
          </h3>
          <PosteingangAuslesungCard />
        </section>

        {/* ── BLOCK 2: Datenraum-Scan ── */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Datenraum-Scan
          </h3>
          <StorageExtractionCard tenantId={activeTenantId} />
        </section>

        {/* ── BLOCK 3: Speicher & Kosten (side by side) ── */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Speicher & Kosten
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Speicherplatz */}
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <HardDrive className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Speicherplatz</p>
                    <p className="text-xs text-muted-foreground">Plan: {currentPlan?.name || 'Free'}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Verwendet</span>
                    <span className="font-medium text-foreground">{formatGB(usedBytes)} / {formatGB(currentQuota)}</span>
                  </div>
                  <Progress value={usedPercent} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground">{usedPercent}% belegt</p>
                </div>

                {storagePlans.length > 0 && (
                  <div className="space-y-1.5">
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
                          className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all text-xs ${
                            isActive
                              ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                              : plan.price_cents > 0 ? 'border-border/50 opacity-60 cursor-not-allowed' : 'border-border/50 hover:border-primary/30 hover:bg-primary/5'
                          }`}
                        >
                          <PlanIcon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-foreground">{plan.name}</span>
                              <span className="text-muted-foreground">{plan.features.storage_gb} GB</span>
                            </div>
                          </div>
                          {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Kostenmodell */}
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Coins className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Kostenmodell</p>
                    <p className="text-xs text-muted-foreground">Credit-basierte Abrechnung</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <Info className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-foreground leading-relaxed">
                    Jede KI-Analyse eines Dokuments kostet <strong>1 Credit (0,25 €)</strong>.
                    Der Scan Ihres Datenraums ist kostenlos — Sie sehen den Kostenvoranschlag,
                    bevor Sie die Extraktion freigeben.
                  </p>
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'Preis pro Dokument', value: '1 Credit = 0,25 €' },
                    { label: 'Datenraum-Scan', value: 'Kostenlos' },
                    { label: 'Beispiel: 20 Dokumente', value: '5,00 €' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs py-1.5 border-b border-border/30 last:border-0">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ── BLOCK 4: Cloud-Sync ── */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Cloud-Synchronisation
          </h3>
          <CloudSyncCard />
        </section>

        {/* ── BLOCK 5: Postservice ── */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Digitaler Postservice
          </h3>
          <PostserviceCard />
        </section>
      </div>
    </PageShell>
  );
}
