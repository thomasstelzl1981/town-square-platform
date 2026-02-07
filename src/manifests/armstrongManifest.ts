/**
 * ARMSTRONG MANIFEST — SINGLE SOURCE OF TRUTH
 * 
 * Defines all Armstrong actions, their permissions, zones, and billing metadata.
 * This manifest drives both Zone 2 (Portal) and Zone 3 (Websites) behavior.
 * Zone 1 (Admin) uses this for the Armstrong Console (read-only viewer).
 * 
 * RULES:
 * 1. All actions must be declared here
 * 2. Zone field determines availability (Z2 = Portal, Z3 = Websites)
 * 3. Confirmation required for all metered/write actions
 * 4. Changes require explicit approval
 */

// =============================================================================
// TYPES
// =============================================================================

export type ArmstrongZone = 'Z2' | 'Z3';
export type RiskLevel = 'low' | 'medium' | 'high';
export type CostModel = 'free' | 'metered' | 'premium';
export type CostUnit = 'per_call' | 'per_token' | 'per_page' | null;

export interface ArmstrongAction {
  // Identification
  action_code: string;
  title_de: string;
  description_de: string;
  
  // Zone availability (Z1 removed - no chat in admin)
  zones: ArmstrongZone[];
  
  // Module association (null for global actions)
  module: string | null;
  
  // Security
  risk_level: RiskLevel;
  requires_confirmation: boolean;
  requires_consent_code: string | null;
  roles_allowed: string[];  // Empty = all authenticated users
  
  // Data access scopes
  data_scopes_read: string[];
  data_scopes_write: string[];
  
  // Billing
  cost_model: CostModel;
  cost_unit: CostUnit;
  cost_hint_cents: number | null;
  
  // Technical implementation
  api_contract: {
    type: 'edge_function' | 'rpc' | 'internal' | 'tool_call';
    endpoint: string | null;
    tool_name?: string;
  };
  
  // UI
  ui_entrypoints: string[];
  
  // Audit
  audit_event_type: string;
  
  // Status
  status: 'draft' | 'active' | 'deprecated';
}

// =============================================================================
// ZONE 3 ALLOWED ACTIONS (Public/Unauthenticated)
// =============================================================================

export const ZONE3_ALLOWED_ACTION_CODES = [
  // Explanations
  'ARM.GLOBAL.EXPLAIN_TERM',
  'ARM.GLOBAL.FAQ',
  
  // Public Calculators
  'ARM.PUBLIC.RENDITE_RECHNER',
  'ARM.PUBLIC.TILGUNG_RECHNER',
  'ARM.PUBLIC.BELASTUNG_RECHNER',
  
  // Lead Capture (no data storage, forwarding only)
  'ARM.PUBLIC.CONTACT_REQUEST',
  'ARM.PUBLIC.NEWSLETTER_SIGNUP',
  
  // Listing Info (published only)
  'ARM.PUBLIC.EXPLAIN_LISTING',
  'ARM.PUBLIC.COMPARE_LISTINGS',
] as const;

export type Zone3ActionCode = typeof ZONE3_ALLOWED_ACTION_CODES[number];

// =============================================================================
// ACTIONS REGISTRY
// =============================================================================

export const armstrongActions: ArmstrongAction[] = [
  // ===========================================================================
  // GLOBAL ACTIONS (Available in Z2 and Z3)
  // ===========================================================================
  {
    action_code: 'ARM.GLOBAL.EXPLAIN_TERM',
    title_de: 'Begriff erklären',
    description_de: 'Erklärt Immobilien- und Finanzierungsbegriffe verständlich',
    zones: ['Z2', 'Z3'],
    module: null,
    risk_level: 'low',
    requires_confirmation: false,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ['knowledge_base'],
    data_scopes_write: [],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'tool_call', endpoint: null, tool_name: 'search_knowledge' },
    ui_entrypoints: ['/portal', '/kaufy', '/miety', '/sot', '/futureroom'],
    audit_event_type: 'ARM_EXPLAIN_TERM',
    status: 'active',
  },
  {
    action_code: 'ARM.GLOBAL.FAQ',
    title_de: 'FAQ beantworten',
    description_de: 'Beantwortet häufig gestellte Fragen zu Plattform und Prozessen',
    zones: ['Z2', 'Z3'],
    module: null,
    risk_level: 'low',
    requires_confirmation: false,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ['knowledge_base'],
    data_scopes_write: [],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'internal', endpoint: null },
    ui_entrypoints: ['/portal', '/kaufy', '/miety', '/sot', '/futureroom'],
    audit_event_type: 'ARM_FAQ',
    status: 'active',
  },
  {
    action_code: 'ARM.GLOBAL.HOW_IT_WORKS',
    title_de: 'Modul-Onboarding',
    description_de: 'Erklärt wie ein Modul funktioniert und führt durch erste Schritte',
    zones: ['Z2'],
    module: null,
    risk_level: 'low',
    requires_confirmation: false,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ['routes_manifest', 'knowledge_base'],
    data_scopes_write: [],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'internal', endpoint: null },
    ui_entrypoints: ['/portal'],
    audit_event_type: 'ARM_HOW_IT_WORKS',
    status: 'active',
  },
  {
    action_code: 'ARM.GLOBAL.WEB_SEARCH',
    title_de: 'Web-Recherche',
    description_de: 'Recherchiert im Web nach aktuellen Informationen (mit Quellennachweis)',
    zones: ['Z2'],
    module: null,
    risk_level: 'medium',
    requires_confirmation: true,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: [],
    data_scopes_write: [],
    cost_model: 'metered',
    cost_unit: 'per_call',
    cost_hint_cents: 5,
    api_contract: { type: 'edge_function', endpoint: 'sot-armstrong-advisor' },
    ui_entrypoints: ['/portal'],
    audit_event_type: 'ARM_WEB_SEARCH',
    status: 'active',
  },

  // ===========================================================================
  // PUBLIC ACTIONS (Zone 3 only - Lead Capture)
  // ===========================================================================
  {
    action_code: 'ARM.PUBLIC.RENDITE_RECHNER',
    title_de: 'Rendite berechnen',
    description_de: 'Berechnet Brutto-, Netto- und Eigenkapitalrendite',
    zones: ['Z2', 'Z3'],
    module: null,
    risk_level: 'low',
    requires_confirmation: false,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: [],
    data_scopes_write: [],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'tool_call', endpoint: null, tool_name: 'calculate_investment' },
    ui_entrypoints: ['/kaufy', '/portal/investments'],
    audit_event_type: 'ARM_CALCULATE_YIELD',
    status: 'active',
  },
  {
    action_code: 'ARM.PUBLIC.TILGUNG_RECHNER',
    title_de: 'Tilgung berechnen',
    description_de: 'Berechnet Tilgungsplan und Restschuld',
    zones: ['Z2', 'Z3'],
    module: null,
    risk_level: 'low',
    requires_confirmation: false,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: [],
    data_scopes_write: [],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'tool_call', endpoint: null, tool_name: 'calculate_investment' },
    ui_entrypoints: ['/kaufy', '/portal/finanzierung'],
    audit_event_type: 'ARM_CALCULATE_AMORTIZATION',
    status: 'active',
  },
  {
    action_code: 'ARM.PUBLIC.BELASTUNG_RECHNER',
    title_de: 'Monatliche Belastung berechnen',
    description_de: 'Berechnet die monatliche Netto-Belastung nach Steuern',
    zones: ['Z2', 'Z3'],
    module: null,
    risk_level: 'low',
    requires_confirmation: false,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: [],
    data_scopes_write: [],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'tool_call', endpoint: null, tool_name: 'calculate_investment' },
    ui_entrypoints: ['/kaufy', '/portal/investments'],
    audit_event_type: 'ARM_CALCULATE_BURDEN',
    status: 'active',
  },
  {
    action_code: 'ARM.PUBLIC.CONTACT_REQUEST',
    title_de: 'Kontaktanfrage',
    description_de: 'Leitet eine Kontaktanfrage an das Lead-System weiter',
    zones: ['Z3'],
    module: null,
    risk_level: 'low',
    requires_confirmation: true,
    requires_consent_code: 'CONSENT_CONTACT',
    roles_allowed: [],
    data_scopes_read: [],
    data_scopes_write: [],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'edge_function', endpoint: 'sot-lead-inbox' },
    ui_entrypoints: ['/kaufy', '/miety', '/sot', '/futureroom'],
    audit_event_type: 'ARM_CONTACT_REQUEST',
    status: 'active',
  },
  {
    action_code: 'ARM.PUBLIC.NEWSLETTER_SIGNUP',
    title_de: 'Newsletter anmelden',
    description_de: 'Meldet für den Newsletter an',
    zones: ['Z3'],
    module: null,
    risk_level: 'low',
    requires_confirmation: true,
    requires_consent_code: 'CONSENT_NEWSLETTER',
    roles_allowed: [],
    data_scopes_read: [],
    data_scopes_write: [],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'edge_function', endpoint: 'sot-lead-inbox' },
    ui_entrypoints: ['/kaufy', '/miety', '/sot', '/futureroom'],
    audit_event_type: 'ARM_NEWSLETTER_SIGNUP',
    status: 'active',
  },
  {
    action_code: 'ARM.PUBLIC.EXPLAIN_LISTING',
    title_de: 'Objekt erklären',
    description_de: 'Erklärt Details eines öffentlichen Inserats',
    zones: ['Z2', 'Z3'],
    module: null,
    risk_level: 'low',
    requires_confirmation: false,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ['listings_published'],
    data_scopes_write: [],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'internal', endpoint: null },
    ui_entrypoints: ['/kaufy', '/portal/investments'],
    audit_event_type: 'ARM_EXPLAIN_LISTING',
    status: 'active',
  },
  {
    action_code: 'ARM.PUBLIC.COMPARE_LISTINGS',
    title_de: 'Objekte vergleichen',
    description_de: 'Vergleicht mehrere Inserate nach Kennzahlen',
    zones: ['Z2', 'Z3'],
    module: null,
    risk_level: 'low',
    requires_confirmation: false,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ['listings_published'],
    data_scopes_write: [],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'internal', endpoint: null },
    ui_entrypoints: ['/kaufy', '/portal/investments'],
    audit_event_type: 'ARM_COMPARE_LISTINGS',
    status: 'active',
  },

  // ===========================================================================
  // MOD-02: KI OFFICE ACTIONS
  // ===========================================================================
  {
    action_code: 'ARM.MOD02.SEND_LETTER',
    title_de: 'Brief absenden',
    description_de: 'Sendet einen vorbereiteten Brief per E-Mail, Fax oder Post',
    zones: ['Z2'],
    module: 'MOD-02',
    risk_level: 'medium',
    requires_confirmation: true,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ['letter_drafts', 'contacts'],
    data_scopes_write: ['letter_sent'],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'edge_function', endpoint: 'sot-letter-send' },
    ui_entrypoints: ['/portal/office/brief'],
    audit_event_type: 'ARM_LETTER_SEND',
    status: 'active',
  },

  // ===========================================================================
  // MOD-03: DMS ACTIONS
  // ===========================================================================
  {
    action_code: 'ARM.MOD03.SEARCH_DOC',
    title_de: 'Dokument suchen',
    description_de: 'Durchsucht das DMS nach Dokumenten',
    zones: ['Z2'],
    module: 'MOD-03',
    risk_level: 'low',
    requires_confirmation: false,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ['storage_nodes', 'documents'],
    data_scopes_write: [],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'rpc', endpoint: 'search_documents' },
    ui_entrypoints: ['/portal/dms'],
    audit_event_type: 'ARM_DOC_SEARCH',
    status: 'active',
  },
  {
    action_code: 'ARM.MOD03.EXPLAIN_UPLOAD',
    title_de: 'Upload-Workflow erklären',
    description_de: 'Erklärt wie Dokumente hochgeladen und organisiert werden',
    zones: ['Z2'],
    module: 'MOD-03',
    risk_level: 'low',
    requires_confirmation: false,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ['knowledge_base'],
    data_scopes_write: [],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'internal', endpoint: null },
    ui_entrypoints: ['/portal/dms'],
    audit_event_type: 'ARM_EXPLAIN_UPLOAD',
    status: 'active',
  },
  {
    action_code: 'ARM.MOD03.LINK_DOC',
    title_de: 'Dokument verknüpfen',
    description_de: 'Verknüpft ein Dokument mit einer Immobilie oder Entität',
    zones: ['Z2'],
    module: 'MOD-03',
    risk_level: 'medium',
    requires_confirmation: true,
    requires_consent_code: null,
    roles_allowed: ['org_admin', 'org_member'],
    data_scopes_read: ['storage_nodes', 'properties'],
    data_scopes_write: ['document_links'],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'rpc', endpoint: 'link_document_to_entity' },
    ui_entrypoints: ['/portal/dms', '/portal/immobilien'],
    audit_event_type: 'ARM_DOC_LINK',
    status: 'active',
  },
  {
    action_code: 'ARM.MOD03.EXTRACT_DOC',
    title_de: 'Dokument extrahieren',
    description_de: 'Extrahiert strukturierte Daten aus einem Dokument via KI',
    zones: ['Z2'],
    module: 'MOD-03',
    risk_level: 'high',
    requires_confirmation: true,
    requires_consent_code: 'CONSENT_EXTRACTION',
    roles_allowed: ['org_admin'],
    data_scopes_read: ['storage_nodes', 'documents'],
    data_scopes_write: ['extracted_data'],
    cost_model: 'metered',
    cost_unit: 'per_page',
    cost_hint_cents: 2,
    api_contract: { type: 'edge_function', endpoint: 'sot-document-parser' },
    ui_entrypoints: ['/portal/dms'],
    audit_event_type: 'ARM_DOC_EXTRACT',
    status: 'active',
  },

  // ===========================================================================
  // MOD-04: IMMOBILIEN ACTIONS
  // ===========================================================================
  {
    action_code: 'ARM.MOD04.EXPLAIN_MODULE',
    title_de: 'Immobilien-Modul erklären',
    description_de: 'Erklärt die Funktionen des Immobilien-Moduls',
    zones: ['Z2'],
    module: 'MOD-04',
    risk_level: 'low',
    requires_confirmation: false,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ['knowledge_base'],
    data_scopes_write: [],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'internal', endpoint: null },
    ui_entrypoints: ['/portal/immobilien'],
    audit_event_type: 'ARM_EXPLAIN_MOD04',
    status: 'active',
  },
  {
    action_code: 'ARM.MOD04.VALIDATE_PROPERTY',
    title_de: 'Datenqualität prüfen',
    description_de: 'Analysiert Vollständigkeit und Qualität der Immobiliendaten',
    zones: ['Z2'],
    module: 'MOD-04',
    risk_level: 'low',
    requires_confirmation: false,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ['properties', 'units', 'leases'],
    data_scopes_write: [],
    cost_model: 'metered',
    cost_unit: 'per_call',
    cost_hint_cents: 1,
    api_contract: { type: 'internal', endpoint: null },
    ui_entrypoints: ['/portal/immobilien'],
    audit_event_type: 'ARM_VALIDATE_PROPERTY',
    status: 'active',
  },
  {
    action_code: 'ARM.MOD04.CREATE_PROPERTY',
    title_de: 'Immobilie anlegen',
    description_de: 'Erstellt einen neuen Immobilien-Datensatz (Draft)',
    zones: ['Z2'],
    module: 'MOD-04',
    risk_level: 'high',
    requires_confirmation: true,
    requires_consent_code: null,
    roles_allowed: ['org_admin'],
    data_scopes_read: [],
    data_scopes_write: ['properties'],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'edge_function', endpoint: 'sot-property-crud' },
    ui_entrypoints: ['/portal/immobilien/portfolio'],
    audit_event_type: 'ARM_PROPERTY_CREATE',
    status: 'active',
  },
  {
    action_code: 'ARM.MOD04.CREATE_UNIT',
    title_de: 'Einheit anlegen',
    description_de: 'Erstellt eine neue Einheit für eine Immobilie',
    zones: ['Z2'],
    module: 'MOD-04',
    risk_level: 'high',
    requires_confirmation: true,
    requires_consent_code: null,
    roles_allowed: ['org_admin'],
    data_scopes_read: ['properties'],
    data_scopes_write: ['units'],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'edge_function', endpoint: 'sot-property-crud' },
    ui_entrypoints: ['/portal/immobilien'],
    audit_event_type: 'ARM_UNIT_CREATE',
    status: 'active',
  },
  {
    action_code: 'ARM.MOD04.CALCULATE_KPI',
    title_de: 'KPIs berechnen',
    description_de: 'Berechnet Rendite, Cashflow und andere Kennzahlen',
    zones: ['Z2'],
    module: 'MOD-04',
    risk_level: 'low',
    requires_confirmation: false,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ['properties', 'units', 'leases'],
    data_scopes_write: [],
    cost_model: 'metered',
    cost_unit: 'per_call',
    cost_hint_cents: 1,
    api_contract: { type: 'tool_call', endpoint: null, tool_name: 'calculate_investment' },
    ui_entrypoints: ['/portal/immobilien'],
    audit_event_type: 'ARM_CALCULATE_KPI',
    status: 'active',
  },
  {
    action_code: 'ARM.MOD04.LINK_DOCUMENTS',
    title_de: 'Dokumente verknüpfen',
    description_de: 'Verknüpft Dokumente mit der Immobilienakte',
    zones: ['Z2'],
    module: 'MOD-04',
    risk_level: 'medium',
    requires_confirmation: true,
    requires_consent_code: null,
    roles_allowed: ['org_admin', 'org_member'],
    data_scopes_read: ['properties', 'storage_nodes'],
    data_scopes_write: ['document_links'],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'rpc', endpoint: 'link_document_to_entity' },
    ui_entrypoints: ['/portal/immobilien'],
    audit_event_type: 'ARM_DOC_LINK',
    status: 'active',
  },
  {
    action_code: 'ARM.MOD04.DATA_QUALITY_CHECK',
    title_de: 'Vollständigkeit prüfen',
    description_de: 'Zeigt Checkliste der fehlenden Daten und Dokumente',
    zones: ['Z2'],
    module: 'MOD-04',
    risk_level: 'low',
    requires_confirmation: false,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ['properties', 'units', 'documents'],
    data_scopes_write: [],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'internal', endpoint: null },
    ui_entrypoints: ['/portal/immobilien'],
    audit_event_type: 'ARM_DATA_QUALITY',
    status: 'active',
  },

  // ===========================================================================
  // MOD-07: FINANZIERUNG ACTIONS
  // ===========================================================================
  {
    action_code: 'ARM.MOD07.EXPLAIN_SELBSTAUSKUNFT',
    title_de: 'Selbstauskunft erklären',
    description_de: 'Erklärt welche Daten benötigt werden und warum',
    zones: ['Z2'],
    module: 'MOD-07',
    risk_level: 'low',
    requires_confirmation: false,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ['knowledge_base'],
    data_scopes_write: [],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'internal', endpoint: null },
    ui_entrypoints: ['/portal/finanzierung'],
    audit_event_type: 'ARM_EXPLAIN_SELBSTAUSKUNFT',
    status: 'active',
  },
  {
    action_code: 'ARM.MOD07.DOC_CHECKLIST',
    title_de: 'Dokument-Checkliste',
    description_de: 'Zeigt welche Dokumente für die Finanzierung benötigt werden',
    zones: ['Z2'],
    module: 'MOD-07',
    risk_level: 'low',
    requires_confirmation: false,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ['applicant_profiles', 'documents'],
    data_scopes_write: [],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'internal', endpoint: null },
    ui_entrypoints: ['/portal/finanzierung'],
    audit_event_type: 'ARM_DOC_CHECKLIST',
    status: 'active',
  },
  {
    action_code: 'ARM.MOD07.PREPARE_EXPORT',
    title_de: 'Export vorbereiten',
    description_de: 'Bereitet das Finanzierungspaket für den Export vor',
    zones: ['Z2'],
    module: 'MOD-07',
    risk_level: 'medium',
    requires_confirmation: true,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ['applicant_profiles', 'documents', 'finance_requests'],
    data_scopes_write: ['export_packages'],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'edge_function', endpoint: 'sot-docs-export' },
    ui_entrypoints: ['/portal/finanzierung'],
    audit_event_type: 'ARM_PREPARE_EXPORT',
    status: 'active',
  },
  {
    action_code: 'ARM.MOD07.VALIDATE_READINESS',
    title_de: 'Finanzierungsbereitschaft',
    description_de: 'Analysiert ob alle Voraussetzungen für eine Finanzierungsanfrage erfüllt sind',
    zones: ['Z2'],
    module: 'MOD-07',
    risk_level: 'low',
    requires_confirmation: false,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ['applicant_profiles', 'documents'],
    data_scopes_write: [],
    cost_model: 'metered',
    cost_unit: 'per_call',
    cost_hint_cents: 2,
    api_contract: { type: 'internal', endpoint: null },
    ui_entrypoints: ['/portal/finanzierung'],
    audit_event_type: 'ARM_VALIDATE_READINESS',
    status: 'active',
  },

  // ===========================================================================
  // MOD-08: INVESTMENT-SUCHE ACTIONS
  // ===========================================================================
  {
    action_code: 'ARM.MOD08.ANALYZE_FAVORITE',
    title_de: 'Favorit analysieren',
    description_de: 'Analysiert ein Objekt aus den Favoriten mit Detailbewertung',
    zones: ['Z2'],
    module: 'MOD-08',
    risk_level: 'low',
    requires_confirmation: false,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ['favorites', 'listings'],
    data_scopes_write: [],
    cost_model: 'metered',
    cost_unit: 'per_call',
    cost_hint_cents: 3,
    api_contract: { type: 'tool_call', endpoint: null, tool_name: 'calculate_investment' },
    ui_entrypoints: ['/portal/investments'],
    audit_event_type: 'ARM_ANALYZE_FAVORITE',
    status: 'active',
  },
  {
    action_code: 'ARM.MOD08.RUN_SIMULATION',
    title_de: 'Investment-Simulation',
    description_de: 'Führt eine vollständige Investment-Simulation durch',
    zones: ['Z2'],
    module: 'MOD-08',
    risk_level: 'low',
    requires_confirmation: false,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: [],
    data_scopes_write: [],
    cost_model: 'metered',
    cost_unit: 'per_call',
    cost_hint_cents: 2,
    api_contract: { type: 'edge_function', endpoint: 'sot-investment-engine' },
    ui_entrypoints: ['/portal/investments/simulation'],
    audit_event_type: 'ARM_RUN_SIMULATION',
    status: 'active',
  },
  {
    action_code: 'ARM.MOD08.CREATE_MANDATE',
    title_de: 'Suchmandat anlegen',
    description_de: 'Erstellt ein neues Suchmandat für die Akquise',
    zones: ['Z2'],
    module: 'MOD-08',
    risk_level: 'high',
    requires_confirmation: true,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ['applicant_profiles'],
    data_scopes_write: ['acq_mandates'],
    cost_model: 'free',
    cost_unit: null,
    cost_hint_cents: null,
    api_contract: { type: 'rpc', endpoint: 'create_mandate' },
    ui_entrypoints: ['/portal/investments/mandat'],
    audit_event_type: 'ARM_CREATE_MANDATE',
    status: 'active',
  },
  {
    action_code: 'ARM.MOD08.WEB_RESEARCH',
    title_de: 'Standort-Recherche',
    description_de: 'Recherchiert Standortinformationen aus öffentlichen Quellen',
    zones: ['Z2'],
    module: 'MOD-08',
    risk_level: 'medium',
    requires_confirmation: true,
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: [],
    data_scopes_write: [],
    cost_model: 'metered',
    cost_unit: 'per_call',
    cost_hint_cents: 5,
    api_contract: { type: 'edge_function', endpoint: 'sot-armstrong-advisor' },
    ui_entrypoints: ['/portal/investments'],
    audit_event_type: 'ARM_WEB_RESEARCH',
    status: 'active',
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all actions available for a specific zone
 */
export function getActionsForZone(zone: ArmstrongZone): ArmstrongAction[] {
  return armstrongActions.filter(action => 
    action.zones.includes(zone) && action.status === 'active'
  );
}

/**
 * Get all actions for a specific module
 */
export function getActionsForModule(moduleCode: string): ArmstrongAction[] {
  return armstrongActions.filter(action => 
    action.module === moduleCode && action.status === 'active'
  );
}

/**
 * Get action by code
 */
export function getAction(actionCode: string): ArmstrongAction | undefined {
  return armstrongActions.find(action => action.action_code === actionCode);
}

/**
 * Check if an action requires confirmation
 */
export function requiresConfirmation(actionCode: string): boolean {
  const action = getAction(actionCode);
  return action?.requires_confirmation ?? false;
}

/**
 * Check if action is allowed in Zone 3
 */
export function isZone3Action(actionCode: string): boolean {
  return ZONE3_ALLOWED_ACTION_CODES.includes(actionCode as Zone3ActionCode);
}

/**
 * Get all metered actions (for billing dashboard)
 */
export function getMeteredActions(): ArmstrongAction[] {
  return armstrongActions.filter(action => action.cost_model === 'metered');
}

/**
 * Filter actions by role
 */
export function filterActionsByRole(
  actions: ArmstrongAction[], 
  userRoles: string[]
): ArmstrongAction[] {
  return actions.filter(action => {
    // Empty roles_allowed means all authenticated users can access
    if (action.roles_allowed.length === 0) return true;
    // Check if user has any of the required roles
    return action.roles_allowed.some(role => userRoles.includes(role));
  });
}
