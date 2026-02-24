/**
 * MOD-11 Finanzierungsmanager — 6 operative Tiles
 * 
 * Tiles: Dashboard, Finanzierungsakte, Einreichung, Provisionen, Archiv, Landing Page
 * Dynamic: FallDetail, EinreichungDetail, + persönliche Finanz-Tabs (Übersicht, Investment, etc.)
 */
import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { useFutureRoomCases } from '@/hooks/useFinanceMandate';

// Lazy load — 6 Tile pages
const FMDashboard = React.lazy(() => import('./finanzierungsmanager/FMDashboard'));
const FMFinanzierungsakte = React.lazy(() => import('./finanzierungsmanager/FMFinanzierungsakte'));
const FMEinreichung = React.lazy(() => import('./finanzierungsmanager/FMEinreichung'));
const FMProvisionen = React.lazy(() => import('./finanzierungsmanager/FMProvisionen'));
const FMArchiv = React.lazy(() => import('./finanzierungsmanager/FMArchiv'));

// Dynamic routes
const FMFallDetail = React.lazy(() => import('./finanzierungsmanager/FMFallDetail'));
const FMEinreichungDetail = React.lazy(() => import('./finanzierungsmanager/FMEinreichungDetail'));

// Personal finance tabs (moved to dynamic_routes, still reachable)
const FMUebersichtTab = React.lazy(() => import('./finanzierungsmanager/FMUebersichtTab'));
const FMInvestmentTab = React.lazy(() => import('./finanzierungsmanager/FMInvestmentTab'));
const FMSachversicherungenTab = React.lazy(() => import('./finanzierungsmanager/FMSachversicherungenTab'));
const FMVorsorgeTab = React.lazy(() => import('./finanzierungsmanager/FMVorsorgeTab'));
const FMAbonnementsTab = React.lazy(() => import('./finanzierungsmanager/FMAbonnementsTab'));

export default function FinanzierungsmanagerPage() {
  const { memberships, isPlatformAdmin } = useAuth();

  const canAccess = isPlatformAdmin || memberships.some(m => 
    m.role === 'finance_manager' || m.role === 'super_manager'
  );

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

  const { data: cases = [], isLoading: casesLoading } = useFutureRoomCases();

  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      {/* 6 operative Tiles */}
      <Route path="dashboard" element={<FMDashboard cases={cases} isLoading={casesLoading} />} />
      <Route path="finanzierungsakte" element={<FMFinanzierungsakte />} />
      <Route path="einreichung" element={<FMEinreichung cases={cases} isLoading={casesLoading} />} />
      <Route path="provisionen" element={<FMProvisionen />} />
      <Route path="archiv" element={<FMArchiv cases={cases} isLoading={casesLoading} />} />
      {/* Dynamic routes */}
      <Route path="faelle/:requestId" element={<FMFallDetail />} />
      <Route path="einreichung/:requestId" element={<FMEinreichungDetail />} />
      {/* Personal finance tabs (dynamic_routes, still reachable) */}
      <Route path="uebersicht" element={<FMUebersichtTab />} />
      <Route path="investment" element={<FMInvestmentTab />} />
      <Route path="sachversicherungen" element={<FMSachversicherungenTab />} />
      <Route path="vorsorge" element={<FMVorsorgeTab />} />
      <Route path="abonnements" element={<FMAbonnementsTab />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
