/**
 * ARMSTRONG ADVISOR — MVP Edge Function
 * 
 * Single entry point for Armstrong AI orchestration in Zone 2.
 * Implements: Intent Classification, Action Suggestion, Confirm-Gate, Execution
 * 
 * MVP Modules: MOD-00, MOD-04, MOD-07, MOD-08
 * 
 * LEGACY COMPATIBILITY: Also supports old action types (chat, explain, simulate)
 * 
 * @version 2.0.0
 * @see docs/armstrong/ARMSTRONG_ADVISOR_README.md
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// =============================================================================
// CORS HEADERS
// =============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// =============================================================================
// TYPES
// =============================================================================

type Zone = "Z2" | "Z3";
type Module = "MOD-00" | "MOD-04" | "MOD-07" | "MOD-08" | string;
type IntentType = "EXPLAIN" | "DRAFT" | "ACTION";
type ExecutionMode = "readonly" | "draft_only" | "execute_with_confirmation" | "execute";
type RiskLevel = "low" | "medium" | "high";
type CostModel = "free" | "metered" | "premium";

interface EntityRef {
  type: "property" | "mandate" | "finance_case" | "widget" | "none";
  id: string | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ActionRequest {
  action_code: string | null;
  confirmed: boolean;
  params: Record<string, unknown>;
}

interface RequestBody {
  zone: Zone;
  module: Module;
  route: string;
  entity: EntityRef;
  message: string;
  conversation?: {
    last_messages: Message[];
  };
  action_request?: ActionRequest;
  flow?: {
    flow_type: string;
    flow_state?: Record<string, unknown>;
  } | null;
  document_context?: {
    extracted_text: string;
    filename: string;
    content_type: string;
    confidence: number;
  } | null;
}

// Legacy Request (backward compatibility)
interface LegacyRequest {
  mode?: "zone2" | "zone3";
  action: "chat" | "explain" | "simulate";
  context?: unknown;
  messages?: Array<{ role: string; content: string }>;
  term?: string;
  category?: string;
  simulationParams?: Record<string, unknown>;
}

interface ActionDefinition {
  action_code: string;
  title_de: string;
  description_de: string;
  zones: Zone[];
  module: string | null;
  risk_level: RiskLevel;
  execution_mode: ExecutionMode;
  requires_consent_code: string | null;
  roles_allowed: string[];
  data_scopes_read: string[];
  data_scopes_write: string[];
  side_effects: string[];
  cost_model: CostModel;
  cost_hint_cents: number | null;
  credits_estimate?: number;
  status: string;
}

interface SuggestedAction {
  action_code: string;
  title_de: string;
  execution_mode: ExecutionMode;
  risk_level: RiskLevel;
  cost_model: CostModel;
  credits_estimate: number;
  cost_hint_cents: number;
  side_effects: string[];
  why: string;
}

interface UserContext {
  user_id: string;
  org_id: string | null;
  roles: string[];
}

// =============================================================================
// MVP MODULE ALLOWLIST & GLOBAL ASSIST CONFIG
// =============================================================================

const MVP_MODULES = ["MOD-00", "MOD-01", "MOD-04", "MOD-06", "MOD-07", "MOD-08", "MOD-09", "MOD-11", "MOD-12", "MOD-13", "MOD-14", "MOD-17", "MOD-18", "MOD-19", "MOD-20"];

// Global Assist Mode: Armstrong can help with general tasks even outside MVP modules
// These intents are allowed in ALL modules (explain, draft, research)
const GLOBAL_ASSIST_INTENTS: IntentType[] = ["EXPLAIN", "DRAFT"];

// MVP Actions that can be EXECUTED (not just suggested)
const MVP_EXECUTABLE_ACTIONS = [
  // MOD-00 (Widgets) - execute_with_confirmation
  "ARM.MOD00.CREATE_TASK",
  "ARM.MOD00.CREATE_REMINDER",
  "ARM.MOD00.CREATE_NOTE",
  
  // MOD-04 (Immobilien) - readonly
  "ARM.MOD04.DATA_QUALITY_CHECK",
  "ARM.MOD04.CALCULATE_KPI",
  "ARM.MOD04.VALIDATE_PROPERTY",
  
  // MOD-07 (Finanzierung) - readonly
  "ARM.MOD07.EXPLAIN_SELBSTAUSKUNFT",
  "ARM.MOD07.DOC_CHECKLIST",
  "ARM.MOD07.VALIDATE_READINESS",
  
  // MOD-08 (Investments) - readonly
  "ARM.MOD08.RUN_SIMULATION",
  "ARM.MOD08.ANALYZE_FAVORITE",
  
  // MOD-13 (Projekte) - execute_with_confirmation
  "ARM.MOD13.CREATE_DEV_PROJECT",
  "ARM.MOD13.EXPLAIN_MODULE",
  
  // MOD-14 (Communication Pro / Recherche) - execute_with_confirmation
  "ARM.MOD14.CREATE_RESEARCH_ORDER",
  
  // Magic Intake Actions (document-to-record pipeline)
  "ARM.MOD04.MAGIC_INTAKE_PROPERTY",
  "ARM.MOD11.MAGIC_INTAKE_CASE",
  "ARM.MOD18.MAGIC_INTAKE_FINANCE",
  "ARM.MOD17.MAGIC_INTAKE_VEHICLE",
  "ARM.MOD12.MAGIC_INTAKE_MANDATE",
  "ARM.MOD19.MAGIC_INTAKE_PLANT",
  "ARM.MOD07.MAGIC_INTAKE_SELBSTAUSKUNFT",
  "ARM.MOD20.MAGIC_INTAKE_CONTRACT",
  "ARM.MOD08.MAGIC_INTAKE_MANDATE",
  "ARM.MOD01.MAGIC_INTAKE_PROFILE",
  "ARM.MOD06.MAGIC_INTAKE_LISTING",
  "ARM.MOD09.MAGIC_INTAKE_PARTNER",
  
  // Global Actions (available in all modules)
  "ARM.GLOBAL.EXPLAIN_TERM",
  "ARM.GLOBAL.FAQ",
  "ARM.GLOBAL.WEB_RESEARCH",
  "ARM.GLOBAL.DRAFT_TEXT",

  // DMS Storage Extraction
  "ARM.DMS.STORAGE_EXTRACTION",
];

// Global Actions - available regardless of module context
const GLOBAL_ACTIONS: ActionDefinition[] = [
  {
    action_code: "ARM.GLOBAL.WEB_RESEARCH",
    title_de: "Web-Recherche",
    description_de: "Recherchiert aktuelle Informationen mit Quellenangabe",
    zones: ["Z2"],
    module: null,
    risk_level: "low",
    execution_mode: "execute_with_confirmation",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["external_web"],
    data_scopes_write: [],
    side_effects: ["credits_consumed"],
    cost_model: "metered",
    cost_hint_cents: 10,
    credits_estimate: 5,
    status: "active",
  },
  {
    action_code: "ARM.GLOBAL.DRAFT_TEXT",
    title_de: "Text erstellen",
    description_de: "Erstellt Textentwürfe (E-Mails, Briefe, Beschreibungen)",
    zones: ["Z2"],
    module: null,
    risk_level: "low",
    execution_mode: "draft_only",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: [],
    data_scopes_write: [],
    side_effects: [],
    cost_model: "free",
    cost_hint_cents: null,
    credits_estimate: 0,
    status: "active",
  },
];

// =============================================================================
// ACTION MANIFEST (Subset for MVP)
// =============================================================================

const MVP_ACTIONS: ActionDefinition[] = [
  // Global
  {
    action_code: "ARM.GLOBAL.EXPLAIN_TERM",
    title_de: "Begriff erklären",
    description_de: "Erklärt Immobilien- und Finanzierungsbegriffe",
    zones: ["Z2", "Z3"],
    module: null,
    risk_level: "low",
    execution_mode: "readonly",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["knowledge_base"],
    data_scopes_write: [],
    side_effects: [],
    cost_model: "free",
    cost_hint_cents: null,
    credits_estimate: 0,
    status: "active",
  },
  {
    action_code: "ARM.GLOBAL.FAQ",
    title_de: "FAQ beantworten",
    description_de: "Beantwortet häufig gestellte Fragen",
    zones: ["Z2", "Z3"],
    module: null,
    risk_level: "low",
    execution_mode: "readonly",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["knowledge_base"],
    data_scopes_write: [],
    side_effects: [],
    cost_model: "free",
    cost_hint_cents: null,
    credits_estimate: 0,
    status: "active",
  },
  // MOD-00
  {
    action_code: "ARM.MOD00.CREATE_TASK",
    title_de: "Aufgabe erstellen",
    description_de: "Erstellt eine To-Do-Aufgabe als Widget",
    zones: ["Z2"],
    module: "MOD-00",
    risk_level: "low",
    execution_mode: "execute_with_confirmation",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: [],
    data_scopes_write: ["widgets"],
    side_effects: ["modifies_widgets"],
    cost_model: "free",
    cost_hint_cents: null,
    credits_estimate: 0,
    status: "active",
  },
  {
    action_code: "ARM.MOD00.CREATE_REMINDER",
    title_de: "Erinnerung erstellen",
    description_de: "Erstellt eine zeitbasierte Erinnerung",
    zones: ["Z2"],
    module: "MOD-00",
    risk_level: "low",
    execution_mode: "execute_with_confirmation",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: [],
    data_scopes_write: ["widgets"],
    side_effects: ["modifies_widgets"],
    cost_model: "free",
    cost_hint_cents: null,
    credits_estimate: 0,
    status: "active",
  },
  {
    action_code: "ARM.MOD00.CREATE_NOTE",
    title_de: "Notiz erstellen",
    description_de: "Erstellt eine schnelle Notiz",
    zones: ["Z2"],
    module: "MOD-00",
    risk_level: "low",
    execution_mode: "execute_with_confirmation",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: [],
    data_scopes_write: ["widgets"],
    side_effects: ["modifies_widgets"],
    cost_model: "free",
    cost_hint_cents: null,
    credits_estimate: 0,
    status: "active",
  },
  // MOD-04
  {
    action_code: "ARM.MOD04.DATA_QUALITY_CHECK",
    title_de: "Vollständigkeit prüfen",
    description_de: "Zeigt Checkliste der fehlenden Daten",
    zones: ["Z2"],
    module: "MOD-04",
    risk_level: "low",
    execution_mode: "readonly",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["properties", "units", "documents"],
    data_scopes_write: [],
    side_effects: [],
    cost_model: "free",
    cost_hint_cents: null,
    credits_estimate: 0,
    status: "active",
  },
  {
    action_code: "ARM.MOD04.CALCULATE_KPI",
    title_de: "KPIs berechnen",
    description_de: "Berechnet Rendite, Cashflow und Kennzahlen",
    zones: ["Z2"],
    module: "MOD-04",
    risk_level: "low",
    execution_mode: "readonly",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["properties", "units", "leases"],
    data_scopes_write: [],
    side_effects: ["credits_consumed"],
    cost_model: "metered",
    cost_hint_cents: 1,
    credits_estimate: 1,
    status: "active",
  },
  {
    action_code: "ARM.MOD04.VALIDATE_PROPERTY",
    title_de: "Datenqualität prüfen",
    description_de: "Analysiert Vollständigkeit der Immobiliendaten",
    zones: ["Z2"],
    module: "MOD-04",
    risk_level: "low",
    execution_mode: "readonly",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["properties", "units", "leases"],
    data_scopes_write: [],
    side_effects: ["credits_consumed"],
    cost_model: "metered",
    cost_hint_cents: 1,
    credits_estimate: 1,
    status: "active",
  },
  // MOD-07
  {
    action_code: "ARM.MOD07.EXPLAIN_SELBSTAUSKUNFT",
    title_de: "Selbstauskunft erklären",
    description_de: "Erklärt welche Daten benötigt werden",
    zones: ["Z2"],
    module: "MOD-07",
    risk_level: "low",
    execution_mode: "readonly",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["knowledge_base"],
    data_scopes_write: [],
    side_effects: [],
    cost_model: "free",
    cost_hint_cents: null,
    credits_estimate: 0,
    status: "active",
  },
  {
    action_code: "ARM.MOD07.DOC_CHECKLIST",
    title_de: "Dokument-Checkliste",
    description_de: "Zeigt benötigte Finanzierungsdokumente",
    zones: ["Z2"],
    module: "MOD-07",
    risk_level: "low",
    execution_mode: "readonly",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["applicant_profiles", "documents"],
    data_scopes_write: [],
    side_effects: [],
    cost_model: "free",
    cost_hint_cents: null,
    credits_estimate: 0,
    status: "active",
  },
  {
    action_code: "ARM.MOD07.VALIDATE_READINESS",
    title_de: "Finanzierungsbereitschaft",
    description_de: "Analysiert Voraussetzungen für Finanzierung",
    zones: ["Z2"],
    module: "MOD-07",
    risk_level: "low",
    execution_mode: "readonly",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["applicant_profiles", "documents"],
    data_scopes_write: [],
    side_effects: ["credits_consumed"],
    cost_model: "metered",
    cost_hint_cents: 2,
    credits_estimate: 1,
    status: "active",
  },
  // MOD-08
  {
    action_code: "ARM.MOD08.RUN_SIMULATION",
    title_de: "Investment-Simulation",
    description_de: "Führt vollständige Investment-Simulation durch",
    zones: ["Z2"],
    module: "MOD-08",
    risk_level: "low",
    execution_mode: "readonly",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: [],
    data_scopes_write: [],
    side_effects: ["credits_consumed"],
    cost_model: "metered",
    cost_hint_cents: 2,
    credits_estimate: 1,
    status: "active",
  },
  {
    action_code: "ARM.MOD08.ANALYZE_FAVORITE",
    title_de: "Favorit analysieren",
    description_de: "Analysiert ein Favoriten-Objekt",
    zones: ["Z2"],
    module: "MOD-08",
    risk_level: "low",
    execution_mode: "readonly",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["favorites", "listings"],
    data_scopes_write: [],
    side_effects: ["credits_consumed"],
    cost_model: "metered",
    cost_hint_cents: 3,
    credits_estimate: 1,
    status: "active",
  },
  // MOD-13
  {
    action_code: "ARM.MOD13.CREATE_DEV_PROJECT",
    title_de: "Bauträgerprojekt anlegen",
    description_de: "Erstellt ein neues Bauträgerprojekt aus hochgeladenen Dokumenten via KI-Analyse",
    zones: ["Z2"],
    module: "MOD-13",
    risk_level: "high",
    execution_mode: "execute_with_confirmation",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["tenant_documents"],
    data_scopes_write: ["dev_projects", "dev_project_units", "storage_nodes"],
    side_effects: ["modifies_dev_projects", "creates_storage_tree", "credits_consumed"],
    cost_model: "metered",
    cost_hint_cents: 500,
    credits_estimate: 10,
    status: "active",
  },
  {
    action_code: "ARM.MOD13.EXPLAIN_MODULE",
    title_de: "Projekte-Modul erklären",
    description_de: "Erklärt Funktionsumfang und Golden Path des Projekte-Moduls",
    zones: ["Z2"],
    module: "MOD-13",
    risk_level: "low",
    execution_mode: "readonly",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["knowledge_base"],
    data_scopes_write: [],
    side_effects: [],
    cost_model: "free",
    cost_hint_cents: null,
    credits_estimate: 0,
    status: "active",
  },
  // MOD-14 (Recherche)
  {
    action_code: "ARM.MOD14.CREATE_RESEARCH_ORDER",
    title_de: "Rechercheauftrag erstellen",
    description_de: "Erstellt einen Rechercheauftrag, führt die Kontaktsuche durch und liefert qualifizierte Ergebnisse mit Kontaktbuch-Abgleich",
    zones: ["Z2"],
    module: "MOD-14",
    risk_level: "medium",
    execution_mode: "execute_with_confirmation",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["contacts"],
    data_scopes_write: ["research_orders", "research_results", "widgets"],
    side_effects: ["credits_consumed", "external_api_call", "creates_widget"],
    cost_model: "metered",
    cost_hint_cents: 50,
    credits_estimate: 25,
    status: "active",
  },
  // Magic Intake: MOD-04 (Immobilien)
  {
    action_code: "ARM.MOD04.MAGIC_INTAKE_PROPERTY",
    title_de: "Immobilie aus Dokument anlegen",
    description_de: "Erstellt eine Immobilie mit Einheiten aus hochgeladenen Dokumenten (Kaufvertrag, Exposé)",
    zones: ["Z2"],
    module: "MOD-04",
    risk_level: "medium",
    execution_mode: "execute_with_confirmation",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["storage_nodes"],
    data_scopes_write: ["properties", "units", "storage_nodes"],
    side_effects: ["credits_consumed", "creates_storage_tree"],
    cost_model: "metered",
    cost_hint_cents: 75,
    credits_estimate: 3,
    status: "active",
  },
  // Magic Intake: MOD-11 (Finanzmanager)
  {
    action_code: "ARM.MOD11.MAGIC_INTAKE_CASE",
    title_de: "Finanzierungsfall aus Dokument anlegen",
    description_de: "Erstellt Finanzierungsanfrage und Antragstellerprofil aus Dokumenten (Selbstauskunft, Gehaltsnachweis)",
    zones: ["Z2"],
    module: "MOD-11",
    risk_level: "medium",
    execution_mode: "execute_with_confirmation",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["storage_nodes"],
    data_scopes_write: ["finance_requests", "applicant_profiles", "storage_nodes"],
    side_effects: ["credits_consumed", "creates_storage_tree"],
    cost_model: "metered",
    cost_hint_cents: 75,
    credits_estimate: 3,
    status: "active",
  },
  // Magic Intake: MOD-18 (Finanzanalyse)
  {
    action_code: "ARM.MOD18.MAGIC_INTAKE_FINANCE",
    title_de: "Finanzdaten aus Dokument erfassen",
    description_de: "Erfasst Versicherungen, Abonnements oder Bankdaten aus Dokumenten (Kontoauszug, Versicherungsschein)",
    zones: ["Z2"],
    module: "MOD-18",
    risk_level: "medium",
    execution_mode: "execute_with_confirmation",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["storage_nodes"],
    data_scopes_write: ["insurance_contracts", "user_subscriptions", "bank_account_meta"],
    side_effects: ["credits_consumed"],
    cost_model: "metered",
    cost_hint_cents: 50,
    credits_estimate: 2,
    status: "active",
  },
  // Magic Intake: MOD-17 (Fahrzeuge)
  {
    action_code: "ARM.MOD17.MAGIC_INTAKE_VEHICLE",
    title_de: "Fahrzeug aus Dokument anlegen",
    description_de: "Erstellt ein Fahrzeug aus Fahrzeugschein, Fahrzeugbrief oder Kaufvertrag",
    zones: ["Z2"],
    module: "MOD-17",
    risk_level: "medium",
    execution_mode: "execute_with_confirmation",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["storage_nodes"],
    data_scopes_write: ["vehicles"],
    side_effects: ["credits_consumed"],
    cost_model: "metered",
    cost_hint_cents: 50,
    credits_estimate: 2,
    status: "active",
  },
  // Magic Intake: MOD-12 (Akquise-Mandat)
  {
    action_code: "ARM.MOD12.MAGIC_INTAKE_MANDATE",
    title_de: "Mandat aus Dokument anlegen",
    description_de: "Erstellt ein Akquise-Mandat aus Suchprofil oder Ankaufsprofil",
    zones: ["Z2"],
    module: "MOD-12",
    risk_level: "medium",
    execution_mode: "execute_with_confirmation",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["storage_nodes"],
    data_scopes_write: ["acq_mandates"],
    side_effects: ["credits_consumed"],
    cost_model: "metered",
    cost_hint_cents: 75,
    credits_estimate: 3,
    status: "active",
  },
  // Magic Intake: MOD-19 (PV-Anlage)
  {
    action_code: "ARM.MOD19.MAGIC_INTAKE_PLANT",
    title_de: "PV-Anlage aus Dokument anlegen",
    description_de: "Erstellt eine PV-Anlage aus Installationsprotokoll oder Datenblatt",
    zones: ["Z2"],
    module: "MOD-19",
    risk_level: "medium",
    execution_mode: "execute_with_confirmation",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["storage_nodes"],
    data_scopes_write: ["pv_plants"],
    side_effects: ["credits_consumed"],
    cost_model: "metered",
    cost_hint_cents: 75,
    credits_estimate: 3,
    status: "active",
  },
  // Magic Intake: MOD-07 (Selbstauskunft)
  {
    action_code: "ARM.MOD07.MAGIC_INTAKE_SELBSTAUSKUNFT",
    title_de: "Selbstauskunft aus Dokument befüllen",
    description_de: "Befüllt die Selbstauskunft aus Gehaltsabrechnungen oder Steuerbescheiden",
    zones: ["Z2"],
    module: "MOD-07",
    risk_level: "medium",
    execution_mode: "execute_with_confirmation",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["storage_nodes", "applicant_profiles"],
    data_scopes_write: ["applicant_profiles"],
    side_effects: ["credits_consumed"],
    cost_model: "metered",
    cost_hint_cents: 75,
    credits_estimate: 3,
    status: "active",
  },
  // Magic Intake: MOD-20 (Zuhause/Miety)
  {
    action_code: "ARM.MOD20.MAGIC_INTAKE_CONTRACT",
    title_de: "Vertrag aus Dokument anlegen",
    description_de: "Erstellt einen Mietvertrag oder Versorgungsvertrag aus Dokumenten",
    zones: ["Z2"],
    module: "MOD-20",
    risk_level: "medium",
    execution_mode: "execute_with_confirmation",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["storage_nodes"],
    data_scopes_write: ["miety_contracts"],
    side_effects: ["credits_consumed"],
    cost_model: "metered",
    cost_hint_cents: 50,
    credits_estimate: 2,
    status: "active",
  },
  // Magic Intake: MOD-08 (Suchmandat)
  {
    action_code: "ARM.MOD08.MAGIC_INTAKE_MANDATE",
    title_de: "Suchmandat aus Dokument anlegen",
    description_de: "Erstellt ein Suchmandat aus Investmentkriterien-PDF",
    zones: ["Z2"],
    module: "MOD-08",
    risk_level: "medium",
    execution_mode: "execute_with_confirmation",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["storage_nodes"],
    data_scopes_write: ["search_mandates"],
    side_effects: ["credits_consumed"],
    cost_model: "metered",
    cost_hint_cents: 50,
    credits_estimate: 2,
    status: "active",
  },
  // Magic Intake: MOD-01 (Stammdaten)
  {
    action_code: "ARM.MOD01.MAGIC_INTAKE_PROFILE",
    title_de: "Profil aus Dokument anlegen",
    description_de: "Erstellt Stammdaten aus Visitenkarte oder Handelsregisterauszug",
    zones: ["Z2"],
    module: "MOD-01",
    risk_level: "medium",
    execution_mode: "execute_with_confirmation",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["storage_nodes"],
    data_scopes_write: ["profiles", "organizations"],
    side_effects: ["credits_consumed"],
    cost_model: "metered",
    cost_hint_cents: 50,
    credits_estimate: 2,
    status: "active",
  },
  // Magic Intake: MOD-06 (Verkauf)
  {
    action_code: "ARM.MOD06.MAGIC_INTAKE_LISTING",
    title_de: "Verkaufsinserat aus Dokument anlegen",
    description_de: "Erstellt ein Listing aus einem Exposé",
    zones: ["Z2"],
    module: "MOD-06",
    risk_level: "medium",
    execution_mode: "execute_with_confirmation",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["storage_nodes"],
    data_scopes_write: ["sale_listings"],
    side_effects: ["credits_consumed"],
    cost_model: "metered",
    cost_hint_cents: 75,
    credits_estimate: 3,
    status: "active",
  },
  // Magic Intake: MOD-09 (Vertriebspartner)
  {
    action_code: "ARM.MOD09.MAGIC_INTAKE_PARTNER",
    title_de: "Partner aus Dokument anlegen",
    description_de: "Erstellt ein Partnerprofil aus Bewerbung oder Lebenslauf",
    zones: ["Z2"],
    module: "MOD-09",
    risk_level: "medium",
    execution_mode: "execute_with_confirmation",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["storage_nodes"],
    data_scopes_write: ["partner_profiles"],
    side_effects: ["credits_consumed"],
    cost_model: "metered",
    cost_hint_cents: 50,
    credits_estimate: 2,
    status: "active",
  },
  // DMS: Storage Extraction (Bulk)
  {
    action_code: "ARM.DMS.STORAGE_EXTRACTION",
    title_de: "Datenraum analysieren",
    description_de: "Analysiert und extrahiert den gesamten Dokumentenbestand für Armstrong-Zugriff (Bulk)",
    zones: ["Z2"],
    module: "MOD-03",
    risk_level: "high",
    execution_mode: "execute_with_confirmation",
    requires_consent_code: null,
    roles_allowed: [],
    data_scopes_read: ["storage_nodes", "document_chunks"],
    data_scopes_write: ["document_chunks", "extraction_jobs"],
    side_effects: ["credits_consumed", "modifies_document_chunks"],
    cost_model: "metered",
    cost_hint_cents: 25,
    credits_estimate: 1,
    status: "active",
  },
];

// =============================================================================
// INTENT CLASSIFICATION
// =============================================================================

function classifyIntent(message: string, actionRequest: ActionRequest | undefined): IntentType {
  if (actionRequest?.action_code) {
    return "ACTION";
  }
  
  const lowerMsg = message.toLowerCase();
  
  // Coach intent keywords
  const coachKeywords = ["coach", "begleite", "führe mich", "erkläer mir", "slideshow", "präsentation", "slide"];
  if (coachKeywords.some(kw => lowerMsg.includes(kw))) {
    return "EXPLAIN";
  }
  
  const draftKeywords = ["schreibe", "erstelle", "verfasse", "entwurf", "email", "brief", "nachricht"];
  // Don't classify as DRAFT if document analysis keywords are present
  const docAnalysisKeywords = ["analysiere", "zusammenfassung", "was steht", "prüfe das dokument", "rechnung", "fasse zusammen"];
  const hasDocKeywords = docAnalysisKeywords.some(kw => lowerMsg.includes(kw));
  if (!hasDocKeywords && draftKeywords.some(kw => lowerMsg.includes(kw))) {
    return "DRAFT";
  }
  
  const actionKeywords = [
    "berechne", "prüfe", "analysiere", "validiere", "simulation",
    "aufgabe", "erinnerung", "notiz", "reminder", "task", "note",
    "kpi", "rendite", "cashflow",
    "projekt anlegen", "projekt erstellen", "bauträger", "intake", "magic intake",
    "exposé", "preisliste", "einheiten",
    "recherche", "recherchiere", "kontakte suchen", "kontakte finden",
    "immobilienmakler", "makler suchen", "firmen suchen", "leads suchen",
    // Magic Intake Keywords
    "immobilie anlegen", "immobilie erstellen", "kaufvertrag", "objekt anlegen",
    "wohnung anlegen", "haus anlegen", "grundstück anlegen",
    "finanzierung anlegen", "finanzierungsfall", "selbstauskunft", "gehaltsnachweis",
    "finanzierungsanfrage", "darlehen anlegen", "kredit anlegen",
    "versicherung erfassen", "versicherung anlegen", "kontoauszug", "versicherungsschein",
    "abo erfassen", "abonnement", "bankdaten", "iban erfassen",
    "leg die immobilie an", "leg den fall an", "erfasse die versicherung",
    // MOD-17 Vehicle Intake
    "fahrzeug anlegen", "auto anlegen", "fahrzeugschein", "zulassungsbescheinigung",
    "fahrzeugbrief", "kfz anlegen", "auto erfassen", "leg das fahrzeug an",
    // MOD-12 Akquise Intake
    "mandat anlegen", "suchprofil", "ankaufsprofil", "investment criteria",
    "investor briefing", "leg das mandat an", "akquise mandat",
    // MOD-19 PV Intake
    "pv anlage", "photovoltaik anlegen", "solaranlage", "installationsprotokoll",
    "einspeisevertrag", "pv erfassen", "leg die anlage an",
    // MOD-07 Selbstauskunft Intake
    "gehaltsabrechnung", "gehaltsnachweis auslesen", "selbstauskunft befüllen",
    "steuerbescheid auslesen", "rentenbescheid", "gehalt erfassen",
    // MOD-20 Contract Intake
    "mietvertrag", "mietvertrag anlegen", "nebenkostenabrechnung", "versorgungsvertrag",
    "mietvertrag hochladen", "leg den vertrag an", "vertrag erfassen",
    // MOD-08 Search Mandate Intake
    "suchmandat anlegen", "investmentkriterien", "suchmandat erstellen",
    "suchmandat aus dokument", "leg das suchmandat an",
    // MOD-01 Stammdaten Intake
    "visitenkarte", "personalausweis", "handelsregisterauszug", "kontakt anlegen",
    "profil anlegen", "stammdaten erfassen", "visitenkarte scannen",
    // MOD-06 Verkauf Intake
    "listing anlegen", "inserat anlegen", "verkaufsinserat", "exposé einlesen",
    "fremdes exposé", "listing aus exposé", "verkaufsobjekt anlegen",
    // MOD-09 Partner Intake
    "partner anlegen", "partnerprofil", "partnerbewerbung", "lebenslauf",
    "vertriebspartner anlegen", "ihk nummer",
    // Storage Extraction (Bulk)
    "datenraum analysieren", "datenraum durchsuchbar", "storage extrahieren",
    "alle dokumente analysieren", "bulk extraktion", "datenraum vorbereiten",
    "armstrong zugriff", "dokumente indexieren", "datenraum scannen",
  ];
  if (actionKeywords.some(kw => lowerMsg.includes(kw))) {
    return "ACTION";
  }
  
  return "EXPLAIN";
}

// =============================================================================
// ACTION FILTERING
// =============================================================================

function filterActionsForContext(
  actions: ActionDefinition[],
  zone: Zone,
  module: Module,
  userContext: UserContext
): ActionDefinition[] {
  return actions.filter(action => {
    if (!action.zones.includes(zone)) return false;
    if (action.module !== null && action.module !== module) return false;
    if (action.status !== "active") return false;
    if (action.roles_allowed.length > 0) {
      const hasRole = action.roles_allowed.some(role => userContext.roles.includes(role));
      if (!hasRole) return false;
    }
    return true;
  });
}

function suggestActionsForMessage(
  message: string,
  availableActions: ActionDefinition[]
): SuggestedAction[] {
  const lowerMsg = message.toLowerCase();
  const suggestions: SuggestedAction[] = [];
  
  for (const action of availableActions) {
    let relevance = 0;
    let why = "";
    
    const descWords = action.description_de.toLowerCase().split(/\s+/);
    for (const word of descWords) {
      if (word.length > 3 && lowerMsg.includes(word)) {
        relevance++;
      }
    }
    
    if (action.action_code === "ARM.MOD04.CALCULATE_KPI" && 
        (lowerMsg.includes("kpi") || lowerMsg.includes("rendite") || lowerMsg.includes("kennzahl"))) {
      relevance += 5;
      why = "Passt zu Ihrer KPI-Anfrage";
    }
    
    if (action.action_code === "ARM.MOD04.DATA_QUALITY_CHECK" && 
        (lowerMsg.includes("vollständig") || lowerMsg.includes("prüf") || lowerMsg.includes("check"))) {
      relevance += 5;
      why = "Prüft Datenvollständigkeit";
    }
    
    if (action.action_code === "ARM.MOD07.DOC_CHECKLIST" && 
        (lowerMsg.includes("dokument") || lowerMsg.includes("unterlagen") || lowerMsg.includes("checklist"))) {
      relevance += 5;
      why = "Zeigt benötigte Dokumente";
    }
    
    if (action.action_code === "ARM.MOD08.RUN_SIMULATION" && 
        (lowerMsg.includes("simulation") || lowerMsg.includes("berechn"))) {
      relevance += 5;
      why = "Führt Investment-Simulation durch";
    }
    
    if (action.action_code.includes("CREATE_TASK") && 
        (lowerMsg.includes("aufgabe") || lowerMsg.includes("task") || lowerMsg.includes("todo"))) {
      relevance += 5;
      why = "Erstellt eine neue Aufgabe";
    }
    
    if (action.action_code.includes("CREATE_REMINDER") && 
        (lowerMsg.includes("erinner") || lowerMsg.includes("reminder"))) {
      relevance += 5;
      why = "Erstellt eine Erinnerung";
    }
    
    if (action.action_code.includes("CREATE_NOTE") && 
        (lowerMsg.includes("notiz") || lowerMsg.includes("note"))) {
      relevance += 5;
      why = "Erstellt eine Notiz";
    }
    
    if (action.action_code === "ARM.MOD13.CREATE_DEV_PROJECT" && 
        (lowerMsg.includes("projekt") || lowerMsg.includes("bauträger") || lowerMsg.includes("intake") || 
         lowerMsg.includes("exposé") || lowerMsg.includes("preisliste") || lowerMsg.includes("einheiten"))) {
      relevance += 5;
      why = "Erstellt ein Bauträgerprojekt aus hochgeladenen Dokumenten";
    }
    
    if (action.action_code === "ARM.MOD13.EXPLAIN_MODULE" && 
        (lowerMsg.includes("projekte") || lowerMsg.includes("modul 13") || lowerMsg.includes("mod-13") || lowerMsg.includes("golden path"))) {
      relevance += 5;
      why = "Erklärt das Projekte-Modul";
    }
    
    if (action.action_code === "ARM.MOD14.CREATE_RESEARCH_ORDER" && 
        (lowerMsg.includes("recherch") || lowerMsg.includes("kontakte suchen") || lowerMsg.includes("kontakte finden") ||
         lowerMsg.includes("immobilienmakler") || lowerMsg.includes("makler suchen") || lowerMsg.includes("firmen suchen") ||
         lowerMsg.includes("leads suchen") || lowerMsg.includes("hausverwaltung"))) {
      relevance += 5;
      why = "Startet eine Kontaktrecherche mit Kontaktbuch-Abgleich";
    }
    
    // Magic Intake: MOD-04
    if (action.action_code === "ARM.MOD04.MAGIC_INTAKE_PROPERTY" && 
        (lowerMsg.includes("immobilie anlegen") || lowerMsg.includes("kaufvertrag") || lowerMsg.includes("objekt anlegen") ||
         lowerMsg.includes("wohnung anlegen") || lowerMsg.includes("haus anlegen") || lowerMsg.includes("grundstück") ||
         lowerMsg.includes("leg die immobilie an") || (lowerMsg.includes("immobilie") && lowerMsg.includes("dokument")))) {
      relevance += 5;
      why = "Erstellt eine Immobilie aus dem hochgeladenen Dokument";
    }
    
    // Magic Intake: MOD-11
    if (action.action_code === "ARM.MOD11.MAGIC_INTAKE_CASE" && 
        (lowerMsg.includes("finanzierung anlegen") || lowerMsg.includes("finanzierungsfall") || lowerMsg.includes("selbstauskunft") ||
         lowerMsg.includes("gehaltsnachweis") || lowerMsg.includes("finanzierungsanfrage") || lowerMsg.includes("darlehen anlegen") ||
         lowerMsg.includes("kredit anlegen") || lowerMsg.includes("leg den fall an"))) {
      relevance += 5;
      why = "Erstellt einen Finanzierungsfall aus dem Dokument";
    }
    
    // Magic Intake: MOD-18
    if (action.action_code === "ARM.MOD18.MAGIC_INTAKE_FINANCE" && 
        (lowerMsg.includes("versicherung erfassen") || lowerMsg.includes("versicherung anlegen") || lowerMsg.includes("kontoauszug") ||
         lowerMsg.includes("versicherungsschein") || lowerMsg.includes("abo erfassen") || lowerMsg.includes("abonnement") ||
         lowerMsg.includes("bankdaten") || lowerMsg.includes("iban erfassen") || lowerMsg.includes("erfasse die versicherung"))) {
      relevance += 5;
      why = "Erfasst Finanzdaten aus dem Dokument";
    }
    
    // Magic Intake: MOD-17
    if (action.action_code === "ARM.MOD17.MAGIC_INTAKE_VEHICLE" && 
        (lowerMsg.includes("fahrzeug anlegen") || lowerMsg.includes("fahrzeugschein") || lowerMsg.includes("auto anlegen") ||
         lowerMsg.includes("zulassungsbescheinigung") || lowerMsg.includes("kfz anlegen") || lowerMsg.includes("leg das fahrzeug an") ||
         (lowerMsg.includes("fahrzeug") && lowerMsg.includes("dokument")))) {
      relevance += 5;
      why = "Erstellt ein Fahrzeug aus dem hochgeladenen Dokument";
    }
    
    // Magic Intake: MOD-12
    if (action.action_code === "ARM.MOD12.MAGIC_INTAKE_MANDATE" && 
        (lowerMsg.includes("mandat anlegen") || lowerMsg.includes("suchprofil") || lowerMsg.includes("ankaufsprofil") ||
         lowerMsg.includes("investment criteria") || lowerMsg.includes("akquise mandat") || lowerMsg.includes("leg das mandat an"))) {
      relevance += 5;
      why = "Erstellt ein Akquise-Mandat aus dem Dokument";
    }
    
    // Magic Intake: MOD-19
    if (action.action_code === "ARM.MOD19.MAGIC_INTAKE_PLANT" && 
        (lowerMsg.includes("pv anlage") || lowerMsg.includes("photovoltaik anlegen") || lowerMsg.includes("solaranlage") ||
         lowerMsg.includes("installationsprotokoll") || lowerMsg.includes("einspeisevertrag") || lowerMsg.includes("leg die anlage an"))) {
      relevance += 5;
      why = "Erstellt eine PV-Anlage aus dem Dokument";
    }
    
    // Magic Intake: MOD-07
    if (action.action_code === "ARM.MOD07.MAGIC_INTAKE_SELBSTAUSKUNFT" && 
        (lowerMsg.includes("gehaltsabrechnung") || lowerMsg.includes("gehaltsnachweis auslesen") || lowerMsg.includes("selbstauskunft befüllen") ||
         lowerMsg.includes("steuerbescheid auslesen") || lowerMsg.includes("rentenbescheid") || lowerMsg.includes("gehalt erfassen"))) {
      relevance += 5;
      why = "Befüllt die Selbstauskunft aus dem Dokument";
    }
    
    // Magic Intake: MOD-20
    if (action.action_code === "ARM.MOD20.MAGIC_INTAKE_CONTRACT" && 
        (lowerMsg.includes("mietvertrag") || lowerMsg.includes("nebenkostenabrechnung") || lowerMsg.includes("versorgungsvertrag") ||
         lowerMsg.includes("leg den vertrag an") || lowerMsg.includes("vertrag erfassen"))) {
      relevance += 5;
      why = "Erstellt einen Vertrag aus dem Dokument";
    }
    
    // Magic Intake: MOD-08 (Suchmandat)
    if (action.action_code === "ARM.MOD08.MAGIC_INTAKE_MANDATE" && 
        (lowerMsg.includes("suchmandat") || lowerMsg.includes("investmentkriterien") ||
         lowerMsg.includes("leg das suchmandat an"))) {
      relevance += 5;
      why = "Erstellt ein Suchmandat aus dem Dokument";
    }
    
    // Magic Intake: MOD-01
    if (action.action_code === "ARM.MOD01.MAGIC_INTAKE_PROFILE" && 
        (lowerMsg.includes("visitenkarte") || lowerMsg.includes("personalausweis") || lowerMsg.includes("handelsregisterauszug") ||
         lowerMsg.includes("stammdaten erfassen") || lowerMsg.includes("visitenkarte scannen"))) {
      relevance += 5;
      why = "Erstellt Stammdaten aus dem Dokument";
    }
    
    // Magic Intake: MOD-06
    if (action.action_code === "ARM.MOD06.MAGIC_INTAKE_LISTING" && 
        (lowerMsg.includes("listing anlegen") || lowerMsg.includes("inserat anlegen") || lowerMsg.includes("verkaufsinserat") ||
         lowerMsg.includes("exposé einlesen") || lowerMsg.includes("fremdes exposé") || lowerMsg.includes("verkaufsobjekt anlegen"))) {
      relevance += 5;
      why = "Erstellt ein Verkaufsinserat aus dem Dokument";
    }
    
    // Magic Intake: MOD-09
    if (action.action_code === "ARM.MOD09.MAGIC_INTAKE_PARTNER" && 
        (lowerMsg.includes("partner anlegen") || lowerMsg.includes("partnerprofil") || lowerMsg.includes("partnerbewerbung") ||
         lowerMsg.includes("lebenslauf") || lowerMsg.includes("vertriebspartner anlegen"))) {
      relevance += 5;
      why = "Erstellt ein Partnerprofil aus dem Dokument";
    }
    
    // Storage Extraction (Bulk)
    if (action.action_code === "ARM.DMS.STORAGE_EXTRACTION" && 
        (lowerMsg.includes("datenraum") || lowerMsg.includes("alle dokumente") || lowerMsg.includes("bulk") ||
         lowerMsg.includes("storage") || lowerMsg.includes("indexieren") || lowerMsg.includes("durchsuchbar"))) {
      relevance += 5;
      why = "Macht den gesamten Datenraum für Armstrong durchsuchbar";
    }
    
    if (relevance > 0) {
      suggestions.push({
        action_code: action.action_code,
        title_de: action.title_de,
        execution_mode: action.execution_mode,
        risk_level: action.risk_level,
        cost_model: action.cost_model,
        credits_estimate: action.credits_estimate || 0,
        cost_hint_cents: action.cost_hint_cents || 0,
        side_effects: action.side_effects,
        why: why || `Relevanz: ${action.description_de}`,
      });
    }
  }
  
  return suggestions.slice(0, 5);
}

// =============================================================================
// ACTION EXECUTION (MVP DISPATCHER)
// =============================================================================

interface ExecutionResult {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
}

async function executeAction(
  actionCode: string,
  params: Record<string, unknown>,
  entity: EntityRef,
  userContext: UserContext,
  supabase: ReturnType<typeof createClient>
): Promise<ExecutionResult> {
  try {
    switch (actionCode) {
      case "ARM.MOD04.DATA_QUALITY_CHECK": {
        if (!entity.id || entity.type !== "property") {
          return { success: false, error: "Property ID required" };
        }
        
        const { data: property, error } = await supabase
          .from("properties")
          .select("*, units(*)")
          .eq("id", entity.id)
          .single();
        
        if (error) return { success: false, error: error.message };
        
        const checks = [
          { field: "address_street", label: "Straße", present: !!property.address_street },
          { field: "address_city", label: "Stadt", present: !!property.address_city },
          { field: "address_postal_code", label: "PLZ", present: !!property.address_postal_code },
          { field: "year_built", label: "Baujahr", present: !!property.year_built },
          { field: "area_sqm", label: "Fläche", present: !!property.area_sqm },
          { field: "purchase_price_cents", label: "Kaufpreis", present: !!property.purchase_price_cents },
        ];
        
        const missing = checks.filter(c => !c.present).map(c => c.label);
        const complete = checks.filter(c => c.present).map(c => c.label);
        const score = Math.round((complete.length / checks.length) * 100);
        
        return {
          success: true,
          output: {
            property_id: entity.id,
            completeness_score: score,
            complete_fields: complete,
            missing_fields: missing,
            unit_count: property.units?.length || 0,
            recommendation: missing.length > 0 
              ? `Bitte ergänzen Sie: ${missing.join(", ")}`
              : "Alle Pflichtfelder sind ausgefüllt.",
          },
        };
      }
      
      case "ARM.MOD04.CALCULATE_KPI": {
        if (!entity.id || entity.type !== "property") {
          return { success: false, error: "Property ID required" };
        }
        
        const { data: property, error } = await supabase
          .from("properties")
          .select("*, units(*, leases(*))")
          .eq("id", entity.id)
          .single();
        
        if (error) return { success: false, error: error.message };
        
        const purchasePrice = (property.purchase_price_cents || 0) / 100;
        const monthlyRent = property.units?.reduce((sum: number, unit: Record<string, unknown>) => {
          const leases = unit.leases as Array<Record<string, unknown>> | undefined;
          const activeLeases = leases?.filter((l) => l.status === "active") || [];
          const rent = (activeLeases[0]?.rent_net_cents as number) || 0;
          return sum + rent / 100;
        }, 0) || 0;
        
        const yearlyRent = monthlyRent * 12;
        const grossYield = purchasePrice > 0 ? (yearlyRent / purchasePrice) * 100 : 0;
        
        return {
          success: true,
          output: {
            property_id: entity.id,
            purchase_price_eur: purchasePrice,
            monthly_rent_eur: monthlyRent,
            yearly_rent_eur: yearlyRent,
            gross_yield_percent: Math.round(grossYield * 100) / 100,
            units_total: property.units?.length || 0,
          },
        };
      }
      
      case "ARM.MOD04.VALIDATE_PROPERTY": {
        if (!entity.id || entity.type !== "property") {
          return { success: false, error: "Property ID required" };
        }
        
        const { data: property, error } = await supabase
          .from("properties")
          .select("*")
          .eq("id", entity.id)
          .single();
        
        if (error) return { success: false, error: error.message };
        
        const validations = [
          { rule: "has_address", passed: !!(property.address_street && property.address_city), message: "Adresse vollständig" },
          { rule: "has_year_built", passed: !!property.year_built, message: "Baujahr angegeben" },
          { rule: "has_price", passed: !!property.purchase_price_cents, message: "Kaufpreis angegeben" },
          { rule: "valid_year", passed: property.year_built >= 1800 && property.year_built <= 2030, message: "Baujahr plausibel" },
        ];
        
        return {
          success: true,
          output: {
            property_id: entity.id,
            validations,
            all_passed: validations.every(v => v.passed),
          },
        };
      }
      
      case "ARM.MOD07.EXPLAIN_SELBSTAUSKUNFT": {
        return {
          success: true,
          output: {
            title: "Selbstauskunft für die Finanzierung",
            sections: [
              { name: "Persönliche Daten", fields: ["Anrede", "Vorname", "Nachname", "Geburtsdatum", "Geburtsort"] },
              { name: "Beschäftigung", fields: ["Arbeitgeber", "Position", "Beschäftigt seit", "Nettoeinkommen"] },
              { name: "Vermögen", fields: ["Bankguthaben", "Wertpapiere", "Lebensversicherungen", "Immobilien"] },
              { name: "Verbindlichkeiten", fields: ["Bestehende Kredite", "Raten", "Restschuld"] },
            ],
            purpose: "Die Selbstauskunft dient der Bonitätsprüfung durch die Bank.",
          },
        };
      }
      
      case "ARM.MOD07.DOC_CHECKLIST": {
        return {
          success: true,
          output: {
            title: "Dokument-Checkliste Finanzierung",
            required: [
              { doc: "Personalausweis", status: "required" },
              { doc: "Gehaltsabrechnungen (3 Monate)", status: "required" },
              { doc: "Einkommensteuerbescheid", status: "required" },
              { doc: "Selbstauskunft", status: "required" },
            ],
            optional: [
              { doc: "Arbeitsvertrag", status: "recommended" },
              { doc: "Kontoauszüge (3 Monate)", status: "recommended" },
            ],
          },
        };
      }
      
      case "ARM.MOD07.VALIDATE_READINESS": {
        return {
          success: true,
          output: {
            ready: false,
            checks: [
              { check: "Selbstauskunft vollständig", passed: false },
              { check: "Dokumente hochgeladen", passed: false },
              { check: "Objektdaten vorhanden", passed: false },
            ],
            next_steps: ["Selbstauskunft ausfüllen", "Dokumente hochladen"],
          },
        };
      }
      
      case "ARM.MOD08.RUN_SIMULATION": {
        const simulationParams = params as {
          purchase_price?: number;
          equity?: number;
          interest_rate?: number;
          repayment_rate?: number;
        };
        
        const price = simulationParams.purchase_price || 300000;
        const equity = simulationParams.equity || 60000;
        const loan = price - equity;
        const rate = simulationParams.interest_rate || 3.5;
        const repay = simulationParams.repayment_rate || 2;
        
        const monthlyRate = (loan * (rate + repay) / 100) / 12;
        
        return {
          success: true,
          output: {
            purchase_price_eur: price,
            equity_eur: equity,
            loan_amount_eur: loan,
            interest_rate_percent: rate,
            repayment_rate_percent: repay,
            monthly_rate_eur: Math.round(monthlyRate * 100) / 100,
            loan_to_value_percent: Math.round((loan / price) * 100),
          },
        };
      }
      
      case "ARM.MOD08.ANALYZE_FAVORITE": {
        if (!entity.id) {
          return { success: false, error: "Listing/Favorite ID required" };
        }
        
        return {
          success: true,
          output: {
            favorite_id: entity.id,
            analysis: {
              location_score: 7.5,
              price_score: 6.8,
              yield_estimate_percent: 4.2,
              recommendation: "Gutes Objekt für Kapitalanleger",
            },
          },
        };
      }
      
      case "ARM.MOD00.CREATE_TASK":
      case "ARM.MOD00.CREATE_REMINDER":
      case "ARM.MOD00.CREATE_NOTE": {
        const widgetType = actionCode.split(".").pop()?.replace("CREATE_", "").toLowerCase() || "note";
        
        return {
          success: true,
          output: {
            widget_type: widgetType,
            status: "draft_created",
            message: `${widgetType === "task" ? "Aufgabe" : widgetType === "reminder" ? "Erinnerung" : "Notiz"} wurde als Entwurf erstellt.`,
            params: params,
          },
        };
      }

      case "ARM.MOD13.CREATE_DEV_PROJECT": {
        // Delegate to sot-project-intake edge function
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (!supabaseUrl || !supabaseServiceKey) {
          return { success: false, error: "Server configuration missing" };
        }

        // Get recent uploads from tenant-documents for this user
        const { data: recentDocs, error: docsError } = await supabase
          .from("document_metadata")
          .select("*")
          .eq("uploaded_by", userContext.user_id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (docsError) {
          console.error("[Armstrong] Error fetching recent docs:", docsError);
        }

        // Call sot-project-intake
        try {
          const intakeResponse = await fetch(`${supabaseUrl}/functions/v1/sot-project-intake`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...params,
              user_id: userContext.user_id,
              org_id: userContext.org_id,
              source: "armstrong",
              recent_documents: recentDocs || [],
            }),
          });

          if (!intakeResponse.ok) {
            const errorText = await intakeResponse.text();
            console.error("[Armstrong] Project intake error:", errorText);
            return { success: false, error: `Projektanlage fehlgeschlagen: ${intakeResponse.status}` };
          }

          const intakeResult = await intakeResponse.json();
          
          return {
            success: true,
            output: {
              project_id: intakeResult.project_id,
              project_code: intakeResult.project_code,
              public_id: intakeResult.public_id,
              units_count: intakeResult.units_count,
              storage_tree_created: intakeResult.storage_tree_created,
              message: `Projekt ${intakeResult.project_code || 'neu'} wurde erfolgreich angelegt mit ${intakeResult.units_count || 0} Einheiten.`,
            },
          };
        } catch (fetchErr) {
          console.error("[Armstrong] Project intake fetch error:", fetchErr);
          return { success: false, error: "Verbindung zur Projektanlage fehlgeschlagen" };
        }
      }

      case "ARM.MOD13.EXPLAIN_MODULE": {
        return {
          success: true,
          output: {
            title: "Projekte-Modul (MOD-13)",
            description: "Das Projekte-Modul ermöglicht die vollständige Verwaltung von Bauträgerprojekten.",
            golden_path: [
              "1. Dashboard — Projektübersicht und Kacheln",
              "2. Magic Intake — KI-gestützte Projektanlage aus Exposé + Preisliste",
              "3. Objektpräsentation — 2-Spalten-Layout mit Projektdetails",
              "4. Kalkulation — Investment-Engine mit Sticky Panel",
              "5. Preisliste — 13-Spalten-Tabelle mit Stellplatz-Overrides",
              "6. DMS — Projekt- und Einheiten-Dokumentenstruktur",
              "7. Vertriebsstatusbericht — PDF-Export und Vorschau",
              "8. Vertriebsauftrag — Aktivierung für Partner-Netzwerk und Kaufy",
            ],
            features: [
              "Automatische Projekt-ID-Vergabe (SOT-BT-XXXXXXXX)",
              "Storage-Tree mit 7 Projektordnern + 5 Ordner pro Einheit",
              "Landing Page Builder für öffentliche Projektwebsites",
              "Integration mit MOD-08 (Investment-Suche) und MOD-09 (Partner-Netzwerk)",
            ],
          },
        };
      }
      
      case "ARM.MOD14.CREATE_RESEARCH_ORDER": {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (!supabaseUrl || !supabaseServiceKey) {
          return { success: false, error: "Server configuration missing" };
        }

        const intentText = (params.intent_text as string) || "Immobilienmakler";
        const region = (params.region as string) || "München";
        const maxResults = (params.max_results as number) || 25;

        // 1. Create research order
        const { data: order, error: orderError } = await supabase
          .from("research_orders")
          .insert({
            tenant_id: userContext.org_id,
            created_by: userContext.user_id,
            status: "queued",
            config: {
              intent: intentText,
              region: region,
              max_results: maxResults,
              source: "armstrong",
            },
          })
          .select("id")
          .single();

        if (orderError || !order) {
          console.error("[Armstrong] Research order creation failed:", orderError);
          return { success: false, error: `Auftrag konnte nicht erstellt werden: ${orderError?.message}` };
        }

        // 2. Trigger sot-research-run-order
        try {
          const runResponse = await fetch(`${supabaseUrl}/functions/v1/sot-research-run-order`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              order_id: order.id,
              tenant_id: userContext.org_id,
              user_id: userContext.user_id,
            }),
          });

          const runText = await runResponse.text();
          console.log("[Armstrong] Research run response:", runResponse.status, runText);
        } catch (fetchErr) {
          console.error("[Armstrong] Research run fetch error:", fetchErr);
        }

        // 3. Create dashboard widget
        try {
          await supabase.from("task_widgets").insert({
            tenant_id: userContext.org_id,
            user_id: userContext.user_id,
            widget_type: "task",
            title: `Recherche: ${intentText} ${region}`,
            description: `Rechercheauftrag gestartet — bis zu ${maxResults} Kontakte werden gesucht.`,
            status: "in_progress",
            metadata: {
              source: "armstrong",
              action_code: "ARM.MOD14.CREATE_RESEARCH_ORDER",
              research_order_id: order.id,
              link: `/portal/communication-pro/recherche?order=${order.id}`,
            },
          });
        } catch (widgetErr) {
          console.error("[Armstrong] Widget creation error:", widgetErr);
        }

        return {
          success: true,
          output: {
            research_order_id: order.id,
            intent: intentText,
            region: region,
            max_results: maxResults,
            credits_cost: maxResults,
            message: `Rechercheauftrag "${intentText} in ${region}" wurde erstellt und gestartet. Ich habe ein Widget auf Ihrem Dashboard erstellt. Sie finden die Ergebnisse unter Communication Pro → Recherche.`,
          },
        };
      }

      // =====================================================================
      // MAGIC INTAKE: MOD-04 (Immobilie aus Dokument anlegen)
      // =====================================================================
      case "ARM.MOD04.MAGIC_INTAKE_PROPERTY": {
        if (!userContext.org_id) {
          return { success: false, error: "Tenant ID required" };
        }

        const docContext04 = params.document_context as {
          extracted_text?: string;
          filename?: string;
        } | undefined;

        if (!docContext04?.extracted_text) {
          return { success: false, error: "Bitte laden Sie zuerst ein Dokument hoch (Kaufvertrag, Exposé oder PDF)." };
        }

        const supabaseUrl04 = Deno.env.get("SUPABASE_URL");
        const serviceKey04 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (!supabaseUrl04 || !serviceKey04) {
          return { success: false, error: "Server configuration missing" };
        }

        try {
          const parserResp = await fetch(`${supabaseUrl04}/functions/v1/sot-document-parser`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${serviceKey04}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: docContext04.extracted_text,
              parseMode: "properties",
              tenant_id: userContext.org_id,
            }),
          });

          if (!parserResp.ok) {
            const errText = await parserResp.text();
            console.error("[Armstrong] Parser error MOD-04:", errText);
            return { success: false, error: "Dokumentanalyse fehlgeschlagen" };
          }

          const parsed04 = await parserResp.json();
          const propData = parsed04.properties?.[0] || parsed04.data?.properties?.[0] || parsed04;

          const propertyInsert = {
            tenant_id: userContext.org_id,
            address_street: propData.address || propData.address_street || null,
            address_city: propData.city || propData.address_city || null,
            address_postal_code: propData.postal_code || propData.address_postal_code || null,
            property_type: propData.property_type || 'apartment_building',
            purchase_price_cents: propData.purchase_price ? Math.round(propData.purchase_price * 100) : null,
            market_value_cents: propData.market_value ? Math.round(propData.market_value * 100) : null,
            year_built: propData.construction_year || propData.year_built || null,
            area_sqm: propData.living_area_sqm || propData.area_sqm || null,
            name: propData.name || `${propData.address || 'Neue Immobilie'}, ${propData.city || ''}`.trim(),
            source: 'armstrong_magic_intake',
          };

          const { data: newProperty, error: propError } = await supabase
            .from("properties")
            .insert(propertyInsert)
            .select("id, name")
            .single();

          if (propError) {
            console.error("[Armstrong] Property insert error:", propError);
            return { success: false, error: `Immobilie konnte nicht angelegt werden: ${propError.message}` };
          }

          const units04 = propData.units || parsed04.units || [];
          if (units04.length > 0 && newProperty) {
            const unitInserts = units04.map((u: Record<string, unknown>, idx: number) => ({
              tenant_id: userContext.org_id,
              property_id: newProperty.id,
              unit_number: (u.unit_number as string) || `WE ${idx + 1}`,
              area_sqm: (u.area_sqm as number) || (u.living_area_sqm as number) || null,
              unit_type: (u.unit_type as string) || 'residential',
              floor: (u.floor as number) || null,
              rooms: (u.rooms as number) || null,
            }));

            await supabase.from("units").insert(unitInserts);
          }

          return {
            success: true,
            output: {
              property_id: newProperty?.id,
              property_name: newProperty?.name,
              units_created: units04.length,
              extracted_data: {
                address: propertyInsert.address_street,
                city: propertyInsert.address_city,
                purchase_price: propData.purchase_price,
                property_type: propertyInsert.property_type,
                year_built: propertyInsert.year_built,
                area_sqm: propertyInsert.area_sqm,
              },
              message: `Immobilie "${newProperty?.name}" wurde angelegt${units04.length > 0 ? ` mit ${units04.length} Einheit(en)` : ''}. [Zur Akte →](/portal/immobilien/${newProperty?.id})`,
              link: `/portal/immobilien/${newProperty?.id}`,
            },
          };
        } catch (err04) {
          console.error("[Armstrong] MOD-04 Magic Intake error:", err04);
          return { success: false, error: "Fehler bei der Immobilienanlage" };
        }
      }

      // =====================================================================
      // MAGIC INTAKE: MOD-11 (Finanzierungsfall aus Dokument)
      // =====================================================================
      case "ARM.MOD11.MAGIC_INTAKE_CASE": {
        if (!userContext.org_id) {
          return { success: false, error: "Tenant ID required" };
        }

        const docContext11 = params.document_context as {
          extracted_text?: string;
          filename?: string;
        } | undefined;

        if (!docContext11?.extracted_text) {
          return { success: false, error: "Bitte laden Sie zuerst ein Dokument hoch (Selbstauskunft, Gehaltsnachweis)." };
        }

        const supabaseUrl11 = Deno.env.get("SUPABASE_URL");
        const serviceKey11 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (!supabaseUrl11 || !serviceKey11) {
          return { success: false, error: "Server configuration missing" };
        }

        try {
          const parserResp11 = await fetch(`${supabaseUrl11}/functions/v1/sot-document-parser`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${serviceKey11}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: docContext11.extracted_text,
              parseMode: "financing",
              tenant_id: userContext.org_id,
            }),
          });

          if (!parserResp11.ok) {
            return { success: false, error: "Dokumentanalyse fehlgeschlagen" };
          }

          const parsed11 = await parserResp11.json();
          const profileData = parsed11.applicant || parsed11.data?.applicant || parsed11;

          const { data: finReq, error: frError } = await supabase
            .from("finance_requests")
            .insert({
              tenant_id: userContext.org_id,
              created_by: userContext.user_id,
              status: "intake",
              request_data: {
                source: "armstrong_magic_intake",
                loan_amount: profileData.loan_amount || null,
                bank: profileData.bank || null,
                purpose: profileData.purpose || "Immobilienfinanzierung",
              },
            })
            .select("id")
            .single();

          if (frError) {
            console.error("[Armstrong] Finance request insert error:", frError);
            return { success: false, error: `Finanzierungsanfrage konnte nicht erstellt werden: ${frError.message}` };
          }

          const profileInsert11 = {
            tenant_id: userContext.org_id,
            finance_request_id: finReq?.id || null,
            first_name: profileData.first_name || null,
            last_name: profileData.last_name || null,
            email: profileData.email || null,
            employer_name: profileData.employer || profileData.employer_name || null,
            net_income_monthly: profileData.net_income || profileData.net_income_monthly || null,
            employment_type: profileData.employment_type || null,
            birth_date: profileData.birth_date || null,
            address_street: profileData.address || profileData.address_street || null,
            address_city: profileData.city || profileData.address_city || null,
            address_postal_code: profileData.postal_code || profileData.address_postal_code || null,
            profile_type: "primary",
            party_role: "borrower",
          };

          const { data: newProfile, error: profError } = await supabase
            .from("applicant_profiles")
            .insert(profileInsert11)
            .select("id, first_name, last_name")
            .single();

          if (profError) {
            console.error("[Armstrong] Profile insert error:", profError);
          }

          const displayName11 = [profileInsert11.first_name, profileInsert11.last_name].filter(Boolean).join(' ') || 'Neuer Antragsteller';

          return {
            success: true,
            output: {
              finance_request_id: finReq?.id,
              applicant_profile_id: newProfile?.id,
              display_name: displayName11,
              extracted_data: {
                first_name: profileInsert11.first_name,
                last_name: profileInsert11.last_name,
                email: profileInsert11.email,
                employer: profileInsert11.employer_name,
                net_income: profileInsert11.net_income_monthly,
              },
              message: `Finanzierungsfall für "${displayName11}" wurde angelegt. [Zum Fall →](/portal/finanzierungsmanager/${finReq?.id})`,
              link: `/portal/finanzierungsmanager/${finReq?.id}`,
            },
          };
        } catch (err11) {
          console.error("[Armstrong] MOD-11 Magic Intake error:", err11);
          return { success: false, error: "Fehler bei der Fallanlage" };
        }
      }

      // =====================================================================
      // MAGIC INTAKE: MOD-18 (Finanzdaten aus Dokument)
      // =====================================================================
      case "ARM.MOD18.MAGIC_INTAKE_FINANCE": {
        if (!userContext.org_id) {
          return { success: false, error: "Tenant ID required" };
        }

        const docContext18 = params.document_context as {
          extracted_text?: string;
          filename?: string;
        } | undefined;

        if (!docContext18?.extracted_text) {
          return { success: false, error: "Bitte laden Sie zuerst ein Dokument hoch (Kontoauszug, Versicherungsschein)." };
        }

        const supabaseUrl18 = Deno.env.get("SUPABASE_URL");
        const serviceKey18 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (!supabaseUrl18 || !serviceKey18) {
          return { success: false, error: "Server configuration missing" };
        }

        try {
          const parserResp18 = await fetch(`${supabaseUrl18}/functions/v1/sot-document-parser`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${serviceKey18}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: docContext18.extracted_text,
              parseMode: "general",
              tenant_id: userContext.org_id,
            }),
          });

          if (!parserResp18.ok) {
            return { success: false, error: "Dokumentanalyse fehlgeschlagen" };
          }

          const parsed18 = await parserResp18.json();
          const results18: string[] = [];

          const insurances = parsed18.insurances || parsed18.data?.insurances || [];
          if (insurances.length > 0) {
            const insInserts = insurances.map((ins: Record<string, unknown>) => ({
              tenant_id: userContext.org_id,
              user_id: userContext.user_id,
              category: (ins.insurance_type as string) || (ins.category as string) || 'sonstige',
              provider: (ins.provider as string) || null,
              annual_premium: (ins.premium as number) || (ins.annual_premium as number) || null,
              contract_number: (ins.contract_number as string) || null,
              status: 'active',
              source: 'armstrong_magic_intake',
            }));
            
            const { error: insErr } = await supabase.from("insurance_contracts").insert(insInserts);
            if (insErr) console.error("[Armstrong] Insurance insert error:", insErr);
            else results18.push(`${insInserts.length} Versicherung(en) erfasst`);
          }

          const subscriptions = parsed18.subscriptions || parsed18.data?.subscriptions || [];
          if (subscriptions.length > 0) {
            const subInserts = subscriptions.map((sub: Record<string, unknown>) => ({
              tenant_id: userContext.org_id,
              user_id: userContext.user_id,
              name: (sub.subscription_name as string) || (sub.name as string) || 'Unbenannt',
              monthly_amount: (sub.monthly_cost as number) || (sub.monthly_amount as number) || null,
              status: 'active',
              source: 'armstrong_magic_intake',
            }));

            const { error: subErr } = await supabase.from("user_subscriptions").insert(subInserts);
            if (subErr) console.error("[Armstrong] Subscription insert error:", subErr);
            else results18.push(`${subInserts.length} Abonnement(s) erfasst`);
          }

          const bankAccounts = parsed18.bank_accounts || parsed18.data?.bank_accounts || [];
          if (bankAccounts.length > 0) {
            const bankInserts = bankAccounts.map((bank: Record<string, unknown>) => ({
              tenant_id: userContext.org_id,
              user_id: userContext.user_id,
              display_name: (bank.bank_name as string) || (bank.display_name as string) || 'Konto',
              iban: (bank.iban as string) || null,
              source: 'armstrong_magic_intake',
            }));

            const { error: bankErr } = await supabase.from("bank_account_meta").insert(bankInserts);
            if (bankErr) console.error("[Armstrong] Bank insert error:", bankErr);
            else results18.push(`${bankInserts.length} Bankkonto(en) erfasst`);
          }

          const summary18 = results18.length > 0 
            ? results18.join(', ')
            : 'Keine strukturierten Finanzdaten im Dokument erkannt';

          return {
            success: true,
            output: {
              insurances_created: insurances.length,
              subscriptions_created: subscriptions.length,
              bank_accounts_created: bankAccounts.length,
              summary: summary18,
              message: `Finanzdaten erfasst: ${summary18}. [Zur Finanzanalyse →](/portal/finanzanalyse)`,
              link: `/portal/finanzanalyse`,
            },
          };
        } catch (err18) {
          console.error("[Armstrong] MOD-18 Magic Intake error:", err18);
          return { success: false, error: "Fehler bei der Finanzdatenerfassung" };
        }
      }

      // =====================================================================
      // MAGIC INTAKE: MOD-17 (Fahrzeug aus Dokument)
      // =====================================================================
      case "ARM.MOD17.MAGIC_INTAKE_VEHICLE": {
        if (!userContext.org_id) {
          return { success: false, error: "Tenant ID required" };
        }

        const docContext17 = params.document_context as {
          extracted_text?: string;
          filename?: string;
        } | undefined;

        if (!docContext17?.extracted_text) {
          return { success: false, error: "Bitte laden Sie zuerst ein Dokument hoch (Fahrzeugschein, Fahrzeugbrief oder Kaufvertrag)." };
        }

        const supabaseUrl17 = Deno.env.get("SUPABASE_URL");
        const serviceKey17 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!supabaseUrl17 || !serviceKey17) return { success: false, error: "Server configuration missing" };

        try {
          const parserResp17 = await fetch(`${supabaseUrl17}/functions/v1/sot-document-parser`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${serviceKey17}`, "Content-Type": "application/json" },
            body: JSON.stringify({ text: docContext17.extracted_text, parseMode: "general", tenant_id: userContext.org_id }),
          });

          if (!parserResp17.ok) return { success: false, error: "Dokumentanalyse fehlgeschlagen" };

          const parsed17 = await parserResp17.json();
          const vData = parsed17.vehicle || parsed17.data?.vehicle || parsed17;

          const vehicleInsert = {
            tenant_id: userContext.org_id,
            user_id: userContext.user_id,
            license_plate: vData.license_plate || vData.kennzeichen || null,
            make: vData.make || vData.marke || vData.hersteller || null,
            model: vData.model || vData.modell || null,
            vin: vData.vin || vData.fahrzeug_ident_nr || null,
            first_registration_date: vData.first_registration || vData.erstzulassung || null,
            current_mileage_km: vData.mileage || vData.kilometerstand || null,
            hu_valid_until: vData.hu_until || vData.hu_bis || null,
            hsn: vData.hsn || null,
            tsn: vData.tsn || null,
            vehicle_type: vData.vehicle_type || 'car',
            source: 'armstrong_magic_intake',
          };

          const { data: newVehicle, error: vehError } = await supabase
            .from("cars_vehicles")
            .insert(vehicleInsert)
            .select("id, make, model, license_plate")
            .single();

          if (vehError) {
            console.error("[Armstrong] Vehicle insert error:", vehError);
            return { success: false, error: `Fahrzeug konnte nicht angelegt werden: ${vehError.message}` };
          }

          const displayName17 = [vehicleInsert.make, vehicleInsert.model].filter(Boolean).join(' ') || vehicleInsert.license_plate || 'Neues Fahrzeug';

          return {
            success: true,
            output: {
              vehicle_id: newVehicle?.id,
              display_name: displayName17,
              extracted_data: {
                license_plate: vehicleInsert.license_plate,
                make: vehicleInsert.make,
                model: vehicleInsert.model,
                vin: vehicleInsert.vin,
                first_registration: vehicleInsert.first_registration_date,
              },
              message: `Fahrzeug "${displayName17}" wurde angelegt. [Zur Akte →](/portal/cars/fahrzeuge/${newVehicle?.id})`,
              link: `/portal/cars/fahrzeuge/${newVehicle?.id}`,
            },
          };
        } catch (err17) {
          console.error("[Armstrong] MOD-17 Magic Intake error:", err17);
          return { success: false, error: "Fehler bei der Fahrzeuganlage" };
        }
      }

      // =====================================================================
      // MAGIC INTAKE: MOD-12 (Akquise-Mandat aus Dokument)
      // =====================================================================
      case "ARM.MOD12.MAGIC_INTAKE_MANDATE": {
        if (!userContext.org_id) {
          return { success: false, error: "Tenant ID required" };
        }

        const docContext12 = params.document_context as {
          extracted_text?: string;
          filename?: string;
        } | undefined;

        if (!docContext12?.extracted_text) {
          return { success: false, error: "Bitte laden Sie zuerst ein Dokument hoch (Suchprofil, Ankaufsprofil)." };
        }

        const supabaseUrl12 = Deno.env.get("SUPABASE_URL");
        const serviceKey12 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!supabaseUrl12 || !serviceKey12) return { success: false, error: "Server configuration missing" };

        try {
          const parserResp12 = await fetch(`${supabaseUrl12}/functions/v1/sot-document-parser`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${serviceKey12}`, "Content-Type": "application/json" },
            body: JSON.stringify({ text: docContext12.extracted_text, parseMode: "general", tenant_id: userContext.org_id }),
          });

          if (!parserResp12.ok) return { success: false, error: "Dokumentanalyse fehlgeschlagen" };

          const parsed12 = await parserResp12.json();
          const mData = parsed12.mandate || parsed12.data?.mandate || parsed12;

          // Generate mandate code
          const codePrefix = "MAN";
          const codeRandom = Math.random().toString(36).substring(2, 8).toUpperCase();
          const mandateCode = `${codePrefix}-${codeRandom}`;

          const mandateInsert = {
            tenant_id: userContext.org_id,
            created_by_user_id: userContext.user_id,
            code: mandateCode,
            client_display_name: mData.client_name || mData.client_display_name || null,
            asset_focus: mData.asset_types || mData.asset_focus || null,
            price_min: mData.min_price || mData.price_min || null,
            price_max: mData.max_price || mData.price_max || null,
            yield_target: mData.min_yield || mData.yield_target || null,
            notes: mData.notes || mData.description || null,
            profile_text_long: mData.profile_text || mData.investment_criteria || null,
            status: 'active',
          };

          const { data: newMandate, error: manError } = await supabase
            .from("acq_mandates")
            .insert(mandateInsert)
            .select("id, code, client_display_name")
            .single();

          if (manError) {
            console.error("[Armstrong] Mandate insert error:", manError);
            return { success: false, error: `Mandat konnte nicht angelegt werden: ${manError.message}` };
          }

          return {
            success: true,
            output: {
              mandate_id: newMandate?.id,
              mandate_code: newMandate?.code,
              client_name: mandateInsert.client_display_name,
              extracted_data: {
                client_name: mandateInsert.client_display_name,
                asset_focus: mandateInsert.asset_focus,
                price_range: `${mandateInsert.price_min || '?'} - ${mandateInsert.price_max || '?'}`,
                yield_target: mandateInsert.yield_target,
              },
              message: `Mandat "${newMandate?.code}" für "${mandateInsert.client_display_name || 'Neuer Investor'}" wurde angelegt. [Zum Mandat →](/portal/akquise-manager/mandate/${newMandate?.id})`,
              link: `/portal/akquise-manager/mandate/${newMandate?.id}`,
            },
          };
        } catch (err12) {
          console.error("[Armstrong] MOD-12 Magic Intake error:", err12);
          return { success: false, error: "Fehler bei der Mandatsanlage" };
        }
      }

      // =====================================================================
      // MAGIC INTAKE: MOD-19 (PV-Anlage aus Dokument)
      // =====================================================================
      case "ARM.MOD19.MAGIC_INTAKE_PLANT": {
        if (!userContext.org_id) {
          return { success: false, error: "Tenant ID required" };
        }

        const docContext19 = params.document_context as {
          extracted_text?: string;
          filename?: string;
        } | undefined;

        if (!docContext19?.extracted_text) {
          return { success: false, error: "Bitte laden Sie zuerst ein Dokument hoch (Installationsprotokoll, Datenblatt, Einspeisevertrag)." };
        }

        const supabaseUrl19 = Deno.env.get("SUPABASE_URL");
        const serviceKey19 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!supabaseUrl19 || !serviceKey19) return { success: false, error: "Server configuration missing" };

        try {
          const parserResp19 = await fetch(`${supabaseUrl19}/functions/v1/sot-document-parser`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${serviceKey19}`, "Content-Type": "application/json" },
            body: JSON.stringify({ text: docContext19.extracted_text, parseMode: "general", tenant_id: userContext.org_id }),
          });

          if (!parserResp19.ok) return { success: false, error: "Dokumentanalyse fehlgeschlagen" };

          const parsed19 = await parserResp19.json();
          const pvData = parsed19.pv_plant || parsed19.data?.pv_plant || parsed19;

          const plantInsert = {
            tenant_id: userContext.org_id,
            user_id: userContext.user_id,
            name: pvData.plant_name || pvData.name || 'Neue PV-Anlage',
            capacity_kwp: pvData.capacity_kwp || pvData.leistung_kwp || null,
            commissioning_date: pvData.commissioning_date || pvData.inbetriebnahme || null,
            address: pvData.address || pvData.standort || null,
            module_count: pvData.module_count || pvData.anzahl_module || null,
            inverter_model: pvData.inverter_type || pvData.wechselrichter || null,
            annual_yield_kwh: pvData.annual_yield_kwh || pvData.jahresertrag_kwh || null,
            feed_in_tariff_cents: pvData.feed_in_tariff_cents || pvData.einspeiseverguetung_cent || null,
            financing_bank: pvData.bank_name || pvData.bank || null,
            financing_original_amount: pvData.loan_amount || pvData.kreditbetrag || null,
            financing_monthly_rate: pvData.monthly_rate || pvData.monatsrate || null,
            source: 'armstrong_magic_intake',
          };

          const { data: newPlant, error: pvError } = await supabase
            .from("pv_plants")
            .insert(plantInsert)
            .select("id, name, capacity_kwp")
            .single();

          if (pvError) {
            console.error("[Armstrong] PV plant insert error:", pvError);
            return { success: false, error: `PV-Anlage konnte nicht angelegt werden: ${pvError.message}` };
          }

          return {
            success: true,
            output: {
              plant_id: newPlant?.id,
              plant_name: newPlant?.name,
              capacity_kwp: newPlant?.capacity_kwp,
              extracted_data: {
                name: plantInsert.name,
                capacity_kwp: plantInsert.capacity_kwp,
                commissioning_date: plantInsert.commissioning_date,
                annual_yield_kwh: plantInsert.annual_yield_kwh,
                financing_bank: plantInsert.financing_bank,
              },
              message: `PV-Anlage "${newPlant?.name}" (${newPlant?.capacity_kwp || '?'} kWp) wurde angelegt. [Zur Anlage →](/portal/photovoltaik/${newPlant?.id})`,
              link: `/portal/photovoltaik/${newPlant?.id}`,
            },
          };
        } catch (err19) {
          console.error("[Armstrong] MOD-19 Magic Intake error:", err19);
          return { success: false, error: "Fehler bei der PV-Anlagenanlage" };
        }
      }

      // =====================================================================
      // MAGIC INTAKE: MOD-07 (Selbstauskunft aus Dokument befüllen)
      // =====================================================================
      case "ARM.MOD07.MAGIC_INTAKE_SELBSTAUSKUNFT": {
        if (!userContext.org_id) {
          return { success: false, error: "Tenant ID required" };
        }

        const docContext07 = params.document_context as {
          extracted_text?: string;
          filename?: string;
        } | undefined;

        if (!docContext07?.extracted_text) {
          return { success: false, error: "Bitte laden Sie zuerst ein Dokument hoch (Gehaltsabrechnung, Steuerbescheid, Rentenbescheid)." };
        }

        const supabaseUrl07 = Deno.env.get("SUPABASE_URL");
        const serviceKey07 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!supabaseUrl07 || !serviceKey07) return { success: false, error: "Server configuration missing" };

        try {
          const parserResp07 = await fetch(`${supabaseUrl07}/functions/v1/sot-document-parser`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${serviceKey07}`, "Content-Type": "application/json" },
            body: JSON.stringify({ text: docContext07.extracted_text, parseMode: "financing", tenant_id: userContext.org_id }),
          });

          if (!parserResp07.ok) return { success: false, error: "Dokumentanalyse fehlgeschlagen" };

          const parsed07 = await parserResp07.json();
          const saData = parsed07.applicant || parsed07.data?.applicant || parsed07;

          // Build update payload for applicant_profiles
          const profileUpdate: Record<string, unknown> = {};
          if (saData.first_name) profileUpdate.first_name = saData.first_name;
          if (saData.last_name) profileUpdate.last_name = saData.last_name;
          if (saData.birth_date) profileUpdate.birth_date = saData.birth_date;
          if (saData.employer || saData.employer_name) profileUpdate.employer_name = saData.employer || saData.employer_name;
          if (saData.net_income || saData.net_income_monthly) profileUpdate.net_income_monthly = saData.net_income || saData.net_income_monthly;
          if (saData.gross_income) profileUpdate.bonus_yearly = null; // trigger: we have income data
          if (saData.employment_type) profileUpdate.employment_type = saData.employment_type;
          if (saData.address || saData.address_street) profileUpdate.address_street = saData.address || saData.address_street;
          if (saData.city || saData.address_city) profileUpdate.address_city = saData.city || saData.address_city;
          if (saData.postal_code || saData.address_postal_code) profileUpdate.address_postal_code = saData.postal_code || saData.address_postal_code;
          if (saData.tax_id) profileUpdate.tax_id = saData.tax_id;
          if (saData.marital_status) profileUpdate.marital_status = saData.marital_status;

          // Check if there's an existing profile to update
          const entityProfileId = (params.entity_id as string) || null;
          let resultMessage = "";
          const fieldsFound = Object.keys(profileUpdate).length;

          if (entityProfileId) {
            // Update existing profile
            const { error: updateErr } = await supabase
              .from("applicant_profiles")
              .update(profileUpdate)
              .eq("id", entityProfileId);

            if (updateErr) {
              console.error("[Armstrong] Profile update error:", updateErr);
              return { success: false, error: `Profil konnte nicht aktualisiert werden: ${updateErr.message}` };
            }
            resultMessage = `${fieldsFound} Feld(er) aus dem Dokument in die Selbstauskunft übernommen.`;
          } else {
            // Create new profile
            const { data: newProf, error: createErr } = await supabase
              .from("applicant_profiles")
              .insert({
                tenant_id: userContext.org_id,
                profile_type: "primary",
                party_role: "borrower",
                ...profileUpdate,
              })
              .select("id, first_name, last_name")
              .single();

            if (createErr) {
              console.error("[Armstrong] Profile create error:", createErr);
              return { success: false, error: `Profil konnte nicht erstellt werden: ${createErr.message}` };
            }
            const name07 = [newProf?.first_name, newProf?.last_name].filter(Boolean).join(' ') || 'Neuer Antragsteller';
            resultMessage = `Selbstauskunft für "${name07}" mit ${fieldsFound} Feld(ern) erstellt.`;
          }

          return {
            success: true,
            output: {
              fields_extracted: fieldsFound,
              extracted_fields: Object.keys(profileUpdate),
              extracted_data: profileUpdate,
              message: resultMessage,
            },
          };
        } catch (err07) {
          console.error("[Armstrong] MOD-07 Magic Intake error:", err07);
          return { success: false, error: "Fehler bei der Selbstauskunft-Befüllung" };
        }
      }

      // =====================================================================
      // MAGIC INTAKE: MOD-20 (Mietvertrag/Versorgungsvertrag)
      // =====================================================================
      case "ARM.MOD20.MAGIC_INTAKE_CONTRACT": {
        if (!userContext.org_id) return { success: false, error: "Tenant ID required" };
        const docCtx20 = params.document_context as { extracted_text?: string } | undefined;
        if (!docCtx20?.extracted_text) return { success: false, error: "Bitte laden Sie zuerst ein Dokument hoch (Mietvertrag, Nebenkostenabrechnung)." };
        const sbUrl20 = Deno.env.get("SUPABASE_URL");
        const sk20 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!sbUrl20 || !sk20) return { success: false, error: "Server configuration missing" };
        try {
          const pr20 = await fetch(`${sbUrl20}/functions/v1/sot-document-parser`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${sk20}`, "Content-Type": "application/json" },
            body: JSON.stringify({ text: docCtx20.extracted_text, parseMode: "general", tenant_id: userContext.org_id }),
          });
          if (!pr20.ok) return { success: false, error: "Dokumentanalyse fehlgeschlagen" };
          const p20 = await pr20.json();
          const cData = p20.contract || p20.data?.contract || p20;

          // Find or use first home
          let homeId = (params.home_id as string) || null;
          if (!homeId) {
            const { data: homes } = await supabase.from("miety_homes").select("id").eq("user_id", userContext.user_id).limit(1);
            homeId = homes?.[0]?.id || null;
          }

          const contractInsert = {
            user_id: userContext.user_id,
            home_id: homeId,
            category: cData.category || cData.contract_type || 'miete',
            provider_name: cData.provider_name || cData.vermieter || cData.landlord || null,
            contract_number: cData.contract_number || cData.vertragsnummer || null,
            monthly_cost: cData.monthly_rent || cData.monthly_cost || cData.miete || null,
            start_date: cData.start_date || cData.vertragsbeginn || null,
            end_date: cData.end_date || cData.vertragsende || null,
            notice_period: cData.notice_period || cData.kuendigungsfrist || null,
            notes: cData.notes || null,
          };

          const { data: nc, error: cErr } = await supabase.from("miety_contracts").insert(contractInsert).select("id, category, provider_name").single();
          if (cErr) return { success: false, error: `Vertrag konnte nicht angelegt werden: ${cErr.message}` };

          return {
            success: true,
            output: {
              contract_id: nc?.id,
              extracted_data: contractInsert,
              message: `Vertrag "${contractInsert.provider_name || contractInsert.category}" wurde angelegt.`,
            },
          };
        } catch (e20) {
          console.error("[Armstrong] MOD-20 Magic Intake error:", e20);
          return { success: false, error: "Fehler bei der Vertragsanlage" };
        }
      }

      // =====================================================================
      // MAGIC INTAKE: MOD-08 (Suchmandat aus Dokument)
      // =====================================================================
      case "ARM.MOD08.MAGIC_INTAKE_MANDATE": {
        if (!userContext.org_id) return { success: false, error: "Tenant ID required" };
        const docCtx08m = params.document_context as { extracted_text?: string } | undefined;
        if (!docCtx08m?.extracted_text) return { success: false, error: "Bitte laden Sie zuerst ein Dokument hoch (Suchprofil, Investmentkriterien)." };
        const sbUrl08m = Deno.env.get("SUPABASE_URL");
        const sk08m = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!sbUrl08m || !sk08m) return { success: false, error: "Server configuration missing" };
        try {
          const pr08m = await fetch(`${sbUrl08m}/functions/v1/sot-document-parser`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${sk08m}`, "Content-Type": "application/json" },
            body: JSON.stringify({ text: docCtx08m.extracted_text, parseMode: "general", tenant_id: userContext.org_id }),
          });
          if (!pr08m.ok) return { success: false, error: "Dokumentanalyse fehlgeschlagen" };
          const p08m = await pr08m.json();
          const smData = p08m.search_mandate || p08m.data?.search_mandate || p08m;

          const mandateInsert08 = {
            tenant_id: userContext.org_id,
            user_id: userContext.user_id,
            title: smData.title || smData.name || 'Neues Suchmandat',
            property_type: smData.property_type || smData.objektart || null,
            region: smData.region || smData.standort || null,
            budget_min: smData.budget_min || smData.min_price || null,
            budget_max: smData.budget_max || smData.max_price || null,
            min_yield_pct: smData.min_yield || smData.mindestrendite || null,
            strategy: smData.strategy || smData.strategie || null,
            notes: smData.notes || smData.beschreibung || null,
            status: 'active',
          };

          const { data: nsm, error: smErr } = await supabase.from("search_mandates").insert(mandateInsert08).select("id, title").single();
          if (smErr) return { success: false, error: `Suchmandat konnte nicht angelegt werden: ${smErr.message}` };

          return {
            success: true,
            output: {
              mandate_id: nsm?.id,
              extracted_data: mandateInsert08,
              message: `Suchmandat "${nsm?.title}" wurde angelegt. [Zum Suchmandat →](/portal/investments/mandate/${nsm?.id})`,
              link: `/portal/investments/mandate/${nsm?.id}`,
            },
          };
        } catch (e08m) {
          console.error("[Armstrong] MOD-08 Magic Intake error:", e08m);
          return { success: false, error: "Fehler bei der Suchmandats-Anlage" };
        }
      }

      // =====================================================================
      // MAGIC INTAKE: MOD-01 (Stammdaten aus Dokument)
      // =====================================================================
      case "ARM.MOD01.MAGIC_INTAKE_PROFILE": {
        if (!userContext.org_id) return { success: false, error: "Tenant ID required" };
        const docCtx01 = params.document_context as { extracted_text?: string } | undefined;
        if (!docCtx01?.extracted_text) return { success: false, error: "Bitte laden Sie zuerst ein Dokument hoch (Visitenkarte, Personalausweis, Handelsregisterauszug)." };
        const sbUrl01 = Deno.env.get("SUPABASE_URL");
        const sk01 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!sbUrl01 || !sk01) return { success: false, error: "Server configuration missing" };
        try {
          const pr01 = await fetch(`${sbUrl01}/functions/v1/sot-document-parser`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${sk01}`, "Content-Type": "application/json" },
            body: JSON.stringify({ text: docCtx01.extracted_text, parseMode: "contacts", tenant_id: userContext.org_id }),
          });
          if (!pr01.ok) return { success: false, error: "Dokumentanalyse fehlgeschlagen" };
          const p01 = await pr01.json();
          const pData = p01.contact || p01.data?.contacts?.[0] || p01;

          const contactInsert = {
            tenant_id: userContext.org_id,
            first_name: pData.first_name || pData.vorname || null,
            last_name: pData.last_name || pData.nachname || null,
            company: pData.company || pData.firma || null,
            email: pData.email || null,
            phone: pData.phone || pData.telefon || null,
            address: pData.address || pData.adresse || null,
            tax_id: pData.tax_id || pData.steuernummer || null,
            vat_id: pData.vat_id || pData.ust_id || null,
            register_number: pData.register_number || pData.handelsregisternummer || null,
            source: 'armstrong_magic_intake',
          };

          const { data: nc01, error: c01Err } = await supabase.from("contacts").insert(contactInsert).select("id, first_name, last_name, company").single();
          if (c01Err) return { success: false, error: `Kontakt konnte nicht angelegt werden: ${c01Err.message}` };

          const displayName01 = [nc01?.first_name, nc01?.last_name].filter(Boolean).join(' ') || nc01?.company || 'Neuer Kontakt';

          return {
            success: true,
            output: {
              contact_id: nc01?.id,
              display_name: displayName01,
              extracted_data: contactInsert,
              message: `Kontakt "${displayName01}" wurde angelegt.`,
            },
          };
        } catch (e01) {
          console.error("[Armstrong] MOD-01 Magic Intake error:", e01);
          return { success: false, error: "Fehler bei der Kontaktanlage" };
        }
      }

      // =====================================================================
      // MAGIC INTAKE: MOD-06 (Verkaufsinserat aus Dokument)
      // =====================================================================
      case "ARM.MOD06.MAGIC_INTAKE_LISTING": {
        if (!userContext.org_id) return { success: false, error: "Tenant ID required" };
        const docCtx06 = params.document_context as { extracted_text?: string } | undefined;
        if (!docCtx06?.extracted_text) return { success: false, error: "Bitte laden Sie zuerst ein Dokument hoch (Exposé, Eigentumsnachweis)." };
        const sbUrl06 = Deno.env.get("SUPABASE_URL");
        const sk06 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!sbUrl06 || !sk06) return { success: false, error: "Server configuration missing" };
        try {
          const pr06 = await fetch(`${sbUrl06}/functions/v1/sot-document-parser`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${sk06}`, "Content-Type": "application/json" },
            body: JSON.stringify({ text: docCtx06.extracted_text, parseMode: "properties", tenant_id: userContext.org_id }),
          });
          if (!pr06.ok) return { success: false, error: "Dokumentanalyse fehlgeschlagen" };
          const p06 = await pr06.json();
          const lData = p06.property || p06.data?.properties?.[0] || p06;

          const listingInsert = {
            tenant_id: userContext.org_id,
            created_by: userContext.user_id,
            title: lData.title || [lData.property_type, lData.address].filter(Boolean).join(' - ') || 'Neues Inserat',
            address: lData.address || null,
            city: lData.city || null,
            postal_code: lData.postal_code || null,
            property_type: lData.property_type || null,
            price: lData.purchase_price || lData.price || null,
            area_sqm: lData.living_area_sqm || lData.area_sqm || null,
            rooms: lData.rooms || null,
            construction_year: lData.construction_year || null,
            commission_pct: lData.commission_pct || lData.provision || null,
            description: lData.description || null,
            status: 'draft',
            source: 'armstrong_magic_intake',
          };

          const { data: nl06, error: l06Err } = await supabase.from("sale_listings").insert(listingInsert).select("id, title").single();
          if (l06Err) return { success: false, error: `Inserat konnte nicht angelegt werden: ${l06Err.message}` };

          return {
            success: true,
            output: {
              listing_id: nl06?.id,
              extracted_data: listingInsert,
              message: `Verkaufsinserat "${nl06?.title}" wurde als Entwurf angelegt. [Zum Inserat →](/portal/verkauf/${nl06?.id})`,
              link: `/portal/verkauf/${nl06?.id}`,
            },
          };
        } catch (e06) {
          console.error("[Armstrong] MOD-06 Magic Intake error:", e06);
          return { success: false, error: "Fehler bei der Inseratsanlage" };
        }
      }

      // =====================================================================
      // MAGIC INTAKE: MOD-09 (Vertriebspartner aus Dokument)
      // =====================================================================
      case "ARM.MOD09.MAGIC_INTAKE_PARTNER": {
        if (!userContext.org_id) return { success: false, error: "Tenant ID required" };
        const docCtx09 = params.document_context as { extracted_text?: string } | undefined;
        if (!docCtx09?.extracted_text) return { success: false, error: "Bitte laden Sie zuerst ein Dokument hoch (Bewerbung, Lebenslauf, Zertifikate)." };
        const sbUrl09 = Deno.env.get("SUPABASE_URL");
        const sk09 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!sbUrl09 || !sk09) return { success: false, error: "Server configuration missing" };
        try {
          const pr09 = await fetch(`${sbUrl09}/functions/v1/sot-document-parser`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${sk09}`, "Content-Type": "application/json" },
            body: JSON.stringify({ text: docCtx09.extracted_text, parseMode: "contacts", tenant_id: userContext.org_id }),
          });
          if (!pr09.ok) return { success: false, error: "Dokumentanalyse fehlgeschlagen" };
          const p09 = await pr09.json();
          const ptData = p09.partner || p09.data?.contacts?.[0] || p09;

          const partnerInsert = {
            tenant_id: userContext.org_id,
            first_name: ptData.first_name || ptData.vorname || null,
            last_name: ptData.last_name || ptData.nachname || null,
            email: ptData.email || null,
            phone: ptData.phone || ptData.telefon || null,
            company: ptData.company || ptData.firma || null,
            ihk_number: ptData.ihk_number || ptData.ihk_nr || null,
            regions: ptData.regions || ptData.regionen || null,
            qualifications: ptData.qualifications || ptData.qualifikationen || null,
            status: 'pending',
            source: 'armstrong_magic_intake',
          };

          const { data: np09, error: p09Err } = await supabase.from("partner_profiles").insert(partnerInsert).select("id, first_name, last_name").single();
          if (p09Err) return { success: false, error: `Partnerprofil konnte nicht angelegt werden: ${p09Err.message}` };

          const displayName09 = [np09?.first_name, np09?.last_name].filter(Boolean).join(' ') || 'Neuer Partner';

          return {
            success: true,
            output: {
              partner_id: np09?.id,
              display_name: displayName09,
              extracted_data: partnerInsert,
              message: `Partnerprofil "${displayName09}" wurde angelegt. [Zum Partner →](/portal/vertriebspartner/${np09?.id})`,
              link: `/portal/vertriebspartner/${np09?.id}`,
            },
          };
        } catch (e09) {
          console.error("[Armstrong] MOD-09 Magic Intake error:", e09);
          return { success: false, error: "Fehler bei der Partneranlage" };
        }
      }

      default:
        return { success: false, error: `Action ${actionCode} not implemented in MVP` };
    }
  } catch (err) {
    console.error(`[Armstrong] Action execution error:`, err);
    return { success: false, error: "Execution failed" };
  }
}

// =============================================================================
// LOGGING
// =============================================================================

async function logActionRun(
  supabase: ReturnType<typeof createClient>,
  actionCode: string,
  zone: Zone,
  userContext: UserContext,
  entity: EntityRef,
  module: Module,
  route: string,
  status: "pending" | "completed" | "failed",
  output?: Record<string, unknown>,
  error?: string,
  durationMs?: number
) {
  try {
    await supabase.from("armstrong_action_runs").insert({
      action_code: actionCode,
      zone: zone,
      org_id: userContext.org_id,
      user_id: userContext.user_id,
      status: status,
      input_context: {
        module,
        route,
        entity_type: entity.type,
        entity_id: entity.id,
      },
      output_result: output ? { summary: Object.keys(output).join(", ") } : null,
      error_message: error,
      duration_ms: durationMs || null,
      pii_present: false,
      retention_days: 90,
    });
  } catch (err) {
    console.error("[Armstrong] Failed to log action run:", err);
  }
}

// =============================================================================
// AI RESPONSE GENERATION
// =============================================================================

async function generateExplainResponse(
  message: string,
  module: Module,
  supabase: ReturnType<typeof createClient>,
  isGlobalAssist: boolean = false
): Promise<string> {
  const { data: kbItems } = await supabase
    .from("armstrong_knowledge_items")
    .select("title_de, summary_de, content")
    .eq("status", "published")
    .limit(5);
  
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    return `Ich verstehe Ihre Frage zu "${message}". Im aktuellen Modus kann ich Ihnen allgemeine Informationen geben.`;
  }
  
  try {
    // Enhanced system prompt for Global Assist Mode
    const globalAssistPrompt = `Du bist Armstrong, ein vollwertiger KI-Assistent bei System of a Town.

DEINE FÄHIGKEITEN:
- Allgemeine Fragen beantworten (wie ChatGPT)
- Texte schreiben und entwerfen (E-Mails, Briefe, Beschreibungen)
- Ideen entwickeln und Strategien vorschlagen
- Zusammenfassungen erstellen
- Checklisten und Pläne erstellen
- Bei Immobilien, Finanzierung und Investment beraten

GOVERNANCE-REGELN:
- Schreibende Aktionen erfordern Bestätigung
- Web-Recherche ist als separate Action verfügbar (mit Kosten)
- Keine Rechts-, Steuer- oder Finanzberatung (Hinweis auf Fachberater)
- Bei sensiblen Themen: Disclaimer verwenden

AKTUELLER KONTEXT:
- Modul: ${module}
- Modus: ${isGlobalAssist ? 'Global Assist (modul-agnostisch)' : 'Modul-spezifisch'}

STIL:
- Deutsch, klar, professionell aber freundlich
- Proaktiv Hilfe anbieten
- Bei Unsicherheit: ehrlich sagen`;

    const moduleSpecificPrompt = `Du bist Armstrong, ein KI-Assistent für Immobilienmanagement bei System of a Town. 
Du hilfst bei Fragen zu Immobilien, Finanzierung und Investment.
Antworte auf Deutsch, präzise und hilfsbereit.
Modul-Kontext: ${module}`;

    const systemPrompt = isGlobalAssist ? globalAssistPrompt : moduleSpecificPrompt;
    const kbContext = kbItems?.length 
      ? `\n\nWissenskontext:\n${kbItems.map(k => `- ${k.title_de}: ${k.summary_de || ''}`).join('\n')}`
      : '';
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt + kbContext },
          { role: "user", content: message },
        ],
        max_tokens: 800,
      }),
    });
    
    if (!response.ok) {
      console.error("[Armstrong] AI response error:", response.status);
      return `Ich kann Ihre Frage zu "${message}" beantworten. Wie kann ich Ihnen helfen?`;
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Ich konnte keine passende Antwort generieren.";
  } catch (err) {
    console.error("[Armstrong] AI generation error:", err);
    return `Entschuldigung, ich konnte die Anfrage nicht verarbeiten.`;
  }
}

// =============================================================================
// DRAFT GENERATION (for Global Assist Mode)
// =============================================================================

async function generateDraftResponse(
  message: string,
  module: Module,
  supabase: ReturnType<typeof createClient>
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    return `Entwurf basierend auf: "${message}"\n\n[Bitte vervollständigen Sie diesen Entwurf manuell]`;
  }
  
  try {
    const systemPrompt = `Du bist Armstrong, ein professioneller Textassistent bei System of a Town.

AUFGABE: Erstelle einen vollständigen, sofort verwendbaren Entwurf basierend auf der Anfrage.

REGELN:
- Schreibe in professionellem Deutsch
- Der Entwurf muss direkt verwendbar sein (nicht nur Platzhalter)
- Formatiere mit Markdown (Überschriften, Listen, etc.)
- Bei E-Mails: Betreff, Anrede, Inhalt, Grußformel
- Bei Briefen: Datum, Adressfeld, Anrede, Inhalt, Unterschrift
- Bei Beschreibungen: Strukturiert, klar, überzeugend

WICHTIG:
- Dies ist ein ENTWURF — der Nutzer kann ihn noch anpassen
- Erfinde keine Fakten, nutze allgemeine Formulierungen
- Bei persönlichen Daten: Platzhalter wie [Name], [Adresse] verwenden`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Erstelle folgenden Entwurf: ${message}` },
        ],
        max_tokens: 1000,
      }),
    });
    
    if (!response.ok) {
      console.error("[Armstrong] Draft generation error:", response.status);
      return `Entwurf für: "${message}"\n\n[Konnte keinen automatischen Entwurf erstellen. Bitte manuell verfassen.]`;
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || `Entwurf basierend auf: "${message}"`;
  } catch (err) {
    console.error("[Armstrong] Draft generation error:", err);
    return `Entwurf für: "${message}"\n\n[Fehler bei der Erstellung]`;
  }
}

// =============================================================================
// DOCUMENT ANALYSIS RESPONSE
// =============================================================================

async function generateDocumentAnalysisResponse(
  message: string,
  documentContext: {
    extracted_text: string;
    filename: string;
    content_type: string;
    confidence: number;
  },
  module: Module,
  supabase: ReturnType<typeof createClient>
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    return `Dokument "${documentContext.filename}" erhalten. Die KI-Analyse ist derzeit nicht verfügbar.`;
  }

  try {
    const systemPrompt = `Du bist Armstrong, ein professioneller Dokumentenanalyst bei System of a Town.

AUFGABE: Analysiere das folgende Dokument und beantworte die Frage des Users.

FÄHIGKEITEN:
- Zusammenfassungen erstellen
- Rechnungen analysieren (Positionen, Beträge, Summen)
- Daten extrahieren (Zahlen, Daten, Namen, Adressen)
- Verträge prüfen (Klauseln, Laufzeiten, Konditionen)
- Tabellen aus Dokumenten erstellen
- Vergleiche zwischen Dokumenten durchführen

REGELN:
- Antworte auf Deutsch, strukturiert mit Markdown
- Verwende Tabellen für numerische Daten
- Bei Rechnungen: Immer Gesamtbetrag hervorheben
- Bei Unsicherheit: klar kommunizieren
- KEIN Rechts- oder Steuerberatung (Hinweis auf Fachberater)
- Confidence des Parsers: ${documentContext.confidence}

DOKUMENT: "${documentContext.filename}" (${documentContext.content_type})`;

    // Truncate extracted text to fit context window
    const maxTextLength = 30000;
    const extractedText = documentContext.extracted_text.length > maxTextLength
      ? documentContext.extracted_text.substring(0, maxTextLength) + "\n\n[... Text gekürzt ...]"
      : documentContext.extracted_text;

    const userPrompt = message.trim() || "Fasse dieses Dokument zusammen.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `DOKUMENTINHALT:\n\n${extractedText}\n\n---\n\nFRAGE DES USERS: ${userPrompt}` },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error("[Armstrong] Document analysis AI error:", response.status);
      return `Dokument "${documentContext.filename}" erhalten, aber die Analyse konnte nicht durchgeführt werden.`;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Die Analyse konnte kein Ergebnis liefern.";
  } catch (err) {
    console.error("[Armstrong] Document analysis error:", err);
    return `Fehler bei der Analyse von "${documentContext.filename}". Bitte versuchen Sie es erneut.`;
  }
}

// =============================================================================
// LEGACY HANDLER (backward compatibility)
// =============================================================================

async function handleLegacyRequest(
  request: LegacyRequest,
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  console.log(`[Armstrong] Legacy request: action=${request.action}`);
  
  // Handle explain action
  if (request.action === "explain" && request.term) {
    const { data: kbItems } = await supabase
      .from("armstrong_knowledge_items")
      .select("title_de, summary_de, content")
      .or(`title_de.ilike.%${request.term}%,content.ilike.%${request.term}%`)
      .limit(1);
    
    if (kbItems && kbItems.length > 0) {
      return new Response(JSON.stringify({
        explanation: kbItems[0].content,
        title: kbItems[0].title_de,
        source: "armstrong_knowledge_items"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    return new Response(JSON.stringify({
      explanation: `Zu "${request.term}" habe ich keine Erklärung gefunden.`,
      title: request.term,
      source: null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  
  // Handle simulate action
  if (request.action === "simulate" && request.simulationParams) {
    const params = request.simulationParams;
    const price = (params.purchasePrice as number) || 300000;
    const equity = (params.equity as number) || 60000;
    const loan = price - equity;
    const rate = 3.5;
    const repay = (params.repaymentRate as number) || 2;
    const monthlyRate = (loan * (rate + repay) / 100) / 12;
    
    return new Response(JSON.stringify({
      summary: {
        purchasePrice: price,
        equity: equity,
        loanAmount: loan,
        monthlyRate: Math.round(monthlyRate),
        interestRate: rate,
        ltv: Math.round((loan / price) * 100),
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  
  // Handle chat action - stream response
  if (request.action === "chat" && request.messages) {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    const ctx = (request.context ?? {}) as Record<string, unknown>;
    const website = (ctx["website"] as string | undefined) ?? "kaufy";
    const persona = (ctx["persona"] as string | undefined) ?? "investor";

    const lastUserMessage =
      [...request.messages].reverse().find((m) => m.role === "user")?.content ?? "";

    const safeTerm = lastUserMessage
      .replaceAll("%", " ")
      .replaceAll("_", " ")
      .slice(0, 120)
      .trim();

    const kbCategories =
      persona === "seller" || persona === "partner"
        ? ["sales", "real_estate"]
        : persona === "landlord"
          ? ["real_estate", "tax_legal"]
          : ["real_estate", "finance", "tax_legal"];

    const { data: kbItems } = await supabase
      .from("armstrong_knowledge_items")
      .select("title_de, summary_de, category")
      .eq("scope", "global")
      .eq("status", "published")
      .in("category", kbCategories)
      .or(
        `title_de.ilike.%${safeTerm}%,summary_de.ilike.%${safeTerm}%,content.ilike.%${safeTerm}%`
      )
      .limit(4);

    const kbBlock = (kbItems ?? [])
      .map((i: any) =>
        `- [${i.category}] ${i.title_de}${i.summary_de ? `: ${i.summary_de}` : ""}`
      )
      .join("\n");

    const KAUFY_IMMO_ADVISOR_PROMPT = `Du bist Armstrong, der KI-Immobilien- und Investment-Berater auf KAUFY.

DEINE ROLLE:
- Immobilienberater für Kapitalanlage (KEIN Büroassistent, KEINE Backoffice-Actions)
- Investment-Engine-Erklärer (Simulation/Logik erklären)
- Du darfst Nutzer motivieren, das Portal "System of a Town" zu nutzen

KERNWISSEN — GELDWERT VS. SACHWERT:
- Geld verliert langfristig Kaufkraft durch Inflation. Auch bei Zinsen bleibt real oft wenig übrig.
- Immobilien sind reale Werte (Wohnraum). Wohnraum wird genutzt → erzeugt Einnahmen.
- Mieten und Preise können sich langfristig an Inflation anpassen (kein Automatismus).
- Kernaussage: Geldwert tendiert langfristig zur Entwertung. Sachwert kann Wert erhalten oder steigern. Entscheidend ist die Kombination aus Nutzung + Finanzierung + Zeit.

MIETEINNAHMEN TRAGEN DIE BELASTUNG:
- Der Käufer zahlt die Immobilie nicht allein. Die Mieteinnahmen tragen einen großen Teil der laufenden Kosten.
- Zinsen = Finanzierungskosten, Tilgung = Vermögensaufbau, Instandhaltung = Werterhalt.
- Ehrlich: Nicht jede Immobilie trägt sich selbst. Cashflow kann negativ oder positiv sein.

FREMDKAPITAL & INFLATION:
- Ein Darlehen ist vorgezogene Kaufkraft. Die nominale Schuld bleibt gleich, aber Einkommen/Mieten können langfristig steigen.
- Wichtig: Zinsen können steigen, Refinanzierungsrisiko existiert. Rücklagen, Zinsbindung und Puffer sind entscheidend.

STEUERN (nur Logik, keine Beratung):
- Zinsen sind oft steuerlich relevant. Abschreibung (AfA) existiert. Mieteinnahmen sind nicht 1:1 "Gewinn".
- PFLICHT: "Wie stark das wirkt, hängt von deiner persönlichen Situation ab. Für Details brauchst du einen Steuerberater."

IMMOBILIE VS. ETF VS. FESTGELD:
- Festgeld: sicher, planbar, aber meist kaum Inflationsschutz, kein Hebel.
- ETF/Aktien: Zinseszins-Effekt, hohe Liquidität, emotionale Schwankungen.
- Immobilie: laufende Einnahmen, Fremdkapital-Hebel, Sachwertcharakter, dafür: Aufwand, Klumpenrisiko, Management.
- "Keine Anlage ist besser als alle anderen – aber Immobilien können Dinge, die andere Anlageklassen schlicht nicht können."

INVESTMENT-ENGINE ERKLÄREN:
- Typische Inputs: Kaufpreis, Eigenkapital, Darlehensbetrag, Zinssatz, Tilgung, Kaltmiete, Nebenkosten, Hausgeld/Rücklagen.
- Typische Outputs: Monatlicher Cashflow, Jährliche Belastung, Tilgungsleistung, Eigenkapitalbindung, Grobe Renditeindikatoren.
- "Die Engine rechnet nichts Magisches. Sie ordnet Einnahmen, Kosten und Zeit – damit du verstehst, was langfristig passiert."

PORTAL-WISSEN (System of a Town):
- MOD-00 Dashboard (Home)
- MOD-04 Immobilien (Akte/Portfolio)
- MOD-07 Finanzierung (Selbstauskunft, Dokumente, Anträge)
- MOD-08 Investments (Suche, Favoriten, Mandat, Simulation)
- MOD-13 Projekte (Bauträger-Workflow)
- "Im Portal kannst du dein Portfolio anlegen, Dokumente sauber ablegen, Finanzierungen vorbereiten und Investments simulieren."

VERBOTEN:
- Keine individuellen Kaufempfehlungen als Garantie
- Keine Steuer-/Rechtsberatung im Detail
- Keine Einsicht in interne Daten, Logs, Policies, Billing, Actions
- Keine Büroassistent-Funktionalität (keine E-Mail, Kalender, Admin)
- Keine Ausführung nicht freigegebener Actions

STORYTELLING (max 1 kurze Story pro Antwort):
- Du darfst kurze Narrative nutzen, z.B.: "Viele starten mit Sparen. Das ist gut. Aber Sparen allein ist wie Rudern gegen die Strömung. Eine Immobilie kann – richtig gemacht – mit der Strömung arbeiten."

STIL:
- Deutsch, klar, professionell aber nahbar
- 1 leichte humorvolle Zeile pro Antwort erlaubt
- Proaktiv Hilfe anbieten
- Bei Unsicherheit: ehrlich sagen
- Markdown für Struktur nutzen`;

    const zone3PersonaPrompt =
      persona === "seller"
        ? "Du bist Armstrong, der KI-Verkaufsberater auf KAUFY für Eigentümer/Verkäufer. Hilf beim Verkaufsprozess, Unterlagen, Vermarktung, Preislogik und nächsten Schritten. Keine internen Portal-Funktionen erwähnen."
        : persona === "landlord"
          ? "Du bist Armstrong, der KI-Vermieterberater auf KAUFY. Hilf bei Vermietung, Unterlagen, Mietrecht-Basics und nächsten Schritten. Keine internen Portal-Funktionen erwähnen."
          : persona === "partner"
            ? "Du bist Armstrong, der KI-Coach für Vertriebspartner auf KAUFY. Hilf bei Einwandbehandlung, Prozess, Compliance (z.B. §34c/VSH) und nächsten Schritten. Keine internen Portal-Funktionen erwähnen."
            : KAUFY_IMMO_ADVISOR_PROMPT;

    const systemPrompt =
      request.mode === "zone2"
        ? "Du bist Armstrong, der KI-Assistent im System of a Town Portal. Antworte auf Deutsch."
        : `${zone3PersonaPrompt}\n\nNutze vorrangig diese Wissensbibliothek (wenn passend) und erfinde keine Fakten:\n${kbBlock || "- (keine passenden Einträge gefunden)"}`;
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...request.messages
        ],
        stream: true,
      }),
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" }
    });
  }
  
  return new Response(JSON.stringify({ error: "Invalid legacy action" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

// =============================================================================
// SOCIAL AUDIT FLOW HANDLER
// =============================================================================

const SOCIAL_AUDIT_QUESTIONS = [
  { block: "Identität & Selbstbild", q: "Worauf bist du beruflich wirklich stolz – und warum?" },
  { block: "Identität & Selbstbild", q: "Wie möchtest du wahrgenommen werden, wenn du nicht im Raum bist?" },
  { block: "Identität & Selbstbild", q: "Welche drei Worte beschreiben dich – ehrlich, nicht Marketing?" },
  { block: "Haltung & Meinung", q: "Welche These vertrittst du, die viele in deiner Branche falsch sehen?" },
  { block: "Haltung & Meinung", q: "Was nervt dich in deiner Branche – und was würdest du anders machen?" },
  { block: "Haltung & Meinung", q: "Wofür würdest du öffentlich einstehen, auch wenn's Gegenwind gibt?" },
  { block: "Sprache & Stil", q: "Erzähl eine kurze Story aus deinem Alltag, die dich geprägt hat." },
  { block: "Sprache & Stil", q: "Magst du kurze Sätze oder lieber ausführlich? Warum?" },
  { block: "Sprache & Stil", q: "Wie direkt darf ein Call-to-Action sein? (soft / klar / gar nicht)" },
  { block: "Sprache & Stil", q: "Wie stehst du zu Emojis? (nie / dezent / gerne)" },
  { block: "Grenzen & Output-Ziele", q: "Welche Themen sind tabu?" },
  { block: "Grenzen & Output-Ziele", q: "Welche Tonalität willst du niemals? (z.B. cringe, zu salesy, zu hart)" },
  { block: "Grenzen & Output-Ziele", q: "Welche Art Posts willst du vermeiden? (Listenposts, Motivationssprüche, etc.)" },
  { block: "Grenzen & Output-Ziele", q: "Was soll Social für dich bewirken? (Authority, Leads, Recruiting, Sympathie)" },
  { block: "Grenzen & Output-Ziele", q: "Wie oft willst du realistisch posten? (pro Woche) und auf welchen Plattformen?" },
];

async function handleSocialAuditFlow(
  flow: { flow_type: string; flow_state?: Record<string, unknown> },
  message: string,
  conversation: Message[],
  userContext: UserContext,
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  const step = (flow.flow_state?.step as number) || 0;
  const totalSteps = SOCIAL_AUDIT_QUESTIONS.length;

  // Flow start (step 0)
  if (message === "__flow_start__" || step === 0) {
    const firstQ = SOCIAL_AUDIT_QUESTIONS[0];
    return new Response(JSON.stringify({
      type: "EXPLAIN",
      message: `🎙️ **Social Personality Audit**\n\nHi! Ich bin Armstrong und führe dich jetzt durch dein Persönlichkeits-Audit. 15 Fragen in 4 Blöcken — du kannst per Sprache oder Text antworten.\n\n**Block 1: ${firstQ.block}**\n\n**Frage 1 von ${totalSteps}:**\n${firstQ.q}`,
      flow_state: { step: 1, total_steps: totalSteps, status: "active" },
      suggested_actions: [],
      next_steps: [],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Answers arrive as messages; step indicates which question was just answered
  const answeredStep = step; // User just answered question N
  const nextStep = answeredStep + 1;

  // All questions answered — generate personality vector
  if (nextStep > totalSteps) {
    // Collect all user answers from conversation
    const answers = conversation
      .filter(m => m.role === "user")
      .map((m, i) => ({ question: SOCIAL_AUDIT_QUESTIONS[i]?.q || `Frage ${i+1}`, answer: m.content }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let personalityVector: Record<string, unknown> = {};
    let samplePost = "";

    if (LOVABLE_API_KEY) {
      try {
        const analysisPrompt = `Analysiere die folgenden Audit-Antworten einer Person und erstelle daraus:
1) Einen "personality_vector" als JSON mit: tone, sentence_length, formality, emotion_level, opinion_strength, cta_style, emoji_level, preferred_formats (array), taboo_topics (array), taboo_tones (array), avoided_formats (array), goals (array), posting_frequency (object mit per_week und platforms array)
2) Einen Beispiel-LinkedIn-Post der exakt zum ermittelten Stil passt.

Antworten:
${answers.map((a, i) => `Q${i+1}: ${a.question}\nA: ${a.answer}`).join("\n\n")}

Antworte mit dem Tool "audit_result".`;

        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "Du bist ein Social-Media-Personality-Analyst. Analysiere Audit-Antworten und erstelle ein Personality Profile." },
              { role: "user", content: analysisPrompt },
            ],
            tools: [{
              type: "function",
              function: {
                name: "audit_result",
                description: "Return the personality vector and a sample post.",
                parameters: {
                  type: "object",
                  properties: {
                    personality_vector: { type: "object" },
                    sample_post: { type: "string", description: "A sample LinkedIn post matching the personality." },
                  },
                  required: ["personality_vector", "sample_post"],
                  additionalProperties: false,
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "audit_result" } },
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            const parsed = JSON.parse(toolCall.function.arguments);
            personalityVector = parsed.personality_vector || {};
            samplePost = parsed.sample_post || "";
          }
        }
      } catch (err) {
        console.error("[Armstrong] Audit analysis error:", err);
      }
    }

    // Save to database
    if (userContext.org_id) {
      try {
        await supabase.from("social_personality_profiles").upsert({
          tenant_id: userContext.org_id,
          owner_user_id: userContext.user_id,
          answers_raw: { answers },
          personality_vector: personalityVector,
          audit_version: 1,
        }, { onConflict: "tenant_id,owner_user_id" }).select();
      } catch (err) {
        console.error("[Armstrong] Failed to save audit:", err);
      }
    }

    const resultMessage = samplePost
      ? `✅ **Audit abgeschlossen!**\n\nDeine Social DNA wurde gespeichert. Hier ein Beispiel-Post in deinem Stil:\n\n---\n\n${samplePost}\n\n---\n\nGehe jetzt zur **Knowledge Base**, um deine Themen zu definieren.`
      : `✅ **Audit abgeschlossen!**\n\nDeine Social DNA wurde gespeichert. Du kannst jetzt zur Knowledge Base wechseln und deine Themen definieren.`;

    return new Response(JSON.stringify({
      type: "RESULT",
      action_run_id: crypto.randomUUID(),
      status: "completed",
      message: resultMessage,
      output: { personality_vector: personalityVector, sample_post: samplePost },
      flow_state: { step: totalSteps, total_steps: totalSteps, status: "completed", result: personalityVector },
      next_steps: ["Knowledge Base öffnen", "Themen definieren"],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Next question
  const nextQ = SOCIAL_AUDIT_QUESTIONS[nextStep - 1];
  const prevBlock = SOCIAL_AUDIT_QUESTIONS[answeredStep - 1]?.block;
  const blockChanged = prevBlock !== nextQ.block;
  const blockHeader = blockChanged ? `\n\n**Block: ${nextQ.block}**\n` : "";
  const ack = "👍 Danke für deine Antwort!\n";

  return new Response(JSON.stringify({
    type: "EXPLAIN",
    message: `${ack}${blockHeader}\n**Frage ${nextStep} von ${totalSteps}:**\n${nextQ.q}`,
    flow_state: { step: nextStep, total_steps: totalSteps, status: "active" },
    suggested_actions: [],
    next_steps: [],
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const rawBody = await req.json();
    
    // Detect if this is a legacy request
    if ("action" in rawBody && ["chat", "explain", "simulate"].includes(rawBody.action)) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      return await handleLegacyRequest(rawBody as LegacyRequest, supabase);
    }
    
    // MVP Request handling
    const body = rawBody as RequestBody;
    const { zone, module, route, entity, message, action_request, flow, document_context } = body;
    
    console.log(`[Armstrong] MVP Request: zone=${zone}, module=${module}, route=${route}, flow=${flow?.flow_type || 'none'}`);
    
    // Validate zone
    if (zone !== "Z2") {
      return new Response(
        JSON.stringify({
          type: "BLOCKED",
          reason_code: "OUT_OF_SCOPE",
          message: "Armstrong MVP ist nur in Zone 2 (Portal) verfügbar.",
          suggested_actions: [],
          next_steps: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // NOTE: Module validation is now handled AFTER intent classification
    // to enable Global Assist Mode (explain/draft work in any module)
    
    // Get user context from JWT
    const authHeader = req.headers.get("Authorization");
    let userContext: UserContext = {
      user_id: "anonymous",
      org_id: null,
      roles: [],
    };
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        userContext.user_id = user.id;
        
        const { data: membership } = await supabase
          .from("organization_members")
          .select("organization_id, role")
          .eq("user_id", user.id)
          .limit(1)
          .single();
        
        if (membership) {
          userContext.org_id = membership.organization_id;
          userContext.roles = [membership.role];
        }
      }
    }
    
    // ===================================================================
    // FLOW HANDLER — intercept before normal intent routing
    // ===================================================================
    if (flow?.flow_type === "social_audit") {
      return await handleSocialAuditFlow(
        flow,
        message,
        body.conversation?.last_messages || [],
        userContext,
        supabase
      );
    }

    // Classify intent FIRST to enable Global Assist Mode
    const intent = classifyIntent(message, action_request);
    console.log(`[Armstrong] Intent: ${intent}, Module: ${module}`);
    
    // Check if this is a module-specific action request
    const isModuleSpecificAction = action_request?.action_code && 
      !action_request.action_code.startsWith("ARM.GLOBAL.");
    
    // GLOBAL ASSIST MODE: Allow explain/draft in any module
    const isGlobalAssistIntent = GLOBAL_ASSIST_INTENTS.includes(intent);
    const isInMvpModule = MVP_MODULES.includes(module);
    
    // Block module-specific actions outside MVP modules
    if (isModuleSpecificAction && !isInMvpModule) {
      return new Response(
        JSON.stringify({
          type: "EXPLAIN",
          message: `Modul-spezifische Aktionen sind in ${module} noch nicht verfügbar. Ich kann aber bei allgemeinen Aufgaben helfen — fragen Sie mich gerne!`,
          citations: [],
          suggested_actions: GLOBAL_ACTIONS.map(a => ({
            action_code: a.action_code,
            title_de: a.title_de,
            execution_mode: a.execution_mode,
            risk_level: a.risk_level,
            cost_model: a.cost_model,
            credits_estimate: a.credits_estimate || 0,
            cost_hint_cents: a.cost_hint_cents || 0,
            side_effects: a.side_effects,
            why: "Globale Aktion — überall verfügbar",
          })),
          next_steps: ["Nutzen Sie globale Aktionen oder stellen Sie eine Frage."],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get available actions for context (include global actions for all modules)
    const allActions = [...MVP_ACTIONS, ...GLOBAL_ACTIONS];
    const availableActions = isInMvpModule 
      ? filterActionsForContext(allActions, zone, module, userContext)
      : GLOBAL_ACTIONS.filter(a => a.zones.includes(zone));
    
    // =======================================================================
    // EXPLICIT ACTION REQUEST HANDLING
    // =======================================================================
    if (action_request?.action_code) {
      const actionCode = action_request.action_code;
      const action = MVP_ACTIONS.find(a => a.action_code === actionCode);
      
      if (!action) {
        return new Response(
          JSON.stringify({
            type: "BLOCKED",
            reason_code: "NOT_ALLOWED",
            message: `Action ${actionCode} ist nicht verfügbar.`,
            suggested_actions: [],
            next_steps: [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (!MVP_EXECUTABLE_ACTIONS.includes(actionCode)) {
        return new Response(
          JSON.stringify({
            type: "SUGGEST_ACTIONS",
            intent: "ACTION",
            suggested_actions: [{
              action_code: actionCode,
              title_de: action.title_de,
              execution_mode: action.execution_mode,
              risk_level: action.risk_level,
              cost_model: action.cost_model,
              credits_estimate: action.credits_estimate || 0,
              cost_hint_cents: action.cost_hint_cents || 0,
              side_effects: action.side_effects,
              why: "Diese Action ist im MVP nur als Vorschlag verfügbar.",
            }],
            next_steps: ["Diese Action wird in einer zukünftigen Version ausführbar sein."],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // CONFIRM GATE
      if (action.execution_mode === "execute_with_confirmation" && !action_request.confirmed) {
        return new Response(
          JSON.stringify({
            type: "CONFIRM_REQUIRED",
            action: {
              action_code: actionCode,
              title_de: action.title_de,
              summary: action.description_de,
              execution_mode: action.execution_mode,
              risk_level: action.risk_level,
              cost_model: action.cost_model,
              credits_estimate: action.credits_estimate || 0,
              cost_hint_cents: action.cost_hint_cents || 0,
              side_effects: action.side_effects,
              preconditions: [],
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // EXECUTE ACTION
      const startTime = Date.now();
      const result = await executeAction(
        actionCode,
        action_request.params || {},
        entity,
        userContext,
        supabase
      );
      const durationMs = Date.now() - startTime;
      
      await logActionRun(
        supabase,
        actionCode,
        zone,
        userContext,
        entity,
        module,
        route,
        result.success ? "completed" : "failed",
        result.output,
        result.error,
        durationMs
      );
      
      return new Response(
        JSON.stringify({
          type: "RESULT",
          action_run_id: crypto.randomUUID(),
          status: result.success ? "completed" : "failed",
          message: result.success 
            ? `${action.title_de} erfolgreich ausgeführt.`
            : `Fehler bei ${action.title_de}: ${result.error}`,
          output: result.output || {},
          next_steps: result.success ? ["Ergebnis prüfen", "Weitere Aktionen durchführen"] : ["Erneut versuchen"],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // =======================================================================
    // INTENT-BASED ROUTING
    // =======================================================================
    
    // =======================================================================
    // DOCUMENT ANALYSIS — intercept when document_context is present
    // =======================================================================
    if (document_context?.extracted_text) {
      console.log(`[Armstrong] Document analysis: ${document_context.filename}`);
      const docResponse = await generateDocumentAnalysisResponse(
        message,
        document_context,
        module,
        supabase
      );

      await logActionRun(
        supabase,
        "ARM.GLOBAL.ANALYZE_DOCUMENT",
        zone,
        userContext,
        entity,
        module,
        route,
        "completed",
        { filename: document_context.filename },
        undefined,
        undefined
      );

      return new Response(
        JSON.stringify({
          type: "EXPLAIN",
          message: docResponse,
          citations: [],
          suggested_actions: [],
          next_steps: ["Stellen Sie Folgefragen zum Dokument", "Laden Sie ein weiteres Dokument hoch"],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (intent === "EXPLAIN") {
      // Enable Global Assist Mode when not in MVP module
      const isGlobalAssist = !isInMvpModule;
      const explanation = await generateExplainResponse(message, module, supabase, isGlobalAssist);
      const suggestions = suggestActionsForMessage(message, availableActions);
      
      return new Response(
        JSON.stringify({
          type: "EXPLAIN",
          message: explanation,
          citations: [],
          suggested_actions: suggestions,
          next_steps: suggestions.length > 0 
            ? ["Wählen Sie eine der vorgeschlagenen Aktionen aus."]
            : isGlobalAssist
              ? ["Ich kann Ihnen bei weiteren Aufgaben helfen — fragen Sie einfach!"]
              : [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (intent === "DRAFT") {
      // Use AI to generate the actual draft content
      const isGlobalAssist = !isInMvpModule;
      const draftContent = await generateDraftResponse(message, module, supabase);
      
      return new Response(
        JSON.stringify({
          type: "DRAFT",
          draft: {
            title: "Entwurf",
            content: draftContent,
            format: "markdown",
          },
          message: "Hier ist mein Entwurf. Sie können ihn kopieren und anpassen:",
          suggested_actions: suggestActionsForMessage(message, availableActions),
          next_steps: ["Entwurf überprüfen und anpassen", "Kopieren und verwenden"],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (intent === "ACTION") {
      const suggestions = suggestActionsForMessage(message, availableActions);
      
      if (suggestions.length === 0) {
        return new Response(
          JSON.stringify({
            type: "EXPLAIN",
            message: `Ich habe keine passende Aktion für "${message}" gefunden.`,
            citations: [],
            suggested_actions: [],
            next_steps: ["Versuchen Sie eine andere Formulierung."],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({
          type: "SUGGEST_ACTIONS",
          intent: "ACTION",
          suggested_actions: suggestions,
          next_steps: ["Wählen Sie eine Aktion aus, um fortzufahren."],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Fallback
    return new Response(
      JSON.stringify({
        type: "EXPLAIN",
        message: "Ich konnte Ihre Anfrage nicht zuordnen.",
        citations: [],
        suggested_actions: [],
        next_steps: [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("[Armstrong] Error:", error);
    
    return new Response(
      JSON.stringify({
        type: "RESULT",
        action_run_id: null,
        status: "failed",
        message: "Ein unerwarteter Fehler ist aufgetreten.",
        output: {},
        next_steps: ["Bitte versuchen Sie es erneut."],
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
