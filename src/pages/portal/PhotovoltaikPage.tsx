/**
 * Photovoltaik Page (MOD-19) — Restructured: Anlagen, Enpal, Dokumente, Einstellungen
 * No wizard, no monitoring tab — monitoring is integrated into the plant dossier
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { SubTabNav } from '@/components/shared/SubTabNav';
import React from 'react';

const AnlagenTab = React.lazy(() => import('@/pages/portal/photovoltaik/AnlagenTab'));
const EnpalTab = React.lazy(() => import('@/pages/portal/photovoltaik/EnpalTab'));
const DokumenteTab = React.lazy(() => import('@/pages/portal/photovoltaik/DokumenteTab'));
const EinstellungenTab = React.lazy(() => import('@/pages/portal/photovoltaik/EinstellungenTab'));

const PV_TABS = [
  { title: 'Anlagen', route: '/portal/photovoltaik/anlagen' },
  { title: 'Enpal', route: '/portal/photovoltaik/enpal' },
  { title: 'Dokumente', route: '/portal/photovoltaik/dokumente' },
  { title: 'Einstellungen', route: '/portal/photovoltaik/einstellungen' },
];

export default function PhotovoltaikPage() {
  return (
    <React.Suspense fallback={null}>
      <div className="px-2 md:px-6 pt-3 md:pt-4">
        <SubTabNav tabs={PV_TABS} />
      </div>
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
