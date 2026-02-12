/**
 * Finanzierung Page (MOD-07) - Routes Pattern with How It Works
 * 
 * OPTIMIZED: Lazy imports for sub-tab code-splitting
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const SelbstauskunftTab = lazy(() => import('./finanzierung/SelbstauskunftTab'));
const DokumenteTab = lazy(() => import('./finanzierung/DokumenteTab'));
const AnfrageTab = lazy(() => import('./finanzierung/AnfrageTab'));
const StatusTab = lazy(() => import('./finanzierung/StatusTab'));
const AnfrageDetailPage = lazy(() => import('./finanzierung/AnfrageDetailPage'));

const FinanzierungPage = () => {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route index element={<Navigate to="selbstauskunft" replace />} />
        
        {/* Tile routes */}
        <Route path="selbstauskunft" element={<SelbstauskunftTab />} />
        <Route path="dokumente" element={<DokumenteTab />} />
        <Route path="anfrage" element={<AnfrageTab />} />
        <Route path="status" element={<StatusTab />} />
        
        {/* Detail routes */}
        <Route path="anfrage/:requestId" element={<AnfrageDetailPage />} />
        
        {/* Legacy redirects */}
        <Route path="vorgaenge" element={<Navigate to="/portal/finanzierung/anfrage" replace />} />
        <Route path="readiness" element={<Navigate to="/portal/finanzierung/selbstauskunft" replace />} />
        <Route path="export" element={<Navigate to="/portal/finanzierung/anfrage" replace />} />
        <Route path="partner" element={<Navigate to="/portal/finanzierung/status" replace />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/portal/finanzierung" replace />} />
      </Routes>
    </Suspense>
  );
};

export default FinanzierungPage;
