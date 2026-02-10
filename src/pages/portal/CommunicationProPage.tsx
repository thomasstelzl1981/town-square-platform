/**
 * Communication Pro Page (MOD-14) - Blueprint Ready
 * UPDATED: Recherche → real 3-tile ResearchTab (moved from MOD-02 Widgets)
 * Social tile → SocialPage with internal sidebar + routes
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { Bot } from 'lucide-react';
import { SocialPage } from './communication-pro/social/SocialPage';
import { SerienEmailsPage } from './communication-pro/SerienEmailsPage';
import { ResearchTab } from './communication-pro/recherche/ResearchTab';

function AgentenTile() {
  return (
    <ModuleTilePage
      title="Agenten"
      description="KI-gestützte Kommunikationsautomatisierung"
      icon={Bot}
      moduleBase="communication-pro"
      status="empty"
      emptyTitle="Keine Agenten aktiv"
      emptyDescription="Aktivieren Sie KI-Agenten für automatisierte Kommunikation."
      emptyIcon={Bot}
      primaryAction={{
        label: 'Agent aktivieren',
        icon: Bot,
        onClick: () => console.log('Agent'),
      }}
    />
  );
}

export default function CommunicationProPage() {
  const content = moduleContents['MOD-14'];

  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
      <Route path="serien-emails" element={<SerienEmailsPage />} />
      <Route path="recherche" element={<ResearchTab />} />
      <Route path="social/*" element={<SocialPage />} />
      <Route path="agenten" element={<AgentenTile />} />
      <Route path="*" element={<Navigate to="/portal/communication-pro" replace />} />
    </Routes>
  );
}
