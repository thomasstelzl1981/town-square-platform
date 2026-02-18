/**
 * Demo-Konto Daten für MOD-18 Finanzanalyse — GP-KONTEN
 * Synthetische Transaktionen und Kontodaten (rein clientseitig)
 * 
 * buildDemoTransactions() erzeugt ~97 Buchungen (Jan 2025 – Feb 2026):
 * - 3x monatliche Mieteingänge (Warmmiete)
 * - 3x monatliche Hausgeld-Lastschriften
 * - 3x quartalsweise Grundsteuer (Feb, Mai, Aug, Nov)
 * - 1x Sonderbuchung Heizungsreparatur (Nov 2025)
 */

export interface DemoTransaction {
  date: string;
  valuta_date: string;
  booking_type: string;
  counterpart_name: string;
  counterpart_iban: string;
  purpose: string;
  amount: number;
  saldo: number;
}

export const DEMO_KONTO = {
  id: '__demo_konto__',
  bank: 'Sparkasse',
  accountName: 'Girokonto Sparkasse',
  iban: 'DE89370400440532013000',
  bic: 'COBADEFFXXX',
  balance: 12450.80,
  status: 'active' as const,
  holder: 'Max Mustermann',
  owner_type: 'property' as const,
  owner_id: 'd0000000-0000-4000-a000-000000000010', // landlordContextId
} as const;

export const DEMO_KONTO_IBAN_MASKED = 'DE89 3704 ••••';

// ─── Buchungsmuster ───────────────────────────────────────

interface MonthlyPattern {
  day: number;
  booking_type: string;
  counterpart_name: string;
  counterpart_iban: string;
  purposeTemplate: (month: string, year: string) => string;
  amount: number;
}

const MONTHLY_RENT: MonthlyPattern[] = [
  {
    day: 1,
    booking_type: 'Gutschrift',
    counterpart_name: 'Bergmann, Klaus',
    counterpart_iban: 'DE12500105170648489890',
    purposeTemplate: (m, y) => `Miete WE-01 BER-01 ${m}/${y}`,
    amount: 1150, // 850 Kalt + 180 NK + 120 Heiz
  },
  {
    day: 1,
    booking_type: 'Gutschrift',
    counterpart_name: 'Yilmaz, Ayse',
    counterpart_iban: 'DE27100777770209299700',
    purposeTemplate: (m, y) => `Miete WE-01 MUC-01 ${m}/${y}`,
    amount: 1580, // 1250 Kalt + 220 NK + 110 Heiz
  },
  {
    day: 2,
    booking_type: 'Gutschrift',
    counterpart_name: 'Petersen, Jan',
    counterpart_iban: 'DE44500105175419483214',
    purposeTemplate: (m, y) => `Miete WE-01 HH-01 ${m}/${y}`,
    amount: 750, // 600 Kalt + 120 NK + 50 Heiz (korr. auf 30)
  },
];

const MONTHLY_HAUSGELD: MonthlyPattern[] = [
  {
    day: 5,
    booking_type: 'Lastschrift',
    counterpart_name: 'WEG Berliner Str. 42',
    counterpart_iban: 'DE89370400440532019876',
    purposeTemplate: (m, y) => `Hausgeld BER-01 ${m}/${y}`,
    amount: -380,
  },
  {
    day: 5,
    booking_type: 'Lastschrift',
    counterpart_name: 'WEG Maximilianstr. 8',
    counterpart_iban: 'DE53370501980000300004',
    purposeTemplate: (m, y) => `Hausgeld MUC-01 ${m}/${y}`,
    amount: -450,
  },
  {
    day: 5,
    booking_type: 'Lastschrift',
    counterpart_name: 'WEG Elbchaussee 120',
    counterpart_iban: 'DE67200505501234567890',
    purposeTemplate: (m, y) => `Hausgeld HH-01 ${m}/${y}`,
    amount: -250,
  },
];

interface QuarterlyTax {
  day: number;
  months: number[]; // 1-indexed months when tax is due
  booking_type: string;
  counterpart_name: string;
  counterpart_iban: string;
  purposeTemplate: (quarter: string, year: string) => string;
  amount: number;
}

const QUARTERLY_GRUNDSTEUER: QuarterlyTax[] = [
  {
    day: 15,
    months: [2, 5, 8, 11],
    booking_type: 'Lastschrift',
    counterpart_name: 'Finanzamt Berlin-Mitte',
    counterpart_iban: 'DE02120300001234567890',
    purposeTemplate: (q, y) => `Grundsteuer BER-01 Q${q}/${y} Az 123-456-789`,
    amount: -130, // 520 / 4
  },
  {
    day: 15,
    months: [2, 5, 8, 11],
    booking_type: 'Lastschrift',
    counterpart_name: 'Finanzamt München II',
    counterpart_iban: 'DE53370501980000300004',
    purposeTemplate: (q, y) => `Grundsteuer MUC-01 Q${q}/${y} Az 987-654-321`,
    amount: -160, // 640 / 4
  },
  {
    day: 15,
    months: [2, 5, 8, 11],
    booking_type: 'Lastschrift',
    counterpart_name: 'Finanzamt Hamburg-Nord',
    counterpart_iban: 'DE67200505501234567890',
    purposeTemplate: (q, y) => `Grundsteuer HH-01 Q${q}/${y} Az 555-888-111`,
    amount: -80, // 320 / 4
  },
];

// ─── Generator ────────────────────────────────────────────

const START_SALDO = 5200.0;

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function quarterFromMonth(m: number): string {
  if (m <= 3) return '1';
  if (m <= 6) return '2';
  if (m <= 9) return '3';
  return '4';
}

export function buildDemoTransactions(): DemoTransaction[] {
  const txs: Omit<DemoTransaction, 'saldo'>[] = [];

  // Jan 2025 (month 1) through Feb 2026 (month 14)
  for (let i = 0; i < 14; i++) {
    const year = 2025 + Math.floor((i) / 12);
    const month = ((i) % 12) + 1;
    const yearStr = year.toString();
    const monthStr = pad2(month);
    const datePrefix = `${yearStr}-${monthStr}`;

    // Monthly rent
    for (const p of MONTHLY_RENT) {
      txs.push({
        date: `${datePrefix}-${pad2(p.day)}`,
        valuta_date: `${datePrefix}-${pad2(p.day + 1)}`,
        booking_type: p.booking_type,
        counterpart_name: p.counterpart_name,
        counterpart_iban: p.counterpart_iban,
        purpose: p.purposeTemplate(monthStr, yearStr),
        amount: p.amount,
      });
    }

    // Monthly Hausgeld
    for (const p of MONTHLY_HAUSGELD) {
      txs.push({
        date: `${datePrefix}-${pad2(p.day)}`,
        valuta_date: `${datePrefix}-${pad2(p.day)}`,
        booking_type: p.booking_type,
        counterpart_name: p.counterpart_name,
        counterpart_iban: p.counterpart_iban,
        purpose: p.purposeTemplate(monthStr, yearStr),
        amount: p.amount,
      });
    }

    // Quarterly Grundsteuer
    for (const tax of QUARTERLY_GRUNDSTEUER) {
      if (tax.months.includes(month)) {
        txs.push({
          date: `${datePrefix}-${pad2(tax.day)}`,
          valuta_date: `${datePrefix}-${pad2(tax.day)}`,
          booking_type: tax.booking_type,
          counterpart_name: tax.counterpart_name,
          counterpart_iban: tax.counterpart_iban,
          purpose: tax.purposeTemplate(quarterFromMonth(month), yearStr),
          amount: tax.amount,
        });
      }
    }

    // Sonderbuchung: Heizungsreparatur Nov 2025
    if (year === 2025 && month === 11) {
      txs.push({
        date: `${datePrefix}-20`,
        valuta_date: `${datePrefix}-22`,
        booking_type: 'Überweisung',
        counterpart_name: 'Klima Schulz Heizungsbau',
        counterpart_iban: 'DE44500105175419483214',
        purpose: 'RE-2025-0891 Heizungsreparatur BER-01 Obj. 4711',
        amount: -450,
      });
    }
  }

  // Sort chronologically ascending for saldo calculation
  txs.sort((a, b) => a.date.localeCompare(b.date) || a.amount - b.amount);

  // Calculate running saldo
  let saldo = START_SALDO;
  const result: DemoTransaction[] = txs.map((tx) => {
    saldo = Math.round((saldo + tx.amount) * 100) / 100;
    return { ...tx, saldo };
  });

  // Return descending (newest first) for display
  return result.reverse();
}

// Pre-built for backward compatibility
export const DEMO_TRANSACTIONS: DemoTransaction[] = buildDemoTransactions();
