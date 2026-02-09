import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Copy, Play } from 'lucide-react';
import AuditReportsTab from './AuditReportsTab';
import AuditPromptTab from './AuditPromptTab';
import AuditRunTab from './AuditRunTab';

export default function AuditHub() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold uppercase">Audit Hub</h1>
        <p className="text-muted-foreground">Reports, Prompt-Templates & Audit-Jobs</p>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="reports" className="gap-1.5">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
          <TabsTrigger value="prompt" className="gap-1.5">
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">Audit Prompt</span>
          </TabsTrigger>
          <TabsTrigger value="run" className="gap-1.5">
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline">Run / Jobs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-4">
          <AuditReportsTab />
        </TabsContent>
        <TabsContent value="prompt" className="mt-4">
          <AuditPromptTab />
        </TabsContent>
        <TabsContent value="run" className="mt-4">
          <AuditRunTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
