/**
 * Sales Desk — Zone-1 Admin Desk for Sales Operations
 * Modular Shell + lazy-loaded Sub-Pages (Acquiary-Pattern)
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';

const SalesDeskDashboard = lazy(() => import('../sales-desk/SalesDeskDashboard'));
const VeroeffentlichungenTab = lazy(() => import('../sales-desk/VeroeffentlichungenTab').then(m => ({ default: m.VeroeffentlichungenTab })));

const TABS = [
  { value: 'dashboard', label: 'Dashboard', path: '' },
  { value: 'veroeffentlichungen', label: 'Veröffentlichungen', path: 'veroeffentlichungen' },
  { value: 'inbox', label: 'Inbox', path: 'inbox' },
  { value: 'partner', label: 'Partner', path: 'partner' },
  { value: 'audit', label: 'Audit', path: 'audit' },
];

function Loading() {
  return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
}

// Lazy wrappers for sub-pages from SalesDeskSubPages
const InboxPage = lazy(() => import('../sales-desk/SalesDeskSubPages').then(m => ({ default: m.InboxTab })));
const PartnerPage = lazy(() => import('../sales-desk/SalesDeskSubPages').then(m => ({ default: m.PartnerTab })));
const AuditPage = lazy(() => import('../sales-desk/SalesDeskSubPages').then(m => ({ default: m.AuditTab })));

export default function SalesDesk() {
  const location = useLocation();
  const subPath = location.pathname.replace(/^\/admin\/sales-desk\/?/, '').split('/')[0] || '';
  const activeTab = TABS.find(t => t.path === subPath)?.value || 'dashboard';

  const navigation = (
    <Tabs value={activeTab} className="w-full">
      <TabsList>
        {TABS.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value} asChild>
            <Link to={`/admin/sales-desk/${tab.path}`}>{tab.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  return (
    <OperativeDeskShell
      title="Sales Desk"
      subtitle="Zentrale Übersicht für Verkaufsoperationen und Partner-Freigaben"
      moduleCode="MOD-09"
      zoneFlow={{ z3Surface: 'Kaufy Marketplace', z1Desk: 'Sales Desk', z2Manager: 'MOD-09 Vertriebsmanager' }}
      navigation={navigation}
    >
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route index element={<SalesDeskDashboard />} />
          <Route path="veroeffentlichungen" element={<VeroeffentlichungenTab />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="partner" element={<PartnerPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="*" element={<Navigate to="/admin/sales-desk" replace />} />
        </Routes>
      </Suspense>
    </OperativeDeskShell>
  );
}
