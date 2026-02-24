/**
 * Lead Desk — Zone 1 Operative Desk for MOD-10 (Leadmanager)
 * 3 Tabs: Website Leads (Z3) + Kampagnen (social_mandates) + Brand-Templates
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';

const LeadWebsiteLeads = lazy(() => import('../lead-desk/LeadWebsiteLeads'));
const LeadKampagnenDesk = lazy(() => import('../lead-desk/LeadKampagnenDesk'));
const LeadBrandTemplates = lazy(() => import('../lead-desk/LeadBrandTemplates'));

const TABS = [
  { value: 'website', label: 'Website Leads', path: '' },
  { value: 'kampagnen', label: 'Kampagnen', path: 'kampagnen' },
  { value: 'templates', label: 'Brand-Templates', path: 'templates' },
];

function Loading() {
  return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
}

export default function LeadDesk() {
  const location = useLocation();
  const subPath = location.pathname.replace(/^\/admin\/lead-desk\/?/, '').split('/')[0] || '';
  const activeTab = TABS.find(t => t.path === subPath)?.value || 'website';

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
      subtitle="Website-Leads (Zone 3) · Kampagnen · Brand-Templates"
      moduleCode="MOD-10"
      zoneFlow={{ z3Surface: 'Kaufy / SoT Website', z1Desk: 'Lead Desk', z2Manager: 'MOD-10 Leadmanager' }}
      navigation={navigation}
    >
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route index element={<LeadWebsiteLeads />} />
          <Route path="kampagnen" element={<LeadKampagnenDesk />} />
          <Route path="templates" element={<LeadBrandTemplates />} />
          <Route path="*" element={<Navigate to="/admin/lead-desk" replace />} />
        </Routes>
      </Suspense>
    </OperativeDeskShell>
  );
}
