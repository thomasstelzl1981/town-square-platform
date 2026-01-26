import { useState } from 'react';
import { useModuleTiles } from '@/hooks/useModuleTiles';
import { ModuleDashboard } from '@/components/portal/ModuleDashboard';
import { PdfExportFooter, usePdfContentRef } from '@/components/pdf';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Handshake, BookOpen, Calculator, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvestmentCalculator } from '@/components/investment';
import { CalculationResult } from '@/hooks/useInvestmentEngine';
import { useLocation } from 'react-router-dom';

const VertriebspartnerPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lastResult, setLastResult] = useState<CalculationResult | null>(null);
  const contentRef = usePdfContentRef();
  const { data, isLoading } = useModuleTiles('MOD-09');

  const handleResult = (result: CalculationResult) => {
    setLastResult(result);
  };

  const getDocumentTitle = () => {
    switch (activeTab) {
      case 'beratung': return 'Beratungsprotokoll';
      case 'katalog': return 'Objektkatalog';
      case 'pipeline': return 'Verkaufs-Pipeline';
      default: return 'Partner-Dashboard';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If on module dashboard, show sub-tile cards
  const isOnDashboard = location.pathname === '/portal/vertriebspartner';

  if (isOnDashboard) {
    return (
      <div className="space-y-6">
        <div ref={contentRef}>
          <ModuleDashboard
            title={data?.title || 'Vertriebspartner'}
            description={data?.description || 'Partner-Dashboard, Objektkatalog und Beratung'}
            subTiles={data?.sub_tiles || []}
            moduleCode="MOD-09"
          />
        </div>
        <div className="px-6">
          <PdfExportFooter 
            contentRef={contentRef} 
            documentTitle="Partner-Dashboard" 
            moduleName="MOD-09 Vertriebspartner" 
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
            <h1 className="text-3xl font-bold">Vertriebspartner</h1>
            <p className="text-muted-foreground">Partner-Dashboard, Objektkatalog und Beratung</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="no-print">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="katalog">Objektkatalog</TabsTrigger>
            <TabsTrigger value="beratung">Beratung</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Partner-KPIs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <p className="text-3xl font-bold">0</p>
                      <p className="text-sm text-muted-foreground">Objekte verkauft</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <p className="text-3xl font-bold">0 €</p>
                      <p className="text-sm text-muted-foreground">Provision (offen)</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <p className="text-3xl font-bold">0</p>
                      <p className="text-sm text-muted-foreground">Leads erhalten</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <p className="text-3xl font-bold">0%</p>
                      <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Schnellzugriff</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start no-print" onClick={() => setActiveTab('katalog')}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Objektkatalog öffnen
                  </Button>
                  <Button variant="outline" className="w-full justify-start no-print" onClick={() => setActiveTab('beratung')}>
                    <Calculator className="mr-2 h-4 w-4" />
                    Neuen Kunden beraten
                  </Button>
                  <Button variant="outline" className="w-full justify-start no-print">
                    <FileText className="mr-2 h-4 w-4" />
                    Provisionsübersicht
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="katalog" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Objektkatalog</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine Objekte im Katalog</p>
                  <p className="text-sm">Objekte werden aus MOD-06 Verkauf synchronisiert</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="beratung" className="mt-6">
            <InvestmentCalculator onResult={handleResult} />
          </TabsContent>

          <TabsContent value="pipeline" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Verkaufs-Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                  <Handshake className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine aktiven Deals</p>
                  <p className="text-sm">Verbunden mit MOD-10 Leads</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <PdfExportFooter 
        contentRef={contentRef} 
        documentTitle={getDocumentTitle()} 
        moduleName="MOD-09 Vertriebspartner" 
      />
    </div>
  );
};

export default VertriebspartnerPage;
