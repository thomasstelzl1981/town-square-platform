/**
 * MSV Page (MOD-05) — Mietsonderverwaltung
 * 
 * Linearer Kontroll-Flow: Mietkontrolle, Mahnwesen, BWA/Buchwert.
 * Eine Seite, scrollbar — gemäß Golden Path Interaction Standard.
 */
import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const MSVDashboard = lazy(() => import('./msv/MSVDashboard'));

const MSVPage = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="uebersicht" replace />} />
      <Route path="uebersicht" element={<MSVDashboard />} />
      
      {/* Legacy redirects: old MSV routes → Immobilien/Verwaltung */}
      <Route path="objekte" element={<Navigate to="/portal/immobilien/verwaltung" replace />} />
      <Route path="mieteingang" element={<Navigate to="/portal/immobilien/verwaltung" replace />} />
      <Route path="vermietung" element={<Navigate to="/portal/immobilien/verwaltung" replace />} />
      <Route path="einstellungen" element={<Navigate to="/portal/immobilien/verwaltung" replace />} />
      <Route path="vermietung/:id" element={<Navigate to="/portal/immobilien/verwaltung" replace />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/portal/msv" replace />} />
    </Routes>
  );
};

export default MSVPage;
