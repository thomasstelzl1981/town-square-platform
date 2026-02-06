/**
 * Verkauf Page (MOD-06) - Routes Pattern with How It Works
 * P0-FIX: Removed inner Suspense to prevent nested Suspense deadlock
 */
import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { Settings } from 'lucide-react';

// Lazy load tabs
const ObjekteTab = lazy(() => import('./verkauf/ObjekteTab'));
const ReportingTab = lazy(() => import('./verkauf/ReportingTab'));
const VorgaengeTab = lazy(() => import('./verkauf/VorgaengeTab'));
const AnfragenTab = lazy(() => import('./verkauf/AnfragenTab'));
const ExposeDetail = lazy(() => import('./verkauf/ExposeDetail'));

// Tile: Einstellungen
function EinstellungenTile() {
  return (
    <ModuleTilePage
      title="Einstellungen"
      description="Verkaufseinstellungen und Präferenzen"
      icon={Settings}
      moduleBase="verkauf"
      status="empty"
      emptyTitle="Verkaufs-Einstellungen"
      emptyDescription="Konfigurieren Sie Ihre Verkaufspräferenzen und Standardwerte."
      emptyIcon={Settings}
    />
  );
}

const VerkaufPage = () => {
  const content = moduleContents['MOD-06'];

  return (
    <Routes>
      {/* How It Works as index */}
      <Route index element={<ModuleHowItWorks content={content} />} />
      
      {/* Tile routes - 5 tiles per manifest */}
      <Route path="objekte" element={<ObjekteTab />} />
      <Route path="anfragen" element={<AnfragenTab />} />
      <Route path="vorgaenge" element={<VorgaengeTab />} />
      <Route path="reporting" element={<ReportingTab />} />
      <Route path="einstellungen" element={<EinstellungenTile />} />
      
      {/* Detail routes - unitId für Einheit-basiertes Exposé */}
      <Route path="expose/:unitId" element={<ExposeDetail />} />
      
      {/* Legacy redirect */}
      <Route path="so-funktionierts" element={<Navigate to="/portal/verkauf" replace />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/portal/verkauf" replace />} />
    </Routes>
  );
};

export default VerkaufPage;
