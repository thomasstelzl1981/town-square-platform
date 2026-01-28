/**
 * MOD-07 Finanzierung - Main Page
 * 
 * FROZEN Sub-Tiles:
 * 1. Selbstauskunft (/)
 * 2. Neue Finanzierung (/neu)
 * 3. Kalkulation & Objekt (/kalkulation)
 * 4. Status (/status)
 * 
 * Legacy Redirects:
 * - /faelle → /status
 * - /faelle/:id → /status/:id
 * - /dokumente → /
 * - /einstellungen → /
 */

import * as React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Plus, Calculator, Clock, Loader2 } from 'lucide-react';

// Lazy load sub-tabs
const SelbstauskunftTab = React.lazy(() => import('./finanzierung/SelbstauskunftTab'));
const NeuTab = React.lazy(() => import('./finanzierung/NeuTab'));
const KalkulationTab = React.lazy(() => import('./finanzierung/KalkulationTab'));
const StatusTab = React.lazy(() => import('./finanzierung/StatusTab'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

// FROZEN: 4 Sub-Tiles
const tabs = [
  { value: '', label: 'Selbstauskunft', icon: User, path: '/portal/finanzierung' },
  { value: 'neu', label: 'Neue Finanzierung', icon: Plus, path: '/portal/finanzierung/neu' },
  { value: 'kalkulation', label: 'Kalkulation & Objekt', icon: Calculator, path: '/portal/finanzierung/kalkulation' },
  { value: 'status', label: 'Status', icon: Clock, path: '/portal/finanzierung/status' },
];

const FinanzierungPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL
  const getActiveTab = () => {
    const path = location.pathname.replace('/portal/finanzierung', '').replace(/^\//, '');
    // Handle nested routes like /status/:id
    const firstSegment = path.split('/')[0];
    return firstSegment || '';
  };

  const activeTab = getActiveTab();

  const handleTabChange = (value: string) => {
    const tab = tabs.find(t => t.value === value);
    if (tab) {
      navigate(tab.path);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Finanzierungen</h1>
        <p className="text-muted-foreground">Verwalten Sie Ihre Finanzierungsanträge</p>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Content */}
      <React.Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Main Routes */}
          <Route index element={<SelbstauskunftTab />} />
          <Route path="neu" element={<NeuTab />} />
          <Route path="kalkulation" element={<KalkulationTab />} />
          <Route path="status" element={<StatusTab />} />
          <Route path="status/:id" element={<StatusTab />} />
          
          {/* LEGACY REDIRECTS (FROZEN - must not break) */}
          <Route path="faelle" element={<Navigate to="/portal/finanzierung/status" replace />} />
          <Route path="faelle/:id" element={<LegacyFaelleRedirect />} />
          <Route path="dokumente" element={<Navigate to="/portal/finanzierung" replace />} />
          <Route path="einstellungen" element={<Navigate to="/portal/finanzierung" replace />} />
          
          {/* Backward compatibility: redirect old :id routes */}
          <Route path=":id" element={<LegacyIdRedirect />} />
        </Routes>
      </React.Suspense>
    </div>
  );
};

// Legacy redirect: /faelle/:id → /status/:id
function LegacyFaelleRedirect() {
  const { id } = useParams();
  return <Navigate to={`/portal/finanzierung/status/${id}`} replace />;
}

// Legacy redirect for old direct :id routes
function LegacyIdRedirect() {
  const { id } = useParams();
  
  // Check if this looks like a UUID (finance request ID)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');
  
  if (isUUID) {
    return <Navigate to={`/portal/finanzierung/status/${id}`} replace />;
  }
  
  // Not a UUID, redirect to main page
  return <Navigate to="/portal/finanzierung" replace />;
}

export default FinanzierungPage;
