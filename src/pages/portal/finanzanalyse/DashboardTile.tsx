/**
 * MOD-18 Finanzanalyse — Dashboard
 * Aggregiert KPIs aus Immobilien (MOD-04), Finanzierungen (MOD-07), Fahrzeugen (MOD-17)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DESIGN } from '@/config/designManifest';
import { 
  TrendingUp, Building2, CreditCard, Car, 
  Wallet, PiggyBank, BarChart3, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

export default function DashboardTile() {
  const { activeTenantId } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['finanzanalyse-dashboard', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return null;

      // Immobilien
      const { data: properties } = await supabase
        .from('properties')
        .select('id, purchase_price, market_value')
        .eq('tenant_id', activeTenantId);

      // Finanzierungen  
      const { data: finRequests } = await supabase
        .from('finance_requests')
        .select('id, loan_amount_requested, status')
        .eq('tenant_id', activeTenantId);

      // Fahrzeuge
      const { data: vehicles } = await supabase
        .from('cars_vehicles')
        .select('id, make, model')
        .eq('tenant_id', activeTenantId);

      const totalPropertyValue = properties?.reduce((sum, p) => sum + (p.market_value || p.purchase_price || 0), 0) || 0;
      const totalPropertyPurchase = properties?.reduce((sum, p) => sum + (p.purchase_price || 0), 0) || 0;
      const totalLoanVolume = finRequests?.reduce((sum, f) => sum + (f.loan_amount_requested || 0), 0) || 0;
      const vehicleCount = vehicles?.length || 0;
      const netWorth = totalPropertyValue - totalLoanVolume;
      const valueChange = totalPropertyValue - totalPropertyPurchase;

      return {
        propertyCount: properties?.length || 0,
        totalPropertyValue,
        valueChange,
        totalLoanVolume,
        vehicleCount,
        netWorth,
        activeFinancings: finRequests?.filter(f => f.status === 'approved' || f.status === 'submitted').length || 0,
      };
    },
    enabled: !!activeTenantId,
  });

  const kpis = [
    { label: 'Nettovermögen', value: data ? formatCurrency(data.netWorth) : '–', icon: Wallet, trend: data && data.netWorth > 0 ? 'up' : 'down' },
    { label: 'Immobilienwert', value: data ? formatCurrency(data.totalPropertyValue) : '–', icon: Building2, sub: data ? `${data.propertyCount} Objekte` : '' },
    { label: 'Darlehensvolumen', value: data ? formatCurrency(data.totalLoanVolume) : '–', icon: CreditCard, sub: data ? `${data.activeFinancings} aktiv` : '' },
    { label: 'Wertentwicklung', value: data ? formatCurrency(data.valueChange) : '–', icon: TrendingUp, trend: data && data.valueChange >= 0 ? 'up' : 'down' },
    { label: 'Fahrzeuge', value: data ? `${data.vehicleCount}` : '–', icon: Car, sub: 'im Fuhrpark' },
    { label: 'Finanzierungen', value: data ? `${data.activeFinancings}` : '–', icon: PiggyBank, sub: 'aktiv' },
  ];

  return (
    <PageShell>
      <ModulePageHeader title="Dashboard" description="Finanzielle Kennzahlen im Überblick" />

      {isLoading ? (
        <div className={DESIGN.KPI_GRID.FULL}>
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <>
          <div className={DESIGN.KPI_GRID.FULL}>
            {kpis.map((kpi) => (
              <Card key={kpi.label} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <kpi.icon className="h-5 w-5 text-muted-foreground" />
                    {kpi.trend === 'up' && <ArrowUpRight className="h-4 w-4 text-primary" />}
                    {kpi.trend === 'down' && <ArrowDownRight className="h-4 w-4 text-destructive" />}
                  </div>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  {kpi.sub && <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {!data?.propertyCount && !data?.vehicleCount && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg font-medium">Keine Daten vorhanden</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Fügen Sie Immobilien (MOD-04) oder Fahrzeuge (MOD-17) hinzu, um Ihre Finanzanalyse zu starten.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </PageShell>
  );
}
