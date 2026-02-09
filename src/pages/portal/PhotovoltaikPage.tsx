/**
 * Photovoltaik Page (MOD-19) — Full implementation
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import React from 'react';

const AnlagenTab = React.lazy(() => import('@/pages/portal/photovoltaik/AnlagenTab'));
const MonitoringTab = React.lazy(() => import('@/pages/portal/photovoltaik/MonitoringTab'));
const DokumenteTab = React.lazy(() => import('@/pages/portal/photovoltaik/DokumenteTab'));
const EinstellungenTab = React.lazy(() => import('@/pages/portal/photovoltaik/EinstellungenTab'));
const PVCreateWizard = React.lazy(() => import('@/pages/portal/photovoltaik/PVCreateWizard'));
const PVPlantDetail = React.lazy(() => import('@/pages/portal/photovoltaik/PVPlantDetail'));

const Loading = () => (
  <div className="flex items-center justify-center p-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

export default function PhotovoltaikPage() {
  const content = moduleContents['MOD-19'];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <React.Suspense fallback={<Loading />}>
          <Routes>
            <Route index element={<ModuleHowItWorks content={content} />} />
            <Route path="anlagen" element={<AnlagenTab />} />
            <Route path="monitoring" element={<MonitoringTab />} />
            <Route path="dokumente" element={<DokumenteTab />} />
            <Route path="einstellungen" element={<EinstellungenTab />} />
            <Route path="neu" element={<PVCreateWizard />} />
            <Route path=":pvPlantId" element={<PVPlantDetail />} />
            <Route path="*" element={<Navigate to="/portal/photovoltaik" replace />} />
          </Routes>
        </React.Suspense>
      </div>
    </div>
  );
}
