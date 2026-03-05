/**
 * R-8: KPI stat cards for portfolio
 */
import { StatCard } from '@/components/ui/stat-card';
import { Building2, TrendingUp, Wallet, PiggyBank } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import { formatCurrency } from './portfolioHelpers';
import type { PortfolioTotals } from './portfolioTypes';

interface PortfolioKPIGridProps {
  totals: PortfolioTotals | null;
  hasData: boolean;
}

export function PortfolioKPIGrid({ totals, hasData }: PortfolioKPIGridProps) {
  return (
    <div className={DESIGN.KPI_GRID.FULL}>
      <StatCard title="Einheiten" value={hasData ? (totals?.unitCount.toString() || '0') : '0'} icon={Building2} />
      <StatCard title="Verkehrswert" value={hasData && totals?.totalValue ? formatCurrency(totals.totalValue) : '–'} icon={TrendingUp} />
      <StatCard title="Restschuld" value={hasData && totals?.totalDebt ? formatCurrency(totals.totalDebt) : '–'} icon={Wallet} />
      <StatCard title="Nettovermögen" value={hasData && totals?.netWealth ? formatCurrency(totals.netWealth) : '–'} icon={PiggyBank} />
    </div>
  );
}
