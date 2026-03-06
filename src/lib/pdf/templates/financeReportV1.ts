/**
 * financeReportV1.ts — MOD-18 Finanzreport / Vermögensauskunft
 * CI-A "SoT Business Premium" — 8-10 pages
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
  drawDivider,
  addFootersToAllPages,
  ensurePageBreak,
  EUR,
  PCT,
  NUM,
  type KpiItem,
  type TableSpec,
} from '@/lib/pdf';

// ─── Data Interface ──────────────────────────────────────────────────

export interface FinanceReportData {
  personName: string;
  reportDate?: string;

  // KPIs
  netWorth: number;
  monthlyOverflow: number;
  liquidityRatio: number; // 0-100
  debtRatio: number; // 0-100

  // Income / Expenses
  incomeItems: Array<{ label: string; monthly: number }>;
  expenseItems: Array<{ label: string; monthly: number }>;

  // Assets / Liabilities
  assetItems: Array<{ label: string; value: number }>;
  liabilityItems: Array<{ label: string; value: number }>;

  // Properties (Top 10)
  properties: Array<{
    address: string;
    type: string;
    value: number;
    rent: number;
    status: string;
  }>;

  // Loans (Top 10)
  loans: Array<{
    lender: string;
    balance: number;
    rate: number;
    interest: number;
    endDate: string;
  }>;

  // Contracts / Subscriptions
  contracts: Array<{
    name: string;
    category: string;
    monthly: number;
  }>;

  // Vorsorge
  vorsorge: Array<{
    type: string;
    provider: string;
    value: number;
    status: string;
  }>;
}

// ─── Generator ───────────────────────────────────────────────────────

export async function generateFinanceReport(data: FinanceReportData): Promise<void> {
  const jsPDF = await getJsPDF();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ═══ PAGE 1: COVER ═══
  let y = drawCover(doc, {
    title: 'Vermögensauskunft',
    subtitle: data.personName,
    date: data.reportDate,
  });

  // KPI Row on cover
  y += 8;
  const kpis: KpiItem[] = [
    { label: 'Nettovermögen', value: EUR(data.netWorth), tone: data.netWorth >= 0 ? 'success' : 'danger' },
    { label: 'Monatl. Überschuss', value: EUR(data.monthlyOverflow), tone: data.monthlyOverflow >= 0 ? 'success' : 'danger' },
    { label: 'Liquiditätsquote', value: PCT(data.liquidityRatio), tone: data.liquidityRatio > 20 ? 'default' : 'warning' },
    { label: 'Verschuldungsgrad', value: PCT(data.debtRatio), tone: data.debtRatio < 60 ? 'default' : 'warning' },
  ];
  y = drawKpiRow(doc, y, kpis);

  // ═══ PAGE 2: EINNAHMEN / AUSGABEN ═══
  doc.addPage();
  y = PAGE.MARGIN_TOP + 10;
  y = drawSectionTitle(doc, y, 'Einnahmen & Ausgaben');

  const totalIncome = data.incomeItems.reduce((s, i) => s + i.monthly, 0);
  const totalExpense = data.expenseItems.reduce((s, i) => s + i.monthly, 0);

  y = drawTable(doc, y, {
    headers: ['Einnahme', 'Monatlich'],
    rows: [
      ...data.incomeItems.map(i => [i.label, EUR(i.monthly)]),
      ['Summe Einnahmen', EUR(totalIncome)],
    ],
    colWidths: [120, 56],
    alignRight: [1],
  });

  y += 4;
  y = drawTable(doc, y, {
    headers: ['Ausgabe', 'Monatlich'],
    rows: [
      ...data.expenseItems.map(i => [i.label, EUR(i.monthly)]),
      ['Summe Ausgaben', EUR(totalExpense)],
    ],
    colWidths: [120, 56],
    alignRight: [1],
  });

  y += 4;
  y = drawInfoCard(doc, y, 'Monatlicher Überschuss', [
    `${EUR(totalIncome)} − ${EUR(totalExpense)} = ${EUR(totalIncome - totalExpense)}`,
  ]);

  // ═══ PAGE 3: VERMÖGEN / VERBINDLICHKEITEN ═══
  doc.addPage();
  y = PAGE.MARGIN_TOP + 10;
  y = drawSectionTitle(doc, y, 'Vermögen & Verbindlichkeiten');

  const totalAssets = data.assetItems.reduce((s, i) => s + i.value, 0);
  const totalLiabilities = data.liabilityItems.reduce((s, i) => s + i.value, 0);

  y = drawTable(doc, y, {
    headers: ['Vermögenswert', 'Wert'],
    rows: [
      ...data.assetItems.map(i => [i.label, EUR(i.value)]),
      ['Summe Vermögen', EUR(totalAssets)],
    ],
    colWidths: [120, 56],
    alignRight: [1],
  });

  y += 4;
  y = drawTable(doc, y, {
    headers: ['Verbindlichkeit', 'Betrag'],
    rows: [
      ...data.liabilityItems.map(i => [i.label, EUR(i.value)]),
      ['Summe Verbindlichkeiten', EUR(totalLiabilities)],
    ],
    colWidths: [120, 56],
    alignRight: [1],
  });

  y += 4;
  y = drawKpiRow(doc, y, [
    { label: 'Bruttovermögen', value: EUR(totalAssets) },
    { label: 'Verbindlichkeiten', value: EUR(totalLiabilities), tone: 'danger' },
    { label: 'Nettovermögen', value: EUR(totalAssets - totalLiabilities), tone: totalAssets > totalLiabilities ? 'success' : 'danger' },
  ]);

  // ═══ PAGE 4: IMMOBILIEN ═══
  if (data.properties.length > 0) {
    doc.addPage();
    y = PAGE.MARGIN_TOP + 10;
    y = drawSectionTitle(doc, y, 'Immobilienübersicht', `Top ${Math.min(data.properties.length, 10)} Objekte`);

    y = drawTable(doc, y, {
      headers: ['Adresse', 'Typ', 'Verkehrswert', 'Miete/M.', 'Status'],
      rows: data.properties.slice(0, 10).map(p => [
        p.address, p.type, EUR(p.value), EUR(p.rent), p.status,
      ]),
      colWidths: [60, 24, 34, 28, 30],
      alignRight: [2, 3],
    });
  }

  // ═══ PAGE 5: DARLEHEN ═══
  if (data.loans.length > 0) {
    doc.addPage();
    y = PAGE.MARGIN_TOP + 10;
    y = drawSectionTitle(doc, y, 'Darlehensübersicht', `Top ${Math.min(data.loans.length, 10)} Darlehen`);

    y = drawTable(doc, y, {
      headers: ['Kreditgeber', 'Restschuld', 'Rate/M.', 'Zins %', 'Ende'],
      rows: data.loans.slice(0, 10).map(l => [
        l.lender, EUR(l.balance), EUR(l.rate), PCT(l.interest), l.endDate,
      ]),
      colWidths: [46, 34, 28, 22, 26],
      alignRight: [1, 2, 3],
    });
  }

  // ═══ PAGE 6: VERTRÄGE / ABOS ═══
  if (data.contracts.length > 0) {
    doc.addPage();
    y = PAGE.MARGIN_TOP + 10;
    y = drawSectionTitle(doc, y, 'Verträge & Abonnements');

    y = drawTable(doc, y, {
      headers: ['Vertrag', 'Kategorie', 'Monatlich'],
      rows: data.contracts.map(c => [c.name, c.category, EUR(c.monthly)]),
      colWidths: [80, 50, 46],
      alignRight: [2],
    });
  }

  // ═══ PAGE 7: VORSORGE ═══
  if (data.vorsorge.length > 0) {
    doc.addPage();
    y = PAGE.MARGIN_TOP + 10;
    y = drawSectionTitle(doc, y, 'Vorsorge & Absicherung');

    y = drawTable(doc, y, {
      headers: ['Art', 'Anbieter', 'Wert', 'Status'],
      rows: data.vorsorge.map(v => [v.type, v.provider, EUR(v.value), v.status]),
      colWidths: [40, 50, 40, 46],
      alignRight: [2],
    });
  }

  // ═══ LAST PAGE: APPENDIX ═══
  doc.addPage();
  y = PAGE.MARGIN_TOP + 10;
  y = drawSectionTitle(doc, y, 'Hinweise');
  y = drawInfoCard(doc, y, 'Datengrundlage', [
    'Alle Angaben basieren auf den im System hinterlegten Daten.',
    'Immobilienwerte entsprechen den zuletzt gespeicherten Verkehrswerten.',
    'Diese Vermögensauskunft dient der internen Übersicht und ist kein geprüfter Finanzbericht.',
  ]);

  y += 4;
  y = drawInfoCard(doc, y, 'Vertraulichkeit', [
    'Dieses Dokument enthält persönliche Finanz- und Vermögensdaten.',
    'Weitergabe an Dritte nur mit ausdrücklicher Zustimmung des Eigentümers.',
  ]);

  // ═══ FOOTERS ON ALL PAGES ═══
  addFootersToAllPages(doc, { confidential: true });

  doc.save(`Vermögensauskunft_${data.personName.replace(/\s+/g, '_')}.pdf`);
}
