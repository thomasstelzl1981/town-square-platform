/**
 * MOD-18 Finanzen — Tab 2: INVESTMENT
 * Person-widget header + state machine: none → Onboarding Wizard, active → Demo Portfolio
 * v3 — RecordCard person widgets (homogenized with Abo-Standard)
 */
import { useState, useMemo } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { RecordCard } from '@/components/shared/RecordCard';
import { RECORD_CARD } from '@/config/designManifest';
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

      {/* Person widgets as RecordCards */}
      {persons && persons.length > 0 && (
        <div className={RECORD_CARD.GRID}>
          {persons.map(person => {
            const isSelected = person.id === effectivePersonId;
            const isPrimary = person.is_primary;
            const personDepotKey = `depot_status_${person.id}`;
            const storedStatus = localStorage.getItem(personDepotKey);
            const hasDepot = storedStatus === 'active' || (storedStatus === null && isPrimary);

            return (
              <RecordCard
                key={person.id}
                id={person.id}
                entityType="person"
                isOpen={false}
                onToggle={() => setSelectedPersonId(person.id)}
                glowVariant={hasDepot ? 'emerald' : undefined}
                title={`${person.first_name} ${person.last_name}`}
                subtitle={hasDepot ? 'Depot aktiv' : 'Kein Depot'}
                badges={hasDepot ? [{ label: 'Aktiv', variant: 'default' as const }] : []}
                summary={hasDepot ? [
                  { label: 'Depotwert', value: `${totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €` },
                ] : []}
                className={cn(isSelected && 'ring-2 ring-primary')}
              >
                {/* No open state — person selection only */}
                <div />
              </RecordCard>
            );
          })}
        </div>
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
