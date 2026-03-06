/**
 * generateInvoicePdf.ts — SSOT shared invoice PDF generator
 * 
 * Used by PetsMeinBereich (MOD-22) and any future invoice export.
 * Uses CI-A header/footer from pdfCiKit.
 */

import { getJsPDF } from '@/lib/lazyJspdf';
import {
  PAGE, COLOR, TYPO, drawCiFooter, addFootersToAllPages, EUR as ciEUR,
} from '@/lib/pdf';

export interface InvoiceData {
  invoiceNumber: string;
  createdAt: string;
  dueDate?: string | null;
  netCents: number;
  taxCents: number;
  amountCents: number;
  items: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }>;
}

const formatCents = (c: number) =>
  (c / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

export async function generateInvoicePdf(invoice: InvoiceData): Promise<void> {
  const jsPDF = await getJsPDF();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const M = PAGE.MARGIN_LEFT;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLOR.INK[0], COLOR.INK[1], COLOR.INK[2]);
  doc.text('Rechnung', M, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let y = 35;
  doc.text(`Rechnungsnr.: ${invoice.invoiceNumber}`, M, y);
  y += 6;
  doc.text(`Datum: ${invoice.createdAt}`, M, y);
  if (invoice.dueDate) {
    y += 6;
    doc.text(`Fällig: ${invoice.dueDate}`, M, y);
  }

  // Table header
  y += 13;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLOR.MUTED[0], COLOR.MUTED[1], COLOR.MUTED[2]);
  const cols = { pos: M, desc: M + 15, qty: 130, unit: 150, total: 180 };
  doc.text('Pos.', cols.pos, y);
  doc.text('Beschreibung', cols.desc, y);
  doc.text('Menge', cols.qty, y);
  doc.text('Einzelpreis', cols.unit, y);
  doc.text('Gesamt', cols.total, y);
  y += 2;
  doc.setDrawColor(COLOR.BORDER[0], COLOR.BORDER[1], COLOR.BORDER[2]);
  doc.line(M, y, 195, y);
  y += 5;

  // Items
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR.INK[0], COLOR.INK[1], COLOR.INK[2]);
  invoice.items.forEach((item, i) => {
    if (y > 260) { doc.addPage(); y = 25; }
    doc.text(`${i + 1}`, cols.pos, y);
    doc.text(item.description.substring(0, 50), cols.desc, y);
    doc.text(`${item.quantity}`, cols.qty, y);
    doc.text(formatCents(item.unitPriceCents), cols.unit, y);
    doc.text(formatCents(item.totalCents), cols.total, y);
    y += 6;
  });

  // Summary
  y += 5;
  doc.line(140, y, 195, y);
  y += 6;
  doc.text(`Netto: ${formatCents(invoice.netCents)}`, 150, y);
  y += 5;
  doc.text(`USt. 19%: ${formatCents(invoice.taxCents)}`, 150, y);
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Gesamt: ${formatCents(invoice.amountCents)}`, 150, y);

  // Footer
  addFootersToAllPages(doc, { confidential: false });

  doc.save(`Rechnung_${invoice.invoiceNumber}.pdf`);
}
