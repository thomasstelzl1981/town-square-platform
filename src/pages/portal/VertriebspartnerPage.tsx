/**
 * Vertriebspartner Page (MOD-09) - Routes Pattern with How It Works
 * P0-FIX: Removed inner Suspense to prevent nested Suspense deadlock
 */
import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';

// Lazy load sub-pages
const KatalogTab = lazy(() => import('./vertriebspartner/KatalogTab'));
const KatalogDetailPage = lazy(() => import('./vertriebspartner/KatalogDetailPage'));
const BeratungTab = lazy(() => import('./vertriebspartner/BeratungTab'));
const PartnerExposePage = lazy(() => import('./vertriebspartner/PartnerExposePage'));
const KundenTab = lazy(() => import('./vertriebspartner/KundenTab'));
const NetworkTab = lazy(() => import('./vertriebspartner/NetworkTab'));

const VertriebspartnerPage = () => {
  const content = moduleContents['MOD-09'];

  return (
    <Routes>
      {/* How It Works as index */}
      <Route index element={<ModuleHowItWorks content={content} />} />
      
      {/* Tile routes */}
      <Route path="katalog" element={<KatalogTab />} />
      <Route path="katalog/:publicId" element={<KatalogDetailPage />} />
      <Route path="beratung" element={<BeratungTab />} />
      <Route path="beratung/objekt/:publicId" element={<PartnerExposePage />} />
      <Route path="kunden" element={<KundenTab />} />
      <Route path="network" element={<NetworkTab />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/portal/vertriebspartner" replace />} />
    </Routes>
  );
};

export default VertriebspartnerPage;
