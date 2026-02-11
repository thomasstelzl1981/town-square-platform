/**
 * Golden Path Type Definitions V1.0 — SSOT
 * 
 * Deklarative Typen fuer Golden-Path-Definitionen.
 * Camunda-Ready: task_kind, camunda_key, correlation_keys vorbereitet.
 * Backbone-Regel: ContractRefs erzwingen Cross-Zone via Z1.
 */

// ═══════════════════════════════════════════════════════════════
// Step Building Blocks
// ═══════════════════════════════════════════════════════════════

export type StepType = 'route' | 'action' | 'system';

/** Camunda-Ready: Mapping zu BPMN Task-Typen */
export type TaskKind = 'user_task' | 'service_task' | 'wait_message';

/** Erlaubte Cross-Zone Richtungen (Backbone-Regel: kein Z2->Z2!) */
export type ContractDirection = 'Z2->Z1' | 'Z1->Z2' | 'Z3->Z1' | 'EXTERN->Z1';

export interface StepPrecondition {
  /** Eindeutiger Key, z.B. 'property_exists' */
  key: string;
  /** Datenquelle: Tabelle oder Kontext, z.B. 'properties' */
  source: string;
  /** Menschenlesbare Beschreibung */
  description: string;
}

export interface StepCompletion {
  /** Eindeutiger Key, z.B. 'listing_active' */
  key: string;
  /** Datenquelle: Tabelle oder Kontext */
  source: string;
  /** Check-Typ */
  check: 'exists' | 'equals' | 'not_null';
  /** Erwarteter Wert bei check === 'equals' */
  value?: string;
  /** Menschenlesbare Beschreibung */
  description: string;
}

/** Cross-Zone Contract Reference (Backbone: alles ueber Z1) */
export interface ContractRef {
  /** Contract-Key, z.B. 'CONTRACT_FINANCE_SUBMIT' */
  key: string;
  /** Explizite Richtung — Z2->Z2 ist NICHT erlaubt */
  direction: ContractDirection;
  /** Correlation Keys fuer Tracking, z.B. ['finance_request_id','case_id','tenant_id'] */
  correlation_keys: string[];
  /** Optionale Beschreibung */
  description?: string;
}

// ═══════════════════════════════════════════════════════════════
// Step Definition
// ═══════════════════════════════════════════════════════════════

export interface GoldenPathStep {
  /** Eindeutige Step-ID, z.B. 'create_property' */
  id: string;
  /** Phase-Nummer (1-basiert, wie im TXT-Diagramm) */
  phase: number;
  /** Menschenlesbares Label */
  label: string;
  /** Step-Typ: route (hat UI-Route), action (CTA/Toggle), system (automatisch) */
  type: StepType;

  // --- Route-gebundene Steps ---
  /** Referenz auf routeId im routesManifest (fuer DEV-Validierung) */
  routeId?: string;
  /** Route-Pattern, z.B. '/portal/immobilien/:propertyId' */
  routePattern?: string;
  /** Query-Parameter, z.B. { tab: 'verkaufsauftrag' } */
  queryParams?: Record<string, string>;

  // --- Preconditions ---
  /** Was muss wahr sein, BEVOR dieser Step betreten werden kann */
  preconditions?: StepPrecondition[];

  // --- Completion ---
  /** Was muss wahr sein, damit dieser Step als "done" gilt */
  completion?: StepCompletion[];

  // --- System-Steps ---
  /** Downstream-Module, die durch diesen Step beeinflusst werden */
  downstreamModules?: string[];

  // --- V1.0: Cross-Zone Contract References (Backbone-Regel) ---
  /** Contract-Referenzen fuer Cross-Module/Cross-Account Kommunikation */
  contract_refs?: ContractRef[];

  // --- V1.0: Camunda-Ready Metadaten ---
  /** BPMN Task-Typ fuer spaeteres Camunda-Mapping */
  task_kind?: TaskKind;
  /** Eindeutiger Camunda Process-Key, z.B. 'MOD04_STEP_03_UPLOAD_DOCS' */
  camunda_key?: string;
  /** Correlation Keys fuer Camunda Message Events */
  correlation_keys?: string[];
}

// ═══════════════════════════════════════════════════════════════
// V1.0: Definition-Level Erweiterungen
// ═══════════════════════════════════════════════════════════════

/** Erforderliche DB-Entity fuer einen Golden Path */
export interface RequiredEntity {
  /** Tabellenname, z.B. 'properties' */
  table: string;
  /** Beschreibung */
  description: string;
  /** Wie wird die Entity identifiziert */
  scope: 'tenant_id' | 'entity_id' | 'user_id';
}

/** Erforderlicher Vertrag/Consent */
export interface RequiredContract {
  /** Contract-Key, z.B. 'verkaufsauftrag_consent' */
  key: string;
  /** Tabelle, z.B. 'user_consents' */
  source: string;
  /** Beschreibung */
  description: string;
}

/** Ledger-Event Referenz */
export interface LedgerEventRef {
  /** Event-Type aus data_event_ledger Whitelist */
  event_type: string;
  /** Wann wird geloggt */
  trigger: 'on_enter' | 'on_complete' | 'on_fail';
}

/** Erfolgs-Zustand des Golden Path */
export interface SuccessState {
  /** Welche Flags muessen alle true sein */
  required_flags: string[];
  /** Menschenlesbare Beschreibung */
  description: string;
}

// ═══════════════════════════════════════════════════════════════
// Golden Path Definition V1.0
// ═══════════════════════════════════════════════════════════════

export interface GoldenPathDefinition {
  // --- Bestehend (V0) ---
  /** Modul-Code, z.B. 'MOD-04' */
  moduleCode: string;
  /** Versions-String */
  version: string;
  /** Menschenlesbares Label */
  label: string;
  /** Kurzbeschreibung des Golden Path */
  description: string;
  /** Geordnete Liste aller Steps */
  steps: GoldenPathStep[];

  // --- V1.0 Pflichtfelder ---
  /** Eindeutige GP-ID, z.B. 'gp-mod-04-immobilie' */
  id: string;
  /** Modul-Referenz (explizit) */
  module: string;
  /** Erforderliche DB-Entities fuer diesen GP */
  required_entities: RequiredEntity[];
  /** Erforderliche Vertraege/Consents */
  required_contracts: RequiredContract[];
  /** Ledger-Events die dieser GP erzeugt */
  ledger_events: LedgerEventRef[];
  /** Zustand der den GP als erfolgreich abschliesst */
  success_state: SuccessState;
  /** Redirect-Ziel wenn GP nicht betreten werden kann */
  failure_redirect: string;
}

// ═══════════════════════════════════════════════════════════════
// Runtime Types
// ═══════════════════════════════════════════════════════════════

/**
 * Kontext-Objekt fuer die Engine-Evaluation.
 * Enthaelt die aktuellen Zustandsdaten aus der DB.
 */
export interface GoldenPathContext {
  propertyId?: string;
  tenantId?: string;
  entityId?: string;
  /** Flags aus DB-Queries, z.B. { property_exists: true, listing_active: false } */
  flags: Record<string, boolean>;
}

/**
 * Ergebnis der Step-Evaluation durch die Engine.
 */
export interface StepEvaluation {
  step: GoldenPathStep;
  /** Alle Preconditions erfuellt? */
  canEnter: boolean;
  /** Alle Completion-Checks bestanden? */
  isComplete: boolean;
  /** Liste der fehlgeschlagenen Preconditions */
  failedPreconditions: StepPrecondition[];
  /** Liste der fehlgeschlagenen Completions */
  failedCompletions: StepCompletion[];
}

/**
 * Ergebnis der Phase-Evaluation.
 */
export interface PhaseEvaluation {
  phase: number;
  steps: StepEvaluation[];
  allComplete: boolean;
  canEnter: boolean;
}

/**
 * Ergebnis der Precondition-Pruefung auf GP-Ebene.
 */
export interface PreconditionResult {
  met: boolean;
  missingEntities: RequiredEntity[];
}

/**
 * Ergebnis der Contract-Pruefung auf GP-Ebene.
 */
export interface ContractResult {
  met: boolean;
  missingContracts: RequiredContract[];
}

/**
 * Ergebnis der Cross-Zone Backbone-Validierung.
 */
export interface BackboneValidationResult {
  allowed: boolean;
  message?: string;
  redirectTo?: string;
}
