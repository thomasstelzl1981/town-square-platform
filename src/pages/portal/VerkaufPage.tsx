/**
 * Verkauf Page (MOD-06) - Routes Pattern with How It Works
 * P0-FIX: Removed inner Suspense to prevent nested Suspense deadlock
 */
import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Lazy load tabs
const ObjekteTab = lazy(() => import('./verkauf/ObjekteTab'));
const ReportingTab = lazy(() => import('./verkauf/ReportingTab'));
const VorgaengeTab = lazy(() => import('./verkauf/VorgaengeTab'));
const AnfragenTab = lazy(() => import('./verkauf/AnfragenTab'));
const ExposeDetail = lazy(() => import('./verkauf/ExposeDetail'));

const VerkaufPage = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="objekte" replace />} />
      
      {/* Tile routes - 5 tiles per manifest */}
      <Route path="objekte" element={<ObjekteTab />} />
      <Route path="anfragen" element={<AnfragenTab />} />
      <Route path="vorgaenge" element={<VorgaengeTab />} />
      <Route path="reporting" element={<ReportingTab />} />
      {/* Einstellungen removed — was an empty stub (CI-003) */}
      
      {/* Detail routes - unitId für Einheit-basiertes Exposé */}
      <Route path="expose/:unitId" element={<ExposeDetail />} />
      
      {/* Legacy redirect */}
      <Route path="so-funktionierts" element={<Navigate to="/portal/verkauf" replace />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/portal/verkauf" replace />} />
    </Routes>
  );
};

export default VerkaufPage;
