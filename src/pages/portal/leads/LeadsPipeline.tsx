import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { GitBranch, ArrowRight } from 'lucide-react';

export default function LeadsPipeline() {
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
