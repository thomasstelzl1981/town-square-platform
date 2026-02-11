/**
 * Golden Path Type Definitions — SSOT
 * 
 * Deklarative Typen fuer Golden-Path-Definitionen.
 * Jeder Golden Path beschreibt den idealen Nutzerfluss durch ein Modul.
 */

export type StepType = 'route' | 'action' | 'system';

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
}

export interface GoldenPathDefinition {
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
}

/**
 * Kontext-Objekt fuer die Engine-Evaluation.
 * Enthaelt die aktuellen Zustandsdaten aus der DB.
 */
export interface GoldenPathContext {
  propertyId?: string;
  tenantId?: string;
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
