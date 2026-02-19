/**
 * Lead Manager Page (MOD-10) — 5-Tile Architecture
 * Routes: kampagnen (default), kaufy, futureroom, acquiary, projekte
 */
import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const LeadManagerKampagnen = lazy(() => import('./lead-manager/LeadManagerKampagnen'));
const LeadManagerBrand = lazy(() => import('./lead-manager/LeadManagerBrand'));
const LeadManagerProjekte = lazy(() => import('./lead-manager/LeadManagerProjekte'));

const LeadManagerPage = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="kampagnen" replace />} />
      <Route path="kampagnen" element={<LeadManagerKampagnen />} />
      <Route path="kaufy" element={<LeadManagerBrand />} />
      <Route path="futureroom" element={<LeadManagerBrand />} />
      <Route path="acquiary" element={<LeadManagerBrand />} />
      <Route path="projekte" element={<LeadManagerProjekte />} />
      {/* Legacy redirects */}
      <Route path="inline" element={<Navigate to="/portal/lead-manager/kampagnen" replace />} />
      <Route path="uebersicht" element={<Navigate to="/portal/lead-manager/kampagnen" replace />} />
      <Route path="studio/*" element={<Navigate to="/portal/lead-manager/kampagnen" replace />} />
      <Route path="leads" element={<Navigate to="/portal/lead-manager/kampagnen" replace />} />
      <Route path="*" element={<Navigate to="/portal/lead-manager/kampagnen" replace />} />
    </Routes>
  );
};

export default LeadManagerPage;
