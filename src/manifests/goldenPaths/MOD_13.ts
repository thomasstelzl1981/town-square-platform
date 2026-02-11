import type { GoldenPathDefinition } from './types';

/**
 * Golden Path GP-05: Projekte — Vom Projekt bis zur Distribution (V1.0)
 * 
 * Modul: MOD-13 (Projekte / Bautraeger)
 * Akteure: Bautraeger (MOD-13), System (MOD-04, MOD-06, MOD-09, Z3)
 */
export const MOD_13_GOLDEN_PATH: GoldenPathDefinition = {
  id: 'gp-project-lifecycle',
  module: 'MOD-13',
  moduleCode: 'MOD-13',
  version: '1.0.0',
  label: 'Projekte — Vom Projekt bis zur Distribution',
  description:
    'Vollstaendiger Projektzyklus: Projekt anlegen, Einheiten planen, Phasenwechsel, Listing-Distribution, Landing Page, Uebergabe.',

  required_entities: [
    {
      table: 'dev_projects',
      description: 'Projekt-Stammdaten muessen existieren',
      scope: 'entity_id',
    },
    {
      table: 'dev_project_units',
      description: 'Mindestens eine Projekteinheit muss existieren',
      scope: 'entity_id',
    },
  ],

  required_contracts: [],

  ledger_events: [
    { event_type: 'project.created', trigger: 'on_complete' },
    { event_type: 'project.phase.changed', trigger: 'on_complete' },
    { event_type: 'listing.published', trigger: 'on_complete' },
  ],

  success_state: {
    required_flags: [
      'project_exists',
      'units_created',
      'listings_published',
      'distribution_active',
    ],
    description: 'Projekt vollstaendig angelegt, Einheiten erstellt, Listings veroeffentlicht und verteilt.',
  },

  failure_redirect: '/portal/projekte',

  steps: [
    // PHASE 1: PROJEKT ANLEGEN
    {
      id: 'create_project',
      phase: 1,
      label: 'Projekt anlegen',
      type: 'action',
      routePattern: '/portal/projekte',
      task_kind: 'user_task',
      camunda_key: 'GP05_STEP_01_CREATE_PROJECT',
      preconditions: [
        { key: 'user_authenticated', source: 'auth', description: 'User muss eingeloggt sein' },
        { key: 'tenant_exists', source: 'organizations', description: 'Tenant muss vorhanden sein' },
      ],
      completion: [
        { key: 'project_exists', source: 'dev_projects', check: 'exists', description: 'Projekt wurde erstellt' },
      ],
    },

    // PHASE 2: EINHEITEN PLANEN
    {
      id: 'plan_units',
      phase: 2,
      label: 'Einheiten planen',
      type: 'route',
      routePattern: '/portal/projekte/:projectId',
      task_kind: 'user_task',
      camunda_key: 'GP05_STEP_02_PLAN_UNITS',
      preconditions: [
        { key: 'project_exists', source: 'dev_projects', description: 'Projekt muss existieren' },
      ],
      completion: [
        { key: 'units_created', source: 'dev_project_units', check: 'exists', description: 'Mindestens eine Einheit wurde angelegt' },
      ],
    },

    // PHASE 3: PHASENWECHSEL BAU -> VERTRIEB
    {
      id: 'phase_change_sales',
      phase: 3,
      label: 'Phasenwechsel Bau → Vertrieb',
      type: 'action',
      routePattern: '/portal/projekte/:projectId',
      task_kind: 'user_task',
      camunda_key: 'GP05_STEP_03_PHASE_CHANGE',
      contract_refs: [
        {
          key: 'CONTRACT_PROJECT_INTAKE',
          direction: 'Z1->Z2',
          correlation_keys: ['tenant_id', 'project_id'],
          description: 'Optionaler Projekt-Intake via Z1 Delegation',
        },
      ],
      preconditions: [
        { key: 'units_created', source: 'dev_project_units', description: 'Einheiten muessen existieren' },
      ],
      completion: [
        { key: 'phase_vertrieb', source: 'dev_projects', check: 'equals', value: 'sales', description: 'dev_projects.phase = sales' },
      ],
    },

    // PHASE 4: LISTING DISTRIBUTION
    {
      id: 'listing_distribution',
      phase: 4,
      label: 'Listing-Distribution aktivieren',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP05_STEP_04_LISTING_DISTRIBUTE',
      contract_refs: [
        {
          key: 'CONTRACT_LISTING_PUBLISH',
          direction: 'Z2->Z1',
          correlation_keys: ['tenant_id', 'project_id', 'listing_id'],
          description: 'Projekt-Listings werden an Z1 uebermittelt',
        },
        {
          key: 'CONTRACT_LISTING_DISTRIBUTE',
          direction: 'Z1->Z2',
          correlation_keys: ['tenant_id', 'project_id', 'listing_id'],
          description: 'Z1 verteilt Listings an MOD-09, MOD-08, Kaufy',
        },
      ],
      downstreamModules: ['MOD-09', 'MOD-08', 'ZONE-3'],
      preconditions: [
        { key: 'phase_vertrieb', source: 'dev_projects', description: 'Projekt muss in Vertriebsphase sein' },
      ],
      completion: [
        { key: 'listings_published', source: 'listings', check: 'exists', description: 'Listings fuer Projekteinheiten erstellt' },
        { key: 'distribution_active', source: 'listing_publications', check: 'exists', description: 'Listings in Downstream-Modulen verteilt' },
      ],
    },

    // PHASE 5: LANDING PAGE
    {
      id: 'landing_page',
      phase: 5,
      label: 'Landing Page erstellen',
      type: 'system',
      routePattern: '/portal/projekte/:projectId',
      task_kind: 'service_task',
      camunda_key: 'GP05_STEP_05_LANDING_PAGE',
      contract_refs: [
        {
          key: 'CONTRACT_LANDING_PAGE_GENERATE',
          direction: 'Z1->Z2',
          correlation_keys: ['tenant_id', 'project_id'],
          description: 'Landing Page wird fuer Projekt generiert',
        },
      ],
      downstreamModules: ['ZONE-3'],
      preconditions: [
        { key: 'listings_published', source: 'listings', description: 'Listings muessen existieren' },
      ],
    },

    // PHASE 6: UEBERGABE + ABSCHLUSS
    {
      id: 'handover_complete',
      phase: 6,
      label: 'Uebergabe und Abschluss',
      type: 'action',
      routePattern: '/portal/projekte/:projectId',
      task_kind: 'user_task',
      camunda_key: 'GP05_STEP_06_HANDOVER',
      preconditions: [
        { key: 'listings_published', source: 'listings', description: 'Listings muessen publiziert sein' },
      ],
    },
  ],
};
