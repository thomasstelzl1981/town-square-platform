/**
 * ENG-SLC — Sales Lifecycle Controller: Specification
 * 
 * Pure types, interfaces, constants. NO logic, NO side effects.
 * 
 * @engine ENG-SLC
 * @version 1.0.0
 * @scope Cross-Module (MOD-04, MOD-06, MOD-13)
 */

// ─── SLC Phases ───────────────────────────────────────────────
export type SLCPhase =
  | 'mandate_active'     // Verkaufsauftrag erteilt, Listing erstellt
  | 'published'          // In mindestens einem Kanal veröffentlicht
  | 'inquiry'            // Qualifizierte Anfrage eingegangen
  | 'reserved'           // Einheit reserviert für einen Käufer
  | 'contract_draft'     // Kaufvertragsentwurf erstellt
  | 'notary_scheduled'   // Notartermin vereinbart
  | 'notary_completed'   // Beurkundung erfolgt
  | 'handover'           // Übergabe durchgeführt
  | 'settlement'         // Provision + Plattformanteil abgerechnet
  | 'closed_won'         // Abgeschlossen (Verkauf erfolgreich)
  | 'closed_lost';       // Abgeschlossen (kein Verkauf)

export const SLC_PHASE_ORDER: SLCPhase[] = [
  'mandate_active',
  'published',
  'inquiry',
  'reserved',
  'contract_draft',
  'notary_scheduled',
  'notary_completed',
  'handover',
  'settlement',
  'closed_won',
];

export const SLC_PHASE_LABELS: Record<SLCPhase, string> = {
  mandate_active: 'Verkaufsauftrag aktiv',
  published: 'Veröffentlicht',
  inquiry: 'Anfrage eingegangen',
  reserved: 'Reserviert',
  contract_draft: 'Kaufvertragsentwurf',
  notary_scheduled: 'Notartermin vereinbart',
  notary_completed: 'Beurkundet',
  handover: 'Übergabe',
  settlement: 'Abrechnung',
  closed_won: 'Abgeschlossen (Verkauf)',
  closed_lost: 'Abgeschlossen (kein Verkauf)',
};

// ─── Event Types ──────────────────────────────────────────────
export type SLCEventType =
  // Mandat
  | 'mandate.activated'
  | 'mandate.revoked'
  // Distribution
  | 'channel.published'
  | 'channel.sync_failed'
  | 'channel.removed'
  // Deal
  | 'deal.inquiry_received'
  | 'deal.viewing_scheduled'
  | 'deal.reserved'
  | 'deal.reservation_expired'
  | 'deal.reservation_cancelled'
  // Vertrag
  | 'deal.contract_drafted'
  | 'deal.contract_sent'
  // Notar
  | 'deal.notary_scheduled'
  | 'deal.notary_completed'
  // Übergabe
  | 'deal.handover_completed'
  // Settlement
  | 'deal.commission_calculated'
  | 'deal.platform_share_settled'
  // Lifecycle
  | 'case.closed_won'
  | 'case.closed_lost'
  | 'case.reopened';

export type SLCEventSeverity = 'info' | 'warning' | 'error';

export type SLCAssetType = 'property_unit' | 'project_unit';

export type SLCCloseReason = 'won' | 'lost' | 'withdrawn';

// ─── Interfaces ───────────────────────────────────────────────

export interface SLCCase {
  id: string;
  asset_type: SLCAssetType;
  asset_id: string;
  property_id: string | null;
  project_id: string | null;
  listing_id: string | null;
  current_phase: SLCPhase;
  deal_contact_id: string | null;
  tenant_id: string;
  opened_at: string;
  closed_at: string | null;
  close_reason: SLCCloseReason | null;
}

export interface SLCEvent {
  id: string;
  case_id: string;
  event_type: SLCEventType;
  severity: SLCEventSeverity;
  phase_before: SLCPhase | null;
  phase_after: SLCPhase | null;
  actor_id: string | null;
  payload: Record<string, unknown>;
  tenant_id: string;
  created_at: string;
}

export interface ChannelProjection {
  channel: string;
  listing_id: string;
  expected_hash: string | null;
  last_synced_hash: string | null;
  last_synced_at: string | null;
  is_drifted: boolean;
}

// ─── Constants ────────────────────────────────────────────────

/** Threshold in days after which a case in a phase is considered "stuck" */
export const SLC_STUCK_THRESHOLDS: Partial<Record<SLCPhase, number>> = {
  mandate_active: 14,   // 2 Wochen ohne Veröffentlichung
  published: 60,        // 60 Tage ohne Anfrage
  inquiry: 21,          // 3 Wochen ohne Reservierung
  reserved: 30,         // 30 Tage ohne Kaufvertrag
  contract_draft: 14,   // 2 Wochen ohne Notartermin
  notary_scheduled: 30, // 30 Tage bis zum Termin
  settlement: 30,       // 30 Tage bis zur Abrechnung
};

/** Map event types → resulting phase transitions */
export const SLC_EVENT_PHASE_MAP: Partial<Record<SLCEventType, SLCPhase>> = {
  'mandate.activated': 'mandate_active',
  'channel.published': 'published',
  'deal.inquiry_received': 'inquiry',
  'deal.reserved': 'reserved',
  'deal.contract_drafted': 'contract_draft',
  'deal.notary_scheduled': 'notary_scheduled',
  'deal.notary_completed': 'notary_completed',
  'deal.handover_completed': 'handover',
  'deal.platform_share_settled': 'settlement',
  'case.closed_won': 'closed_won',
  'case.closed_lost': 'closed_lost',
};

export const SLC_ENGINE_VERSION = '1.0.0';
