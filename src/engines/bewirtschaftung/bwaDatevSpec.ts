/**
 * DATEV-BWA & SuSa Types — SSOT
 * Engine: ENG-BWA — Kurzfristige Erfolgsrechnung (SKR04, Immobilien V+V)
 */

// ── Shared ──────────────────────────────────────────────────────────────────

export interface DatevKontoValue {
  /** SKR04 Kontonummer */
  kontoNr: string;
  /** Kontobezeichnung */
  name: string;
  /** Betrag im Zeitraum (immer positiv, Vorzeichen ergibt sich aus Soll/Haben) */
  betrag: number;
  /** Datenquelle zur Nachvollziehbarkeit */
  quelle: 'leases' | 'nk_cost_items' | 'vv_annual_data' | 'property_financing' | 'engine_calc' | 'manual' | 'balance';
}

// ── BWA ─────────────────────────────────────────────────────────────────────

export interface DatevBWAKategorie {
  code: string;
  name: string;
  konten: DatevKontoValue[];
  summe: number;
}

export interface DatevBWAResult {
  veName: string;
  zeitraumVon: string;
  zeitraumBis: string;

  // LEISTUNG
  umsatzerloese: DatevBWAKategorie;
  nkUmlagen: DatevBWAKategorie;
  gesamtleistung: number;
  rohertrag: number;
  sonstigeBetrErloese: number;
  betriebsRohertrag: number;

  // KOSTENARTEN
  personalkosten: DatevBWAKategorie;
  raumkosten: DatevBWAKategorie;
  betrieblicheSteuern: DatevBWAKategorie;
  versicherungen: DatevBWAKategorie;
  abschreibungen: DatevBWAKategorie;
  reparatur: DatevBWAKategorie;
  sonstigeKosten: DatevBWAKategorie;
  gesamtkosten: number;

  // ERGEBNIS
  betriebsergebnis: number;

  // NEUTRALES ERGEBNIS
  zinsaufwand: DatevBWAKategorie;
  sonstigerNeutralerAufwand: number;
  neutralerAufwand: number;
  neutralerErtrag: DatevBWAKategorie;
  neutralesErgebnis: number;

  // VORL. ERGEBNIS
  ergebnisVorSteuern: number;
  vorlaeufligesErgebnis: number;
}

// ── Input ───────────────────────────────────────────────────────────────────

export interface DarlehenInput {
  id: string;
  bankName: string;
  loanNumber: string;
  zinsaufwand: number;
}

export interface DatevBWAInput {
  /** Kaltmieten p.a. (alle Einheiten) */
  mietertragGesamt: number;
  /** NK-Vorauszahlungen p.a. */
  nkVorauszahlungen: number;
  /** Sonstige betriebliche Ertraege (so. Mietertraege, Mahngebühren etc.) */
  sonstigeBetrErloese: number;
  /** Versicherungsentschaedigungen */
  versicherungserstattungen: number;

  // KOSTENARTEN (einzeln, korrekt zugeordnet)
  /** Gas, Strom, Wasser (6325) */
  gasStromWasser: number;
  /** Grundstuecksaufwendungen (6350): Gartenpflege, Strassenreinigung, Winterdienst */
  grundstuecksaufwand: number;
  /** Grundsteuer (7680) */
  grundsteuer: number;
  /** Versicherung allgemein / Haftpflicht (6400) */
  versicherungAllgemein: number;
  /** Gebaeudeversicherung (6405) */
  gebaeudeversicherung: number;
  /** Beitraege (6420) */
  beitraege: number;
  /** Sonstige Abgaben / Muell (6430) */
  sonstigeAbgaben: number;
  /** Abschreibung Sachanlagen (6220) */
  afaSachanlagen: number;
  /** Abschreibung Gebaeude (6221) */
  afaGebaeude: number;
  /** GWG Sofortabschreibung (6260) */
  afaGwg: number;
  /** Reparatur/Instandhaltung (6490) */
  instandhaltung: number;
  /** Hausverwaltung (6300) */
  verwaltung: number;
  /** Rechts-/Beratungskosten (6825) */
  rechtsberatung: number;
  /** Bankgebuehren (6855) */
  bankgebuehren: number;
  /** Abfallbeseitigung (6859) */
  abfallbeseitigung: number;

  // ZINSEN (pro Darlehen)
  darlehen: DarlehenInput[];
  /** Sonst. Finanzierungskosten (Bereitstellungszinsen etc.) */
  sonstigeFinanzierung: number;
}

// ── SuSa ────────────────────────────────────────────────────────────────────

export interface SuSaEntry {
  kontoNr: string;
  name: string;
  klasse: number;
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
  summenProKlasse: Record<number, { soll: number; haben: number }>;
}

/** Balance-sheet input for full SuSa (Kontenklassen 0, 1, 3) */
export interface SuSaBilanzInput {
  /** Anschaffungskosten Grundstuecke (Klasse 0) */
  akGrundstuecke: number;
  /** Anschaffungskosten Gebaeude (Klasse 0) */
  akGebaeude: number;
  /** Kumulierte AfA Gebaeude (Klasse 0, Korrekturposten) */
  kumulierteAfaGebaeude: number;
  /** Bankguthaben (Klasse 1) */
  bankguthaben: number;
  /** Mietforderungen offen (Klasse 1) */
  mietforderungen: number;
  /** Darlehen Restschuld pro Darlehen (Klasse 3) */
  darlehenSalden: Array<{ kontoNr: string; name: string; saldo: number }>;
  /** Kautionen erhalten (Klasse 3) */
  kautionen: number;
}
