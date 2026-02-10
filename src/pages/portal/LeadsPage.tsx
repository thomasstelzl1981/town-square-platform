/**
 * Leads Page (MOD-10) - Routes Pattern with How It Works
 * Includes Selfie Ads Studio routes for Kaufy Social Media partner mandates
 */
import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { Inbox, User, GitBranch, Megaphone, Plus } from 'lucide-react';

// Selfie Ads Studio lazy imports
const SelfieAdsStudio = lazy(() => import('@/pages/portal/leads/SelfieAdsStudio'));
const SelfieAdsPlanen = lazy(() => import('@/pages/portal/leads/SelfieAdsPlanen'));
const SelfieAdsSummary = lazy(() => import('@/pages/portal/leads/SelfieAdsSummary'));
const SelfieAdsKampagnen = lazy(() => import('@/pages/portal/leads/SelfieAdsKampagnen'));
const SelfieAdsPerformance = lazy(() => import('@/pages/portal/leads/SelfieAdsPerformance'));
const SelfieAdsAbrechnung = lazy(() => import('@/pages/portal/leads/SelfieAdsAbrechnung'));

// Tile: Inbox
function LeadsInbox() {
  return (
    <ModuleTilePage
      title="Inbox"
      description="Eingehende Leads übernehmen und priorisieren"
      icon={Inbox}
      moduleBase="leads"
      status="empty"
      emptyTitle="Keine neuen Leads"
      emptyDescription="Neue Leads aus Kampagnen und Anfragen erscheinen hier."
      emptyIcon={Inbox}
      primaryAction={{
        label: 'Lead manuell anlegen',
        icon: Plus,
        onClick: () => console.log('Lead anlegen'),
      }}
      secondaryAction={{
        label: "So funktioniert's",
        href: '/portal/leads',
      }}
    />
  );
}

// Tile: Meine Leads
function MeineLeads() {
  return (
    <ModuleTilePage
      title="Meine Leads"
      description="Ihre zugewiesenen und aktiven Leads"
      icon={User}
      moduleBase="leads"
      status="empty"
      emptyTitle="Keine zugewiesenen Leads"
      emptyDescription="Übernehmen Sie Leads aus der Inbox, um sie hier zu sehen."
      emptyIcon={User}
      secondaryAction={{
        label: 'Zur Inbox',
        href: '/portal/leads/inbox',
      }}
    />
  );
}

// Tile: Pipeline
function LeadsPipeline() {
  return (
    <ModuleTilePage
      title="Pipeline"
      description="Leads durch die Verkaufsphasen führen"
      icon={GitBranch}
      moduleBase="leads"
      status="empty"
      emptyTitle="Pipeline leer"
      emptyDescription="Qualifizierte Leads werden hier nach Status gruppiert."
      emptyIcon={GitBranch}
    />
  );
}

// Tile: Werbung
function LeadsWerbung() {
  return (
    <ModuleTilePage
      title="Werbung"
      description="Kampagnen und Lead-Quellen verwalten"
      icon={Megaphone}
      moduleBase="leads"
      status="empty"
      emptyTitle="Keine Kampagnen"
      emptyDescription="Erstellen Sie Werbekampagnen zur Lead-Generierung."
      emptyIcon={Megaphone}
      primaryAction={{
        label: 'Kampagne erstellen',
        icon: Plus,
        onClick: () => console.log('Kampagne erstellen'),
      }}
    />
  );
}

const LeadsPage = () => {
  const content = moduleContents['MOD-10'];

  return (
    <Routes>
      {/* How It Works as index */}
      <Route index element={<ModuleHowItWorks content={content} />} />
      
      {/* Tile routes */}
      <Route path="inbox" element={<LeadsInbox />} />
      <Route path="meine" element={<MeineLeads />} />
      <Route path="pipeline" element={<LeadsPipeline />} />
      <Route path="werbung" element={<LeadsWerbung />} />
      
      {/* Selfie Ads Studio routes */}
      <Route path="selfie-ads" element={<SelfieAdsStudio />} />
      <Route path="selfie-ads-planen" element={<SelfieAdsPlanen />} />
      <Route path="selfie-ads-summary" element={<SelfieAdsSummary />} />
      <Route path="selfie-ads-kampagnen" element={<SelfieAdsKampagnen />} />
      <Route path="selfie-ads-performance" element={<SelfieAdsPerformance />} />
      <Route path="selfie-ads-abrechnung" element={<SelfieAdsAbrechnung />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/portal/leads" replace />} />
    </Routes>
  );
};

export default LeadsPage;
