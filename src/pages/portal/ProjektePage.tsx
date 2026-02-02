/**
 * Projekte Page (MOD-13) - Blueprint Ready
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { FolderKanban, LayoutGrid, Clock, Settings, Plus } from 'lucide-react';

function ProjekteUebersicht() {
  return <ModuleTilePage title="Übersicht" icon={LayoutGrid} moduleBase="projekte" status="empty" emptyTitle="Keine Projekte" emptyDescription="Erstellen Sie Ihr erstes Projekt." primaryAction={{ label: 'Projekt erstellen', icon: Plus, onClick: () => {} }} secondaryAction={{ label: "So funktioniert's", href: '/portal/projekte' }} />;
}
function ProjektePortfolio() {
  return <ModuleTilePage title="Portfolio" icon={FolderKanban} moduleBase="projekte" status="empty" emptyTitle="Leeres Portfolio" primaryAction={{ label: 'Projekt hinzufügen', onClick: () => {} }} />;
}
function ProjekteTimeline() {
  return <ModuleTilePage title="Timeline" icon={Clock} moduleBase="projekte" status="empty" emptyTitle="Keine Meilensteine" />;
}
function ProjekteSettings() {
  return <ModuleTilePage title="Einstellungen" icon={Settings} moduleBase="projekte" status="empty" emptyTitle="Einstellungen" />;
}

export default function ProjektePage() {
  const content = moduleContents['MOD-13'];
  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
      <Route path="uebersicht" element={<ProjekteUebersicht />} />
      <Route path="portfolio" element={<ProjektePortfolio />} />
      <Route path="timeline" element={<ProjekteTimeline />} />
      <Route path="settings" element={<ProjekteSettings />} />
      <Route path="*" element={<Navigate to="/portal/projekte" replace />} />
    </Routes>
  );
}
