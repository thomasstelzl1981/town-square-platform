/**
 * ARMSTRONG TYPES — Phase 6 Governance Schema
 * 
 * Central type definitions for the Armstrong governance system.
 * Includes execution modes, action definitions, knowledge base types, and research memos.
 */

// =============================================================================
// EXECUTION MODE (K3 compliant)
// =============================================================================

/**
 * ExecutionMode defines how an action executes and what confirmations are required.
 * 
 * - readonly: Only reads data, no changes (no confirmation needed)
 * - draft_only: Creates proposals/drafts, no persistent SSOT changes (K4 compliant)
 * - execute_with_confirmation: Modifies data after user confirmation
 * - execute: Direct execution (ONLY allowed if risk_level=low AND data_scopes_write=[] AND cost_model=free)
 */
export type ExecutionMode = 
  | 'readonly'
  | 'draft_only'
  | 'execute_with_confirmation'
  | 'execute';

// =============================================================================
// CORE ACTION TYPES
// =============================================================================

export type ArmstrongZone = 'Z2' | 'Z3';
export type RiskLevel = 'low' | 'medium' | 'high';
export type CostModel = 'free' | 'metered' | 'premium';
export type CostUnit = 'per_call' | 'per_token' | 'per_page' | null;
export type ActionStatus = 'draft' | 'active' | 'deprecated';

export interface ApiContract {
  type: 'edge_function' | 'rpc' | 'internal' | 'tool_call';
  endpoint: string | null;
  tool_name?: string;
}

/**
 * ArmstrongActionV2 — Extended action definition with governance metadata.
 * 
 * New fields vs. V1:
 * - execution_mode replaces requires_confirmation
 * - side_effects array documents what the action changes
 * - preconditions/postconditions for validation
 * - version for semver tracking
 */
export interface ArmstrongActionV2 {
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
  execution_mode: ExecutionMode;
  requires_consent_code: string | null;
  roles_allowed: string[];  // Empty = all authenticated users
  
  // Data access scopes
  data_scopes_read: string[];
  data_scopes_write: string[];
  
  // Side effects documentation (K4: must match data_scopes_write)
  side_effects: string[];
  
  // Pre/Post conditions (optional, recommended for high-risk)
  preconditions?: string[];
  postconditions?: string[];
  
  // Billing
  cost_model: CostModel;
  cost_unit: CostUnit;
  cost_hint_cents: number | null;
  credits_estimate?: number; // Credits (1 Credit = 0.50 EUR)
  
  // Technical implementation
  api_contract: ApiContract;
  
  // UI
  ui_entrypoints: string[];
  
  // Audit
  audit_event_type: string;
  
  // Versioning
  version: string;  // Semver, e.g., "1.0.0"
  
  // Status
  status: ActionStatus;
}

// =============================================================================
// EXECUTION MODE VALIDATION (K3 enforcement)
// =============================================================================

/**
 * Validates that an action's execution_mode is consistent with its properties.
 * K3 Rule: execution_mode='execute' only allowed if:
 *   - risk_level='low' AND
 *   - data_scopes_write=[] AND
 *   - cost_model='free'
 * 
 * @throws Error if validation fails
 */
export function validateExecutionMode(action: ArmstrongActionV2): boolean {
  if (action.execution_mode === 'execute') {
    const violations: string[] = [];
    
    if (action.risk_level !== 'low') {
      violations.push(`risk_level must be 'low' (is '${action.risk_level}')`);
    }
    if (action.data_scopes_write.length > 0) {
      violations.push(`data_scopes_write must be empty (has ${action.data_scopes_write.length} entries)`);
    }
    if (action.cost_model !== 'free') {
      violations.push(`cost_model must be 'free' (is '${action.cost_model}')`);
    }
    
    if (violations.length > 0) {
      console.error(
        `[Armstrong K3 Violation] Action ${action.action_code} has execution_mode='execute' but: ${violations.join(', ')}`
      );
      return false;
    }
  }
  
  // K4: draft_only should not have direct writes to SSOT tables
  if (action.execution_mode === 'draft_only') {
    const sideEffectErrors = action.side_effects.filter(
      effect => !effect.includes('draft') && !effect.includes('proposal') && !effect.includes('preview')
    );
    if (sideEffectErrors.length > 0 && action.data_scopes_write.length > 0) {
      console.warn(
        `[Armstrong K4 Warning] Action ${action.action_code} has execution_mode='draft_only' ` +
        `but writes to: ${action.data_scopes_write.join(', ')}`
      );
    }
  }
  
  return true;
}

/**
 * Validates all actions in a manifest.
 * Call this at build time or app initialization.
 */
export function validateAllActions(actions: ArmstrongActionV2[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const action of actions) {
    if (!validateExecutionMode(action)) {
      errors.push(`K3/K4 violation in action: ${action.action_code}`);
    }
    
    // Check version format
    if (!/^\d+\.\d+\.\d+$/.test(action.version)) {
      errors.push(`Invalid version format in ${action.action_code}: ${action.version}`);
    }
    
    // Check side_effects consistency with data_scopes_write
    if (action.data_scopes_write.length > 0 && action.side_effects.length === 0) {
      errors.push(`${action.action_code} has data_scopes_write but no side_effects documented`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// =============================================================================
// KNOWLEDGE BASE TYPES
// =============================================================================

export type KBCategory = 
  | 'system'        // SOT-specific knowledge
  | 'real_estate'   // German real estate domain
  | 'tax_legal'     // Tax & legal hints (disclaimer required)
  | 'finance'       // Financing knowledge
  | 'sales'         // Sales communication
  | 'templates'     // Reusable templates
  | 'research'      // Armstrong-generated research memos
  | 'photovoltaik'; // Photovoltaik & Energiemanagement

export type KBContentType =
  | 'article'       // Explanatory text
  | 'playbook'      // Step-by-step guide
  | 'checklist'     // Validation checklist
  | 'script'        // Conversation template
  | 'faq'           // Q&A format
  | 'research_memo'; // Research result (needs review)

export type KBConfidence = 'verified' | 'high' | 'medium' | 'low';
export type KBStatus = 'draft' | 'review' | 'published' | 'deprecated';
export type KBScope = 'global' | 'tenant';

export interface KBSource {
  url: string;
  title: string;
  source_type: 'official' | 'professional' | 'general';
  accessed_at: string; // ISO date
}

export interface KnowledgeItem {
  id: string;
  item_code: string;
  category: KBCategory;
  subcategory?: string;
  content_type: KBContentType;
  title_de: string;
  summary_de?: string;
  content: string; // Markdown
  sources: KBSource[];
  confidence: KBConfidence;
  valid_until?: string; // ISO date
  scope: KBScope;
  org_id?: string; // Only for scope='tenant'
  status: KBStatus;
  created_by?: string;
  reviewed_by?: string;
  published_at?: string;
  version: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// RESEARCH MEMO (K4 compliant draft structure)
// =============================================================================

/**
 * Research Memo — Template for Armstrong-generated research.
 * Always created as draft, requires review before publish.
 */
export interface ResearchMemo {
  topic: string;
  created_at: string;
  summary: string;
  key_points: string[];
  sources: KBSource[];
  confidence: KBConfidence;
  valid_until: string; // ISO date (default: 90 days from creation)
  uncertainties: string[];
  recommendation?: string;
}

/**
 * Creates a default ResearchMemo structure with 90-day validity.
 */
export function createResearchMemoDefaults(topic: string): Partial<ResearchMemo> {
  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setDate(validUntil.getDate() + 90);
  
  return {
    topic,
    created_at: now.toISOString(),
    sources: [],
    confidence: 'medium',
    valid_until: validUntil.toISOString(),
    key_points: [],
    uncertainties: [],
  };
}

// =============================================================================
// POLICY TYPES
// =============================================================================

export type PolicyCategory = 'system_prompt' | 'guardrail' | 'security';
export type PolicyStatus = 'draft' | 'active' | 'deprecated';

export interface Policy {
  id: string;
  policy_code: string;
  category: PolicyCategory;
  title_de: string;
  content: string; // Markdown
  version: string;
  status: PolicyStatus;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  valid_from: string;
  valid_until?: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// ACTION RUN TYPES (Audit)
// =============================================================================

export type ActionRunStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type ActionRunZone = 'Z2' | 'Z3';

export interface ActionRun {
  id: string;
  action_code: string;
  zone: ActionRunZone;
  org_id?: string;
  user_id?: string;
  session_id?: string; // Zone 3 anonymous
  correlation_id?: string;
  status: ActionRunStatus;
  
  // Redacted context (whitelist-based, K6)
  input_context: Record<string, unknown>;
  output_result?: Record<string, unknown>;
  error_message?: string;
  
  // Metrics
  tokens_used: number;
  cost_cents: number;
  duration_ms: number;
  
  // PII governance (K6)
  pii_present: boolean;
  retention_days: number;
  
  created_at: string;
}

// =============================================================================
// ACTION OVERRIDES (K7: scope-aware)
// =============================================================================

export type OverrideStatus = 'active' | 'restricted' | 'disabled';
export type OverrideScopeType = 'global' | 'org';

export interface ActionOverride {
  id: string;
  action_code: string;
  status_override: OverrideStatus;
  scope_type: OverrideScopeType;
  org_id?: string; // Only for scope_type='org'
  restricted_reason?: string;
  disabled_until?: string;
  updated_by?: string;
  updated_at: string;
  created_at: string;
}

// =============================================================================
// BILLING EVENT TYPES
// =============================================================================

export interface BillingEvent {
  id: string;
  action_run_id: string;
  org_id: string;
  action_code: string;
  cost_model: CostModel;
  cost_cents: number;
  credits_charged: number;
  created_at: string;
}

// =============================================================================
// LEGACY TYPE MIGRATION HELPER
// =============================================================================

/**
 * Derives execution_mode from legacy requires_confirmation boolean.
 * Used for migration from V1 to V2 schema.
 */
export function deriveExecutionMode(
  requiresConfirmation: boolean,
  dataWriteScopes: string[],
  riskLevel: RiskLevel,
  costModel: CostModel
): ExecutionMode {
  if (requiresConfirmation) {
    return 'execute_with_confirmation';
  }
  
  // Check if qualifies for 'execute' (K3)
  if (riskLevel === 'low' && dataWriteScopes.length === 0 && costModel === 'free') {
    return 'execute';
  }
  
  // Has writes but no confirmation → draft_only
  if (dataWriteScopes.length > 0) {
    return 'draft_only';
  }
  
  return 'readonly';
}

/**
 * Derives side_effects from data_scopes_write.
 * Used for migration from V1 to V2 schema.
 */
export function deriveSideEffects(dataWriteScopes: string[]): string[] {
  return dataWriteScopes.map(scope => `modifies_${scope}`);
}
