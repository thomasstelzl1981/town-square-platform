import { getJsPDF } from '@/lib/lazyJspdf';
import { formatPriceRange } from './ProfileRow';
import logoLight from '@/assets/logos/armstrong_logo_light.png';
import { toast } from 'sonner';

export interface AcqProfileForPdf {
  region?: string;
  asset_focus?: string[];
  price_min?: number | null;
  price_max?: number | null;
  yield_target?: number | null;
  exclusions?: string;
}

export async function generateAcqPdf(
  profileData: AcqProfileForPdf,
  clientName: string,
  profileTextLong: string,
) {
  const jsPDF = await getJsPDF();
  const doc = new jsPDF('p', 'mm', 'a4');
  const margin = 20;
  let y = margin;

  // Logo (top right)
  try {
    doc.addImage(logoLight, 'PNG', 150, margin, 40, 14);
  } catch { /* logo optional */ }

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

  doc.save(`Ankaufsprofil_${clientName?.replace(/\s/g, '_') || 'Profil'}.pdf`);
  toast.success('PDF exportiert');
}
