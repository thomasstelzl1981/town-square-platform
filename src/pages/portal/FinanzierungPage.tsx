/**
 * Finanzierung Page (MOD-07) - Routes Pattern with How It Works
 * P0-FIX: Removed inner Suspense to prevent nested Suspense deadlock
 */
import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';

// Lazy load tab components
const SelbstauskunftTab = lazy(() => import('./finanzierung/SelbstauskunftTab'));
const DokumenteTab = lazy(() => import('./finanzierung/DokumenteTab'));
const AnfrageTab = lazy(() => import('./finanzierung/AnfrageTab'));
const AnfrageDetailPage = lazy(() => import('./finanzierung/AnfrageDetailPage'));
const StatusTab = lazy(() => import('./finanzierung/StatusTab'));

const FinanzierungPage = () => {
  const content = moduleContents['MOD-07'];

  return (
    <Routes>
      {/* How It Works as index */}
      <Route index element={<ModuleHowItWorks content={content} />} />
      
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
  );
};

export default FinanzierungPage;
