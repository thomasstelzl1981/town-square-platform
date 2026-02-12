/**
 * Akquise-Manager Page (MOD-12) — Redesigned with FM pattern
 * Dashboard with widget cards, Mandate detail with stepper + vertical flow
 */

import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ObjekteingangList } from './akquise-manager/ObjekteingangList';
import { ObjekteingangDetail } from './akquise-manager/ObjekteingangDetail';

const AkquiseDashboard = lazy(() => import('./akquise-manager/AkquiseDashboard'));
const AkquiseMandateDetail = lazy(() => import('./akquise-manager/AkquiseMandateDetail'));
const AkquiseTools = lazy(() => import('./akquise-manager/AkquiseTools'));
const MandatCreateWizardManager = lazy(() => import('./akquise-manager/MandatCreateWizardManager'));

export default function AkquiseManagerPage() {
  return (
    <div className="h-full overflow-auto">
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AkquiseDashboard />} />
        <Route path="mandate/neu" element={<MandatCreateWizardManager />} />
        <Route path="mandate/:mandateId" element={<AkquiseMandateDetail />} />
        <Route path="objekteingang" element={<ObjekteingangList />} />
        <Route path="objekteingang/:offerId" element={<ObjekteingangDetail />} />
        <Route path="tools" element={<AkquiseTools />} />
        <Route path="*" element={<Navigate to="/portal/akquise-manager" replace />} />
      </Routes>
    </div>
  );
}
