/**
 * NCORE DESK — Zone 1 Operative Desk for Ncore Business Consulting
 * Handles Projekt-Anfragen and Kooperations-Anfragen from ncore.online
 */
import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Loader2, Inbox, Users, BarChart3, Settings } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OperativeDeskShell, type DeskKPI } from '@/components/admin/desks/OperativeDeskShell';
import { supabase } from '@/integrations/supabase/client';

const NcoreLeadPool = lazy(() => import('../ncore-desk/NcoreLeadPool'));
const NcoreInbox = lazy(() => import('../ncore-desk/NcoreInbox'));
const NcoreMonitor = lazy(() => import('../ncore-desk/NcoreMonitor'));

const TABS = [
  { value: 'pool', label: 'Lead-Pool', path: '' },
  { value: 'inbox', label: 'Inbox', path: 'inbox' },
  { value: 'monitor', label: 'Monitor', path: 'monitor' },
];

function Loading() {
  return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
}

export default function NcoreDesk() {
  const location = useLocation();
  const subPath = location.pathname.replace(/^\/admin\/ncore-desk\/?/, '').split('/')[0] || '';
  const activeTab = TABS.find(t => t.path === subPath)?.value || 'pool';

  const [kpis, setKpis] = useState<DeskKPI[]>([
    { label: 'Neue Leads', value: '–', icon: Inbox },
    { label: 'Projekt-Anfragen', value: '–', icon: BarChart3 },
    { label: 'Kooperationen', value: '–', icon: Users },
    { label: 'Zugewiesen', value: '–', icon: Settings },
  ]);

  useEffect(() => {
    async function loadKpis() {
      const { data: leads } = await supabase
        .from('leads')
        .select('id, source, status, assigned_partner_id')
        .in('source', ['ncore_projekt', 'ncore_kooperation']);
      if (!leads) return;
      setKpis([
        { label: 'Neue Leads', value: leads.filter(l => l.status === 'new').length, icon: Inbox, color: 'text-primary' },
        { label: 'Projekt-Anfragen', value: leads.filter(l => l.source === 'ncore_projekt').length, icon: BarChart3 },
        { label: 'Kooperationen', value: leads.filter(l => l.source === 'ncore_kooperation').length, icon: Users },
        { label: 'Zugewiesen', value: leads.filter(l => l.assigned_partner_id).length, icon: Settings },
      ]);
    }
    loadKpis();
  }, []);

  const navigation = (
    <Tabs value={activeTab} className="w-full">
      <TabsList>
        {TABS.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value} asChild>
            <Link to={`/admin/ncore-desk/${tab.path}`}>{tab.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  return (
    <OperativeDeskShell
      title="Ncore Desk"
      subtitle="Projekt- & Kooperationsanfragen von ncore.online"
      moduleCode=""
      zoneFlow={{ z3Surface: 'Ncore Website', z1Desk: 'Ncore Desk', z2Manager: '' }}
      kpis={kpis}
      navigation={navigation}
    >
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route index element={<NcoreLeadPool />} />
          <Route path="inbox" element={<NcoreInbox />} />
          <Route path="monitor" element={<NcoreMonitor />} />
          <Route path="*" element={<Navigate to="/admin/ncore-desk" replace />} />
        </Routes>
      </Suspense>
    </OperativeDeskShell>
  );
}
