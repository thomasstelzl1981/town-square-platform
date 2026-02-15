/**
 * generateLegalDocumentPdf — Juristisches PDF im Notarvertrag-Stil
 * Nutzt jsPDF (bereits installiert) mit Times-Serif-Schrift
 */
import jsPDF from 'jspdf';

interface PatientenverfuegungData {
  name: string;
  geburtsdatum: string;
  adresse: string;
  ausweisnr: string;
  // Situationen (Checkboxen)
  sit_endstadium: boolean;
  sit_sterbeprozess: boolean;
  sit_hirnschaedigung: boolean;
  sit_koma: boolean;
  sit_sonstiges: string;
  // Grundentscheidung
  grund_keine: boolean;
  grund_ja: boolean;
  grund_differenzierung: string;
  // Konkrete Maßnahmen
  reanimation_nein: boolean;
  reanimation_ja: boolean;
  beatmung_nein: boolean;
  beatmung_ja: boolean;
  beatmung_details: string;
  ernaehrung_nein: boolean;
  ernaehrung_ja: boolean;
  ernaehrung_details: string;
  fluessigkeit: string;
  dialyse_nein: boolean;
  dialyse_ja: boolean;
  dialyse_details: string;
  intensiv_nein: boolean;
  intensiv_ja: boolean;
  intensiv_details: string;
  // Organspende
  organ_separat: boolean;
  organ_ja: boolean;
  organ_nein: boolean;
  organ_details: string;
  // Werte
  werte: string;
  // Datum
  letzte_bestaetigung: string;
  ort: string;
  datum: string;
}

interface VorsorgevollmachtData {
  name: string;
  geburtsdatum: string;
  adresse: string;
  // Bevollmächtigte Person
  bev_name: string;
  bev_geburtsdatum: string;
  bev_adresse: string;
  bev_kontakt: string;
  // Umfang
  umfang_gesundheit: boolean;
  umfang_aufenthalt: boolean;
  umfang_vermoegen: boolean;
  umfang_behoerden: boolean;
  umfang_post: boolean;
  umfang_versicherungen: boolean;
  umfang_vertraege: boolean;
  umfang_gericht: boolean;
  umfang_sonstiges: string;
  // Einschränkungen
  einschraenkungen: string;
  // Untervollmacht
  untervollmacht_ja: boolean;
  untervollmacht_nein: boolean;
  // Mehrere
  weitere_bevollmaechtigte: string;
  alleinvertretung: boolean;
  gemeinschaftlich: boolean;
  // Aufbewahrung
  aufbewahrung: string;
  // Datum
  ort: string;
  datum: string;
  bev_ort: string;
  bev_datum: string;
}

export interface LegalDocumentFormData {
  pv: PatientenverfuegungData;
  vv: VorsorgevollmachtData;
}

const MARGIN_LEFT = 25;
const MARGIN_RIGHT = 25;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const LINE_HEIGHT = 6;

function addPageNumber(doc: jsPDF, pageNum: number) {
  doc.setFontSize(8);
  doc.setFont('times', 'normal');
  doc.setTextColor(120);
  doc.text(`Seite ${pageNum}`, PAGE_WIDTH / 2, 290, { align: 'center' });
  doc.text('Dieses Dokument ist erst mit eigenhändiger Unterschrift gültig.', PAGE_WIDTH / 2, 285, { align: 'center' });
  doc.setTextColor(0);
}

function checkbox(checked: boolean): string {
  return checked ? '[X]' : '[  ]';
}

function addWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export function generatePatientenverfuegungPdf(data: LegalDocumentFormData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const { pv, vv } = data;
  let y = 30;
  let pageNum = 1;

  // ═══════════════════════════════════════════
  // TEIL A — PATIENTENVERFÜGUNG
  // ═══════════════════════════════════════════

  // Header
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.text('PATIENTENVERFÜGUNG', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 4;
  doc.setLineWidth(0.5);
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
  y += 12;

  // Identifikation
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text('Ich,', MARGIN_LEFT, y);
  y += LINE_HEIGHT + 2;
  doc.setFont('times', 'bold');
  y = addWrappedText(doc, `${pv.name || '______________________'}, geboren am ${pv.geburtsdatum || '__________'},`, MARGIN_LEFT, y, CONTENT_WIDTH, LINE_HEIGHT);
  y += 1;
  y = addWrappedText(doc, `wohnhaft ${pv.adresse || '______________________________________'},`, MARGIN_LEFT, y, CONTENT_WIDTH, LINE_HEIGHT);
  y += 1;
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  y = addWrappedText(doc, `(weitere Identifikation optional: Personalausweis-Nr. ${pv.ausweisnr || '______________'})`, MARGIN_LEFT, y, CONTENT_WIDTH, LINE_HEIGHT);
  y += 4;
  
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  y = addWrappedText(doc, 'bestimme für den Fall, dass ich meinen Willen nicht mehr verständlich äußern oder Entscheidungen nicht mehr selbst treffen kann, Folgendes:', MARGIN_LEFT, y, CONTENT_WIDTH, LINE_HEIGHT);
  y += 10;

  // §1 Geltungsbereich
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('1) Geltungsbereich / Situationen', MARGIN_LEFT, y);
  y += LINE_HEIGHT + 2;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  y = addWrappedText(doc, 'Diese Patientenverfügung gilt insbesondere, wenn ich mich in einer der folgenden Situationen befinde und meinen Willen nicht mehr bilden oder äußern kann:', MARGIN_LEFT, y, CONTENT_WIDTH, 5);
  y += 6;

  const situations = [
    { checked: pv.sit_endstadium, text: 'Endstadium einer unheilbaren, tödlich verlaufenden Krankheit, selbst wenn der Todeszeitpunkt noch nicht unmittelbar bevorsteht.' },
    { checked: pv.sit_sterbeprozess, text: 'Unabwendbarer Sterbeprozess.' },
    { checked: pv.sit_hirnschaedigung, text: 'Dauerhafter Ausfall höherer Hirnfunktionen / schwerste Gehirnschädigung ohne realistische Aussicht, das Bewusstsein wiederzuerlangen.' },
    { checked: pv.sit_koma, text: 'Dauerhafte Bewusstlosigkeit (Koma) ohne realistische Aussicht auf Besserung.' },
  ];
  for (const s of situations) {
    const line = `${checkbox(s.checked)}  ${s.text}`;
    y = addWrappedText(doc, line, MARGIN_LEFT + 3, y, CONTENT_WIDTH - 6, 5);
    y += 3;
  }
  if (pv.sit_sonstiges) {
    y = addWrappedText(doc, `${checkbox(true)}  Sonstiges: ${pv.sit_sonstiges}`, MARGIN_LEFT + 3, y, CONTENT_WIDTH - 6, 5);
    y += 3;
  }
  y += 6;

  // §2 Grundentscheidung
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('2) Lebensverlängernde Maßnahmen (Grundentscheidung)', MARGIN_LEFT, y);
  y += LINE_HEIGHT + 2;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  y = addWrappedText(doc, 'Wenn eine der oben genannten Situationen vorliegt, wünsche ich:', MARGIN_LEFT, y, CONTENT_WIDTH, 5);
  y += 5;
  y = addWrappedText(doc, `${checkbox(pv.grund_keine)}  KEINE lebensverlängernden Maßnahmen, die lediglich den Sterbeprozess verlängern oder Leiden ohne Aussicht auf Besserung verlängern.`, MARGIN_LEFT + 3, y, CONTENT_WIDTH - 6, 5);
  y += 4;
  y = addWrappedText(doc, `${checkbox(pv.grund_ja)}  Lebensverlängernde Maßnahmen JA, solange Aussicht auf Wiedererlangung eines für mich erträglichen Zustands besteht.`, MARGIN_LEFT + 3, y, CONTENT_WIDTH - 6, 5);
  y += 4;
  if (pv.grund_differenzierung) {
    y = addWrappedText(doc, `${checkbox(true)}  Differenzierung: ${pv.grund_differenzierung}`, MARGIN_LEFT + 3, y, CONTENT_WIDTH - 6, 5);
    y += 4;
  }
  y += 6;

  // Page break check
  if (y > 240) { addPageNumber(doc, pageNum); doc.addPage(); pageNum++; y = 25; }

  // §3 Konkrete Maßnahmen
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('3) Konkrete Maßnahmen', MARGIN_LEFT, y);
  y += LINE_HEIGHT + 4;

  const measures = [
    { title: '3.1 Wiederbelebung (Herz-Lungen-Wiederbelebung)', items: [
      { checked: pv.reanimation_nein, text: 'Ich wünsche keine Wiederbelebung.' },
      { checked: pv.reanimation_ja, text: 'Ich wünsche Wiederbelebung.' },
    ]},
    { title: '3.2 Künstliche Beatmung', items: [
      { checked: pv.beatmung_nein, text: 'Ich lehne künstliche Beatmung ab, wenn die unter 1) genannten Situationen vorliegen.' },
      { checked: pv.beatmung_ja, text: `Ich wünsche künstliche Beatmung: ${pv.beatmung_details || ''}` },
    ]},
    { title: '3.3 Künstliche Ernährung / Flüssigkeit', items: [
      { checked: pv.ernaehrung_nein, text: 'Ich lehne künstliche Ernährung (z.B. Sonde/PEG) ab, wenn die unter 1) genannten Situationen vorliegen.' },
      { checked: pv.ernaehrung_ja, text: `Ich wünsche künstliche Ernährung: ${pv.ernaehrung_details || ''}` },
    ]},
    { title: '3.4 Dialyse', items: [
      { checked: pv.dialyse_nein, text: 'Ich lehne Dialyse ab, wenn die unter 1) genannten Situationen vorliegen.' },
      { checked: pv.dialyse_ja, text: `Ich wünsche Dialyse: ${pv.dialyse_details || ''}` },
    ]},
    { title: '3.5 Operationen / Intensivmedizin', items: [
      { checked: pv.intensiv_nein, text: 'Ich lehne intensivmedizinische Maßnahmen / Operationen ohne Aussicht auf nachhaltige Besserung ab.' },
      { checked: pv.intensiv_ja, text: `Ich wünsche intensivmedizinische Maßnahmen: ${pv.intensiv_details || ''}` },
    ]},
  ];

  doc.setFontSize(10);
  for (const m of measures) {
    if (y > 250) { addPageNumber(doc, pageNum); doc.addPage(); pageNum++; y = 25; }
    doc.setFont('times', 'bold');
    doc.text(m.title, MARGIN_LEFT, y);
    y += LINE_HEIGHT;
    doc.setFont('times', 'normal');
    for (const item of m.items) {
      y = addWrappedText(doc, `${checkbox(item.checked)}  ${item.text}`, MARGIN_LEFT + 3, y, CONTENT_WIDTH - 6, 5);
      y += 3;
    }
    y += 4;
  }

  // Flüssigkeit extra
  if (pv.fluessigkeit) {
    y = addWrappedText(doc, `Flüssigkeit: ${pv.fluessigkeit}`, MARGIN_LEFT + 3, y, CONTENT_WIDTH - 6, 5);
    y += 6;
  }

  // §4 Palliativ
  if (y > 250) { addPageNumber(doc, pageNum); doc.addPage(); pageNum++; y = 25; }
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('4) Schmerz- und Symptombehandlung (Palliativ)', MARGIN_LEFT, y);
  y += LINE_HEIGHT + 2;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  y = addWrappedText(doc, 'Ich wünsche in jedem Fall eine angemessene Schmerz- und Symptombehandlung (palliativ), auch wenn dadurch eine Lebensverkürzung nicht ausgeschlossen werden kann.', MARGIN_LEFT, y, CONTENT_WIDTH, 5);
  y += 8;

  // §5 Organspende
  if (y > 250) { addPageNumber(doc, pageNum); doc.addPage(); pageNum++; y = 25; }
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('5) Organspende / Gewebespende (optional)', MARGIN_LEFT, y);
  y += LINE_HEIGHT + 2;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  y = addWrappedText(doc, `${checkbox(pv.organ_separat)}  Ich habe eine separate Erklärung/Organspendeausweis.`, MARGIN_LEFT + 3, y, CONTENT_WIDTH - 6, 5);
  y += 3;
  y = addWrappedText(doc, `${checkbox(pv.organ_ja)}  Ich wünsche Organspende: ${pv.organ_details || ''}`, MARGIN_LEFT + 3, y, CONTENT_WIDTH - 6, 5);
  y += 3;
  y = addWrappedText(doc, `${checkbox(pv.organ_nein)}  Ich lehne Organspende ab.`, MARGIN_LEFT + 3, y, CONTENT_WIDTH - 6, 5);
  y += 8;

  // §6 Werte
  if (y > 240) { addPageNumber(doc, pageNum); doc.addPage(); pageNum++; y = 25; }
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('6) Persönliche Werte / Leitlinien', MARGIN_LEFT, y);
  y += LINE_HEIGHT + 2;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('Für mich ist in dieser Situation besonders wichtig:', MARGIN_LEFT, y);
  y += LINE_HEIGHT;
  y = addWrappedText(doc, pv.werte || '________________________________________________________________________', MARGIN_LEFT, y, CONTENT_WIDTH, 5);
  y += 8;

  // §7
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('7) Ansprechpartner / Vertretung', MARGIN_LEFT, y);
  y += LINE_HEIGHT + 2;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  y = addWrappedText(doc, 'Ich wünsche, dass meine Bevollmächtigten / Betreuer und die behandelnden Ärztinnen/Ärzte diese Patientenverfügung beachten und umsetzen.', MARGIN_LEFT, y, CONTENT_WIDTH, 5);
  y += 8;

  // §8
  if (y > 250) { addPageNumber(doc, pageNum); doc.addPage(); pageNum++; y = 25; }
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('8) Widerruf / Aktualisierung', MARGIN_LEFT, y);
  y += LINE_HEIGHT + 2;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  y = addWrappedText(doc, 'Ich weiß, dass ich diese Patientenverfügung jederzeit formlos widerrufen kann.', MARGIN_LEFT, y, CONTENT_WIDTH, 5);
  y += 4;
  doc.text(`Letzte Bestätigung/Aktualisierung: ${pv.letzte_bestaetigung || '__________'}`, MARGIN_LEFT, y);
  y += 14;

  // Unterschrift
  if (y > 250) { addPageNumber(doc, pageNum); doc.addPage(); pageNum++; y = 25; }
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text(`Ort, Datum: ${pv.ort || '__________'}, den ${pv.datum || '__________'}`, MARGIN_LEFT, y);
  y += 14;
  doc.text('Unterschrift: __________________________', MARGIN_LEFT, y);
  y += LINE_HEIGHT;
  doc.setFont('times', 'bold');
  doc.text(pv.name || '', MARGIN_LEFT + 25, y);

  addPageNumber(doc, pageNum);

  // ═══════════════════════════════════════════
  // TEIL B — VORSORGEVOLLMACHT (neue Seite)
  // ═══════════════════════════════════════════
  doc.addPage();
  pageNum++;
  y = 30;

  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.text('VORSORGEVOLLMACHT', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 4;
  doc.setLineWidth(0.5);
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
  y += 12;

  // Identifikation
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text('Ich,', MARGIN_LEFT, y);
  y += LINE_HEIGHT + 2;
  doc.setFont('times', 'bold');
  y = addWrappedText(doc, `${vv.name || '______________________'}, geboren am ${vv.geburtsdatum || '__________'},`, MARGIN_LEFT, y, CONTENT_WIDTH, LINE_HEIGHT);
  y += 1;
  y = addWrappedText(doc, `wohnhaft ${vv.adresse || '______________________________________'},`, MARGIN_LEFT, y, CONTENT_WIDTH, LINE_HEIGHT);
  y += 4;
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text('erteile hiermit Vorsorgevollmacht.', MARGIN_LEFT, y);
  y += 10;

  // §1 Bevollmächtigte Person
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('1) Bevollmächtigte Person', MARGIN_LEFT, y);
  y += LINE_HEIGHT + 2;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('Ich bevollmächtige:', MARGIN_LEFT, y);
  y += LINE_HEIGHT + 2;
  doc.setFont('times', 'bold');
  y = addWrappedText(doc, `${vv.bev_name || '______________________'}, geboren am ${vv.bev_geburtsdatum || '__________'},`, MARGIN_LEFT, y, CONTENT_WIDTH, LINE_HEIGHT);
  y += 1;
  y = addWrappedText(doc, `Anschrift: ${vv.bev_adresse || '______________________________________'},`, MARGIN_LEFT, y, CONTENT_WIDTH, LINE_HEIGHT);
  y += 1;
  y = addWrappedText(doc, `Telefon/E-Mail: ${vv.bev_kontakt || '______________________'},`, MARGIN_LEFT, y, CONTENT_WIDTH, LINE_HEIGHT);
  y += 4;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  y = addWrappedText(doc, 'mich in den nachstehend angekreuzten Angelegenheiten zu vertreten, sobald und soweit ich hierzu selbst nicht mehr in der Lage bin oder dies wünsche.', MARGIN_LEFT, y, CONTENT_WIDTH, 5);
  y += 8;

  // §2 Umfang
  if (y > 240) { addPageNumber(doc, pageNum); doc.addPage(); pageNum++; y = 25; }
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('2) Umfang der Vollmacht', MARGIN_LEFT, y);
  y += LINE_HEIGHT + 2;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);

  const umfang = [
    { checked: vv.umfang_gesundheit, text: 'Gesundheits- und Pflegeangelegenheiten (Ärztliche Maßnahmen, Pflege, Krankenhaus, Reha; Einsicht in Krankenunterlagen; Schweigepflichtentbindung soweit erforderlich)' },
    { checked: vv.umfang_aufenthalt, text: 'Aufenthalts- und Wohnungsangelegenheiten (Heimvertrag, Wohnungsauflösung, Mietvertrag)' },
    { checked: vv.umfang_vermoegen, text: 'Vermögenssorge (Bank, Zahlungen, Verträge, Verwaltung von Vermögen)' },
    { checked: vv.umfang_behoerden, text: 'Behörden- und Sozialleistungsangelegenheiten' },
    { checked: vv.umfang_post, text: 'Post- und Fernmeldeverkehr (Post öffnen, E-Mail/Telefon-Verträge)' },
    { checked: vv.umfang_versicherungen, text: 'Vertretung gegenüber Versicherungen' },
    { checked: vv.umfang_vertraege, text: 'Abschluss/Kündigung von Verträgen des täglichen Lebens' },
    { checked: vv.umfang_gericht, text: 'Vertretung vor Gericht / Prozesshandlungen, soweit gesetzlich zulässig' },
  ];
  for (const u of umfang) {
    if (y > 265) { addPageNumber(doc, pageNum); doc.addPage(); pageNum++; y = 25; }
    y = addWrappedText(doc, `${checkbox(u.checked)}  ${u.text}`, MARGIN_LEFT + 3, y, CONTENT_WIDTH - 6, 5);
    y += 3;
  }
  if (vv.umfang_sonstiges) {
    y = addWrappedText(doc, `${checkbox(true)}  Sonstiges: ${vv.umfang_sonstiges}`, MARGIN_LEFT + 3, y, CONTENT_WIDTH - 6, 5);
    y += 3;
  }
  y += 6;

  // §3 Einschränkungen
  if (y > 250) { addPageNumber(doc, pageNum); doc.addPage(); pageNum++; y = 25; }
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('3) Einschränkungen (optional)', MARGIN_LEFT, y);
  y += LINE_HEIGHT + 2;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('Die Vollmacht gilt NICHT / gilt nur eingeschränkt für:', MARGIN_LEFT, y);
  y += LINE_HEIGHT;
  y = addWrappedText(doc, vv.einschraenkungen || '________________________________________________________________________', MARGIN_LEFT, y, CONTENT_WIDTH, 5);
  y += 8;

  // §4 Untervollmacht
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('4) Untervollmacht (optional)', MARGIN_LEFT, y);
  y += LINE_HEIGHT + 2;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text(`${checkbox(vv.untervollmacht_ja)}  Der/Die Bevollmächtigte darf Untervollmacht erteilen.`, MARGIN_LEFT + 3, y);
  y += LINE_HEIGHT;
  doc.text(`${checkbox(vv.untervollmacht_nein)}  Keine Untervollmacht.`, MARGIN_LEFT + 3, y);
  y += 8;

  // §5 Mehrere Bevollmächtigte
  if (y > 250) { addPageNumber(doc, pageNum); doc.addPage(); pageNum++; y = 25; }
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('5) Mehrere Bevollmächtigte (optional)', MARGIN_LEFT, y);
  y += LINE_HEIGHT + 2;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  if (vv.weitere_bevollmaechtigte) {
    y = addWrappedText(doc, `Weitere Bevollmächtigte: ${vv.weitere_bevollmaechtigte}`, MARGIN_LEFT + 3, y, CONTENT_WIDTH - 6, 5);
    y += 3;
  }
  doc.text(`${checkbox(vv.alleinvertretung)}  Jeder alleinvertretungsberechtigt.`, MARGIN_LEFT + 3, y);
  y += LINE_HEIGHT;
  doc.text(`${checkbox(vv.gemeinschaftlich)}  Nur gemeinschaftlich.`, MARGIN_LEFT + 3, y);
  y += 8;

  // §6 Geltung
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('6) Geltung im Außenverhältnis', MARGIN_LEFT, y);
  y += LINE_HEIGHT + 2;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  y = addWrappedText(doc, 'Diese Vollmacht soll im Außenverhältnis unbeschränkt gelten, soweit rechtlich zulässig.', MARGIN_LEFT, y, CONTENT_WIDTH, 5);
  y += 8;

  // §7 Aufbewahrung
  if (y > 250) { addPageNumber(doc, pageNum); doc.addPage(); pageNum++; y = 25; }
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('7) Aufbewahrung / Hinweis Vorsorgeregister', MARGIN_LEFT, y);
  y += LINE_HEIGHT + 2;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text(`Aufbewahrungsort der Vollmacht: ${vv.aufbewahrung || '__________________________'}`, MARGIN_LEFT, y);
  y += LINE_HEIGHT;
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  y = addWrappedText(doc, 'Hinweis: Eine Registrierung im Zentralen Vorsorgeregister kann die Auffindbarkeit im Betreuungsfall erleichtern.', MARGIN_LEFT, y, CONTENT_WIDTH, 5);
  y += 14;

  // Unterschrift Vollmachtgeber
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text(`Ort, Datum: ${vv.ort || '__________'}, den ${vv.datum || '__________'}`, MARGIN_LEFT, y);
  y += 14;
  doc.text('Unterschrift Vollmachtgeber/in: __________________________', MARGIN_LEFT, y);
  y += LINE_HEIGHT;
  doc.setFont('times', 'bold');
  doc.text(vv.name || '', MARGIN_LEFT + 42, y);
  y += 14;

  // Kenntnisnahme Bevollmächtigte/r
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('Ich nehme die Vollmacht an / zur Kenntnis:', MARGIN_LEFT, y);
  y += LINE_HEIGHT + 2;
  doc.text(`Ort/Datum: ${vv.bev_ort || '__________'}, den ${vv.bev_datum || '__________'}`, MARGIN_LEFT, y);
  y += 14;
  doc.text('__________________________', MARGIN_LEFT, y);
  y += LINE_HEIGHT;
  doc.setFont('times', 'bold');
  doc.text(vv.bev_name || '', MARGIN_LEFT, y);

  addPageNumber(doc, pageNum);

  return doc;
}

/** Default empty form */
export function getDefaultPvVvForm(): LegalDocumentFormData {
  return {
    pv: {
      name: '', geburtsdatum: '', adresse: '', ausweisnr: '',
      sit_endstadium: false, sit_sterbeprozess: false, sit_hirnschaedigung: false, sit_koma: false, sit_sonstiges: '',
      grund_keine: false, grund_ja: false, grund_differenzierung: '',
      reanimation_nein: false, reanimation_ja: false,
      beatmung_nein: false, beatmung_ja: false, beatmung_details: '',
      ernaehrung_nein: false, ernaehrung_ja: false, ernaehrung_details: '', fluessigkeit: '',
      dialyse_nein: false, dialyse_ja: false, dialyse_details: '',
      intensiv_nein: false, intensiv_ja: false, intensiv_details: '',
      organ_separat: false, organ_ja: false, organ_nein: false, organ_details: '',
      werte: '', letzte_bestaetigung: '', ort: '', datum: '',
    },
    vv: {
      name: '', geburtsdatum: '', adresse: '',
      bev_name: '', bev_geburtsdatum: '', bev_adresse: '', bev_kontakt: '',
      umfang_gesundheit: false, umfang_aufenthalt: false, umfang_vermoegen: false,
      umfang_behoerden: false, umfang_post: false, umfang_versicherungen: false,
      umfang_vertraege: false, umfang_gericht: false, umfang_sonstiges: '',
      einschraenkungen: '', untervollmacht_ja: false, untervollmacht_nein: false,
      weitere_bevollmaechtigte: '', alleinvertretung: false, gemeinschaftlich: false,
      aufbewahrung: '', ort: '', datum: '', bev_ort: '', bev_datum: '',
    },
  };
}
