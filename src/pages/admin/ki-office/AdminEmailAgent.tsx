/**
 * AdminEmailAgent — Consolidated E-Mail Agent (3 Tabs)
 * Tab 1: Posteingang (Threads/Conversations)
 * Tab 2: Kampagnen (Sequences)
 * Tab 3: Templates
 */
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Target, FileText } from 'lucide-react';

// Lazy-load existing page content as inline components
import AdminKiOfficeEmail from './AdminKiOfficeEmail';
import AdminKiOfficeSequenzen from './AdminKiOfficeSequenzen';
import AdminKiOfficeTemplates from './AdminKiOfficeTemplates';

export default function AdminEmailAgent() {
  const [activeTab, setActiveTab] = useState('posteingang');

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Tab Navigation */}
      <div className="border-b bg-background px-4 pt-3 shrink-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-10">
            <TabsTrigger value="posteingang" className="gap-2">
              <Mail className="h-4 w-4" />
              Posteingang
            </TabsTrigger>
            <TabsTrigger value="kampagnen" className="gap-2">
              <Target className="h-4 w-4" />
              Kampagnen
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === 'posteingang' && <AdminKiOfficeEmail />}
        {activeTab === 'kampagnen' && <AdminKiOfficeSequenzen />}
        {activeTab === 'templates' && <AdminKiOfficeTemplates />}
      </div>
    </div>
  );
}
