/**
 * BrandPhonePanel — Reusable phone assistant panel for Zone 1 brand management.
 * Shows number status, call log, configuration for a specific brand.
 * Uses the same components as Zone 2 KiTelefonPage but scoped to a brand.
 */
import { Badge } from '@/components/ui/badge';
import { Phone } from 'lucide-react';
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
  // TODO: In a future iteration, each brand will have its own assistant record.
  // For now, show a placeholder with brand info and tier badge.

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Phone className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{brandLabel}</h2>
        <Badge variant={tier === 'premium' ? 'default' : 'secondary'} className="text-xs">
          {tier === 'premium' ? '⭐ Premium (ElevenLabs)' : 'Standard (Twilio TTS)'}
        </Badge>
      </div>

      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center text-muted-foreground">
        <Phone className="mx-auto mb-3 h-10 w-10 opacity-40" />
        <p className="text-sm font-medium">Telefonassistent für {brandLabel}</p>
        <p className="mt-1 text-xs">
          Hier wird der {tier === 'premium' ? 'Premium-Telefonassistent mit ElevenLabs' : 'Standard-Telefonassistent'} für die Marke {brandLabel} konfiguriert.
        </p>
        <p className="mt-3 text-xs text-muted-foreground/60">
          Nummernkauf, Begrüßung, Stimme, Regeln und Anrufprotokoll — alles an einem Ort.
          <br />
          Integration folgt im nächsten Schritt.
        </p>
      </div>
    </div>
  );
}
