/**
 * salesExposeV1.ts — MOD-06 Verkaufsexposé
 * CI-A "SoT Business Premium" — 4-6 pages
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
  drawBodyText,
  addFootersToAllPages,
  ensurePageBreak,
  EUR,
  PCT,
  NUM,
  type KpiItem,
} from '@/lib/pdf';

// ─── Data Interface ──────────────────────────────────────────────────

export interface SalesExposeData {
  // Object info
  address: string;
  postalCode: string;
  city: string;
  objectType: string; // e.g. "Mehrfamilienhaus"
  yearBuilt: number;
  livingAreaSqm: number;
  plotAreaSqm?: number;
  rooms?: number;
  units?: number;

  // Pricing
  askingPrice: number;
  pricePerSqm: number;

  // Optional investment data
  isInvestment?: boolean;
  yieldGross?: number;
  rentMonthly?: number;
  rentYearly?: number;

  // Descriptions
  titleText?: string;
  descriptionText?: string;
  locationText?: string;
  highlights?: string[];

  // Images (base64)
  heroImageBase64?: string;
  galleryImagesBase64?: string[];

  // Energy
  energyClass?: string;
  heatingType?: string;

  // Broker contact
  brokerName?: string;
  brokerPhone?: string;
  brokerEmail?: string;
  brokerCompany?: string;
}

// ─── Generator ───────────────────────────────────────────────────────

export async function generateSalesExpose(data: SalesExposeData): Promise<void> {
  const jsPDF = await getJsPDF();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ═══ PAGE 1: COVER ═══
  let y = drawCover(doc, {
    title: data.titleText || `${data.objectType} in ${data.city}`,
    subtitle: `${data.address}, ${data.postalCode} ${data.city}`,
    heroImageBase64: data.heroImageBase64,
  });

  // Key Facts KPI row
  const kpis: KpiItem[] = [
    { label: 'Kaufpreis', value: EUR(data.askingPrice), tone: 'accent' },
    { label: 'Wohnfläche', value: `${NUM(data.livingAreaSqm)} m²` },
    { label: 'EUR/m²', value: EUR(data.pricePerSqm) },
  ];
  if (data.yearBuilt) kpis.push({ label: 'Baujahr', value: String(data.yearBuilt) });
  y = drawKpiRow(doc, y, kpis.slice(0, 4));

  // ═══ PAGE 2: OBJEKTBESCHREIBUNG ═══
  doc.addPage();
  y = PAGE.MARGIN_TOP + 10;
  y = drawSectionTitle(doc, y, 'Objektbeschreibung');

  // Facts table
  const factsRows: string[][] = [
    ['Objektart', data.objectType],
    ['Baujahr', String(data.yearBuilt)],
    ['Wohnfläche', `${NUM(data.livingAreaSqm)} m²`],
  ];
  if (data.plotAreaSqm) factsRows.push(['Grundstücksfläche', `${NUM(data.plotAreaSqm)} m²`]);
  if (data.rooms) factsRows.push(['Zimmer', String(data.rooms)]);
  if (data.units) factsRows.push(['Einheiten', String(data.units)]);
  if (data.energyClass) factsRows.push(['Energieeffizienzklasse', data.energyClass]);
  if (data.heatingType) factsRows.push(['Heizung', data.heatingType]);

  y = drawTable(doc, y, {
    headers: ['Merkmal', 'Wert'],
    rows: factsRows,
    colWidths: [80, 96],
  });

  // Highlights
  if (data.highlights && data.highlights.length > 0) {
    y += 4;
    y = drawSectionTitle(doc, y, 'Highlights');
    for (const h of data.highlights) {
      y = ensurePageBreak(doc, y, 6);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(11, 18, 32);
      doc.text(`• ${h}`, PAGE.MARGIN_LEFT + 4, y);
      y += 5;
    }
  }

  // Description text
  if (data.descriptionText) {
    y += 4;
    y = drawBodyText(doc, y, data.descriptionText);
  }

  // ═══ PAGE 3: LAGE ═══
  if (data.locationText) {
    doc.addPage();
    y = PAGE.MARGIN_TOP + 10;
    y = drawSectionTitle(doc, y, 'Lage & Umgebung');
    y = drawBodyText(doc, y, data.locationText);
  }

  // ═══ PAGE 4: GALERIE ═══
  if (data.galleryImagesBase64 && data.galleryImagesBase64.length > 0) {
    doc.addPage();
    y = PAGE.MARGIN_TOP + 10;
    y = drawSectionTitle(doc, y, 'Bildergalerie');

    const imgW = (PAGE.CONTENT_WIDTH - 4) / 2;
    const imgH = 55;

    for (let i = 0; i < Math.min(data.galleryImagesBase64.length, 6); i++) {
      const col = i % 2;
      if (col === 0 && i > 0) y += imgH + 4;
      y = ensurePageBreak(doc, y, imgH + 6);

      const x = PAGE.MARGIN_LEFT + col * (imgW + 4);
      try {
        doc.addImage(data.galleryImagesBase64[i], 'JPEG', x, y, imgW, imgH);
      } catch {
        // Skip broken image
      }
    }
    y += imgH + 6;
  }

  // ═══ PAGE 5 (optional): WIRTSCHAFTLICHKEIT ═══
  if (data.isInvestment && data.yieldGross) {
    doc.addPage();
    y = PAGE.MARGIN_TOP + 10;
    y = drawSectionTitle(doc, y, 'Wirtschaftlichkeit');

    y = drawKpiRow(doc, y, [
      { label: 'Bruttorendite', value: PCT(data.yieldGross), tone: 'accent' },
      { label: 'Kaufpreis', value: EUR(data.askingPrice) },
      { label: 'Jahresmieteinnahme', value: EUR(data.rentYearly || 0) },
    ]);

    if (data.rentMonthly) {
      y = drawTable(doc, y, {
        headers: ['Position', 'Betrag'],
        rows: [
          ['Monatliche Miete', EUR(data.rentMonthly)],
          ['Jährliche Miete', EUR(data.rentYearly || data.rentMonthly * 12)],
          ['Kaufpreis', EUR(data.askingPrice)],
          ['Bruttorendite', PCT(data.yieldGross)],
        ],
        colWidths: [100, 76],
        alignRight: [1],
      });
    }
  }

  // ═══ LAST PAGE: RECHTLICHES + KONTAKT ═══
  doc.addPage();
  y = PAGE.MARGIN_TOP + 10;
  y = drawSectionTitle(doc, y, 'Rechtliche Hinweise & Kontakt');

  y = drawInfoCard(doc, y, 'Haftungsausschluss', [
    'Alle Angaben sind ohne Gewähr und basieren auf Informationen des Eigentümers.',
    'Irrtümer und Zwischenverkauf vorbehalten.',
    'Dieses Exposé begründet keinen Vertrag und kein verbindliches Angebot.',
  ]);

  if (data.brokerName) {
    y += 4;
    const contactLines = [
      data.brokerName,
      data.brokerCompany || '',
      data.brokerPhone || '',
      data.brokerEmail || '',
    ].filter(Boolean);
    y = drawInfoCard(doc, y, 'Ihr Ansprechpartner', contactLines);
  }

  // ═══ FOOTERS ON ALL PAGES ═══
  addFootersToAllPages(doc, { confidential: false });

  const filename = `Exposé_${data.address.replace(/[\s,./]+/g, '_')}.pdf`;
  doc.save(filename);
}
