/**
 * CommPro Desk — Zone-1 Admin Desk for Brand Phone Assistants
 * Sub-Tab Navigation for 7 brands (Kaufy, FutureRoom, Acquiary, SoT, Lennox, Ncore, Otto²)
 */
import { lazy, Suspense, useMemo } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Loader2, Phone } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';

const BRAND_TABS = [
  { value: 'kaufy', label: 'Kaufy', path: 'kaufy' },
  { value: 'futureroom', label: 'FutureRoom', path: 'futureroom' },
  { value: 'acquiary', label: 'Acquiary', path: 'acquiary' },
  { value: 'sot', label: 'SoT', path: 'sot' },
  { value: 'lennox', label: 'Lennox & Friends', path: 'lennox' },
  { value: 'ncore', label: 'Ncore', path: 'ncore' },
  { value: 'otto', label: 'Otto²', path: 'otto' },
] as const;

function Loading() {
  return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

// Lazy-load the Zone 1 brand assistant panel
const BrandAssistantPanel = lazy(() => import('@/components/admin/desks/commpro/BrandAssistantPanel'));

export default function CommProDesk() {
  const location = useLocation();
  const subPath = location.pathname.replace(/^\/admin\/commpro-desk\/?/, '').split('/')[0] || '';
  const activeTab = BRAND_TABS.find(t => t.path === subPath)?.value || 'kaufy';

  const navigation = (
    <Tabs value={activeTab} className="w-full">
      <TabsList className="flex-wrap">
        {BRAND_TABS.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value} asChild>
            <Link to={`/admin/commpro-desk/${tab.path}`}>{tab.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  return (
    <OperativeDeskShell
      title="Communication Pro Desk"
      subtitle="Telefonassistenten für alle Marken — Premium-Tier mit ElevenLabs"
      moduleCode="MOD-14"
      zoneFlow={{ z3Surface: 'Brand Websites', z1Desk: 'CommPro Desk', z2Manager: 'MOD-14 Communication Pro' }}
      navigation={navigation}
    >
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route index element={<Navigate to="kaufy" replace />} />
          {BRAND_TABS.map(tab => (
            <Route
              key={tab.value}
              path={tab.path}
              element={<BrandAssistantPanel brandKey={tab.value} brandLabel={tab.label} />}
            />
          ))}
          <Route path="*" element={<Navigate to="/admin/commpro-desk/kaufy" replace />} />
        </Routes>
      </Suspense>
    </OperativeDeskShell>
  );
}
