import type { GoldenPathDefinition } from './types';

/**
 * Golden Path: GP-CLIENT-ASSIGNMENT
 * 
 * Wiederkehrender Prozess: Kundenanfrage → Zone-1-Triage → Manager-Zuweisung
 * Cross-Zone Workflow: Z2-Client → Z1 → Z2-Manager
 */
export const GP_CLIENT_ASSIGNMENT_GOLDEN_PATH: GoldenPathDefinition = {
  id: 'gp-client-assignment',
  module: 'CROSS-ZONE/Z1',
  moduleCode: 'ZONE-1',
  version: '1.0.0',
  label: 'Kunden-Zuweisung — Von Anfrage bis Manager-Annahme',
  description:
    'Wiederkehrender Zuweisungsprozess: Kundenanfrage (Z2-Client) wird im Zone-1-Desk triagiert, einem Manager zugewiesen und per org_link/org_delegation verbunden.',

  required_entities: [
    { table: 'org_links', description: 'org_link fuer Manager-Client-Beziehung', scope: 'entity_id' },
    { table: 'org_delegations', description: 'Scope-basierte Delegation', scope: 'entity_id' },
  ],
  required_contracts: [],
  ledger_events: [
    { event_type: 'client.request.received', trigger: 'on_complete' },
    { event_type: 'client.assignment.completed', trigger: 'on_complete' },
    { event_type: 'manager.assignment.accepted', trigger: 'on_complete' },
  ],
  success_state: {
    required_flags: [
      'request_received',
      'manager_selected',
      'org_link_created',
      'delegation_scoped',
      'manager_accepted',
    ],
    description: 'Kunde ist einem Manager zugewiesen, org_link und org_delegation sind aktiv, Manager hat angenommen.',
  },
  failure_redirect: '/admin/armstrong',

  steps: [
    // ─── STEP 1: REQUEST RECEIVED ─────────────────────────────
    {
      id: 'client_request_received',
      phase: 1,
      label: 'Kundenanfrage eingegangen',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP_ASSIGN_STEP_01_REQUEST_RECEIVED',
      contract_refs: [
        {
          key: 'CONTRACT_CLIENT_REQUEST',
          direction: 'Z2->Z1',
          correlation_keys: ['request_id', 'tenant_id', 'module_code'],
          description: 'Kundenanfrage (z.B. Finanzierung, Akquise) geht im Z1-Desk ein',
        },
      ],
      completion: [
        {
          key: 'request_received',
          source: 'desk_inbox',
          check: 'exists',
          description: 'Anfrage ist im Zone-1-Desk sichtbar',
        },
      ],
      on_error: {
        ledger_event: 'client.request.receive.error',
        status_update: 'error',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Technischer Fehler beim Empfang der Kundenanfrage',
      },
    },

    // ─── STEP 2: DESK TRIAGE ──────────────────────────────────
    {
      id: 'desk_triage',
      phase: 2,
      label: 'Desk-Triage (Z1 Admin)',
      type: 'action',
      routePattern: '/admin/armstrong',
      task_kind: 'user_task',
      camunda_key: 'GP_ASSIGN_STEP_02_DESK_TRIAGE',
      preconditions: [
        { key: 'request_received', source: 'desk_inbox', description: 'Anfrage muss im Desk sein' },
      ],
      completion: [
        {
          key: 'triage_completed',
          source: 'desk_inbox',
          check: 'equals',
          value: 'triaged',
          description: 'Anfrage wurde triagiert und kategorisiert',
        },
      ],
      on_timeout: {
        ledger_event: 'client.assignment.triage.timeout',
        status_update: 'pending',
        recovery_strategy: 'escalate_to_z1',
        description: '48h ohne Triage — Eskalation',
        escalate_to: 'Z1',
      },
      sla_hours: 48,
    },

    // ─── STEP 3: MANAGER SELECTED ─────────────────────────────
    {
      id: 'manager_selected',
      phase: 3,
      label: 'Manager auswaehlen',
      type: 'action',
      routePattern: '/admin/armstrong',
      task_kind: 'user_task',
      camunda_key: 'GP_ASSIGN_STEP_03_MANAGER_SELECTED',
      preconditions: [
        { key: 'triage_completed', source: 'desk_inbox', description: 'Triage muss abgeschlossen sein' },
      ],
      completion: [
        {
          key: 'manager_selected',
          source: 'org_links',
          check: 'exists',
          description: 'Manager wurde ausgewaehlt (org_link vorbereitet)',
        },
      ],
    },

    // ─── STEP 4: ORG LINK CREATED ─────────────────────────────
    {
      id: 'org_link_created',
      phase: 4,
      label: 'org_link erstellen',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP_ASSIGN_STEP_04_ORG_LINK',
      preconditions: [
        { key: 'manager_selected', source: 'org_links', description: 'Manager muss ausgewaehlt sein' },
      ],
      completion: [
        {
          key: 'org_link_created',
          source: 'org_links',
          check: 'equals',
          value: 'active',
          description: 'org_links.status = active (link_type = manages)',
        },
      ],
    },

    // ─── STEP 5: DELEGATION SCOPED ────────────────────────────
    {
      id: 'delegation_scoped',
      phase: 5,
      label: 'Delegation mit Scopes erteilen',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP_ASSIGN_STEP_05_DELEGATION',
      preconditions: [
        { key: 'org_link_created', source: 'org_links', description: 'org_link muss aktiv sein' },
      ],
      completion: [
        {
          key: 'delegation_scoped',
          source: 'org_delegations',
          check: 'equals',
          value: 'active',
          description: 'org_delegations.status = active mit konkreten Scopes',
        },
      ],
      on_error: {
        ledger_event: 'client.assignment.delegation.error',
        status_update: 'org_link_active',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Fehler beim Erstellen der Delegation',
      },
    },

    // ─── STEP 6: MANAGER NOTIFIED ─────────────────────────────
    {
      id: 'manager_notified',
      phase: 6,
      label: 'Manager benachrichtigen',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP_ASSIGN_STEP_06_NOTIFY',
      contract_refs: [
        {
          key: 'CONTRACT_MANAGER_NOTIFICATION',
          direction: 'Z1->Z2',
          correlation_keys: ['manager_org_id', 'client_org_id', 'assignment_id'],
          description: 'Z1 benachrichtigt Manager ueber neue Kundenzuweisung',
        },
      ],
      preconditions: [
        { key: 'delegation_scoped', source: 'org_delegations', description: 'Delegation muss erteilt sein' },
      ],
      completion: [
        {
          key: 'manager_notified',
          source: 'notifications',
          check: 'exists',
          description: 'Benachrichtigung an Manager versendet',
        },
      ],
    },

    // ─── STEP 7: MANAGER ACCEPTS ──────────────────────────────
    {
      id: 'manager_accepts',
      phase: 7,
      label: 'Manager nimmt Zuweisung an',
      type: 'action',
      task_kind: 'user_task',
      camunda_key: 'GP_ASSIGN_STEP_07_ACCEPT',
      preconditions: [
        { key: 'manager_notified', source: 'notifications', description: 'Manager muss benachrichtigt sein' },
      ],
      completion: [
        {
          key: 'manager_accepted',
          source: 'org_links',
          check: 'equals',
          value: 'accepted',
          description: 'Manager hat die Zuweisung akzeptiert',
        },
      ],
      on_timeout: {
        ledger_event: 'client.assignment.accept.timeout',
        status_update: 'pending_acceptance',
        recovery_strategy: 'manual_review',
        description: '48h ohne Annahme — Re-Route an anderen Manager',
      },
      on_rejected: {
        ledger_event: 'client.assignment.rejected',
        status_update: 'rejected',
        recovery_strategy: 'manual_review',
        description: 'Manager lehnt ab — zurueck zu Manager-Auswahl (Step 3)',
      },
      sla_hours: 48,
    },
  ],
};
