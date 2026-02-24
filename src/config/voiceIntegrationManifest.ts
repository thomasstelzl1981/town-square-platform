/**
 * Voice Integration Manifest — SSOT für Voice-fähige Felder
 * Ausgelagert aus Integrations.tsx (B1)
 */
export interface VoiceField {
  component: string;
  field: string;
  status: 'aktiv' | 'geplant' | 'inaktiv';
}

export const VOICE_ENABLED_FIELDS: VoiceField[] = [
  { component: 'ArmstrongContainer', field: 'Chat-Eingabe', status: 'aktiv' },
  { component: 'ChatPanel', field: 'Chat-Eingabe', status: 'aktiv' },
  { component: 'ComposeEmailDialog', field: 'Betreff / Body', status: 'aktiv' },
  { component: 'CampaignWizard', field: 'Kampagnen-Nachricht', status: 'aktiv' },
  { component: 'ClaimCreateDialog', field: 'Schadensbeschreibung', status: 'aktiv' },
  { component: 'ServiceCaseCreateDialog', field: 'Kurzbeschreibung', status: 'aktiv' },
  { component: 'ScopeDefinitionPanel', field: 'Sanierungsumfang', status: 'aktiv' },
  { component: 'TenderDraftPanel', field: 'Zusätzliche Hinweise', status: 'aktiv' },
  { component: 'DeliveryTab', field: 'Präsentationsnotizen', status: 'aktiv' },
  { component: 'KontakteTab', field: 'Kontakt-Notizen', status: 'aktiv' },
  { component: 'MietyPortalPage', field: 'WhatsApp / E-Mail / Übersetzer', status: 'aktiv' },
];
