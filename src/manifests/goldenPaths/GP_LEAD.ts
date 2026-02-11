import type { GoldenPathDefinition } from './types';

/**
 * Golden Path GP-09: Lead-Generierung — Vom Website-Besucher bis zur Konvertierung (V1.0)
 * 
 * P0 Hardening: Fail-States fuer Cross-Zone Steps.
 */
export const GP_LEAD_GOLDEN_PATH: GoldenPathDefinition = {
  id: 'gp-lead-generation',
  module: 'ZONE-3/MOD-09/MOD-10',
  moduleCode: 'ZONE-3',
  version: '1.0.0',
  label: 'Lead-Generierung — Vom Besucher bis zur Konvertierung',
  description:
    'Vollstaendiger Lead-Zyklus: Erfassung via Z3-Website, Qualifizierung im Z1 Admin, Zuweisung an Partner, Konvertierung in MOD-09/10.',

  required_entities: [
    { table: 'leads', description: 'Lead-Stammdaten muessen existieren', scope: 'entity_id' },
  ],
  required_contracts: [],
  ledger_events: [
    { event_type: 'lead.captured', trigger: 'on_complete' },
    { event_type: 'lead.assigned', trigger: 'on_complete' },
  ],
  success_state: {
    required_flags: ['lead_captured', 'lead_qualified', 'lead_assigned'],
    description: 'Lead erfasst, qualifiziert und an Partner zugewiesen.',
  },
  failure_redirect: '/admin/leads',

  steps: [
    // PHASE 1: LEAD-ERFASSUNG (Cross-Zone Z3->Z1)
    {
      id: 'capture_lead',
      phase: 1,
      label: 'Lead-Erfassung (Website)',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP09_STEP_01_CAPTURE_LEAD',
      contract_refs: [
        {
          key: 'CONTRACT_LEAD_CAPTURE',
          direction: 'Z3->Z1',
          correlation_keys: ['lead_id', 'listing_id', 'source_url'],
          description: 'Lead wird via Edge Function erfasst und dedupliziert',
        },
      ],
      completion: [
        { key: 'lead_captured', source: 'leads', check: 'exists', description: 'Lead wurde in leads-Tabelle erstellt' },
      ],
      on_duplicate: {
        ledger_event: 'lead.capture.duplicate_detected',
        status_update: 'unchanged',
        recovery_strategy: 'ignore',
        description: 'Duplicate Lead erkannt (gleiche Email + Listing)',
      },
      on_error: {
        ledger_event: 'lead.capture.error',
        status_update: 'error',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Technischer Fehler bei Lead-Erfassung',
      },
    },

    // PHASE 2: LEAD-QUALIFIZIERUNG
    {
      id: 'qualify_lead',
      phase: 2,
      label: 'Lead qualifizieren (Z1 Admin)',
      type: 'action',
      routePattern: '/admin/leads',
      task_kind: 'user_task',
      camunda_key: 'GP09_STEP_02_QUALIFY_LEAD',
      preconditions: [
        { key: 'lead_captured', source: 'leads', description: 'Lead muss erfasst sein' },
      ],
      completion: [
        { key: 'lead_qualified', source: 'leads', check: 'equals', value: 'qualified', description: 'leads.status = qualified' },
      ],
    },

    // PHASE 3: LEAD-ASSIGNMENT
    {
      id: 'assign_lead',
      phase: 3,
      label: 'Lead an Partner zuweisen',
      type: 'action',
      routePattern: '/admin/leads',
      task_kind: 'user_task',
      camunda_key: 'GP09_STEP_03_ASSIGN_LEAD',
      preconditions: [
        { key: 'lead_qualified', source: 'leads', description: 'Lead muss qualifiziert sein' },
      ],
      completion: [
        { key: 'lead_assigned', source: 'leads', check: 'not_null', description: 'leads.assigned_partner_id IS NOT NULL' },
      ],
    },

    // PHASE 4: LEAD-KONVERTIERUNG
    {
      id: 'convert_lead',
      phase: 4,
      label: 'Lead konvertieren (Partner)',
      type: 'route',
      routePattern: '/portal/partner/:partnerId',
      task_kind: 'user_task',
      camunda_key: 'GP09_STEP_04_CONVERT_LEAD',
      downstreamModules: ['MOD-09', 'MOD-10'],
      preconditions: [
        { key: 'lead_assigned', source: 'leads', description: 'Lead muss zugewiesen sein' },
      ],
    },
  ],
};
