/**
 * generateProjectReportPdf.ts
 * Two-page PDF: Page 1 = Project Exposé, Page 2 = Sales Status Report + Price List
 */
import jsPDF from 'jspdf';
import type { DeveloperContext } from './demoProjectData';

export interface ReportUnit {
  unit_number: string;
  rooms: number;
  area_sqm: number;
  effective_price: number;
  effective_price_per_sqm: number;
  effective_yield: number;
  effective_provision: number;
  parking_price: number;
  status: string;
}

export interface ReportParams {
  projectName: string;
  projectAddress: string;
  projectCity: string;
  projectPostalCode: string;
  projectDescription: string[];
  developerContext: DeveloperContext;
  totalUnits: number;
  totalParkingSpaces: number;
  totalLivingArea: number;
  yearBuilt: number;
  renovationYear: number;
  heatingType: string;
  energyClass: string;
  investmentCosts: number;
  provisionRate: number;
  targetYield: number;
  units: ReportUnit[];
  imageDataUrls?: string[]; // base64 data URLs
}

const EUR = (v: number) => v.toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' €';
const PCT = (v: number) => v.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %';
const DATE_STR = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

const PAGE_W = 210;
const PAGE_H = 297;
const M_LEFT = 15;
const M_RIGHT = 15;
const M_TOP = 20;
const CONTENT_W = PAGE_W - M_LEFT - M_RIGHT;

function addFooter(doc: jsPDF, page: number, totalPages: number) {
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(`Seite ${page} von ${totalPages}`, M_LEFT, PAGE_H - 10);
  doc.text('Vertraulich — System of a Town GmbH', PAGE_W - M_RIGHT, PAGE_H - 10, { align: 'right' });
  doc.setTextColor(0, 0, 0);
}

export async function generateProjectReportPdf(params: ReportParams): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const {
    projectName, projectAddress, projectCity, projectPostalCode,
    projectDescription, developerContext, totalUnits, totalParkingSpaces,
    totalLivingArea, yearBuilt, renovationYear, heatingType, energyClass,
    investmentCosts, provisionRate, targetYield, units, imageDataUrls,
  } = params;

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE 1: PROJECT EXPOSÉ
  // ═══════════════════════════════════════════════════════════════════════
  let y = M_TOP;

  // Header bar
  doc.setFillColor(26, 26, 46); // #1a1a2e
  doc.rect(0, 0, PAGE_W, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(projectName.toUpperCase(), M_LEFT, 15);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${projectAddress} · ${projectPostalCode} ${projectCity}`, M_LEFT, 22);
  doc.text(`Vertriebsstatusreport · ${DATE_STR()}`, M_LEFT, 28);
  doc.setTextColor(0, 0, 0);
  y = 42;

  // Developer Context box
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 46);
  doc.text('PROJEKTGESELLSCHAFT', M_LEFT, y);
  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(developerContext.name, M_LEFT, y); y += 4;
  doc.text(`Geschäftsführer: ${developerContext.managing_director}`, M_LEFT, y); y += 4;
  doc.text(`${developerContext.street} ${developerContext.house_number}, ${developerContext.postal_code} ${developerContext.city}`, M_LEFT, y); y += 4;
  doc.text(`${developerContext.hrb_number}  |  USt-ID: ${developerContext.ust_id}`, M_LEFT, y); y += 3;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(M_LEFT, y, PAGE_W - M_RIGHT, y);
  y += 5;

  // Images
  if (imageDataUrls && imageDataUrls.length > 0) {
    const mainW = 110;
    const mainH = 70;
    const smallW = (CONTENT_W - mainW - 4) ;
    const smallH = (mainH - 2) / 2;

    // Main image
    if (imageDataUrls[0]) {
      try { doc.addImage(imageDataUrls[0], 'JPEG', M_LEFT, y, mainW, mainH); } catch { /* skip */ }
    }

    // Small images
    const smallX = M_LEFT + mainW + 4;
    if (imageDataUrls[1]) {
      try { doc.addImage(imageDataUrls[1], 'JPEG', smallX, y, smallW, smallH); } catch { /* skip */ }
    }
    if (imageDataUrls[2]) {
      try { doc.addImage(imageDataUrls[2], 'JPEG', smallX, y + smallH + 2, smallW, smallH); } catch { /* skip */ }
    }

    y += mainH + 6;
  }

  // Key Facts
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 46);
  doc.text('ECKDATEN', M_LEFT, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  const facts = `${totalUnits} WE  |  ${totalParkingSpaces} TG  |  ${totalLivingArea.toLocaleString('de-DE')} m²  |  Bj. ${yearBuilt}  |  San. ${renovationYear}  |  Energieklasse ${energyClass}  |  ${heatingType}`;
  doc.text(facts, M_LEFT, y);
  y += 8;

  // Object Description
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 46);
  doc.text('OBJEKTBESCHREIBUNG', M_LEFT, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);

  for (const paragraph of projectDescription) {
    const lines = doc.splitTextToSize(paragraph, CONTENT_W);
    doc.text(lines, M_LEFT, y);
    y += lines.length * 3.5 + 3;
  }

  addFooter(doc, 1, 2);

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE 2: SALES STATUS REPORT + PRICE LIST
  // ═══════════════════════════════════════════════════════════════════════
  doc.addPage();
  y = M_TOP;

  // Header
  doc.setFillColor(26, 26, 46);
  doc.rect(0, 0, PAGE_W, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('VERTRIEBSSTATUSREPORT', M_LEFT, 13);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${projectName} · Stand ${DATE_STR()}`, M_LEFT, 19);
  doc.setTextColor(0, 0, 0);
  y = 32;

  // Calculator KPIs
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 46);
  doc.text('KALKULATOR-KENNZAHLEN', M_LEFT, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(`Investitionskosten:  ${EUR(investmentCosts)}`, M_LEFT, y); y += 4;
  doc.text(`Endkundenrendite:   ${PCT(targetYield * 100)}`, M_LEFT, y); y += 4;
  doc.text(`Provision (Satz):   ${PCT(provisionRate * 100)}`, M_LEFT, y); y += 7;

  // Cumulative EUR values
  const totalVolume = units.reduce((s, u) => s + u.effective_price, 0);
  const reservedEur = units.filter(u => u.status === 'reserved').reduce((s, u) => s + u.effective_price, 0);
  const soldEur = units.filter(u => u.status === 'sold' || u.status === 'notary').reduce((s, u) => s + u.effective_price, 0);
  const freeEur = units.filter(u => u.status === 'available').reduce((s, u) => s + u.effective_price, 0);
  const totalProvision = units.reduce((s, u) => s + u.effective_provision, 0);
  const grossProfit = totalVolume - investmentCosts - totalProvision;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 46);
  doc.text('KUMULIERTE WERTE', M_LEFT, y);
  y += 5;

  const kpiRows: [string, string][] = [
    ['Projektvolumen', EUR(totalVolume)],
    ['Reserviert', EUR(reservedEur)],
    ['Verkauft', EUR(soldEur)],
    ['Frei', EUR(freeEur)],
    ['', ''],
    ['Provision gesamt', EUR(totalProvision)],
    ['Rohertrag Gesellschaft', EUR(grossProfit)],
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const kpiTableX = M_LEFT;
  const kpiLabelW = 55;
  const kpiValueW = 45;

  for (const [label, value] of kpiRows) {
    if (label === '') {
      // Separator
      doc.setDrawColor(200, 200, 200);
      doc.line(kpiTableX, y - 1, kpiTableX + kpiLabelW + kpiValueW, y - 1);
      y += 1;
      continue;
    }
    doc.setTextColor(60, 60, 60);
    doc.text(label, kpiTableX, y);
    doc.text(value, kpiTableX + kpiLabelW + kpiValueW, y, { align: 'right' });
    y += 4;
  }

  y += 6;

  // Price List Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(26, 26, 46);
  doc.text('PREISLISTE', M_LEFT, y);
  y += 5;

  // Table header
  const colX = [M_LEFT, M_LEFT + 18, M_LEFT + 28, M_LEFT + 40, M_LEFT + 68, M_LEFT + 94, M_LEFT + 116, M_LEFT + 140, M_LEFT + 160];
  const headers = ['WE', 'Zi', 'm²', 'Preis', 'EUR/m²', 'Rendite', 'Provision', 'Stellpl.', 'Status'];

  doc.setFillColor(240, 240, 245);
  doc.rect(M_LEFT, y - 3, CONTENT_W, 5, 'F');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);

  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], colX[i], y);
  }
  y += 5;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);

  const statusLabels: Record<string, string> = {
    available: 'frei',
    reserved: 'reserviert',
    notary: 'Notar',
    sold: 'verkauft',
  };

  for (const unit of units) {
    doc.setTextColor(60, 60, 60);
    doc.text(unit.unit_number, colX[0], y);
    doc.text(String(unit.rooms), colX[1], y);
    doc.text(String(unit.area_sqm), colX[2], y);
    doc.text(EUR(unit.effective_price), colX[3], y);
    doc.text(EUR(unit.effective_price_per_sqm), colX[4], y);
    doc.text(PCT(unit.effective_yield), colX[5], y);
    doc.text(EUR(unit.effective_provision), colX[6], y);
    doc.text(EUR(unit.parking_price), colX[7], y);

    // Status with color
    const statusText = statusLabels[unit.status] || unit.status;
    if (unit.status === 'reserved') doc.setTextColor(180, 120, 0);
    else if (unit.status === 'sold' || unit.status === 'notary') doc.setTextColor(0, 140, 60);
    else doc.setTextColor(60, 60, 60);
    doc.text(statusText, colX[8], y);

    y += 3.8;
  }

  // Summary row
  doc.setDrawColor(26, 26, 46);
  doc.line(M_LEFT, y - 1, PAGE_W - M_RIGHT, y - 1);
  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 46);
  doc.text('SUMME', colX[0], y);
  doc.text(EUR(totalVolume), colX[3], y);
  const avgPricePerSqm = units.length > 0 ? Math.round(totalVolume / units.reduce((s, u) => s + u.area_sqm, 0)) : 0;
  doc.text(EUR(avgPricePerSqm), colX[4], y);
  doc.text(PCT(targetYield * 100), colX[5], y);
  doc.text(EUR(totalProvision), colX[6], y);

  addFooter(doc, 2, 2);

  return doc;
}

/**
 * Load an image from a URL/path and return as base64 data URL.
 */
export function loadImageAsDataUrl(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context unavailable')); return; }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}
