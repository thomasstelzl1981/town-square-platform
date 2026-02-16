/**
 * MOD-18 Finanzen — Tab 2: INVESTMENT
 * Person selection via WidgetGrid CI-Kacheln (compact system widgets)
 */
import { useState, useMemo } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { CARD, TYPOGRAPHY, DEMO_WIDGET } from '@/config/designManifest';
import { getActiveWidgetGlow, getSelectionRing } from '@/config/designManifest';
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
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<string, string> = {
  hauptperson: 'Hauptperson',
  partner: 'Partner/in',
  kind: 'Kind',
  weitere: 'Weitere',
};

const ROLE_GRADIENTS: Record<string, string> = {
  hauptperson: 'from-primary to-primary/60',
  partner: 'from-rose-400 to-rose-500/60',
  kind: 'from-amber-400 to-amber-500/60',
  weitere: 'from-muted-foreground to-muted-foreground/60',
};

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

      {/* Person selection as compact CI-Kacheln */}
      {persons && persons.length > 0 && (
        <WidgetGrid>
          {persons.map(person => {
            const isSelected = person.id === effectivePersonId;
            const isPrimary = person.is_primary;
            const isDemo = isDemoId(person.id);
            const personDepotKey = `depot_status_${person.id}`;
            const storedStatus = localStorage.getItem(personDepotKey);
            const hasDepot = storedStatus === 'active' || (storedStatus === null && isPrimary);
            const gradient = ROLE_GRADIENTS[person.role] || ROLE_GRADIENTS.weitere;
            const glowVariant = isDemo ? 'emerald' : 'primary';

            return (
              <WidgetCell key={person.id}>
                <div
                  className={cn(
                    CARD.BASE, CARD.INTERACTIVE,
                    'h-full flex flex-col items-center justify-center p-5 text-center',
                    hasDepot ? getActiveWidgetGlow(glowVariant) : '',
                    isSelected && getSelectionRing(glowVariant),
                  )}
                  onClick={() => setSelectedPersonId(person.id)}
                  role="button"
                  tabIndex={0}
                >
                  {isDemo && (
                    <Badge className={DEMO_WIDGET.BADGE + ' absolute top-3 right-3 text-[10px]'}>DEMO</Badge>
                  )}
                  <div className={cn('h-14 w-14 rounded-full bg-gradient-to-br flex items-center justify-center mb-3', gradient)}>
                    <User className="h-7 w-7 text-white" />
                  </div>
                  <h4 className={TYPOGRAPHY.CARD_TITLE}>
                    {person.first_name} {person.last_name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ROLE_LABELS[person.role] || person.role}
                  </p>
                  <Badge
                    variant={hasDepot ? 'default' : 'outline'}
                    className="mt-2 text-[10px]"
                  >
                    {hasDepot ? 'Depot aktiv' : 'Kein Depot'}
                  </Badge>
                  {hasDepot && isSelected && (
                    <p className="text-xs font-semibold mt-1">
                      {totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                    </p>
                  )}
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
