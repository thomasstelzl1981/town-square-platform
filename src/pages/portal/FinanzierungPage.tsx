import * as React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, FolderOpen, FileText, Settings } from 'lucide-react';

// Lazy load sub-tabs
const DashboardTab = React.lazy(() => import('./finanzierung/DashboardTab'));
const FaelleTab = React.lazy(() => import('./finanzierung/FaelleTab'));
const DokumenteTab = React.lazy(() => import('./finanzierung/DokumenteTab'));
const EinstellungenTab = React.lazy(() => import('./finanzierung/EinstellungenTab'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const tabs = [
  { value: '', label: 'Dashboard', icon: LayoutDashboard, path: '/portal/finanzierung' },
  { value: 'faelle', label: 'Fälle', icon: FileText, path: '/portal/finanzierung/faelle' },
  { value: 'dokumente', label: 'Dokumente', icon: FolderOpen, path: '/portal/finanzierung/dokumente' },
  { value: 'einstellungen', label: 'Einstellungen', icon: Settings, path: '/portal/finanzierung/einstellungen' },
];

const FinanzierungPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL
  const getActiveTab = () => {
    const path = location.pathname.replace('/portal/finanzierung', '').replace(/^\//, '');
    // Handle nested routes like /faelle/:id
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
          <Route index element={<DashboardTab />} />
          <Route path="faelle/*" element={<FaelleTab />} />
          <Route path="dokumente" element={<DokumenteTab />} />
          <Route path="einstellungen" element={<EinstellungenTab />} />
          {/* Backward compatibility: redirect old :id routes to new /faelle/:id */}
          <Route path=":id" element={<LegacyRedirect />} />
        </Routes>
      </React.Suspense>
    </div>
  );
};

// Redirect component for backward compatibility
function LegacyRedirect() {
  const location = useLocation();
  const id = location.pathname.split('/').pop();
  
  // Check if this looks like a UUID (finance request ID)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');
  
  if (isUUID) {
    return <Navigate to={`/portal/finanzierung/faelle/${id}`} replace />;
  }
  
  // Not a UUID, redirect to dashboard
  return <Navigate to="/portal/finanzierung" replace />;
}

export default FinanzierungPage;
