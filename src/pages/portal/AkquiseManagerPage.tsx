/**
 * Akquise-Manager Page (MOD-12) — Redesigned with FM pattern
 * Dashboard with widget cards, Mandate detail with stepper + vertical flow
 */

import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GoldenPathGuard } from '@/goldenpath/GoldenPathGuard';
import { ObjekteingangList } from './akquise-manager/ObjekteingangList';
import { ObjekteingangDetail } from './akquise-manager/ObjekteingangDetail';

const AkquiseDashboard = lazy(() => import('./akquise-manager/AkquiseDashboard'));
const AkquiseMandate = lazy(() => import('./akquise-manager/AkquiseMandate'));
const AkquiseMandateDetail = lazy(() => import('./akquise-manager/AkquiseMandateDetail'));
const AkquiseTools = lazy(() => import('./akquise-manager/AkquiseTools'));
const AkquiseDatenbank = lazy(() => import('./akquise-manager/AkquiseDatenbank'));
const AkquiseSystemgebuehr = lazy(() => import('./akquise-manager/AkquiseSystemgebuehr'));

export default function AkquiseManagerPage() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<AkquiseDashboard />} />
      <Route path="mandate" element={<AkquiseMandate />} />
      <Route path="mandate/neu" element={<Navigate to="/portal/akquise-manager/mandate" replace />} />
      <Route path="mandate/:mandateId" element={
        <GoldenPathGuard moduleCode="MOD-12" entityIdParam="mandateId">
          <AkquiseMandateDetail />
        </GoldenPathGuard>
      } />
      <Route path="objekteingang" element={<ObjekteingangList />} />
      <Route path="objekteingang/:offerId" element={
        <GoldenPathGuard moduleCode="MOD-12" entityIdParam="offerId">
          <ObjekteingangDetail />
        </GoldenPathGuard>
      } />
      <Route path="tools" element={<AkquiseTools />} />
      <Route path="datenbank" element={<AkquiseDatenbank />} />
      <Route path="systemgebuehr" element={<AkquiseSystemgebuehr />} />
      <Route path="*" element={<Navigate to="/portal/akquise-manager" replace />} />
    </Routes>
  );
}
