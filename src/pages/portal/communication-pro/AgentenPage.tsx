/**
 * Armstrong Agenten Tab (MOD-14 CommPro → Agenten)
 * 
 * 4 Sektionen:
 * 1. Aktions-Katalog — alle verfügbaren Armstrong-Aktionen
 * 2. Ausführungs-Log — Transparenz über KI-Runs
 * 3. Kosten-Dashboard — Billing & Credits
 * 4. Wissensbasis — Knowledge Items
 */
import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, List, DollarSign, BookOpen } from 'lucide-react';
import { AktionsKatalog } from './agenten/AktionsKatalog';
import { AusfuehrungsLog } from './agenten/AusfuehrungsLog';
import { KostenDashboard } from './agenten/KostenDashboard';
import { Wissensbasis } from './agenten/Wissensbasis';

export function AgentenPage() {
  const [activeTab, setActiveTab] = useState('katalog');

  return (
    <PageShell>
      <ModulePageHeader
        title="ARMSTRONG AGENTEN"
        description="Verwalten, überwachen und steuern Sie alle KI-Aktionen im System."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="katalog" className="gap-1.5 text-xs">
            <List className="h-3.5 w-3.5" />
            Katalog
          </TabsTrigger>
          <TabsTrigger value="log" className="gap-1.5 text-xs">
            <Bot className="h-3.5 w-3.5" />
            Log
          </TabsTrigger>
          <TabsTrigger value="kosten" className="gap-1.5 text-xs">
            <DollarSign className="h-3.5 w-3.5" />
            Kosten
          </TabsTrigger>
          <TabsTrigger value="wissen" className="gap-1.5 text-xs">
            <BookOpen className="h-3.5 w-3.5" />
            Wissen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="katalog" className="mt-4">
          <AktionsKatalog />
        </TabsContent>
        <TabsContent value="log" className="mt-4">
          <AusfuehrungsLog />
        </TabsContent>
        <TabsContent value="kosten" className="mt-4">
          <KostenDashboard />
        </TabsContent>
        <TabsContent value="wissen" className="mt-4">
          <Wissensbasis />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
