/**
 * DATEV-BWA & SuSa Types — SSOT
 * Engine: ENG-BWA (Erweiterung)
 */

export interface DatevKontoValue {
  /** SKR04 Kontonummer */
  kontoNr: string;
  /** Kontobezeichnung */
  name: string;
  /** Betrag im Zeitraum (immer positiv, Vorzeichen ergibt sich aus Soll/Haben) */
  betrag: number;
  /** Datenquelle zur Nachvollziehbarkeit */
  quelle: 'leases' | 'nk_cost_items' | 'vv_annual_data' | 'property_financing' | 'engine_calc' | 'manual';
}

export interface DatevBWAKategorie {
  code: string;
  name: string;
  konten: DatevKontoValue[];
  summe: number;
}

export interface DatevBWAResult {
  /** Vermietereinheit Name */
  veName: string;
  /** Zeitraum */
  zeitraumVon: string;
  zeitraumBis: string;
  /** BWA-Kategorien */
  kategorien: DatevBWAKategorie[];
  /** Aggregierte Werte */
  gesamtleistung: number;
  gesamtaufwand: number;
  betriebsergebnis: number;
}

export interface SuSaEntry {
  kontoNr: string;
  name: string;
  /** Eröffnungsbilanz */
  eb: number;
  /** Soll-Buchungen */
  soll: number;
  /** Haben-Buchungen */
  haben: number;
  /** S oder H */
  saldoSeite: 'S' | 'H';
  saldo: number;
}

export interface SuSaResult {
  veName: string;
  zeitraumVon: string;
  zeitraumBis: string;
  eintraege: SuSaEntry[];
  summenSoll: number;
  summenHaben: number;
}

/** Eingabedaten fuer die DATEV-BWA Berechnung */
export interface DatevBWAInput {
  /** Kaltmieten p.a. aus leases (Wohnraum) */
  mietertragWohnraum: number;
  /** Kaltmieten p.a. aus leases (Stellplaetze) */
  mietertragStellplaetze: number;
  /** NK-Vorauszahlungen p.a. */
  nkVorauszahlungen: number;
  /** Sonstige Ertraege */
  sonstigeErtraege: number;
  /** Versicherungsentschaedigungen */
  versicherungserstattungen: number;
  /** NK-Kostenpositionen nach Kategorie-Code */
  nkKosten: Record<string, number>;
  /** Instandhaltung (manuell aus vv_annual_data) */
  instandhaltung: number;
  /** Verwaltungskosten */
  verwaltung: number;
  /** Steuerberatung */
  steuerberatung: number;
  /** Bankgebuehren */
  bankgebuehren: number;
  /** Rechtsberatung */
  rechtsberatung: number;
  /** Sonstige Verwaltungskosten */
  sonstigeVerwaltung: number;
  /** Zinsaufwand Darlehen */
  zinsaufwand: number;
  /** Sonstige Finanzierungskosten */
  sonstigeFinanzierung: number;
  /** AfA Gebaeude */
  afaGebaeude: number;
  /** AfA BGA/GWG */
  afaBga: number;
}
