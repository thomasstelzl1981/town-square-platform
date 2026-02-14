/**
 * BWA-Kontenplan (SKR04 Starter) — SSOT für MOD-04 Verwaltung
 * 
 * 7 BWA-Kategorien mit zugeordneten Konten.
 * Editierbar im UI, aber diese Datei ist die Default-Konfiguration.
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
}

export const BWA_KATEGORIEN: BwaKategorie[] = [
  {
    id: 'bwa-10',
    code: 'BWA-10',
    name: 'Mieterträge',
    beschreibung: 'Kaltmieten, Stellplätze, sonstige Mieterträge',
    konten: [
      { nummer: '4400', name: 'Mieterträge Wohnraum' },
      { nummer: '4410', name: 'Mieterträge Stellplätze/Garagen' },
      { nummer: '4490', name: 'Sonstige Erträge (Mahngebühren …)' },
      { nummer: '4760', name: 'Versicherungsentschädigungen/Erstattungen' },
    ],
  },
  {
    id: 'bwa-20',
    code: 'BWA-20',
    name: 'Nebenkosten/Umlagen',
    beschreibung: 'Vorauszahlungen/umlagefähige Umlagen',
    konten: [
      { nummer: '4420', name: 'Nebenkostenvorauszahlungen (Umlagen)' },
    ],
  },
  {
    id: 'bwa-30',
    code: 'BWA-30',
    name: 'Betriebskosten (umlagefähig)',
    beschreibung: 'Grundsteuer, Wasser, Müll, Hausmeister, Versicherungen',
    konten: [
      { nummer: '6000', name: 'Grundsteuer' },
      { nummer: '6020', name: 'Wasser/Abwasser' },
      { nummer: '6030', name: 'Müll/Entsorgung' },
      { nummer: '6040', name: 'Straßenreinigung/Winterdienst' },
      { nummer: '6050', name: 'Hausmeister' },
      { nummer: '6060', name: 'Gartenpflege' },
      { nummer: '6070', name: 'Allgemeinstrom' },
      { nummer: '6080', name: 'Schornsteinfeger' },
      { nummer: '6090', name: 'Aufzug (Wartung/Prüfung)' },
      { nummer: '6100', name: 'Gebäudeversicherung' },
      { nummer: '6110', name: 'Haftpflichtversicherung' },
    ],
  },
  {
    id: 'bwa-40',
    code: 'BWA-40',
    name: 'Instandhaltung',
    beschreibung: 'Reparaturen/Wartung/Modernisierung — Abgrenzung',
    konten: [
      { nummer: '6200', name: 'Instandhaltung/Reparaturen (laufend)' },
      { nummer: '6210', name: 'Wartung Heizung' },
      { nummer: '6220', name: 'Modernisierung (prüfen Aktivierung)' },
    ],
  },
  {
    id: 'bwa-50',
    code: 'BWA-50',
    name: 'Verwaltung',
    beschreibung: 'Hausverwaltung, Steuerberater, Bankgebühren, IT',
    konten: [
      { nummer: '6300', name: 'Hausverwaltung/WEG-Verwalter' },
      { nummer: '6310', name: 'Steuerberatung/Buchhaltung' },
      { nummer: '6320', name: 'Rechtsberatung/Gerichtskosten' },
      { nummer: '6330', name: 'Bankgebühren' },
      { nummer: '6340', name: 'Porto/Telefon/IT/Software' },
    ],
  },
  {
    id: 'bwa-60',
    code: 'BWA-60',
    name: 'Finanzierung',
    beschreibung: 'Zinsen, Finanzierungskosten',
    konten: [
      { nummer: '7300', name: 'Zinsaufwand Darlehen' },
      { nummer: '7310', name: 'Bereitstellungszinsen/sonst. Finanzierungskosten' },
    ],
  },
  {
    id: 'bwa-70',
    code: 'BWA-70',
    name: 'Abschreibungen',
    beschreibung: 'AfA Gebäude/BGA',
    konten: [
      { nummer: '4830', name: 'Abschreibungen Gebäude (AfA)' },
      { nummer: '4850', name: 'Abschreibungen BGA/GWG' },
    ],
  },
];
