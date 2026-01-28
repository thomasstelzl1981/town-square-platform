/**
 * MOD-07 Finanzierung - Kalkulation & Objekt Tab
 * 
 * Objekt wählen (MOD-04/MOD-08/custom) + Investment-Rechner + Konditionen (read-only)
 */

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, Building2, Home, FileText, 
  TrendingUp, ArrowRight, Loader2 
} from 'lucide-react';
import { useFinanceRequests } from '@/hooks/useFinanceRequest';
import { InvestmentCalculator } from '@/components/investment';

export default function KalkulationTab() {
  const { data: requests, isLoading } = useFinanceRequests();
  const [activeTab, setActiveTab] = React.useState('object');

  // Get the most recent draft request
  const activeRequest = React.useMemo(() => {
    if (!requests) return null;
    return requests.find(r => r.status === 'draft');
  }, [requests]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!activeRequest) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Keine aktive Finanzierung</h3>
          <p className="text-muted-foreground mb-6">
            Starten Sie zuerst eine neue Finanzierung, um die Kalkulation zu nutzen.
          </p>
          <Button onClick={() => window.location.href = '/portal/finanzierung/neu'}>
            Neue Finanzierung starten
          </Button>
        </CardContent>
      </Card>
    );
  }

  const objectSourceLabel = {
    'mod04_property': 'Bestandsobjekt',
    'mod08_favorite': 'Favorit',
    'custom': 'Eigenes Objekt',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Kalkulation & Objekt
          </h2>
          <p className="text-muted-foreground">
            Wählen Sie ein Objekt und berechnen Sie Ihre Finanzierung
          </p>
        </div>
        <Badge variant="outline">
          {activeRequest.public_id || 'Entwurf'}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="object" className="gap-2">
            <Building2 className="h-4 w-4" />
            Objekt
          </TabsTrigger>
          <TabsTrigger value="calculator" className="gap-2">
            <Calculator className="h-4 w-4" />
            Kalkulation
          </TabsTrigger>
          <TabsTrigger value="conditions" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Konditionen
          </TabsTrigger>
        </TabsList>

        {/* Object Selection */}
        <TabsContent value="object" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Objektauswahl
              </CardTitle>
              <CardDescription>
                Objektquelle: {objectSourceLabel[activeRequest.object_source as keyof typeof objectSourceLabel] || 'Nicht festgelegt'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeRequest.object_source === 'mod04_property' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Wählen Sie ein Objekt aus Ihrem Portfolio:
                  </p>
                  {/* TODO: Property selector from MOD-04 */}
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Home className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Objektauswahl wird geladen...
                    </p>
                  </div>
                </div>
              )}

              {activeRequest.object_source === 'mod08_favorite' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Wählen Sie einen Favoriten aus dem Marktplatz:
                  </p>
                  {/* TODO: Favorites selector from MOD-08 */}
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Home className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Favoriten werden geladen...
                    </p>
                  </div>
                </div>
              )}

              {activeRequest.object_source === 'custom' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Geben Sie die Objektdaten manuell ein:
                  </p>
                  {/* TODO: Custom object form */}
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Objektformular wird geladen...
                    </p>
                  </div>
                </div>
              )}

              {!activeRequest.object_source && (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Keine Objektquelle festgelegt
                  </p>
                  <Button variant="outline" onClick={() => window.location.href = '/portal/finanzierung/neu'}>
                    Objektquelle wählen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculator */}
        <TabsContent value="calculator" className="mt-4">
          <InvestmentCalculator />
        </TabsContent>

        {/* Conditions (read-only from Zone-1 master data) */}
        <TabsContent value="conditions" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Beispielkonditionen
              </CardTitle>
              <CardDescription>
                Aktuelle Marktkonditionen (nur zur Orientierung, unverbindlich)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Sollzins (10 Jahre)</p>
                  <p className="text-2xl font-bold">3,45 %</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Effektivzins</p>
                  <p className="text-2xl font-bold">3,52 %</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Tilgung (empfohlen)</p>
                  <p className="text-2xl font-bold">2,0 %</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Stand: Januar 2026. Die tatsächlichen Konditionen können abweichen 
                und werden von der Bank individuell berechnet.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
