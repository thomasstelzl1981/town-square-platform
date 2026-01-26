import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, AlertTriangle, TrendingUp, Euro, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const DashboardTab = () => {
  const { data: stats } = useQuery({
    queryKey: ['msv-dashboard-stats'],
    queryFn: async () => {
      const [unitsRes, leasesRes, paymentsRes] = await Promise.all([
        supabase.from('units').select('id', { count: 'exact' }),
        supabase.from('leases').select('id, status, monthly_rent'),
        supabase.from('rent_payments').select('id, status, amount')
      ]);
      
      const activeLeases = leasesRes.data?.filter(l => l.status === 'active') || [];
      const totalRent = activeLeases.reduce((sum, l) => sum + (l.monthly_rent || 0), 0);
      const overduePayments = paymentsRes.data?.filter(p => p.status === 'overdue') || [];
      
      return {
        totalUnits: unitsRes.count || 0,
        activeLeases: activeLeases.length,
        vacantUnits: (unitsRes.count || 0) - activeLeases.length,
        monthlyRent: totalRent,
        overdueCount: overduePayments.length,
        overdueAmount: overduePayments.reduce((sum, p) => sum + (p.amount || 0), 0)
      };
    }
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Einheiten gesamt</p>
              <p className="text-2xl font-semibold mt-1">{stats?.totalUnits || 0}</p>
            </div>
            <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Aktive Mietverträge</p>
              <p className="text-2xl font-semibold mt-1">{stats?.activeLeases || 0}</p>
            </div>
            <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </div>
        </Card>

        <Card className={cn("p-4", stats?.vacantUnits ? 'border-status-warning/30' : '')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Leerstand</p>
              <p className="text-2xl font-semibold mt-1">{stats?.vacantUnits || 0}</p>
            </div>
            <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-status-warning/10">
              <Building2 className="h-4 w-4 text-status-warning" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Monatsmiete</p>
              <p className="text-2xl font-semibold mt-1">{(stats?.monthlyRent || 0).toLocaleString('de-DE')} €</p>
            </div>
            <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary/10">
              <Euro className="h-4 w-4 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Alerts */}
      {(stats?.overdueCount || 0) > 0 && (
        <Card className="border-status-error/30 bg-status-error/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-status-error">
              <AlertTriangle className="h-4 w-4" />
              Offene Zahlungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              <span className="font-semibold">{stats?.overdueCount}</span> überfällige Zahlungen 
              im Gesamtwert von <span className="font-semibold">{stats?.overdueAmount?.toLocaleString('de-DE')} €</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Status */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Mietentwicklung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(stats?.monthlyRent || 0).toLocaleString('de-DE')} €</p>
            <p className="text-xs text-muted-foreground">Monatliche Mieteinnahmen (Soll)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Automatisierung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Mahnwesen</span>
              <Badge variant="outline">Premium</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Mietberichte</span>
              <Badge variant="outline">Premium</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Kontoanbindung</span>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardTab;
