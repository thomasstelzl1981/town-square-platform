/**
 * Miety Portal Page (MOD-20) — Zuhause-Akte Dossier System
 * Router-only shell with lazy-loaded tiles
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const UebersichtTile = React.lazy(() => import('./miety/tiles/UebersichtTile'));
const VersorgungTile = React.lazy(() => import('./miety/tiles/VersorgungTile'));
const VersicherungenTile = React.lazy(() => import('./miety/tiles/VersicherungenTile'));
const SmartHomeTile = React.lazy(() => import('./miety/tiles/SmartHomeTile'));
const KommunikationTile = React.lazy(() => import('./miety/tiles/KommunikationTile'));
const MietyHomeDossier = React.lazy(() => import('./miety/MietyHomeDossier'));

const Spinner = () => (
  <div className="flex items-center justify-center p-12">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

export default function MietyPortalPage() {
  return (
    <React.Suspense fallback={<Spinner />}>
      <Routes>
        <Route index element={<Navigate to="uebersicht" replace />} />
        <Route path="uebersicht" element={<UebersichtTile />} />
        <Route path="versorgung" element={<VersorgungTile />} />
        <Route path="versicherungen" element={<VersicherungenTile />} />
        <Route path="smarthome" element={<SmartHomeTile />} />
        <Route path="kommunikation" element={<KommunikationTile />} />
        <Route path="zuhause/:homeId" element={<MietyHomeDossier />} />
        <Route path="zaehlerstaende" element={<Navigate to="/portal/miety/versorgung" replace />} />
      </Routes>
    </React.Suspense>
  );
}
