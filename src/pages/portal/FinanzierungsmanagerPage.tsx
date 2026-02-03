/**
 * MOD-11 Finanzierungsmanager — Finance Manager Workbench (Zone 2)
 * 
 * Operational SoT AFTER acceptance/assignment from Zone 1 FutureRoom.
 * Role-gated: requires finance_manager
 * 
 * Sub-Pages:
 * - Dashboard: Overview of assigned cases
 * - Fälle: Case list with details (/faelle, /faelle/:requestId)
 * - Kommunikation: Outbound message log
 * - Status: System view and audit trail
 */
import * as React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, FolderOpen, MessageSquare, BarChart3, Loader2, ShieldAlert } from 'lucide-react';
import { useFutureRoomCases } from '@/hooks/useFinanceMandate';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';

// Lazy load sub-pages
const FMDashboard = React.lazy(() => import('./finanzierungsmanager/FMDashboard'));
const FMFaelle = React.lazy(() => import('./finanzierungsmanager/FMFaelle'));
const FMFallDetail = React.lazy(() => import('./finanzierungsmanager/FMFallDetail'));
const FMKommunikation = React.lazy(() => import('./finanzierungsmanager/FMKommunikation'));
const FMStatus = React.lazy(() => import('./finanzierungsmanager/FMStatus'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

export default function FinanzierungsmanagerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: cases, isLoading } = useFutureRoomCases();
  const { memberships } = useAuth();

  // Role check: requires finance_manager
  const isFinanceManager = memberships.some(m => m.role === 'finance_manager');

  if (!isFinanceManager) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <ShieldAlert className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Kein Zugriff</h3>
            <p className="text-muted-foreground">
              Dieses Modul ist nur für verifizierte Finanzierungsmanager zugänglich.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeCases = cases?.filter(c => c.status === 'active') || [];
  const needsActionCases = cases?.filter(c => 
    c.finance_mandates?.finance_requests?.status === 'needs_customer_action'
  ) || [];

  // Determine active tab from route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/faelle')) return 'faelle';
    if (path.includes('/kommunikation')) return 'kommunikation';
    if (path.includes('/status')) return 'status';
    return 'dashboard';
  };

  const handleTabChange = (value: string) => {
    navigate(`/portal/finanzierungsmanager/${value === 'dashboard' ? '' : value}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Finanzierungsmanager</h1>
          <p className="text-muted-foreground">
            Ihre Workbench für zugewiesene Finanzierungsfälle
          </p>
        </div>
        <div className="flex gap-2">
          {activeCases.length > 0 && (
            <Badge variant="secondary" className="text-sm">
              {activeCases.length} aktive Fälle
            </Badge>
          )}
          {needsActionCases.length > 0 && (
            <Badge variant="destructive" className="text-sm">
              {needsActionCases.length} benötigen Aktion
            </Badge>
          )}
        </div>
      </div>

      {/* Navigation Tabs — 4 Items per Spec */}
      <Tabs value={getActiveTab()} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="faelle" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Fälle
            {activeCases.length > 0 && (
              <Badge variant="outline" className="ml-1">{activeCases.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="kommunikation" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Kommunikation
          </TabsTrigger>
          <TabsTrigger value="status" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Status
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Route Content */}
      <React.Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<FMDashboard cases={cases || []} isLoading={isLoading} />} />
          <Route path="faelle" element={<FMFaelle cases={cases || []} isLoading={isLoading} />} />
          <Route path="faelle/:requestId" element={<FMFallDetail />} />
          <Route path="kommunikation" element={<FMKommunikation cases={cases || []} />} />
          <Route path="status" element={<FMStatus cases={cases || []} />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </React.Suspense>
    </div>
  );
}
