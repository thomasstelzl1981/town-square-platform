/**
 * Acquiary — Zone-1 Admin Desk for Acquisition Management
 * 6-Tab Structure: Dashboard, Kontakte, Datenbank, Mandate, Routing, Monitor
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';

const AcquiaryDashboard = lazy(() => import('../acquiary/AcquiaryDashboard'));
const AcquiaryKontakte = lazy(() => import('../acquiary/AcquiaryKontakte'));
const AcquiaryDatenbank = lazy(() => import('../acquiary/AcquiaryDatenbank'));
const AcquiaryMandates = lazy(() => import('../acquiary/AcquiaryMandates'));
const AcquiaryNeedsRouting = lazy(() => import('../acquiary/AcquiaryNeedsRouting'));
const AcquiaryMonitor = lazy(() => import('../acquiary/AcquiaryMonitor'));
const AcquiaryInbox = lazy(() => import('../acquiary/AcquiaryInbox'));
const AcquiaryAssignments = lazy(() => import('../acquiary/AcquiaryAssignments'));

const TABS = [
  { value: 'dashboard', label: 'Dashboard', path: '' },
  { value: 'kontakte', label: 'Kontakte', path: 'kontakte' },
  { value: 'datenbank', label: 'Datenbank', path: 'datenbank' },
  { value: 'mandate', label: 'Mandate', path: 'mandate' },
  { value: 'routing', label: 'Routing', path: 'needs-routing' },
  { value: 'monitor', label: 'Monitor', path: 'monitor' },
];

function Loading() {
  return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
}

export default function Acquiary() {
  const location = useLocation();
  const subPath = location.pathname.replace(/^\/admin\/acquiary\/?/, '').split('/')[0] || '';
  const activeTab = TABS.find(t => t.path === subPath)?.value || 'dashboard';

  const navigation = (
    <Tabs value={activeTab} className="w-full">
      <TabsList>
        {TABS.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value} asChild>
            <Link to={`/admin/acquiary/${tab.path}`}>{tab.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  return (
    <OperativeDeskShell
      title="Acquiary"
      subtitle="Akquisitions-Desk für Objektankäufe und Mandatsverwaltung"
      moduleCode="MOD-12"
      zoneFlow={{ z3Surface: 'Acquiary Website', z1Desk: 'Acquiary', z2Manager: 'MOD-12 Akquisemanager' }}
      navigation={navigation}
    >
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route index element={<AcquiaryDashboard />} />
          <Route path="kontakte" element={<AcquiaryKontakte />} />
          <Route path="datenbank" element={<AcquiaryDatenbank />} />
          <Route path="mandate" element={<AcquiaryMandates />} />
          <Route path="needs-routing" element={<AcquiaryNeedsRouting />} />
          <Route path="monitor" element={<AcquiaryMonitor />} />
          <Route path="inbox" element={<AcquiaryInbox />} />
          <Route path="assignments" element={<AcquiaryAssignments />} />
          <Route path="audit" element={<Navigate to="/admin/acquiary/monitor" replace />} />
          <Route path="objekteingang" element={<Navigate to="/admin/acquiary/datenbank" replace />} />
          <Route path="*" element={<Navigate to="/admin/acquiary" replace />} />
        </Routes>
      </Suspense>
    </OperativeDeskShell>
  );
}
