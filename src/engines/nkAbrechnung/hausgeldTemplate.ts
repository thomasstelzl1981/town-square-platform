/**
 * Hausgeld-Template — Standard-Positionen einer Hausgeldeinzelabrechnung
 * 
 * Basiert auf BetrKV §2 Nr. 1–17 plus nicht umlagefähige Positionen.
 * Wird als Default-Formular verwendet, wenn keine DB-Daten vorliegen.
 */

import type { CostItemEditable } from '@/hooks/useNKAbrechnung';

export interface HausgeldTemplateItem {
  categoryCode: string;
  labelDisplay: string;
  keyType: string;
  isApportionable: boolean;
  sortOrder: number;
}

/**
 * Vollständige Liste aller Standard-Positionen einer WEG-Hausgeldeinzelabrechnung.
 * Grundsteuer ist hier NICHT enthalten — sie wird separat als Direktzahlung behandelt.
 */
export const HAUSGELD_TEMPLATE: HausgeldTemplateItem[] = [
  // Umlagefähige Kosten (BetrKV §2)
  { categoryCode: 'wasser',                  labelDisplay: 'Wasserversorgung',         keyType: 'persons',    isApportionable: true,  sortOrder: 1 },
  { categoryCode: 'abwasser',                labelDisplay: 'Entwässerung',             keyType: 'persons',    isApportionable: true,  sortOrder: 2 },
  { categoryCode: 'heizung',                 labelDisplay: 'Heizkosten',               keyType: 'consumption',isApportionable: true,  sortOrder: 3 },
  { categoryCode: 'warmwasser',              labelDisplay: 'Warmwasser',               keyType: 'consumption',isApportionable: true,  sortOrder: 4 },
  { categoryCode: 'muell',                   labelDisplay: 'Müllbeseitigung',          keyType: 'persons',    isApportionable: true,  sortOrder: 5 },
  { categoryCode: 'strassenreinigung',       labelDisplay: 'Straßenreinigung',         keyType: 'area_sqm',   isApportionable: true,  sortOrder: 6 },
  { categoryCode: 'gebaeudereinigung',       labelDisplay: 'Gebäudereinigung',         keyType: 'area_sqm',   isApportionable: true,  sortOrder: 7 },
  { categoryCode: 'sachversicherung',        labelDisplay: 'Gebäudeversicherung',      keyType: 'mea',        isApportionable: true,  sortOrder: 8 },
  { categoryCode: 'schornsteinfeger',        labelDisplay: 'Schornsteinfeger',         keyType: 'unit_count', isApportionable: true,  sortOrder: 9 },
  { categoryCode: 'beleuchtung',             labelDisplay: 'Allgemeinstrom',           keyType: 'mea',        isApportionable: true,  sortOrder: 10 },
  { categoryCode: 'gartenpflege',            labelDisplay: 'Gartenpflege',             keyType: 'area_sqm',   isApportionable: true,  sortOrder: 11 },
  { categoryCode: 'hausmeister',             labelDisplay: 'Hausmeister',              keyType: 'mea',        isApportionable: true,  sortOrder: 12 },
  { categoryCode: 'aufzug',                  labelDisplay: 'Aufzug',                   keyType: 'mea',        isApportionable: true,  sortOrder: 13 },
  { categoryCode: 'antenne_kabel',           labelDisplay: 'Antenne / Kabel',          keyType: 'unit_count', isApportionable: true,  sortOrder: 14 },
  { categoryCode: 'sonstige_betriebskosten', labelDisplay: 'Sonstige Betriebskosten',  keyType: 'mea',        isApportionable: true,  sortOrder: 15 },

  // Nicht umlagefähige Kosten
  { categoryCode: 'verwaltung',              labelDisplay: 'Verwaltungskosten',        keyType: 'mea',        isApportionable: false, sortOrder: 16 },
  { categoryCode: 'ruecklage',               labelDisplay: 'Instandhaltungsrücklage',  keyType: 'mea',        isApportionable: false, sortOrder: 17 },
];

/**
 * Merge DB-Daten mit Template: DB-Werte überschreiben Defaults, fehlende Kategorien
 * werden mit 0-Werten eingefügt.
 */
export function mergeWithTemplate(dbItems: CostItemEditable[]): CostItemEditable[] {
  const dbMap = new Map(dbItems.map(item => [item.categoryCode, item]));

  const merged: CostItemEditable[] = HAUSGELD_TEMPLATE.map(tmpl => {
    const existing = dbMap.get(tmpl.categoryCode);
    if (existing) {
      return existing;
    }
    // Template-Position ohne DB-Daten → leere editierbare Zeile
    return {
      id: `tmpl_${tmpl.categoryCode}`,
      categoryCode: tmpl.categoryCode,
      labelDisplay: tmpl.labelDisplay,
      amountTotalHouse: 0,
      amountUnit: 0,
      keyType: tmpl.keyType,
      isApportionable: tmpl.isApportionable,
      sortOrder: tmpl.sortOrder,
    };
  });

  // DB-Positionen, die NICHT im Template sind, ans Ende anfügen
  for (const dbItem of dbItems) {
    if (dbItem.categoryCode === 'grundsteuer') continue; // separat behandelt
    if (!HAUSGELD_TEMPLATE.some(t => t.categoryCode === dbItem.categoryCode)) {
      merged.push(dbItem);
    }
  }

  return merged.sort((a, b) => a.sortOrder - b.sortOrder);
}
