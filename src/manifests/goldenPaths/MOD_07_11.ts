import type { GoldenPathDefinition } from './types';

/**
 * Golden Path GP-02: Finanzierung — Vom Antrag bis zur Bankeinreichung (V1.0)
 * 
 * Cross-Modul: MOD-07 (Kunde) -> Z1 FutureRoom -> MOD-11 (Manager)
 * Akteure: Kunde, Admin (Z1), Finanzierungsmanager (MOD-11)
 */
export const MOD_07_11_GOLDEN_PATH: GoldenPathDefinition = {
  id: 'gp-finance-lifecycle',
  module: 'MOD-07/MOD-11',
  moduleCode: 'MOD-07',
  version: '1.0.0',
  label: 'Finanzierung — Vom Antrag bis zur Bankeinreichung',
  description:
    'Vollstaendiger Finanzierungszyklus: Selbstauskunft erstellen, Anfrage einreichen, Z1 Triage, Manager-Zuweisung, TermsGate, Case-Bearbeitung, Bankeinreichung.',

  required_entities: [
    {
      table: 'applicant_profiles',
      description: 'Selbstauskunft des Antragstellers muss existieren',
      scope: 'entity_id',
    },
    {
      table: 'finance_requests',
      description: 'Finanzierungsanfrage muss existieren',
      scope: 'entity_id',
    },
  ],

  required_contracts: [
    {
      key: 'terms_gate_finance',
      source: 'user_consents',
      description: 'TermsGate-Akzeptanz (30% Plattformgebuehr) durch Manager',
    },
  ],

  ledger_events: [
    { event_type: 'finance.request.submitted', trigger: 'on_complete' },
    { event_type: 'finance.mandate.assigned', trigger: 'on_complete' },
    { event_type: 'finance.bank.submitted', trigger: 'on_complete' },
  ],

  success_state: {
    required_flags: [
      'applicant_profile_complete',
      'finance_request_submitted',
      'mandate_assigned',
      'terms_gate_accepted',
      'bank_submitted',
    ],
    description: 'Finanzierungsanfrage vollstaendig bearbeitet und bei Bank eingereicht.',
  },

  failure_redirect: '/portal/finanzierung',

  steps: [
    // PHASE 1: SELBSTAUSKUNFT ERSTELLEN
    {
      id: 'create_applicant_profile',
      phase: 1,
      label: 'Selbstauskunft erstellen',
      type: 'action',
      routePattern: '/portal/finanzierung',
      task_kind: 'user_task',
      camunda_key: 'GP02_STEP_01_CREATE_PROFILE',
      preconditions: [
        { key: 'user_authenticated', source: 'auth', description: 'User muss eingeloggt sein' },
        { key: 'tenant_exists', source: 'organizations', description: 'Tenant muss vorhanden sein' },
      ],
      completion: [
        { key: 'applicant_profile_exists', source: 'applicant_profiles', check: 'exists', description: 'Antragsteller-Profil wurde erstellt' },
      ],
    },

    // PHASE 2: SELBSTAUSKUNFT ABSCHLIESSEN
    {
      id: 'complete_applicant_profile',
      phase: 2,
      label: 'Selbstauskunft abschliessen',
      type: 'action',
      routePattern: '/portal/finanzierung/:requestId',
      task_kind: 'user_task',
      camunda_key: 'GP02_STEP_02_COMPLETE_PROFILE',
      preconditions: [
        { key: 'applicant_profile_exists', source: 'applicant_profiles', description: 'Profil muss existieren' },
      ],
      completion: [
        { key: 'applicant_profile_complete', source: 'applicant_profiles', check: 'not_null', description: 'Alle Pflichtfelder ausgefuellt (completion_score >= threshold)' },
      ],
    },

    // PHASE 3: ANFRAGE EINREICHEN
    {
      id: 'submit_finance_request',
      phase: 3,
      label: 'Finanzierungsanfrage einreichen',
      type: 'action',
      routePattern: '/portal/finanzierung/:requestId',
      task_kind: 'user_task',
      camunda_key: 'GP02_STEP_03_SUBMIT_REQUEST',
      contract_refs: [
        {
          key: 'CONTRACT_FINANCE_SUBMIT',
          direction: 'Z2->Z1',
          correlation_keys: ['tenant_id', 'finance_request_id'],
          description: 'Finanzierungsanfrage wird an Z1 FutureRoom uebermittelt',
        },
      ],
      preconditions: [
        { key: 'applicant_profile_complete', source: 'applicant_profiles', description: 'Selbstauskunft muss vollstaendig sein' },
      ],
      completion: [
        { key: 'finance_request_submitted', source: 'finance_requests', check: 'equals', value: 'submitted', description: 'finance_requests.status = submitted' },
      ],
    },

    // PHASE 4: Z1 TRIAGE + ASSIGNMENT
    {
      id: 'z1_triage_assignment',
      phase: 4,
      label: 'Z1 Triage und Manager-Zuweisung',
      type: 'system',
      task_kind: 'wait_message',
      camunda_key: 'GP02_STEP_04_Z1_TRIAGE',
      contract_refs: [
        {
          key: 'CONTRACT_MANDATE_ASSIGNMENT',
          direction: 'Z1->Z2',
          correlation_keys: ['tenant_id', 'finance_request_id', 'assigned_manager_user_id'],
          description: 'Z1 Admin weist Finanzierungsmandat an MOD-11 Manager zu',
        },
      ],
      preconditions: [
        { key: 'finance_request_submitted', source: 'finance_requests', description: 'Anfrage muss eingereicht sein' },
      ],
      completion: [
        { key: 'mandate_assigned', source: 'finance_requests', check: 'not_null', description: 'assigned_manager_user_id IS NOT NULL' },
      ],
    },

    // PHASE 5: TERMSGATE AKZEPTIEREN
    {
      id: 'accept_terms_gate',
      phase: 5,
      label: 'TermsGate akzeptieren (Manager)',
      type: 'action',
      routePattern: '/portal/finance-manager/:requestId',
      task_kind: 'user_task',
      camunda_key: 'GP02_STEP_05_TERMS_GATE',
      preconditions: [
        { key: 'mandate_assigned', source: 'finance_requests', description: 'Mandat muss zugewiesen sein' },
      ],
      completion: [
        { key: 'terms_gate_accepted', source: 'user_consents', check: 'exists', description: 'TermsGate-Consent wurde akzeptiert' },
      ],
    },

    // PHASE 6: CASE BEARBEITEN
    {
      id: 'process_case',
      phase: 6,
      label: 'Fall bearbeiten (Dokumente, Kalkulation)',
      type: 'route',
      routePattern: '/portal/finance-manager/:requestId',
      task_kind: 'user_task',
      camunda_key: 'GP02_STEP_06_PROCESS_CASE',
      preconditions: [
        { key: 'terms_gate_accepted', source: 'user_consents', description: 'TermsGate muss akzeptiert sein' },
      ],
    },

    // PHASE 7: BANKEINREICHUNG
    {
      id: 'submit_to_bank',
      phase: 7,
      label: 'Bei Bank einreichen',
      type: 'action',
      routePattern: '/portal/finance-manager/:requestId',
      task_kind: 'user_task',
      camunda_key: 'GP02_STEP_07_BANK_SUBMIT',
      contract_refs: [
        {
          key: 'CONTRACT_FINANCE_DOC_REMINDER',
          direction: 'Z2->Z1' as const,
          correlation_keys: ['finance_request_id', 'tenant_id'],
          description: 'Optionaler Reminder fuer fehlende Dokumente',
        },
      ],
      preconditions: [
        { key: 'terms_gate_accepted', source: 'user_consents', description: 'TermsGate muss akzeptiert sein' },
      ],
      completion: [
        { key: 'bank_submitted', source: 'finance_requests', check: 'equals', value: 'submitted_to_bank', description: 'finance_requests.status = submitted_to_bank' },
      ],
    },
  ],
};
