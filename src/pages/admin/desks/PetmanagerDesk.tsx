/**
 * Pet Desk — Zone 1 Admin Desk for Pet Services Governance
 * 5-Tab Structure: Governance, Vorgänge, Kunden, Shop, Billing
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Loader2, ExternalLink } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';

const PetDeskGovernance = lazy(() => import('../petmanager/PetDeskGovernance'));
const PetDeskKontakte = lazy(() => import('../petmanager/PetDeskKontakte'));
const PetDeskVorgaenge = lazy(() => import('../petmanager/PetDeskVorgaenge'));
const PetDeskKunden = lazy(() => import('../petmanager/PetDeskKunden'));
const PetDeskShop = lazy(() => import('../petmanager/PetDeskShop'));
const PetDeskBilling = lazy(() => import('../petmanager/PetDeskBilling'));

const TABS = [
  { value: 'governance', label: 'Governance', path: '' },
  { value: 'kontakte', label: 'Kontakte', path: 'kontakte' },
  { value: 'vorgaenge', label: 'Vorgänge', path: 'vorgaenge' },
  { value: 'kunden', label: 'Kunden', path: 'kunden' },
  { value: 'shop', label: 'Shop', path: 'shop' },
  { value: 'billing', label: 'Billing', path: 'billing' },
];

function Loading() {
  return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
}

export default function PetmanagerDesk() {
  const location = useLocation();
  const subPath = location.pathname.replace(/^\/admin\/pet-desk\/?/, '').split('/')[0] || '';
  const activeTab = TABS.find(t => t.path === subPath)?.value || 'governance';

  const navigation = (
    <Tabs value={activeTab} className="w-full">
      <TabsList>
        {TABS.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value} asChild>
            <Link to={`/admin/pet-desk/${tab.path}`}>{tab.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  return (
    <OperativeDeskShell
      title="Pet Desk"
      subtitle="Provider · Umsatz · Buchungen · Service-Moderation"
      moduleCode="MOD-05"
      zoneFlow={{ z3Surface: 'Lennox Website', z1Desk: 'Pet Desk', z2Manager: 'MOD-22 Pet Manager' }}
      navigation={navigation}
      headerActions={
        <Button variant="outline" size="sm" asChild>
          <Link to="/website/tierservice">
            <ExternalLink className="h-4 w-4 mr-1.5" />
            Lennox Website
          </Link>
        </Button>
      }
    >
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route index element={<PetDeskGovernance />} />
          <Route path="kontakte" element={<PetDeskKontakte />} />
          <Route path="vorgaenge" element={<PetDeskVorgaenge />} />
          <Route path="kunden" element={<PetDeskKunden />} />
          <Route path="shop" element={<PetDeskShop />} />
          <Route path="billing" element={<PetDeskBilling />} />
          {/* Legacy redirects */}
          <Route path="provider" element={<Navigate to="/admin/pet-desk/shop" replace />} />
          <Route path="services" element={<Navigate to="/admin/pet-desk/shop" replace />} />
          <Route path="finanzen" element={<Navigate to="/admin/pet-desk/billing" replace />} />
          <Route path="monitor" element={<Navigate to="/admin/pet-desk" replace />} />
          <Route path="*" element={<Navigate to="/admin/pet-desk" replace />} />
        </Routes>
      </Suspense>
    </OperativeDeskShell>
  );
}
