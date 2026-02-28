/**
 * BrandPhonePanel — Zone 1 phone assistant panel for a specific brand.
 * Uses useBrandPhoneAssistant hook (brand_key scoped) instead of usePhoneAssistant (user_id scoped).
 */
import { Badge } from '@/components/ui/badge';
import { Phone, Loader2, Save, CheckCircle } from 'lucide-react';
import { useBrandPhoneAssistant } from '@/hooks/useBrandPhoneAssistant';
import { StatusForwardingCard } from './StatusForwardingCard';
import { VoiceSettingsCard } from './VoiceSettingsCard';
import { ContentCard } from './ContentCard';
import { RulesCard } from './RulesCard';
import { DocumentationCard } from './DocumentationCard';
import { CallLogSection } from './CallLogSection';

interface BrandPhonePanelProps {
  brandKey: string;
  brandLabel: string;
  tier: 'standard' | 'premium';
}

export default function BrandPhonePanel({ brandKey, brandLabel, tier }: BrandPhonePanelProps) {
  const {
    config,
    isLoading,
    saveStatus,
    updateConfig,
    calls,
    callsLoading,
    refetchAssistant,
  } = useBrandPhoneAssistant(brandKey);

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Phone className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{brandLabel}</h2>
          <Badge variant={tier === 'premium' ? 'default' : 'secondary'} className="text-xs">
            {tier === 'premium' ? '⭐ Premium (ElevenLabs)' : 'Standard (Twilio TTS)'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {saveStatus === 'saving' && <><Save className="h-3 w-3 animate-pulse" /> Speichern…</>}
          {saveStatus === 'saved' && <><CheckCircle className="h-3 w-3 text-green-500" /> Gespeichert</>}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatusForwardingCard config={config} onUpdate={updateConfig} onRefresh={refetchAssistant} />
        <VoiceSettingsCard config={config} onUpdate={updateConfig} />
        <ContentCard config={config} onUpdate={updateConfig} />
        <RulesCard config={config} onUpdate={updateConfig} />
        <div className="lg:col-span-2">
          <DocumentationCard config={config} onUpdate={updateConfig} />
        </div>
      </div>

      {/* Call Log */}
      <CallLogSection calls={calls} isLoading={callsLoading} />
    </div>
  );
}
