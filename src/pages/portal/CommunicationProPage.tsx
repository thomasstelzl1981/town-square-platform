/**
 * Communication Pro Page (MOD-14) - Blueprint Ready
 * UPDATED: Social tile → SocialPage with internal sidebar + routes
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { Mail, Search, Share2, Bot, Plus, Send } from 'lucide-react';
import { SocialPage } from './communication-pro/social/SocialPage';

function SerienEmailsTile() {
  return (
    <ModuleTilePage
      title="Serien-E-Mails"
      description="Versenden Sie personalisierte E-Mail-Kampagnen"
      icon={Mail}
      moduleBase="communication-pro"
      status="empty"
      emptyTitle="Keine Kampagnen"
      emptyDescription="Erstellen Sie Ihre erste E-Mail-Serie für effektive Kundenkommunikation."
      emptyIcon={Mail}
      primaryAction={{
        label: 'Kampagne erstellen',
        icon: Plus,
        onClick: () => console.log('Kampagne erstellen'),
      }}
      secondaryAction={{
        label: "So funktioniert's",
        href: '/portal/communication-pro',
      }}
    />
  );
}

function RechercheTile() {
  return (
    <ModuleTilePage
      title="Recherche"
      description="Finden Sie potenzielle Kontakte und Leads"
      icon={Search}
      moduleBase="communication-pro"
      status="empty"
      emptyTitle="Keine Suchergebnisse"
      emptyDescription="Starten Sie eine neue Recherche, um passende Kontakte zu finden."
      emptyIcon={Search}
      primaryAction={{
        label: 'Recherche starten',
        icon: Search,
        onClick: () => console.log('Recherche'),
      }}
    />
  );
}

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
      <Route path="serien-emails" element={<SerienEmailsTile />} />
      <Route path="recherche" element={<RechercheTile />} />
      <Route path="social/*" element={<SocialPage />} />
      <Route path="agenten" element={<AgentenTile />} />
      <Route path="*" element={<Navigate to="/portal/communication-pro" replace />} />
    </Routes>
  );
}
