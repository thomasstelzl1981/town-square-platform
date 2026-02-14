/**
 * Photovoltaik Page (MOD-19) — Restructured: Anlagen, Enpal, Dokumente, Einstellungen
 * No wizard, no monitoring tab — monitoring is integrated into the plant dossier
 * Sub-navigation is handled by the manifest-driven ModulePage shell — no local SubTabNav.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';

const AnlagenTab = React.lazy(() => import('@/pages/portal/photovoltaik/AnlagenTab'));
const EnpalTab = React.lazy(() => import('@/pages/portal/photovoltaik/EnpalTab'));
const DokumenteTab = React.lazy(() => import('@/pages/portal/photovoltaik/DokumenteTab'));
const EinstellungenTab = React.lazy(() => import('@/pages/portal/photovoltaik/EinstellungenTab'));

export default function PhotovoltaikPage() {
  return (
    <React.Suspense fallback={null}>
      <Routes>
        <Route index element={<Navigate to="anlagen" replace />} />
        <Route path="anlagen" element={<AnlagenTab />} />
        <Route path="enpal" element={<EnpalTab />} />
        <Route path="dokumente" element={<DokumenteTab />} />
        <Route path="einstellungen" element={<EinstellungenTab />} />
        <Route path="*" element={<Navigate to="/portal/photovoltaik" replace />} />
      </Routes>
    </React.Suspense>
  );
}
