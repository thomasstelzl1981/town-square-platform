/**
 * generateValuationPdf — Creates a branded SoT Bewertungsgutachten PDF (max 12 pages)
 * Uses lazy-loaded jsPDF. Pure data-driven, no DOM dependency.
 */
import { getJsPDF } from '@/lib/lazyJspdf';
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

const EUR = (v: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const PCT = (v: number) => `${(v * 100).toFixed(1)}%`;

export async function generateValuationPdf(data: ValuationPdfData): Promise<void> {
  const jsPDF = await getJsPDF();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210;
  const H = 297;
  const ML = 20; // margin left
  const MR = 20;
  const CW = W - ML - MR; // content width
  let y = 0;

  const colors = {
    primary: [30, 64, 175] as [number, number, number],   // blue-800
    dark: [15, 23, 42] as [number, number, number],        // slate-900
    muted: [100, 116, 139] as [number, number, number],    // slate-500
    light: [241, 245, 249] as [number, number, number],    // slate-100
    white: [255, 255, 255] as [number, number, number],
    green: [22, 163, 74] as [number, number, number],
    red: [220, 38, 38] as [number, number, number],
  };

  function newPage() {
    doc.addPage();
    y = 20;
  }

  function heading(text: string, size = 14) {
    if (y > H - 40) newPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(...colors.dark);
    doc.text(text, ML, y);
    y += size * 0.5 + 4;
  }

  function subheading(text: string) {
    if (y > H - 30) newPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...colors.primary);
    doc.text(text, ML, y);
    y += 6;
  }

  function body(text: string, maxWidth = CW) {
    if (y > H - 25) newPage();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...colors.dark);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, ML, y);
    y += lines.length * 4 + 2;
  }

  function label(text: string) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...colors.muted);
    doc.text(text, ML, y);
  }

  function value(text: string, x: number) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...colors.dark);
    doc.text(text, x, y);
  }

  function row(lbl: string, val: string, x2 = ML + 60) {
    if (y > H - 20) newPage();
    label(lbl);
    value(val, x2);
    y += 5;
  }

  function separator() {
    doc.setDrawColor(...colors.light);
    doc.setLineWidth(0.3);
    doc.line(ML, y, W - MR, y);
    y += 4;
  }

  // ═══════════════════════════════════════
  // PAGE 1: COVER
  // ═══════════════════════════════════════
  y = 60;
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, W, 45, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...colors.white);
  doc.text('SoT Bewertungsgutachten', ML, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const sourceModeLabel = data.sourceMode === 'SSOT_FINAL' ? '  ·  Datenbasis: SSOT (Final)' : '  ·  Datenbasis: Exposé Draft';
  doc.text(`Case ${data.caseId.slice(0, 8)}  ·  ${new Date(data.generatedAt).toLocaleDateString('de-DE')}${sourceModeLabel}`, ML, 35);

  y = 60;
  heading(data.snapshot.address || 'Objekt', 16);
  body(`${data.snapshot.postalCode || ''} ${data.snapshot.city || ''}`);
  y += 5;

  subheading('Objektdaten');
  row('Typ', data.snapshot.objectType?.toUpperCase() || '–');
  row('Wohnfläche', data.snapshot.livingAreaSqm ? `${data.snapshot.livingAreaSqm} m²` : '–');
  row('Grundstück', data.snapshot.plotAreaSqm ? `${data.snapshot.plotAreaSqm} m²` : '–');
  row('Baujahr', data.snapshot.yearBuilt?.toString() || '–');
  row('Einheiten', data.snapshot.units?.toString() || '–');
  row('Zustand', data.snapshot.condition || '–');
  row('Angebotspreis', data.snapshot.askingPrice ? EUR(data.snapshot.askingPrice) : '–');
  y += 5;

  // Value Band highlight
  doc.setFillColor(...colors.light);
  doc.roundedRect(ML, y, CW, 28, 3, 3, 'F');
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...colors.muted);
  doc.text('WERTBAND (P25 – P50 – P75)', ML + 5, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...colors.primary);
  doc.text(EUR(data.valueBand.p50), ML + 5, y);
  doc.setFontSize(9);
  doc.setTextColor(...colors.muted);
  doc.text(`${EUR(data.valueBand.p25)}  –  ${EUR(data.valueBand.p75)}`, ML + 70, y);
  y += 15;

  // ═══════════════════════════════════════
  // PAGE 2: EXECUTIVE SUMMARY
  // ═══════════════════════════════════════
  newPage();
  heading('Executive Summary');
  body(data.executiveSummary || 'Keine Zusammenfassung verfügbar.');
  y += 5;

  if (data.dataQuality) {
    subheading('Datenlage');
    row('Vollständigkeit', `${data.dataQuality.completenessPercent.toFixed(0)}%`);
    row('Verifizierte Felder', data.dataQuality.fieldsVerified.toString());
    row('Abgeleitete Felder', data.dataQuality.fieldsDerived.toString());
    row('Fehlende Felder', data.dataQuality.fieldsMissing.toString());
    row('Konfidenz', `${data.dataQuality.globalConfidence} (${(data.dataQuality.globalConfidenceScore * 100).toFixed(0)}%)`);
    y += 5;
  }

  // ═══════════════════════════════════════
  // PAGE 3: BEWERTUNGSMETHODEN
  // ═══════════════════════════════════════
  newPage();
  heading('Bewertungsmethoden');

  for (const m of data.methods) {
    subheading(m.method.replace('_', ' ').replace(/^\w/, c => c.toUpperCase()));
    row('Wert', EUR(m.value));
    row('Konfidenz', `${m.confidence} (${(m.confidenceScore * 100).toFixed(0)}%)`);
    if (m.notes.length) {
      body(m.notes.join('; '));
    }
    y += 3;
  }

  separator();
  subheading('Gewichtung');
  for (const w of data.valueBand.weightingTable) {
    row(w.method.replace('_', ' '), `${(w.weight * 100).toFixed(0)}% → ${EUR(w.value)}`);
  }
  y += 3;
  body(data.valueBand.reasoning);

  // ═══════════════════════════════════════
  // PAGE 4: VERGLEICHSANGEBOTE
  // ═══════════════════════════════════════
  if (data.compStats || data.comps.length > 0) {
    newPage();
    heading('Vergleichsangebote');

    if (data.compStats) {
      row('Anzahl', `${data.compStats.dedupedCount} (von ${data.compStats.count} roh)`);
      row('Median €/m²', EUR(data.compStats.medianPriceSqm));
      row('P25 / P75 €/m²', `${EUR(data.compStats.p25PriceSqm)} / ${EUR(data.compStats.p75PriceSqm)}`);
      y += 5;
    }

    // Top 10 comps table
    const topComps = data.comps.slice(0, 10);
    if (topComps.length > 0) {
      subheading('Top Vergleichsobjekte');
      for (const c of topComps) {
        if (y > H - 20) newPage();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...colors.dark);
        doc.text(`${c.title?.slice(0, 40) || '–'}  |  ${EUR(c.price)}  |  ${c.area}m²  |  ${EUR(c.priceSqm)}/m²`, ML, y);
        y += 4;
      }
    }
  }

  // ═══════════════════════════════════════
  // PAGE 5: STANDORT
  // ═══════════════════════════════════════
  if (data.location) {
    newPage();
    heading('Standortanalyse');
    row('Gesamtscore', `${data.location.overallScore}/100`);
    y += 3;

    for (const dim of data.location.dimensions) {
      row(dim.label, `${dim.score}/10`);
    }
    y += 5;
    body(data.location.narrative);
  }

  // ═══════════════════════════════════════
  // PAGE 6: FINANZIERUNG
  // ═══════════════════════════════════════
  if (data.financing.length > 0) {
    newPage();
    heading('Finanzierbarkeit');

    for (const f of data.financing) {
      subheading(`Szenario: ${f.name}`);
      row('LTV', PCT(f.ltv));
      row('Darlehen', EUR(f.loanAmount));
      row('Eigenkapital', EUR(f.equity));
      row('Zins / Tilgung', `${PCT(f.interestRate)} / ${PCT(f.repaymentRate)}`);
      row('Monatsrate', EUR(f.monthlyRate));
      if (f.cashflowAfterDebt != null) {
        row('CF nach KD/Jahr', EUR(f.cashflowAfterDebt));
      }
      row('Ampel', f.trafficLight.toUpperCase());
      y += 3;
    }
  }

  // ═══════════════════════════════════════
  // PAGE 7: STRESS-TESTS
  // ═══════════════════════════════════════
  if (data.stressTests.length > 0) {
    newPage();
    heading('Stress-Tests & KDF');

    for (const st of data.stressTests) {
      row(st.label, `${EUR(st.monthlyRate)}/mtl.  |  DSCR: ${st.dscr?.toFixed(2) || '–'}  |  ${st.trafficLight.toUpperCase()}`);
    }
  }

  // ═══════════════════════════════════════
  // PAGE 8: BELEIHUNG
  // ═══════════════════════════════════════
  if (data.lienProxy) {
    y += 10;
    if (y > H - 60) newPage();
    heading('Beleihungswert (Proxy)');
    row('Marktwert P50', EUR(data.lienProxy.marketValueP50));
    row('Abschlag gesamt', PCT(data.lienProxy.totalDiscount));
    row('Beleihung niedrig', EUR(data.lienProxy.lienValueLow));
    row('Beleihung hoch', EUR(data.lienProxy.lienValueHigh));
    row('Sicheres LTV-Fenster', `${PCT(data.lienProxy.safeLtvWindow[0])} – ${PCT(data.lienProxy.safeLtvWindow[1])}`);

    if (data.lienProxy.riskDrivers.length) {
      y += 3;
      subheading('Risikotreiber');
      for (const rd of data.lienProxy.riskDrivers) {
        row(rd.factor, `−${PCT(rd.discountPercent)}`);
      }
    }
  }

  // ═══════════════════════════════════════
  // FOOTER on every page
  // ═══════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...colors.muted);
    doc.text(`SoT Bewertungsgutachten  ·  ${data.caseId.slice(0, 8)}  ·  Seite ${i}/${totalPages}`, ML, H - 10);
    doc.text('Dieses Gutachten ersetzt keine bankfähige Wertermittlung.', W - MR, H - 10, { align: 'right' });
  }

  // Save
  const filename = `SoT-Gutachten-${data.caseId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
