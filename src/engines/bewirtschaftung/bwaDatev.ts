/**
 * DATEV-BWA & SuSa Engine — Pure calculation functions
 * Maps real data to SKR04 accounts and produces DATEV-standard BWA + SuSa
 */
import { BWA_KATEGORIEN } from '@/manifests/bwaKontenplan';
import type { DatevBWAInput, DatevBWAResult, DatevBWAKategorie, DatevKontoValue, SuSaResult, SuSaEntry } from './bwaDatevSpec';

/** Map NK category codes to SKR04 account numbers */
const NK_CATEGORY_TO_SKR04: Record<string, string> = {
  grundsteuer: '6000',
  wasser_abwasser: '6020',
  muell_entsorgung: '6030',
  strassenreinigung: '6040',
  hausmeister: '6050',
  gartenpflege: '6060',
  allgemeinstrom: '6070',
  schornsteinfeger: '6080',
  aufzug: '6090',
  gebaeudeversicherung: '6100',
  haftpflicht: '6110',
};

function buildKontoValue(kontoNr: string, name: string, betrag: number, quelle: DatevKontoValue['quelle']): DatevKontoValue {
  return { kontoNr, name, betrag: Math.abs(betrag), quelle };
}

export function calcDatevBWA(
  input: DatevBWAInput,
  veName: string,
  zeitraumVon: string,
  zeitraumBis: string,
): DatevBWAResult {
  const kategorien: DatevBWAKategorie[] = BWA_KATEGORIEN.map(kat => {
    const konten: DatevKontoValue[] = [];

    switch (kat.code) {
      case 'BWA-10': // Mietertraege
        if (input.mietertragWohnraum > 0) konten.push(buildKontoValue('4400', 'Mieterträge Wohnraum', input.mietertragWohnraum, 'leases'));
        if (input.mietertragStellplaetze > 0) konten.push(buildKontoValue('4410', 'Mieterträge Stellplätze/Garagen', input.mietertragStellplaetze, 'leases'));
        if (input.sonstigeErtraege > 0) konten.push(buildKontoValue('4490', 'Sonstige Erträge', input.sonstigeErtraege, 'vv_annual_data'));
        if (input.versicherungserstattungen > 0) konten.push(buildKontoValue('4760', 'Versicherungsentschädigungen', input.versicherungserstattungen, 'vv_annual_data'));
        break;

      case 'BWA-20': // NK/Umlagen
        if (input.nkVorauszahlungen > 0) konten.push(buildKontoValue('4420', 'NK-Vorauszahlungen (Umlagen)', input.nkVorauszahlungen, 'leases'));
        break;

      case 'BWA-30': // Betriebskosten
        for (const [catCode, amount] of Object.entries(input.nkKosten)) {
          const skr04 = NK_CATEGORY_TO_SKR04[catCode];
          if (skr04 && amount > 0) {
            const kontoInfo = kat.konten.find(k => k.nummer === skr04);
            konten.push(buildKontoValue(skr04, kontoInfo?.name || catCode, amount, 'nk_cost_items'));
          }
        }
        break;

      case 'BWA-40': // Instandhaltung
        if (input.instandhaltung > 0) konten.push(buildKontoValue('6200', 'Instandhaltung/Reparaturen', input.instandhaltung, 'vv_annual_data'));
        break;

      case 'BWA-50': // Verwaltung
        if (input.verwaltung > 0) konten.push(buildKontoValue('6300', 'Hausverwaltung', input.verwaltung, 'vv_annual_data'));
        if (input.steuerberatung > 0) konten.push(buildKontoValue('6310', 'Steuerberatung', input.steuerberatung, 'vv_annual_data'));
        if (input.rechtsberatung > 0) konten.push(buildKontoValue('6320', 'Rechtsberatung', input.rechtsberatung, 'vv_annual_data'));
        if (input.bankgebuehren > 0) konten.push(buildKontoValue('6330', 'Bankgebühren', input.bankgebuehren, 'vv_annual_data'));
        if (input.sonstigeVerwaltung > 0) konten.push(buildKontoValue('6340', 'Porto/Telefon/IT', input.sonstigeVerwaltung, 'vv_annual_data'));
        break;

      case 'BWA-60': // Finanzierung
        if (input.zinsaufwand > 0) konten.push(buildKontoValue('7300', 'Zinsaufwand Darlehen', input.zinsaufwand, 'property_financing'));
        if (input.sonstigeFinanzierung > 0) konten.push(buildKontoValue('7310', 'Sonst. Finanzierungskosten', input.sonstigeFinanzierung, 'vv_annual_data'));
        break;

      case 'BWA-70': // Abschreibungen
        if (input.afaGebaeude > 0) konten.push(buildKontoValue('4830', 'AfA Gebäude', input.afaGebaeude, 'engine_calc'));
        if (input.afaBga > 0) konten.push(buildKontoValue('4850', 'AfA BGA/GWG', input.afaBga, 'manual'));
        break;
    }

    return {
      code: kat.code,
      name: kat.name,
      konten,
      summe: konten.reduce((s, k) => s + k.betrag, 0),
    };
  });

  const gesamtleistung = kategorien
    .filter(k => k.code === 'BWA-10' || k.code === 'BWA-20')
    .reduce((s, k) => s + k.summe, 0);

  const gesamtaufwand = kategorien
    .filter(k => !['BWA-10', 'BWA-20'].includes(k.code))
    .reduce((s, k) => s + k.summe, 0);

  return {
    veName,
    zeitraumVon,
    zeitraumBis,
    kategorien,
    gesamtleistung,
    gesamtaufwand,
    betriebsergebnis: gesamtleistung - gesamtaufwand,
  };
}

export function calcSuSa(bwa: DatevBWAResult): SuSaResult {
  const eintraege: SuSaEntry[] = [];

  for (const kat of bwa.kategorien) {
    for (const konto of kat.konten) {
      const isErtrag = kat.code === 'BWA-10' || kat.code === 'BWA-20';
      eintraege.push({
        kontoNr: konto.kontoNr,
        name: konto.name,
        eb: 0,
        soll: isErtrag ? 0 : konto.betrag,
        haben: isErtrag ? konto.betrag : 0,
        saldoSeite: isErtrag ? 'H' : 'S',
        saldo: konto.betrag,
      });
    }
  }

  // Sort by account number
  eintraege.sort((a, b) => a.kontoNr.localeCompare(b.kontoNr));

  return {
    veName: bwa.veName,
    zeitraumVon: bwa.zeitraumVon,
    zeitraumBis: bwa.zeitraumBis,
    eintraege,
    summenSoll: eintraege.reduce((s, e) => s + e.soll, 0),
    summenHaben: eintraege.reduce((s, e) => s + e.haben, 0),
  };
}
