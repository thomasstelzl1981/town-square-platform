/**
 * MOD-11 Finanzierungsmanager — Finance Manager Workbench (Zone 2)
 * 
 * 4 Tiles: Dashboard, Finanzierungsakte, Einreichung, Fälle (Archiv)
 */
import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useFutureRoomCases } from '@/hooks/useFinanceMandate';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';

// Lazy load sub-pages
const FMDashboard = React.lazy(() => import('./finanzierungsmanager/FMDashboard'));
const FMFinanzierungsakte = React.lazy(() => import('./finanzierungsmanager/FMFinanzierungsakte'));
const FMFallDetail = React.lazy(() => import('./finanzierungsmanager/FMFallDetail'));
const FMEinreichung = React.lazy(() => import('./finanzierungsmanager/FMEinreichung'));
const FMEinreichungDetail = React.lazy(() => import('./finanzierungsmanager/FMEinreichungDetail'));
const FMArchiv = React.lazy(() => import('./finanzierungsmanager/FMArchiv'));

export default function FinanzierungsmanagerPage() {
  const { data: cases, isLoading } = useFutureRoomCases();
  const { memberships, isPlatformAdmin } = useAuth();

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
    <div className="space-y-6">
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<FMDashboard cases={cases || []} isLoading={isLoading} />} />
        <Route path="finanzierungsakte" element={<FMFinanzierungsakte />} />
        <Route path="faelle" element={<FMDashboard cases={cases || []} isLoading={isLoading} />} />
        <Route path="faelle/:requestId" element={<FMFallDetail />} />
        <Route path="einreichung" element={<FMEinreichung cases={cases || []} isLoading={isLoading} />} />
        <Route path="einreichung/:requestId" element={<FMEinreichungDetail />} />
        <Route path="archiv" element={<FMArchiv cases={cases || []} isLoading={isLoading} />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </div>
  );
}
