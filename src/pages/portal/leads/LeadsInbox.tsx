import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { Inbox, Megaphone, ArrowRight } from 'lucide-react';

export default function LeadsInbox() {
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
