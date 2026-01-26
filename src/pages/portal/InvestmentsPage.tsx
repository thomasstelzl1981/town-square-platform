import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Heart, UserCircle, Calculator, TrendingUp } from 'lucide-react';
import { InvestmentCalculator } from '@/components/investment';
import { CalculationResult } from '@/hooks/useInvestmentEngine';
import { toast } from 'sonner';
import { PdfExportFooter, usePdfContentRef } from '@/components/pdf';

const InvestmentsPage = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [lastResult, setLastResult] = useState<CalculationResult | null>(null);
  const contentRef = usePdfContentRef();

  const handleResult = (result: CalculationResult) => {
    setLastResult(result);
    toast.success('Berechnung abgeschlossen', {
      description: `Monatliche Belastung: ${result.summary.monthlyBurden >= 0 ? '-' : '+'}${Math.abs(result.summary.monthlyBurden).toLocaleString('de-DE')} €`
    });
  };

  return (
    <div className="space-y-6">
      <div ref={contentRef}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Investment-Suche</h1>
            <p className="text-muted-foreground">Investmentmöglichkeiten analysieren und vergleichen</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('search')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suche</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Gespeicherte Suchen</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favoriten</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Gemerkte Objekte</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile</CardTitle>
              <UserCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Investorenprofile</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('calculator')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rechner</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground">Investment Engine aktiv</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="no-print">
            <TabsTrigger value="search">Objektsuche</TabsTrigger>
            <TabsTrigger value="calculator">Rechner</TabsTrigger>
            <TabsTrigger value="favorites">Favoriten</TabsTrigger>
            <TabsTrigger value="profiles">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Objektsuche</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Durchsuchen Sie verfügbare Objekte aus verschiedenen Quellen: 
                  SoT-Verkauf, Kaufy Marketplace und externe Anbieter.
                </p>
                <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Objektsuche wird mit Listings verbunden...</p>
                  <p className="text-sm">MOD-06 Verkauf → Listings API</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calculator" className="mt-6">
            <InvestmentCalculator onResult={handleResult} />
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Favoriten</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine Favoriten vorhanden</p>
                  <p className="text-sm">Favoriten aus Kaufy werden hier synchronisiert</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profiles" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Investorenprofile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                  <UserCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine Profile angelegt</p>
                  <p className="text-sm">Erstellen Sie Profile für verschiedene Investitionsszenarien</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <PdfExportFooter 
        contentRef={contentRef} 
        documentTitle={activeTab === 'calculator' ? 'Investment-Simulation' : 'Investment-Suche'} 
        moduleName="MOD-08 Investments" 
      />
    </div>
  );
};

export default InvestmentsPage;
