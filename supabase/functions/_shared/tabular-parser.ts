/**
 * Shared Tabular Parser — Reusable utilities for XLSX/CSV/PDF table extraction
 * 
 * Used by: sot-document-parser, sot-project-intake
 * Eliminates code duplication across edge functions.
 * 
 * Provides:
 *  - uint8ToBase64()      — Chunked Base64 conversion
 *  - extractCsvFromPdf()  — Gemini Flash CSV extraction from PDF
 *  - fuzzyMapColumns()    — Regex-based column mapping
 *  - parseTabularFile()   — Universal XLSX/CSV/PDF→rows pipeline
 */

import * as XLSX from "https://esm.sh/xlsx@0.18.5";

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/** Chunked Base64 conversion — safe for large files (avoids call-stack overflow) */
export function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

// ═══════════════════════════════════════════════════════════════════════════
// CSV EXTRACTION FROM PDF (Gemini Flash)
// ═══════════════════════════════════════════════════════════════════════════

const CSV_EXTRACTION_PROMPT = `Du bist ein hochpräziser Tabellen-Extraktor. Extrahiere ALLE Tabellenzeilen aus diesem Dokument als semikolon-getrennte CSV.

Regeln:
- Erste Zeile = exakte Spaltenüberschriften aus dem Dokument
- Jede weitere Zeile = eine Datenzeile
- Trennzeichen: Semikolon (;)
- Zahlen: Punkt als Dezimaltrennzeichen, keine Tausenderpunkte (z.B. 149900.00 statt 149.900,00)
- Keine Markdown-Formatierung, kein Code-Block, keine Backticks, nur roher CSV-Text
- JEDE Zeile im Dokument MUSS enthalten sein. Überspringe KEINE Zeile.
- Wenn ein Feld leer ist, lasse es leer (zwei Semikolons hintereinander)
- Entferne Währungszeichen (€, EUR) aus Zahlenwerten
- Prozentzeichen (%) entfernen, Wert als Dezimalzahl ausgeben (z.B. 4.5 statt 4,5%)

Ausgabe NUR den CSV-Text, nichts anderes.`;

/**
 * Extract table data from a PDF as semicolon-delimited CSV using Gemini Flash.
 * @param base64Content - Base64-encoded PDF content
 * @param apiKey - Lovable AI gateway key
 * @param hint - Optional context hint for better extraction
 * @returns CSV text string, or null if extraction failed
 */
export async function extractCsvFromPdf(
  base64Content: string,
  apiKey: string,
  hint?: string
): Promise<string | null> {
  try {
    console.log('[tabular-parser] CSV preprocessing: extracting tables from PDF...');

    let systemPrompt = CSV_EXTRACTION_PROMPT;
    if (hint) {
      systemPrompt += `\n\nKONTEXT: ${hint}`;
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extrahiere alle Tabellenzeilen aus diesem PDF als CSV.' },
              { type: 'image_url', image_url: { url: `data:application/pdf;base64,${base64Content}` } },
            ],
          },
        ],
        temperature: 0.0,
        max_tokens: 32000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('[tabular-parser] CSV extraction failed:', aiResponse.status, errText);
      return null;
    }

    const aiResult = await aiResponse.json();
    let csv = aiResult.choices?.[0]?.message?.content || '';
    csv = csv.replace(/^```(?:csv)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

    const lines = csv.split('\n').filter((l: string) => l.trim().length > 0);
    const rowCount = Math.max(0, lines.length - 1);
    console.log(`[tabular-parser] CSV extracted: ${rowCount} data rows, ${csv.length} chars`);

    return csv.length > 10 ? csv : null;
  } catch (error) {
    console.error('[tabular-parser] CSV extraction error:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUZZY COLUMN MAPPING
// ═══════════════════════════════════════════════════════════════════════════

/** Standard column patterns for German real estate / financial documents */
export const STANDARD_COLUMN_PATTERNS: Record<string, RegExp> = {
  unitNumber: /^(whg|we|einheit|nr|top|obj|wohnung|lf|unit)/i,
  type: /^(typ|art|nutzung|kategorie)/i,
  area: /^(wfl|wohn.*fl|fläche|flaeche|qm|m²|m2|nutzfl)/i,
  rooms: /^(zimmer|zi|räume|raeume)/i,
  floor: /^(etage|geschoss|og|stockwerk|lage|ebene)/i,
  // pricePerSqm MUST be checked BEFORE price — more specific pattern first
  pricePerSqm: /^(kaufpreis.*(?:qm|m²|m2|pro)|preis.*(?:\/\s*(?:qm|m²|m2))|€.*(?:\/\s*(?:qm|m²|m2)))/i,
  // price: negative lookahead excludes per-sqm columns
  price: /^(kaufpreis(?!.*(?:qm|m²|m2|pro))|gesamtkauf|gesamtpreis|vk\b|verkaufspreis|kp\b)/i,
  currentRent: /^(miete|ist.*miete|monatsmiete|kaltmiete|nettomiete|akt.*miete|mietein|garantierte.*miete$)/i,
  hausgeld: /^(hausgeld|hg|eigentümer.*kost)/i,
  instandhaltung: /^(instandhaltung|ihr|rücklage)/i,
  weg: /^(weg|eigentümer.*gem)/i,
  // Generic financial/document columns
  amount: /^(betrag|summe|wert|value|amount)/i,
  date: /^(datum|date|stichtag|fällig)/i,
  description: /^(bezeichnung|beschreibung|position|text)/i,
  name: /^(name|nachname|firma|company)/i,
  number: /^(nummer|no|vertragsnr|policennr)/i,
};

export interface ColumnMappingEntry {
  original_column: string;
  mapped_to: string;
  column_index: number;
}

/**
 * Apply fuzzy regex-based column mapping to headers.
 * @param headerRow - Lowercased header strings
 * @param rawHeaders - Original header strings (for display)
 * @param patterns - Custom patterns (defaults to STANDARD_COLUMN_PATTERNS)
 * @param dataRows - Optional data rows for heuristic checks (e.g., "garantierte Miete" detection)
 */
export function fuzzyMapColumns(
  headerRow: string[],
  rawHeaders: string[],
  patterns?: Record<string, RegExp>,
  dataRows?: any[][],
): { colMap: Record<string, number>; columnMapping: ColumnMappingEntry[] } {
  const activePatterns = patterns || STANDARD_COLUMN_PATTERNS;
  const colMap: Record<string, number> = {};
  const columnMapping: ColumnMappingEntry[] = [];

  for (let ci = 0; ci < headerRow.length; ci++) {
    const raw = rawHeaders[ci] || '';
    const h = headerRow[ci];
    for (const [field, pattern] of Object.entries(activePatterns)) {
      if (!colMap[field] && pattern.test(h)) {
        colMap[field] = ci;
        columnMapping.push({ original_column: raw, mapped_to: field, column_index: ci });
        break;
      }
    }
    // Heuristic: "garantierte Miete" with EUR amount (not per-sqm rate)
    if (!colMap.currentRent && /garantierte.*miete/i.test(h) && dataRows && dataRows.length > 0) {
      const sampleVal = Number(dataRows[0][ci]);
      if (sampleVal > 10) {
        colMap.currentRent = ci;
        columnMapping.push({ original_column: raw, mapped_to: 'currentRent', column_index: ci });
      }
    }
  }

  return { colMap, columnMapping };
}

// ═══════════════════════════════════════════════════════════════════════════
// TABULAR FILE PARSING — Universal XLSX/CSV/PDF pipeline
// ═══════════════════════════════════════════════════════════════════════════

export type ExtractionMethod = 'direct_xlsx' | 'direct_csv' | 'pdf_csv_preprocessing';

export interface TabularResult {
  /** Lowercased header strings */
  headers: string[];
  /** Original header strings */
  rawHeaders: string[];
  /** Data rows (excluding header) */
  rows: any[][];
  /** Number of data rows */
  rowCount: number;
  /** How the data was extracted */
  extractionMethod: ExtractionMethod;
  /** Raw CSV text (only for pdf_csv_preprocessing) */
  csvText?: string;
}

/**
 * Parse a tabular file (XLSX, CSV, or PDF with tables) into rows.
 * 
 * - XLSX/CSV: Parsed directly with SheetJS (deterministic, no AI)
 * - PDF: Uses Gemini Flash to extract CSV first, then parses with SheetJS
 * 
 * @returns TabularResult with headers + rows, or null if not tabular / parsing failed
 */
export async function parseTabularFile(options: {
  content: Uint8Array;
  contentType: string;
  filename: string;
  apiKey?: string;
  hint?: string;
}): Promise<TabularResult | null> {
  const { content, contentType, filename, apiKey, hint } = options;
  const ext = filename.toLowerCase().split('.').pop() || '';

  const isXlsx = ext === 'xlsx' || ext === 'xls' ||
    contentType.includes('spreadsheet') || contentType.includes('excel');
  const isCsv = ext === 'csv' || contentType === 'text/csv';
  const isPdf = ext === 'pdf' || contentType.includes('pdf');

  // ── XLSX: Direct deterministic parsing ─────────────────────────────
  if (isXlsx) {
    console.log(`[tabular-parser] Direct XLSX parsing: ${filename}`);
    const wb = XLSX.read(content, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (rows.length < 2) return null;

    return {
      headers: rows[0].map((h: any) => String(h).trim().toLowerCase()),
      rawHeaders: rows[0].map((h: any) => String(h).trim()),
      rows: rows.slice(1),
      rowCount: rows.length - 1,
      extractionMethod: 'direct_xlsx',
    };
  }

  // ── CSV: Direct deterministic parsing ──────────────────────────────
  if (isCsv) {
    console.log(`[tabular-parser] Direct CSV parsing: ${filename}`);
    const text = new TextDecoder().decode(content);
    const firstLine = text.split('\n')[0] || '';
    const delimiter = firstLine.includes(';') ? ';' : ',';
    const wb = XLSX.read(text, { type: 'string', FS: delimiter });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (rows.length < 2) return null;

    return {
      headers: rows[0].map((h: any) => String(h).trim().toLowerCase()),
      rawHeaders: rows[0].map((h: any) => String(h).trim()),
      rows: rows.slice(1),
      rowCount: rows.length - 1,
      extractionMethod: 'direct_csv',
    };
  }

  // ── PDF: AI extraction → CSV → SheetJS ─────────────────────────────
  if (isPdf && apiKey) {
    console.log(`[tabular-parser] PDF→CSV pipeline: ${filename}`);
    const base64 = uint8ToBase64(content);
    const csvText = await extractCsvFromPdf(base64, apiKey, hint);
    if (!csvText || csvText.length < 10) return null;

    const wb = XLSX.read(csvText, { type: 'string', FS: ';' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (rows.length < 2) return null;

    return {
      headers: rows[0].map((h: any) => String(h).trim().toLowerCase()),
      rawHeaders: rows[0].map((h: any) => String(h).trim()),
      rows: rows.slice(1),
      rowCount: rows.length - 1,
      extractionMethod: 'pdf_csv_preprocessing',
      csvText,
    };
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// NUMERIC PARSING HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/** Parse a German-formatted number string to a float */
export function parseGermanNumber(val: any): number {
  if (typeof val === 'number') return val;
  const str = String(val || '').replace(/[^\d.,\-]/g, '').replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}
