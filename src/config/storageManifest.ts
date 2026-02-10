/**
 * Storage Manifest — SSOT for the entire DMS folder hierarchy.
 *
 * Every module that needs storage gets an entry here.
 * The `useUniversalUpload` hook and the DMS UI consume this manifest
 * to build paths, create sub-trees and validate uploads.
 *
 * Naming convention: module_code always uses UNDERSCORE (MOD_13, not MOD-13).
 * Blob-storage path:  {tenant_id}/{module_code}/{entity_id}/{filename}
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * UPLOAD CONTRACT — Binding Rules for ALL Upload Implementations
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Every upload in this system MUST use `useUniversalUpload` and follow the
 * 2-Phase architecture:
 *
 * PHASE 1 — Upload + Register (ALWAYS runs):
 *   1. Upload file to Storage (UPLOAD_BUCKET)    → status: 'uploading'
 *   2. Create `documents` record                 → status: 'linking'
 *   3. Create `document_links` (if context given)→ status: 'linking'
 *   4. Create `storage_nodes` file-node          → status: 'uploaded' ← PAUSE
 *      → Returns UploadedFileInfo { documentId, storagePath, previewUrl }
 *      → User sees the file immediately (UploadResultCard component)
 *
 * PHASE 2 — AI Analysis (OPTIONAL, only if triggerAI=true):
 *   5. Call sot-document-parser (storagePath only, NEVER file content)
 *   6. Store extraction results                  → status: 'done'
 *
 * RULES:
 *   ✓ User MUST see the uploaded file BEFORE any analysis starts
 *   ✓ All uploads go to UPLOAD_BUCKET ('tenant-documents')
 *   ✓ All paths built via buildStoragePath()
 *   ✓ Never send file content (base64) to Edge Functions
 *   ✓ Phase 2 can be triggered separately via analyzeDocument()
 *   ✓ Use UploadResultCard / UploadResultList for upload feedback UI
 *   ✗ Do NOT use useSmartUpload (deprecated re-export)
 *   ✗ Do NOT create custom upload logic outside useUniversalUpload
 *   ✗ Do NOT upload to Edge Functions directly (5MB limit)
 *
 * @see src/hooks/useUniversalUpload.ts — The canonical upload hook
 * @see src/components/shared/UploadResultCard.tsx — Upload feedback UI
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface ModuleStorageConfig {
  /** e.g. MOD_04 */
  module_code: string;
  /** Human-readable root folder name */
  root_name: string;
  /** template_id used in storage_nodes (e.g. MOD_04_ROOT) */
  root_template_id: string;
  /** Display order (matches routesManifest) */
  display_order: number;
  /**
   * Sub-folder templates that are created automatically when a new entity
   * (property, project, vehicle, pv-plant …) is added under this module.
   * Empty array = no auto sub-tree.
   */
  entity_sub_folders: string[];
  /**
   * Required documents checklist.
   * Each entry maps a human-readable doc name to the target sub-folder.
   */
  required_docs: { name: string; folder: string }[];
  /**
   * The DB column on storage_nodes that links a file-node to its parent
   * entity (e.g. 'property_id', 'vehicle_id', 'pv_plant_id').
   * null = module has no entity-level sub-trees.
   */
  entity_fk_column: string | null;
  /**
   * The DB table whose INSERT triggers automatic sub-tree creation.
   * null = no auto-trigger (folders created manually or on-demand).
   */
  entity_table: string | null;
}

// ── Manifest ─────────────────────────────────────────────────────────────────

export const STORAGE_MANIFEST: Record<string, ModuleStorageConfig> = {
  MOD_01: {
    module_code: 'MOD_01',
    root_name: 'Stammdaten',
    root_template_id: 'MOD_01_ROOT',
    display_order: 1,
    entity_sub_folders: [],
    required_docs: [],
    entity_fk_column: null,
    entity_table: null,
  },
  MOD_02: {
    module_code: 'MOD_02',
    root_name: 'KI Office',
    root_template_id: 'MOD_02_ROOT',
    display_order: 2,
    entity_sub_folders: [],
    required_docs: [],
    entity_fk_column: null,
    entity_table: null,
  },
  MOD_03: {
    module_code: 'MOD_03',
    root_name: 'Dokumente',
    root_template_id: 'MOD_03_ROOT',
    display_order: 3,
    entity_sub_folders: [],
    required_docs: [],
    entity_fk_column: null,
    entity_table: null,
  },
  MOD_04: {
    module_code: 'MOD_04',
    root_name: 'Immobilien',
    root_template_id: 'MOD_04_ROOT',
    display_order: 4,
    entity_sub_folders: [
      '01_Grunddaten',
      '02_Grundbuch',
      '03_Mietvertraege',
      '04_Nebenkostenabrechnung',
      '05_Versicherung',
      '06_Gutachten',
      '07_Fotos',
      '08_Sonstiges',
    ],
    required_docs: [
      { name: 'Grundbuchauszug', folder: '02_Grundbuch' },
      { name: 'Teilungserklärung', folder: '02_Grundbuch' },
      { name: 'Energieausweis', folder: '01_Grunddaten' },
      { name: 'Wohnflächenberechnung', folder: '01_Grunddaten' },
    ],
    entity_fk_column: 'property_id',
    entity_table: 'properties',
  },
  MOD_05: {
    module_code: 'MOD_05',
    root_name: 'Mietverwaltung',
    root_template_id: 'MOD_05_ROOT',
    display_order: 5,
    entity_sub_folders: [],
    required_docs: [],
    entity_fk_column: null,
    entity_table: null,
  },
  MOD_06: {
    module_code: 'MOD_06',
    root_name: 'Verkauf',
    root_template_id: 'MOD_06_ROOT',
    display_order: 6,
    entity_sub_folders: [],
    required_docs: [],
    entity_fk_column: null,
    entity_table: null,
  },
  MOD_07: {
    module_code: 'MOD_07',
    root_name: 'Finanzierung',
    root_template_id: 'MOD_07_ROOT',
    display_order: 7,
    entity_sub_folders: [
      '01_Antrag',
      '02_Einkommensnachweise',
      '03_Objektunterlagen',
      '04_Bankvergleich',
      '05_Vertrag',
    ],
    required_docs: [
      { name: 'Gehaltsnachweis (3 Monate)', folder: '02_Einkommensnachweise' },
      { name: 'Steuerbescheid', folder: '02_Einkommensnachweise' },
      { name: 'Selbstauskunft', folder: '01_Antrag' },
      { name: 'Kaufvertragsentwurf', folder: '03_Objektunterlagen' },
    ],
    entity_fk_column: null,
    entity_table: 'finance_requests',
  },
  MOD_08: {
    module_code: 'MOD_08',
    root_name: 'Investment-Suche',
    root_template_id: 'MOD_08_ROOT',
    display_order: 8,
    entity_sub_folders: [],
    required_docs: [],
    entity_fk_column: null,
    entity_table: null,
  },
  MOD_09: {
    module_code: 'MOD_09',
    root_name: 'Vertriebspartner',
    root_template_id: 'MOD_09_ROOT',
    display_order: 9,
    entity_sub_folders: [],
    required_docs: [],
    entity_fk_column: null,
    entity_table: null,
  },
  MOD_10: {
    module_code: 'MOD_10',
    root_name: 'Leads',
    root_template_id: 'MOD_10_ROOT',
    display_order: 10,
    entity_sub_folders: [],
    required_docs: [],
    entity_fk_column: null,
    entity_table: null,
  },
  MOD_11: {
    module_code: 'MOD_11',
    root_name: 'Finanzierungsmanager',
    root_template_id: 'MOD_11_ROOT',
    display_order: 11,
    entity_sub_folders: [],
    required_docs: [],
    entity_fk_column: null,
    entity_table: null,
  },
  MOD_12: {
    module_code: 'MOD_12',
    root_name: 'Akquise-Manager',
    root_template_id: 'MOD_12_ROOT',
    display_order: 12,
    entity_sub_folders: [],
    required_docs: [],
    entity_fk_column: null,
    entity_table: null,
  },
  MOD_13: {
    module_code: 'MOD_13',
    root_name: 'Projekte',
    root_template_id: 'MOD_13_ROOT',
    display_order: 13,
    entity_sub_folders: [
      '01_expose',
      '02_preisliste',
      '03_bilder_marketing',
      '04_kalkulation_exports',
      '05_reservierungen',
      '06_vertraege',
      '99_sonstiges',
    ],
    required_docs: [
      { name: 'Projekt-Exposé', folder: '01_expose' },
      { name: 'Preisliste', folder: '02_preisliste' },
    ],
    entity_fk_column: null,
    entity_table: null,
  },
  MOD_14: {
    module_code: 'MOD_14',
    root_name: 'Kommunikation Pro',
    root_template_id: 'MOD_14_ROOT',
    display_order: 14,
    entity_sub_folders: [],
    required_docs: [],
    entity_fk_column: null,
    entity_table: null,
  },
  MOD_15: {
    module_code: 'MOD_15',
    root_name: 'Fortbildung',
    root_template_id: 'MOD_15_ROOT',
    display_order: 15,
    entity_sub_folders: [],
    required_docs: [],
    entity_fk_column: null,
    entity_table: null,
  },
  MOD_16: {
    module_code: 'MOD_16',
    root_name: 'Services',
    root_template_id: 'MOD_16_ROOT',
    display_order: 16,
    entity_sub_folders: [],
    required_docs: [],
    entity_fk_column: null,
    entity_table: null,
  },
  MOD_17: {
    module_code: 'MOD_17',
    root_name: 'Car-Management',
    root_template_id: 'MOD_17_ROOT',
    display_order: 17,
    entity_sub_folders: [
      '01_Fahrzeugschein',
      '02_Versicherung',
      '03_TÜV_AU',
      '04_Reparaturen',
      '05_Tankkarten',
      '06_Sonstiges',
    ],
    required_docs: [
      { name: 'Fahrzeugschein (Zulassung)', folder: '01_Fahrzeugschein' },
      { name: 'Versicherungspolice', folder: '02_Versicherung' },
      { name: 'TÜV-Bericht', folder: '03_TÜV_AU' },
    ],
    entity_fk_column: 'vehicle_id',
    entity_table: 'vehicles',
  },
  MOD_18: {
    module_code: 'MOD_18',
    root_name: 'Finanzanalyse',
    root_template_id: 'MOD_18_ROOT',
    display_order: 18,
    entity_sub_folders: [],
    required_docs: [],
    entity_fk_column: null,
    entity_table: null,
  },
  MOD_19: {
    module_code: 'MOD_19',
    root_name: 'Photovoltaik',
    root_template_id: 'MOD_19_ROOT',
    display_order: 19,
    entity_sub_folders: [
      '01_Stammdaten',
      '02_MaStR_BNetzA',
      '03_Netzbetreiber',
      '04_Zaehler',
      '05_Wechselrichter_und_Speicher',
      '06_Versicherung',
      '07_Steuer_USt_BWA',
      '08_Wartung_Service',
    ],
    required_docs: [
      { name: 'Inbetriebnahmeprotokoll', folder: '05_Wechselrichter_und_Speicher' },
      { name: 'Netzbetreiber-Bestätigung', folder: '03_Netzbetreiber' },
      { name: 'Anmeldebestätigung MaStR', folder: '02_MaStR_BNetzA' },
      { name: 'Zählerprotokoll', folder: '04_Zaehler' },
      { name: 'Versicherungsnachweis', folder: '06_Versicherung' },
      { name: 'Wartungsvertrag', folder: '08_Wartung_Service' },
    ],
    entity_fk_column: 'pv_plant_id',
    entity_table: 'pv_plants',
  },
  MOD_20: {
    module_code: 'MOD_20',
    root_name: 'Miety',
    root_template_id: 'MOD_20_ROOT',
    display_order: 20,
    entity_sub_folders: [],
    required_docs: [],
    entity_fk_column: null,
    entity_table: null,
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** All valid module codes */
export const ALL_MODULE_CODES = Object.keys(STORAGE_MANIFEST);

/** Lookup by module_code */
export function getModuleConfig(moduleCode: string): ModuleStorageConfig | undefined {
  return STORAGE_MANIFEST[moduleCode];
}

/**
 * Returns a display name with zero-padded module number.
 * e.g. getModuleDisplayName('MOD_04') => "04 — Immobilien"
 */
export function getModuleDisplayName(moduleCode: string): string {
  const config = STORAGE_MANIFEST[moduleCode];
  if (!config) return moduleCode;
  const num = String(config.display_order).padStart(2, '0');
  return `${num} — ${config.root_name}`;
}

/** All module configs sorted by display_order */
export function getSortedModules(): ModuleStorageConfig[] {
  return Object.values(STORAGE_MANIFEST).sort((a, b) => a.display_order - b.display_order);
}

/**
 * Build the canonical blob-storage path for a file upload.
 *
 * Pattern: {tenantId}/{moduleCode}/{entityId}/{filename}
 * Fallback: {tenantId}/INBOX/{filename}
 */
export function buildStoragePath(
  tenantId: string,
  moduleCode?: string,
  entityId?: string,
  filename?: string,
): string {
  const safeName = filename || `upload_${Date.now()}`;
  if (!moduleCode) {
    return `${tenantId}/INBOX/${safeName}`;
  }
  if (!entityId) {
    return `${tenantId}/${moduleCode}/${safeName}`;
  }
  return `${tenantId}/${moduleCode}/${entityId}/${safeName}`;
}

/** The single bucket used for all uploads */
export const UPLOAD_BUCKET = 'tenant-documents';
