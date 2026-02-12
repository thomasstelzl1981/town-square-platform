import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { Megaphone } from 'lucide-react';

export default function LeadsWerbung() {
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
