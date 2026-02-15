/**
 * MOD-18 Finanzen — Tab 2: INVESTMENT
 * State machine: none → Onboarding Wizard, active → Demo Portfolio
 */
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { useDemoDepot } from '@/hooks/useDemoDepot';
import { DepotOnboardingWizard } from '@/components/finanzanalyse/depot/DepotOnboardingWizard';
import { DepotPortfolio } from '@/components/finanzanalyse/depot/DepotPortfolio';
import { DepotPositionen } from '@/components/finanzanalyse/depot/DepotPositionen';
import { DepotPerformanceChart } from '@/components/finanzanalyse/depot/DepotPerformanceChart';
import { DepotTransaktionen } from '@/components/finanzanalyse/depot/DepotTransaktionen';
import { DepotSteuerReport } from '@/components/finanzanalyse/depot/DepotSteuerReport';
import { Badge } from '@/components/ui/badge';

export default function InvestmentTab() {
  const { status, setStatus, resetDepot, totalValue, dailyChange } = useDemoDepot();

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
