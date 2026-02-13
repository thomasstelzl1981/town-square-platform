/**
 * Communication Pro Page (MOD-14) - Blueprint Ready
 * UPDATED: Recherche → real 3-tile ResearchTab (moved from MOD-02 Widgets)
 * Social tile → SocialPage with internal sidebar + routes
 * 
 * OPTIMIZED: Lazy imports for sub-tab code-splitting
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const SocialPage = lazy(() => import('./communication-pro/social/SocialPage').then(m => ({ default: m.SocialPage })));
const SerienEmailsPage = lazy(() => import('./communication-pro/SerienEmailsPage').then(m => ({ default: m.SerienEmailsPage })));
const ResearchTab = lazy(() => import('./communication-pro/recherche/ResearchTab').then(m => ({ default: m.ResearchTab })));
const KiTelefonPage = lazy(() => import('./communication-pro/ki-telefon/KiTelefonPage'));

export default function CommunicationProPage() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route index element={<Navigate to="serien-emails" replace />} />
        <Route path="serien-emails" element={<SerienEmailsPage />} />
        <Route path="recherche" element={<ResearchTab />} />
        <Route path="social/*" element={<SocialPage />} />
        <Route path="ki-telefon" element={<KiTelefonPage />} />
        <Route path="*" element={<Navigate to="/portal/communication-pro" replace />} />
      </Routes>
    </Suspense>
  );
}
