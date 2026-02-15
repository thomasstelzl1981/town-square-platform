/**
 * PDF-Export fuer formell wirksame Nebenkostenabrechnung
 * 
 * Erzeugt ein PDF gemaess den formellen Anforderungen:
 * - Gesamtkosten pro Position
 * - Verteilerschluessel + Anteil
 * - Vorauszahlungen
 * - Saldo (Nachzahlung/Guthaben)
 * - Einspruchsfrist-Hinweis
 */

import jsPDF from 'jspdf';
import { NKSettlementMatrix } from './spec';

const EUR = (v: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);

const KEY_LABELS: Record<string, string> = {
  area_sqm: 'Fläche (m²)',
  mea: 'MEA',
  persons: 'Personen',
  consumption: 'Verbrauch',
  unit_count: 'Einheiten',
  custom: 'Individuell',
  direct: 'Direkt',
};

export function generateNKPdf(matrix: NKSettlementMatrix): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = 25;

  // Header
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Vermieter', margin, y);
  y += 12;

  // Empfaenger
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(matrix.header.tenantName, margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.text(matrix.header.propertyName, margin, y);
  y += 12;

  // Betreff
  doc.setFontSize(13);
  doc.setFont(undefined!, 'bold');
  doc.text('Betriebskostenabrechnung', margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont(undefined!, 'normal');
  doc.text(
    `für den Zeitraum ${formatDate(matrix.header.periodStart)} – ${formatDate(matrix.header.periodEnd)}`,
    margin,
    y
  );
  y += 10;

  // Objektdaten
  doc.setFontSize(9);
  doc.text(`Objekt: ${matrix.header.propertyName}`, margin, y);
  y += 5;
  doc.text(`Einheit: ${matrix.header.unitLabel}`, margin, y);
  y += 5;
  doc.text(`Abrechnungszeitraum: ${matrix.header.daysRatio} Tage`, margin, y);
  y += 10;

  // Tabelle Header
  const cols = [margin, margin + 55, margin + 85, margin + 115, margin + 145];
  doc.setFontSize(8);
  doc.setFont(undefined!, 'bold');
  doc.text('Kostenart', cols[0], y);
  doc.text('Schlüssel', cols[1], y);
  doc.text('Haus gesamt', cols[2], y);
  doc.text('Anteil', cols[3], y);
  y += 2;
  doc.setDrawColor(180);
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  // Zeilen
  doc.setFont(undefined!, 'normal');
  const apportionableRows = matrix.rows.filter((r) => r.isApportionable);
  const nonApportionableRows = matrix.rows.filter((r) => !r.isApportionable);

  for (const row of apportionableRows) {
    if (y > 260) {
      doc.addPage();
      y = 25;
    }
    doc.text(row.label, cols[0], y);
    doc.text(KEY_LABELS[row.keyType] || row.keyType, cols[1], y);
    doc.text(EUR(row.totalHouse), cols[2], y);
    doc.text(EUR(row.shareUnit), cols[3], y);
    y += 5;
  }

  // Trennlinie
  y += 2;
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  // Nicht umlagefaehig (Hinweis)
  if (nonApportionableRows.length > 0) {
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text('Nicht umlagefähige Kosten (zur Information):', margin, y);
    y += 4;
    for (const row of nonApportionableRows) {
      doc.text(`  ${row.label}: ${EUR(row.totalHouse)}`, margin, y);
      y += 4;
    }
    doc.setTextColor(0);
    y += 4;
  }

  // Summary
  doc.setFontSize(10);
  doc.setFont(undefined!, 'bold');
  const summaryX = margin + 80;
  doc.text('Summe umlagefähige Kosten:', margin, y);
  doc.text(EUR(matrix.summary.totalApportionable), summaryX, y);
  y += 6;

  doc.setFont(undefined!, 'normal');
  doc.text('Vorauszahlungen:', margin, y);
  doc.text(EUR(matrix.summary.totalPrepaid), summaryX, y);
  y += 8;

  doc.setFont(undefined!, 'bold');
  doc.setFontSize(12);
  const balanceLabel = matrix.summary.balance >= 0 ? 'Nachzahlung' : 'Guthaben';
  doc.text(`${balanceLabel}:`, margin, y);
  doc.text(EUR(Math.abs(matrix.summary.balance)), summaryX, y);
  y += 12;

  // Zahlungshinweis
  doc.setFontSize(9);
  doc.setFont(undefined!, 'normal');
  if (matrix.summary.balance > 0) {
    doc.text(
      `Bitte überweisen Sie den Betrag von ${EUR(matrix.summary.balance)} innerhalb von 30 Tagen.`,
      margin,
      y
    );
  } else {
    doc.text(
      `Das Guthaben von ${EUR(Math.abs(matrix.summary.balance))} wird Ihnen erstattet.`,
      margin,
      y
    );
  }
  y += 8;

  // Rechtshinweis
  doc.setFontSize(7);
  doc.setTextColor(120);
  doc.text(
    'Einwendungen gegen diese Abrechnung sind innerhalb von 12 Monaten nach Zugang geltend zu machen (§ 556 Abs. 3 BGB).',
    margin,
    y
  );
  y += 8;

  // Fusszeile
  doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, margin, y);

  return doc;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
