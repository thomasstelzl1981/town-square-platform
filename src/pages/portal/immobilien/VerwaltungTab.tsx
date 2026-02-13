/**
 * VerwaltungTab — Consolidated property management one-pager (formerly MOD-05 MSV)
 * 
 * Integrates: ObjekteTab (units/leases), MieteingangTab (rent tracking), VermietungTab (listings)
 * Following the Golden Path One-Pager pattern (like FM MOD-11, AM MOD-12)
 */
import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Euro, Users, Settings } from 'lucide-react';

// Re-use existing MSV tab components directly
import ObjekteTab from '@/pages/portal/msv/ObjekteTab';
import MieteingangTab from '@/pages/portal/msv/MieteingangTab';
import VermietungTab from '@/pages/portal/msv/VermietungTab';
import EinstellungenTab from '@/pages/portal/msv/EinstellungenTab';

export function VerwaltungTab() {
  const [activeTab, setActiveTab] = useState('objekte');

  return (
    <PageShell>
      <ModulePageHeader
        title="Verwaltung"
        description="Mietverwaltung — Objekte, Mieteingang, Vermietung und Einstellungen in einem Überblick."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="objekte" className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Objekte</span>
          </TabsTrigger>
          <TabsTrigger value="mieteingang" className="flex items-center gap-1.5">
            <Euro className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mieteingang</span>
          </TabsTrigger>
          <TabsTrigger value="vermietung" className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Vermietung</span>
          </TabsTrigger>
          <TabsTrigger value="einstellungen" className="flex items-center gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Einstellungen</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="objekte" className="mt-4">
          <ObjekteTab />
        </TabsContent>
        <TabsContent value="mieteingang" className="mt-4">
          <MieteingangTab />
        </TabsContent>
        <TabsContent value="vermietung" className="mt-4">
          <VermietungTab />
        </TabsContent>
        <TabsContent value="einstellungen" className="mt-4">
          <EinstellungenTab />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

export default VerwaltungTab;
