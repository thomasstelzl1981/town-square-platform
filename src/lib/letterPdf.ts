import jsPDF from 'jspdf';
import { formatDateLong } from './formatters';

export interface LetterPdfData {
  senderName?: string;
  senderCompany?: string;
  senderAddress?: string;
  senderCity?: string;
  senderRole?: string;
  recipientName?: string;
  recipientCompany?: string;
  recipientAddress?: string;
  subject?: string;
  body?: string;
  date?: string;
}

/**
 * Generate a DIN 5008 Form B compliant letter PDF.
 * Returns the PDF as base64 string and as Blob.
 */
export function generateLetterPdf(data: LetterPdfData): { base64: string; blob: Blob; dataUrl: string } {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const leftMargin = 25; // DIN 5008 left margin
  const rightMargin = 20;
  const textWidth = pageWidth - leftMargin - rightMargin;

  // Font setup
  doc.setFont('helvetica');

  // ── Sender line (small, above window) ──
  const senderLineParts = [data.senderCompany, data.senderName, data.senderAddress?.replace(/\n/g, ', ')].filter(Boolean);
  const senderLine = senderLineParts.join(' · ');
  
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  if (senderLine) {
    doc.text(senderLine, leftMargin, 45);
    // Underline
    const lineWidth = doc.getTextWidth(senderLine);
    doc.setDrawColor(200, 200, 200);
    doc.line(leftMargin, 45.8, leftMargin + Math.min(lineWidth, textWidth), 45.8);
  }

  // ── Recipient window (DIN 5008: starts at 45mm from top, 85x45mm) ──
  let yPos = 49;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);

  if (data.recipientCompany) {
    doc.text(data.recipientCompany, leftMargin, yPos);
    yPos += 5.5;
  }
  if (data.recipientName) {
    doc.text(data.recipientName, leftMargin, yPos);
    yPos += 5.5;
  }
  if (data.recipientAddress) {
    const addressLines = data.recipientAddress.split('\n');
    for (const line of addressLines) {
      if (line.trim()) {
        doc.text(line.trim(), leftMargin, yPos);
        yPos += 5.5;
      }
    }
  }

  // ── Date — right-aligned ──
  const dateStr = data.date || formatDateLong(new Date(), data.senderCity);
  yPos = 95; // Fixed position after window zone
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(dateStr, pageWidth - rightMargin, yPos, { align: 'right' });
  yPos += 12;

  // ── Subject — bold ──
  if (data.subject) {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(data.subject, leftMargin, yPos);
    yPos += 10;
  }

  // ── Body ──
  if (data.body) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);

    const lines = doc.splitTextToSize(data.body, textWidth);
    const lineHeight = 6;
    
    for (const line of lines) {
      if (yPos > 270) {
        doc.addPage();
        yPos = 25;
      }
      doc.text(line, leftMargin, yPos);
      yPos += lineHeight;
    }
  }

  const base64 = doc.output('datauristring').split(',')[1];
  const blob = doc.output('blob');
  const dataUrl = doc.output('datauristring');

  return { base64, blob, dataUrl };
}
