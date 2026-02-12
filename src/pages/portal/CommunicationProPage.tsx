/**
 * Communication Pro Page (MOD-14) - Blueprint Ready
 * UPDATED: Recherche → real 3-tile ResearchTab (moved from MOD-02 Widgets)
 * Social tile → SocialPage with internal sidebar + routes
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { toast } from 'sonner';

import { SocialPage } from './communication-pro/social/SocialPage';
import { SerienEmailsPage } from './communication-pro/SerienEmailsPage';
import { ResearchTab } from './communication-pro/recherche/ResearchTab';
import { AgentenPage } from './communication-pro/AgentenPage';

export default function CommunicationProPage() {
  return (
    <Routes>
      <Route index element={<Navigate to="serien-emails" replace />} />
      <Route path="serien-emails" element={<SerienEmailsPage />} />
      <Route path="recherche" element={<ResearchTab />} />
      <Route path="social/*" element={<SocialPage />} />
      <Route path="agenten" element={<AgentenPage />} />
      <Route path="*" element={<Navigate to="/portal/communication-pro" replace />} />
    </Routes>
  );
}
