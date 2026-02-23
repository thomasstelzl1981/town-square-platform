/**
 * Finance Desk — Zone-1 Operative Desk für private Finanzberatung
 * Modular Shell + lazy-loaded Sub-Pages (Acquiary-Pattern)
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';

const FinanceDeskDashboard = lazy(() => import('../finance-desk/FinanceDeskDashboard'));
const FinanceDeskInboxPage = lazy(() => import('../finance-desk/FinanceDeskInboxPage'));
const FinanceDeskFaellePage = lazy(() => import('../finance-desk/FinanceDeskFaellePage'));
const FinanceDeskMonitorPage = lazy(() => import('../finance-desk/FinanceDeskMonitorPage'));

const TABS = [
  { value: 'dashboard', label: 'Dashboard', path: '' },
  { value: 'inbox', label: 'Inbox', path: 'inbox' },
  { value: 'faelle', label: 'Fälle', path: 'faelle' },
  { value: 'monitor', label: 'Monitor', path: 'monitor' },
];

function Loading() {
  return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
}

export default function FinanceDesk() {
  const location = useLocation();
  const subPath = location.pathname.replace(/^\/admin\/finance-desk\/?/, '').split('/')[0] || '';
  const activeTab = TABS.find(t => t.path === subPath)?.value || 'dashboard';

  const navigation = (
    <Tabs value={activeTab} className="w-full">
      <TabsList>
        {TABS.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value} asChild>
            <Link to={`/admin/finance-desk/${tab.path}`}>{tab.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  return (
    <OperativeDeskShell
      title="Finance Desk"
      subtitle="Private Finanzberatung — Inbox · Fälle · Monitor"
      moduleCode="MOD-18"
      zoneFlow={{ z3Surface: 'Website / Portal', z1Desk: 'Finance Desk', z2Manager: 'Finanzberater (Manager)' }}
      navigation={navigation}
    >
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route index element={<FinanceDeskDashboard />} />
          <Route path="inbox" element={<FinanceDeskInboxPage />} />
          <Route path="faelle" element={<FinanceDeskFaellePage />} />
          <Route path="monitor" element={<FinanceDeskMonitorPage />} />
          <Route path="*" element={<Navigate to="/admin/finance-desk" replace />} />
        </Routes>
      </Suspense>
    </OperativeDeskShell>
  );
}
