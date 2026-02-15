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

// ═══════════════════════════════════════════════════════════════
// TESTAMENT-SCHREIBVORLAGEN (PDF mit allen 4 Varianten)
// ═══════════════════════════════════════════════════════════════

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.text(title, PAGE_WIDTH / 2, y, { align: 'center' });
  y += 4;
  doc.setLineWidth(0.5);
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
  return y + 12;
}

function addParagraph(doc: jsPDF, title: string, y: number): number {
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text(title, MARGIN_LEFT, y);
  return y + LINE_HEIGHT + 2;
}

function addBody(doc: jsPDF, text: string, y: number): number {
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  return addWrappedText(doc, text, MARGIN_LEFT, y, CONTENT_WIDTH, 5);
}

function addPlaceholderLine(doc: jsPDF, label: string, y: number): number {
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text(`${label}: ______________________________________`, MARGIN_LEFT, y);
  return y + LINE_HEIGHT + 2;
}

function addSignatureBlock(doc: jsPDF, y: number, label: string = 'Eigenhändige Unterschrift'): number {
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text('Ort, Datum: __________________, den ______________', MARGIN_LEFT, y);
  y += 14;
  doc.text(`${label}:`, MARGIN_LEFT, y);
  y += 2;
  doc.text('__________________________', MARGIN_LEFT, y);
  return y + LINE_HEIGHT;
}

function addTestamentFooter(doc: jsPDF, pageNum: number) {
  doc.setFontSize(8);
  doc.setFont('times', 'italic');
  doc.setTextColor(120);
  doc.text('SCHREIBVORLAGE — Nur wirksam als vollständig eigenhändig handschriftlich verfasstes und unterschriebenes Dokument.', PAGE_WIDTH / 2, 285, { align: 'center' });
  doc.text(`Seite ${pageNum}`, PAGE_WIDTH / 2, 290, { align: 'center' });
  doc.setTextColor(0);
}

function pageBreakIfNeeded(doc: jsPDF, y: number, pageNum: { v: number }, threshold = 240): number {
  if (y > threshold) {
    addTestamentFooter(doc, pageNum.v);
    doc.addPage();
    pageNum.v++;
    return 25;
  }
  return y;
}

export function generateTestamentVorlagenPdf(): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pg = { v: 1 };
  let y = 25;

  // ═══════════════════════════════════════════
  // DECKBLATT — Allgemeine Hinweise
  // ═══════════════════════════════════════════
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.text('TESTAMENT-VORLAGEN', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(12);
  doc.text('Schreibvorlagen für eigenhändige Testamente', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 4;
  doc.setLineWidth(0.8);
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
  y += 12;

  // Hinweis 1: Wirksamkeit
  y = addParagraph(doc, '1) WIRKSAMKEIT / FORM', y);
  const wirksamkeit = [
    '• Diese Vorlage ist nur eine SCHREIBVORLAGE.',
    '• Ein eigenhändiges Testament ist nur wirksam, wenn der gesamte Text vollständig eigenhändig (handschriftlich) geschrieben und eigenhändig unterschrieben wird.',
    '• Ein Ausdruck (auch mit Unterschrift) oder eine digitale Signatur macht ein eigenhändiges Testament NICHT wirksam.',
  ];
  for (const t of wirksamkeit) {
    y = addBody(doc, t, y);
    y += 3;
  }
  y += 4;

  // Hinweis 2: Handhabung
  y = addParagraph(doc, '2) EMPFOHLENE HANDHABUNG (praxisbewährt)', y);
  const handhabung = [
    '• Nutzen Sie die Vorlage zum Entwurf und schreiben Sie den Text in Ruhe 1–3-mal als Entwurf per Hand, bis alles korrekt ist (Namen, Daten, Quoten, Ersatzregelung).',
    '• Fertigen Sie anschließend genau EIN endgültiges handschriftliches Original an, mit Ort, Datum und vollständiger Unterschrift (Vor- und Nachname).',
    '• Bewahren Sie das handschriftliche Original sicher auf. Zusätzlich können Sie Kopien/Scans zur Information für Vertrauenspersonen anfertigen. Kopien ersetzen das Original nicht.',
  ];
  for (const t of handhabung) {
    y = addBody(doc, t, y);
    y += 3;
  }
  y += 4;

  // Hinweis 3: Auffindbarkeit
  y = pageBreakIfNeeded(doc, y, pg);
  y = addParagraph(doc, '3) AUFFINDBARKEIT IM ERBFALL / AMTLICHE VERWAHRUNG', y);
  const auffindbarkeit = [
    '• Privat aufbewahrte Testamente werden NICHT im Zentralen Testamentsregister registriert.',
    '• Damit ein eigenhändiges Testament im Erbfall sicher gefunden wird, kann es in die besondere amtliche Verwahrung beim Nachlassgericht (Amtsgericht) gegeben werden. Dann wird es durch das verwahrende Gericht im Zentralen Testamentsregister erfasst.',
    '• Notariell beurkundete Testamente/Erbverträge werden durch die Notarin/den Notar registriert.',
    '• Im Zentralen Testamentsregister wird NICHT der Inhalt gespeichert, sondern nur, wo die Urkunde verwahrt wird.',
  ];
  for (const t of auffindbarkeit) {
    y = addBody(doc, t, y);
    y += 3;
  }
  y += 4;

  // Hinweis 4: Widerruf
  y = pageBreakIfNeeded(doc, y, pg);
  y = addParagraph(doc, '4) WIDERRUF / AKTUALITÄT', y);
  y = addBody(doc, '• Neue Testamente sollten klar regeln, ob frühere Verfügungen widerrufen werden.', y);
  y += 3;
  y = addBody(doc, '• Bei größeren Vermögen, Immobilien, Patchwork-Familien oder Auslandsbezug wird notarielle/anwaltliche Beratung dringend empfohlen.', y);
  y += 6;

  addTestamentFooter(doc, pg.v);

  // ═══════════════════════════════════════════
  // VORLAGE 1/4 — EINZELTESTAMENT: ALLEINERBE
  // ═══════════════════════════════════════════
  doc.addPage(); pg.v++; y = 25;
  y = addSectionTitle(doc, 'VORLAGE 1/4 — EINZELTESTAMENT', y);
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text('Alleinerbeneinsetzung (mit Ersatzerbe)', PAGE_WIDTH / 2, y - 4, { align: 'center' });
  y += 6;

  y = addBody(doc, 'Ich,', y); y += 2;
  y = addPlaceholderLine(doc, 'Name (vollständig)', y);
  y = addPlaceholderLine(doc, 'geboren am', y);
  y = addPlaceholderLine(doc, 'wohnhaft', y);
  y += 2;
  y = addBody(doc, 'errichte hiermit mein Testament und bestimme für den Fall meines Todes:', y);
  y += 8;

  y = addParagraph(doc, '§ 1 Widerruf', y);
  y = addBody(doc, 'Ich widerrufe alle früher von mir errichteten Testamente und sonstigen letztwilligen Verfügungen.', y);
  y += 8;

  y = addParagraph(doc, '§ 2 Alleinerbe', y);
  y = addBody(doc, 'Zu meinem alleinigen und unbeschränkten Erben setze ich ein:', y);
  y += 3;
  y = addPlaceholderLine(doc, 'Name (vollständig)', y);
  y = addPlaceholderLine(doc, 'geboren am', y);
  y = addPlaceholderLine(doc, 'wohnhaft', y);
  y += 6;

  y = addParagraph(doc, '§ 3 Ausschluss sonstiger Erben', y);
  y = addBody(doc, 'Alle Personen, die nach der gesetzlichen Erbfolge als Erben in Betracht kämen und die ich vorstehend nicht als Erben eingesetzt habe, schließe ich hiermit ausdrücklich von der Erbfolge aus.', y);
  y += 8;

  y = pageBreakIfNeeded(doc, y, pg);
  y = addParagraph(doc, '§ 4 Ersatzerbe', y);
  y = addBody(doc, 'Sollte der vorgenannte Erbe vor mir versterben oder die Erbschaft ausschlagen, so setze ich als Ersatzerben ein:', y);
  y += 3;
  y = addPlaceholderLine(doc, 'Name (vollständig)', y);
  y = addPlaceholderLine(doc, 'geboren am', y);
  y = addPlaceholderLine(doc, 'wohnhaft', y);
  y += 6;

  y = addParagraph(doc, '§ 5 Schlussbestimmung', y);
  y = addBody(doc, 'Dieses Testament gilt für mein gesamtes gegenwärtiges und zukünftiges Vermögen, gleich welcher Art und an welchem Ort es sich befindet.', y);
  y += 12;

  y = addSignatureBlock(doc, y);
  addTestamentFooter(doc, pg.v);

  // ═══════════════════════════════════════════
  // VORLAGE 2/4 — MEHRERE ERBEN
  // ═══════════════════════════════════════════
  doc.addPage(); pg.v++; y = 25;
  y = addSectionTitle(doc, 'VORLAGE 2/4 — EINZELTESTAMENT', y);
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text('Mehrere Erben nach Quoten', PAGE_WIDTH / 2, y - 4, { align: 'center' });
  y += 6;

  y = addBody(doc, 'Ich,', y); y += 2;
  y = addPlaceholderLine(doc, 'Name (vollständig)', y);
  y = addPlaceholderLine(doc, 'geboren am', y);
  y = addPlaceholderLine(doc, 'wohnhaft', y);
  y += 2;
  y = addBody(doc, 'errichte hiermit mein Testament und bestimme für den Fall meines Todes:', y);
  y += 8;

  y = addParagraph(doc, '§ 1 Widerruf', y);
  y = addBody(doc, 'Ich widerrufe alle früher von mir errichteten Testamente und sonstigen letztwilligen Verfügungen.', y);
  y += 8;

  y = addParagraph(doc, '§ 2 Erbeinsetzung (Erben nach Bruchteilen)', y);
  y = addBody(doc, 'Zu meinen Erben setze ich ein:', y);
  y += 4;
  y = addBody(doc, '1) ______________________________________ zu einem Anteil von ______', y); y += 4;
  y = addBody(doc, '2) ______________________________________ zu einem Anteil von ______', y); y += 4;
  y = addBody(doc, '3) ______________________________________ zu einem Anteil von ______', y); y += 4;
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  y = addWrappedText(doc, '(weitere Erben nach Bedarf ergänzen)', MARGIN_LEFT + 3, y, CONTENT_WIDTH, 5);
  y += 8;

  y = pageBreakIfNeeded(doc, y, pg);
  y = addParagraph(doc, '§ 3 Ersatz- und Anwachsungsregelung', y);
  y = addBody(doc, '(1) Sollte einer der eingesetzten Erben vor mir versterben oder die Erbschaft ausschlagen, treten dessen Abkömmlinge nach den gesetzlichen Vorschriften an dessen Stelle.', y);
  y += 4;
  y = addBody(doc, '(2) Sind keine Abkömmlinge vorhanden, wächst der freiwerdende Erbteil den übrigen Erben im Verhältnis ihrer Erbquoten an.', y);
  y += 8;

  y = addParagraph(doc, '§ 4 Teilungsanordnung (optional)', y);
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  y = addWrappedText(doc, 'Nur ausfüllen, wenn gewollt — z.B.: „Die Immobilie [Bezeichnung/Adresse] soll im Innenverhältnis auf [Name] fallen; Ausgleichung erfolgt durch …"', MARGIN_LEFT, y, CONTENT_WIDTH, 5);
  y += 3;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('________________________________________________________________________', MARGIN_LEFT, y);
  y += 4;
  doc.text('________________________________________________________________________', MARGIN_LEFT, y);
  y += 8;

  y = addParagraph(doc, '§ 5 Schlussbestimmung', y);
  y = addBody(doc, 'Dieses Testament gilt für mein gesamtes gegenwärtiges und zukünftiges Vermögen.', y);
  y += 12;

  y = addSignatureBlock(doc, y);
  addTestamentFooter(doc, pg.v);

  // ═══════════════════════════════════════════
  // VORLAGE 3/4 — VOR- UND NACHERBSCHAFT
  // ═══════════════════════════════════════════
  doc.addPage(); pg.v++; y = 25;
  y = addSectionTitle(doc, 'VORLAGE 3/4 — EINZELTESTAMENT', y);
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text('Vor- und Nacherbschaft', PAGE_WIDTH / 2, y - 4, { align: 'center' });
  y += 6;

  y = addBody(doc, 'Ich,', y); y += 2;
  y = addPlaceholderLine(doc, 'Name (vollständig)', y);
  y = addPlaceholderLine(doc, 'geboren am', y);
  y = addPlaceholderLine(doc, 'wohnhaft', y);
  y += 2;
  y = addBody(doc, 'errichte hiermit mein Testament und bestimme für den Fall meines Todes:', y);
  y += 8;

  y = addParagraph(doc, '§ 1 Widerruf', y);
  y = addBody(doc, 'Ich widerrufe alle früher von mir errichteten Testamente und sonstigen letztwilligen Verfügungen.', y);
  y += 8;

  y = addParagraph(doc, '§ 2 Vorerbe', y);
  y = addBody(doc, 'Ich setze als Vorerben ein:', y); y += 3;
  y = addPlaceholderLine(doc, 'Name (vollständig)', y);
  y = addPlaceholderLine(doc, 'geboren am', y);
  y = addPlaceholderLine(doc, 'wohnhaft', y);
  y += 6;

  y = addParagraph(doc, '§ 3 Nacherbe', y);
  y = addBody(doc, 'Als Nacherben bestimme ich:', y); y += 3;
  y = addPlaceholderLine(doc, 'Name (vollständig)', y);
  y = addPlaceholderLine(doc, 'geboren am', y);
  y = addPlaceholderLine(doc, 'wohnhaft', y);
  y += 3;
  y = addBody(doc, 'Die Nacherbfolge soll eintreten mit dem Tod des Vorerben.', y);
  y += 8;

  y = pageBreakIfNeeded(doc, y, pg);
  y = addParagraph(doc, '§ 4 Anordnung zur Verfügungsmacht', y);
  y = addBody(doc, 'Der Vorerbe ist nicht berechtigt, Nachlassgegenstände unentgeltlich zu übertragen oder durch Schenkung zu mindern. (Soweit gesetzlich zulässig.)', y);
  y += 8;

  y = addParagraph(doc, '§ 5 Schlussbestimmung', y);
  y = addBody(doc, 'Dieses Testament gilt für mein gesamtes gegenwärtiges und zukünftiges Vermögen.', y);
  y += 12;

  y = addSignatureBlock(doc, y);
  addTestamentFooter(doc, pg.v);

  // ═══════════════════════════════════════════
  // VORLAGE 4/4 — BERLINER TESTAMENT
  // ═══════════════════════════════════════════
  doc.addPage(); pg.v++; y = 25;
  y = addSectionTitle(doc, 'VORLAGE 4/4 — BERLINER TESTAMENT', y);
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text('Gegenseitige Alleinerbeneinsetzung + Schlusserben', PAGE_WIDTH / 2, y - 4, { align: 'center' });
  y += 4;

  // Spezieller Formhinweis
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(180, 0, 0);
  y = addWrappedText(doc, 'WICHTIG: Dieses gemeinschaftliche Testament ist nur wirksam, wenn der gesamte Text von einem Ehegatten/Lebenspartner eigenhändig handschriftlich geschrieben wird. Beide Ehegatten/Lebenspartner müssen eigenhändig unterschreiben.', MARGIN_LEFT, y, CONTENT_WIDTH, 5);
  doc.setTextColor(0);
  y += 8;

  y = addBody(doc, 'Wir, die Eheleute / eingetragenen Lebenspartner', y); y += 4;
  y = addPlaceholderLine(doc, 'Partner 1 — Name (vollständig)', y);
  y = addPlaceholderLine(doc, 'geboren am', y);
  y = addPlaceholderLine(doc, 'wohnhaft', y);
  y += 2;
  y = addBody(doc, 'und', y); y += 4;
  y = addPlaceholderLine(doc, 'Partner 2 — Name (vollständig)', y);
  y = addPlaceholderLine(doc, 'geboren am', y);
  y = addPlaceholderLine(doc, 'wohnhaft', y);
  y += 2;
  y = addBody(doc, 'errichten hiermit folgendes gemeinschaftliches Testament:', y);
  y += 8;

  y = addParagraph(doc, '§ 1 Widerruf', y);
  y = addBody(doc, 'Wir widerrufen alle früher von uns errichteten Testamente und sonstigen letztwilligen Verfügungen.', y);
  y += 8;

  y = pageBreakIfNeeded(doc, y, pg);
  y = addParagraph(doc, '§ 2 Gegenseitige Alleinerbeneinsetzung', y);
  y = addBody(doc, 'Wir setzen uns hiermit gegenseitig zu alleinigen Erben des zuerst von uns Versterbenden ein.', y);
  y += 8;

  y = addParagraph(doc, '§ 3 Schlusserben', y);
  y = addBody(doc, 'Schlusserben des Letztversterbenden von uns sind unsere Abkömmlinge:', y);
  y += 4;
  y = addBody(doc, '1) ______________________________________, geboren am ______________', y); y += 4;
  y = addBody(doc, '2) ______________________________________, geboren am ______________', y); y += 4;
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  y = addWrappedText(doc, '(weitere nach Bedarf ergänzen)', MARGIN_LEFT + 3, y, CONTENT_WIDTH, 5);
  y += 3;
  y = addBody(doc, 'zu gleichen Teilen.', y); y += 3;
  y = addBody(doc, 'Verstirbt ein Abkömmling vor dem Letztversterbenden, treten dessen Abkömmlinge nach den gesetzlichen Vorschriften an seine Stelle.', y);
  y += 8;

  y = pageBreakIfNeeded(doc, y, pg);
  y = addParagraph(doc, '§ 4 Pflichtteilsstrafklausel', y);
  y = addBody(doc, 'Verlangt ein Abkömmling nach dem Tod des Erstversterbenden den Pflichtteil oder macht Pflichtteils- bzw. Pflichtteilsergänzungsansprüche geltend, so soll dieser Abkömmling auch nach dem Tod des Letztversterbenden lediglich den Pflichtteil erhalten.', y);
  y += 8;

  y = addParagraph(doc, '§ 5 Wechselbezüglichkeit und Bindungswirkung', y);
  y = addBody(doc, 'Die vorstehenden Verfügungen sind wechselbezüglich. Nach dem Tod des Erstversterbenden ist der Überlebende an die wechselbezüglichen Verfügungen gebunden, soweit gesetzlich vorgesehen.', y);
  y += 8;

  y = addParagraph(doc, '§ 6 Schlussbestimmung', y);
  y = addBody(doc, 'Dieses Testament gilt für unser gesamtes Vermögen.', y);
  y += 12;

  // Zwei Unterschriften
  y = pageBreakIfNeeded(doc, y, pg);
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text('Ort, Datum: __________________, den ______________', MARGIN_LEFT, y);
  y += 14;
  doc.text('(Unterschrift Partner 1)', MARGIN_LEFT, y);
  y += 2;
  doc.text('__________________________', MARGIN_LEFT, y);
  y += 12;
  doc.text('(Unterschrift Partner 2 — Zustimmungsvermerk empfohlen)', MARGIN_LEFT, y);
  y += 6;
  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.text('„Ich schließe mich den vorstehenden Verfügungen an."', MARGIN_LEFT, y);
  y += 6;
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text('__________________________', MARGIN_LEFT, y);

  addTestamentFooter(doc, pg.v);

  // ═══════════════════════════════════════════
  // SCHLUSSSEITE — Hinweis zur Hinterlegung
  // ═══════════════════════════════════════════
  doc.addPage(); pg.v++; y = 25;
  y = addSectionTitle(doc, 'HINWEIS ZUR HINTERLEGUNG', y);

  const schluss = [
    '• Das Zentrale Testamentsregister (ZTR) wird seit 2012 von der Bundesnotarkammer im gesetzlichen Auftrag geführt und stellt sicher, dass amtlich verwahrte oder notarielle Testamente im Sterbefall gefunden werden.',
    '• Privat aufbewahrte Testamente können nicht registriert werden.',
    '• Eigenhändige Testamente können registriert werden, wenn sie in die besondere amtliche Verwahrung beim Nachlassgericht (Amtsgericht) gegeben werden; die Registrierung nimmt das Gericht vor.',
    '• Alternativ kann ein Testament notariell beurkundet werden; der Notar veranlasst die Registrierung.',
  ];
  for (const t of schluss) {
    y = addBody(doc, t, y);
    y += 5;
  }

  addTestamentFooter(doc, pg.v);

  return doc;
}
