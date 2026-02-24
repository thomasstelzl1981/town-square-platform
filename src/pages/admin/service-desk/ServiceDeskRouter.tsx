/**
 * ServiceDeskRouter — Main Zone 1 router for all Service Area modules
 * 5 Tabs: Shops (MOD-16), Fortbildung (MOD-15), Fahrzeuge (MOD-17), PV (MOD-19), Pet-Shop (MOD-05)
 */
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, BookOpen, Car, Sun, PawPrint } from 'lucide-react';
import ServiceDeskShops from './ServiceDeskShops';
import ServiceDeskFortbildung from './ServiceDeskFortbildung';
import ServiceDeskFahrzeuge from './ServiceDeskFahrzeuge';
import ServiceDeskPV from './ServiceDeskPV';
import ServiceDeskPetShop from './ServiceDeskPetShop';

const MODULE_TABS = [
  { key: 'shops', label: 'Shops', icon: ShoppingBag },
  { key: 'fortbildung', label: 'Fortbildung', icon: BookOpen },
  { key: 'fahrzeuge', label: 'Fahrzeuge', icon: Car },
  { key: 'photovoltaik', label: 'Photovoltaik', icon: Sun },
  { key: 'pet-shop', label: 'Pet-Shop', icon: PawPrint },
] as const;

export default function ServiceDeskRouter() {
  const [activeTab, setActiveTab] = useState('shops');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Service Desk</h1>
        <p className="text-sm text-muted-foreground mt-1">Produkte und Kataloge für alle Service-Module verwalten</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap gap-1">
          {MODULE_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.key} value={tab.key} className="gap-1.5 text-xs">
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="shops"><ServiceDeskShops /></TabsContent>
        <TabsContent value="fortbildung"><ServiceDeskFortbildung /></TabsContent>
        <TabsContent value="fahrzeuge"><ServiceDeskFahrzeuge /></TabsContent>
        <TabsContent value="photovoltaik"><ServiceDeskPV /></TabsContent>
        <TabsContent value="pet-shop"><ServiceDeskPetShop /></TabsContent>
      </Tabs>
    </div>
  );
}
