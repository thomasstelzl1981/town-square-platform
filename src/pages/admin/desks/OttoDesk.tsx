/**
 * OTTO DESK — Zone 1 Operative Desk for Otto² Advisory
 * Handles Finanzierungsanfragen and Beratungsanfragen from otto2advisory.com
 */
import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Loader2, Inbox, CreditCard, Users, Settings } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OperativeDeskShell, type DeskKPI } from '@/components/admin/desks/OperativeDeskShell';
import { supabase } from '@/integrations/supabase/client';

const OttoLeadPool = lazy(() => import('../otto-desk/OttoLeadPool'));
const OttoInbox = lazy(() => import('../otto-desk/OttoInbox'));
const OttoMonitor = lazy(() => import('../otto-desk/OttoMonitor'));

const TABS = [
  { value: 'pool', label: 'Lead-Pool', path: '' },
  { value: 'inbox', label: 'Inbox', path: 'inbox' },
  { value: 'monitor', label: 'Monitor', path: 'monitor' },
];

function Loading() {
  return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
}

export default function OttoDesk() {
  const location = useLocation();
  const subPath = location.pathname.replace(/^\/admin\/otto-desk\/?/, '').split('/')[0] || '';
  const activeTab = TABS.find(t => t.path === subPath)?.value || 'pool';

  const [kpis, setKpis] = useState<DeskKPI[]>([
    { label: 'Neue Leads', value: '–', icon: Inbox },
    { label: 'Finanzierung', value: '–', icon: CreditCard },
    { label: 'Beratung', value: '–', icon: Users },
    { label: 'Zugewiesen', value: '–', icon: Settings },
  ]);

  useEffect(() => {
    async function loadKpis() {
      const { data: leads } = await supabase
        .from('leads')
        .select('id, source, status, assigned_partner_id')
        .in('source', ['otto_advisory_kontakt', 'otto_advisory_finanzierung']);
      if (!leads) return;
      setKpis([
        { label: 'Neue Leads', value: leads.filter(l => l.status === 'new').length, icon: Inbox, color: 'text-primary' },
        { label: 'Finanzierung', value: leads.filter(l => l.source === 'otto_advisory_finanzierung').length, icon: CreditCard },
        { label: 'Beratung', value: leads.filter(l => l.source === 'otto_advisory_kontakt').length, icon: Users },
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
            <Link to={`/admin/otto-desk/${tab.path}`}>{tab.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  return (
    <OperativeDeskShell
      title="Otto² Advisory Desk"
      subtitle="Finanzierungs- & Beratungsanfragen von otto2advisory.com"
      moduleCode=""
      zoneFlow={{ z3Surface: 'Otto² Advisory Website', z1Desk: 'Otto² Desk', z2Manager: '' }}
      kpis={kpis}
      navigation={navigation}
    >
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route index element={<OttoLeadPool />} />
          <Route path="inbox" element={<OttoInbox />} />
          <Route path="monitor" element={<OttoMonitor />} />
          <Route path="*" element={<Navigate to="/admin/otto-desk" replace />} />
        </Routes>
      </Suspense>
    </OperativeDeskShell>
  );
}
