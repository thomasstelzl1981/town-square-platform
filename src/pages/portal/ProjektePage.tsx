/**
 * Projekte Page (MOD-13) - Developer/Aufteiler Project Management
 * Full Golden Path Implementation
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { KontexteTab, PortfolioTab, VertriebTab, MarketingTab, ProjectDetailPage } from './projekte';

export default function ProjektePage() {
  const content = moduleContents['MOD-13'];
  return (
    <Routes>
      {/* How It Works landing */}
      <Route index element={<ModuleHowItWorks content={content} />} />
      
      {/* Tile routes - 4-Tile Pattern */}
      <Route path="kontexte" element={<KontexteTab />} />
      <Route path="portfolio" element={<PortfolioTab />} />
      <Route path="vertrieb" element={<VertriebTab />} />
      <Route path="marketing" element={<MarketingTab />} />
      
      {/* Project Detail (Projektakte) */}
      <Route path=":projectId" element={<ProjectDetailPage />} />
      
      {/* Legacy redirects */}
      <Route path="uebersicht" element={<Navigate to="/portal/projekte/portfolio" replace />} />
      <Route path="timeline" element={<Navigate to="/portal/projekte/portfolio" replace />} />
      <Route path="dokumente" element={<Navigate to="/portal/projekte/portfolio" replace />} />
      <Route path="einstellungen" element={<Navigate to="/portal/projekte/kontexte" replace />} />
      <Route path="neu" element={<Navigate to="/portal/projekte/portfolio?create=1" replace />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/portal/projekte" replace />} />
    </Routes>
  );
}
