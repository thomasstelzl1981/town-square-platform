/**
 * Finanzierung Page (MOD-07) - Routes Pattern with How It Works
 * 
 * OPTIMIZED: Direct imports for sub-tabs (parent is already lazy-loaded)
 */
import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';

// Direct imports for instant sub-tab navigation
import SelbstauskunftTab from './finanzierung/SelbstauskunftTab';
import DokumenteTab from './finanzierung/DokumenteTab';
import AnfrageTab from './finanzierung/AnfrageTab';
import StatusTab from './finanzierung/StatusTab';

// Detail page stays lazy (dynamic content)
const AnfrageDetailPage = lazy(() => import('./finanzierung/AnfrageDetailPage'));

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
