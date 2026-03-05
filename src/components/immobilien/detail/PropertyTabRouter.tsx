/**
 * PropertyTabRouter — Tab navigation for PropertyDetailPage
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Calculator, TrendingUp, Banknote, Receipt, AlertTriangle } from 'lucide-react';
import { ExposeTab } from '@/components/portfolio/ExposeTab';
import { VerkaufsauftragTab } from '@/components/portfolio/VerkaufsauftragTab';
import { TenancyTab } from '@/components/portfolio/TenancyTab';
import { GeldeingangTab } from '@/components/portfolio/GeldeingangTab';
import { DatenraumTab } from '@/components/portfolio/DatenraumTab';
import { NKAbrechnungTab } from '@/components/portfolio/NKAbrechnungTab';
import { EditableUnitDossierView } from '@/components/immobilienakte';
import { InventoryInvestmentSimulation } from '@/components/immobilienakte/InventoryInvestmentSimulation';
import { PropertyValuationTab } from './PropertyValuationTab';

interface PropertyTabRouterProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  property: any;
  financing: any[];
  unit: any;
  dossierData: any;
  simulationData: any;
  onPropertyUpdate: () => void;
}

export function PropertyTabRouter({ activeTab, onTabChange, property, financing, unit, dossierData, simulationData, onPropertyUpdate }: PropertyTabRouterProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
      <TabsList className="no-print">
        <TabsTrigger value="akte" className="flex items-center gap-1"><FileText className="h-4 w-4" />Akte</TabsTrigger>
        <TabsTrigger value="simulation" className="flex items-center gap-1"><Calculator className="h-4 w-4" />Simulation</TabsTrigger>
        <TabsTrigger value="expose">Exposé</TabsTrigger>
        <TabsTrigger value="verkaufsauftrag">Verkaufsauftrag</TabsTrigger>
        <TabsTrigger value="bewertung" className="flex items-center gap-1"><TrendingUp className="h-4 w-4" />Bewertung</TabsTrigger>
        <TabsTrigger value="tenancy">Mietverhältnis</TabsTrigger>
        <TabsTrigger value="geldeingang" className="flex items-center gap-1"><Banknote className="h-4 w-4" />Zahlungen</TabsTrigger>
        <TabsTrigger value="nkabrechnung" className="flex items-center gap-1"><Receipt className="h-4 w-4" />NK-Abrechnung</TabsTrigger>
        <TabsTrigger value="datenraum">Datenraum</TabsTrigger>
      </TabsList>

      <TabsContent value="akte">
        {dossierData ? <EditableUnitDossierView data={dossierData} /> : (
          <div className="flex items-center justify-center py-12 text-muted-foreground"><p>Keine Akten-Daten verfügbar. Bitte ergänzen Sie die Stammdaten.</p></div>
        )}
      </TabsContent>
      <TabsContent value="simulation"><InventoryInvestmentSimulation data={simulationData} /></TabsContent>
      <TabsContent value="expose"><ExposeTab property={property} financing={financing} unit={unit} dossierData={dossierData} /></TabsContent>
      <TabsContent value="verkaufsauftrag">
        <VerkaufsauftragTab propertyId={property.id} tenantId={property.tenant_id} unitId={unit?.id} askingPrice={property.market_value || undefined} propertyAddress={property.address} propertyCity={property.city} onUpdate={onPropertyUpdate} />
      </TabsContent>
      <TabsContent value="bewertung"><PropertyValuationTab propertyId={property.id} tenantId={property.tenant_id} /></TabsContent>
      <TabsContent value="tenancy"><TenancyTab propertyId={property.id} tenantId={property.tenant_id} unitId={unit?.id || ''} /></TabsContent>
      <TabsContent value="geldeingang"><GeldeingangTab propertyId={property.id} tenantId={property.tenant_id} unitId={unit?.id || ''} /></TabsContent>
      <TabsContent value="datenraum"><DatenraumTab propertyId={property.id} tenantId={property.tenant_id} propertyCode={property.code || undefined} /></TabsContent>
      <TabsContent value="nkabrechnung">
        {unit?.id ? (
          <NKAbrechnungTab propertyId={property.id} tenantId={property.tenant_id} unitId={unit.id} />
        ) : (
          <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>Keine Einheit für diese Immobilie vorhanden. Bitte legen Sie zuerst eine Einheit an.</AlertDescription></Alert>
        )}
      </TabsContent>
    </Tabs>
  );
}
