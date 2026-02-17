/**
 * Miety Portal Page (MOD-20) — Zuhause: Alle Tiles inline gestapelt
 */

import React from 'react';

const UebersichtTile = React.lazy(() => import('./miety/tiles/UebersichtTile'));
const VersorgungTile = React.lazy(() => import('./miety/tiles/VersorgungTile'));
const SmartHomeTile = React.lazy(() => import('./miety/tiles/SmartHomeTile'));
const KommunikationTile = React.lazy(() => import('./miety/tiles/KommunikationTile'));

export default function MietyPortalPage() {
  return (
    <React.Suspense fallback={null}>
      <UebersichtTile />
      <VersorgungTile />
      <SmartHomeTile />
      <KommunikationTile />
    </React.Suspense>
  );
}
