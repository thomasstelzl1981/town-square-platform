/**
 * Document Parsing Schemas
 * 
 * TypeScript definitions for the AI-powered document parsing pipeline.
 * Used by sot-document-parser (Lovable AI) and dms-worker (Unstructured.io)
 */

// ============================================
// Parse Result Types
// ============================================

export interface ParsedProperty {
  code?: string;
  property_type?: 'apartment' | 'house' | 'multi_family' | 'commercial' | 'land' | 'other';
  address?: string;
  house_number?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  purchase_price?: number;
  market_value?: number;
  construction_year?: number;
  living_area_sqm?: number;
  plot_area_sqm?: number;
  units?: ParsedUnit[];
}

export interface ParsedUnit {
  unit_number?: string;
  floor?: number;
  area_sqm?: number;
  rooms?: number;
  monthly_rent?: number;
  tenant_name?: string;
  lease_start?: string;
  lease_end?: string;
}

export interface ParsedContact {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  address?: string;
}

export interface ParsedFinancing {
  bank?: string;
  loan_amount?: number;
  current_balance?: number;
  interest_rate?: number;
  monthly_payment?: number;
  term_years?: number;
  start_date?: string;
  end_date?: string;
}

export interface ParseResultData {
  properties?: ParsedProperty[];
  contacts?: ParsedContact[];
  financing?: ParsedFinancing[];
  raw_text?: string;
  detected_type?: 'portfolio' | 'contract' | 'invoice' | 'letter' | 'other';
}

export interface ParseResult {
  version: string;
  engine: 'lovable_ai' | 'unstructured_fast' | 'unstructured_hires';
  model?: string;
  parsed_at: string;
  confidence: number;
  warnings: string[];
  data: ParseResultData;
}

// ============================================
// API Request/Response Types
// ============================================

export interface ParseDocumentRequest {
  content: string; // base64 or text
  contentType: string; // MIME type
  filename: string;
  tenantId?: string;
  parseMode?: 'properties' | 'contacts' | 'financing' | 'general';
}

export interface ParseDocumentResponse {
  success: boolean;
  parsed?: ParseResult;
  filename?: string;
  contentType?: string;
  error?: string;
}

// ============================================
// Upload Pipeline Types
// ============================================

export type UploadStatus = 'idle' | 'uploading' | 'analyzing' | 'previewing' | 'importing' | 'done' | 'error';

export type ExtractionEngine = 'lovable_ai' | 'unstructured_fast' | 'unstructured_hires';

export type DocumentSource = 'upload' | 'resend' | 'caya' | 'dropbox' | 'onedrive' | 'gdrive' | 'import';

export interface UploadProgress {
  status: UploadStatus;
  progress: number; // 0-100
  message?: string;
  error?: string;
}

export interface SmartUploadOptions {
  parseMode?: 'properties' | 'contacts' | 'financing' | 'general';
  autoImport?: boolean;
  source?: DocumentSource;
  propertyId?: string;
  unitId?: string;
}

export interface SmartUploadResult {
  documentId?: string;
  parsed?: ParseResult;
  storagePath?: string;
  jsonPath?: string;
  error?: string;
}

// ============================================
// Billing Types
// ============================================

export interface BillingUsage {
  tenant_id: string;
  period_start: string;
  period_end: string;
  storage_bytes_used: number;
  document_count: number;
  extraction_pages_fast: number;
  extraction_pages_hires: number;
  extraction_cost_cents: number;
  lovable_ai_calls: number;
  lovable_ai_tokens: number;
  pages_from_resend: number;
  pages_from_caya: number;
  pages_from_dropbox: number;
  pages_from_onedrive: number;
  pages_from_gdrive: number;
}

export interface ExtractionSettings {
  auto_extract_resend: boolean;
  auto_extract_caya: boolean;
  auto_extract_connectors: boolean;
  default_engine: 'unstructured_fast' | 'unstructured_hires';
  monthly_limit_cents: number;
  notify_at_percent: number;
}

// ============================================
// Import Preview Types
// ============================================

export interface ImportPreviewField {
  key: string;
  label: string;
  value: unknown;
  originalValue?: unknown;
  confidence: number;
  editable: boolean;
  warning?: string;
}

export interface ImportPreviewRow {
  id: string;
  type: 'property' | 'contact' | 'financing' | 'unit';
  fields: ImportPreviewField[];
  selected: boolean;
  hasWarnings: boolean;
}

export interface ImportPreviewData {
  rows: ImportPreviewRow[];
  totalRows: number;
  selectedRows: number;
  overallConfidence: number;
  warnings: string[];
}

// ============================================
// Storage Path Helpers
// ============================================

export function getDocumentStoragePath(tenantId: string, documentId: string, filename: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `tenant/${tenantId}/raw/${year}/${month}/${documentId}-${filename}`;
}

export function getDerivedJsonPath(tenantId: string, documentId: string, type: 'metadata' | 'unstructured'): string {
  return `tenant/${tenantId}/derived/${documentId}/${type}.json`;
}

export function getImportBatchPath(tenantId: string, batchId: string): string {
  return `tenant/${tenantId}/imports/${batchId}`;
}