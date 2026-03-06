/**
 * generateValuationPdf — Premium SoT Bewertungsgutachten PDF (10-12 pages)
 * V7.0: Uses pdfCiKit primitives, embedded map images, editorial chapter structure
 * Pure data-driven, no DOM dependency. Lazy-loaded jsPDF.
 */
import { getJsPDF } from '@/lib/lazyJspdf';
import { PAGE, COLOR, TYPO, SPACING, BRAND } from '@/lib/pdf/pdfCiTokens';
import {
  drawCover,
  drawSectionTitle,
  drawKpiRow,
  drawTable,
  drawInfoCard,
  drawBodyText,
  drawDivider,
  drawBadge,
  ensurePageBreak,
  addFootersToAllPages,
  EUR,
  PCT,
} from '@/lib/pdf/pdfCiKit';
import type {
  ValueBand,
  ValuationMethodResult,
  FinancingScenario,
  StressTestResult,
  LienProxy,
  DataQuality,
  CompStats,
  CompPosting,
  LocationAnalysis,
  CanonicalPropertySnapshot,
  LegalTitleBlock,
  ValuationSourceMode,
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
}

// ─── Image Helpers ───────────────────────────────────────────────────

/** Fetch an image URL and return as base64 data URI. Returns null on failure. */
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
  } catch {
    return null;
  }
}

/** Pre-fetch all location map images in parallel */
async function prefetchMapImages(location: LocationAnalysis | null): Promise<{
  micro: string | null;
  macro: string | null;
  streetView: string | null;
}> {
  if (!location) return { micro: null, macro: null, streetView: null };
  const [micro, macro, streetView] = await Promise.all([
    location.microMapUrl ? fetchImageAsBase64(location.microMapUrl) : Promise.resolve(null),
    location.macroMapUrl ? fetchImageAsBase64(location.macroMapUrl) : Promise.resolve(null),
    (location as any).streetViewUrl ? fetchImageAsBase64((location as any).streetViewUrl) : Promise.resolve(null),
  ]);
  return { micro, macro, streetView };
}

// ─── PDF Helper Functions ────────────────────────────────────────────

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

function row(doc: any, y: number, lbl: string, val: string, x2 = PAGE.MARGIN_LEFT + 62): number {
  y = ensurePageBreak(doc, y, 6);
  setFont(doc, TYPO.CAPTION);
  setColor(doc, COLOR.MUTED);
  doc.text(lbl, PAGE.MARGIN_LEFT + 4, y);
  setFont(doc, { size: TYPO.CAPTION.size + 0.5, style: 'bold' });
  setColor(doc, COLOR.INK);
  doc.text(val, x2, y);
  return y + 5;
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════

export async function generateValuationPdf(data: ValuationPdfData): Promise<void> {
  // Pre-fetch map images in parallel with jsPDF load
  const [jsPDF, mapImages] = await Promise.all([
    getJsPDF(),
    prefetchMapImages(data.location),
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const ML = PAGE.MARGIN_LEFT;
  const CW = PAGE.CONTENT_WIDTH;
  let y = 0;

  const sourceModeLabel = data.sourceMode === 'SSOT_FINAL' ? 'Datenbasis: SSOT (Final)' : 'Datenbasis: Exposé Draft';
  const caseShort = data.caseId.slice(0, 8);
  const dateStr = new Date(data.generatedAt).toLocaleDateString('de-DE');

  // ═══════════════════════════════════════
  // PAGE 1: PREMIUM COVER
  // ═══════════════════════════════════════
  const addressLine = [data.snapshot.address, data.snapshot.postalCode, data.snapshot.city].filter(Boolean).join(', ');

  y = drawCover(doc, {
    title: 'SoT Bewertungsgutachten',
    subtitle: addressLine || 'Immobilienbewertung',
    date: dateStr,
    caseId: `Case ${caseShort}`,
    heroImageBase64: mapImages.streetView || mapImages.micro || undefined,
  });

  // Source mode badge
  y += 2;
  setFont(doc, TYPO.CAPTION);
  setColor(doc, COLOR.MUTED);
  doc.text(sourceModeLabel, ML, y);
  y += 8;

  // Value Band Hero Box
  setFillColor(doc, COLOR.SURFACE);
  doc.roundedRect(ML, y, CW, 32, 2, 2, 'F');
  y += 8;
  setFont(doc, TYPO.CAPTION);
  setColor(doc, COLOR.MUTED);
  doc.text('WERTBAND (P25 – P50 – P75)', ML + 5, y);
  y += 8;
  setFont(doc, TYPO.KPI_LARGE);
  setColor(doc, COLOR.ACCENT);
  doc.text(EUR(data.valueBand.p50), ML + 5, y);
  setFont(doc, { size: 11, style: 'normal' });
  setColor(doc, COLOR.MUTED);
  doc.text(`${EUR(data.valueBand.p25)}  –  ${EUR(data.valueBand.p75)}`, ML + 75, y);
  y += 6;
  setFont(doc, TYPO.CAPTION);
  setColor(doc, COLOR.MUTED);
  doc.text(`Konfidenz: ${data.valueBand.confidence} (${(data.valueBand.confidenceScore * 100).toFixed(0)}%)`, ML + 5, y);
  y += 16;

  // Object profile summary
  y = drawKpiRow(doc, y, [
    { label: 'Typ', value: data.snapshot.objectType?.toUpperCase() || '–' },
    { label: 'Fläche', value: data.snapshot.livingAreaSqm ? `${data.snapshot.livingAreaSqm} m²` : '–' },
    { label: 'Baujahr', value: data.snapshot.yearBuilt?.toString() || '–' },
    { label: 'Angebotspreis', value: data.snapshot.askingPrice ? EUR(data.snapshot.askingPrice) : '–', tone: 'accent' },
  ]);

  // ═══════════════════════════════════════
  // PAGE 2: EXECUTIVE SUMMARY + DATENLAGE
  // ═══════════════════════════════════════
  doc.addPage();
  y = drawSectionTitle(doc, PAGE.MARGIN_TOP + 6, 'Executive Summary', 'Zusammenfassung der Bewertungsergebnisse');
  y = drawBodyText(doc, y, data.executiveSummary || 'Keine Zusammenfassung verfügbar.');

  if (data.dataQuality) {
    y = drawDivider(doc, y);
    y = drawSectionTitle(doc, y, 'Datenlage', 'Vollständigkeit und Herkunft der Bewertungsgrundlagen');
    y = drawKpiRow(doc, y, [
      { label: 'Vollständigkeit', value: `${data.dataQuality.completenessPercent.toFixed(0)}%`, tone: data.dataQuality.completenessPercent >= 70 ? 'success' : 'warning' },
      { label: 'Verifiziert', value: data.dataQuality.fieldsVerified.toString(), tone: 'success' },
      { label: 'Abgeleitet', value: data.dataQuality.fieldsDerived.toString(), tone: 'warning' },
      { label: 'Fehlend', value: data.dataQuality.fieldsMissing.toString(), tone: data.dataQuality.fieldsMissing > 5 ? 'danger' : 'default' },
    ]);
  }

  // ═══════════════════════════════════════
  // PAGE 3: BEWERTUNGSMETHODEN
  // ═══════════════════════════════════════
  doc.addPage();
  y = drawSectionTitle(doc, PAGE.MARGIN_TOP + 6, 'Bewertungsmethoden', 'Verfahrensübersicht und Gewichtung');

  // Methods table
  const methodRows = data.methods.map(m => [
    m.method.replace('_', ' ').replace(/^\w/, c => c.toUpperCase()),
    EUR(m.value),
    `${m.confidence} (${(m.confidenceScore * 100).toFixed(0)}%)`,
    m.notes[0] || '–',
  ]);
  y = drawTable(doc, y, {
    headers: ['Methode', 'Wert', 'Konfidenz', 'Anmerkung'],
    rows: methodRows,
    colWidths: [40, 35, 35, CW - 110],
    alignRight: [1],
  });

  // Weighting
  y += 4;
  y = ensurePageBreak(doc, y, 30);
  setFont(doc, { size: TYPO.H3.size, style: 'bold' });
  setColor(doc, COLOR.INK);
  doc.text('Gewichtung', ML, y);
  y += 6;

  const weightRows = data.valueBand.weightingTable.map(w => [
    w.method.replace('_', ' ').replace(/^\w/, c => c.toUpperCase()),
    `${(w.weight * 100).toFixed(0)}%`,
    EUR(w.value),
  ]);
  y = drawTable(doc, y, {
    headers: ['Methode', 'Gewicht', 'Gewichteter Wert'],
    rows: weightRows,
    colWidths: [60, 40, CW - 100],
    alignRight: [1, 2],
  });

  if (data.valueBand.reasoning) {
    y += 4;
    y = drawBodyText(doc, y, data.valueBand.reasoning);
  }

  // ═══════════════════════════════════════
  // PAGE 4: VERGLEICHSANGEBOTE
  // ═══════════════════════════════════════
  if (data.compStats || data.comps.length > 0) {
    doc.addPage();
    y = drawSectionTitle(doc, PAGE.MARGIN_TOP + 6, 'Vergleichsangebote', 'Marktdaten aus Immobilienportalen');

    if (data.compStats) {
      y = drawKpiRow(doc, y, [
        { label: 'Median €/m²', value: EUR(data.compStats.medianPriceSqm), tone: 'accent' },
        { label: 'P25 €/m²', value: EUR(data.compStats.p25PriceSqm) },
        { label: 'P75 €/m²', value: EUR(data.compStats.p75PriceSqm) },
        { label: 'Objekte', value: `${data.compStats.dedupedCount} / ${data.compStats.count}` },
      ]);
    }

    const topComps = data.comps.slice(0, 12);
    if (topComps.length > 0) {
      y += 4;
      const compRows = topComps.map(c => [
        c.portal || '–',
        c.title?.slice(0, 35) || '–',
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
  }

  // ═══════════════════════════════════════
  // PAGE 5: STANDORTANALYSE (with Maps)
  // ═══════════════════════════════════════
  if (data.location) {
    doc.addPage();
    y = drawSectionTitle(doc, PAGE.MARGIN_TOP + 6, 'Standortanalyse', 'Lage, Umfeld & Erreichbarkeit');

    // Overall score KPI
    y = drawKpiRow(doc, y, [
      { label: 'Gesamtscore', value: `${data.location.overallScore}/100`, tone: data.location.overallScore >= 70 ? 'success' : data.location.overallScore >= 40 ? 'warning' : 'danger' },
    ]);

    // Dimension scores table
    const dimRows = data.location.dimensions.map(d => [d.label, `${d.score}/10`]);
    y = drawTable(doc, y, {
      headers: ['Dimension', 'Score'],
      rows: dimRows,
      colWidths: [CW - 30, 30],
      alignRight: [1],
    });

    // Embedded Map Images
    const mapEntries = [
      { label: 'Mikrolage', img: mapImages.micro },
      { label: 'Makrolage', img: mapImages.macro },
      { label: 'Straßenansicht', img: mapImages.streetView },
    ].filter(m => m.img);

    if (mapEntries.length > 0) {
      y += 4;
      y = ensurePageBreak(doc, y, 60);

      const imgCount = Math.min(mapEntries.length, 3);
      const imgGap = 4;
      const imgW = (CW - (imgCount - 1) * imgGap) / imgCount;
      const imgH = imgW * 0.75; // 4:3 aspect

      // Labels
      setFont(doc, TYPO.CAPTION);
      setColor(doc, COLOR.MUTED);
      for (let i = 0; i < imgCount; i++) {
        const x = ML + i * (imgW + imgGap);
        doc.text(mapEntries[i].label.toUpperCase(), x, y);
      }
      y += 4;

      // Images
      for (let i = 0; i < imgCount; i++) {
        const x = ML + i * (imgW + imgGap);
        try {
          const imgData = mapEntries[i].img!;
          const format = imgData.includes('image/png') ? 'PNG' : 'JPEG';
          doc.addImage(imgData, format, x, y, imgW, imgH);
          // Border
          doc.setDrawColor(230, 232, 236);
          doc.setLineWidth(0.3);
          doc.roundedRect(x, y, imgW, imgH, 1, 1, 'S');
        } catch {
          // Skip broken image
          setFillColor(doc, COLOR.SURFACE);
          doc.roundedRect(x, y, imgW, imgH, 1, 1, 'F');
          setFont(doc, TYPO.CAPTION);
          setColor(doc, COLOR.MUTED);
          doc.text('Bild nicht verfügbar', x + imgW / 2, y + imgH / 2, { align: 'center' });
        }
      }
      y += imgH + 6;
    }

    // Narrative
    if (data.location.narrative) {
      y = drawBodyText(doc, y, data.location.narrative);
    }

    // Reachability
    if (data.location.reachability?.length > 0) {
      y += 2;
      const reachRows = data.location.reachability.map(r => [
        r.destinationName,
        r.drivingMinutes != null ? `${r.drivingMinutes} min` : '–',
        r.transitMinutes != null ? `${r.transitMinutes} min` : '–',
      ]);
      y = drawTable(doc, y, {
        headers: ['Ziel', 'PKW', 'ÖPNV'],
        rows: reachRows,
        colWidths: [CW - 50, 25, 25],
        alignRight: [1, 2],
      });
    }
  }

  // ═══════════════════════════════════════
  // PAGE 6: FINANZIERUNG
  // ═══════════════════════════════════════
  if (data.financing.length > 0) {
    doc.addPage();
    y = drawSectionTitle(doc, PAGE.MARGIN_TOP + 6, 'Finanzierbarkeit', 'Szenarienvergleich für typische Darlehensstrukturen');

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
      headers: ['Szenario', 'LTV', 'Darlehen', 'Zins/Tilg.', 'Rate/mtl.', 'CF n. KD/a', 'Status'],
      rows: finRows,
      colWidths: [28, 18, 28, 28, 25, 28, 15],
      alignRight: [1, 2, 3, 4, 5],
    });

    // Per-scenario detail cards
    for (const f of data.financing) {
      y += 6;
      y = drawInfoCard(doc, y, `Szenario: ${f.name}`, [
        `Eigenkapital: ${EUR(f.equity)}  ·  Darlehen: ${EUR(f.loanAmount)}`,
        `Zins: ${PCT(f.interestRate)}  ·  Tilgung: ${PCT(f.repaymentRate)}  ·  LTV: ${PCT(f.ltv)}`,
        `Monatsrate: ${EUR(f.monthlyRate)}  ·  Ampel: ${f.trafficLight.toUpperCase()}`,
        f.cashflowAfterDebt != null ? `Cashflow nach Kapitaldienst: ${EUR(f.cashflowAfterDebt)}/Jahr` : '',
      ].filter(Boolean));
    }
  }

  // ═══════════════════════════════════════
  // PAGE 7: STRESS-TESTS
  // ═══════════════════════════════════════
  if (data.stressTests.length > 0) {
    doc.addPage();
    y = drawSectionTitle(doc, PAGE.MARGIN_TOP + 6, 'Stress-Tests & Kapitaldienstfähigkeit', 'Sensitivitätsanalyse bei Zins- und Mietveränderung');

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

  // ═══════════════════════════════════════
  // PAGE 8: BELEIHUNGSWERT
  // ═══════════════════════════════════════
  if (data.lienProxy) {
    y += 10;
    if (y > PAGE.HEIGHT - 80) {
      doc.addPage();
      y = PAGE.MARGIN_TOP + 10;
    }
    y = drawSectionTitle(doc, y, 'Beleihungswert (Proxy)', 'Geschätzte Beleihungswertspanne nach BelWertV');

    y = drawKpiRow(doc, y, [
      { label: 'Marktwert P50', value: EUR(data.lienProxy.marketValueP50), tone: 'accent' },
      { label: 'Abschlag', value: PCT(data.lienProxy.totalDiscount), tone: 'warning' },
      { label: 'Beleihung niedrig', value: EUR(data.lienProxy.lienValueLow) },
      { label: 'Beleihung hoch', value: EUR(data.lienProxy.lienValueHigh) },
    ]);

    y = row(doc, y, 'Sicheres LTV-Fenster', `${PCT(data.lienProxy.safeLtvWindow[0])} – ${PCT(data.lienProxy.safeLtvWindow[1])}`);

    if (data.lienProxy.riskDrivers.length > 0) {
      y += 4;
      const riskRows = data.lienProxy.riskDrivers.map(rd => [
        rd.factor,
        `−${PCT(rd.discountPercent)}`,
      ]);
      y = drawTable(doc, y, {
        headers: ['Risikofaktor', 'Abschlag'],
        rows: riskRows,
        colWidths: [CW - 30, 30],
        alignRight: [1],
      });
    }
  }

  // ═══════════════════════════════════════
  // PAGE 9: RECHT & EIGENTUM (SSOT only)
  // ═══════════════════════════════════════
  if (data.legalTitle && data.sourceMode === 'SSOT_FINAL') {
    doc.addPage();
    y = drawSectionTitle(doc, PAGE.MARGIN_TOP + 6, 'Recht & Eigentum', 'Grundbuch, Eigentumsverhältnisse & Dokumentstatus');

    const legalRows: string[][] = [];
    if (data.legalTitle.landRegisterCourt) legalRows.push(['Grundbuchamt', data.legalTitle.landRegisterCourt]);
    if (data.legalTitle.landRegisterSheet) legalRows.push(['Blatt', data.legalTitle.landRegisterSheet]);
    if (data.legalTitle.landRegisterVolume) legalRows.push(['Band', data.legalTitle.landRegisterVolume]);
    if (data.legalTitle.parcelNumber) legalRows.push(['Flurstück', data.legalTitle.parcelNumber]);
    if (data.legalTitle.ownershipSharePercent != null) legalRows.push(['Eigentumsanteil', `${data.legalTitle.ownershipSharePercent}%`]);
    if (data.legalTitle.wegFlag) legalRows.push(['WEG', `Ja${data.legalTitle.teNumber ? ` (TE: ${data.legalTitle.teNumber})` : ''}`]);
    if (data.legalTitle.meaShare != null) legalRows.push(['MEA', data.legalTitle.meaShare.toString()]);

    if (legalRows.length > 0) {
      y = drawTable(doc, y, {
        headers: ['Eigenschaft', 'Wert'],
        rows: legalRows,
        colWidths: [CW / 2, CW / 2],
      });
    }

    // Document status
    y += 4;
    y = drawInfoCard(doc, y, 'Dokumentstatus', [
      `Grundbuchauszug: ${data.legalTitle.landRegisterExtractAvailable ? '✓ Vorhanden' : '✗ Nicht vorhanden'}`,
      `Teilungserklärung: ${data.legalTitle.partitionDeclarationAvailable ? '✓ Vorhanden' : '✗ Nicht vorhanden'}`,
    ]);

    // Encumbrances note
    if (data.legalTitle.encumbrancesNote) {
      y += 2;
      y = drawBodyText(doc, y, data.legalTitle.encumbrancesNote);
    }
  }

  // ═══════════════════════════════════════
  // FOOTER on every page — CI-A branded
  // ═══════════════════════════════════════
  addFootersToAllPages(doc, {
    confidential: true,
    org: `Case ${caseShort}`,
    version: 'V7.0',
  });

  // Save
  const filename = `SoT-Gutachten-${caseShort}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
