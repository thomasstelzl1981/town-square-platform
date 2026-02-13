import type { GoldenPathDefinition } from './types';

/**
 * Golden Path MOD-04: Immobilie — Von Anlage bis Vertrieb (V1.0)
 * 
 * P0 Hardening: Fail-States fuer alle Cross-Zone und wait_message Steps.
 */
export const MOD_04_GOLDEN_PATH: GoldenPathDefinition = {
  // --- V1.0 Pflichtfelder ---
  id: 'gp-mod-04-immobilie',
  module: 'MOD-04',
  moduleCode: 'MOD-04',
  version: '2.0.0',
  label: 'Immobilie — Von Anlage bis Vertrieb',
  description:
    'Vollstaendiger Lebenszyklus einer Immobilie: Anlage, Dossier-Pflege, Vermarktung, Sichtbarkeit in Downstream-Modulen, optionale Kaufy-Aktivierung und Deaktivierung.',

  required_entities: [
    {
      table: 'properties',
      description: 'Immobilien-Stammdaten muessen existieren',
      scope: 'entity_id',
    },
    {
      table: 'units',
      description: 'Mindestens eine Einheit (MAIN) muss existieren',
      scope: 'entity_id',
    },
    {
      table: 'storage_nodes',
      description: 'Ordnerstruktur fuer Dokumente muss existieren',
      scope: 'entity_id',
    },
  ],

  required_contracts: [
    {
      key: 'verkaufsauftrag_consent',
      source: 'user_consents',
      description: 'Verkaufsauftrag-Vereinbarung muss akzeptiert werden',
    },
  ],

  ledger_events: [
    { event_type: 'listing.published', trigger: 'on_complete' },
    { event_type: 'listing.unpublished', trigger: 'on_complete' },
  ],

  success_state: {
    required_flags: [
      'property_exists',
      'main_unit_exists',
      'folder_structure_exists',
      'verkaufsauftrag_active',
      'listing_active',
      'partner_network_active',
    ],
    description: 'Immobilie ist vollstaendig angelegt, Verkaufsauftrag aktiv, im Partner-Netzwerk sichtbar.',
  },

  failure_redirect: '/portal/immobilien/portfolio',

  // --- Steps (unveraendert aus V0) ---
  steps: [
    // PHASE 1: OBJEKT ANLEGEN
    {
      id: 'create_property',
      phase: 1,
      label: 'Immobilie anlegen',
      type: 'action',
      routePattern: '/portal/immobilien/portfolio',
      task_kind: 'user_task',
      camunda_key: 'MOD04_STEP_01_CREATE_PROPERTY',
      preconditions: [
        { key: 'user_authenticated', source: 'auth', description: 'User muss eingeloggt sein' },
        { key: 'tenant_exists', source: 'organizations', description: 'Tenant/Organisation muss vorhanden sein' },
      ],
      completion: [
        { key: 'property_exists', source: 'properties', check: 'exists', description: 'Property-Row wurde erstellt' },
        { key: 'main_unit_exists', source: 'units', check: 'exists', description: 'MAIN-Unit wurde durch DB-Trigger erstellt' },
        { key: 'folder_structure_exists', source: 'storage_nodes', check: 'exists', description: 'Ordnerstruktur wurde durch DB-Trigger erstellt' },
      ],
    },

    // PHASE 2: IMMOBILIENAKTE BEARBEITEN
    {
      id: 'edit_dossier',
      phase: 2,
      label: 'Immobilienakte bearbeiten',
      type: 'route',
      routeId: 'MOD-04::dynamic::/:id',
      routePattern: '/portal/immobilien/:propertyId',
      task_kind: 'user_task',
      camunda_key: 'MOD04_STEP_02_EDIT_DOSSIER',
      preconditions: [
        { key: 'property_exists', source: 'properties', description: 'Property muss existieren' },
      ],
    },

    // PHASE 3: SICHTBARKEIT IN VERWALTUNG (ehemals MOD-05)
    {
      id: 'verwaltung_visibility',
      phase: 3,
      label: 'Sichtbarkeit in Verwaltung (MOD-04/Verwaltung)',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'MOD04_STEP_03_VERWALTUNG_VISIBILITY',
      downstreamModules: [],
      preconditions: [
        { key: 'property_exists', source: 'properties', description: 'Property muss existieren' },
        { key: 'main_unit_exists', source: 'units', description: 'MAIN-Unit muss existieren' },
      ],
      completion: [
        { key: 'unit_visible_in_verwaltung', source: 'units', check: 'exists', description: 'Einheit erscheint automatisch im Verwaltung-Tab' },
      ],
      on_error: {
        ledger_event: 'verwaltung.visibility.error',
        status_update: 'error',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Verwaltung-Tab Sichtbarkeit konnte nicht hergestellt werden',
      },
    },

    // PHASE 4: VERKAUFSAUFTRAG AKTIVIEREN
    {
      id: 'activate_sales_mandate',
      phase: 4,
      label: 'Verkaufsauftrag aktivieren',
      type: 'action',
      routeId: 'MOD-04::dynamic::/:id',
      routePattern: '/portal/immobilien/:id',
      queryParams: { tab: 'verkaufsauftrag' },
      task_kind: 'user_task',
      camunda_key: 'MOD04_STEP_04_ACTIVATE_MANDATE',
      preconditions: [
        { key: 'property_exists', source: 'properties', description: 'Property muss existieren' },
      ],
      completion: [
        { key: 'verkaufsauftrag_active', source: 'property_features', check: 'equals', value: 'active', description: 'property_features.verkaufsauftrag = active' },
        { key: 'listing_active', source: 'listings', check: 'equals', value: 'active', description: 'listings.status = active' },
        { key: 'partner_network_active', source: 'listing_publications', check: 'equals', value: 'active', description: 'listing_publications (partner_network) = active' },
        { key: 'sales_mandate_consent_linked', source: 'listings', check: 'not_null', description: 'listings.sales_mandate_consent_id IS NOT NULL' },
      ],
    },

    // PHASE 5: VERTRAG IN STAMMDATEN
    {
      id: 'stammdaten_contract',
      phase: 5,
      label: 'Vertrag in Stammdaten sichtbar',
      type: 'system',
      routePattern: '/portal/stammdaten/vertraege',
      task_kind: 'service_task',
      camunda_key: 'MOD04_STEP_05_STAMMDATEN_CONTRACT',
      preconditions: [
        { key: 'sales_mandate_consent_linked', source: 'listings', description: 'listings.sales_mandate_consent_id IS NOT NULL' },
      ],
      completion: [
        { key: 'contract_visible', source: 'listings', check: 'not_null', description: 'Verkaufsmandat erscheint in VertraegeTab' },
      ],
    },

    // PHASE 6: SALES DESK SICHTBARKEIT
    {
      id: 'sales_desk_visibility',
      phase: 6,
      label: 'Vertriebsauftrag im Sales Desk sichtbar',
      type: 'system',
      routePattern: '/admin/sales-desk',
      task_kind: 'wait_message',
      camunda_key: 'MOD04_STEP_06_SALES_DESK',
      sla_hours: 24,
      contract_refs: [
        {
          key: 'CONTRACT_SALES_MANDATE_SUBMIT',
          direction: 'Z2->Z1',
          correlation_keys: ['tenant_id', 'property_id', 'listing_id'],
          description: 'Verkaufsauftrag wird an Zone 1 Sales Desk uebermittelt',
        },
      ],
      preconditions: [
        { key: 'sales_mandate_consent_linked', source: 'listings', description: 'listings.sales_mandate_consent_id IS NOT NULL' },
        { key: 'listing_active', source: 'listings', description: 'listings.status = active' },
      ],
      completion: [
        { key: 'sales_desk_entry_visible', source: 'listings', check: 'exists', description: 'Eintrag in Sales Desk sichtbar' },
      ],
      on_timeout: {
        ledger_event: 'sales.desk.submit.timeout',
        status_update: 'timeout',
        recovery_strategy: 'manual_review',
        escalate_to: 'Z1',
        description: 'Sales Desk Submission nicht innerhalb 24h verarbeitet',
      },
      on_error: {
        ledger_event: 'sales.desk.submit.error',
        status_update: 'error',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Technischer Fehler bei Sales Desk Submission',
      },
    },

    // PHASE 7: MOD-09 KATALOG
    {
      id: 'mod09_katalog',
      phase: 7,
      label: 'Sichtbarkeit im Partner-Katalog (MOD-09)',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'MOD04_STEP_07_KATALOG',
      downstreamModules: ['MOD-09'],
      preconditions: [
        { key: 'partner_network_active', source: 'listing_publications', description: 'listing_publications (partner_network) = active' },
      ],
      completion: [
        { key: 'katalog_visible', source: 'listing_publications', check: 'exists', description: 'Objekt erscheint im KatalogTab' },
      ],
    },

    // PHASE 8: MOD-08 INVESTMENT-SUCHE
    {
      id: 'mod08_suche',
      phase: 8,
      label: 'Sichtbarkeit in Investment-Suche (MOD-08)',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'MOD04_STEP_08_SUCHE',
      downstreamModules: ['MOD-08'],
      preconditions: [
        { key: 'listing_active', source: 'listings', description: 'listings.status = active' },
      ],
      completion: [
        { key: 'suche_visible', source: 'listings', check: 'exists', description: 'Objekt erscheint in SucheTab' },
      ],
    },

    // PHASE 9: KAUFY-SICHTBARKEIT (OPTIONAL)
    {
      id: 'activate_kaufy',
      phase: 9,
      label: 'Kaufy-Marktplatz aktivieren',
      type: 'action',
      routeId: 'MOD-04::dynamic::/:id',
      routePattern: '/portal/immobilien/:id',
      queryParams: { tab: 'verkaufsauftrag' },
      task_kind: 'user_task',
      camunda_key: 'MOD04_STEP_09_ACTIVATE_KAUFY',
      preconditions: [
        { key: 'verkaufsauftrag_active', source: 'property_features', description: 'Verkaufsauftrag muss aktiv sein' },
      ],
      completion: [
        { key: 'kaufy_sichtbarkeit_active', source: 'property_features', check: 'equals', value: 'active', description: 'property_features.kaufy_sichtbarkeit = active' },
        { key: 'kaufy_publication_active', source: 'listing_publications', check: 'equals', value: 'active', description: 'listing_publications (kaufy) = active' },
      ],
    },

    // PHASE 10: KAUFY-WEBSITE (ZONE 3)
    {
      id: 'kaufy_website',
      phase: 10,
      label: 'Sichtbarkeit auf Kaufy-Website (Zone 3)',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'MOD04_STEP_10_KAUFY_WEBSITE',
      downstreamModules: ['ZONE-3'],
      preconditions: [
        { key: 'kaufy_publication_active', source: 'listing_publications', description: 'listing_publications (kaufy) = active' },
      ],
      completion: [
        { key: 'kaufy_website_visible', source: 'listing_publications', check: 'exists', description: 'Objekt auf Kaufy-Website sichtbar' },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // BACKBONE TOUCHPOINTS (Zone-1-orchestriert, Camunda-ready)
    // ═══════════════════════════════════════════════════════════

    // PHASE 6b: LISTING DISTRIBUTION VIA ZONE-1 BACKBONE (verbindlich)
    {
      id: 'listing_distribution_z1',
      phase: 6,
      label: 'Listing Distribution via Zone-1 Backbone',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'MOD04_STEP_06B_LISTING_DISTRIBUTE_Z1',
      sla_hours: 24,
      correlation_keys: ['tenant_id', 'property_id', 'listing_id'],
      contract_refs: [
        {
          key: 'CONTRACT_LISTING_PUBLISH',
          direction: 'Z2->Z1',
          correlation_keys: ['tenant_id', 'property_id', 'listing_id'],
          description: 'Listing-Request wird an Zone 1 Sales Desk / Governance Queue uebermittelt',
        },
        {
          key: 'CONTRACT_LISTING_DISTRIBUTE',
          direction: 'Z1->Z2',
          correlation_keys: ['tenant_id', 'property_id', 'listing_id'],
          description: 'Zone 1 verteilt Listing an Partner-Netzwerk (MOD-09), Investments (MOD-08), Kaufy (Zone 3)',
        },
      ],
      downstreamModules: ['MOD-09', 'MOD-08', 'ZONE-3'],
      preconditions: [
        { key: 'sales_desk_entry_visible', source: 'listings', description: 'Listing in Zone 1 Sales Desk sichtbar' },
      ],
      completion: [
        { key: 'katalog_visible', source: 'listing_publications', check: 'exists', description: 'Listing in Downstream-Modulen verteilt' },
      ],
      on_timeout: {
        ledger_event: 'listing.distribution.timeout',
        status_update: 'timeout',
        recovery_strategy: 'manual_review',
        escalate_to: 'Z1',
        description: 'Listing Distribution nicht innerhalb 24h abgeschlossen',
      },
      on_rejected: {
        ledger_event: 'listing.distribution.rejected',
        status_update: 'rejected',
        recovery_strategy: 'abort',
        description: 'Listing wurde von Zone 1 Governance abgelehnt',
      },
      on_duplicate: {
        ledger_event: 'listing.distribution.duplicate_detected',
        status_update: 'unchanged',
        recovery_strategy: 'ignore',
        description: 'Duplicate Listing Distribution Request erkannt',
      },
      on_error: {
        ledger_event: 'listing.distribution.error',
        status_update: 'error',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Technischer Fehler bei Listing Distribution',
      },
    },

    // PHASE 12: FINANCE HANDOFF VIA ZONE-1 FUTUREROOM (optional)
    {
      id: 'finance_handoff_z1',
      phase: 12,
      label: 'Finanzierung via Zone-1 FutureRoom (optional)',
      type: 'system',
      task_kind: 'wait_message',
      camunda_key: 'MOD04_STEP_12_FINANCE_HANDOFF_Z1',
      sla_hours: 24,
      correlation_keys: ['tenant_id', 'property_id', 'finance_request_id'],
      contract_refs: [
        {
          key: 'CONTRACT_FINANCE_SUBMIT',
          direction: 'Z2->Z1',
          correlation_keys: ['tenant_id', 'property_id', 'finance_request_id'],
          description: 'Finanzierungsanfrage wird an Zone 1 FutureRoom Case uebermittelt',
        },
        {
          key: 'CONTRACT_MANDATE_ASSIGNMENT',
          direction: 'Z1->Z2',
          correlation_keys: ['tenant_id', 'finance_request_id'],
          description: 'Zone 1 weist Finanzierungsmandat an MOD-11 Manager zu',
        },
      ],
      downstreamModules: ['MOD-07', 'MOD-11'],
      preconditions: [
        { key: 'property_exists', source: 'properties', description: 'Property muss existieren' },
      ],
      on_timeout: {
        ledger_event: 'finance.handoff.timeout',
        status_update: 'timeout',
        recovery_strategy: 'escalate_to_z1',
        escalate_to: 'Z1',
        description: 'Finance Handoff nicht innerhalb 24h verarbeitet',
      },
      on_error: {
        ledger_event: 'finance.handoff.error',
        status_update: 'error',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Technischer Fehler bei Finance Handoff',
      },
    },

    // PHASE 13: PROJECT INTAKE VIA ZONE-1 (optional)
    {
      id: 'project_intake_z1',
      phase: 13,
      label: 'Projekt-Intake via Zone-1 Delegation (optional)',
      type: 'system',
      task_kind: 'wait_message',
      camunda_key: 'MOD04_STEP_13_PROJECT_INTAKE_Z1',
      sla_hours: 24,
      correlation_keys: ['tenant_id', 'property_id', 'project_id'],
      contract_refs: [
        {
          key: 'CONTRACT_PROJECT_INTAKE',
          direction: 'Z1->Z2',
          correlation_keys: ['tenant_id', 'property_id', 'project_id'],
          description: 'Projekt-Zuordnung via Zone 1 Delegation an MOD-13',
        },
      ],
      downstreamModules: ['MOD-13'],
      preconditions: [
        { key: 'property_exists', source: 'properties', description: 'Property muss existieren' },
      ],
      on_timeout: {
        ledger_event: 'project.intake.timeout',
        status_update: 'timeout',
        recovery_strategy: 'manual_review',
        escalate_to: 'Z1',
        description: 'Project Intake nicht innerhalb 24h verarbeitet',
      },
      on_error: {
        ledger_event: 'project.intake.error',
        status_update: 'error',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Technischer Fehler bei Project Intake',
      },
    },

    // PHASE 11: DEAKTIVIERUNG (WIDERRUF)
    {
      id: 'deactivate_mandate',
      phase: 11,
      label: 'Verkaufsauftrag deaktivieren (Widerruf)',
      type: 'action',
      routeId: 'MOD-04::dynamic::/:id',
      routePattern: '/portal/immobilien/:id',
      queryParams: { tab: 'verkaufsauftrag' },
      task_kind: 'user_task',
      camunda_key: 'MOD04_STEP_11_DEACTIVATE',
      preconditions: [
        { key: 'verkaufsauftrag_active', source: 'property_features', description: 'Verkaufsauftrag muss aktuell aktiv sein' },
      ],
      completion: [
        { key: 'listing_deleted', source: 'listings', check: 'not_exists', description: 'Kein Listing mehr vorhanden (hard-deleted)' },
        { key: 'publications_deleted', source: 'listing_publications', check: 'not_exists', description: 'Keine Publikationen mehr vorhanden (hard-deleted)' },
        { key: 'features_inactive', source: 'property_features', check: 'equals', value: 'inactive', description: 'Alle features = inactive' },
      ],
    },
  ],
};
