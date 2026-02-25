/**
 * Parser Manifest — SSOT for the Document Parser Engine
 * 
 * Defines per record-type:
 *  - Which fields to extract (with DB column mapping)
 *  - Which DMS folder to file into
 *  - Which document types are recognized
 * 
 * This manifest is consumed by:
 *  1. sot-document-parser (Edge Function) — generates structured AI prompts
 *  2. useDocumentIntake (Client Hook) — orchestrates the full pipeline
 *  3. Preview UI — labels and types for user confirmation
 * 
 * @see src/types/parser-engine.ts — TypeScript types
 * @see src/config/recordCardManifest.ts — DMS folder definitions
 */

import type { ParserProfile, ParserMode } from '@/types/parser-engine';

// ═══════════════════════════════════════════════════════════════════════════
// PARSER PROFILES — One per parseMode
// ═══════════════════════════════════════════════════════════════════════════

export const PARSER_PROFILES: Record<ParserMode, ParserProfile> = {

  // ── 1. Immobilienakte ──────────────────────────────────────────────────
  immobilie: {
    parseMode: 'immobilie',
    entityType: 'property',
    label: 'Immobilie',
    targetTable: 'units',
    moduleCode: 'MOD_04',
    targetDmsFolder: '01_Grunddaten',
    exampleDocuments: ['Kaufvertrag', 'Grundbuchauszug', 'Teilungserklärung', 'Exposé', 'Mietvertrag', 'Nebenkostenabrechnung'],
    preprocessPdfTables: true,
    fields: [
      { key: 'address', label: 'Adresse', type: 'string', dbColumn: 'address', required: true },
      { key: 'city', label: 'Stadt', type: 'string', dbColumn: 'city', required: true },
      { key: 'postal_code', label: 'PLZ', type: 'string', dbColumn: 'postal_code', required: false },
      { key: 'purchase_price', label: 'Kaufpreis (€)', type: 'currency', dbColumn: 'purchase_price', required: false },
      { key: 'market_value', label: 'Marktwert (€)', type: 'currency', dbColumn: 'market_value', required: false },
      { key: 'construction_year', label: 'Baujahr', type: 'number', dbColumn: 'construction_year', required: false },
      { key: 'living_area_sqm', label: 'Wohnfläche (m²)', type: 'number', dbColumn: 'living_area', required: false },
      { key: 'plot_area_sqm', label: 'Grundstücksfläche (m²)', type: 'number', dbColumn: 'plot_area', required: false },
      { key: 'rooms', label: 'Zimmer', type: 'number', dbColumn: 'rooms', required: false },
      { key: 'monthly_rent', label: 'Monatliche Miete (€)', type: 'currency', dbColumn: 'rent_current', required: false },
      { key: 'property_type', label: 'Objektart', type: 'enum', dbColumn: 'property_type', required: false, enumValues: ['apartment', 'house', 'multi_family', 'commercial', 'land', 'other'] },
    ],
  },

  // ── 2. Finanzierungsakte ───────────────────────────────────────────────
  finanzierung: {
    parseMode: 'finanzierung',
    entityType: null,
    label: 'Finanzierung',
    targetTable: 'finance_requests',
    moduleCode: 'MOD_07',
    targetDmsFolder: '05_Vertrag',
    exampleDocuments: ['Darlehensvertrag', 'Kreditangebot', 'Zinskonditionen', 'Tilgungsplan', 'Finanzierungsbestätigung'],
    preprocessPdfTables: true,
    fields: [
      { key: 'bank_name', label: 'Bank', type: 'string', dbColumn: 'bank_name', required: true },
      { key: 'loan_amount', label: 'Darlehensbetrag (€)', type: 'currency', dbColumn: 'loan_amount', required: true },
      { key: 'interest_rate', label: 'Zinssatz (%)', type: 'number', dbColumn: 'interest_rate', required: false, aiHint: 'Sollzins p.a. in Prozent, z.B. 3.5' },
      { key: 'repayment_rate', label: 'Tilgungssatz (%)', type: 'number', dbColumn: 'repayment_rate', required: false },
      { key: 'monthly_rate', label: 'Monatliche Rate (€)', type: 'currency', dbColumn: 'monthly_rate', required: false },
      { key: 'fixed_rate_years', label: 'Zinsbindung (Jahre)', type: 'number', dbColumn: 'fixed_rate_period_years', required: false },
      { key: 'loan_start', label: 'Darlehensbeginn', type: 'date', dbColumn: 'start_date', required: false },
      { key: 'loan_end', label: 'Darlehensende', type: 'date', dbColumn: 'end_date', required: false },
      { key: 'loan_type', label: 'Darlehenstyp', type: 'enum', dbColumn: 'loan_type', required: false, enumValues: ['annuity', 'fixed', 'variable', 'kfw', 'other'] },
    ],
  },

  // ── 3. Versicherungsakte ──────────────────────────────────────────────
  versicherung: {
    parseMode: 'versicherung',
    entityType: 'insurance',
    label: 'Versicherung',
    targetTable: 'insurance_contracts',
    moduleCode: 'MOD_11',
    targetDmsFolder: '01_Police',
    exampleDocuments: ['Versicherungspolice', 'Versicherungsschein', 'Nachtrag', 'Beitragsrechnung', 'Schadensmeldung'],
    preprocessPdfTables: true,
    fields: [
      { key: 'provider_name', label: 'Versicherer', type: 'string', dbColumn: 'provider_name', required: true },
      { key: 'policy_number', label: 'Policennummer', type: 'string', dbColumn: 'policy_number', required: true },
      { key: 'category', label: 'Kategorie', type: 'enum', dbColumn: 'category', required: true, enumValues: ['hausrat', 'haftpflicht', 'kfz', 'wohngebaeude', 'rechtsschutz', 'unfall', 'leben', 'kranken', 'tier', 'sonstige'] },
      { key: 'premium_amount', label: 'Prämie (€)', type: 'currency', dbColumn: 'premium_amount', required: false },
      { key: 'payment_interval', label: 'Zahlungsintervall', type: 'enum', dbColumn: 'payment_interval', required: false, enumValues: ['monatlich', 'vierteljaehrlich', 'halbjaehrlich', 'jaehrlich'] },
      { key: 'deductible', label: 'Selbstbeteiligung (€)', type: 'currency', dbColumn: 'deductible', required: false },
      { key: 'coverage_amount', label: 'Versicherungssumme (€)', type: 'currency', dbColumn: 'coverage_amount', required: false },
      { key: 'start_date', label: 'Vertragsbeginn', type: 'date', dbColumn: 'start_date', required: false },
      { key: 'end_date', label: 'Vertragsende', type: 'date', dbColumn: 'end_date', required: false },
      { key: 'cancellation_period', label: 'Kündigungsfrist', type: 'string', dbColumn: 'cancellation_period', required: false },
      { key: 'insured_person', label: 'Versicherungsnehmer', type: 'string', dbColumn: 'insured_person_name', required: false },
    ],
  },

  // ── 4. Fahrzeugakte ────────────────────────────────────────────────────
  fahrzeugschein: {
    parseMode: 'fahrzeugschein',
    entityType: 'vehicle',
    label: 'Fahrzeug',
    targetTable: 'cars_vehicles',
    moduleCode: 'MOD_17',
    targetDmsFolder: '01_Zulassung',
    exampleDocuments: ['Fahrzeugschein', 'Zulassungsbescheinigung Teil I', 'Zulassungsbescheinigung Teil II', 'Fahrzeugbrief', 'KFZ-Kaufvertrag'],
    preprocessPdfTables: true,
    fields: [
      { key: 'license_plate', label: 'Kennzeichen', type: 'string', dbColumn: 'license_plate', required: true, aiHint: 'Amtliches Kennzeichen, z.B. B-AB 1234' },
      { key: 'vin', label: 'FIN (Fahrzeug-Identnummer)', type: 'string', dbColumn: 'vin', required: false, aiHint: 'Vehicle Identification Number, 17-stellig' },
      { key: 'brand', label: 'Marke', type: 'string', dbColumn: 'brand', required: true },
      { key: 'model', label: 'Modell', type: 'string', dbColumn: 'model', required: true },
      { key: 'first_registration', label: 'Erstzulassung', type: 'date', dbColumn: 'first_registration', required: false },
      { key: 'hsn', label: 'HSN (Herstellerschlüssel)', type: 'string', dbColumn: 'hsn', required: false, aiHint: 'Feld 2.1 im Fahrzeugschein, 4-stellig' },
      { key: 'tsn', label: 'TSN (Typschlüssel)', type: 'string', dbColumn: 'tsn', required: false, aiHint: 'Feld 2.2 im Fahrzeugschein, 3-stellig' },
      { key: 'fuel_type', label: 'Kraftstoffart', type: 'enum', dbColumn: 'fuel_type', required: false, enumValues: ['benzin', 'diesel', 'elektro', 'hybrid', 'gas', 'sonstige'] },
      { key: 'power_kw', label: 'Leistung (kW)', type: 'number', dbColumn: 'power_kw', required: false },
      { key: 'mileage_km', label: 'Kilometerstand', type: 'number', dbColumn: 'mileage_km', required: false },
      { key: 'owner_name', label: 'Halter', type: 'string', dbColumn: 'owner_name', required: false },
    ],
  },

  // ── 5. PV-Akte ─────────────────────────────────────────────────────────
  pv_anlage: {
    parseMode: 'pv_anlage',
    entityType: 'pv_plant',
    label: 'PV-Anlage',
    targetTable: 'pv_plants',
    moduleCode: 'MOD_19',
    targetDmsFolder: '01_Stammdaten',
    exampleDocuments: ['MaStR-Auszug', 'Inbetriebnahmeprotokoll', 'Einspeisezusage', 'Anlagendatenblatt', 'Wechselrichter-Datenblatt'],
    preprocessPdfTables: true,
    fields: [
      { key: 'name', label: 'Anlagenname', type: 'string', dbColumn: 'name', required: true },
      { key: 'kwp', label: 'Leistung (kWp)', type: 'number', dbColumn: 'capacity_kwp', required: true, aiHint: 'Installierte Nennleistung in Kilowatt-Peak' },
      { key: 'mastr_plant_id', label: 'MaStR-Nr.', type: 'string', dbColumn: 'mastr_plant_id', required: false, aiHint: 'Marktstammdatenregister-Nummer, z.B. SEE123456789' },
      { key: 'commissioning_date', label: 'Inbetriebnahme', type: 'date', dbColumn: 'commissioning_date', required: false },
      { key: 'feed_in_tariff', label: 'Einspeisevergütung (ct/kWh)', type: 'number', dbColumn: 'feed_in_tariff_cents', required: false },
      { key: 'inverter_model', label: 'Wechselrichter', type: 'string', dbColumn: 'inverter_model', required: false },
      { key: 'module_type', label: 'Modultyp', type: 'string', dbColumn: 'module_type', required: false },
      { key: 'module_count', label: 'Modulanzahl', type: 'number', dbColumn: 'module_count', required: false },
      { key: 'grid_operator', label: 'Netzbetreiber', type: 'string', dbColumn: 'grid_operator', required: false },
      { key: 'address', label: 'Standort', type: 'string', dbColumn: 'address', required: false },
    ],
  },

  // ── 6. Vorsorgeakte ────────────────────────────────────────────────────
  vorsorge: {
    parseMode: 'vorsorge',
    entityType: 'vorsorge',
    label: 'Vorsorge',
    targetTable: 'vorsorge_contracts',
    moduleCode: 'MOD_11',
    targetDmsFolder: '01_Vertrag',
    exampleDocuments: ['Standmitteilung', 'Renteninformation', 'Versorgungsvertrag', 'Riester-Bescheinigung', 'bAV-Vertrag'],
    preprocessPdfTables: true,
    fields: [
      { key: 'provider_name', label: 'Anbieter', type: 'string', dbColumn: 'provider_name', required: true },
      { key: 'contract_number', label: 'Vertragsnummer', type: 'string', dbColumn: 'contract_number', required: true },
      { key: 'contract_type', label: 'Vertragstyp', type: 'enum', dbColumn: 'contract_type', required: true, enumValues: ['riester', 'ruerup', 'bav', 'privat', 'kapital_lv', 'fondsgebunden', 'sonstige'] },
      { key: 'contribution_amount', label: 'Beitrag (€)', type: 'currency', dbColumn: 'contribution_amount', required: false },
      { key: 'payment_interval', label: 'Zahlungsintervall', type: 'enum', dbColumn: 'payment_interval', required: false, enumValues: ['monatlich', 'vierteljaehrlich', 'halbjaehrlich', 'jaehrlich'] },
      { key: 'current_value', label: 'Aktueller Vertragswert (€)', type: 'currency', dbColumn: 'current_value', required: false },
      { key: 'value_date', label: 'Stichtag Vertragswert', type: 'date', dbColumn: 'value_date', required: false },
      { key: 'projected_value', label: 'Prognostizierter Endwert (€)', type: 'currency', dbColumn: 'projected_end_value', required: false },
      { key: 'monthly_pension', label: 'Monatliche Rente (€)', type: 'currency', dbColumn: 'monthly_pension_projected', required: false },
      { key: 'start_date', label: 'Vertragsbeginn', type: 'date', dbColumn: 'start_date', required: false },
      { key: 'end_date', label: 'Vertragsende', type: 'date', dbColumn: 'end_date', required: false },
    ],
  },

  // ── 7. Personenakte ────────────────────────────────────────────────────
  person: {
    parseMode: 'person',
    entityType: 'person',
    label: 'Person',
    targetTable: 'household_persons',
    moduleCode: 'MOD_01',
    targetDmsFolder: '01_Personalausweis',
    exampleDocuments: ['Personalausweis', 'Reisepass', 'Geburtsurkunde', 'Gehaltsnachweis', 'Arbeitsvertrag', 'Steuerbescheid'],
    fields: [
      { key: 'first_name', label: 'Vorname', type: 'string', dbColumn: 'first_name', required: true },
      { key: 'last_name', label: 'Nachname', type: 'string', dbColumn: 'last_name', required: true },
      { key: 'birth_date', label: 'Geburtsdatum', type: 'date', dbColumn: 'birth_date', required: false },
      { key: 'email', label: 'E-Mail', type: 'string', dbColumn: 'email', required: false },
      { key: 'phone_mobile', label: 'Telefon mobil', type: 'string', dbColumn: 'phone_mobile', required: false },
      { key: 'address_street', label: 'Straße', type: 'string', dbColumn: 'address_street', required: false },
      { key: 'address_postal_code', label: 'PLZ', type: 'string', dbColumn: 'address_postal_code', required: false },
      { key: 'address_city', label: 'Ort', type: 'string', dbColumn: 'address_city', required: false },
      { key: 'employer_name', label: 'Arbeitgeber', type: 'string', dbColumn: 'employer_name', required: false },
      { key: 'net_income', label: 'Nettoeinkommen (€)', type: 'currency', dbColumn: 'net_income_monthly', required: false },
    ],
  },

  // ── 8. Haustierakte ────────────────────────────────────────────────────
  haustier: {
    parseMode: 'haustier',
    entityType: 'pet',
    label: 'Haustier',
    targetTable: 'pets',
    moduleCode: 'MOD_05',
    targetDmsFolder: '01_Impfpass',
    exampleDocuments: ['Impfpass', 'Tierarztrechnung', 'EU-Heimtierausweis', 'Tierversicherungspolice', 'Chipregistrierung'],
    fields: [
      { key: 'name', label: 'Name', type: 'string', dbColumn: 'name', required: true },
      { key: 'species', label: 'Tierart', type: 'enum', dbColumn: 'species', required: true, enumValues: ['hund', 'katze', 'pferd', 'vogel', 'kleintier', 'sonstige'] },
      { key: 'breed', label: 'Rasse', type: 'string', dbColumn: 'breed', required: false },
      { key: 'chip_number', label: 'Chipnummer', type: 'string', dbColumn: 'chip_number', required: false, aiHint: '15-stelliger Transponder-Code' },
      { key: 'birth_date', label: 'Geburtsdatum', type: 'date', dbColumn: 'birth_date', required: false },
      { key: 'gender', label: 'Geschlecht', type: 'enum', dbColumn: 'gender', required: false, enumValues: ['maennlich', 'weiblich'] },
      { key: 'vet_name', label: 'Tierarzt', type: 'string', dbColumn: 'vet_name', required: false },
      { key: 'weight_kg', label: 'Gewicht (kg)', type: 'number', dbColumn: 'weight_kg', required: false },
    ],
  },

  // ── 9. Kontakte (allgemein) ────────────────────────────────────────────
  kontakt: {
    parseMode: 'kontakt',
    entityType: null,
    label: 'Kontakt',
    targetTable: 'contacts',
    moduleCode: 'MOD_01',
    targetDmsFolder: '08_Sonstiges',
    exampleDocuments: ['Visitenkarte', 'Kontaktliste', 'CRM-Export', 'Adressliste'],
    fields: [
      { key: 'first_name', label: 'Vorname', type: 'string', dbColumn: 'first_name', required: true },
      { key: 'last_name', label: 'Nachname', type: 'string', dbColumn: 'last_name', required: true },
      { key: 'email', label: 'E-Mail', type: 'string', dbColumn: 'email', required: false },
      { key: 'phone', label: 'Telefon', type: 'string', dbColumn: 'phone', required: false },
      { key: 'company', label: 'Firma', type: 'string', dbColumn: 'company', required: false },
      { key: 'role', label: 'Rolle/Position', type: 'string', dbColumn: 'role', required: false },
      { key: 'address', label: 'Adresse', type: 'string', dbColumn: 'address', required: false },
    ],
  },

  // ── 10. Allgemein (Auto-Erkennung) ─────────────────────────────────────
  allgemein: {
    parseMode: 'allgemein',
    entityType: null,
    label: 'Automatische Erkennung',
    targetTable: '',
    moduleCode: '',
    targetDmsFolder: '',
    exampleDocuments: [],
    fields: [],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

/** Get a parser profile by mode */
export function getParserProfile(mode: ParserMode): ParserProfile {
  return PARSER_PROFILES[mode];
}

/** Get all available modes (excluding 'allgemein') */
export function getSpecificModes(): ParserMode[] {
  return Object.keys(PARSER_PROFILES).filter(m => m !== 'allgemein') as ParserMode[];
}

/** Resolve legacy mode to new engine mode */
export function resolveLegacyMode(mode: string): ParserMode {
  const legacyMap: Record<string, ParserMode> = {
    properties: 'immobilie',
    contacts: 'kontakt',
    financing: 'finanzierung',
    general: 'allgemein',
  };
  return legacyMap[mode] || (mode as ParserMode);
}

/**
 * Build a structured AI prompt from a parser profile.
 * Used by the sot-document-parser edge function.
 */
export function buildPromptFromProfile(profile: ParserProfile): string {
  if (profile.parseMode === 'allgemein') {
    return buildAutoDetectPrompt();
  }

  const fieldInstructions = profile.fields.map(f => {
    let line = `  - "${f.key}": ${f.label} (${f.type}${f.required ? ', PFLICHT' : ', optional'})`;
    if (f.enumValues) {
      line += ` — Werte: ${f.enumValues.join(', ')}`;
    }
    if (f.aiHint) {
      line += ` — Hinweis: ${f.aiHint}`;
    }
    return line;
  }).join('\n');

  return `Du bist ein spezialisierter Dokumenten-Parser für den Bereich "${profile.label}".
Analysiere das Dokument und extrahiere EXAKT die folgenden Felder.

FELDER (nur diese Keys verwenden):
${fieldInstructions}

REGELN:
- Alle Zahlen als Number (nicht String)
- Währungsbeträge in Euro (nur Zahl, ohne € oder EUR)
- Flächen in m² (nur Zahl)
- Datumsfelder im Format YYYY-MM-DD
- Leere/nicht gefundene Felder WEGLASSEN (nicht null setzen)
- Bei Unsicherheit: confidence reduzieren und warning hinzufügen

Erkannte Dokumenttypen: ${profile.exampleDocuments.join(', ')}

Antworte NUR mit validem JSON:
{
  "confidence": 0.0-1.0,
  "warnings": [],
  "records": [
    { ${profile.fields.filter(f => f.required).map(f => `"${f.key}": "..."`).join(', ')} }
  ]
}`;
}

function buildAutoDetectPrompt(): string {
  const allModes = getSpecificModes();
  const modeList = allModes.map(m => {
    const p = PARSER_PROFILES[m];
    return `  - "${m}": ${p.label} (${p.exampleDocuments.slice(0, 3).join(', ')})`;
  }).join('\n');

  return `Du bist ein intelligenter Dokumenten-Klassifizierer und -Parser.

SCHRITT 1: Erkenne den Dokumenttyp und ordne ihn einem dieser Modi zu:
${modeList}

SCHRITT 2: Extrahiere die relevanten Daten gemäß dem erkannten Modus.

Antworte NUR mit validem JSON:
{
  "confidence": 0.0-1.0,
  "warnings": [],
  "detectedMode": "<modus>",
  "records": [{ ... }]
}`;
}
