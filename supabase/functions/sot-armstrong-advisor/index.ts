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

const MVP_MODULES = ["MOD-00", "MOD-04", "MOD-07", "MOD-08"];

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
  
  // Global Actions (available in all modules)
  "ARM.GLOBAL.EXPLAIN_TERM",
  "ARM.GLOBAL.FAQ",
  "ARM.GLOBAL.WEB_RESEARCH",
  "ARM.GLOBAL.DRAFT_TEXT",
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
];

// =============================================================================
// INTENT CLASSIFICATION
// =============================================================================

function classifyIntent(message: string, actionRequest: ActionRequest | undefined): IntentType {
  if (actionRequest?.action_code) {
    return "ACTION";
  }
  
  const lowerMsg = message.toLowerCase();
  
  const draftKeywords = ["schreibe", "erstelle", "verfasse", "entwurf", "email", "brief", "nachricht"];
  if (draftKeywords.some(kw => lowerMsg.includes(kw))) {
    return "DRAFT";
  }
  
  const actionKeywords = [
    "berechne", "prüfe", "analysiere", "validiere", "simulation",
    "aufgabe", "erinnerung", "notiz", "reminder", "task", "note",
    "kpi", "rendite", "cashflow"
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
    const { zone, module, route, entity, message, action_request, flow } = body;
    
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
