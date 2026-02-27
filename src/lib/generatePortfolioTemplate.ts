/**
 * Generates a professional XLSX portfolio import template with color-coded headers.
 * Green = mandatory fields, Blue = extended data, Orange = financing/loan data.
 * Uses lazy-loaded SheetJS to keep initial bundle small.
 */
import { getXlsx } from './lazyXlsx';

const HEADERS_MANDATORY = ['Code', 'Art', 'Adresse', 'PLZ', 'Ort', 'Nutzung'];
const HEADERS_EXTENDED = ['Fläche (qm)', 'Einheiten', 'Baujahr', 'Kaufpreis', 'Marktwert', 'Kaltmiete/Monat', 'Jahresmiete p.a.'];
const HEADERS_FINANCE = ['Bank', 'Restschuld', 'Annuität/Monat', 'Zinssatz (%)', 'Zinsbindung bis'];

const ALL_HEADERS = [...HEADERS_MANDATORY, ...HEADERS_EXTENDED, ...HEADERS_FINANCE];

// 3 realistic demo rows
const DEMO_ROWS = [
  ['ETW-B01', 'ETW', 'Prenzlauer Allee 42', '10405', 'Berlin', 'Wohnen', 78, 1, 2004, 320000, 345000, 1150, 13800, 'Deutsche Bank', 185000, 980, 3.45, '31.12.2029'],
  ['MFH-M01', 'MFH', 'Schwabing Str. 15', '80802', 'München', 'Wohnen/Gewerbe', 420, 6, 1965, 1850000, 2100000, 7200, 86400, 'Sparkasse', 920000, 4850, 2.90, '30.06.2031'],
  ['ETW-HH01', 'ETW', 'Eppendorfer Weg 88', '20259', 'Hamburg', 'Wohnen', 92, 1, 2018, 410000, 430000, 1480, 17760, 'ING', 245000, 1320, 3.15, '15.03.2033'],
];

// Color fills (ARGB hex)
const FILL_GREEN = { patternType: 'solid', fgColor: { rgb: 'FF2E7D32' } } as const;  // dark green
const FILL_BLUE  = { patternType: 'solid', fgColor: { rgb: 'FF1565C0' } } as const;  // dark blue
const FILL_ORANGE = { patternType: 'solid', fgColor: { rgb: 'FFE65100' } } as const; // dark orange

const HEADER_FONT = { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 11 };
const HEADER_ALIGNMENT = { horizontal: 'center', vertical: 'center', wrapText: true };

export async function generatePortfolioTemplate(): Promise<void> {
  const XLSX = await getXlsx();

  const wb = XLSX.utils.book_new();
  const wsData = [ALL_HEADERS, ...DEMO_ROWS];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws['!cols'] = ALL_HEADERS.map((h) => {
    if (h === 'Adresse') return { wch: 24 };
    if (h === 'Bank') return { wch: 18 };
    if (['Kaufpreis', 'Marktwert', 'Restschuld', 'Jahresmiete p.a.'].includes(h)) return { wch: 16 };
    if (h === 'Zinsbindung bis') return { wch: 16 };
    return { wch: Math.max(h.length + 2, 12) };
  });

  // Apply header styles
  const range = XLSX.utils.decode_range(ws['!ref']!);
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
    const cell = ws[cellRef];
    if (!cell) continue;

    let fill;
    if (col < HEADERS_MANDATORY.length) {
      fill = FILL_GREEN;
    } else if (col < HEADERS_MANDATORY.length + HEADERS_EXTENDED.length) {
      fill = FILL_BLUE;
    } else {
      fill = FILL_ORANGE;
    }

    cell.s = {
      fill,
      font: HEADER_FONT,
      alignment: HEADER_ALIGNMENT,
      border: {
        bottom: { style: 'thin', color: { rgb: 'FF000000' } },
      },
    };
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Portfolio');

  // Write and trigger download
  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
  const blob = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Portfolio_Import_Vorlage.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
