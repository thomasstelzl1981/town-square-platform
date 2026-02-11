import type { GoldenPathDefinition } from './types';

/**
 * Golden Path GP-03: Akquise Mandat — Vom Suchprofil bis zum Angebot (V1.0)
 * 
 * Cross-Modul: MOD-08 (Investor) -> Z1 Acquiary -> MOD-12 (Manager)
 * Akteure: Investor, Admin (Z1), Akquise-Manager (MOD-12)
 */
export const MOD_08_12_GOLDEN_PATH: GoldenPathDefinition = {
  id: 'gp-acquisition-mandate',
  module: 'MOD-08/MOD-12',
  moduleCode: 'MOD-08',
  version: '1.0.0',
  label: 'Akquise Mandat — Vom Suchprofil bis zum Angebot',
  description:
    'Vollstaendiger Akquise-Zyklus: Suchprofil erstellen, Mandat einreichen, Z1 Triage, Manager-Zuweisung, TermsGate, Recherche/Outbound, Analyse/Reporting.',

  required_entities: [
    {
      table: 'acq_mandates',
      description: 'Suchmandat muss existieren',
      scope: 'entity_id',
    },
  ],

  required_contracts: [
    {
      key: 'terms_gate_acquisition',
      source: 'user_consents',
      description: 'TermsGate-Akzeptanz (30% Plattformgebuehr) durch Manager',
    },
  ],

  ledger_events: [
    { event_type: 'acq.mandate.submitted', trigger: 'on_complete' },
    { event_type: 'acq.mandate.assigned', trigger: 'on_complete' },
    { event_type: 'acq.offer.created', trigger: 'on_complete' },
  ],

  success_state: {
    required_flags: [
      'mandate_submitted',
      'mandate_assigned',
      'terms_gate_accepted',
      'offers_created',
    ],
    description: 'Akquise-Mandat vollstaendig bearbeitet, Angebote erstellt.',
  },

  failure_redirect: '/portal/investment-suche',

  steps: [
    // PHASE 1: SUCHPROFIL ERSTELLEN
    {
      id: 'create_search_profile',
      phase: 1,
      label: 'Suchprofil erstellen',
      type: 'action',
      routePattern: '/portal/investment-suche',
      task_kind: 'user_task',
      camunda_key: 'GP03_STEP_01_CREATE_PROFILE',
      preconditions: [
        { key: 'user_authenticated', source: 'auth', description: 'User muss eingeloggt sein' },
        { key: 'tenant_exists', source: 'organizations', description: 'Tenant muss vorhanden sein' },
      ],
      completion: [
        { key: 'mandate_draft_exists', source: 'acq_mandates', check: 'exists', description: 'Suchmandat im Draft-Status erstellt' },
      ],
    },

    // PHASE 2: MANDAT EINREICHEN
    {
      id: 'submit_mandate',
      phase: 2,
      label: 'Suchmandat einreichen',
      type: 'action',
      routePattern: '/portal/investment-suche',
      task_kind: 'user_task',
      camunda_key: 'GP03_STEP_02_SUBMIT_MANDATE',
      contract_refs: [
        {
          key: 'CONTRACT_ACQ_MANDATE_SUBMIT',
          direction: 'Z2->Z1',
          correlation_keys: ['tenant_id', 'mandate_id'],
          description: 'Suchmandat wird an Z1 Acquiary uebermittelt',
        },
      ],
      preconditions: [
        { key: 'mandate_draft_exists', source: 'acq_mandates', description: 'Mandat muss im Draft existieren' },
      ],
      completion: [
        { key: 'mandate_submitted', source: 'acq_mandates', check: 'equals', value: 'submitted', description: 'acq_mandates.status = submitted' },
      ],
    },

    // PHASE 3: Z1 TRIAGE + ASSIGNMENT
    {
      id: 'z1_triage_assignment',
      phase: 3,
      label: 'Z1 Triage und Manager-Zuweisung',
      type: 'system',
      task_kind: 'wait_message',
      camunda_key: 'GP03_STEP_03_Z1_TRIAGE',
      contract_refs: [
        {
          key: 'CONTRACT_MANDATE_ASSIGNMENT',
          direction: 'Z1->Z2',
          correlation_keys: ['tenant_id', 'mandate_id', 'assigned_manager_user_id'],
          description: 'Z1 Admin weist Akquise-Mandat an MOD-12 Manager zu',
        },
      ],
      preconditions: [
        { key: 'mandate_submitted', source: 'acq_mandates', description: 'Mandat muss eingereicht sein' },
      ],
      completion: [
        { key: 'mandate_assigned', source: 'acq_mandates', check: 'not_null', description: 'assigned_manager_user_id IS NOT NULL' },
      ],
    },

    // PHASE 4: TERMSGATE AKZEPTIEREN
    {
      id: 'accept_terms_gate',
      phase: 4,
      label: 'TermsGate akzeptieren (Manager)',
      type: 'action',
      routePattern: '/portal/akquise-manager/:mandateId',
      task_kind: 'user_task',
      camunda_key: 'GP03_STEP_04_TERMS_GATE',
      preconditions: [
        { key: 'mandate_assigned', source: 'acq_mandates', description: 'Mandat muss zugewiesen sein' },
      ],
      completion: [
        { key: 'terms_gate_accepted', source: 'user_consents', check: 'exists', description: 'TermsGate-Consent wurde akzeptiert' },
      ],
    },

    // PHASE 5: RECHERCHE + OUTBOUND
    {
      id: 'research_outbound',
      phase: 5,
      label: 'Recherche und Outbound-Akquise',
      type: 'route',
      routePattern: '/portal/akquise-manager/:mandateId',
      task_kind: 'user_task',
      camunda_key: 'GP03_STEP_05_RESEARCH_OUTBOUND',
      contract_refs: [
        {
          key: 'CONTRACT_ACQ_OUTBOUND_EMAIL',
          direction: 'Z2->Z1' as const,
          correlation_keys: ['mandate_id', 'contact_id'],
          description: 'Akquise-Anschreiben wird via Resend versendet',
        },
        {
          key: 'CONTRACT_ACQ_INBOUND_EMAIL',
          direction: 'EXTERN->Z1',
          correlation_keys: ['mandate_id', 'routing_token'],
          description: 'Eingehende Antwort wird via Webhook geroutet',
        },
      ],
      preconditions: [
        { key: 'terms_gate_accepted', source: 'user_consents', description: 'TermsGate muss akzeptiert sein' },
      ],
    },

    // PHASE 6: ANALYSE + REPORTING
    {
      id: 'analysis_reporting',
      phase: 6,
      label: 'Angebots-Analyse und Reporting',
      type: 'route',
      routePattern: '/portal/akquise-manager/:mandateId',
      task_kind: 'user_task',
      camunda_key: 'GP03_STEP_06_ANALYSIS',
      preconditions: [
        { key: 'terms_gate_accepted', source: 'user_consents', description: 'TermsGate muss akzeptiert sein' },
      ],
      completion: [
        { key: 'offers_created', source: 'acq_offers', check: 'exists', description: 'Mindestens ein Angebot wurde erfasst' },
      ],
    },
  ],
};
