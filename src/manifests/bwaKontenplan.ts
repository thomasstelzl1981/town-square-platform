/**
 * DATEV-Kontenplan (SKR04) — Kurzfristige Erfolgsrechnung für Immobilien-V+V
 *
 * Struktur folgt exakt dem DATEV-Standard:
 *   LEISTUNG → KOSTENARTEN → BETRIEBSERGEBNIS → NEUTRALES ERGEBNIS → VORL. ERGEBNIS
 */

export interface BwaKonto {
  nummer: string;
  name: string;
}

export interface BwaKategorie {
  id: string;
  code: string;
  name: string;
  beschreibung: string;
  konten: BwaKonto[];
  /** Section this category belongs to */
  section: 'leistung' | 'kostenarten' | 'neutral_aufwand' | 'neutral_ertrag';
  /** Is this a subtotal row rather than a real account category */
  isSubtotal?: boolean;
}

// ── LEISTUNG ────────────────────────────────────────────────────────────────
export const LEISTUNG_KATEGORIEN: BwaKategorie[] = [
  {
    id: 'datev-umsatz',
    code: 'UMSATZ',
    name: 'Umsatzerlöse',
    beschreibung: 'Steuerfreie Umsätze Vermietung & Verpachtung',
    section: 'leistung',
    konten: [
      { nummer: '4105', name: 'Steuerfreie Umsätze V+V § 4 Nr. 12 UStG' },
    ],
  },
  {
    id: 'datev-nk-umlagen',
    code: 'NK-UMLAGEN',
    name: 'NK-Vorauszahlungen / Umlagen',
    beschreibung: 'Vorauszahlungen auf umlagefähige Nebenkosten',
    section: 'leistung',
    konten: [
      { nummer: '4420', name: 'NK-Vorauszahlungen (Umlagen)' },
    ],
  },
];

// ── KOSTENARTEN ─────────────────────────────────────────────────────────────
export const KOSTENARTEN_KATEGORIEN: BwaKategorie[] = [
  {
    id: 'datev-personal',
    code: 'PERSONAL',
    name: 'Personalkosten',
    beschreibung: 'Löhne, Gehälter, Sozialabgaben (bei V+V i.d.R. 0)',
    section: 'kostenarten',
    konten: [],
  },
  {
    id: 'datev-raum',
    code: 'RAUM',
    name: 'Raumkosten / Grundstücksaufwand',
    beschreibung: 'Gas, Strom, Wasser, Grundstücksaufwendungen',
    section: 'kostenarten',
    konten: [
      { nummer: '6325', name: 'Gas, Strom, Wasser' },
      { nummer: '6350', name: 'Grundstücksaufwendungen, betrieblich' },
    ],
  },
  {
    id: 'datev-steuern',
    code: 'BETR-STEUERN',
    name: 'Betriebliche Steuern',
    beschreibung: 'Grundsteuer',
    section: 'kostenarten',
    konten: [
      { nummer: '7680', name: 'Grundsteuer' },
    ],
  },
  {
    id: 'datev-versicherung',
    code: 'VERSICHERUNG',
    name: 'Versicherungen / Beiträge',
    beschreibung: 'Gebäudeversicherung, Haftpflicht, sonstige Abgaben',
    section: 'kostenarten',
    konten: [
      { nummer: '6400', name: 'Versicherungen (allgemein)' },
      { nummer: '6405', name: 'Versicherung für Gebäude' },
      { nummer: '6420', name: 'Beiträge' },
      { nummer: '6430', name: 'Sonstige Abgaben' },
    ],
  },
  {
    id: 'datev-afa',
    code: 'AFA',
    name: 'Abschreibungen',
    beschreibung: 'AfA Gebäude, Sachanlagen, GWG',
    section: 'kostenarten',
    konten: [
      { nummer: '6220', name: 'Abschreibungen auf Sachanlagen' },
      { nummer: '6221', name: 'Abschreibungen auf Gebäude' },
      { nummer: '6260', name: 'Sofortabschreibung GWG' },
    ],
  },
  {
    id: 'datev-reparatur',
    code: 'REPARATUR',
    name: 'Reparatur / Instandhaltung',
    beschreibung: 'Laufende Reparaturen und Instandhaltung',
    section: 'kostenarten',
    konten: [
      { nummer: '6490', name: 'Sonstige Reparaturen u. Instandhaltungen' },
    ],
  },
  {
    id: 'datev-sonstige',
    code: 'SONST-KOSTEN',
    name: 'Sonstige Kosten',
    beschreibung: 'Hausverwaltung, Beratung, Bankgebühren, Entsorgung',
    section: 'kostenarten',
    konten: [
      { nummer: '6300', name: 'Hausverwaltung / WEG-Verwalter' },
      { nummer: '6825', name: 'Rechts- und Beratungskosten' },
      { nummer: '6855', name: 'Nebenkosten des Geldverkehrs' },
      { nummer: '6859', name: 'Aufwand Abfallbeseitigung' },
    ],
  },
];

// ── NEUTRALES ERGEBNIS ──────────────────────────────────────────────────────
export const NEUTRAL_AUFWAND_KATEGORIEN: BwaKategorie[] = [
  {
    id: 'datev-zinsen',
    code: 'ZINSEN',
    name: 'Zinsaufwand',
    beschreibung: 'Zinsaufwendungen pro Darlehen einzeln',
    section: 'neutral_aufwand',
    konten: [
      // Dynamically filled per loan: 7310, 7321, 7322, ...
      { nummer: '7310', name: 'Bereitstellungszinsen / sonst. Finanzierungskosten' },
    ],
  },
];

export const NEUTRAL_ERTRAG_KATEGORIEN: BwaKategorie[] = [
  {
    id: 'datev-neutral-ertrag',
    code: 'NEUTRAL-ERTRAG',
    name: 'Sonstiger neutraler Ertrag',
    beschreibung: 'Versicherungsentschädigungen, Buchgewinne',
    section: 'neutral_ertrag',
    konten: [
      { nummer: '4849', name: 'Erlöse Sachanlageverkauf (Buchgewinn)' },
      { nummer: '4970', name: 'Versicherungsentschädigungen' },
      { nummer: '4975', name: 'Investitionszuschüsse' },
    ],
  },
];

/** All categories combined for reference */
export const BWA_KATEGORIEN: BwaKategorie[] = [
  ...LEISTUNG_KATEGORIEN,
  ...KOSTENARTEN_KATEGORIEN,
  ...NEUTRAL_AUFWAND_KATEGORIEN,
  ...NEUTRAL_ERTRAG_KATEGORIEN,
];
