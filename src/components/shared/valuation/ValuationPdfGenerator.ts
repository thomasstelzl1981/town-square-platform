/**
 * generateValuationPdf — Premium Kurzgutachten PDF V10.0 (12 Seiten)
 * 
 * CI-A "SoT Business Premium" Standard.
 * Pure data-driven, no DOM dependency. Lazy-loaded jsPDF.
 * Reusable blocks from pdfPremiumBlocks.ts.
 * 
 * Structure:
 *   1. Deckblatt (Cover + KPIs + Gebäudeangaben)
 *   2. Inhaltsverzeichnis + Bewertungsüberblick
 *   3. Objektdaten + Grundbuch
 *   4. Standortanalyse
 *   5. Bodenwert + Restnutzungsdauer
 *   6. Ertragswert (Marktwert)
 *   7. Ertragswert (Beleihungswert)
 *   8. Sachwert
 *   9. Vergleichswert + KI-Quellen
 *  10. Finanzierung + Stress-Tests
 *  11. Ergebnisübersicht
 *  12. Rechtliches + Audit
 * 
 * @version 10.0.0
 */
import { getJsPDF } from '@/lib/lazyJspdf';
import { PAGE, COLOR, TYPO, SPACING, BRAND } from '@/lib/pdf/pdfCiTokens';
import {
  drawSectionTitle, drawKpiRow, drawTable, drawInfoCard,
  drawBodyText, ensurePageBreak, addFootersToAllPages,
  EUR, PCT, NUM,
} from '@/lib/pdf/pdfCiKit';
import {
  drawPremiumCover, drawTableOfContents, drawResultBox,
  drawAuditTrail, drawLegalDisclaimer, drawPropertyTable,
  drawNumberedSection, addImageSafe, drawNoData,
  type TocEntry, type PropertyRow,
} from '@/lib/pdf/pdfPremiumBlocks';
import type {
  ValueBand, ValuationMethodResult, FinancingScenario, StressTestResult,
  LienProxy, DataQuality, CompStats, CompPosting, LocationAnalysis,
  CanonicalPropertySnapshot, LegalTitleBlock, ValuationSourceMode,
  BeleihungswertResult, GeminiResearchResult,
} from '@/engines/valuation/spec';

export interface ValuationPdfData {
  snapshot: CanonicalPropertySnapshot;
  valueBand: ValueBand;
  methods: ValuationMethodResult[];
  financing: FinancingScenario[];
  stressTests: StressTestResult[];
  lienProxy: LienProxy | null;
  dataQuality: DataQuality | null;
  compStats: CompStats | null;
  comps: CompPosting[];
  location: LocationAnalysis | null;
  executiveSummary: string;
  caseId: string;
  generatedAt: string;
  sourceMode?: ValuationSourceMode;
  legalTitle?: LegalTitleBlock | null;
  beleihungswert?: BeleihungswertResult | null;
  geminiResearch?: GeminiResearchResult | null;
}

// ─── Image Helpers ───────────────────────────────────────────────────

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

async function prefetchMapImages(location: LocationAnalysis | null): Promise<{
  micro: string | null; macro: string | null; streetView: string | null;
}> {
  if (!location) return { micro: null, macro: null, streetView: null };
  const [micro, macro, streetView] = await Promise.all([
    location.microMapBase64 || (location.microMapUrl ? fetchImageAsBase64(location.microMapUrl) : null),
    location.macroMapBase64 || (location.macroMapUrl ? fetchImageAsBase64(location.macroMapUrl) : null),
    location.streetViewBase64 || (location.streetViewUrl ? fetchImageAsBase64(location.streetViewUrl) : null),
  ]);
  return { micro, macro, streetView };
}

// ─── Internal Helpers ────────────────────────────────────────────────

function setFont(doc: any, spec: { size: number; style: string }) {
  doc.setFontSize(spec.size);
  doc.setFont(TYPO.FONT_FAMILY, spec.style);
}
function setColor(doc: any, color: readonly [number, number, number]) {
  doc.setTextColor(color[0], color[1], color[2]);
}
function setFillColor(doc: any, color: readonly [number, number, number]) {
  doc.setFillColor(color[0], color[1], color[2]);
}

const ML = PAGE.MARGIN_LEFT;
const CW = PAGE.CONTENT_WIDTH;

/** Safe number formatting — returns "–" for 0/null/undefined */
function safeEur(v: number | null | undefined): string {
  return (v && v > 0) ? EUR(v) : '–';
}
function safePct(v: number | null | undefined): string {
  return (v && v > 0) ? PCT(v) : '–';
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════

export async function generateValuationPdf(data: ValuationPdfData): Promise<void> {
  const [jsPDF, mapImages] = await Promise.all([
    getJsPDF(),
    prefetchMapImages(data.location),
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 0;

  const caseShort = data.caseId.slice(0, 8);
  const dateStr = new Date(data.generatedAt).toLocaleDateString('de-DE');
  const addressLine = [data.snapshot.address, data.snapshot.postalCode, data.snapshot.city].filter(Boolean).join(', ');
  const objectSummary = [
    data.snapshot.objectType?.toUpperCase(),
    data.snapshot.yearBuilt ? `Baujahr ${data.snapshot.yearBuilt}` : null,
    data.snapshot.livingAreaSqm ? `${NUM(data.snapshot.livingAreaSqm)} m²` : null,
    data.snapshot.units ? `${data.snapshot.units} WE` : null,
  ].filter(Boolean).join(' · ');

  const ertragMethod = data.methods.find(m => m.method === 'ertrag');
  const sachwertMethod = data.methods.find(m => m.method === 'sachwert_proxy');
  const compMethod = data.methods.find(m => m.method === 'comp_proxy');
  const ertragParams = ertragMethod?.params ?? {};
  const sachwertParams = sachwertMethod?.params ?? {};
  const ertragValue = ertragMethod?.value ?? 0;
  const sachwertValue = sachwertMethod?.value ?? 0;
  const compValue = compMethod?.value ?? 0;
  const rnd = ertragParams.restnutzungsdauer || ertragParams.rnd;

  // ═══════════════════════════════════════
  // SEITE 1: DECKBLATT
  // ═══════════════════════════════════════

  y = drawPremiumCover(doc, {
    documentType: 'KURZGUTACHTEN · VERKEHRSWERTERMITTLUNG',
    title: 'Immobilienbewertung',
    addressLine: addressLine || 'Immobilienbewertung',
    objectSummary,
    primaryKpi: { label: 'MARKTWERT (§194 BauGB)', value: EUR(data.valueBand.p50) },
    secondaryKpi: data.beleihungswert ? {
      label: 'BELEIHUNGSWERT (BelWertV)',
      value: EUR(data.beleihungswert.beleihungswert),
    } : undefined,
    metaLines: [
      `Stichtag: ${dateStr}  ·  Case ${caseShort}`,
      data.sourceMode === 'SSOT_FINAL' ? 'Datenbasis: SSOT (Final) · Daten verifiziert' : 'Datenbasis: Exposé Draft',
      `${BRAND.COMPANY_NAME} · ${BRAND.CONFIDENTIAL}`,
    ],
    heroImageBase64: mapImages.streetView,
  });

  // Compact property facts on cover page
  const coverFacts: PropertyRow[] = [
    { label: 'Adresse', value: addressLine || '–' },
    { label: 'Objektart', value: data.snapshot.objectType?.toUpperCase() || '–' },
    { label: 'Baujahr', value: data.snapshot.yearBuilt?.toString() || '–' },
    { label: 'Wohnfläche', value: data.snapshot.livingAreaSqm ? `${NUM(data.snapshot.livingAreaSqm)} m²` : '–' },
    { label: 'Grundstück', value: data.snapshot.plotAreaSqm ? `${NUM(data.snapshot.plotAreaSqm)} m²` : '–' },
    { label: 'Einheiten', value: data.snapshot.units?.toString() || '–' },
  ];
  if (y < 240) {
    y = drawPropertyTable(doc, y + 4, coverFacts);
  }

  // ═══════════════════════════════════════
  // SEITE 2: INHALTSVERZEICHNIS + ÜBERBLICK
  // ═══════════════════════════════════════
  doc.addPage();
  y = PAGE.MARGIN_TOP + 8;

  const tocEntries: TocEntry[] = [
    { number: '1', title: 'Objektdaten & Grundbuch', page: 3 },
    { number: '2', title: 'Standortanalyse', page: 4 },
    { number: '3', title: 'Bodenwert & Restnutzungsdauer', page: 5 },
    { number: '4', title: 'Ertragswert (Marktwert)', page: 6 },
    { number: '5', title: 'Ertragswert (Beleihungswert)', page: 7 },
    { number: '6', title: 'Sachwert', page: 8 },
    { number: '7', title: 'Vergleichswert & KI-Quellen', page: 9 },
    { number: '8', title: 'Finanzierung & Stress-Tests', page: 10 },
    { number: '9', title: 'Ergebnisübersicht', page: 11 },
    { number: '10', title: 'Rechtliche Hinweise & Audit', page: 12 },
  ];
  y = drawTableOfContents(doc, y, tocEntries);

  // Bewertungsüberblick (replaces old "Executive Summary" — no Empfehlung!)
  y += 4;
  y = drawNumberedSection(doc, y, '★', 'Bewertungsüberblick', 'Zusammenfassung der Wertermittlung');

  // Data quality KPIs
  if (data.dataQuality) {
    y = drawKpiRow(doc, y, [
      { label: 'Vollständigkeit', value: `${data.dataQuality.completenessPercent}%`, tone: data.dataQuality.completenessPercent >= 80 ? 'success' : 'warning' },
      { label: 'Verifiziert', value: `${data.dataQuality.verifiedCount}`, tone: 'success' },
      { label: 'Abgeleitet', value: `${data.dataQuality.derivedCount}`, tone: data.dataQuality.derivedCount > 3 ? 'warning' : 'default' },
      { label: 'Fehlend', value: `${data.dataQuality.missingCount}`, tone: data.dataQuality.missingCount > 0 ? 'danger' : 'success' },
    ]);
  }

  // Confidence band info
  y = drawInfoCard(doc, y, 'Wertband', [
    `Marktwert (P50): ${EUR(data.valueBand.p50)}`,
    `Bandbreite (P25–P75): ${EUR(data.valueBand.p25)} – ${EUR(data.valueBand.p75)}`,
    `Konfidenz: ${data.valueBand.confidence} (${Math.round((data.valueBand.confidenceScore ?? 0) * 100)}%)`,
  ]);

  // Methods overview
  if (data.methods.length > 0) {
    const methodRows = data.methods.map(m => [
      m.method.replace('_', ' ').replace(/^\w/, c => c.toUpperCase()),
      safeEur(m.value),
      `${m.confidence} (${Math.round((m.confidenceScore ?? 0) * 100)}%)`,
    ]);
    y = drawTable(doc, y, {
      headers: ['Verfahren', 'Wert', 'Konfidenz'],
      rows: methodRows,
      colWidths: [60, 50, CW - 110],
    });
  }

  // ═══════════════════════════════════════
  // SEITE 3: OBJEKTDATEN & GRUNDBUCH
  // ═══════════════════════════════════════
  doc.addPage();
  y = PAGE.MARGIN_TOP + 8;
  y = drawNumberedSection(doc, y, '1', 'Objektdaten', 'Gebäudeangaben, Ausstattung und Grundstück');

  const objRows: PropertyRow[] = [
    { label: 'Adresse', value: addressLine || '–' },
    { label: 'Objektart', value: data.snapshot.objectType?.toUpperCase() || '–' },
    { label: 'Baujahr', value: data.snapshot.yearBuilt?.toString() || '–' },
    { label: 'Wohnfläche', value: data.snapshot.livingAreaSqm ? `${NUM(data.snapshot.livingAreaSqm)} m²` : '–' },
    { label: 'Grundstücksfläche', value: data.snapshot.plotAreaSqm ? `${NUM(data.snapshot.plotAreaSqm)} m²` : '–' },
    { label: 'Nutzfläche', value: data.snapshot.usableAreaSqm ? `${NUM(data.snapshot.usableAreaSqm)} m²` : '–' },
    { label: 'Gewerbefläche', value: data.snapshot.commercialAreaSqm ? `${NUM(data.snapshot.commercialAreaSqm)} m²` : '–' },
    { label: 'Wohneinheiten', value: data.snapshot.units?.toString() || '–' },
    { label: 'Zimmer', value: data.snapshot.rooms?.toString() || '–' },
    { label: 'Geschosse', value: data.snapshot.floors?.toString() || '–' },
    { label: 'Stellplätze', value: data.snapshot.parkingSpots?.toString() || '–' },
    { label: 'Zustand', value: data.snapshot.condition || '–' },
    { label: 'Energieeffizienz', value: data.snapshot.energyClass || '–' },
  ].filter(r => r.value !== '–');
  y = drawPropertyTable(doc, y, objRows, 'Gebäudeangaben');

  // Grundbuch section
  if (data.legalTitle && data.sourceMode === 'SSOT_FINAL') {
    y += 4;
    setFont(doc, { size: 9, style: 'bold' });
    setColor(doc, COLOR.INK);
    doc.text('Grundbuch', ML, y);
    y += 5;

    const legalRows: PropertyRow[] = [];
    if (data.legalTitle.landRegisterCourt) legalRows.push({ label: 'Amtsgericht', value: data.legalTitle.landRegisterCourt });
    if (data.legalTitle.landRegisterSheet) legalRows.push({ label: 'Grundbuchblatt', value: data.legalTitle.landRegisterSheet });
    if (data.legalTitle.parcelNumber) legalRows.push({ label: 'Flurstück', value: data.legalTitle.parcelNumber });
    if (data.legalTitle.ownershipSharePercent != null) legalRows.push({ label: 'MEA', value: `${data.legalTitle.ownershipSharePercent}%` });
    if (data.legalTitle.wegFlag) legalRows.push({ label: 'WEG', value: `Ja${data.legalTitle.teNumber ? ` (TE: ${data.legalTitle.teNumber})` : ''}` });
    if (legalRows.length > 0) {
      y = drawPropertyTable(doc, y, legalRows);
    }

    y = drawInfoCard(doc, y, 'Dokumentstatus', [
      `Grundbuchauszug: ${data.legalTitle.landRegisterExtractAvailable ? '✓ Vorhanden' : '✗ Nicht vorhanden'}`,
      `Teilungserklärung: ${data.legalTitle.partitionDeclarationAvailable ? '✓ Vorhanden' : '✗ Nicht vorhanden'}`,
    ]);
  }

  // ═══════════════════════════════════════
  // SEITE 4: STANDORTANALYSE
  // ═══════════════════════════════════════
  doc.addPage();
  y = PAGE.MARGIN_TOP + 8;
  y = drawNumberedSection(doc, y, '2', 'Standortanalyse', 'Lage, Umfeld & Erreichbarkeit');

  if (data.location) {
    // Lage-Score
    y = drawKpiRow(doc, y, [
      { label: 'Lage-Score', value: `${data.location.overallScore}/100`, tone: data.location.overallScore >= 70 ? 'success' : data.location.overallScore >= 40 ? 'warning' : 'danger' },
    ]);

    // Map images side by side
    const maps = [
      { label: 'MIKROLAGE', img: mapImages.micro },
      { label: 'MAKROLAGE', img: mapImages.macro },
    ].filter(m => m.img);

    if (maps.length > 0) {
      y = ensurePageBreak(doc, y, 55);
      const imgW = maps.length === 1 ? CW : (CW - 4) / 2;
      const imgH = imgW * 0.65;
      for (let i = 0; i < maps.length; i++) {
        const x = ML + i * (imgW + 4);
        setFont(doc, TYPO.CAPTION);
        setColor(doc, COLOR.MUTED);
        doc.text(maps[i].label, x, y);
        addImageSafe(doc, maps[i].img, x, y + 3, imgW, imgH);
      }
      y += 3 + imgH + 4;
    }

    // Dimension scores
    if (data.location.dimensions?.length > 0) {
      const dimRows = data.location.dimensions.map(d => [d.label, `${d.score}/10`]);
      y = drawTable(doc, y, { headers: ['Dimension', 'Score'], rows: dimRows, colWidths: [CW - 30, 30], alignRight: [1] });
    }

    // Reachability
    if (data.location.reachability?.length > 0) {
      y += 2;
      const reachRows = data.location.reachability.map(r => [
        r.destinationName,
        r.drivingMinutes != null ? `${r.drivingMinutes} min` : '–',
        r.transitMinutes != null ? `${r.transitMinutes} min` : '–',
      ]);
      y = drawTable(doc, y, { headers: ['Ziel', 'PKW', 'ÖPNV'], rows: reachRows, colWidths: [CW - 50, 25, 25], alignRight: [1, 2] });
    }

    // Narrative
    if (data.location.narrative) {
      y = drawBodyText(doc, y, data.location.narrative);
    }
  } else {
    y = drawNoData(doc, y, 'Keine Standortanalyse verfügbar — bitte Adresse vervollständigen');
  }

  // ═══════════════════════════════════════
  // SEITE 5: BODENWERT & RESTNUTZUNGSDAUER
  // ═══════════════════════════════════════
  doc.addPage();
  y = PAGE.MARGIN_TOP + 8;
  y = drawNumberedSection(doc, y, '3', 'Bodenwert & Restnutzungsdauer', 'Grundstückswert und wirtschaftliche Restnutzungsdauer');

  const bodenRows: string[][] = [];
  if (ertragParams.plotAreaSqm) bodenRows.push(['Grundstücksfläche', `${NUM(Number(ertragParams.plotAreaSqm))} m²`]);
  if (data.geminiResearch?.bodenrichtwert) {
    bodenRows.push(['Bodenrichtwert (BRW)', `${data.geminiResearch.bodenrichtwert.bodenrichtwertEurSqm.toFixed(2)} €/m²`]);
    bodenRows.push(['Nutzungsart', data.geminiResearch.bodenrichtwert.artDerNutzung]);
    bodenRows.push(['Quelle', data.geminiResearch.bodenrichtwert.quelle]);
  }
  if (ertragParams.bodenwertProxy) bodenRows.push(['BODENWERT', EUR(Number(ertragParams.bodenwertProxy))]);

  if (bodenRows.length > 0) {
    y = drawTable(doc, y, { headers: ['Position', 'Wert'], rows: bodenRows, colWidths: [CW / 2, CW / 2], alignRight: [1] });
  } else {
    y = drawNoData(doc, y, 'Keine Bodenrichtwertdaten verfügbar');
  }

  y += 6;
  setFont(doc, { size: 11, style: 'bold' });
  setColor(doc, COLOR.INK);
  doc.text('Restnutzungsdauer (RND)', ML, y);
  y += 6;

  const rndRows: string[][] = [];
  if (ertragParams.gesamtnutzungsdauer) rndRows.push(['Gesamtnutzungsdauer (GND)', `${ertragParams.gesamtnutzungsdauer} Jahre`]);
  if (ertragParams.alter) rndRows.push(['Alter', `${ertragParams.alter} Jahre`]);
  if (ertragParams.modernisierungsbonus) rndRows.push(['Modernisierungsbonus', `+${ertragParams.modernisierungsbonus} Jahre`]);
  if (rnd) rndRows.push(['RESTNUTZUNGSDAUER (RND)', `${rnd} Jahre`]);
  if (rndRows.length > 0) {
    y = drawTable(doc, y, { headers: ['Position', 'Wert'], rows: rndRows, colWidths: [CW / 2, CW / 2], alignRight: [1] });
  }

  // ═══════════════════════════════════════
  // SEITE 6: ERTRAGSWERT (MARKTWERT)
  // ═══════════════════════════════════════
  doc.addPage();
  y = PAGE.MARGIN_TOP + 8;
  y = drawNumberedSection(doc, y, '4', 'Ertragswert (Marktwert)', 'Ertragswertverfahren nach ImmoWertV');

  if (ertragValue > 0) {
    // Rohertrag
    const mietInfo = Number(ertragParams.netColdRentYearly) || 0;
    if (mietInfo > 0) {
      y = drawKpiRow(doc, y, [
        { label: 'Jahresmiete (Ist)', value: EUR(mietInfo), tone: 'accent' },
        { label: '€/m²·mtl.', value: data.snapshot.netColdRentPerSqm ? `${data.snapshot.netColdRentPerSqm.toFixed(2)} €` : '–' },
      ]);
    }

    // BWK
    setFont(doc, { size: 10, style: 'bold' });
    setColor(doc, COLOR.INK);
    doc.text('Bewirtschaftungskosten (BWK)', ML, y);
    y += 5;

    const bwkRows: string[][] = [];
    if (ertragParams.verwaltung) bwkRows.push(['Verwaltung', EUR(Number(ertragParams.verwaltung))]);
    if (ertragParams.instandhaltung) bwkRows.push(['Instandhaltung', EUR(Number(ertragParams.instandhaltung))]);
    if (ertragParams.mietausfallwagnis) bwkRows.push(['Mietausfallwagnis', EUR(Number(ertragParams.mietausfallwagnis))]);
    if (ertragParams.nichtUmlagefaehig) bwkRows.push(['Modernisierungsrisiko', EUR(Number(ertragParams.nichtUmlagefaehig))]);
    if (ertragParams.bewirtschaftungAbzug) bwkRows.push(['BWK Gesamt', EUR(Number(ertragParams.bewirtschaftungAbzug))]);
    if (bwkRows.length > 0) {
      y = drawTable(doc, y, { headers: ['Position', 'Betrag p.a.'], rows: bwkRows, colWidths: [CW / 2, CW / 2], alignRight: [1] });
    }

    // Ertragsableitung
    y += 3;
    setFont(doc, { size: 10, style: 'bold' });
    setColor(doc, COLOR.INK);
    doc.text('Ertragsableitung', ML, y);
    y += 5;

    const ablRows: string[][] = [
      ['Reinertrag', safeEur(Number(ertragParams.reinertrag))],
    ];
    if (data.geminiResearch?.liegenschaftszins) {
      ablRows.push(['Liegenschaftszins (MWT)', PCT(data.geminiResearch.liegenschaftszins.marktwertZins)]);
      ablRows.push(['Quelle', data.geminiResearch.liegenschaftszins.quelle]);
    } else if (ertragParams.liegenschaftszins) {
      ablRows.push(['Liegenschaftszins', safePct(Number(ertragParams.liegenschaftszins))]);
    }
    ablRows.push(['RND', `${rnd || '–'} Jahre`]);
    if (ertragParams.barwertfaktor) ablRows.push(['Barwertfaktor', (Number(ertragParams.barwertfaktor)).toFixed(4)]);
    if (ertragParams.bodenwertverz) ablRows.push(['Bodenwertverz.', EUR(Number(ertragParams.bodenwertverz))]);
    ablRows.push(['', '']);
    ablRows.push(['ERTRAGSWERT (MWT)', EUR(ertragValue)]);
    y = drawTable(doc, y, { headers: ['Position', 'Wert'], rows: ablRows, colWidths: [CW / 2, CW / 2], alignRight: [1] });
  } else {
    y = drawNoData(doc, y, 'Ertragswert konnte nicht berechnet werden — Mietdaten fehlen');
  }

  // ═══════════════════════════════════════
  // SEITE 7: ERTRAGSWERT (BELEIHUNGSWERT)
  // ═══════════════════════════════════════
  doc.addPage();
  y = PAGE.MARGIN_TOP + 8;
  y = drawNumberedSection(doc, y, '5', 'Ertragswert (Beleihungswert)', 'Berechnung nach BelWertV — konservative Ansätze');

  if (data.beleihungswert && data.beleihungswert.ertragswertBelwertv > 0) {
    y = drawInfoCard(doc, y, 'BelWertV-Grundsätze', [
      'Liegenschaftszins gem. §12 BelWertV: mindestens 5,0% für Wohnimmobilien',
      'Konservative BWK-Ansätze gem. BelWertV — höhere Abzüge als bei Marktwertermittlung',
      'Sicherheitsabschlag auf Ertragswert zur Ermittlung des nachhaltigen Werts',
    ]);

    const bwtRows: string[][] = [
      ['Liegenschaftszins (BelWertV §12)', '5,0 %'],
      ['BWK (konservativ)', safeEur(data.beleihungswert.bwkBelwertv || 0)],
      ['Sicherheitsabschlag', safePct(data.beleihungswert.sicherheitsabschlag)],
      ['', ''],
      ['ERTRAGSWERT (BWT)', EUR(data.beleihungswert.ertragswertBelwertv)],
    ];
    y = drawTable(doc, y, { headers: ['Position', 'Wert'], rows: bwtRows, colWidths: [CW / 2, CW / 2], alignRight: [1] });
  } else {
    y = drawNoData(doc, y, 'Beleihungswert-Berechnung nicht verfügbar');
  }

  // ═══════════════════════════════════════
  // SEITE 8: SACHWERT
  // ═══════════════════════════════════════
  doc.addPage();
  y = PAGE.MARGIN_TOP + 8;
  y = drawNumberedSection(doc, y, '6', 'Sachwert', 'Sachwertverfahren (NHK 2010)');

  if (sachwertValue > 0) {
    const swRows: string[][] = [];
    if (sachwertParams.nhkPerSqm) swRows.push(['NHK 2010 Normalherstellungskosten', `${NUM(Number(sachwertParams.nhkPerSqm))} €/m²`]);
    if (sachwertParams.bpiFactor) swRows.push(['Baupreisindex (BPI 2026)', (Number(sachwertParams.bpiFactor)).toFixed(4)]);
    if (sachwertParams.herstellkosten) swRows.push(['Herstellungskosten', EUR(Number(sachwertParams.herstellkosten))]);
    if (sachwertParams.alterswertminderung) swRows.push(['Alterswertminderung', `−${EUR(Number(sachwertParams.alterswertminderung))}`]);
    if (sachwertParams.zeitwertGebaeude) swRows.push(['Zeitwert Gebäude', EUR(Number(sachwertParams.zeitwertGebaeude))]);
    if (ertragParams.bodenwertProxy) swRows.push(['+ Bodenwert', EUR(Number(ertragParams.bodenwertProxy))]);
    swRows.push(['', '']);
    swRows.push(['SACHWERT (MWT)', EUR(sachwertValue)]);
    y = drawTable(doc, y, { headers: ['Position', 'Wert'], rows: swRows, colWidths: [CW / 2, CW / 2], alignRight: [1] });

    // Sachwert BWT
    if (data.beleihungswert && data.beleihungswert.sachwertBelwertv > 0) {
      y += 4;
      setFont(doc, { size: 10, style: 'bold' });
      setColor(doc, COLOR.INK);
      doc.text('Sachwert (Beleihungswert)', ML, y);
      y += 5;
      const swBwtRows: string[][] = [
        ['Sachwert vor Abschlag', EUR(sachwertValue)],
        ['Sicherheitsabschlag 10%', `−${EUR(Math.round(sachwertValue * 0.1))}`],
        ['', ''],
        ['SACHWERT (BWT)', EUR(data.beleihungswert.sachwertBelwertv)],
      ];
      y = drawTable(doc, y, { headers: ['Position', 'Wert'], rows: swBwtRows, colWidths: [CW / 2, CW / 2], alignRight: [1] });
    }
  } else {
    y = drawNoData(doc, y, 'Sachwertberechnung nicht möglich — fehlende NHK-Daten');
  }

  // ═══════════════════════════════════════
  // SEITE 9: VERGLEICHSWERT & KI-QUELLEN
  // ═══════════════════════════════════════
  doc.addPage();
  y = PAGE.MARGIN_TOP + 8;
  y = drawNumberedSection(doc, y, '7', 'Vergleichswert & KI-Quellen', 'Marktdaten aus Immobilienportalen und KI-Recherche');

  if (data.compStats && data.compStats.count > 0) {
    y = drawKpiRow(doc, y, [
      { label: 'Median €/m²', value: EUR(data.compStats.medianPriceSqm), tone: 'accent' },
      { label: 'P25 €/m²', value: EUR(data.compStats.p25PriceSqm) },
      { label: 'P75 €/m²', value: EUR(data.compStats.p75PriceSqm) },
      { label: 'Objekte', value: `${data.compStats.dedupedCount} / ${data.compStats.count}` },
    ]);

    const topComps = data.comps.slice(0, 10);
    if (topComps.length > 0) {
      const compRows = topComps.map(c => [
        c.portal || '–',
        c.title?.slice(0, 25) || '–',
        EUR(c.price),
        `${c.area} m²`,
        EUR(c.priceSqm),
        c.distanceKm != null ? `${c.distanceKm.toFixed(1)} km` : '–',
      ]);
      y = drawTable(doc, y, {
        headers: ['Portal', 'Objekt', 'Preis', 'Fläche', '€/m²', 'Entf.'],
        rows: compRows,
        colWidths: [22, CW - 132, 28, 22, 28, 22],
        alignRight: [2, 4, 5],
      });
    }

    if (compValue > 0) {
      y += 2;
      y = drawKpiRow(doc, y, [
        { label: 'VERGLEICHSWERT (MWT)', value: EUR(compValue), tone: 'accent' },
      ]);
    }
  } else {
    y = drawNoData(doc, y, 'Keine Vergleichsobjekte im Radius gefunden');
  }

  // KI Research data
  if (data.geminiResearch) {
    y += 4;
    setFont(doc, { size: 10, style: 'bold' });
    setColor(doc, COLOR.INK);
    doc.text('KI-recherchierte Marktdaten', ML, y);
    y += 5;

    if (data.geminiResearch.liegenschaftszins) {
      const lz = data.geminiResearch.liegenschaftszins;
      y = drawInfoCard(doc, y, 'Liegenschaftszins', [
        `Empfohlen (MWT): ${PCT(lz.marktwertZins)}  ·  Spanne: ${PCT(lz.min)} – ${PCT(lz.max)}`,
        `BelWertV: 5,0 %  ·  Quelle: ${lz.quelle}`,
      ]);
    }

    if (data.geminiResearch.vergleichsmieten) {
      const vm = data.geminiResearch.vergleichsmieten;
      y = drawInfoCard(doc, y, 'Vergleichsmieten', [
        `Min: ${vm.mieteMin.toFixed(2)} €/m²  ·  Median: ${vm.mieteMedian.toFixed(2)} €/m²  ·  Max: ${vm.mieteMax.toFixed(2)} €/m²`,
        `Quelle: ${vm.quelle}`,
      ]);
    }

    y += 2;
    y = drawBodyText(doc, y, 'KI-generierte Marktdaten basieren auf öffentlich verfügbaren Quellen und können von amtlichen Werten abweichen. Die Quellen sind jeweils dokumentiert.');
  }

  // ═══════════════════════════════════════
  // SEITE 10: FINANZIERUNG & STRESS-TESTS
  // ═══════════════════════════════════════
  doc.addPage();
  y = PAGE.MARGIN_TOP + 8;
  y = drawNumberedSection(doc, y, '8', 'Finanzierbarkeit', 'Szenarienvergleich und Sensitivitätsanalyse');

  if (data.financing.length > 0) {
    const finRows = data.financing.map(f => {
      const zinsStr = f.interestRate > 0 ? PCT(f.interestRate) : '–';
      const tilgStr = f.repaymentRate > 0 ? PCT(f.repaymentRate) : '–';
      return [
        f.name,
        f.ltv > 0 ? PCT(f.ltv) : '–',
        f.loanAmount > 0 ? EUR(f.loanAmount) : '–',
        `${zinsStr} / ${tilgStr}`,
        f.monthlyRate > 0 ? EUR(f.monthlyRate) : '–',
        f.cashflowAfterDebt != null ? EUR(f.cashflowAfterDebt) : '–',
        f.trafficLight === 'green' ? '✓' : f.trafficLight === 'yellow' ? '⚠' : '✗',
      ];
    });
    y = drawTable(doc, y, {
      headers: ['Szenario', 'LTV', 'Darlehen', 'Zins/Tilg.', 'Rate/mtl.', 'CF n. KD', ''],
      rows: finRows,
      colWidths: [28, 18, 28, 28, 25, 28, 15],
      alignRight: [1, 2, 3, 4, 5],
    });

    // Stress Tests
    if (data.stressTests.length > 0) {
      y += 6;
      setFont(doc, { size: 10, style: 'bold' });
      setColor(doc, COLOR.INK);
      doc.text('Stress-Tests (Sensitivitätsanalyse)', ML, y);
      y += 5;
      const stressRows = data.stressTests.map(st => [
        st.label,
        st.monthlyRate > 0 ? EUR(st.monthlyRate) : '–',
        st.dscr?.toFixed(2) || '–',
        st.trafficLight === 'green' ? '✓ Tragbar' : st.trafficLight === 'yellow' ? '⚠ Grenzwertig' : '✗ Kritisch',
      ]);
      y = drawTable(doc, y, {
        headers: ['Szenario', 'Rate/mtl.', 'DSCR', 'Status'],
        rows: stressRows,
        colWidths: [CW - 80, 25, 20, 35],
        alignRight: [1, 2],
      });
    }
  } else {
    y = drawNoData(doc, y, 'Finanzierungsszenarien nicht berechnet');
  }

  // ═══════════════════════════════════════
  // SEITE 11: ERGEBNISÜBERSICHT
  // ═══════════════════════════════════════
  doc.addPage();
  y = PAGE.MARGIN_TOP + 8;
  y = drawNumberedSection(doc, y, '9', 'Ergebnisübersicht', 'Zusammenfassung aller Bewertungsverfahren');

  // Verfahrensvergleich
  const hasBwt = !!data.beleihungswert;
  const resultHeaders = hasBwt
    ? ['Verfahren', 'Marktwert (MWT)', 'Beleihungswert (BWT)']
    : ['Verfahren', 'Marktwert'];

  const resultRows = data.methods.map(m => {
    const label = m.method === 'ertrag' ? 'Ertragswertverfahren'
      : m.method === 'sachwert_proxy' ? 'Sachwertverfahren'
      : m.method === 'comp_proxy' ? 'Vergleichswertverfahren'
      : m.method.replace('_', ' ');
    const baseRow = [label, safeEur(m.value)];
    if (hasBwt) {
      if (m.method === 'ertrag') baseRow.push(safeEur(data.beleihungswert!.ertragswertBelwertv));
      else if (m.method === 'sachwert_proxy') baseRow.push(safeEur(data.beleihungswert!.sachwertBelwertv));
      else baseRow.push('–');
    }
    return baseRow;
  });

  const colW = hasBwt ? [CW - 80, 40, 40] : [CW - 40, 40];
  y = drawTable(doc, y, { headers: resultHeaders, rows: resultRows, colWidths: colW, alignRight: [1, 2] });

  // Gewichtung
  y += 4;
  setFont(doc, { size: 10, style: 'bold' });
  setColor(doc, COLOR.INK);
  doc.text('Gewichtung', ML, y);
  y += 5;

  const weightRows = data.valueBand.weightingTable.map(w => {
    const label = w.method === 'ertrag' ? 'Ertragswert'
      : w.method === 'sachwert_proxy' ? 'Sachwert'
      : w.method === 'comp_proxy' ? 'Vergleichswert'
      : w.method;
    return [label, `${(w.weight * 100).toFixed(0)}%`, EUR(w.value)];
  });
  y = drawTable(doc, y, { headers: ['Methode', 'Gewicht', 'Gew. Wert'], rows: weightRows, colWidths: [60, 40, CW - 100], alignRight: [1, 2] });

  // Kennzahlen
  if (data.snapshot.livingAreaSqm && data.valueBand.p50 > 0) {
    y += 4;
    const pricePerSqm = data.valueBand.p50 / data.snapshot.livingAreaSqm;
    const kennRows: string[][] = [
      ['Marktwert / m² Wohnfläche', EUR(pricePerSqm)],
    ];
    if (data.snapshot.netColdRentMonthly && data.snapshot.netColdRentMonthly > 0) {
      const factor = data.valueBand.p50 / (data.snapshot.netColdRentMonthly * 12);
      const bruttoRendite = (data.snapshot.netColdRentMonthly * 12) / data.valueBand.p50;
      kennRows.push(['Kaufpreisfaktor', `${factor.toFixed(1)}x`]);
      kennRows.push(['Bruttorendite', PCT(bruttoRendite)]);
    }
    y = drawTable(doc, y, { headers: ['Kennzahl', 'Wert'], rows: kennRows, colWidths: [CW / 2, CW / 2], alignRight: [1] });
  }

  // RESULT BOX
  y += 6;
  y = ensurePageBreak(doc, y, 50);
  y = drawResultBox(doc, y, {
    primary: { label: 'MARKTWERT', value: EUR(data.valueBand.p50) },
    secondary: hasBwt ? { label: 'BELEIHUNGSWERT', value: EUR(data.beleihungswert!.beleihungswert) } : undefined,
    bandText: `${EUR(data.valueBand.p25)} – ${EUR(data.valueBand.p75)}`,
  });

  if (data.valueBand.reasoning) {
    y = drawBodyText(doc, y, data.valueBand.reasoning);
  }

  // ═══════════════════════════════════════
  // SEITE 12: RECHTLICHE HINWEISE & AUDIT
  // ═══════════════════════════════════════
  doc.addPage();
  y = PAGE.MARGIN_TOP + 8;
  y = drawNumberedSection(doc, y, '10', 'Rechtliche Hinweise & Audit', 'Haftungsausschluss, Verwendungszweck und Änderungsprotokoll');

  // Legal disclaimer
  y = drawLegalDisclaimer(doc, y, 'valuation');

  // Verwendungszweck
  y += 4;
  y = drawInfoCard(doc, y, 'Verwendungszweck', [
    'Dieses Gutachten wurde zur internen Portfoliobewertung erstellt.',
    'Es dient der Wertermittlung von Bestandsimmobilien und der Dokumentation gegenüber Kreditinstituten.',
    'Eine Verwendung für Gerichtsverfahren oder öffentliche Zwecke ist ausdrücklich ausgeschlossen.',
  ]);

  // Audit trail
  y += 4;
  setFont(doc, { size: 10, style: 'bold' });
  setColor(doc, COLOR.INK);
  doc.text('Änderungsprotokoll', ML, y);
  y += 5;

  y = drawAuditTrail(doc, y, [
    { date: dateStr, version: 'V10.0', change: 'Erstbewertung — automatisierte Wertermittlung' },
  ]);

  // Datenbasis info
  y += 4;
  y = drawInfoCard(doc, y, 'Datenbasis', [
    `Bewertungsmodell: SoT Valuation Engine V10.0`,
    `Datenmodus: ${data.sourceMode === 'SSOT_FINAL' ? 'SSOT (Final) — vollständig verifiziert' : 'Exposé Draft — teilweise abgeleitet'}`,
    `Stichtag: ${dateStr}  ·  Case-ID: ${caseShort}`,
    `KI-Modell: Gemini (Marktdaten-Recherche)`,
  ]);

  // ═══════════════════════════════════════
  // FOOTER — CI-A branded on every page
  // ═══════════════════════════════════════
  addFootersToAllPages(doc, {
    confidential: true,
    org: `Case ${caseShort}`,
    version: 'V10.0',
  });

  const filename = `Kurzgutachten-${caseShort}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
