/**
 * portfolioDossierV1.ts — MOD-04 Portfolio-Report
 * CI-A "SoT Business Premium" — 6-10 pages (Typ C Dossier)
 * 
 * @version 1.0.0
 */

import { getJsPDF } from '@/lib/lazyJspdf';
import {
  PAGE,
  drawCover,
  drawSectionTitle,
  drawKpiRow,
  drawTable,
  drawInfoCard,
  addFootersToAllPages,
  ensurePageBreak,
  EUR,
  PCT,
  NUM,
  type KpiItem,
} from '@/lib/pdf';

// ─── Data Interface ──────────────────────────────────────────────────

export interface PortfolioDossierData {
  ownerName: string;
  reportDate?: string;

  // Aggregated KPIs
  totalValue: number;
  totalRentYearly: number;
  vacancyRate: number; // 0-100
  avgYield: number;
  totalDebt: number;
  totalAnnuity: number;

  // Properties
  properties: Array<{
    address: string;
    type: string;
    value: number;
    units: number;
    rentMonthly: number;
    yieldGross: number;
    vacancy: number; // 0-100
    status: string;
  }>;

  // Financing summary
  loans: Array<{
    property: string;
    lender: string;
    balance: number;
    rate: number;
    fixedUntil: string;
  }>;

  // Risk flags
  riskFlags: Array<{
    flag: string;
    severity: 'high' | 'medium' | 'low';
    detail: string;
  }>;
}

// ─── Generator ───────────────────────────────────────────────────────

export async function generatePortfolioDossier(data: PortfolioDossierData): Promise<void> {
  const jsPDF = await getJsPDF();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ═══ PAGE 1: COVER ═══
  let y = drawCover(doc, {
    title: 'Portfolio-Report',
    subtitle: `${data.ownerName} · ${data.properties.length} Objekte`,
    date: data.reportDate,
  });

  // KPI Row
  y += 4;
  y = drawKpiRow(doc, y, [
    { label: 'Portfoliowert', value: EUR(data.totalValue), tone: 'accent' },
    { label: 'Mieteinnahmen p.a.', value: EUR(data.totalRentYearly) },
    { label: 'Leerstandsquote', value: PCT(data.vacancyRate), tone: data.vacancyRate > 10 ? 'warning' : 'success' },
    { label: 'Ø Rendite', value: PCT(data.avgYield) },
  ]);

  // ═══ PAGE 2: PORTFOLIO-TABELLE ═══
  doc.addPage();
  y = PAGE.MARGIN_TOP + 10;
  y = drawSectionTitle(doc, y, 'Objektübersicht', `${data.properties.length} Immobilien im Portfolio`);

  y = drawTable(doc, y, {
    headers: ['Adresse', 'Typ', 'WE', 'Verkehrswert', 'Miete/M.', 'Rendite', 'Leerstand'],
    rows: data.properties.slice(0, 20).map(p => [
      p.address.substring(0, 30),
      p.type,
      String(p.units),
      EUR(p.value),
      EUR(p.rentMonthly),
      PCT(p.yieldGross),
      PCT(p.vacancy),
    ]),
    colWidths: [46, 20, 12, 28, 24, 22, 24],
    alignRight: [2, 3, 4, 5, 6],
  });

  // Summary row
  const totalRentMonthly = data.properties.reduce((s, p) => s + p.rentMonthly, 0);
  const totalUnits = data.properties.reduce((s, p) => s + p.units, 0);
  y += 2;
  y = drawInfoCard(doc, y, 'Portfolio Zusammenfassung', [
    `${data.properties.length} Objekte · ${totalUnits} Einheiten · Gesamtwert: ${EUR(data.totalValue)} · Miete/M.: ${EUR(totalRentMonthly)}`,
  ]);

  // ═══ PAGE 3+: OBJEKT-KACHELN (2-3 per page) ═══
  if (data.properties.length > 0) {
    doc.addPage();
    y = PAGE.MARGIN_TOP + 10;
    y = drawSectionTitle(doc, y, 'Objektdetails');

    for (let i = 0; i < Math.min(data.properties.length, 15); i++) {
      const p = data.properties[i];
      y = ensurePageBreak(doc, y, 35);

      // Object card
      y = drawKpiRow(doc, y, [
        { label: 'Wert', value: EUR(p.value) },
        { label: 'Miete/M.', value: EUR(p.rentMonthly) },
        { label: 'Rendite', value: PCT(p.yieldGross), tone: p.yieldGross > 4 ? 'success' : 'default' },
      ]);

      // Label
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 18, 32);
      doc.text(`${p.address} · ${p.type} · ${p.units} WE`, PAGE.MARGIN_LEFT, y);
      y += 6;
    }
  }

  // ═══ FINANCING ═══
  if (data.loans.length > 0) {
    doc.addPage();
    y = PAGE.MARGIN_TOP + 10;
    y = drawSectionTitle(doc, y, 'Finanzierungsübersicht');

    y = drawKpiRow(doc, y, [
      { label: 'Gesamtschuld', value: EUR(data.totalDebt), tone: 'danger' },
      { label: 'Annuität p.a.', value: EUR(data.totalAnnuity) },
      { label: 'LTV', value: PCT(data.totalValue > 0 ? (data.totalDebt / data.totalValue) * 100 : 0), tone: (data.totalDebt / data.totalValue) * 100 > 70 ? 'warning' : 'default' },
    ]);

    y = drawTable(doc, y, {
      headers: ['Objekt', 'Kreditgeber', 'Restschuld', 'Rate/M.', 'Zinsb. bis'],
      rows: data.loans.map(l => [
        l.property.substring(0, 25),
        l.lender,
        EUR(l.balance),
        EUR(l.rate),
        l.fixedUntil,
      ]),
      colWidths: [40, 36, 32, 28, 28],
      alignRight: [2, 3],
    });
  }

  // ═══ RISK FLAGS ═══
  if (data.riskFlags.length > 0) {
    doc.addPage();
    y = PAGE.MARGIN_TOP + 10;
    y = drawSectionTitle(doc, y, 'Risiken & Handlungsbedarf');

    y = drawTable(doc, y, {
      headers: ['Risiko', 'Schwere', 'Detail'],
      rows: data.riskFlags.map(r => [r.flag, r.severity.toUpperCase(), r.detail]),
      colWidths: [50, 24, 102],
    });
  }

  // ═══ APPENDIX ═══
  doc.addPage();
  y = PAGE.MARGIN_TOP + 10;
  y = drawSectionTitle(doc, y, 'Hinweise');
  y = drawInfoCard(doc, y, 'Datengrundlage', [
    'Alle Werte basieren auf den im System hinterlegten Daten.',
    'Verkehrswerte entsprechen der letzten Bewertung oder manuellen Eingabe.',
    'Mietangaben basieren auf aktiven Mietverträgen.',
  ]);

  // ═══ FOOTERS ═══
  addFootersToAllPages(doc, { confidential: true });

  doc.save(`Portfolio_${data.ownerName.replace(/\s+/g, '_')}.pdf`);
}
