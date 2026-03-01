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
import { PhoneBillingCard } from '@/components/communication-pro/phone-assistant/PhoneBillingCard';
import { Phone, Mic, FileText } from 'lucide-react';

export default function KiTelefonPage() {
  const {
    config,
    isLoading,
    saveStatus,
    updateConfig,
    calls,
    callsLoading,
    usageSummary,
    usageLoading,
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
  const hasNumber = !!config.twilio_phone_number_e164;

  return (
    <PageShell>
      <ModulePageHeader
        title="KI-Telefonassistent"
        description="Ihr persönlicher Sprachassistent mit modernster KI-Technologie. Deutsche Festnetznummer, natürliche Sprachsynthese, automatische Dokumentation — direkt aus Ihrem System."
        actions={
          saveStatus !== 'idle' ? (
            <Badge variant={saveStatus === 'saving' ? 'outline' : 'default'} className="text-xs">
              {saveStatus === 'saving' ? 'Speichert…' : '✓ Gespeichert'}
            </Badge>
          ) : undefined
        }
      />

      {/* Feature Highlight Banner */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
          <Phone className="h-4 w-4 text-primary shrink-0" />
          <div>
            <p className="text-xs font-medium">Twilio</p>
            <p className="text-[10px] text-muted-foreground">Deutsche Festnetznummer</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
          <Mic className="h-4 w-4 text-primary shrink-0" />
          <div>
            <p className="text-xs font-medium">ElevenLabs</p>
            <p className="text-[10px] text-muted-foreground">Natürliche KI-Stimme</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <div>
            <p className="text-xs font-medium">Auto-Doku</p>
            <p className="text-[10px] text-muted-foreground">Transkript & Aufgaben</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6">
        <StatusForwardingCard config={config} onUpdate={updateConfig} onRefresh={refetchAssistant} />
        <PhoneBillingCard usage={usageSummary} isLoading={usageLoading} hasNumber={hasNumber} />
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
