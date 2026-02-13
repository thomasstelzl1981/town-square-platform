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

export default function MietyPortalPage() {
  return (
    <React.Suspense fallback={null}>
      <Routes>
        <Route index element={<Navigate to="uebersicht" replace />} />
        <Route path="uebersicht" element={<UebersichtTile />} />
        <Route path="versorgung" element={<VersorgungTile />} />
        <Route path="versicherungen" element={<VersicherungenTile />} />
        <Route path="smarthome" element={<SmartHomeTile />} />
        <Route path="kommunikation" element={<KommunikationTile />} />
        <Route path="zuhause/:homeId" element={<MietyHomeDossier />} />
        <Route path="zaehlerstaende" element={<Navigate to="versorgung" replace />} />
      </Routes>
    </React.Suspense>
  );
}
