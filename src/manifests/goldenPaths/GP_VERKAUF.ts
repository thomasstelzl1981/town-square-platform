import type { GoldenPathDefinition } from './types';

/**
 * Golden Path GP-VERKAUF: Verkaufszyklus (SLC — Sales Lifecycle Controller)
 * 
 * 11-step workflow matching SLC phases from Mandate activation to Settlement/Close.
 * Cross-zone: Z2 (MOD-04/13) → Z1 (Sales Desk) → Z3 (Kaufy/Partner) → Z2 (Käufer)
 * 
 * P0 Hardening: Fail-States for all cross-zone steps.
 */
export const GP_VERKAUF_GOLDEN_PATH: GoldenPathDefinition = {
  id: 'gp-verkauf-lifecycle',
  module: 'MOD-04/MOD-06/MOD-13',
  moduleCode: 'MOD-06',
  version: '1.0.0',
  label: 'Verkaufszyklus (SLC) — Vom Mandat bis zum Settlement',
  description:
    'Vollständiger Verkaufszyklus: Mandat aktivieren, Objekt veröffentlichen, Anfragen bearbeiten, Reservierung, Kaufvertrag, Notar, Übergabe, Abrechnung. 11-Phasen State Machine mit Drift- und Stuck-Detection.',

  required_entities: [
    { table: 'sales_cases', description: 'Verkaufsfall muss existieren', scope: 'entity_id' },
    { table: 'listings', description: 'Listing für das Objekt', scope: 'entity_id' },
  ],
  required_contracts: [],
  ledger_events: [
    { event_type: 'slc.mandate.activated', trigger: 'on_complete' },
    { event_type: 'slc.published', trigger: 'on_complete' },
    { event_type: 'slc.inquiry.received', trigger: 'on_complete' },
    { event_type: 'slc.reserved', trigger: 'on_complete' },
    { event_type: 'slc.contract.drafted', trigger: 'on_complete' },
    { event_type: 'slc.notary.scheduled', trigger: 'on_complete' },
    { event_type: 'slc.notary.completed', trigger: 'on_complete' },
    { event_type: 'slc.handover.done', trigger: 'on_complete' },
    { event_type: 'slc.settlement.approved', trigger: 'on_complete' },
    { event_type: 'slc.closed.won', trigger: 'on_complete' },
    { event_type: 'slc.closed.lost', trigger: 'on_complete' },
  ],
  success_state: {
    required_flags: ['case_exists', 'mandate_active', 'published', 'notary_completed', 'settlement_approved', 'case_closed'],
    description: 'Verkaufsfall vollständig abgeschlossen — Settlement genehmigt, Provision abgerechnet.',
  },
  failure_redirect: '/admin/sales-desk',

  steps: [
    // PHASE 1: MANDAT AKTIVIERT
    {
      id: 'mandate_activated',
      phase: 1,
      label: 'Mandat aktiviert',
      type: 'action',
      routePattern: '/portal/immobilien/:propertyId',
      task_kind: 'user_task',
      camunda_key: 'GP_VERKAUF_01_MANDATE',
      preconditions: [
        { key: 'user_authenticated', source: 'auth', description: 'Nutzer muss eingeloggt sein' },
        { key: 'case_exists', source: 'sales_cases', description: 'Verkaufsfall muss angelegt sein' },
      ],
      completion: [
        { key: 'mandate_active', source: 'sales_cases', check: 'equals', value: 'mandate_active', description: 'Verkaufsmandat ist aktiv' },
      ],
    },

    // PHASE 2: VERÖFFENTLICHT (Z1 → Z3)
    {
      id: 'published',
      phase: 2,
      label: 'Veröffentlicht',
      type: 'action',
      task_kind: 'service_task',
      camunda_key: 'GP_VERKAUF_02_PUBLISHED',
      contract_refs: [
        {
          key: 'CONTRACT_LISTING_PUBLISH',
          direction: 'Z1->Z2',
          correlation_keys: ['listing_id', 'property_id'],
          description: 'Listing wird auf Kaufy/Partner-Netzwerk veröffentlicht',
        },
      ],
      preconditions: [
        { key: 'mandate_active', source: 'sales_cases', description: 'Mandat muss aktiv sein' },
      ],
      completion: [
        { key: 'published', source: 'listings', check: 'equals', value: 'active', description: 'Listing ist live auf mindestens einem Kanal' },
      ],
      on_timeout: {
        ledger_event: 'slc.publish.timeout',
        status_update: 'timeout',
        recovery_strategy: 'manual_review',
        escalate_to: 'Z1',
        description: 'Veröffentlichung nicht innerhalb 48h abgeschlossen',
      },
      on_error: {
        ledger_event: 'slc.publish.error',
        status_update: 'error',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Technischer Fehler bei Listing-Veröffentlichung',
      },
    },

    // PHASE 3: ANFRAGE EINGEGANGEN (Z3 → Z1)
    {
      id: 'inquiry_received',
      phase: 3,
      label: 'Anfrage eingegangen',
      type: 'system',
      task_kind: 'wait_message',
      camunda_key: 'GP_VERKAUF_03_INQUIRY',
      contract_refs: [
        {
          key: 'CONTRACT_INQUIRY_INBOUND',
          direction: 'Z3->Z1',
          correlation_keys: ['listing_id', 'lead_id'],
          description: 'Kaufinteressent-Anfrage von Z3 oder Partner-Netzwerk',
        },
      ],
      preconditions: [
        { key: 'published', source: 'listings', description: 'Listing muss veröffentlicht sein' },
      ],
      completion: [
        { key: 'inquiry_received', source: 'sales_cases', check: 'exists', description: 'Mindestens eine qualifizierte Anfrage eingegangen' },
      ],
      on_timeout: {
        ledger_event: 'slc.inquiry.timeout',
        status_update: 'timeout',
        recovery_strategy: 'manual_review',
        description: 'Keine Anfrage innerhalb 30 Tagen — Pricing/Marketing Review',
      },
    },

    // PHASE 4: RESERVIERT (Z1 → Z2)
    {
      id: 'reserved',
      phase: 4,
      label: 'Reserviert',
      type: 'action',
      task_kind: 'user_task',
      camunda_key: 'GP_VERKAUF_04_RESERVED',
      preconditions: [
        { key: 'inquiry_received', source: 'sales_cases', description: 'Anfrage muss vorliegen' },
      ],
      completion: [
        { key: 'reserved', source: 'sales_cases', check: 'equals', value: 'reserved', description: 'Objekt ist für einen Käufer reserviert' },
      ],
      on_timeout: {
        ledger_event: 'slc.reserved.timeout',
        status_update: 'timeout',
        recovery_strategy: 'manual_review',
        escalate_to: 'Z1',
        description: 'Reservierung nicht innerhalb 30 Tagen abgeschlossen — Käufer-Follow-Up',
      },
    },

    // PHASE 5: KAUFVERTRAGSENTWURF
    {
      id: 'contract_drafted',
      phase: 5,
      label: 'Kaufvertragsentwurf',
      type: 'action',
      task_kind: 'user_task',
      camunda_key: 'GP_VERKAUF_05_CONTRACT',
      preconditions: [
        { key: 'reserved', source: 'sales_cases', description: 'Reservierung muss bestehen' },
      ],
      completion: [
        { key: 'contract_drafted', source: 'sales_cases', check: 'exists', description: 'Kaufvertragsentwurf liegt vor' },
      ],
      on_timeout: {
        ledger_event: 'slc.contract.timeout',
        status_update: 'timeout',
        recovery_strategy: 'manual_review',
        escalate_to: 'Z1',
        description: 'Kaufvertragsentwurf nicht innerhalb 14 Tagen erstellt — Notar/Anwalt kontaktieren',
      },
    },

    // PHASE 6: NOTARTERMIN VEREINBART
    {
      id: 'notary_scheduled',
      phase: 6,
      label: 'Notartermin vereinbart',
      type: 'action',
      task_kind: 'user_task',
      camunda_key: 'GP_VERKAUF_06_NOTARY_SCHEDULED',
      preconditions: [
        { key: 'contract_drafted', source: 'sales_cases', description: 'Kaufvertragsentwurf muss vorliegen' },
      ],
      completion: [
        { key: 'notary_scheduled', source: 'sales_cases', check: 'exists', description: 'Notartermin ist vereinbart' },
      ],
      on_timeout: {
        ledger_event: 'slc.notary_schedule.timeout',
        status_update: 'timeout',
        recovery_strategy: 'manual_review',
        escalate_to: 'Z1',
        description: 'Notartermin nicht innerhalb 30 Tagen vereinbart — Eskalation an Notar',
      },
    },

    // PHASE 7: BEURKUNDET
    {
      id: 'notary_completed',
      phase: 7,
      label: 'Beurkundet',
      type: 'action',
      task_kind: 'user_task',
      camunda_key: 'GP_VERKAUF_07_NOTARY_DONE',
      preconditions: [
        { key: 'notary_scheduled', source: 'sales_cases', description: 'Notartermin muss vereinbart sein' },
      ],
      completion: [
        { key: 'notary_completed', source: 'sales_cases', check: 'exists', description: 'Notarielle Beurkundung abgeschlossen' },
      ],
      on_error: {
        ledger_event: 'slc.notary.error',
        status_update: 'error',
        recovery_strategy: 'manual_review',
        description: 'Beurkundung fehlgeschlagen oder verschoben',
      },
    },

    // PHASE 8: ÜBERGABE
    {
      id: 'handover_done',
      phase: 8,
      label: 'Übergabe',
      type: 'action',
      task_kind: 'user_task',
      camunda_key: 'GP_VERKAUF_08_HANDOVER',
      preconditions: [
        { key: 'notary_completed', source: 'sales_cases', description: 'Beurkundung muss abgeschlossen sein' },
      ],
      completion: [
        { key: 'handover_done', source: 'sales_cases', check: 'exists', description: 'Schlüsselübergabe protokolliert' },
      ],
      on_timeout: {
        ledger_event: 'slc.handover.timeout',
        status_update: 'timeout',
        recovery_strategy: 'manual_review',
        escalate_to: 'Z1',
        description: 'Übergabe nicht innerhalb 60 Tagen nach Beurkundung abgeschlossen',
      },
    },

    // PHASE 9: ABRECHNUNG / SETTLEMENT
    {
      id: 'settlement_approved',
      phase: 9,
      label: 'Abrechnung / Settlement',
      type: 'action',
      task_kind: 'user_task',
      camunda_key: 'GP_VERKAUF_09_SETTLEMENT',
      preconditions: [
        { key: 'handover_done', source: 'sales_cases', description: 'Übergabe muss abgeschlossen sein' },
      ],
      completion: [
        { key: 'settlement_approved', source: 'sales_cases', check: 'exists', description: 'Provision und Settlement genehmigt' },
      ],
      on_timeout: {
        ledger_event: 'slc.settlement.timeout',
        status_update: 'timeout',
        recovery_strategy: 'manual_review',
        escalate_to: 'Z1',
        description: 'Settlement nicht innerhalb 30 Tagen nach Übergabe abgeschlossen',
      },
    },

    // PHASE 10: ABGESCHLOSSEN (WON)
    {
      id: 'case_closed_won',
      phase: 10,
      label: 'Abgeschlossen (Won)',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP_VERKAUF_10_CLOSED_WON',
      preconditions: [
        { key: 'settlement_approved', source: 'sales_cases', description: 'Settlement muss genehmigt sein' },
      ],
      completion: [
        { key: 'case_closed', source: 'sales_cases', check: 'equals', value: 'closed_won', description: 'Fall erfolgreich abgeschlossen' },
      ],
    },

    // PHASE 11: ABGESCHLOSSEN (LOST) — Branching Fail-State
    {
      id: 'case_closed_lost',
      phase: 11,
      label: 'Abgeschlossen (Lost)',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP_VERKAUF_11_CLOSED_LOST',
      preconditions: [
        { key: 'case_exists', source: 'sales_cases', description: 'Verkaufsfall muss existieren' },
      ],
      completion: [
        { key: 'case_closed', source: 'sales_cases', check: 'equals', value: 'closed_lost', description: 'Fall als verloren markiert' },
      ],
      on_rejected: {
        ledger_event: 'slc.mandate.revoked',
        status_update: 'rejected',
        recovery_strategy: 'abort',
        description: 'Mandat wurde widerrufen — Fall wird als Lost geschlossen',
      },
      on_error: {
        ledger_event: 'slc.close.error',
        status_update: 'error',
        recovery_strategy: 'manual_review',
        description: 'Fehler beim Schließen des Falls',
      },
    },
  ],
};
