/**
 * Leads Page (MOD-10) - Routes Pattern with How It Works
 */
import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { Inbox, User, GitBranch, Megaphone, Plus, Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

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
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* How It Works as index */}
        <Route index element={<ModuleHowItWorks content={content} />} />
        
        {/* Tile routes */}
        <Route path="inbox" element={<LeadsInbox />} />
        <Route path="meine" element={<MeineLeads />} />
        <Route path="pipeline" element={<LeadsPipeline />} />
        <Route path="werbung" element={<LeadsWerbung />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/portal/leads" replace />} />
      </Routes>
    </Suspense>
  );
};

export default LeadsPage;
