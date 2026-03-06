/**
 * generateValuationPdf — Kurzgutachten PDF V9.0 (12 Seiten)
 * CI-A Standard via pdfCiKit. Base64-embedded maps/StreetView.
 * Pure data-driven, no DOM dependency. Lazy-loaded jsPDF.
 */
import { getJsPDF } from '@/lib/lazyJspdf';
import { PAGE, COLOR, TYPO, SPACING, BRAND } from '@/lib/pdf/pdfCiTokens';
import {
  drawCover, drawSectionTitle, drawKpiRow, drawTable, drawInfoCard,
  drawBodyText, drawDivider, ensurePageBreak, addFootersToAllPages,
  EUR, PCT, NUM,
} from '@/lib/pdf/pdfCiKit';
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
    location.microMapUrl ? fetchImageAsBase64(location.microMapUrl) : Promise.resolve(null),
    location.macroMapUrl ? fetchImageAsBase64(location.macroMapUrl) : Promise.resolve(null),
    location.streetViewUrl ? fetchImageAsBase64(location.streetViewUrl) : Promise.resolve(null),
  ]);
  return { micro, macro, streetView };
}

// ─── PDF Helpers ─────────────────────────────────────────────────────

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

/** Draw a key-value row */
function row(doc: any, y: number, lbl: string, val: string, bold = false, x2 = PAGE.MARGIN_LEFT + 62): number {
  y = ensurePageBreak(doc, y, 6);
  setFont(doc, TYPO.CAPTION);
  setColor(doc, COLOR.MUTED);
  doc.text(lbl, PAGE.MARGIN_LEFT + 4, y);
  setFont(doc, { size: TYPO.CAPTION.size + 0.5, style: bold ? 'bold' : 'normal' });
  setColor(doc, bold ? COLOR.ACCENT : COLOR.INK);
  doc.text(val, x2, y);
  return y + 5;
}

/** Draw a section separator line */
function sectionLine(doc: any, y: number): number {
  y = ensurePageBreak(doc, y, 4);
  doc.setDrawColor(COLOR.BORDER[0], COLOR.BORDER[1], COLOR.BORDER[2]);
  doc.setLineWidth(0.3);
  doc.line(PAGE.MARGIN_LEFT + 4, y, PAGE.WIDTH - PAGE.MARGIN_RIGHT - 4, y);
  return y + 3;
}

/** Add embedded image safely */
function addImageSafe(doc: any, img: string | null, x: number, y: number, w: number, h: number): boolean {
  if (!img) return false;
  try {
    const fmt = img.includes('image/png') ? 'PNG' : 'JPEG';
    doc.addImage(img, fmt, x, y, w, h);
    doc.setDrawColor(230, 232, 236);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 1, 1, 'S');
    return true;
  } catch { return false; }
}

const ML = PAGE.MARGIN_LEFT;
const CW = PAGE.CONTENT_WIDTH;

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

  const ertragParams = data.methods.find(m => m.method === 'ertrag')?.params ?? {};
  const sachwertParams = data.methods.find(m => m.method === 'sachwert_proxy')?.params ?? {};
  const ertragValue = data.methods.find(m => m.method === 'ertrag')?.value ?? 0;
  const sachwertValue = data.methods.find(m => m.method === 'sachwert_proxy')?.value ?? 0;
  const compValue = data.methods.find(m => m.method === 'comp_proxy')?.value ?? 0;

  // ═══════════════════════════════════════
  // SEITE 1: DECKBLATT
  // ═══════════════════════════════════════

  // StreetView hero image
  if (mapImages.streetView) {
    y = 0;
    addImageSafe(doc, mapImages.streetView, 0, 0, PAGE.WIDTH, 80);
    y = 82;
  } else {
    // Accent bar
    setFillColor(doc, COLOR.ACCENT);
    doc.rect(0, 0, PAGE.WIDTH, SPACING.COVER_ACCENT_HEIGHT, 'F');
    y = 40;
  }

  // Title block
  setFont(doc, TYPO.CAPTION);
  setColor(doc, COLOR.MUTED);
  doc.text('KURZGUTACHTEN', ML, y);
  y += 6;
  setFont(doc, TYPO.H1);
  setColor(doc, COLOR.INK);
  doc.text('Verkehrswertermittlung', ML, y);
  y += 10;
  setFont(doc, { size: 12, style: 'normal' });
  setColor(doc, COLOR.MUTED);
  const addrLines = doc.splitTextToSize(addressLine || 'Immobilienbewertung', CW);
  doc.text(addrLines, ML, y);
  y += addrLines.length * 5 + 2;

  // Object summary line
  setFont(doc, TYPO.BODY);
  setColor(doc, COLOR.INK);
  const objLine = [
    data.snapshot.objectType?.toUpperCase(),
    data.snapshot.yearBuilt ? `Baujahr ${data.snapshot.yearBuilt}` : null,
    data.snapshot.livingAreaSqm ? `${data.snapshot.livingAreaSqm} m²` : null,
  ].filter(Boolean).join(' · ');
  doc.text(objLine, ML, y);
  y += 10;

  // Hero value boxes
  setFillColor(doc, [239, 246, 255]); // accent bg
  doc.roundedRect(ML, y, CW / 2 - 3, 28, 2, 2, 'F');
  setFont(doc, TYPO.CAPTION);
  setColor(doc, COLOR.MUTED);
  doc.text('MARKTWERT', ML + 5, y + 7);
  setFont(doc, TYPO.KPI_LARGE);
  setColor(doc, COLOR.ACCENT);
  doc.text(EUR(data.valueBand.p50), ML + 5, y + 18);

  if (data.beleihungswert) {
    const bx = ML + CW / 2 + 3;
    setFillColor(doc, [236, 253, 245]); // success bg
    doc.roundedRect(bx, y, CW / 2 - 3, 28, 2, 2, 'F');
    setFont(doc, TYPO.CAPTION);
    setColor(doc, COLOR.MUTED);
    doc.text('BELEIHUNGSWERT', bx + 5, y + 7);
    setFont(doc, TYPO.KPI_LARGE);
    setColor(doc, COLOR.SUCCESS);
    doc.text(EUR(data.beleihungswert.beleihungswert), bx + 5, y + 18);
  }
  y += 34;

  // Date + Case
  setFont(doc, TYPO.CAPTION);
  setColor(doc, COLOR.MUTED);
  doc.text(`Stichtag: ${dateStr}  ·  Case ${caseShort}`, ML, y);
  y += 4;
  doc.text(data.sourceMode === 'SSOT_FINAL' ? 'Datenbasis: SSOT (Final)' : 'Datenbasis: Exposé Draft', ML, y);
  y += 4;
  doc.text(`${BRAND.COMPANY_NAME} · ${BRAND.CONFIDENTIAL}`, ML, y);

  // ═══════════════════════════════════════
  // SEITE 2: OBJEKTDATEN & GRUNDBUCH
  // ═══════════════════════════════════════
  doc.addPage();
  y = drawSectionTitle(doc, PAGE.MARGIN_TOP + 6, '1. Objektdaten', 'Gebäudeangaben und Grundstück');

  const objRows: string[][] = [
    ['Adresse', addressLine || '–'],
    ['Objektart', data.snapshot.objectType?.toUpperCase() || '–'],
    ['Baujahr', data.snapshot.yearBuilt?.toString() || '–'],
    ['Wohnfläche', data.snapshot.livingAreaSqm ? `${data.snapshot.livingAreaSqm} m²` : '–'],
    ['Grundstück', data.snapshot.plotAreaSqm ? `${data.snapshot.plotAreaSqm} m²` : '–'],
    ['Einheiten', data.snapshot.units?.toString() || '–'],
    ['Zustand', data.snapshot.condition || '–'],
  ];
  y = drawTable(doc, y, { headers: ['Eigenschaft', 'Wert'], rows: objRows, colWidths: [CW / 2, CW / 2] });

  if (data.legalTitle && data.sourceMode === 'SSOT_FINAL') {
    y += 4;
    y = drawSectionTitle(doc, y, '2. Grundbuch', 'Grundbuchdaten und Eigentumsverhältnisse');
    const legalRows: string[][] = [];
    if (data.legalTitle.landRegisterCourt) legalRows.push(['Amtsgericht', data.legalTitle.landRegisterCourt]);
    if (data.legalTitle.landRegisterSheet) legalRows.push(['Grundbuchblatt', data.legalTitle.landRegisterSheet]);
    if (data.legalTitle.parcelNumber) legalRows.push(['Flurstück', data.legalTitle.parcelNumber]);
    if (data.legalTitle.ownershipSharePercent != null) legalRows.push(['Eigentumsanteil', `${data.legalTitle.ownershipSharePercent}%`]);
    if (data.legalTitle.wegFlag) legalRows.push(['WEG', `Ja${data.legalTitle.teNumber ? ` (TE: ${data.legalTitle.teNumber})` : ''}`]);
    if (legalRows.length > 0) {
      y = drawTable(doc, y, { headers: ['Eigenschaft', 'Wert'], rows: legalRows, colWidths: [CW / 2, CW / 2] });
    }
    y = drawInfoCard(doc, y, 'Dokumentstatus', [
      `Grundbuchauszug: ${data.legalTitle.landRegisterExtractAvailable ? '✓ Vorhanden' : '✗ Nicht vorhanden'}`,
      `Teilungserklärung: ${data.legalTitle.partitionDeclarationAvailable ? '✓ Vorhanden' : '✗ Nicht vorhanden'}`,
    ]);
  }

  // ═══════════════════════════════════════
  // SEITE 3: STANDORTANALYSE
  // ═══════════════════════════════════════
  if (data.location) {
    doc.addPage();
    y = drawSectionTitle(doc, PAGE.MARGIN_TOP + 6, '3. Standortanalyse', 'Lage, Umfeld & Erreichbarkeit');

    y = drawKpiRow(doc, y, [
      { label: 'Lage-Score', value: `${data.location.overallScore}/100`, tone: data.location.overallScore >= 70 ? 'success' : data.location.overallScore >= 40 ? 'warning' : 'danger' },
    ]);

    // Map images
    const maps = [
      { label: 'MIKROLAGE', img: mapImages.micro },
      { label: 'MAKROLAGE', img: mapImages.macro },
    ].filter(m => m.img);

    if (maps.length > 0) {
      y = ensurePageBreak(doc, y, 55);
      const imgW = maps.length === 1 ? CW : (CW - 4) / 2;
      const imgH = imgW * 0.75;
      for (let i = 0; i < maps.length; i++) {
        const x = ML + i * (imgW + 4);
        setFont(doc, TYPO.CAPTION);
        setColor(doc, COLOR.MUTED);
        doc.text(maps[i].label, x, y);
        addImageSafe(doc, maps[i].img, x, y + 3, imgW, imgH);
      }
      y += 3 + (maps.length === 1 ? CW * 0.75 : ((CW - 4) / 2) * 0.75) + 4;
    }

    // Dimension scores
    const dimRows = data.location.dimensions.map(d => [d.label, `${d.score}/10`]);
    y = drawTable(doc, y, { headers: ['Dimension', 'Score'], rows: dimRows, colWidths: [CW - 30, 30], alignRight: [1] });

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

    if (data.location.narrative) {
      y = drawBodyText(doc, y, data.location.narrative);
    }
  }

  // ═══════════════════════════════════════
  // SEITE 4: BODENWERT & RESTNUTZUNGSDAUER
  // ═══════════════════════════════════════
  doc.addPage();
  y = drawSectionTitle(doc, PAGE.MARGIN_TOP + 6, '4. Bodenwert', 'Grundstücksfläche × Bodenrichtwert');

  const bodenRows: string[][] = [];
  if (ertragParams.plotAreaSqm) bodenRows.push(['Grundstücksfläche', `${NUM(Number(ertragParams.plotAreaSqm))} m²`]);
  if (data.geminiResearch?.bodenrichtwert) {
    bodenRows.push(['Bodenrichtwert', `${data.geminiResearch.bodenrichtwert.bodenrichtwertEurSqm.toFixed(2)} €/m²`]);
    bodenRows.push(['Quelle', data.geminiResearch.bodenrichtwert.quelle]);
  }
  if (ertragParams.bodenwertProxy) bodenRows.push(['BODENWERT', EUR(Number(ertragParams.bodenwertProxy))]);
  if (bodenRows.length > 0) {
    y = drawTable(doc, y, { headers: ['Position', 'Wert'], rows: bodenRows, colWidths: [CW / 2, CW / 2], alignRight: [1] });
  }

  y += 4;
  y = drawSectionTitle(doc, y, '5. Modernisierung & Restnutzungsdauer', 'Berechnung der RND');
  const rndRows: string[][] = [];
  if (ertragParams.gesamtnutzungsdauer) rndRows.push(['Gesamtnutzungsdauer', `${ertragParams.gesamtnutzungsdauer} Jahre`]);
  if (ertragParams.alter) rndRows.push(['Alter', `${ertragParams.alter} Jahre`]);
  if (ertragParams.modernisierungsbonus) rndRows.push(['Modernisierungsbonus', `+${ertragParams.modernisierungsbonus} Jahre`]);
  const rnd = ertragParams.restnutzungsdauer || ertragParams.rnd;
  if (rnd) rndRows.push(['RESTNUTZUNGSDAUER', `${rnd} Jahre`]);
  if (rndRows.length > 0) {
    y = drawTable(doc, y, { headers: ['Position', 'Wert'], rows: rndRows, colWidths: [CW / 2, CW / 2], alignRight: [1] });
  }

  // ═══════════════════════════════════════
  // SEITE 5: ERTRAGSWERT (MARKTWERT)
  // ═══════════════════════════════════════
  if (ertragValue > 0) {
    doc.addPage();
    y = drawSectionTitle(doc, PAGE.MARGIN_TOP + 6, '6. Ertragswert (Marktwert)', 'Ertragswertverfahren nach ImmoWertV');

    // Rohertrag
    y = row(doc, y, 'Jahresmiete (Ist)', EUR(Number(ertragParams.netColdRentYearly) || 0));
    y += 2;

    // BWK detail
    setFont(doc, { size: TYPO.H3.size, style: 'bold' });
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
      y = drawTable(doc, y, { headers: ['Position', 'Betrag'], rows: bwkRows, colWidths: [CW / 2, CW / 2], alignRight: [1] });
    }

    y += 2;
    setFont(doc, { size: TYPO.H3.size, style: 'bold' });
    setColor(doc, COLOR.INK);
    doc.text('Ertragsableitung', ML, y);
    y += 5;

    const ablRows: string[][] = [
      ['Reinertrag', EUR(Number(ertragParams.reinertrag) || 0)],
      ['Liegenschaftszins', PCT(Number(ertragParams.liegenschaftszins) || 0)],
    ];
    if (data.geminiResearch?.liegenschaftszins) {
      ablRows.push(['Quelle', data.geminiResearch.liegenschaftszins.quelle]);
    }
    ablRows.push(['RND', `${rnd || '–'} Jahre`]);
    if (ertragParams.barwertfaktor) ablRows.push(['Barwertfaktor', (Number(ertragParams.barwertfaktor)).toFixed(2)]);
    ablRows.push(['', '']);
    ablRows.push(['ERTRAGSWERT (MWT)', EUR(ertragValue)]);
    y = drawTable(doc, y, { headers: ['Position', 'Wert'], rows: ablRows, colWidths: [CW / 2, CW / 2], alignRight: [1] });
  }

  // ═══════════════════════════════════════
  // SEITE 6: ERTRAGSWERT (BELEIHUNGSWERT)
  // ═══════════════════════════════════════
  if (data.beleihungswert && data.beleihungswert.ertragswertBelwertv > 0) {
    doc.addPage();
    y = drawSectionTitle(doc, PAGE.MARGIN_TOP + 6, '7. Ertragswert (Beleihungswert)', 'Berechnung nach BelWertV — fester Liegenschaftszins 5,0%');

    const bwtRows: string[][] = [
      ['Liegenschaftszins (BelWertV §12)', '5,0 %'],
      ['BWK (konservativ)', EUR(data.beleihungswert.bwkBelwertv || 0)],
      ['Sicherheitsabschlag', PCT(data.beleihungswert.sicherheitsabschlag)],
      ['', ''],
      ['ERTRAGSWERT (BWT)', EUR(data.beleihungswert.ertragswertBelwertv)],
    ];
    y = drawTable(doc, y, { headers: ['Position', 'Wert'], rows: bwtRows, colWidths: [CW / 2, CW / 2], alignRight: [1] });

    y += 2;
    y = drawBodyText(doc, y, 'Hinweis: Liegenschaftszins gem. §12 BelWertV mindestens 5,0% für Wohnimmobilien. Konservative BWK-Ansätze gem. BelWertV.');
  }

  // ═══════════════════════════════════════
  // SEITE 7: SACHWERT
  // ═══════════════════════════════════════
  if (sachwertValue > 0) {
    doc.addPage();
    y = drawSectionTitle(doc, PAGE.MARGIN_TOP + 6, '8. Sachwert', 'Sachwertverfahren (NHK 2010)');

    const swRows: string[][] = [];
    if (sachwertParams.nhkPerSqm) swRows.push(['NHK 2010', `${NUM(Number(sachwertParams.nhkPerSqm))} €/m²`]);
    if (sachwertParams.bpiFactor) swRows.push(['BPI-Index (2026)', (Number(sachwertParams.bpiFactor)).toFixed(2)]);
    if (sachwertParams.zeitwertGebaeude) swRows.push(['Zeitwert Gebäude', EUR(Number(sachwertParams.zeitwertGebaeude))]);
    swRows.push(['', '']);
    swRows.push(['SACHWERT (MWT)', EUR(sachwertValue)]);
    y = drawTable(doc, y, { headers: ['Position', 'Wert'], rows: swRows, colWidths: [CW / 2, CW / 2], alignRight: [1] });

    if (data.beleihungswert && data.beleihungswert.sachwertBelwertv > 0) {
      y += 4;
      y = drawSectionTitle(doc, y, 'Sachwert (Beleihungswert)', 'Mit Sicherheitsabschlag 10%');
      const swBwtRows: string[][] = [
        ['Sachwert vor Abschlag', EUR(sachwertValue)],
        ['Sicherheitsabschlag 10%', `−${EUR(Math.round(sachwertValue * 0.1))}`],
        ['', ''],
        ['SACHWERT (BWT)', EUR(data.beleihungswert.sachwertBelwertv)],
      ];
      y = drawTable(doc, y, { headers: ['Position', 'Wert'], rows: swBwtRows, colWidths: [CW / 2, CW / 2], alignRight: [1] });
    }
  }

  // ═══════════════════════════════════════
  // SEITE 8: VERGLEICHSWERT
  // ═══════════════════════════════════════
  if (data.compStats || data.comps.length > 0) {
    doc.addPage();
    y = drawSectionTitle(doc, PAGE.MARGIN_TOP + 6, '9. Vergleichswert', 'Vergleichsobjekte aus Immobilienportalen');

    if (data.compStats) {
      y = drawKpiRow(doc, y, [
        { label: 'Median €/m²', value: EUR(data.compStats.medianPriceSqm), tone: 'accent' },
        { label: 'P25 €/m²', value: EUR(data.compStats.p25PriceSqm) },
        { label: 'P75 €/m²', value: EUR(data.compStats.p75PriceSqm) },
        { label: 'Objekte', value: `${data.compStats.dedupedCount} / ${data.compStats.count}` },
      ]);
    }

    const topComps = data.comps.slice(0, 10);
    if (topComps.length > 0) {
      y += 2;
      const compRows = topComps.map(c => [
        c.portal || '–',
        c.title?.slice(0, 30) || '–',
        EUR(c.price),
        `${c.area}m²`,
        EUR(c.priceSqm),
        c.distanceKm != null ? `${c.distanceKm.toFixed(1)}km` : '–',
      ]);
      y = drawTable(doc, y, {
        headers: ['Portal', 'Objekt', 'Preis', 'Fläche', '€/m²', 'Entf.'],
        rows: compRows,
        colWidths: [20, CW - 130, 30, 20, 30, 20],
        alignRight: [2, 4, 5],
      });
    }

    if (compValue > 0) {
      y += 4;
      y = row(doc, y, 'VERGLEICHSWERT (MWT)', EUR(compValue), true);
    }
  }

  // ═══════════════════════════════════════
  // SEITE 9: VORSCHLAGSWERTE & AI-QUELLEN
  // ═══════════════════════════════════════
  if (data.geminiResearch) {
    doc.addPage();
    y = drawSectionTitle(doc, PAGE.MARGIN_TOP + 6, '10. Vorschlagswerte (KI-Recherche)', 'Gemini-recherchierte Marktdaten');

    if (data.geminiResearch.liegenschaftszins) {
      const lz = data.geminiResearch.liegenschaftszins;
      y = drawInfoCard(doc, y, 'Liegenschaftszins', [
        `Empfohlen (Marktwert): ${PCT(lz.marktwertZins)}`,
        `Spanne: ${PCT(lz.min)} – ${PCT(lz.max)}`,
        `Beleihungswert (BelWertV): 5,0 %`,
        `Quelle: ${lz.quelle}`,
      ]);
    }

    if (data.geminiResearch.bodenrichtwert) {
      const bw = data.geminiResearch.bodenrichtwert;
      y = drawInfoCard(doc, y, 'Bodenrichtwert', [
        `Richtwert: ${bw.bodenrichtwertEurSqm.toFixed(2)} €/m²`,
        `Nutzungsart: ${bw.artDerNutzung}`,
        `Quelle: ${bw.quelle}`,
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
    y = drawBodyText(doc, y, 'AI-generierte Marktdaten basieren auf öffentlich verfügbaren Quellen und können von amtlichen Werten abweichen.');
  }

  // ═══════════════════════════════════════
  // SEITE 10: KENNZAHLEN & FINANZIERUNG
  // ═══════════════════════════════════════
  if (data.financing.length > 0) {
    doc.addPage();
    y = drawSectionTitle(doc, PAGE.MARGIN_TOP + 6, '11. Finanzierungsszenarien', 'Szenarienvergleich für typische Darlehensstrukturen');

    const finRows = data.financing.map(f => [
      f.name,
      PCT(f.ltv),
      EUR(f.loanAmount),
      `${PCT(f.interestRate)} / ${PCT(f.repaymentRate)}`,
      EUR(f.monthlyRate),
      f.cashflowAfterDebt != null ? EUR(f.cashflowAfterDebt) : '–',
      f.trafficLight === 'green' ? '✓' : f.trafficLight === 'yellow' ? '⚠' : '✗',
    ]);
    y = drawTable(doc, y, {
      headers: ['Szenario', 'LTV', 'Darlehen', 'Zins/Tilg.', 'Rate/mtl.', 'CF n. KD/a', ''],
      rows: finRows,
      colWidths: [28, 18, 28, 28, 25, 28, 15],
      alignRight: [1, 2, 3, 4, 5],
    });

    // Stress Tests
    if (data.stressTests.length > 0) {
      y += 6;
      y = drawSectionTitle(doc, y, 'Stress-Tests', 'Sensitivitätsanalyse');
      const stressRows = data.stressTests.map(st => [
        st.label,
        EUR(st.monthlyRate),
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
  }

  // ═══════════════════════════════════════
  // SEITE 11: ERGEBNISÜBERSICHT
  // ═══════════════════════════════════════
  doc.addPage();
  y = drawSectionTitle(doc, PAGE.MARGIN_TOP + 6, '12. Ergebnisübersicht', 'Zusammenfassung aller Bewertungsverfahren');

  // Results table
  const resultHeaders = data.beleihungswert
    ? ['Verfahren', 'Marktwert', 'Beleihungswert']
    : ['Verfahren', 'Marktwert'];

  const resultRows = data.methods.map(m => {
    const baseRow = [
      m.method.replace('_', ' ').replace(/^\w/, c => c.toUpperCase()),
      EUR(m.value),
    ];
    if (data.beleihungswert) {
      if (m.method === 'ertrag') baseRow.push(EUR(data.beleihungswert.ertragswertBelwertv));
      else if (m.method === 'sachwert_proxy') baseRow.push(EUR(data.beleihungswert.sachwertBelwertv));
      else baseRow.push('–');
    }
    return baseRow;
  });

  const colW = data.beleihungswert ? [CW - 60, 30, 30] : [CW - 30, 30];
  y = drawTable(doc, y, { headers: resultHeaders, rows: resultRows, colWidths: colW, alignRight: [1, 2] });

  // Weighting
  y += 4;
  setFont(doc, { size: TYPO.H3.size, style: 'bold' });
  setColor(doc, COLOR.INK);
  doc.text('Gewichtung', ML, y);
  y += 5;
  const weightRows = data.valueBand.weightingTable.map(w => [
    w.method.replace('_', ' ').replace(/^\w/, c => c.toUpperCase()),
    `${(w.weight * 100).toFixed(0)}%`,
    EUR(w.value),
  ]);
  y = drawTable(doc, y, { headers: ['Methode', 'Gewicht', 'Gew. Wert'], rows: weightRows, colWidths: [60, 40, CW - 100], alignRight: [1, 2] });

  // Final result box
  y += 6;
  y = ensurePageBreak(doc, y, 35);
  setFillColor(doc, [239, 246, 255]);
  doc.roundedRect(ML, y, CW, 30, 2, 2, 'F');
  setFont(doc, TYPO.CAPTION);
  setColor(doc, COLOR.MUTED);
  doc.text('MARKTWERT', ML + 8, y + 8);
  setFont(doc, TYPO.KPI_LARGE);
  setColor(doc, COLOR.ACCENT);
  doc.text(EUR(data.valueBand.p50), ML + 8, y + 19);

  if (data.beleihungswert) {
    setFont(doc, TYPO.CAPTION);
    setColor(doc, COLOR.MUTED);
    doc.text('BELEIHUNGSWERT', ML + CW / 2 + 8, y + 8);
    setFont(doc, TYPO.KPI_LARGE);
    setColor(doc, COLOR.SUCCESS);
    doc.text(EUR(data.beleihungswert.beleihungswert), ML + CW / 2 + 8, y + 19);
  }
  y += 35;

  if (data.valueBand.reasoning) {
    y = drawBodyText(doc, y, data.valueBand.reasoning);
  }

  // ═══════════════════════════════════════
  // SEITE 12: RECHTLICHE HINWEISE
  // ═══════════════════════════════════════
  doc.addPage();
  y = drawSectionTitle(doc, PAGE.MARGIN_TOP + 6, '13. Rechtliche Hinweise', 'Haftungsausschluss und Annahmen');

  y = drawBodyText(doc, y, [
    'Dieses Kurzgutachten dient ausschließlich der internen Werteinschätzung und stellt kein',
    'Verkehrswertgutachten nach §194 BauGB dar. Es ersetzt nicht die Bewertung durch einen',
    'öffentlich bestellten und vereidigten Sachverständigen.',
    '',
    'AI-gestützte Marktdaten (Liegenschaftszins, Bodenrichtwert, Vergleichsmieten) basieren',
    'auf öffentlich verfügbaren Quellen und können von amtlichen Werten abweichen.',
  ].join('\n'));

  y += 4;
  y = drawSectionTitle(doc, y, '14. Änderungsprotokoll', 'Audit-Trail');
  y = drawTable(doc, y, {
    headers: ['Datum', 'Version', 'Änderung'],
    rows: [[dateStr, 'V1.0', 'Erstbewertung']],
    colWidths: [30, 20, CW - 50],
  });

  if (data.executiveSummary) {
    y += 4;
    y = drawSectionTitle(doc, y, 'Executive Summary', '');
    y = drawBodyText(doc, y, data.executiveSummary);
  }

  // ═══════════════════════════════════════
  // FOOTER — CI-A branded on every page
  // ═══════════════════════════════════════
  addFootersToAllPages(doc, {
    confidential: true,
    org: `Case ${caseShort}`,
    version: 'V9.0',
  });

  const filename = `Kurzgutachten-${caseShort}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
