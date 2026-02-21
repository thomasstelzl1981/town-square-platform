import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const KiBrowserUebersicht = React.lazy(() => import('@/pages/portal/ki-browser/KiBrowserUebersicht'));
const KiBrowserSession = React.lazy(() => import('@/pages/portal/ki-browser/KiBrowserSession'));
const KiBrowserQuellen = React.lazy(() => import('@/pages/portal/ki-browser/KiBrowserQuellen'));
const KiBrowserVorlagen = React.lazy(() => import('@/pages/portal/ki-browser/KiBrowserVorlagen'));
const KiBrowserPolicies = React.lazy(() => import('@/pages/portal/ki-browser/KiBrowserPolicies'));

const KiBrowserPage = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="uebersicht" replace />} />
      <Route path="uebersicht" element={
        <React.Suspense fallback={<div className="p-4 text-muted-foreground">Laden...</div>}>
          <KiBrowserUebersicht />
        </React.Suspense>
      } />
      <Route path="session" element={
        <React.Suspense fallback={<div className="p-4 text-muted-foreground">Laden...</div>}>
          <KiBrowserSession />
        </React.Suspense>
      } />
      <Route path="quellen" element={
        <React.Suspense fallback={<div className="p-4 text-muted-foreground">Laden...</div>}>
          <KiBrowserQuellen />
        </React.Suspense>
      } />
      <Route path="vorlagen" element={
        <React.Suspense fallback={<div className="p-4 text-muted-foreground">Laden...</div>}>
          <KiBrowserVorlagen />
        </React.Suspense>
      } />
      <Route path="policies" element={
        <React.Suspense fallback={<div className="p-4 text-muted-foreground">Laden...</div>}>
          <KiBrowserPolicies />
        </React.Suspense>
      } />
    </Routes>
  );
};

export default KiBrowserPage;
