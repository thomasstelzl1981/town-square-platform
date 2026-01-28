/**
 * MOD-11 Finanzierungsmanager - Main Page
 * 
 * FROZEN Sub-Tiles:
 * 1. Mandate (/) - Inbox + Acceptance + Consent
 * 2. Bearbeitung (/bearbeitung) - Case editing
 * 3. Einreichen (/einreichen) - Bank submission
 * 4. Status (/status) - Timeline + responses
 */

import * as React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Inbox, FileText, Send, Clock, Loader2, 
  CheckCircle2, Building2
} from 'lucide-react';
import { useFutureRoomCases } from '@/hooks/useFinanceMandate';

// Lazy load tab components
const MandateTab = React.lazy(() => import('./finanzierungsmanager/MandateTab'));
const BearbeitungTab = React.lazy(() => import('./finanzierungsmanager/BearbeitungTab'));
const SubmitToBankTab = React.lazy(() => import('./finanzierungsmanager/SubmitToBankTab'));
const StatusTab = React.lazy(() => import('./finanzierungsmanager/StatusTab'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

// FROZEN: 4 Sub-Tiles
const tabs = [
  { value: '', label: 'Mandate', icon: Inbox, path: '/portal/finanzierungsmanager' },
  { value: 'bearbeitung', label: 'Bearbeitung', icon: FileText, path: '/portal/finanzierungsmanager/bearbeitung' },
  { value: 'einreichen', label: 'Einreichen', icon: Send, path: '/portal/finanzierungsmanager/einreichen' },
  { value: 'status', label: 'Status', icon: Clock, path: '/portal/finanzierungsmanager/status' },
];

const FinanzierungsmanagerPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: cases, isLoading } = useFutureRoomCases();

  // Determine active tab from route
  const getActiveTab = () => {
    const path = location.pathname.replace('/portal/finanzierungsmanager', '').replace(/^\//, '');
    const firstSegment = path.split('/')[0];
    return firstSegment || '';
  };

  const handleTabChange = (value: string) => {
    const tab = tabs.find(t => t.value === value);
    if (tab) {
      navigate(tab.path);
    }
  };

  const activeCases = cases?.filter(c => c.status !== 'closed').length || 0;
  const readyToSubmit = cases?.filter(c => c.status === 'ready_to_submit').length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Finanzierungsmanager</h1>
          <p className="text-muted-foreground">
            Bearbeiten und reichen Sie Finanzierungsanfragen bei Banken ein
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-1">
            <Building2 className="h-3 w-3" />
            {activeCases} aktive Fälle
          </Badge>
          {readyToSubmit > 0 && (
            <Badge variant="default" className="gap-1 bg-green-500">
              <CheckCircle2 className="h-3 w-3" />
              {readyToSubmit} bereit
            </Badge>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={getActiveTab()} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Route Content */}
      <React.Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route index element={<MandateTab />} />
          <Route path="bearbeitung" element={<BearbeitungTab />} />
          <Route path="bearbeitung/:caseId" element={<BearbeitungTab />} />
          <Route path="einreichen" element={<SubmitToBankTab cases={cases || []} isLoading={isLoading} />} />
          <Route path="einreichen/:caseId" element={<SubmitToBankTab cases={cases || []} isLoading={isLoading} />} />
          <Route path="status" element={<StatusTab cases={cases || []} isLoading={isLoading} />} />
          
          {/* Legacy redirects for old routes */}
          <Route path="how-it-works" element={<Navigate to="/portal/finanzierungsmanager" replace />} />
          <Route path="selbstauskunft" element={<Navigate to="/portal/finanzierungsmanager/bearbeitung" replace />} />
          <Route path="selbstauskunft/:caseId" element={<LegacySelbstauskunftRedirect />} />
        </Routes>
      </React.Suspense>
    </div>
  );
};

// Legacy redirect for old selbstauskunft routes
function LegacySelbstauskunftRedirect() {
  const location = useLocation();
  const caseId = location.pathname.split('/').pop();
  return <Navigate to={`/portal/finanzierungsmanager/bearbeitung/${caseId}`} replace />;
}

export default FinanzierungsmanagerPage;
