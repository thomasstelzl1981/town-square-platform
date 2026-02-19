/**
 * Demo Property Accounting Data — SSOT für AfA-Stammdaten
 * 
 * Zentrale Quelle für alle Demo-Immobilien-AfA-Werte.
 * Abgeleitet aus dem Musterkunden Max Mustermann.
 * IDs konsistent mit DB-Seeds in property_accounting.
 * 
 * @demo-data
 */

import type { VVAfaStammdaten } from '@/engines/vvSteuer/spec';

// ─── Property IDs (konsistent mit DB-Seeds) ────────────────
const PROP_BER_01 = 'd0000000-0000-4000-a000-000000000001';
const PROP_MUC_01 = 'd0000000-0000-4000-a000-000000000002';
const PROP_HH_01  = 'd0000000-0000-4000-a000-000000000003';

export interface DemoPropertyAccounting {
  propertyId: string;
  code: string;
  /** Kaufpreis lt. Kaufvertrag */
  purchasePrice: number;
  /** AfA-Stammdaten (komplett) */
  afa: VVAfaStammdaten;
}

/**
 * Alle Demo-Properties mit vollständigen AfA-Werten.
 * 
 * Berechnung:
 * - ENK-Anteil auf Gebäude = ak_ancillary * (ak_building / (ak_building + ak_ground))
 * - AfA-Basis = ak_building + ENK-Anteil
 * - AfA p.a. = AfA-Basis × afa_rate_percent
 * - Buchwert = AfA-Basis − kumulierte AfA
 */
export const DEMO_PROPERTY_ACCOUNTING: DemoPropertyAccounting[] = [
  {
    propertyId: PROP_BER_01,
    code: 'BER-01',
    purchasePrice: 280000,
    afa: {
      buildingSharePercent: 70,
      landSharePercent: 30,
      afaRatePercent: 2,
      afaStartDate: '2017-06-01',
      afaMethod: 'linear',
      modernizationCostsEur: 0,
      modernizationYear: null,
      afaModel: '7_4_2b',
      akGround: 84000,
      akBuilding: 196000,
      akAncillary: 30800,
      sonderAfaAnnual: 0,
      denkmalAfaAnnual: 0,
      bookValueEur: 182749,
      cumulativeAfa: 34811,
    },
  },
  {
    propertyId: PROP_MUC_01,
    code: 'MUC-01',
    purchasePrice: 420000,
    afa: {
      buildingSharePercent: 75,
      landSharePercent: 25,
      afaRatePercent: 2,
      afaStartDate: '2020-06-01',
      afaMethod: 'linear',
      modernizationCostsEur: 0,
      modernizationYear: null,
      afaModel: '7_4_2b',
      akGround: 105000,
      akBuilding: 315000,
      akAncillary: 46200,
      sonderAfaAnnual: 0,
      denkmalAfaAnnual: 0,
      bookValueEur: 314006,
      cumulativeAfa: 35644,
    },
  },
  {
    propertyId: PROP_HH_01,
    code: 'HH-01',
    purchasePrice: 175000,
    afa: {
      buildingSharePercent: 65,
      landSharePercent: 35,
      afaRatePercent: 2,
      afaStartDate: '2019-03-01',
      afaMethod: 'linear',
      modernizationCostsEur: 0,
      modernizationYear: null,
      afaModel: '7_4_2b',
      akGround: 61250,
      akBuilding: 113750,
      akAncillary: 19250,
      sonderAfaAnnual: 0,
      denkmalAfaAnnual: 0,
      bookValueEur: 109326,
      cumulativeAfa: 16992,
    },
  },
];

/**
 * Lookup: Demo-AfA-Stammdaten für eine Property-ID.
 * Gibt undefined zurück, wenn die ID nicht im Demo-Satz enthalten ist.
 */
export function getDemoPropertyAccounting(propertyId: string): DemoPropertyAccounting | undefined {
  return DEMO_PROPERTY_ACCOUNTING.find(p => p.propertyId === propertyId);
}

/** Alle Demo-Property-IDs */
export const DEMO_PROPERTY_IDS = [PROP_BER_01, PROP_MUC_01, PROP_HH_01] as const;
