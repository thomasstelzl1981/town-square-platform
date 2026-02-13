/**
 * Photovoltaik Page (MOD-19) — Full implementation
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { GoldenPathGuard } from '@/goldenpath/GoldenPathGuard';

import React from 'react';

const AnlagenTab = React.lazy(() => import('@/pages/portal/photovoltaik/AnlagenTab'));
const MonitoringTab = React.lazy(() => import('@/pages/portal/photovoltaik/MonitoringTab'));
const DokumenteTab = React.lazy(() => import('@/pages/portal/photovoltaik/DokumenteTab'));
const EinstellungenTab = React.lazy(() => import('@/pages/portal/photovoltaik/EinstellungenTab'));
const PVCreateWizard = React.lazy(() => import('@/pages/portal/photovoltaik/PVCreateWizard'));
const PVPlantDetail = React.lazy(() => import('@/pages/portal/photovoltaik/PVPlantDetail'));

export default function PhotovoltaikPage() {
  return (
    <React.Suspense fallback={null}>
      <Routes>
        <Route index element={<Navigate to="anlagen" replace />} />
        <Route path="anlagen" element={<AnlagenTab />} />
        <Route path="monitoring" element={<MonitoringTab />} />
        <Route path="dokumente" element={<DokumenteTab />} />
        <Route path="einstellungen" element={<EinstellungenTab />} />
        <Route path="neu" element={<PVCreateWizard />} />
        <Route path=":pvPlantId" element={
          <GoldenPathGuard moduleCode="MOD-19" entityIdParam="pvPlantId">
            <PVPlantDetail />
          </GoldenPathGuard>
        } />
        <Route path="*" element={<Navigate to="/portal/photovoltaik" replace />} />
      </Routes>
    </React.Suspense>
  );
}
