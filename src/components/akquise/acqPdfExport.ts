/**
 * acqPdfExport.ts — MOD-12 Ankaufsprofil PDF
 * Migrated to CI-A pdfCiKit — single jsPDF export path only.
 */

import { getJsPDF } from '@/lib/lazyJspdf';
import { formatPriceRange } from './ProfileRow';
import { toast } from 'sonner';
import {
  PAGE, COLOR, TYPO,
  drawCiHeader, addFootersToAllPages,
} from '@/lib/pdf';

export interface AcqProfileForPdf {
  region?: string;
  asset_focus?: string[];
  price_min?: number | null;
  price_max?: number | null;
  yield_target?: number | null;
  exclusions?: string;
}

export interface AcqPdfOptions {
  logoUrl?: string;
  companyName?: string;
}

async function fetchImageAsBase64(url: string): Promise<{ data: string; format: string } | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    const format = blob.type.includes('png') ? 'PNG' : 'JPEG';
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({ data: reader.result as string, format });
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateAcqPdf(
  profileData: AcqProfileForPdf,
  clientName: string,
  profileTextLong: string,
  options?: AcqPdfOptions,
) {
  const jsPDF = await getJsPDF();
  const doc = new jsPDF('p', 'mm', 'a4');
  const margin = PAGE.MARGIN_LEFT;

  // CI-A Header
  let y = drawCiHeader(doc, {
    title: 'Ankaufsprofil',
    subtitle: clientName || 'Investor',
  });

  // Logo (top right) — only if logoUrl provided
  if (options?.logoUrl) {
    const img = await fetchImageAsBase64(options.logoUrl);
    if (img) {
      try {
        doc.addImage(img.data, img.format, 150, PAGE.MARGIN_TOP, 40, 14);
      } catch { /* logo rendering failed, skip */ }
    }
  }

  y += 4;

  // Client
  doc.setTextColor(COLOR.INK[0], COLOR.INK[1], COLOR.INK[2]);
  doc.setFontSize(12);
  doc.setFont(TYPO.FONT_FAMILY, 'bold');
  doc.text(clientName || 'Investor', margin, y);
  y += 10;

  // Profile table
  const rows: [string, string][] = [
    ['Suchgebiet', profileData.region || '–'],
    ['Asset-Fokus', profileData.asset_focus?.join(', ') || '–'],
    ['Investitionsrahmen', formatPriceRange(profileData.price_min, profileData.price_max)],
    ['Zielrendite', profileData.yield_target ? `${profileData.yield_target}%` : '–'],
    ['Ausschlüsse', profileData.exclusions || '–'],
  ];

  doc.setFontSize(9);
  rows.forEach(([label, value]) => {
    doc.setFont(TYPO.FONT_FAMILY, 'bold');
    doc.setTextColor(COLOR.MUTED[0], COLOR.MUTED[1], COLOR.MUTED[2]);
    doc.text(label, margin, y);
    doc.setFont(TYPO.FONT_FAMILY, 'normal');
    doc.setTextColor(COLOR.INK[0], COLOR.INK[1], COLOR.INK[2]);
    const lines = doc.splitTextToSize(value, 120);
    doc.text(lines, margin + 50, y);
    y += lines.length * 5 + 4;
  });

  y += 6;
  doc.setDrawColor(COLOR.BORDER[0], COLOR.BORDER[1], COLOR.BORDER[2]);
  doc.line(margin, y, PAGE.WIDTH - PAGE.MARGIN_RIGHT, y);
  y += 8;

  // Profile text
  if (profileTextLong) {
    doc.setFontSize(10);
    doc.setFont(TYPO.FONT_FAMILY, 'normal');
    doc.setTextColor(COLOR.INK[0], COLOR.INK[1], COLOR.INK[2]);
    const textLines = doc.splitTextToSize(profileTextLong, PAGE.CONTENT_WIDTH);
    doc.text(textLines, margin, y);
  }

  // CI-A Footers
  addFootersToAllPages(doc, { confidential: true, org: options?.companyName });

  doc.save(`Ankaufsprofil_${clientName?.replace(/\s/g, '_') || 'Profil'}.pdf`);
  toast.success('PDF exportiert');
}
