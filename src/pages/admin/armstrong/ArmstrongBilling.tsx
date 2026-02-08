/**
 * Armstrong Billing — Zone 1 Admin
 * 
 * Technische Verbrauchserfassung und Kostenkalkulation für KI-Aktionen.
 * NICHT zu verwechseln mit Zone 2 Abrechnung (kaufmännische Rechnungsstellung).
 * 
 * Unterschied:
 * - Zone 2 Abrechnung: User kauft 500 Credits → Rechnung wird erstellt
 * - Armstrong Billing: User nutzt Action → 5 Credits werden erfasst
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, TrendingUp, Users, Zap, AlertTriangle, Settings, Loader2, ArrowLeft, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';

interface BillingEvent {
  id: string;
  action_code: string;
  org_id: string;
  cost_model: string;
  cost_cents: number | null;
  credits_charged: number | null;
  created_at: string;
}

interface DailyCost {
  action_code: string;
  date: string;
  org_id: string | null;
  run_count: number;
  total_cost_cents: number;
  total_tokens: number;
  avg_duration_ms: number;
  failure_count: number;
}

function useBillingData() {
  // Fetch billing events
  const { data: billingEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['armstrong-billing-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('armstrong_billing_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as BillingEvent[];
    },
    staleTime: 30000,
  });

  // Fetch daily costs view
  const { data: dailyCosts, isLoading: costsLoading } = useQuery({
    queryKey: ['armstrong-daily-costs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_armstrong_costs_daily')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);
      if (error) {
        console.error('Daily costs view error:', error);
        return [];
      }
      return (data || []) as DailyCost[];
    },
    staleTime: 30000,
  });

  // Calculate stats
  const stats = {
    totalCredits: billingEvents?.reduce((sum, e) => sum + (e.credits_charged || 0), 0) || 0,
    totalCostCents: billingEvents?.reduce((sum, e) => sum + (e.cost_cents || 0), 0) || 0,
    uniqueOrgs: new Set(billingEvents?.map(e => e.org_id) || []).size,
    topAction: billingEvents?.length ? 
      Object.entries(billingEvents.reduce((acc, e) => {
        acc[e.action_code] = (acc[e.action_code] || 0) + (e.credits_charged || 0);
        return acc;
      }, {} as Record<string, number>))
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '—' 
      : '—',
  };

  return {
    billingEvents: billingEvents || [],
    dailyCosts: dailyCosts || [],
    stats,
    isLoading: eventsLoading || costsLoading,
  };
}

export default function ArmstrongBilling() {
  const { billingEvents, dailyCosts, stats, isLoading } = useBillingData();

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/armstrong">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" />
              Armstrong Billing
            </h1>
            <p className="text-muted-foreground mt-1">
              Verbrauchskalkulation und Credit-Tracking für KI-Aktionen
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Einstellungen
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Technische Verbrauchserfassung</p>
              <p className="text-sm text-muted-foreground">
                Hier wird erfasst, wie viele Credits durch KI-Aktionen verbraucht werden.
                Die kaufmännische Abrechnung (Rechnungsstellung) erfolgt in Zone 2 unter Stammdaten.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCredits.toLocaleString('de-DE')}</div>
            <p className="text-xs text-muted-foreground">Gesamtverbrauch (Credits)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalCostCents)}</div>
            <p className="text-xs text-muted-foreground">Gesamtkosten</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueOrgs}</div>
            <p className="text-xs text-muted-foreground">Aktive Tenants</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-xs truncate">{stats.topAction}</div>
            <p className="text-xs text-muted-foreground">Top Action</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="events">Billing Events</TabsTrigger>
          <TabsTrigger value="daily">Tagesansicht</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Verbrauchsübersicht</CardTitle>
              <CardDescription>
                Aggregierte Credit-Nutzung pro Tenant und Zeitraum
              </CardDescription>
            </CardHeader>
            <CardContent>
              {billingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">Noch keine Verbrauchsdaten</h3>
                  <p className="text-muted-foreground mt-1">
                    Sobald Armstrong-Aktionen ausgeführt werden, erscheinen hier die Verbrauchsdaten.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-sm text-muted-foreground">Free-Tier</div>
                      <div className="text-xl font-bold">
                        {billingEvents.filter(e => e.cost_model === 'free').length}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/10">
                      <div className="text-sm text-muted-foreground">Metered</div>
                      <div className="text-xl font-bold">
                        {billingEvents.filter(e => e.cost_model === 'metered').length}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-status-warning/10">
                      <div className="text-sm text-muted-foreground">Premium</div>
                      <div className="text-xl font-bold">
                        {billingEvents.filter(e => e.cost_model === 'premium').length}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Billing Events</CardTitle>
              <CardDescription>
                Letzte 100 Billing-Ereignisse
              </CardDescription>
            </CardHeader>
            <CardContent>
              {billingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Zap className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">Keine Events</h3>
                  <p className="text-muted-foreground mt-1">
                    Noch keine Billing Events erfasst.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Zeitpunkt</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Modell</TableHead>
                        <TableHead className="text-right">Credits</TableHead>
                        <TableHead className="text-right">Kosten</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billingEvents.slice(0, 20).map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(event.created_at).toLocaleString('de-DE')}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{event.action_code}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              event.cost_model === 'free' ? 'bg-muted' :
                              event.cost_model === 'metered' ? 'bg-primary/10' : 'bg-status-warning/10'
                            }>
                              {event.cost_model}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{event.credits_charged || 0}</TableCell>
                          <TableCell className="text-right">{formatCurrency(event.cost_cents || 0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Tagesansicht</CardTitle>
              <CardDescription>
                Aggregierte Kosten pro Tag und Action
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailyCosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">Keine Tagesdaten</h3>
                  <p className="text-muted-foreground mt-1">
                    Die Tagesansicht zeigt aggregierte Daten aus den Action Runs.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead className="text-right">Runs</TableHead>
                        <TableHead className="text-right">Tokens</TableHead>
                        <TableHead className="text-right">Ø ms</TableHead>
                        <TableHead className="text-right">Fehler</TableHead>
                        <TableHead className="text-right">Kosten</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyCosts.map((cost, idx) => (
                        <TableRow key={`${cost.date}-${cost.action_code}-${idx}`}>
                          <TableCell>{cost.date}</TableCell>
                          <TableCell className="font-mono text-xs">{cost.action_code}</TableCell>
                          <TableCell className="text-right">{cost.run_count}</TableCell>
                          <TableCell className="text-right">{cost.total_tokens?.toLocaleString('de-DE') || 0}</TableCell>
                          <TableCell className="text-right">{cost.avg_duration_ms || 0}</TableCell>
                          <TableCell className="text-right">
                            {cost.failure_count > 0 ? (
                              <Badge variant="destructive" className="text-xs">{cost.failure_count}</Badge>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(cost.total_cost_cents || 0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
