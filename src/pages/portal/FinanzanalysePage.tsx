/**
 * Finanzen Page (MOD-18) — 5 Tabs, Navigation via TopNavigation SubTabs
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const UebersichtTab = lazy(() => import('./finanzanalyse/UebersichtTab'));
const InvestmentTab = lazy(() => import('./finanzanalyse/InvestmentTab'));
const SachversicherungenTab = lazy(() => import('./finanzanalyse/SachversicherungenTab'));
const VorsorgeTab = lazy(() => import('./finanzanalyse/VorsorgeTab'));
const AbonnementsTab = lazy(() => import('./finanzanalyse/AbonnementsTab'));
const VorsorgedokumenteTab = lazy(() => import('./finanzanalyse/VorsorgedokumenteTab'));

export default function FinanzanalysePage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<Skeleton className="h-64" />}>
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<UebersichtTab />} />
          <Route path="investment" element={<InvestmentTab />} />
          <Route path="sachversicherungen" element={<SachversicherungenTab />} />
          <Route path="vorsorge" element={<VorsorgeTab />} />
          <Route path="abonnements" element={<AbonnementsTab />} />
          <Route path="vorsorgedokumente" element={<VorsorgedokumenteTab />} />
          <Route path="*" element={<Navigate to="/portal/finanzanalyse" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}
