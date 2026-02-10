/**
 * Projekte Page (MOD-13) - Developer/Aufteiler Project Management
 * Full Golden Path Implementation
 * 
 * Navigation: Dashboard / Projekte / Vertrieb / Marketing
 */
import { Routes, Route, Navigate } from 'react-router-dom';

import { 
  ProjekteDashboard, 
  PortfolioTab, 
  VertriebTab, 
  LandingPageTab, 
  ProjectDetailPage, 
  UnitDetailPage,
  KontexteTab, 
} from './projekte';

export default function ProjektePage() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      
      {/* Main Tile routes - 4-Tile Pattern */}
      <Route path="dashboard" element={<ProjekteDashboard />} />
      <Route path="projekte" element={<PortfolioTab />} />
      <Route path="vertrieb" element={<VertriebTab />} />
      <Route path="landing-page" element={<LandingPageTab />} />
      
      {/* Hidden route for managing developer contexts (accessible via settings/Projektakte) */}
      <Route path="kontexte" element={<KontexteTab />} />
      
      {/* Project Detail (Projektakte) */}
      <Route path=":projectId" element={<ProjectDetailPage />} />
      
      {/* Unit Detail (Einheiten-Akte) */}
      <Route path=":projectId/einheit/:unitId" element={<UnitDetailPage />} />
      
      {/* Legacy redirects - old routes redirect to new structure */}
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
