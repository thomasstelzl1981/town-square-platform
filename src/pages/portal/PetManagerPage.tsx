/**
 * MOD-22 Pet Manager — Portal Module Page (Franchise-Partner)
 * Routes: buchungen, leistungen, zahlungen, kunden, uebersicht
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';

const PMDashboard = React.lazy(() => import('./petmanager/PMDashboard'));
const PMBuchungen = React.lazy(() => import('./petmanager/PMBuchungen'));
const PMKalender = React.lazy(() => import('./petmanager/PMKalender'));
const PMLeistungen = React.lazy(() => import('./petmanager/PMLeistungen'));
const PMKunden = React.lazy(() => import('./petmanager/PMKunden'));
const PMFinanzen = React.lazy(() => import('./petmanager/PMFinanzen'));
const PMRaeume = React.lazy(() => import('./petmanager/PMRaeume'));

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
      <Route path="buchungen" element={<React.Suspense fallback={<Loading />}><PMBuchungen /></React.Suspense>} />
      <Route path="kalender" element={<React.Suspense fallback={<Loading />}><PMKalender /></React.Suspense>} />
      <Route path="leistungen" element={<React.Suspense fallback={<Loading />}><PMLeistungen /></React.Suspense>} />
      <Route path="raeume" element={<React.Suspense fallback={<Loading />}><PMRaeume /></React.Suspense>} />
      <Route path="kunden" element={<React.Suspense fallback={<Loading />}><PMKunden /></React.Suspense>} />
      <Route path="finanzen" element={<React.Suspense fallback={<Loading />}><PMFinanzen /></React.Suspense>} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
