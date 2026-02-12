import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { User, ArrowRight } from 'lucide-react';

export default function MeineLeads() {
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
