/**
 * Demo-Konto Daten für MOD-18 Finanzanalyse — GP-KONTEN
 * Synthetische Transaktionen und Kontodaten (rein clientseitig)
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
  category: 'vermietung' as const,
  balance: 12450.80,
  status: 'active' as const,
  holder: 'Max Mustermann',
} as const;

export const DEMO_KONTO_IBAN_MASKED = 'DE89 3704 ••••';

export const DEMO_TRANSACTIONS: DemoTransaction[] = [
  { date: '2026-02-01', valuta_date: '2026-02-01', booking_type: 'Gutschrift', counterpart_name: 'Schmidt, Thomas', counterpart_iban: 'DE12500105170648489890', purpose: 'Miete WE-01 Feb 2026', amount: 850, saldo: 12450.80 },
  { date: '2026-02-01', valuta_date: '2026-02-01', booking_type: 'Gutschrift', counterpart_name: 'Mueller, Sabine', counterpart_iban: 'DE27100777770209299700', purpose: 'Miete WE-02 Feb 2026', amount: 720, saldo: 11600.80 },
  { date: '2026-01-05', valuta_date: '2026-01-05', booking_type: 'Lastschrift', counterpart_name: 'Finanzamt Köln-Süd', counterpart_iban: 'DE53370501980000300004', purpose: 'Grundsteuer Q1/2026 Az 123-456-789', amount: -380, saldo: 10880.80 },
  { date: '2026-01-01', valuta_date: '2026-01-02', booking_type: 'Gutschrift', counterpart_name: 'Schmidt, Thomas', counterpart_iban: 'DE12500105170648489890', purpose: 'Miete WE-01 Jan 2026', amount: 850, saldo: 11260.80 },
  { date: '2026-01-01', valuta_date: '2026-01-02', booking_type: 'Gutschrift', counterpart_name: 'Mueller, Sabine', counterpart_iban: 'DE27100777770209299700', purpose: 'Miete WE-02 Jan 2026', amount: 720, saldo: 10410.80 },
  { date: '2025-12-15', valuta_date: '2025-12-15', booking_type: 'Überweisung', counterpart_name: 'Hausverwaltung Rheinland GmbH', counterpart_iban: 'DE89370400440532019876', purpose: 'HV-Abrechnung Dez 2025 Obj. 4711', amount: -195, saldo: 9690.80 },
  { date: '2025-12-01', valuta_date: '2025-12-01', booking_type: 'Gutschrift', counterpart_name: 'Schmidt, Thomas', counterpart_iban: 'DE12500105170648489890', purpose: 'Miete WE-01 Dez 2025', amount: 850, saldo: 9885.80 },
  { date: '2025-12-01', valuta_date: '2025-12-01', booking_type: 'Gutschrift', counterpart_name: 'Mueller, Sabine', counterpart_iban: 'DE27100777770209299700', purpose: 'Miete WE-02 Dez 2025', amount: 720, saldo: 9035.80 },
  { date: '2025-11-20', valuta_date: '2025-11-22', booking_type: 'Überweisung', counterpart_name: 'Klima Schulz Heizungsbau', counterpart_iban: 'DE44500105175419483214', purpose: 'RE-2025-0891 Heizungsreparatur Obj. 4711', amount: -450, saldo: 8315.80 },
  { date: '2025-11-01', valuta_date: '2025-11-03', booking_type: 'Gutschrift', counterpart_name: 'Schmidt, Thomas', counterpart_iban: 'DE12500105170648489890', purpose: 'Miete WE-01 Nov 2025', amount: 850, saldo: 8765.80 },
];

export const KONTO_CATEGORIES = [
  { value: 'privat', label: 'Privat' },
  { value: 'vermietung', label: 'Vermietung' },
  { value: 'pv', label: 'Photovoltaik' },
  { value: 'tagesgeld', label: 'Tagesgeld' },
  { value: 'sonstiges', label: 'Sonstiges' },
] as const;
