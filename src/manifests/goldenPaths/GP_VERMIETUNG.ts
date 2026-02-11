import type { GoldenPathDefinition } from './types';

/**
 * Golden Path GP-10: Vermietung — Vom Mietvertrag bis zum Mieter-Portal (V1.0)
 * 
 * Cross-Modul: MOD-04/05 (Vermieter) -> Z1 Governance -> MOD-20 (Mieter)
 * Cross-Tenant: Vermieter-Org -> Renter-Org
 * Akteure: Vermieter, System (Z1), Mieter (MOD-20)
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
    {
      table: 'leases',
      description: 'Mietvertrag muss existieren',
      scope: 'entity_id',
    },
    {
      table: 'renter_invites',
      description: 'Mieter-Einladung muss existieren',
      scope: 'entity_id',
    },
  ],

  required_contracts: [],

  ledger_events: [
    { event_type: 'renter.invite.sent', trigger: 'on_complete' },
    { event_type: 'renter.invite.accepted', trigger: 'on_complete' },
  ],

  success_state: {
    required_flags: [
      'lease_exists',
      'invite_sent',
      'invite_accepted',
      'portal_active',
    ],
    description: 'Mietvertrag aktiv, Mieter eingeladen und registriert, Portal-Zugang aktiv.',
  },

  failure_redirect: '/portal/mietverwaltung',

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

    // PHASE 2: MIETER EINLADEN
    {
      id: 'invite_renter',
      phase: 2,
      label: 'Mieter einladen',
      type: 'action',
      routePattern: '/portal/mietverwaltung',
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
    },

    // PHASE 3: EINLADUNG ANNEHMEN
    {
      id: 'accept_invite',
      phase: 3,
      label: 'Einladung annehmen (Mieter)',
      type: 'system',
      task_kind: 'wait_message',
      camunda_key: 'GP10_STEP_03_ACCEPT_INVITE',
      preconditions: [
        { key: 'invite_sent', source: 'renter_invites', description: 'Einladung muss versendet sein' },
      ],
      completion: [
        { key: 'invite_accepted', source: 'renter_invites', check: 'equals', value: 'accepted', description: 'renter_invites.status = accepted' },
      ],
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
    },
  ],
};
