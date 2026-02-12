import type { GoldenPathDefinition } from './types';

/**
 * Golden Path GP-FINANCE-Z3: Zone 3 Finanzierungseinreichung (V1.0)
 * 
 * Flow: Website-Besucher (Kaufy/FutureRoom/LandingPage) reicht Finanzierungsanfrage ein.
 * Backbone-Orchestrierung: Z3 → Z1 (Triage) → Z2 (MOD-11 Manager).
 * 
 * Quellen: Kaufy Exposé, FutureRoom Homepage, MOD-13 Landing Pages.
 * Edge Function: sot-futureroom-public-submit
 * 
 * P0 Hardening: Fail-States fuer alle Cross-Zone und Wait-Steps.
 */
export const GP_FINANCE_Z3_GOLDEN_PATH: GoldenPathDefinition = {
  id: 'gp-finance-z3-submission',
  module: 'ZONE-3/MOD-07/MOD-11',
  moduleCode: 'GP-FINANCE-Z3',
  version: '1.0.0',
  label: 'Finanzierungseinreichung Zone 3 — Vom Websitebesucher zum Bankantrag',
  description:
    'Vollstaendiger Finanzierungs-Zyklus ab Zone 3: Formulareinreichung via Kaufy/FutureRoom/LandingPage, ' +
    'Lead-Generierung in Z1, Triage, Manager-Zuweisung (MOD-11), Bankeinreichung.',

  required_entities: [
    { table: 'finance_requests', description: 'Finanzierungsanfrage muss erstellt werden', scope: 'entity_id' },
    { table: 'leads', description: 'Lead muss im Z1-Pool registriert sein', scope: 'entity_id' },
  ],
  required_contracts: [],
  ledger_events: [
    { event_type: 'finance.z3.request.submitted', trigger: 'on_complete' },
    { event_type: 'finance.z3.lead.created', trigger: 'on_complete' },
    { event_type: 'finance.z3.dataroom.created', trigger: 'on_complete' },
    { event_type: 'finance.z3.email.sent', trigger: 'on_complete' },
    { event_type: 'finance.z3.triaged', trigger: 'on_complete' },
    { event_type: 'finance.z3.manager.assigned', trigger: 'on_complete' },
  ],
  success_state: {
    required_flags: [
      'finance_request_created',
      'lead_created',
      'z1_triaged',
      'manager_assigned',
    ],
    description: 'Finanzierungsanfrage aus Zone 3 vollstaendig verarbeitet: Lead erstellt, triagiert, Manager zugewiesen.',
  },
  failure_redirect: '/admin/finance',

  steps: [
    // ═══════════════════════════════════════════════════════════
    // PHASE 1: FORMULAREINREICHUNG (Zone 3 → Edge Function)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'z3_form_submit',
      phase: 1,
      label: 'Finanzierungsformular einreichen (Zone 3)',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP_FIN_Z3_STEP_01_FORM_SUBMIT',
      correlation_keys: ['finance_request_id', 'contact_email', 'source'],
      contract_refs: [
        {
          key: 'CONTRACT_FINANCE_Z3_SUBMIT',
          direction: 'Z3->Z1',
          correlation_keys: ['finance_request_id', 'tenant_id', 'public_id'],
          description: 'Finanzierungsanfrage wird via sot-futureroom-public-submit an Z1 uebermittelt',
        },
      ],
      completion: [
        {
          key: 'finance_request_created',
          source: 'finance_requests',
          check: 'exists',
          description: 'finance_requests-Eintrag wurde erstellt (status=submitted)',
        },
      ],
      on_error: {
        ledger_event: 'finance.z3.submit.error',
        status_update: 'error',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Technischer Fehler bei der Formulareinreichung',
      },
      on_duplicate: {
        ledger_event: 'finance.z3.submit.duplicate_detected',
        status_update: 'unchanged',
        recovery_strategy: 'ignore',
        description: 'Duplikat-Erkennung: Gleiche E-Mail + Objekt bereits eingereicht',
      },
    },

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: AUTOMATISCHE NACHBEARBEITUNG (Edge Function)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'create_lead',
      phase: 2,
      label: 'Lead im Z1-Pool erstellen',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP_FIN_Z3_STEP_02_CREATE_LEAD',
      correlation_keys: ['finance_request_id', 'lead_id'],
      preconditions: [
        { key: 'finance_request_created', source: 'finance_requests', description: 'Finanzierungsanfrage muss existieren' },
      ],
      completion: [
        {
          key: 'lead_created',
          source: 'leads',
          check: 'exists',
          description: 'Lead in leads-Tabelle erstellt (zone1_pool=true)',
        },
      ],
      on_error: {
        ledger_event: 'finance.z3.lead.create.error',
        status_update: 'error',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Lead-Erstellung fehlgeschlagen',
      },
    },
    {
      id: 'create_dataroom',
      phase: 2,
      label: 'Datenraum anlegen',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP_FIN_Z3_STEP_03_CREATE_DATAROOM',
      correlation_keys: ['finance_request_id', 'tenant_id'],
      preconditions: [
        { key: 'finance_request_created', source: 'finance_requests', description: 'Finanzierungsanfrage muss existieren' },
      ],
      completion: [
        {
          key: 'dataroom_created',
          source: 'storage',
          check: 'exists',
          description: 'Datenraum-Ordner unter {tenant_id}/MOD_11/{request_id}/ angelegt',
        },
      ],
      on_error: {
        ledger_event: 'finance.z3.dataroom.create.error',
        status_update: 'warning',
        recovery_strategy: 'manual_review',
        description: 'Datenraum konnte nicht automatisch erstellt werden',
        escalate_to: 'Z1',
      },
    },
    {
      id: 'send_confirmation_email',
      phase: 2,
      label: 'Bestaetigungsmail mit Unterlagenliste senden',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP_FIN_Z3_STEP_04_SEND_EMAIL',
      correlation_keys: ['finance_request_id', 'contact_email'],
      preconditions: [
        { key: 'finance_request_created', source: 'finance_requests', description: 'Finanzierungsanfrage muss existieren' },
      ],
      completion: [
        {
          key: 'confirmation_email_sent',
          source: 'system_mail',
          check: 'exists',
          description: 'Bestaetigungsmail via sot-system-mail-send gesendet',
        },
      ],
      on_error: {
        ledger_event: 'finance.z3.email.send.error',
        status_update: 'warning',
        recovery_strategy: 'retry',
        max_retries: 2,
        description: 'E-Mail-Versand fehlgeschlagen (Domain-Verifizierung pruefen)',
      },
    },

    // ═══════════════════════════════════════════════════════════
    // PHASE 3: ZONE 1 TRIAGE (Admin manuelle Prüfung)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'z1_triage',
      phase: 3,
      label: 'Z1 Triage — Finanzierungsanfrage pruefen',
      type: 'action',
      routePattern: '/admin/finance',
      task_kind: 'user_task',
      camunda_key: 'GP_FIN_Z3_STEP_05_Z1_TRIAGE',
      correlation_keys: ['finance_request_id', 'lead_id'],
      preconditions: [
        { key: 'lead_created', source: 'leads', description: 'Lead muss im Z1-Pool sein' },
        { key: 'finance_request_created', source: 'finance_requests', description: 'Anfrage muss existieren' },
      ],
      completion: [
        {
          key: 'z1_triaged',
          source: 'finance_requests',
          check: 'equals',
          value: 'triaged',
          description: 'finance_requests.status = triaged (Admin hat geprueft)',
        },
      ],
      on_timeout: {
        ledger_event: 'finance.z3.triage.timeout',
        status_update: 'overdue',
        recovery_strategy: 'escalate_to_z1',
        description: 'Triage nicht innerhalb SLA durchgefuehrt',
        escalate_to: 'Z1',
      },
      sla_hours: 24,
    },

    // ═══════════════════════════════════════════════════════════
    // PHASE 4: MANAGER-ZUWEISUNG (Z1 → Z2/MOD-11)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'assign_manager',
      phase: 4,
      label: 'Finanzierungsmanager zuweisen',
      type: 'action',
      routePattern: '/admin/finance',
      task_kind: 'user_task',
      camunda_key: 'GP_FIN_Z3_STEP_06_ASSIGN_MANAGER',
      correlation_keys: ['finance_request_id', 'finance_mandate_id', 'manager_user_id'],
      contract_refs: [
        {
          key: 'CONTRACT_FINANCE_MANDATE_ASSIGN',
          direction: 'Z1->Z2',
          correlation_keys: ['finance_mandate_id', 'manager_user_id', 'tenant_id'],
          description: 'Z1 weist Finanzierungsmandat einem MOD-11 Manager zu',
        },
      ],
      preconditions: [
        { key: 'z1_triaged', source: 'finance_requests', description: 'Anfrage muss triagiert sein' },
      ],
      completion: [
        {
          key: 'manager_assigned',
          source: 'finance_mandates',
          check: 'not_null',
          description: 'finance_mandates.assigned_manager_id IS NOT NULL',
        },
      ],
      downstreamModules: ['MOD-11'],
      on_timeout: {
        ledger_event: 'finance.z3.manager.assignment.timeout',
        status_update: 'overdue',
        recovery_strategy: 'escalate_to_z1',
        description: 'Manager-Zuweisung nicht innerhalb SLA erfolgt',
        escalate_to: 'Z1',
      },
      on_rejected: {
        ledger_event: 'finance.z3.manager.assignment.rejected',
        status_update: 'rejected',
        recovery_strategy: 'manual_review',
        description: 'Manager hat Mandat abgelehnt — Neuzuweisung erforderlich',
      },
      sla_hours: 48,
    },

    // ═══════════════════════════════════════════════════════════
    // PHASE 5: MOD-11 BEARBEITUNG (Manager Workflow)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'manager_processing',
      phase: 5,
      label: 'Finanzierungsakte bearbeiten (MOD-11)',
      type: 'route',
      routePattern: '/portal/finanzierung-manager/:mandateId',
      routeId: 'finance-manager-detail',
      task_kind: 'user_task',
      camunda_key: 'GP_FIN_Z3_STEP_07_MANAGER_PROCESSING',
      correlation_keys: ['finance_mandate_id', 'finance_request_id'],
      preconditions: [
        { key: 'manager_assigned', source: 'finance_mandates', description: 'Manager muss zugewiesen sein' },
      ],
      completion: [
        {
          key: 'akte_complete',
          source: 'finance_requests',
          check: 'equals',
          value: 'ready_for_bank',
          description: 'Finanzierungsakte vollstaendig und bankfertig',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // PHASE 6: BANKEINREICHUNG (MOD-11 → Extern)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'bank_submission',
      phase: 6,
      label: 'Bankeinreichung',
      type: 'action',
      task_kind: 'service_task',
      camunda_key: 'GP_FIN_Z3_STEP_08_BANK_SUBMIT',
      correlation_keys: ['finance_request_id', 'bank_submission_id'],
      contract_refs: [
        {
          key: 'CONTRACT_FINANCE_BANK_SUBMIT',
          direction: 'Z1->Z2',
          correlation_keys: ['finance_request_id', 'bank_partner_id'],
          description: 'Finanzierungspaket wird an Bankpartner uebermittelt',
        },
      ],
      preconditions: [
        { key: 'akte_complete', source: 'finance_requests', description: 'Akte muss bankfertig sein' },
      ],
      completion: [
        {
          key: 'bank_submitted',
          source: 'finance_requests',
          check: 'equals',
          value: 'submitted_to_bank',
          description: 'finance_requests.status = submitted_to_bank',
        },
      ],
      on_error: {
        ledger_event: 'finance.z3.bank.submit.error',
        status_update: 'error',
        recovery_strategy: 'manual_review',
        description: 'Bankeinreichung fehlgeschlagen',
        escalate_to: 'Z1',
      },
    },
  ],
};
