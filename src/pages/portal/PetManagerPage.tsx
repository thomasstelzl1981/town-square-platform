/**
 * MOD-22 Pet Manager — Portal Module Page (Franchise-Partner)
 * Routes: dashboard, pension, services, kalender, leistungen, kunden, finanzen
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';

const PMDashboard = React.lazy(() => import('./petmanager/PMDashboard'));
const PMProfil = React.lazy(() => import('./petmanager/PMProfil'));
const PMPension = React.lazy(() => import('./petmanager/PMPension'));
const PMServices = React.lazy(() => import('./petmanager/PMServices'));
const PMPersonal = React.lazy(() => import('./petmanager/PMPersonal'));
const PMKalender = React.lazy(() => import('./petmanager/PMKalender'));
const PMLeistungen = React.lazy(() => import('./petmanager/PMLeistungen'));
const PMKunden = React.lazy(() => import('./petmanager/PMKunden'));
const PMFinanzen = React.lazy(() => import('./petmanager/PMFinanzen'));

const Loading = () => (
  <div className="flex items-center justify-center p-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

export default function PetManagerPage() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<React.Suspense fallback={<Loading />}><PMDashboard /></React.Suspense>} />
      <Route path="profil" element={<React.Suspense fallback={<Loading />}><PMProfil /></React.Suspense>} />
      <Route path="pension" element={<React.Suspense fallback={<Loading />}><PMPension /></React.Suspense>} />
      <Route path="services" element={<React.Suspense fallback={<Loading />}><PMServices /></React.Suspense>} />
      <Route path="mitarbeiter" element={<React.Suspense fallback={<Loading />}><PMPersonal /></React.Suspense>} />
      <Route path="kalender" element={<React.Suspense fallback={<Loading />}><PMKalender /></React.Suspense>} />
      <Route path="leistungen" element={<React.Suspense fallback={<Loading />}><PMLeistungen /></React.Suspense>} />
      <Route path="kunden" element={<React.Suspense fallback={<Loading />}><PMKunden /></React.Suspense>} />
      <Route path="finanzen" element={<React.Suspense fallback={<Loading />}><PMFinanzen /></React.Suspense>} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
