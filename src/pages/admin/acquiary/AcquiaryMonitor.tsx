/**
 * AcquiaryMonitor — Combined Audit + KPI Monitoring for Zone 1
 */
import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, ClipboardList } from 'lucide-react';
import AcquiaryAudit from './AcquiaryAudit';
import { Card, CardContent } from '@/components/ui/card';

function MonitoringKPIs() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Offene Mandate</p><p className="text-2xl font-bold mt-1">—</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Ø Bearbeitungszeit</p><p className="text-2xl font-bold mt-1">—</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Erfolgsquote</p><p className="text-2xl font-bold mt-1">—</p></CardContent></Card>
    </div>
  );
}

export default function AcquiaryMonitor() {
  return (
    <Tabs defaultValue="monitoring" className="space-y-4">
      <TabsList>
        <TabsTrigger value="monitoring" className="gap-2">
          <Activity className="h-4 w-4" /> KPIs
        </TabsTrigger>
        <TabsTrigger value="audit" className="gap-2">
          <ClipboardList className="h-4 w-4" /> Audit-Log
        </TabsTrigger>
      </TabsList>
      <TabsContent value="monitoring">
        <MonitoringKPIs />
      </TabsContent>
      <TabsContent value="audit">
        <AcquiaryAudit />
      </TabsContent>
    </Tabs>
  );
}
