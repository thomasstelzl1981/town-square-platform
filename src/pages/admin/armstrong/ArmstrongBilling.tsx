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
import { CreditCard, TrendingUp, Users, Zap, AlertTriangle, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const USAGE_STATS = [
  { label: 'Gesamtverbrauch', value: '0', unit: 'Credits', icon: Zap, trend: null },
  { label: 'Aktive Nutzer', value: '0', unit: 'Tenants', icon: Users, trend: null },
  { label: 'Top Action', value: '—', unit: '', icon: TrendingUp, trend: null },
  { label: 'Alerts', value: '0', unit: 'offen', icon: AlertTriangle, trend: null },
];

export default function ArmstrongBilling() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Armstrong Billing
          </h1>
          <p className="text-muted-foreground mt-1">
            Verbrauchskalkulation und Credit-Tracking für KI-Aktionen
          </p>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Einstellungen
        </Button>
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
        {USAGE_STATS.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
                {stat.trend && (
                  <Badge variant={stat.trend > 0 ? 'default' : 'secondary'}>
                    {stat.trend > 0 ? '+' : ''}{stat.trend}%
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.label} {stat.unit && `(${stat.unit})`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="actions">Action-Kosten</TabsTrigger>
          <TabsTrigger value="plans">Plan-Zuordnung</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Noch keine Verbrauchsdaten</h3>
                <p className="text-muted-foreground mt-1">
                  Sobald Armstrong-Aktionen ausgeführt werden, erscheinen hier die Verbrauchsdaten.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Action-Kosten-Mapping</CardTitle>
              <CardDescription>
                Credit-Kosten pro Action-Typ festlegen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Zap className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Konfiguration erforderlich</h3>
                <p className="text-muted-foreground mt-1">
                  Weisen Sie jeder Action einen Credit-Wert zu.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Plan-Zuordnung</CardTitle>
              <CardDescription>
                Freemium-Limits vs. Paid-Kontingente definieren
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Pläne konfigurieren</h3>
                <p className="text-muted-foreground mt-1">
                  Definieren Sie Kontingente für verschiedene Subscription-Pläne.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Threshold-Alerts</CardTitle>
              <CardDescription>
                Warnungen bei hohem Verbrauch konfigurieren
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Keine Alerts konfiguriert</h3>
                <p className="text-muted-foreground mt-1">
                  Erstellen Sie Alerts, um bei hohem Verbrauch benachrichtigt zu werden.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
