/**
 * MSV Page (MOD-05) - Routes Pattern with How It Works
 * P0-FIX: Removed inner Suspense to prevent nested Suspense deadlock
 */
import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';


// Lazy load sub-page components
const ObjekteTab = lazy(() => import('./msv/ObjekteTab'));
const MieteingangTab = lazy(() => import('./msv/MieteingangTab'));
const VermietungTab = lazy(() => import('./msv/VermietungTab'));
const EinstellungenTab = lazy(() => import('./msv/EinstellungenTab'));
const RentalExposeDetail = lazy(() => import('./msv/RentalExposeDetail'));

const MSVPage = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="objekte" replace />} />
      
      {/* Tile routes */}
      <Route path="objekte" element={<ObjekteTab />} />
      <Route path="mieteingang" element={<MieteingangTab />} />
      <Route path="vermietung" element={<VermietungTab />} />
      <Route path="einstellungen" element={<EinstellungenTab />} />
      
      {/* Detail routes */}
      <Route path="vermietung/:id" element={<RentalExposeDetail />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/portal/msv" replace />} />
    </Routes>
  );
};

export default MSVPage;
