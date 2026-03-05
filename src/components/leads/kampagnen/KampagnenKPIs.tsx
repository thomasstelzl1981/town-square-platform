/**
 * KampagnenKPIs — KPI overview + brand filter
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, CreditCard, Users, Megaphone } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100);
}

const FILTER_BRANDS = [
  { key: 'all', label: 'Alle' }, { key: 'kaufy', label: 'Kaufy' },
  { key: 'futureroom', label: 'FutureRoom' }, { key: 'acquiary', label: 'Acquiary' },
  { key: 'project', label: 'Projekte' },
];

interface KampagnenKPIsProps {
  totalSpend: number;
  totalLeads: number;
  activeCampaigns: number;
  isLoading: boolean;
  brandFilter: string;
  onBrandFilterChange: (key: string) => void;
  showBrandFilter: boolean;
}

export function KampagnenKPIs({ totalSpend, totalLeads, activeCampaigns, isLoading, brandFilter, onBrandFilterChange, showBrandFilter }: KampagnenKPIsProps) {
  const cpl = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0;
  const kpis = [
    { label: 'Gesamtausgaben', value: formatCurrency(totalSpend), icon: CreditCard, color: 'text-primary' },
    { label: 'Leads generiert', value: `${totalLeads}`, icon: Users, color: 'text-green-600' },
    { label: 'Cost per Lead', value: totalLeads > 0 ? formatCurrency(cpl) : '–', icon: TrendingUp, color: 'text-amber-600' },
    { label: 'Aktive Kampagnen', value: `${activeCampaigns}`, icon: Megaphone, color: 'text-primary' },
  ];

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-muted-foreground" /><h2 className="text-sm font-medium">Übersicht</h2></div>
        {isLoading ? (
          <div className={DESIGN.KPI_GRID.FULL}>{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : (
          <div className={DESIGN.KPI_GRID.FULL}>
            {kpis.map(kpi => (
              <div key={kpi.label} className="rounded-xl border border-border/50 p-4 bg-muted/20">
                <div className="flex items-center gap-2 mb-1"><kpi.icon className={`h-4 w-4 ${kpi.color}`} /></div>
                <p className="text-xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            ))}
          </div>
        )}
        {showBrandFilter && (
          <div className="flex flex-wrap gap-2">
            {FILTER_BRANDS.map(b => <Badge key={b.key} variant={brandFilter === b.key ? 'default' : 'outline'} className="cursor-pointer" onClick={() => onBrandFilterChange(b.key)}>{b.label}</Badge>)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
