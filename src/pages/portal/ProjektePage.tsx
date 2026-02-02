/**
 * Projekte Page (MOD-13) - Blueprint Ready
 * P0-FIX: Aligned tiles to target structure: uebersicht / timeline / dokumente / einstellungen
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { FolderKanban, LayoutGrid, Clock, FileText, Settings, Plus } from 'lucide-react';

function ProjekteUebersicht() {
  return (
    <ModuleTilePage 
      title="Übersicht" 
      icon={LayoutGrid} 
      moduleBase="projekte" 
      status="empty" 
      emptyTitle="Keine Projekte" 
      emptyDescription="Erstellen Sie Ihr erstes Projekt." 
      primaryAction={{ label: 'Projekt erstellen', icon: Plus, onClick: () => {} }} 
      secondaryAction={{ label: "So funktioniert's", href: '/portal/projekte' }} 
    />
  );
}

function ProjekteTimeline() {
  return (
    <ModuleTilePage 
      title="Timeline" 
      icon={Clock} 
      moduleBase="projekte" 
      status="empty" 
      emptyTitle="Keine Meilensteine" 
      emptyDescription="Definieren Sie Projekt-Meilensteine für die Timeline."
    />
  );
}

function ProjekteDokumente() {
  return (
    <ModuleTilePage 
      title="Dokumente" 
      icon={FileText} 
      moduleBase="projekte" 
      status="empty" 
      emptyTitle="Keine Dokumente" 
      emptyDescription="Laden Sie Projekt-Dokumente hoch."
      primaryAction={{ label: 'Dokument hochladen', onClick: () => {} }}
    />
  );
}

function ProjekteEinstellungen() {
  return (
    <ModuleTilePage 
      title="Einstellungen" 
      icon={Settings} 
      moduleBase="projekte" 
      status="empty" 
      emptyTitle="Projekt-Einstellungen"
      emptyDescription="Konfigurieren Sie Ihre Projekt-Präferenzen."
    />
  );
}

export default function ProjektePage() {
  const content = moduleContents['MOD-13'];
  return (
    <Routes>
      {/* How It Works landing */}
      <Route index element={<ModuleHowItWorks content={content} />} />
      
      {/* Tile routes - aligned to target structure */}
      <Route path="uebersicht" element={<ProjekteUebersicht />} />
      <Route path="timeline" element={<ProjekteTimeline />} />
      <Route path="dokumente" element={<ProjekteDokumente />} />
      <Route path="einstellungen" element={<ProjekteEinstellungen />} />
      
      {/* Legacy redirect for old "portfolio" path */}
      <Route path="portfolio" element={<Navigate to="/portal/projekte/uebersicht" replace />} />
      <Route path="settings" element={<Navigate to="/portal/projekte/einstellungen" replace />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/portal/projekte" replace />} />
    </Routes>
  );
}
