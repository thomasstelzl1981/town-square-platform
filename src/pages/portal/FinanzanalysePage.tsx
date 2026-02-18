/**
 * Finanzen Page (MOD-18) — 8 Tabs, Navigation via TopNavigation SubTabs
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const UebersichtTab = lazy(() => import('./finanzanalyse/UebersichtTab'));
const KontenTab = lazy(() => import('./finanzanalyse/KontenTab'));
const InvestmentTab = lazy(() => import('./finanzanalyse/InvestmentTab'));
const SachversicherungenTab = lazy(() => import('./finanzanalyse/SachversicherungenTab'));
const VorsorgeTab = lazy(() => import('./finanzanalyse/VorsorgeTab'));
const KrankenversicherungTab = lazy(() => import('./finanzanalyse/KrankenversicherungTab'));
const AbonnementsTab = lazy(() => import('./finanzanalyse/AbonnementsTab'));
const VorsorgedokumenteTab = lazy(() => import('./finanzanalyse/VorsorgedokumenteTab'));
const DarlehenTab = lazy(() => import('./finanzanalyse/DarlehenTab'));

export default function FinanzanalysePage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<Skeleton className="h-64" />}>
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<UebersichtTab />} />
          <Route path="konten" element={<KontenTab />} />
          <Route path="investment" element={<InvestmentTab />} />
          <Route path="sachversicherungen" element={<SachversicherungenTab />} />
          <Route path="vorsorge" element={<VorsorgeTab />} />
          <Route path="kv" element={<KrankenversicherungTab />} />
          <Route path="abonnements" element={<AbonnementsTab />} />
          <Route path="vorsorgedokumente" element={<VorsorgedokumenteTab />} />
          <Route path="darlehen" element={<DarlehenTab />} />
          <Route path="*" element={<Navigate to="/portal/finanzanalyse" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}
