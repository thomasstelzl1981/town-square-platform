/**
 * AcquiaryMonitor — Combined Audit + Monitoring for Zone 1
 * Merges the former AcquiaryAudit and AcquiaryMonitoring into one view
 */
import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, ClipboardList } from 'lucide-react';
import { AcquiaryMonitoring } from './AcquiaryMonitoring';
import AcquiaryAudit from './AcquiaryAudit';

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
        <AcquiaryMonitoring />
      </TabsContent>
      <TabsContent value="audit">
        <AcquiaryAudit />
      </TabsContent>
    </Tabs>
  );
}
