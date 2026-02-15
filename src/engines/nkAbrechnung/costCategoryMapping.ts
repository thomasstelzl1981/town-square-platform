/**
 * Kostenarten-Mapping: Keywords/Regex → NKCostCategory
 * 
 * Deterministische Zuordnung von Rohtexten aus WEG-Abrechnungen
 * zu normierten Kostenkategorien (BetrKV).
 */

import { NKCostCategory, APPORTIONABLE_CATEGORIES } from './spec';

interface MappingRule {
  category: NKCostCategory;
  keywords: RegExp[];
  label: string;
}

const MAPPING_RULES: MappingRule[] = [
  {
    category: NKCostCategory.GRUNDSTEUER,
    keywords: [/grundsteuer/i, /grund\s*steuer/i, /property\s*tax/i],
    label: 'Grundsteuer',
  },
  {
    category: NKCostCategory.WASSER,
    keywords: [/wasserversorgung/i, /frischwasser/i, /kaltwasser/i, /^wasser(?!.*warm)/i, /trinkwasser/i],
    label: 'Wasserversorgung',
  },
  {
    category: NKCostCategory.ABWASSER,
    keywords: [/abwasser/i, /entw[äa]sserung/i, /kanal/i, /schmutzwasser/i],
    label: 'Entwässerung',
  },
  {
    category: NKCostCategory.HEIZUNG,
    keywords: [/heizung/i, /heizkosten/i, /fernw[äa]rme/i, /heiz[öo]l/i, /gas.*heiz/i, /brennstoff/i],
    label: 'Heizkosten',
  },
  {
    category: NKCostCategory.WARMWASSER,
    keywords: [/warmwasser/i, /warm\s*wasser/i],
    label: 'Warmwasserversorgung',
  },
  {
    category: NKCostCategory.AUFZUG,
    keywords: [/aufzug/i, /fahrstuhl/i, /lift/i, /elevator/i],
    label: 'Aufzug',
  },
  {
    category: NKCostCategory.STRASSENREINIGUNG,
    keywords: [/stra[ßs]enreinigung/i, /winterdienst/i, /streudienst/i, /r[äa]umdienst/i],
    label: 'Straßenreinigung / Winterdienst',
  },
  {
    category: NKCostCategory.MUELL,
    keywords: [/m[üu]ll/i, /abfall/i, /entsorgung/i, /wertstoff/i, /biotonne/i],
    label: 'Müllbeseitigung',
  },
  {
    category: NKCostCategory.GEBAEUDEREINIGUNG,
    keywords: [/geb[äa]udereinigung/i, /hausreinigung/i, /treppenhausreinigung/i, /reinigung.*gemein/i],
    label: 'Gebäudereinigung',
  },
  {
    category: NKCostCategory.GARTENPFLEGE,
    keywords: [/gartenpflege/i, /garten/i, /gr[üu]npflege/i, /gr[üu]nfl[äa]che/i, /landschaft/i],
    label: 'Gartenpflege',
  },
  {
    category: NKCostCategory.BELEUCHTUNG,
    keywords: [/beleuchtung/i, /allgemeinstrom/i, /strom.*allgemein/i, /strom.*gemein/i, /hausstrom/i],
    label: 'Beleuchtung / Allgemeinstrom',
  },
  {
    category: NKCostCategory.SCHORNSTEINFEGER,
    keywords: [/schornsteinfeger/i, /schornstein/i, /kaminkehrer/i, /abgasmessung/i, /immissions/i],
    label: 'Schornsteinfeger',
  },
  {
    category: NKCostCategory.SACHVERSICHERUNG,
    keywords: [/versicherung/i, /geb[äa]udeversicherung/i, /feuerversicherung/i, /sachversicherung/i, /haftpflicht.*geb/i, /elementar/i, /wohngeb.*versich/i],
    label: 'Sach- und Haftpflichtversicherung',
  },
  {
    category: NKCostCategory.HAUSMEISTER,
    keywords: [/hausmeister/i, /hauswart/i, /facility/i],
    label: 'Hausmeister',
  },
  {
    category: NKCostCategory.ANTENNE_KABEL,
    keywords: [/antenne/i, /kabel/i, /sat.*anlage/i, /gemeinschaftsantenne/i],
    label: 'Gemeinschaftsantenne / Kabel',
  },
  {
    category: NKCostCategory.WASCHEINRICHTUNG,
    keywords: [/wasch/i, /w[äa]scherei/i],
    label: 'Wascheinrichtung',
  },
  {
    category: NKCostCategory.NIEDERSCHLAGSWASSER,
    keywords: [/niederschlag/i, /regenwasser/i, /oberfl[äa]chenwasser/i],
    label: 'Niederschlagswasser',
  },
  {
    category: NKCostCategory.SONSTIGE_BETRIEBSKOSTEN,
    keywords: [/sonstige.*betrieb/i, /sonstige.*kosten/i],
    label: 'Sonstige Betriebskosten',
  },
  // Nicht umlagefaehig
  {
    category: NKCostCategory.VERWALTUNG,
    keywords: [/verwaltung/i, /verwalter/i, /weg.*verwalt/i, /hausverwaltung/i],
    label: 'Verwaltungskosten',
  },
  {
    category: NKCostCategory.RUECKLAGE,
    keywords: [/r[üu]cklage/i, /instandhaltungsr[üu]cklage/i, /erhaltungsr[üu]cklage/i],
    label: 'Instandhaltungsrücklage',
  },
  {
    category: NKCostCategory.INSTANDHALTUNG,
    keywords: [/instandhaltung/i, /instandsetzung/i, /reparatur/i, /sanierung/i],
    label: 'Instandhaltung',
  },
];

export interface MappingResult {
  category: NKCostCategory;
  label: string;
  confidence: number;
  source: 'rule' | 'ai' | 'manual';
  isApportionable: boolean;
}

/**
 * Mappt einen Rohtext (label_raw aus WEG-Abrechnung) auf eine NKCostCategory.
 * Gibt die beste Uebereinstimmung zurueck oder fallback auf NICHT_UMLAGEFAEHIG.
 */
export function mapLabelToCategory(labelRaw: string): MappingResult {
  const normalizedLabel = labelRaw.trim();

  for (const rule of MAPPING_RULES) {
    for (const pattern of rule.keywords) {
      if (pattern.test(normalizedLabel)) {
        return {
          category: rule.category,
          label: rule.label,
          confidence: 95,
          source: 'rule',
          isApportionable: APPORTIONABLE_CATEGORIES.has(rule.category),
        };
      }
    }
  }

  // Kein Match → nicht umlagefaehig als Fallback, niedrige Confidence
  return {
    category: NKCostCategory.NICHT_UMLAGEFAEHIG,
    label: normalizedLabel,
    confidence: 20,
    source: 'rule',
    isApportionable: false,
  };
}

/**
 * Gibt die vollstaendige Mapping-Tabelle zurueck (fuer UI-Anzeige / Debug).
 */
export function getMappingRules(): MappingRule[] {
  return MAPPING_RULES;
}
