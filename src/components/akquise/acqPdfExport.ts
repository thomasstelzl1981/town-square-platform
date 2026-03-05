import { getJsPDF } from '@/lib/lazyJspdf';
import { formatPriceRange } from './ProfileRow';
import { toast } from 'sonner';

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
  const margin = 20;
  let y = margin;

  // Logo (top right) — only if logoUrl provided
  if (options?.logoUrl) {
    const img = await fetchImageAsBase64(options.logoUrl);
    if (img) {
      try {
        doc.addImage(img.data, img.format, 150, margin, 40, 14);
      } catch { /* logo rendering failed, skip */ }
    }
  }

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ANKAUFSPROFIL', margin, y + 4);
  y += 14;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160);
  doc.text(`Erstellt am ${new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, y);
  y += 12;

  doc.setDrawColor(200);
  doc.line(margin, y, 190, y);
  y += 8;

  // Client
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
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
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100);
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    const lines = doc.splitTextToSize(value, 120);
    doc.text(lines, margin + 50, y);
    y += lines.length * 5 + 4;
  });

  y += 6;
  doc.setDrawColor(200);
  doc.line(margin, y, 190, y);
  y += 8;

  // Profile text
  if (profileTextLong) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const textLines = doc.splitTextToSize(profileTextLong, 170);
    doc.text(textLines, margin, y);
  }

  // Footer
  const footerText = options?.companyName ? `${options.companyName} · Vertraulich` : 'Vertraulich';
  doc.setFontSize(7);
  doc.setTextColor(180);
  doc.text(footerText, 105, 285, { align: 'center' });

  doc.save(`Ankaufsprofil_${clientName?.replace(/\s/g, '_') || 'Profil'}.pdf`);
  toast.success('PDF exportiert');
}
