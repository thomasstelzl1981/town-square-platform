/**
 * BrandAssistantPanel — Zone 1 phone assistant management panel.
 * Replaces the old BrandPhonePanel (MOD-14 frozen) with a Zone-1-compliant version.
 */
import { Loader2 } from 'lucide-react';
import { useBrandPhoneAssistant } from '@/hooks/useBrandPhoneAssistant';
import { useBrandKnowledge } from '@/hooks/useBrandKnowledge';
import { ArmstrongIdentityCard } from './ArmstrongIdentityCard';
import { BrandKnowledgeCard } from './BrandKnowledgeCard';
import { AgentSyncCard } from './AgentSyncCard';
// Re-use existing shared cards from MOD-14 (readonly import, no modification)
import { BrandVoiceCard } from './BrandVoiceCard';
import { StatusForwardingCard } from '@/components/communication-pro/phone-assistant/StatusForwardingCard';
import { RulesCard } from '@/components/communication-pro/phone-assistant/RulesCard';
import { DocumentationCard } from '@/components/communication-pro/phone-assistant/DocumentationCard';
import { CallLogSection } from '@/components/communication-pro/phone-assistant/CallLogSection';

interface BrandAssistantPanelProps {
  brandKey: string;
  brandLabel: string;
}

export default function BrandAssistantPanel({ brandKey, brandLabel }: BrandAssistantPanelProps) {
  const {
    config,
    isLoading,
    saveStatus,
    updateConfig,
    calls,
    callsLoading,
    refetchAssistant,
  } = useBrandPhoneAssistant(brandKey);

  const knowledge = useBrandKnowledge(brandKey);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Lade {brandLabel}…</span>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">Assistent konnte nicht geladen werden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Save indicator */}
      {saveStatus !== 'idle' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
          {saveStatus === 'saving' && <><Loader2 className="h-3 w-3 animate-spin" /> Speichern…</>}
          {saveStatus === 'saved' && <span className="text-green-500">✓ Gespeichert</span>}
        </div>
      )}

      {/* Section 1: Armstrong Identity */}
      <ArmstrongIdentityCard brandLabel={brandLabel} config={config} onUpdate={updateConfig} />

      {/* Section 2: Status + Voice (2-column) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatusForwardingCard config={config} onUpdate={updateConfig} onRefresh={refetchAssistant} brandKey={brandKey} />
        <BrandVoiceCard config={config} onUpdate={updateConfig} />
      </div>

      {/* Section 3: Knowledge Store */}
      <BrandKnowledgeCard
        brandKey={brandKey}
        brandLabel={brandLabel}
        items={knowledge.items}
        isLoading={knowledge.isLoading}
        createItem={knowledge.createItem}
        updateItem={knowledge.updateItem}
        deleteItem={knowledge.deleteItem}
      />

      {/* Section 4: Rules + Documentation (2-column) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RulesCard config={config} onUpdate={updateConfig} />
        <DocumentationCard config={config} onUpdate={updateConfig} />
      </div>

      {/* Section 5: Agent Sync */}
      <AgentSyncCard brandKey={brandKey} config={config} onRefresh={refetchAssistant} />

      {/* Section 6: Call Log */}
      <CallLogSection calls={calls} isLoading={callsLoading} />
    </div>
  );
}
