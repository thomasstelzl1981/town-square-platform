/**
 * MOD-11 Finanzierungsmanager — Finance Manager Workbench (Zone 2)
 * 
 * P0-FIX: Removed inner Suspense to prevent nested Suspense deadlock.
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
import { Routes, Route, Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useFutureRoomCases } from '@/hooks/useFinanceMandate';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';

// Lazy load sub-pages
const FMDashboard = React.lazy(() => import('./finanzierungsmanager/FMDashboard'));
const FMFaelle = React.lazy(() => import('./finanzierungsmanager/FMFaelle'));
const FMFallDetail = React.lazy(() => import('./finanzierungsmanager/FMFallDetail'));
const FMKommunikation = React.lazy(() => import('./finanzierungsmanager/FMKommunikation'));
const FMStatus = React.lazy(() => import('./finanzierungsmanager/FMStatus'));

export default function FinanzierungsmanagerPage() {
  // Navigation handled by Level 3 SubTabs
  const { data: cases, isLoading } = useFutureRoomCases();
  const { memberships, isPlatformAdmin } = useAuth();

  // Access check:
  // - finance_manager: operational access
  // - platform_admin: superuser override (dev/muster account needs full visibility)
  const canAccess = isPlatformAdmin || memberships.some(m => m.role === 'finance_manager');

  if (!canAccess) {
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

  return (
    <div className="p-6 space-y-6">
      {/* Route Content - Navigation handled by Level 3 SubTabs */}
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<FMDashboard cases={cases || []} isLoading={isLoading} />} />
        <Route path="faelle" element={<FMFaelle cases={cases || []} isLoading={isLoading} />} />
        <Route path="faelle/:requestId" element={<FMFallDetail />} />
        <Route path="kommunikation" element={<FMKommunikation cases={cases || []} />} />
        <Route path="status" element={<FMStatus cases={cases || []} />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </div>
  );
}
