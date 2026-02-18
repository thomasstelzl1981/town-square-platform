/**
 * Vertriebspartner Page (MOD-09) — Routes Pattern (Leads & SelfieAds migrated to MOD-10)
 */
import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Lazy load sub-pages
const KatalogTab = lazy(() => import('./vertriebspartner/KatalogTab'));
const KatalogDetailPage = lazy(() => import('./vertriebspartner/KatalogDetailPage'));
const BeratungTab = lazy(() => import('./vertriebspartner/BeratungTab'));
const PartnerExposePage = lazy(() => import('./vertriebspartner/PartnerExposePage'));
const KundenTab = lazy(() => import('./vertriebspartner/KundenTab'));
const NetworkTab = lazy(() => import('./vertriebspartner/NetworkTab'));
const ImmoSystemgebuehr = lazy(() => import('./vertriebspartner/ImmoSystemgebuehr'));

const VertriebspartnerPage = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="katalog" replace />} />
      
      {/* Tile routes */}
      <Route path="katalog" element={<KatalogTab />} />
      <Route path="katalog/:publicId" element={<KatalogDetailPage />} />
      <Route path="beratung" element={<BeratungTab />} />
      <Route path="beratung/objekt/:publicId" element={<PartnerExposePage />} />
      <Route path="kunden" element={<KundenTab />} />
      <Route path="network" element={<NetworkTab />} />
      <Route path="systemgebuehr" element={<ImmoSystemgebuehr />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/portal/vertriebspartner" replace />} />
    </Routes>
  );
};

export default VertriebspartnerPage;
