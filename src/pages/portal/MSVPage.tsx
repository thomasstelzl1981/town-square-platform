/**
 * MSV Page (MOD-05) - Repurposed as KI-Telefon-Assistent
 * 
 * Former MSV functionality has been consolidated into MOD-04 Immobilien > Verwaltung tab.
 * This module now serves as the future home of the AI Phone Assistant.
 */
import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const KiTelefonUebersicht = lazy(() => import('./msv/KiTelefonUebersicht'));

const MSVPage = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="uebersicht" replace />} />
      <Route path="uebersicht" element={<KiTelefonUebersicht />} />
      
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
