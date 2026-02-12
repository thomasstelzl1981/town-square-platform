/**
 * Investments Page (MOD-08) - Routes Pattern with How It Works
 * 
 * OPTIMIZED: Lazy imports for sub-tab code-splitting
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const MandatTab = lazy(() => import('./investments/MandatTab'));
const MandatCreateWizard = lazy(() => import('./investments/MandatCreateWizard'));
const MandatDetail = lazy(() => import('./investments/MandatDetail'));
const SucheTab = lazy(() => import('./investments/SucheTab'));
const FavoritenTab = lazy(() => import('./investments/FavoritenTab'));
const SimulationTab = lazy(() => import('./investments/SimulationTab'));
const InvestmentExposePage = lazy(() => import('./investments/InvestmentExposePage'));

const InvestmentsPage = () => {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route index element={<Navigate to="suche" replace />} />
        
        {/* Tile routes */}
        <Route path="suche" element={<SucheTab />} />
        <Route path="favoriten" element={<FavoritenTab />} />
        <Route path="mandat" element={<MandatTab />} />
        <Route path="mandat/neu" element={<MandatCreateWizard />} />
        <Route path="mandat/:mandateId" element={<MandatDetail />} />
        <Route path="simulation" element={<SimulationTab />} />
        
        {/* Full-page Exposé route */}
        <Route path="objekt/:publicId" element={<InvestmentExposePage />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/portal/investments" replace />} />
      </Routes>
    </Suspense>
  );
};

export default InvestmentsPage;
