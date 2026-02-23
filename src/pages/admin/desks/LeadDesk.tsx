/**
 * Lead Desk — Zone 1 Operative Desk for MOD-10 (Leadmanager)
 * Modular Shell + lazy-loaded Sub-Pages (Acquiary-Pattern)
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';

const LeadDeskDashboard = lazy(() => import('../lead-desk/LeadDeskDashboard'));
const LeadPoolPage = lazy(() => import('../lead-desk/LeadPoolPage'));
const LeadAssignmentsPage = lazy(() => import('../lead-desk/LeadAssignmentsPage'));
const LeadCommissionsPage = lazy(() => import('../lead-desk/LeadCommissionsPage'));
const LeadMonitorPage = lazy(() => import('../lead-desk/LeadMonitorPage'));

const TABS = [
  { value: 'dashboard', label: 'Dashboard', path: '' },
  { value: 'pool', label: 'Lead Pool', path: 'pool' },
  { value: 'assignments', label: 'Zuweisungen', path: 'assignments' },
  { value: 'commissions', label: 'Provisionen', path: 'commissions' },
  { value: 'monitor', label: 'Monitor', path: 'monitor' },
];

function Loading() {
  return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
}

export default function LeadDesk() {
  const location = useLocation();
  const subPath = location.pathname.replace(/^\/admin\/lead-desk\/?/, '').split('/')[0] || '';
  const activeTab = TABS.find(t => t.path === subPath)?.value || 'dashboard';

  const navigation = (
    <Tabs value={activeTab} className="w-full">
      <TabsList>
        {TABS.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value} asChild>
            <Link to={`/admin/lead-desk/${tab.path}`}>{tab.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  return (
    <OperativeDeskShell
      title="Lead Desk"
      subtitle="Lead-Pool-Governance · Zuweisungen · Provisionen"
      moduleCode="MOD-10"
      zoneFlow={{ z3Surface: 'Kaufy / SoT Website', z1Desk: 'Lead Desk', z2Manager: 'MOD-10 Leadmanager' }}
      navigation={navigation}
    >
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route index element={<LeadDeskDashboard />} />
          <Route path="pool" element={<LeadPoolPage />} />
          <Route path="assignments" element={<LeadAssignmentsPage />} />
          <Route path="commissions" element={<LeadCommissionsPage />} />
          <Route path="monitor" element={<LeadMonitorPage />} />
          <Route path="*" element={<Navigate to="/admin/lead-desk" replace />} />
        </Routes>
      </Suspense>
    </OperativeDeskShell>
  );
}
