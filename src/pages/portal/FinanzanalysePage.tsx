/**
 * Finanzanalyse Page (MOD-18) — 4 Tabs, Navigation via TopNavigation SubTabs
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const UebersichtTab = lazy(() => import('./finanzanalyse/UebersichtTab'));
const CashflowBudgetTab = lazy(() => import('./finanzanalyse/CashflowBudgetTab'));
const VertraegeFixkostenTab = lazy(() => import('./finanzanalyse/VertraegeFixkostenTab'));
const RisikoAbsicherungTab = lazy(() => import('./finanzanalyse/RisikoAbsicherungTab'));

export default function FinanzanalysePage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<Skeleton className="h-64" />}>
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<UebersichtTab />} />
          <Route path="reports" element={<CashflowBudgetTab />} />
          <Route path="szenarien" element={<VertraegeFixkostenTab />} />
          <Route path="settings" element={<RisikoAbsicherungTab />} />
          <Route path="*" element={<Navigate to="/portal/finanzanalyse" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}
