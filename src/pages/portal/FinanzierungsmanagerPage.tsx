/**
 * MOD-11 Finanzierungsmanager — 5-Punkt-Menü (Zone 2)
 * 
 * Tiles: Übersicht, Investment, Sachversicherungen, Vorsorgeverträge, Abonnements
 * Dynamic: Finanzierungsakte, Einreichung, Provisionen, Archiv, Falldetail
 */
import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';

// Lazy load sub-pages — 5 Tiles
const FMUebersichtTab = React.lazy(() => import('./finanzierungsmanager/FMUebersichtTab'));
const FMInvestmentTab = React.lazy(() => import('./finanzierungsmanager/FMInvestmentTab'));
const FMSachversicherungenTab = React.lazy(() => import('./finanzierungsmanager/FMSachversicherungenTab'));
const FMVorsorgeTab = React.lazy(() => import('./finanzierungsmanager/FMVorsorgeTab'));
const FMAbonnementsTab = React.lazy(() => import('./finanzierungsmanager/FMAbonnementsTab'));

// Dynamic routes (legacy workflows)
const FMFinanzierungsakte = React.lazy(() => import('./finanzierungsmanager/FMFinanzierungsakte'));
const FMFallDetail = React.lazy(() => import('./finanzierungsmanager/FMFallDetail'));
const FMEinreichung = React.lazy(() => import('./finanzierungsmanager/FMEinreichung'));
const FMEinreichungDetail = React.lazy(() => import('./finanzierungsmanager/FMEinreichungDetail'));
const FMProvisionen = React.lazy(() => import('./finanzierungsmanager/FMProvisionen'));
const FMArchiv = React.lazy(() => import('./finanzierungsmanager/FMArchiv'));

export default function FinanzierungsmanagerPage() {
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
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      {/* 5-Punkt-Menü */}
      <Route path="dashboard" element={<FMUebersichtTab />} />
      <Route path="investment" element={<FMInvestmentTab />} />
      <Route path="sachversicherungen" element={<FMSachversicherungenTab />} />
      <Route path="vorsorge" element={<FMVorsorgeTab />} />
      <Route path="abonnements" element={<FMAbonnementsTab />} />
      {/* Dynamic routes (legacy) */}
      <Route path="finanzierungsakte" element={<FMFinanzierungsakte />} />
      <Route path="faelle/:requestId" element={<FMFallDetail />} />
      <Route path="einreichung" element={<FMEinreichung cases={[]} isLoading={false} />} />
      <Route path="einreichung/:requestId" element={<FMEinreichungDetail />} />
      <Route path="provisionen" element={<FMProvisionen />} />
      <Route path="archiv" element={<FMArchiv cases={[]} isLoading={false} />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
