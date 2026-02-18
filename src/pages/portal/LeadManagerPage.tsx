/**
 * Lead Manager Page (MOD-10) — Self-Serve Werbeschaltung & Lead-Verwaltung
 */
import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const LeadManagerUebersicht = lazy(() => import('./lead-manager/LeadManagerUebersicht'));
const LeadManagerKampagnen = lazy(() => import('./lead-manager/LeadManagerKampagnen'));
const LeadManagerStudio = lazy(() => import('./lead-manager/LeadManagerStudio'));
const LeadManagerStudioPlanen = lazy(() => import('./lead-manager/LeadManagerStudioPlanen'));
const LeadManagerStudioSummary = lazy(() => import('./lead-manager/LeadManagerStudioSummary'));
const LeadManagerLeads = lazy(() => import('./lead-manager/LeadManagerLeads'));

const LeadManagerPage = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="uebersicht" replace />} />
      <Route path="uebersicht" element={<LeadManagerUebersicht />} />
      <Route path="kampagnen" element={<LeadManagerKampagnen />} />
      <Route path="studio" element={<LeadManagerStudio />} />
      <Route path="studio/planen" element={<LeadManagerStudioPlanen />} />
      <Route path="studio/summary" element={<LeadManagerStudioSummary />} />
      <Route path="leads" element={<LeadManagerLeads />} />
      <Route path="*" element={<Navigate to="/portal/lead-manager" replace />} />
    </Routes>
  );
};

export default LeadManagerPage;
