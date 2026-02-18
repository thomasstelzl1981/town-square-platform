/**
 * Projekte Page (MOD-13) - Developer/Aufteiler Project Management
 * P0-FIX: React.lazy for code splitting consistency
 */
import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GoldenPathGuard } from '@/goldenpath/GoldenPathGuard';

const ProjekteDashboard = lazy(() => import('./projekte/ProjekteDashboard'));
const PortfolioTab = lazy(() => import('./projekte/PortfolioTab'));
const VertriebTab = lazy(() => import('./projekte/VertriebTab'));
const LandingPageTab = lazy(() => import('./projekte/LandingPageTab'));
const ProjectDetailPage = lazy(() => import('./projekte/ProjectDetailPage'));
const UnitDetailPage = lazy(() => import('./projekte/UnitDetailPage'));
const KontexteTab = lazy(() => import('./projekte/KontexteTab'));
const ProjekteLeadManager = lazy(() => import('./projekte/ProjekteLeadManager'));

export default function ProjektePage() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      
      {/* Main Tile routes - 4-Tile Pattern */}
      <Route path="dashboard" element={<ProjekteDashboard />} />
      <Route path="projekte" element={<PortfolioTab />} />
      <Route path="vertrieb" element={<VertriebTab />} />
      <Route path="landing-page" element={<LandingPageTab />} />
      
      {/* Hidden route for managing developer contexts */}
      <Route path="kontexte" element={<KontexteTab />} />
      
      {/* Lead Manager for projects */}
      <Route path="lead-manager" element={<ProjekteLeadManager />} />
      
      {/* Project Detail (Projektakte) */}
      <Route path=":projectId" element={
        <GoldenPathGuard moduleCode="MOD-13" entityIdParam="projectId">
          <ProjectDetailPage />
        </GoldenPathGuard>
      } />
      
      {/* Unit Detail (Einheiten-Akte) */}
      <Route path=":projectId/einheit/:unitId" element={
        <GoldenPathGuard moduleCode="MOD-13" entityIdParam="projectId">
          <UnitDetailPage />
        </GoldenPathGuard>
      } />
      
      {/* Legacy redirects */}
      <Route path="portfolio" element={<Navigate to="/portal/projekte/projekte" replace />} />
      <Route path="uebersicht" element={<Navigate to="/portal/projekte/dashboard" replace />} />
      <Route path="timeline" element={<Navigate to="/portal/projekte/projekte" replace />} />
      <Route path="dokumente" element={<Navigate to="/portal/projekte/projekte" replace />} />
      <Route path="einstellungen" element={<Navigate to="/portal/projekte/kontexte" replace />} />
      <Route path="marketing" element={<Navigate to="/portal/projekte/landing-page" replace />} />
      <Route path="neu" element={<Navigate to="/portal/projekte/dashboard?create=1" replace />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/portal/projekte" replace />} />
    </Routes>
  );
}
