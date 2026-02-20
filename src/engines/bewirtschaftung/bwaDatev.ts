/**
 * DATEV-BWA & SuSa Engine — Pure calculation functions
 * Kurzfristige Erfolgsrechnung (SKR04) für Immobilien V+V
 */
import type {
  DatevBWAInput,
  DatevBWAResult,
  DatevBWAKategorie,
  DatevKontoValue,
  SuSaResult,
  SuSaEntry,
  SuSaBilanzInput,
} from './bwaDatevSpec';

function kv(kontoNr: string, name: string, betrag: number, quelle: DatevKontoValue['quelle']): DatevKontoValue {
  return { kontoNr, name, betrag: Math.abs(betrag), quelle };
}

function kat(code: string, name: string, konten: DatevKontoValue[]): DatevBWAKategorie {
  return { code, name, konten, summe: konten.reduce((s, k) => s + k.betrag, 0) };
}

export function calcDatevBWA(
  input: DatevBWAInput,
  veName: string,
  zeitraumVon: string,
  zeitraumBis: string,
): DatevBWAResult {
  // ── LEISTUNG ──
  const umsatzKonten: DatevKontoValue[] = [];
  if (input.mietertragGesamt > 0) umsatzKonten.push(kv('4105', 'Steuerfreie Umsätze V+V § 4 Nr. 12 UStG', input.mietertragGesamt, 'leases'));
  const umsatzerloese = kat('UMSATZ', 'Umsatzerlöse', umsatzKonten);

  const nkKonten: DatevKontoValue[] = [];
  if (input.nkVorauszahlungen > 0) nkKonten.push(kv('4420', 'NK-Vorauszahlungen (Umlagen)', input.nkVorauszahlungen, 'leases'));
  const nkUmlagen = kat('NK-UMLAGEN', 'NK-Vorauszahlungen / Umlagen', nkKonten);

  const gesamtleistung = umsatzerloese.summe + nkUmlagen.summe;
  const rohertrag = gesamtleistung; // Material = 0 bei V+V
  const sonstigeBetrErloese = input.sonstigeBetrErloese || 0;
  const betriebsRohertrag = rohertrag + sonstigeBetrErloese;

  // ── KOSTENARTEN ──
  const personalkosten = kat('PERSONAL', 'Personalkosten', []);

  const raumKonten: DatevKontoValue[] = [];
  if (input.gasStromWasser > 0) raumKonten.push(kv('6325', 'Gas, Strom, Wasser', input.gasStromWasser, 'nk_cost_items'));
  if (input.grundstuecksaufwand > 0) raumKonten.push(kv('6350', 'Grundstücksaufwendungen, betrieblich', input.grundstuecksaufwand, 'nk_cost_items'));
  const raumkosten = kat('RAUM', 'Raumkosten / Grundstücksaufwand', raumKonten);

  const steuerKonten: DatevKontoValue[] = [];
  if (input.grundsteuer > 0) steuerKonten.push(kv('7680', 'Grundsteuer', input.grundsteuer, 'nk_cost_items'));
  const betrieblicheSteuern = kat('BETR-STEUERN', 'Betriebliche Steuern', steuerKonten);

  const versKonten: DatevKontoValue[] = [];
  if (input.versicherungAllgemein > 0) versKonten.push(kv('6400', 'Versicherungen (allgemein)', input.versicherungAllgemein, 'nk_cost_items'));
  if (input.gebaeudeversicherung > 0) versKonten.push(kv('6405', 'Versicherung für Gebäude', input.gebaeudeversicherung, 'nk_cost_items'));
  if (input.beitraege > 0) versKonten.push(kv('6420', 'Beiträge', input.beitraege, 'manual'));
  if (input.sonstigeAbgaben > 0) versKonten.push(kv('6430', 'Sonstige Abgaben', input.sonstigeAbgaben, 'nk_cost_items'));
  const versicherungen = kat('VERSICHERUNG', 'Versicherungen / Beiträge', versKonten);

  const afaKonten: DatevKontoValue[] = [];
  if (input.afaSachanlagen > 0) afaKonten.push(kv('6220', 'Abschreibungen auf Sachanlagen', input.afaSachanlagen, 'manual'));
  if (input.afaGebaeude > 0) afaKonten.push(kv('6221', 'Abschreibungen auf Gebäude', input.afaGebaeude, 'engine_calc'));
  if (input.afaGwg > 0) afaKonten.push(kv('6260', 'Sofortabschreibung GWG', input.afaGwg, 'manual'));
  const abschreibungen = kat('AFA', 'Abschreibungen', afaKonten);

  const repKonten: DatevKontoValue[] = [];
  if (input.instandhaltung > 0) repKonten.push(kv('6490', 'Sonstige Reparaturen u. Instandhaltungen', input.instandhaltung, 'vv_annual_data'));
  const reparatur = kat('REPARATUR', 'Reparatur / Instandhaltung', repKonten);

  const sonstKonten: DatevKontoValue[] = [];
  if (input.verwaltung > 0) sonstKonten.push(kv('6300', 'Hausverwaltung / WEG-Verwalter', input.verwaltung, 'vv_annual_data'));
  if (input.rechtsberatung > 0) sonstKonten.push(kv('6825', 'Rechts- und Beratungskosten', input.rechtsberatung, 'vv_annual_data'));
  if (input.bankgebuehren > 0) sonstKonten.push(kv('6855', 'Nebenkosten des Geldverkehrs', input.bankgebuehren, 'vv_annual_data'));
  if (input.abfallbeseitigung > 0) sonstKonten.push(kv('6859', 'Aufwand Abfallbeseitigung', input.abfallbeseitigung, 'nk_cost_items'));
  const sonstigeKosten = kat('SONST-KOSTEN', 'Sonstige Kosten', sonstKonten);

  const gesamtkosten = personalkosten.summe + raumkosten.summe + betrieblicheSteuern.summe
    + versicherungen.summe + abschreibungen.summe + reparatur.summe + sonstigeKosten.summe;

  const betriebsergebnis = betriebsRohertrag - gesamtkosten;

  // ── NEUTRALES ERGEBNIS ──
  const zinsKonten: DatevKontoValue[] = [];
  for (let i = 0; i < input.darlehen.length; i++) {
    const d = input.darlehen[i];
    if (d.zinsaufwand > 0) {
      const nr = i === 0 ? '7310' : `73${(20 + i).toString()}`;
      zinsKonten.push(kv(nr, `Zinsen Darlehen ${d.bankName} ${d.loanNumber}`, d.zinsaufwand, 'property_financing'));
    }
  }
  if (input.sonstigeFinanzierung > 0) {
    zinsKonten.push(kv('7319', 'Bereitstellungszinsen / sonst. Finanzierungskosten', input.sonstigeFinanzierung, 'vv_annual_data'));
  }
  const zinsaufwandKat = kat('ZINSEN', 'Zinsaufwand', zinsKonten);

  const sonstigerNeutralerAufwand = 0;
  const neutralerAufwand = zinsaufwandKat.summe + sonstigerNeutralerAufwand;

  const neutralErtrKonten: DatevKontoValue[] = [];
  if (input.versicherungserstattungen > 0) neutralErtrKonten.push(kv('4970', 'Versicherungsentschädigungen', input.versicherungserstattungen, 'vv_annual_data'));
  const neutralerErtragKat = kat('NEUTRAL-ERTRAG', 'Sonstiger neutraler Ertrag', neutralErtrKonten);

  const neutralesErgebnis = neutralerErtragKat.summe - neutralerAufwand;

  const ergebnisVorSteuern = betriebsergebnis + neutralesErgebnis;
  const vorlaeufligesErgebnis = ergebnisVorSteuern; // Keine Ertragsteuern bei V+V natürl. Personen

  return {
    veName,
    zeitraumVon,
    zeitraumBis,
    umsatzerloese,
    nkUmlagen,
    gesamtleistung,
    rohertrag,
    sonstigeBetrErloese,
    betriebsRohertrag,
    personalkosten,
    raumkosten,
    betrieblicheSteuern,
    versicherungen,
    abschreibungen,
    reparatur,
    sonstigeKosten,
    gesamtkosten,
    betriebsergebnis,
    zinsaufwand: zinsaufwandKat,
    sonstigerNeutralerAufwand,
    neutralerAufwand,
    neutralerErtrag: neutralerErtragKat,
    neutralesErgebnis,
    ergebnisVorSteuern,
    vorlaeufligesErgebnis,
  };
}

// ── SuSa ────────────────────────────────────────────────────────────────────

function susaEntry(kontoNr: string, name: string, klasse: number, soll: number, haben: number, eb: number = 0): SuSaEntry {
  const saldo = Math.abs(soll - haben);
  return {
    kontoNr,
    name,
    klasse,
    eb,
    soll,
    haben,
    saldoSeite: soll >= haben ? 'S' : 'H',
    saldo,
  };
}

export function calcSuSa(bwa: DatevBWAResult, bilanz?: SuSaBilanzInput): SuSaResult {
  const eintraege: SuSaEntry[] = [];

  // ── Klasse 0: Anlagevermögen ──
  if (bilanz) {
    if (bilanz.akGrundstuecke > 0) eintraege.push(susaEntry('0065', 'Grundstücke, grundstücksgl. Rechte', 0, bilanz.akGrundstuecke, 0, bilanz.akGrundstuecke));
    if (bilanz.akGebaeude > 0) eintraege.push(susaEntry('0090', 'Geschäftsbauten', 0, bilanz.akGebaeude, 0, bilanz.akGebaeude));
    if (bilanz.kumulierteAfaGebaeude > 0) eintraege.push(susaEntry('0094', 'Wertberichtigung Geschäftsbauten', 0, 0, bilanz.kumulierteAfaGebaeude, 0));
  }

  // ── Klasse 1: Umlaufvermögen ──
  if (bilanz) {
    if (bilanz.mietforderungen > 0) eintraege.push(susaEntry('1200', 'Forderungen aus V+V', 1, bilanz.mietforderungen, 0));
    if (bilanz.bankguthaben !== 0) {
      const s = bilanz.bankguthaben >= 0 ? bilanz.bankguthaben : 0;
      const h = bilanz.bankguthaben < 0 ? Math.abs(bilanz.bankguthaben) : 0;
      eintraege.push(susaEntry('1800', 'Bank', 1, s, h, s));
    }
  }

  // ── Klasse 3: Verbindlichkeiten ──
  if (bilanz) {
    for (const dl of bilanz.darlehenSalden) {
      eintraege.push(susaEntry(dl.kontoNr, dl.name, 3, 0, dl.saldo, dl.saldo));
    }
    if (bilanz.kautionen > 0) eintraege.push(susaEntry('3730', 'Erhaltene Kautionen', 3, 0, bilanz.kautionen, bilanz.kautionen));
  }

  // ── Klasse 4: Erträge ──
  const addKat = (kateg: DatevBWAKategorie, klasse: number, isErtrag: boolean) => {
    for (const k of kateg.konten) {
      eintraege.push(susaEntry(k.kontoNr, k.name, klasse, isErtrag ? 0 : k.betrag, isErtrag ? k.betrag : 0));
    }
  };
  addKat(bwa.umsatzerloese, 4, true);
  addKat(bwa.nkUmlagen, 4, true);
  addKat(bwa.neutralerErtrag, 4, true);

  // ── Klasse 6: Aufwendungen ──
  addKat(bwa.raumkosten, 6, false);
  addKat(bwa.versicherungen, 6, false);
  addKat(bwa.abschreibungen, 6, false);
  addKat(bwa.reparatur, 6, false);
  addKat(bwa.sonstigeKosten, 6, false);

  // ── Klasse 7: Zinsen + Steuern ──
  addKat(bwa.betrieblicheSteuern, 7, false);
  addKat(bwa.zinsaufwand, 7, false);

  // Sort by account number
  eintraege.sort((a, b) => a.kontoNr.localeCompare(b.kontoNr));

  // Summen pro Klasse
  const summenProKlasse: Record<number, { soll: number; haben: number }> = {};
  for (const e of eintraege) {
    if (!summenProKlasse[e.klasse]) summenProKlasse[e.klasse] = { soll: 0, haben: 0 };
    summenProKlasse[e.klasse].soll += e.soll;
    summenProKlasse[e.klasse].haben += e.haben;
  }

  return {
    veName: bwa.veName,
    zeitraumVon: bwa.zeitraumVon,
    zeitraumBis: bwa.zeitraumBis,
    eintraege,
    summenSoll: eintraege.reduce((s, e) => s + e.soll, 0),
    summenHaben: eintraege.reduce((s, e) => s + e.haben, 0),
    summenProKlasse,
  };
}
