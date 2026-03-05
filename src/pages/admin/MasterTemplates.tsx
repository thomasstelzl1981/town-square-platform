/**
 * MasterTemplates — Orchestrator for investment engine configuration
 * R-18 Refactoring: 585 → ~140 lines
 */
import { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, RefreshCw, Percent, Calculator, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { PdfExportFooter } from '@/components/pdf';
import { DESIGN } from '@/config/designManifest';
import {
  MasterDataGrid,
  InterestRateTable, type InterestRateRow,
  CalculationParamsTab,
  AncillaryCostsTab,
} from '@/components/admin/templates';

const defaultInterestRates: InterestRateRow[] = [
  { fixedPeriod: 5, ltv60: 3.60, ltv80: 3.70, ltv90: 3.90, ltv100: 4.20 },
  { fixedPeriod: 10, ltv60: 3.70, ltv80: 3.80, ltv90: 4.00, ltv100: 4.30 },
  { fixedPeriod: 15, ltv60: 4.00, ltv80: 4.00, ltv90: 4.20, ltv100: 4.50 },
  { fixedPeriod: 20, ltv60: 4.10, ltv80: 4.20, ltv90: 4.40, ltv100: 4.70 },
];

export default function MasterTemplates() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [interestRates, setInterestRates] = useState<InterestRateRow[]>(defaultInterestRates);
  const [defaultAfaRate, setDefaultAfaRate] = useState(2.0);
  const [maintenanceCost, setMaintenanceCost] = useState(0.40);
  const [lastUpdated] = useState(new Date().toLocaleDateString('de-DE'));

  const handleRateChange = (index: number, field: keyof InterestRateRow, value: string) => {
    setInterestRates(prev => prev.map((row, i) => i === index ? { ...row, [field]: parseFloat(value) || 0 } : row));
  };

  const handleSave = () => toast.success('Master-Vorlagen gespeichert', { description: 'Die Änderungen wurden erfolgreich übernommen.' });
  const handleReset = () => { setInterestRates(defaultInterestRates); setDefaultAfaRate(2.0); setMaintenanceCost(0.40); toast.info('Auf Standardwerte zurückgesetzt'); };

  return (
    <div className="space-y-6" ref={contentRef}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className={DESIGN.TYPOGRAPHY.PAGE_TITLE}>Master-Vorlagen</h1>
          <p className="text-muted-foreground">Zentrale Konfiguration für die Investment Engine</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}><RefreshCw className="mr-2 h-4 w-4" />Zurücksetzen</Button>
          <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" />Speichern</Button>
        </div>
      </div>

      <MasterDataGrid />

      <Tabs defaultValue="interest" className="space-y-4">
        <TabsList>
          <TabsTrigger value="interest" className="gap-2"><Percent className="h-4 w-4" />Zinstabelle</TabsTrigger>
          <TabsTrigger value="calculation" className="gap-2"><Calculator className="h-4 w-4" />Berechnungsparameter</TabsTrigger>
          <TabsTrigger value="costs" className="gap-2"><Building2 className="h-4 w-4" />Nebenkosten</TabsTrigger>
        </TabsList>
        <TabsContent value="interest"><InterestRateTable rates={interestRates} lastUpdated={lastUpdated} onRateChange={handleRateChange} /></TabsContent>
        <TabsContent value="calculation"><CalculationParamsTab defaultAfaRate={defaultAfaRate} onAfaRateChange={setDefaultAfaRate} /></TabsContent>
        <TabsContent value="costs"><AncillaryCostsTab maintenanceCost={maintenanceCost} onMaintenanceCostChange={setMaintenanceCost} /></TabsContent>
      </Tabs>

      <Card>
        <CardHeader><CardTitle>Verwendung</CardTitle></CardHeader>
        <CardContent>
          <div className={DESIGN.WIDGET_GRID.FULL}>
            <div className="p-4 border rounded-lg"><h4 className="font-medium mb-2">Zone 3 – Kaufy</h4><p className="text-sm text-muted-foreground">Investment-Suche und Beratungsrechner auf der öffentlichen Website</p></div>
            <div className="p-4 border rounded-lg"><h4 className="font-medium mb-2">Zone 2 – Portal</h4><p className="text-sm text-muted-foreground">MOD-04 Exposé, MOD-08 Investments, MOD-09 Beratung</p></div>
            <div className="p-4 border rounded-lg"><h4 className="font-medium mb-2">PDF-Export</h4><p className="text-sm text-muted-foreground">Alle Berechnungen sind als PDF exportierbar (MOD-03 DMS)</p></div>
          </div>
        </CardContent>
      </Card>

      <PdfExportFooter contentRef={contentRef} documentTitle="Master-Vorlagen" subtitle={`Investment Engine Konfiguration – Stand: ${lastUpdated}`} moduleName="Zone 1 Admin" />
    </div>
  );
}
