/**
 * Leads Page (MOD-10) - Routes Pattern with How It Works
 * Includes Selfie Ads Studio routes for Kaufy Social Media partner mandates
 */
import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const LeadsInbox = lazy(() => import('./leads/LeadsInbox'));
const MeineLeads = lazy(() => import('./leads/MeineLeads'));
const LeadsPipeline = lazy(() => import('./leads/LeadsPipeline'));
const LeadsWerbung = lazy(() => import('./leads/LeadsWerbung'));

// Selfie Ads Studio lazy imports
const SelfieAdsStudio = lazy(() => import('@/pages/portal/leads/SelfieAdsStudio'));
const SelfieAdsPlanen = lazy(() => import('@/pages/portal/leads/SelfieAdsPlanen'));
const SelfieAdsSummary = lazy(() => import('@/pages/portal/leads/SelfieAdsSummary'));
const SelfieAdsKampagnen = lazy(() => import('@/pages/portal/leads/SelfieAdsKampagnen'));
const SelfieAdsPerformance = lazy(() => import('@/pages/portal/leads/SelfieAdsPerformance'));
const SelfieAdsAbrechnung = lazy(() => import('@/pages/portal/leads/SelfieAdsAbrechnung'));

const LeadsPage = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="inbox" replace />} />
      
      {/* Tile routes */}
      <Route path="inbox" element={<LeadsInbox />} />
      <Route path="meine" element={<MeineLeads />} />
      <Route path="pipeline" element={<LeadsPipeline />} />
      <Route path="werbung" element={<LeadsWerbung />} />
      
      {/* Selfie Ads Studio routes */}
      <Route path="selfie-ads" element={<SelfieAdsStudio />} />
      <Route path="selfie-ads-planen" element={<SelfieAdsPlanen />} />
      <Route path="selfie-ads-summary" element={<SelfieAdsSummary />} />
      <Route path="selfie-ads-kampagnen" element={<SelfieAdsKampagnen />} />
      <Route path="selfie-ads-performance" element={<SelfieAdsPerformance />} />
      <Route path="selfie-ads-abrechnung" element={<SelfieAdsAbrechnung />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/portal/leads" replace />} />
    </Routes>
  );
};

export default LeadsPage;
