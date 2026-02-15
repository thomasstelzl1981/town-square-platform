/**
 * MOD-18 Finanzen — Tab 2: INVESTMENT
 * Person-widget header + state machine: none → Onboarding Wizard, active → Demo Portfolio
 * v2 — per-person depot state
 */
import { useState, useMemo } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { useDemoDepot } from '@/hooks/useDemoDepot';
import { DepotOnboardingWizard } from '@/components/finanzanalyse/depot/DepotOnboardingWizard';
import { DepotPortfolio } from '@/components/finanzanalyse/depot/DepotPortfolio';
import { DepotPositionen } from '@/components/finanzanalyse/depot/DepotPositionen';
import { DepotPerformanceChart } from '@/components/finanzanalyse/depot/DepotPerformanceChart';
import { DepotTransaktionen } from '@/components/finanzanalyse/depot/DepotTransaktionen';
import { DepotSteuerReport } from '@/components/finanzanalyse/depot/DepotSteuerReport';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { getActiveWidgetGlow } from '@/config/designManifest';
import { User, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InvestmentTab() {
  const { activeTenantId } = useAuth();
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  // Fetch household persons
  const { data: persons } = useQuery({
    queryKey: ['household_persons', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('household_persons')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('sort_order');
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // Auto-select primary person
  const effectivePersonId = selectedPersonId || persons?.find(p => p.is_primary)?.id || persons?.[0]?.id || null;
  const selectedPerson = useMemo(
    () => persons?.find(p => p.id === effectivePersonId),
    [persons, effectivePersonId]
  );

  // Depot hook scoped to selected person
  const { status, setStatus, resetDepot, totalValue, dailyChange } = useDemoDepot(
    effectivePersonId ?? undefined,
    selectedPerson?.is_primary
  );

  return (
    <PageShell>
      <ModulePageHeader
        title="Investment"
        description="Depot-Verwaltung über Upvest — Wertpapiere, ETFs und mehr"
        actions={
          status === 'active' ? (
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">Depot aktiv</Badge>
          ) : undefined
        }
      />

      {/* Person widgets */}
      {persons && persons.length > 0 && (
        <WidgetGrid className="mb-6">
          {persons.map(person => {
            const isSelected = person.id === effectivePersonId;
            const isPrimary = person.is_primary;
            // Check if this person has an active depot (only primary in demo)
            const personDepotKey = `depot_status_${person.id}`;
            const storedStatus = localStorage.getItem(personDepotKey);
            const hasDepot = storedStatus === 'active' || (storedStatus === null && isPrimary);

            return (
              <WidgetCell key={person.id}>
                <div
                  onClick={() => setSelectedPersonId(person.id)}
                  className={cn(
                    'glass-card h-full cursor-pointer transition-all flex flex-col items-center justify-center text-center p-4 gap-2',
                    hasDepot && getActiveWidgetGlow('primary'),
                    isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:ring-1 hover:ring-primary/40'
                  )}
                >
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    hasDepot ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  )}>
                    {hasDepot ? <TrendingUp className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{person.first_name} {person.last_name}</p>
                    {hasDepot ? (
                      <p className="text-xs text-emerald-500 font-medium">
                        {totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Kein Depot</p>
                    )}
                  </div>
                </div>
              </WidgetCell>
            );
          })}
        </WidgetGrid>
      )}

      {/* Content based on selected person's depot status */}
      {status === 'none' && (
        <DepotOnboardingWizard onComplete={() => setStatus('active')} />
      )}

      {status === 'active' && (
        <div className="space-y-4 md:space-y-6">
          <DepotPortfolio totalValue={totalValue} dailyChange={dailyChange} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <DepotPerformanceChart />
            <DepotSteuerReport />
          </div>

          <DepotPositionen />
          <DepotTransaktionen />

          {/* Dev reset */}
          <div className="text-center pt-4">
            <button onClick={resetDepot} className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors underline">
              Depot zurücksetzen (Demo)
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
