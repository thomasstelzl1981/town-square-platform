/**
 * FutureRoom — Zone 1 Governance + Intake for Finance Requests
 * 
 * SoT for finance_requests after submission until assignment to finance_manager
 * 
 * Sub-Items (5):
 * - Inbox: New submissions (status: submitted_to_zone1)
 * - Zuweisung: Assignment workstation
 * - Finanzierungsmanager: Manager pool
 * - Bankkontakte: Bank directory (master data)
 * - Monitoring: KPIs and aging
 */
import * as React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Inbox, Link2, Users, Building2, BarChart3, Loader2 } from 'lucide-react';
import { useFinanceMandates, useFinanceBankContacts } from '@/hooks/useFinanceMandate';

// Lazy load sub-pages
const FutureRoomInbox = React.lazy(() => import('./futureroom/FutureRoomInbox'));
const FutureRoomZuweisung = React.lazy(() => import('./futureroom/FutureRoomZuweisung'));
const FutureRoomManagers = React.lazy(() => import('./futureroom/FutureRoomManagers'));
const FutureRoomBanks = React.lazy(() => import('./futureroom/FutureRoomBanks'));
const FutureRoomMonitoring = React.lazy(() => import('./futureroom/FutureRoomMonitoring'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

export default function FutureRoomPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: mandates } = useFinanceMandates();
  const { data: banks } = useFinanceBankContacts();

  const newMandates = mandates?.filter(m => m.status === 'submitted_to_zone1' || m.status === 'new').length || 0;
  const assignedNotAccepted = mandates?.filter(m => m.status === 'assigned').length || 0;

  // Determine active tab from route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/zuweisung')) return 'zuweisung';
    if (path.includes('/finanzierungsmanager')) return 'finanzierungsmanager';
    if (path.includes('/bankkontakte')) return 'bankkontakte';
    if (path.includes('/monitoring')) return 'monitoring';
    if (path.includes('/inbox')) return 'inbox';
    return 'inbox';
  };

  const handleTabChange = (value: string) => {
    switch (value) {
      case 'inbox':
        navigate('/admin/futureroom/inbox');
        break;
      case 'zuweisung':
        navigate('/admin/futureroom/zuweisung');
        break;
      case 'finanzierungsmanager':
        navigate('/admin/futureroom/finanzierungsmanager');
        break;
      case 'bankkontakte':
        navigate('/admin/futureroom/bankkontakte');
        break;
      case 'monitoring':
        navigate('/admin/futureroom/monitoring');
        break;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Future Room</h1>
          <p className="text-muted-foreground">
            Zentrale Governance für Finanzierungsanfragen — SoT nach Einreichung bis Zuweisung
          </p>
        </div>
        <div className="flex gap-2">
          {newMandates > 0 && (
            <Badge variant="destructive" className="text-sm">
              {newMandates} neue Anfragen
            </Badge>
          )}
          {assignedNotAccepted > 0 && (
            <Badge variant="secondary" className="text-sm">
              {assignedNotAccepted} zugewiesen
            </Badge>
          )}
        </div>
      </div>

      {/* Navigation Tabs — 5 Items per Spec */}
      <Tabs value={getActiveTab()} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" />
            Inbox
            {newMandates > 0 && (
              <Badge variant="secondary" className="ml-1">{newMandates}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="zuweisung" className="gap-2">
            <Link2 className="h-4 w-4" />
            Zuweisung
            {assignedNotAccepted > 0 && (
              <Badge variant="outline" className="ml-1">{assignedNotAccepted}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="finanzierungsmanager" className="gap-2">
            <Users className="h-4 w-4" />
            Manager
          </TabsTrigger>
          <TabsTrigger value="bankkontakte" className="gap-2">
            <Building2 className="h-4 w-4" />
            Bankkontakte
            <Badge variant="outline" className="ml-1">{banks?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Route Content */}
      <React.Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route index element={<Navigate to="inbox" replace />} />
          <Route path="inbox" element={<FutureRoomInbox />} />
          <Route path="zuweisung" element={<FutureRoomZuweisung />} />
          <Route path="finanzierungsmanager" element={<FutureRoomManagers />} />
          <Route path="bankkontakte" element={<FutureRoomBanks />} />
          <Route path="monitoring" element={<FutureRoomMonitoring />} />
          <Route path="*" element={<Navigate to="inbox" replace />} />
        </Routes>
      </React.Suspense>
    </div>
  );
}
