import { useState } from 'react';
import { useModuleTiles } from '@/hooks/useModuleTiles';
import { ModuleDashboard } from '@/components/portal/ModuleDashboard';
import { PdfExportFooter, usePdfContentRef } from '@/components/pdf';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Heart, UserCircle, Calculator, TrendingUp, Loader2 } from 'lucide-react';
import { InvestmentCalculator } from '@/components/investment';
import { CalculationResult } from '@/hooks/useInvestmentEngine';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

const InvestmentsPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('search');
  const [lastResult, setLastResult] = useState<CalculationResult | null>(null);
  const contentRef = usePdfContentRef();
  const { data, isLoading } = useModuleTiles('MOD-08');

  const handleResult = (result: CalculationResult) => {
    setLastResult(result);
    toast.success('Berechnung abgeschlossen', {
      description: `Monatliche Belastung: ${result.summary.monthlyBurden >= 0 ? '-' : '+'}${Math.abs(result.summary.monthlyBurden).toLocaleString('de-DE')} €`
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If on module dashboard, show sub-tile cards
  const isOnDashboard = location.pathname === '/portal/investments';

  if (isOnDashboard) {
    return (
      <div className="space-y-6">
        <div ref={contentRef}>
          <ModuleDashboard
            title={data?.title || 'Investment-Suche'}
            description={data?.description || 'Investmentmöglichkeiten analysieren und vergleichen'}
            subTiles={data?.sub_tiles || []}
            moduleCode="MOD-08"
          />
        </div>
        <div className="px-6">
          <PdfExportFooter 
            contentRef={contentRef} 
            documentTitle="Investment-Suche" 
            moduleName="MOD-08 Investments" 
          />
        </div>
      </div>
    );
  }

  // Otherwise show the detailed tabs view
  return (
    <div className="space-y-6 p-6">
      <div ref={contentRef}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Investment-Suche</h1>
            <p className="text-muted-foreground">Investmentmöglichkeiten analysieren und vergleichen</p>
          </div>
        </div>

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
