/**
 * Parser Engine Types
 * 
 * TypeScript definitions for the manifest-driven document parsing engine.
 * Used by parserManifest.ts (SSOT), sot-document-parser (Edge Function),
 * and useDocumentIntake (Client Orchestrator).
 */

// ============================================
// Parser Mode — All supported parse modes
// ============================================

export type ParserMode =
  | 'immobilie'
  | 'finanzierung'
  | 'versicherung'
  | 'fahrzeugschein'
  | 'pv_anlage'
  | 'vorsorge'
  | 'person'
  | 'haustier'
  | 'kontakt'
  | 'allgemein';

/** Legacy mode aliases for backwards compatibility */
export type LegacyParseMode = 'properties' | 'contacts' | 'financing' | 'general';

/** Maps legacy modes to new engine modes */
export const LEGACY_MODE_MAP: Record<LegacyParseMode, ParserMode> = {
  properties: 'immobilie',
  contacts: 'kontakt',
  financing: 'finanzierung',
  general: 'allgemein',
};

// ============================================
// Field Definition
// ============================================

export type FieldType = 'string' | 'number' | 'date' | 'boolean' | 'enum' | 'currency';

export interface ParserFieldDef {
  /** Unique key used in AI extraction and DB mapping */
  key: string;
  /** Human-readable label (German) */
  label: string;
  /** Data type for validation */
  type: FieldType;
  /** Maps to this DB column in the target table */
  dbColumn: string;
  /** Is this field required? Missing required fields trigger warnings */
  required: boolean;
  /** For enum type: allowed values */
  enumValues?: string[];
  /** AI hint: additional context for the prompt */
  aiHint?: string;
}

// ============================================
// Parser Profile — One per parseMode
// ============================================

export interface ParserProfile {
  /** Unique mode key */
  parseMode: ParserMode;
  /** Links to recordCardManifest entity type (if applicable) */
  entityType: string | null;
  /** Human-readable label */
  label: string;
  /** Target DB table for extracted data */
  targetTable: string;
  /** Module code for DMS path resolution */
  moduleCode: string;
  /** Default DMS sub-folder for filing the document */
  targetDmsFolder: string;
  /** Fields to extract */
  fields: ParserFieldDef[];
  /** Document types this mode recognizes (for auto-detection in 'allgemein' mode) */
  exampleDocuments: string[];
}

// ============================================
// Engine Request / Response
// ============================================

export interface ParserEngineRequest {
  /** New engine mode (preferred) */
  parseMode: ParserMode;
  /** Storage path of the uploaded file */
  storagePath: string;
  /** Storage bucket */
  bucket?: string;
  /** Original filename */
  filename: string;
  /** MIME type */
  contentType?: string;
  /** Tenant ID for usage tracking */
  tenantId?: string;
  /** Document ID for linking results */
  documentId?: string;
  /** Entity ID to write extracted data to (optional, for direct DB write) */
  entityId?: string;
}

export interface ExtractedRecord {
  /** Which fields were extracted — keys match ParserFieldDef.key */
  [key: string]: unknown;
}

export interface ParserEngineResponse {
  success: boolean;
  /** Engine metadata */
  engine: {
    version: string;
    model: string;
    parseMode: ParserMode;
    parsedAt: string;
  };
  /** Overall confidence 0-1 */
  confidence: number;
  /** Warnings (missing required fields, type coercions, etc.) */
  warnings: string[];
  /** The target DB table from the manifest */
  targetTable: string;
  /** The target DMS folder from the manifest */
  targetDmsFolder: string;
  /** Extracted records (usually 1, but can be multiple for multi-entity docs) */
  records: ExtractedRecord[];
  /** Auto-detected mode (only set when parseMode was 'allgemein') */
  detectedMode?: ParserMode;
  /** Raw AI response for debugging */
  rawText?: string;
  /** Error message if success=false */
  error?: string;
}

// ============================================
// Intake Pipeline Types (Client-side)
// ============================================

export type IntakeStep = 'idle' | 'uploading' | 'parsing' | 'preview' | 'filing' | 'writing' | 'done' | 'error';

export interface IntakeProgress {
  step: IntakeStep;
  progress: number; // 0-100
  message?: string;
  error?: string;
}

export interface IntakeResult {
  /** Document ID from Phase 1 upload */
  documentId: string;
  /** Storage path of the uploaded file */
  storagePath: string;
  /** Parser response from Phase 2 */
  parserResponse?: ParserEngineResponse;
  /** Storage node ID after DMS filing */
  storageNodeId?: string;
  /** Whether data was written to the target table */
  dataWritten: boolean;
}
