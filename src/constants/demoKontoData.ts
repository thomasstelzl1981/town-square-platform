/**
 * Demo-Konto Daten für MOD-18 Finanzanalyse — GP-KONTEN
 * Synthetische Transaktionen und Kontodaten (rein clientseitig)
 */

export interface DemoTransaction {
  date: string;
  text: string;
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
  { date: '2026-02-01', text: 'Miete WE-01 Schmidt', amount: 850, saldo: 12450.80 },
  { date: '2026-02-01', text: 'Miete WE-02 Mueller', amount: 720, saldo: 11600.80 },
  { date: '2026-01-05', text: 'Grundsteuer Q1', amount: -380, saldo: 10880.80 },
  { date: '2026-01-01', text: 'Miete WE-01 Schmidt', amount: 850, saldo: 11260.80 },
  { date: '2026-01-01', text: 'Miete WE-02 Mueller', amount: 720, saldo: 10410.80 },
  { date: '2025-12-15', text: 'Hausverwaltung Dez', amount: -195, saldo: 9690.80 },
  { date: '2025-12-01', text: 'Miete WE-01 Schmidt', amount: 850, saldo: 9885.80 },
  { date: '2025-12-01', text: 'Miete WE-02 Mueller', amount: 720, saldo: 9035.80 },
  { date: '2025-11-20', text: 'Reparatur Heizung', amount: -450, saldo: 8315.80 },
  { date: '2025-11-01', text: 'Miete WE-01 Schmidt', amount: 850, saldo: 8765.80 },
];

export const KONTO_CATEGORIES = [
  { value: 'privat', label: 'Privat' },
  { value: 'vermietung', label: 'Vermietung' },
  { value: 'pv', label: 'Photovoltaik' },
  { value: 'tagesgeld', label: 'Tagesgeld' },
  { value: 'sonstiges', label: 'Sonstiges' },
] as const;
