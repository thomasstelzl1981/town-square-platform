/**
 * Leads Page (MOD-10) - Routes Pattern with How It Works
 * Includes Selfie Ads Studio routes for Kaufy Social Media partner mandates
 */
import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { Inbox, User, GitBranch, Megaphone, Plus, ArrowRight } from 'lucide-react';

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
      emptyTitle="Ihre Lead-Inbox ist bereit"
      emptyDescription="Hier erscheinen automatisch neue Leads aus Kampagnen, Webformularen und Partner-Zuweisungen."
      emptyIcon={Inbox}
      primaryAction={{
        label: 'Selfie Ads Studio öffnen',
        icon: Megaphone,
        href: '/portal/leads/selfie-ads',
      }}
      secondaryAction={{
        label: 'Zur Werbung',
        href: '/portal/leads/werbung',
      }}
      quickSteps={[
        'Erstellen Sie eine Werbekampagne oder teilen Sie Ihr Kontaktformular.',
        'Eingehende Leads erscheinen automatisch hier.',
        'Übernehmen und qualifizieren Sie die besten Kontakte.',
      ]}
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
      emptyTitle="Noch keine Leads übernommen"
      emptyDescription="Übernehmen Sie Leads aus der Inbox, um sie persönlich zu bearbeiten."
      emptyIcon={User}
      primaryAction={{
        label: 'Zur Inbox',
        icon: ArrowRight,
        href: '/portal/leads/inbox',
      }}
      quickSteps={[
        'Prüfen Sie eingehende Leads in der Inbox.',
        'Übernehmen Sie passende Leads.',
        'Führen Sie sie durch Ihre Pipeline zum Abschluss.',
      ]}
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
      emptyTitle="Pipeline starten"
      emptyDescription="Qualifizierte Leads durchlaufen hier Ihre Verkaufsphasen von der Erstansprache bis zum Abschluss."
      emptyIcon={GitBranch}
      primaryAction={{
        label: 'Zur Inbox',
        icon: ArrowRight,
        href: '/portal/leads/inbox',
      }}
      quickSteps={[
        'Übernehmen Sie Leads aus der Inbox.',
        'Setzen Sie den Status je nach Gesprächsfortschritt.',
        'Verfolgen Sie die Conversion pro Phase.',
      ]}
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
      emptyTitle="Werbung & Kampagnen"
      emptyDescription="Beauftragen Sie Selfie Ads Kampagnen oder verwalten Sie bestehende Lead-Quellen."
      emptyIcon={Megaphone}
      primaryAction={{
        label: 'Selfie Ads Studio öffnen',
        icon: Megaphone,
        href: '/portal/leads/selfie-ads',
      }}
      quickSteps={[
        'Planen Sie Ihre erste Kampagne im Selfie Ads Studio.',
        'Kaufy veröffentlicht Ihre Anzeigen auf Social Media.',
        'Leads erscheinen automatisch in Ihrer Inbox.',
      ]}
    />
  );
}

const LeadsPage = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="inbox" replace />} />
      
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
