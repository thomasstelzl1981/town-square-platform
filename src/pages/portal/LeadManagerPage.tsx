/**
 * Lead Manager Page (MOD-10) — Simplified to single inline view
 */
import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const LeadManagerInline = lazy(() => import('./lead-manager/LeadManagerInline'));

const LeadManagerPage = () => {
  return (
    <Routes>
      <Route index element={<LeadManagerInline />} />
      {/* Legacy redirects */}
      <Route path="uebersicht" element={<Navigate to="/portal/lead-manager" replace />} />
      <Route path="kampagnen" element={<Navigate to="/portal/lead-manager" replace />} />
      <Route path="studio/*" element={<Navigate to="/portal/lead-manager" replace />} />
      <Route path="leads" element={<Navigate to="/portal/lead-manager" replace />} />
      <Route path="*" element={<Navigate to="/portal/lead-manager" replace />} />
    </Routes>
  );
};

export default LeadManagerPage;