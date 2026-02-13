import type { GoldenPathDefinition } from './types';

/**
 * Golden Path GP-10: Vermietung — Vom Mietvertrag bis zum Mieter-Portal (V1.0)
 * 
 * P0 Hardening: Fail-States fuer Cross-Zone und wait_message Steps.
 */
export const GP_VERMIETUNG_GOLDEN_PATH: GoldenPathDefinition = {
  id: 'gp-rental-lifecycle',
  module: 'MOD-05/MOD-20',
  moduleCode: 'MOD-05',
  version: '1.0.0',
  label: 'Vermietung — Vom Mietvertrag bis zum Mieter-Portal',
  description:
    'Vollstaendiger Vermietungszyklus: Mietvertrag anlegen, Mieter einladen, Einladung annehmen, Datenraum aktivieren, Portal-Zugang bereitstellen. Cross-Tenant Flow (Vermieter-Org -> Renter-Org).',

  required_entities: [
    { table: 'leases', description: 'Mietvertrag muss existieren', scope: 'entity_id' },
    { table: 'renter_invites', description: 'Mieter-Einladung muss existieren', scope: 'entity_id' },
  ],
  required_contracts: [],
  ledger_events: [
    { event_type: 'renter.invite.sent', trigger: 'on_complete' },
    { event_type: 'renter.invite.accepted', trigger: 'on_complete' },
  ],
  success_state: {
    required_flags: ['lease_exists', 'invite_sent', 'invite_accepted', 'portal_active'],
    description: 'Mietvertrag aktiv, Mieter eingeladen und registriert, Portal-Zugang aktiv.',
  },
  failure_redirect: '/portal/immobilien/verwaltung',

  steps: [
    // PHASE 1: MIETVERTRAG ANLEGEN
    {
      id: 'create_lease',
      phase: 1,
      label: 'Mietvertrag anlegen',
      type: 'action',
      routePattern: '/portal/immobilien/:propertyId',
      task_kind: 'user_task',
      camunda_key: 'GP10_STEP_01_CREATE_LEASE',
      preconditions: [
        { key: 'user_authenticated', source: 'auth', description: 'Vermieter muss eingeloggt sein' },
        { key: 'property_exists', source: 'properties', description: 'Immobilie muss existieren' },
        { key: 'unit_exists', source: 'units', description: 'Einheit muss existieren' },
      ],
      completion: [
        { key: 'lease_exists', source: 'leases', check: 'exists', description: 'Mietvertrag wurde erstellt' },
      ],
    },

    // PHASE 2: MIETER EINLADEN (Cross-Zone Z2->Z1)
    {
      id: 'invite_renter',
      phase: 2,
      label: 'Mieter einladen',
      type: 'action',
      routePattern: '/portal/immobilien/verwaltung',
      task_kind: 'user_task',
      camunda_key: 'GP10_STEP_02_INVITE_RENTER',
      contract_refs: [
        {
          key: 'CONTRACT_RENTER_INVITE',
          direction: 'Z2->Z1',
          correlation_keys: ['tenant_id', 'lease_id', 'contact_id', 'email'],
          description: 'Mieter-Einladung wird an Z1 Governance uebermittelt (Email-Dispatch)',
        },
      ],
      preconditions: [
        { key: 'lease_exists', source: 'leases', description: 'Mietvertrag muss existieren' },
      ],
      completion: [
        { key: 'invite_sent', source: 'renter_invites', check: 'exists', description: 'Einladung wurde erstellt und versendet' },
      ],
      on_timeout: {
        ledger_event: 'renter.invite.send.timeout',
        status_update: 'timeout',
        recovery_strategy: 'manual_review',
        escalate_to: 'Z1',
        description: 'Invite Email nicht innerhalb 24h versendet',
      },
      on_duplicate: {
        ledger_event: 'renter.invite.duplicate_detected',
        status_update: 'unchanged',
        recovery_strategy: 'ignore',
        description: 'Duplicate Invite fuer diesen Lease erkannt',
      },
      on_error: {
        ledger_event: 'renter.invite.send.error',
        status_update: 'error',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Technischer Fehler bei Invite-Versand',
      },
    },

    // PHASE 3: EINLADUNG ANNEHMEN (wait_message — 72h SLA)
    {
      id: 'accept_invite',
      phase: 3,
      label: 'Einladung annehmen (Mieter)',
      type: 'system',
      task_kind: 'wait_message',
      camunda_key: 'GP10_STEP_03_ACCEPT_INVITE',
      sla_hours: 72,
      preconditions: [
        { key: 'invite_sent', source: 'renter_invites', description: 'Einladung muss versendet sein' },
      ],
      completion: [
        { key: 'invite_accepted', source: 'renter_invites', check: 'equals', value: 'accepted', description: 'renter_invites.status = accepted' },
      ],
      on_timeout: {
        ledger_event: 'renter.invite.expired',
        status_update: 'expired',
        recovery_strategy: 'manual_review',
        description: 'Einladung nicht innerhalb 72h angenommen — Token abgelaufen',
      },
      on_rejected: {
        ledger_event: 'renter.invite.rejected',
        status_update: 'rejected',
        recovery_strategy: 'abort',
        description: 'Einladung wurde vom Mieter explizit abgelehnt',
      },
      on_error: {
        ledger_event: 'renter.invite.accept.error',
        status_update: 'error',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Technischer Fehler bei Invite-Annahme',
      },
    },

    // PHASE 4: DATENRAUM AKTIVIEREN
    {
      id: 'activate_data_room',
      phase: 4,
      label: 'Datenraum aktivieren',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP10_STEP_04_ACTIVATE_DATA_ROOM',
      preconditions: [
        { key: 'invite_accepted', source: 'renter_invites', description: 'Einladung muss angenommen sein' },
      ],
      on_error: {
        ledger_event: 'renter.data_room.activation.error',
        status_update: 'error',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Technischer Fehler bei Data Room Aktivierung',
      },
    },

    // PHASE 5: PORTAL-ZUGANG AKTIV
    {
      id: 'portal_active',
      phase: 5,
      label: 'Mieter-Portal aktiv (MOD-20)',
      type: 'system',
      routePattern: '/portal/miety/uebersicht',
      task_kind: 'service_task',
      camunda_key: 'GP10_STEP_05_PORTAL_ACTIVE',
      downstreamModules: ['MOD-20'],
      preconditions: [
        { key: 'invite_accepted', source: 'renter_invites', description: 'Einladung muss angenommen sein' },
      ],
      completion: [
        { key: 'portal_active', source: 'miety_homes', check: 'exists', description: 'Zuhause-Akte in MOD-20 existiert' },
      ],
      on_error: {
        ledger_event: 'renter.portal.activation.error',
        status_update: 'error',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Technischer Fehler bei Portal-Aktivierung',
      },
    },
  ],
};
