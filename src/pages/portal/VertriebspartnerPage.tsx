/**
 * Vertriebspartner Page (MOD-09) - Routes Pattern with Leads & Selfie Ads
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
const LeadsTab = lazy(() => import('./vertriebspartner/LeadsTab'));

// Selfie Ads Studio
const SelfieAdsStudio = lazy(() => import('./vertriebspartner/SelfieAdsStudio'));
const SelfieAdsPlanen = lazy(() => import('./vertriebspartner/SelfieAdsPlanen'));
const SelfieAdsSummary = lazy(() => import('./vertriebspartner/SelfieAdsSummary'));
const SelfieAdsKampagnen = lazy(() => import('./vertriebspartner/SelfieAdsKampagnen'));
const SelfieAdsPerformance = lazy(() => import('./vertriebspartner/SelfieAdsPerformance'));
const SelfieAdsAbrechnung = lazy(() => import('./vertriebspartner/SelfieAdsAbrechnung'));

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
      <Route path="leads" element={<LeadsTab />} />
      
      {/* Selfie Ads Studio routes */}
      <Route path="selfie-ads" element={<SelfieAdsStudio />} />
      <Route path="selfie-ads-planen" element={<SelfieAdsPlanen />} />
      <Route path="selfie-ads-summary" element={<SelfieAdsSummary />} />
      <Route path="selfie-ads-kampagnen" element={<SelfieAdsKampagnen />} />
      <Route path="selfie-ads-performance" element={<SelfieAdsPerformance />} />
      <Route path="selfie-ads-abrechnung" element={<SelfieAdsAbrechnung />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/portal/vertriebspartner" replace />} />
    </Routes>
  );
};

export default VertriebspartnerPage;
