import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Badge } from '@/components/ui/badge';
import { usePhoneAssistant } from '@/hooks/usePhoneAssistant';
import { StatusForwardingCard } from '@/components/communication-pro/phone-assistant/StatusForwardingCard';
import { VoiceSettingsCard } from '@/components/communication-pro/phone-assistant/VoiceSettingsCard';
import { ContentCard } from '@/components/communication-pro/phone-assistant/ContentCard';
import { RulesCard } from '@/components/communication-pro/phone-assistant/RulesCard';
import { DocumentationCard } from '@/components/communication-pro/phone-assistant/DocumentationCard';
import { TestPreviewCard } from '@/components/communication-pro/phone-assistant/TestPreviewCard';
import { CallLogSection } from '@/components/communication-pro/phone-assistant/CallLogSection';

export default function KiTelefonPage() {
  const {
    config,
    isLoading,
    saveStatus,
    updateConfig,
    calls,
    callsLoading,
    createTestEvent,
    deleteTestEvents,
    refetchAssistant,
  } = usePhoneAssistant();

  if (isLoading || !config) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Laden…</div>
      </PageShell>
    );
  }

  const hasTestData = calls.some(c => c.status === 'test');

  return (
    <PageShell>
      <ModulePageHeader
        title="Telefonassistent"
        description="Konfiguriere Begrüßung, Stimme und Dokumentation. Rufweiterleitung wird extern beim Mobilfunkanbieter eingerichtet."
        actions={
          saveStatus !== 'idle' ? (
            <Badge variant={saveStatus === 'saving' ? 'outline' : 'default'} className="text-xs">
              {saveStatus === 'saving' ? 'Speichert…' : '✓ Gespeichert'}
            </Badge>
          ) : undefined
        }
      />

      <div className="space-y-4 md:space-y-6">
        <StatusForwardingCard config={config} onUpdate={updateConfig} onRefresh={refetchAssistant} />
        <VoiceSettingsCard config={config} onUpdate={updateConfig} />
        <ContentCard config={config} onUpdate={updateConfig} />
        <RulesCard config={config} onUpdate={updateConfig} />
        <DocumentationCard config={config} onUpdate={updateConfig} />
        <TestPreviewCard
          createTestEvent={createTestEvent}
          deleteTestEvents={deleteTestEvents}
          hasTestData={hasTestData}
        />
        <CallLogSection calls={calls} isLoading={callsLoading} createTestEvent={createTestEvent} />
      </div>
    </PageShell>
  );
}
