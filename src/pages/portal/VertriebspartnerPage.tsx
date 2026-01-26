import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Handshake, BookOpen, CheckSquare, Network, Calculator, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvestmentCalculator } from '@/components/investment';
import { CalculationResult } from '@/hooks/useInvestmentEngine';
import { PdfExportFooter, usePdfContentRef } from '@/components/pdf';

const VertriebspartnerPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lastResult, setLastResult] = useState<CalculationResult | null>(null);
  const contentRef = usePdfContentRef();

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

  return (
    <div className="space-y-6">
      <div ref={contentRef}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Vertriebspartner</h1>
            <p className="text-muted-foreground">Partner-Dashboard, Objektkatalog und Beratung</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dashboard</CardTitle>
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Übersicht & KPIs</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('katalog')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Objektkatalog</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Verfügbare Objekte</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meine Auswahl</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Ausgewählte Objekte</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Netzwerk</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Verbundene Partner</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer bg-primary/5" onClick={() => setActiveTab('beratung')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Beratung</CardTitle>
              <Calculator className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-primary font-medium">Investment Engine</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
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
