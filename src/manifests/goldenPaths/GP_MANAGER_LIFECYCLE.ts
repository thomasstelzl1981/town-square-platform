import type { GoldenPathDefinition } from './types';

/**
 * Golden Path: GP-MANAGER-LIFECYCLE
 * 
 * Manager-Bewerbung → Zone-1-Verifizierung → Freischaltung → Kundenzuweisung
 * Cross-Zone Workflow: Z2 → Z1 → Z2
 */
export const GP_MANAGER_LIFECYCLE_GOLDEN_PATH: GoldenPathDefinition = {
  id: 'gp-manager-lifecycle',
  module: 'CROSS-ZONE/Z1',
  moduleCode: 'ZONE-1',
  version: '1.0.0',
  label: 'Manager-Lifecycle — Von Bewerbung bis Kundenzuweisung',
  description:
    'Vollstaendiger Manager-Lifecycle: Selbstregistrierung, Manager-Bewerbung (Z2), Verifizierung und Freischaltung (Z1), erste Kundenzuweisung (Z1→Z2).',

  required_entities: [
    { table: 'manager_applications', description: 'Manager-Bewerbung muss existieren', scope: 'entity_id' },
    { table: 'organizations', description: 'Tenant-Organisation muss existieren', scope: 'tenant_id' },
  ],
  required_contracts: [],
  ledger_events: [
    { event_type: 'manager.application.submitted', trigger: 'on_complete' },
    { event_type: 'manager.application.approved', trigger: 'on_complete' },
    { event_type: 'manager.org.upgraded', trigger: 'on_complete' },
    { event_type: 'manager.tiles.activated', trigger: 'on_complete' },
    { event_type: 'manager.first_client.assigned', trigger: 'on_complete' },
  ],
  success_state: {
    required_flags: [
      'application_submitted',
      'application_approved',
      'org_type_upgraded',
      'tiles_activated',
      'first_client_assigned',
    ],
    description: 'Manager ist freigeschaltet, hat sein Spezialmodul und mindestens einen zugewiesenen Kunden.',
  },
  failure_redirect: '/portal/stammdaten',

  steps: [
    // ─── PHASE 1: APPLICATION (Z2 → Z1) ───────────────────────
    {
      id: 'submit_application',
      phase: 1,
      label: 'Manager-Bewerbung einreichen',
      type: 'action',
      routePattern: '/portal/stammdaten',
      task_kind: 'user_task',
      camunda_key: 'GP_MANAGER_STEP_01_SUBMIT_APPLICATION',
      contract_refs: [
        {
          key: 'CONTRACT_MANAGER_APPLICATION',
          direction: 'Z2->Z1',
          correlation_keys: ['application_id', 'tenant_id', 'requested_role'],
          description: 'Manager-Bewerbung wird von Z2 an Z1 Desk uebermittelt',
        },
      ],
      completion: [
        {
          key: 'application_submitted',
          source: 'manager_applications',
          check: 'equals',
          value: 'submitted',
          description: 'manager_applications.status = submitted',
        },
      ],
      on_error: {
        ledger_event: 'manager.application.submit.error',
        status_update: 'draft',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Technischer Fehler bei Bewerbungseinreichung',
      },
    },
    {
      id: 'application_received',
      phase: 1,
      label: 'Bewerbung im Desk eingegangen',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP_MANAGER_STEP_02_APPLICATION_RECEIVED',
      preconditions: [
        { key: 'application_submitted', source: 'manager_applications', description: 'Bewerbung muss eingereicht sein' },
      ],
      completion: [
        {
          key: 'application_in_review',
          source: 'manager_applications',
          check: 'equals',
          value: 'in_review',
          description: 'manager_applications.status = in_review',
        },
      ],
    },

    // ─── PHASE 2: VERIFICATION (Z1) ──────────────────────────
    {
      id: 'qualification_check',
      phase: 2,
      label: 'Qualifikationspruefung (Z1)',
      type: 'action',
      routePattern: '/admin/armstrong',
      task_kind: 'user_task',
      camunda_key: 'GP_MANAGER_STEP_03_QUALIFICATION_CHECK',
      preconditions: [
        { key: 'application_in_review', source: 'manager_applications', description: 'Bewerbung muss in Pruefung sein' },
      ],
      completion: [
        {
          key: 'qualification_passed',
          source: 'manager_applications',
          check: 'exists',
          description: 'Qualifikation geprueft (z.B. §34i Nachweis)',
        },
      ],
      on_timeout: {
        ledger_event: 'manager.qualification.check.timeout',
        status_update: 'in_review',
        recovery_strategy: 'escalate_to_z1',
        description: '14 Tage ohne Reaktion — Erinnerung an Z1 Admin',
        escalate_to: 'Z1',
      },
      on_rejected: {
        ledger_event: 'manager.application.rejected',
        status_update: 'rejected',
        recovery_strategy: 'manual_review',
        description: 'Bewerbung abgelehnt — Bewerber erhaelt Ablehnungsgrund und Re-Apply-Option',
      },
      sla_hours: 336, // 14 Tage
    },
    {
      id: 'compliance_review',
      phase: 2,
      label: 'Compliance-Review (Z1)',
      type: 'action',
      routePattern: '/admin/armstrong',
      task_kind: 'user_task',
      camunda_key: 'GP_MANAGER_STEP_04_COMPLIANCE_REVIEW',
      preconditions: [
        { key: 'qualification_passed', source: 'manager_applications', description: 'Qualifikation muss bestanden sein' },
      ],
      completion: [
        {
          key: 'application_approved',
          source: 'manager_applications',
          check: 'equals',
          value: 'approved',
          description: 'manager_applications.status = approved',
        },
      ],
    },

    // ─── PHASE 3: ACTIVATION (Z1) ────────────────────────────
    {
      id: 'org_type_upgrade',
      phase: 3,
      label: 'Org-Typ auf Partner upgraden',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP_MANAGER_STEP_05_ORG_UPGRADE',
      preconditions: [
        { key: 'application_approved', source: 'manager_applications', description: 'Bewerbung muss genehmigt sein' },
      ],
      completion: [
        {
          key: 'org_type_upgraded',
          source: 'organizations',
          check: 'equals',
          value: 'partner',
          description: 'organizations.org_type = partner',
        },
      ],
      on_error: {
        ledger_event: 'manager.org.upgrade.error',
        status_update: 'approved',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Fehler beim Org-Type-Upgrade — Rollback auf approved',
        camunda_error_code: 'ORG_UPGRADE_FAILED',
      },
    },
    {
      id: 'tile_activation',
      phase: 3,
      label: 'Manager-Modul-Tiles aktivieren',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP_MANAGER_STEP_06_TILE_ACTIVATION',
      preconditions: [
        { key: 'org_type_upgraded', source: 'organizations', description: 'Org-Typ muss Partner sein' },
      ],
      completion: [
        {
          key: 'tiles_activated',
          source: 'tenant_tile_activation',
          check: 'exists',
          description: 'Manager-Modul-Tile in tenant_tile_activation aktiv',
        },
      ],
      on_error: {
        ledger_event: 'manager.tiles.activation.error',
        status_update: 'org_upgraded',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Fehler bei Tile-Aktivierung',
      },
    },
    {
      id: 'welcome_notification',
      phase: 3,
      label: 'Willkommensbenachrichtigung senden',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP_MANAGER_STEP_07_WELCOME',
      preconditions: [
        { key: 'tiles_activated', source: 'tenant_tile_activation', description: 'Tiles muessen aktiviert sein' },
      ],
      completion: [
        {
          key: 'welcome_sent',
          source: 'notifications',
          check: 'exists',
          description: 'Willkommens-Notification versendet',
        },
      ],
    },

    // ─── PHASE 4: ASSIGNMENT (Z1 → Z2) ───────────────────────
    {
      id: 'first_client_assigned',
      phase: 4,
      label: 'Erster Kunde zugewiesen',
      type: 'action',
      routePattern: '/admin/armstrong',
      task_kind: 'wait_message',
      camunda_key: 'GP_MANAGER_STEP_08_FIRST_CLIENT',
      preconditions: [
        { key: 'tiles_activated', source: 'tenant_tile_activation', description: 'Manager muss freigeschaltet sein' },
      ],
      completion: [
        {
          key: 'first_client_assigned',
          source: 'org_links',
          check: 'exists',
          description: 'Mindestens ein org_link (manages) existiert',
        },
      ],
      contract_refs: [
        {
          key: 'CONTRACT_CLIENT_ASSIGNMENT',
          direction: 'Z1->Z2',
          correlation_keys: ['manager_org_id', 'client_org_id', 'module_code'],
          description: 'Z1 erstellt org_link und org_delegation fuer Manager',
        },
      ],
    },
    {
      id: 'org_link_created',
      phase: 4,
      label: 'org_link erstellt',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP_MANAGER_STEP_09_ORG_LINK',
      downstreamModules: ['MOD-09', 'MOD-10', 'MOD-11', 'MOD-12', 'MOD-13', 'MOD-22'],
      preconditions: [
        { key: 'first_client_assigned', source: 'org_links', description: 'Client muss zugewiesen sein' },
      ],
      completion: [
        {
          key: 'org_link_active',
          source: 'org_links',
          check: 'equals',
          value: 'active',
          description: 'org_links.status = active',
        },
      ],
    },
    {
      id: 'delegation_granted',
      phase: 4,
      label: 'Delegation erteilt',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP_MANAGER_STEP_10_DELEGATION',
      preconditions: [
        { key: 'org_link_active', source: 'org_links', description: 'org_link muss aktiv sein' },
      ],
      completion: [
        {
          key: 'delegation_active',
          source: 'org_delegations',
          check: 'equals',
          value: 'active',
          description: 'org_delegations.status = active',
        },
      ],
      on_error: {
        ledger_event: 'manager.delegation.grant.error',
        status_update: 'org_link_active',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Fehler beim Erteilen der Delegation — org_link bleibt aktiv',
      },
    },
  ],
};
