/**
 * MOD-18 Finanzen — Tab 2: INVESTMENT
 * Person selection via PersonVisitenkarte (horizontal business cards)
 */
import { useState, useMemo } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { PersonVisitenkarte } from '@/components/shared/PersonVisitenkarte';
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
import { isDemoId } from '@/engines/demoData/engine';
import { useDemoToggles } from '@/hooks/useDemoToggles';

export default function InvestmentTab() {
  const { activeTenantId } = useAuth();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-KONTEN');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  const { data: rawPersons } = useQuery({
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

  const persons = useMemo(
    () => demoEnabled ? rawPersons : rawPersons?.filter((p: any) => !isDemoId(p.id)),
    [rawPersons, demoEnabled]
  );

  const effectivePersonId = selectedPersonId || persons?.find(p => p.is_primary)?.id || persons?.[0]?.id || null;
  const selectedPerson = useMemo(
    () => persons?.find(p => p.id === effectivePersonId),
    [persons, effectivePersonId]
  );

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

      {/* Person selection as horizontal Visitenkarten */}
      {persons && persons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {persons.map(person => {
            const isSelected = person.id === effectivePersonId;
            const isPrimary = person.is_primary;
            const personDepotKey = `depot_status_${person.id}`;
            const storedStatus = localStorage.getItem(personDepotKey);
            const hasDepot = storedStatus === 'active' || (storedStatus === null && isPrimary);

            return (
              <PersonVisitenkarte
                key={person.id}
                person={person}
                isSelected={isSelected}
                onClick={() => setSelectedPersonId(person.id)}
                badges={[
                  ...(hasDepot ? [{ label: 'Depot aktiv', variant: 'default' as const }] : [{ label: 'Kein Depot', variant: 'outline' as const }]),
                  ...(hasDepot ? [{ label: `${totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`, variant: 'secondary' as const }] : []),
                ]}
              />
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
