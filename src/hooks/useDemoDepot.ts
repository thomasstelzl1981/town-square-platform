/**
 * useDemoDepot — Client-side demo data & state for Investment Depot (Upvest prep)
 * Persists onboarding status in localStorage. All data is static demo content.
 */
import { useState, useCallback } from 'react';

export type DepotStatus = 'none' | 'pending' | 'active';

const LS_KEY_PREFIX = 'depot_status_';

function lsKey(personId?: string) {
  return personId ? `${LS_KEY_PREFIX}${personId}` : 'depot_onboarding_status';
}

export interface DemoPosition {
  name: string;
  isin: string;
  pieces: number | null;
  price: number | null;
  value: number;
  performance: number | null;
  category: 'etf' | 'stock' | 'cash';
}

export interface DemoTransaction {
  date: string;
  type: 'Kauf' | 'Verkauf' | 'Dividende' | 'Einzahlung';
  security: string;
  pieces: number | null;
  amount: number;
}

export const DEMO_POSITIONS: DemoPosition[] = [
  { name: 'iShares Core MSCI World', isin: 'IE00B4L5Y983', pieces: 45, price: 89.12, value: 4010.40, performance: 8.12, category: 'etf' },
  { name: 'Vanguard FTSE All-World', isin: 'IE00BK5BQT80', pieces: 30, price: 118.50, value: 3555.00, performance: 6.50, category: 'etf' },
  { name: 'Apple Inc.', isin: 'US0378331005', pieces: 15, price: 230.00, value: 3450.00, performance: 3.20, category: 'stock' },
  { name: 'Alphabet Inc.', isin: 'US02079K3059', pieces: 8, price: 665.00, value: 5320.00, performance: 8.12, category: 'stock' },
  { name: 'MSCI EM Sustainable', isin: 'IE00BYVJRP78', pieces: 60, price: 54.60, value: 3276.00, performance: 4.80, category: 'etf' },
  { name: 'Xtrackers DAX UCITS', isin: 'LU0274211480', pieces: 25, price: 167.28, value: 4182.00, performance: 2.10, category: 'etf' },
  { name: 'Cash / Verrechnungskonto', isin: '—', pieces: null, price: null, value: 5637.60, performance: null, category: 'cash' },
];

export const DEMO_TRANSACTIONS: DemoTransaction[] = [
  { date: '2026-02-10', type: 'Kauf', security: 'iShares Core MSCI World', pieces: 5, amount: -445.60 },
  { date: '2026-02-03', type: 'Dividende', security: 'Apple Inc.', pieces: null, amount: 11.25 },
  { date: '2026-01-28', type: 'Kauf', security: 'Alphabet Inc.', pieces: 2, amount: -1330.00 },
  { date: '2026-01-15', type: 'Einzahlung', security: 'Verrechnungskonto', pieces: null, amount: 2000.00 },
  { date: '2026-01-08', type: 'Verkauf', security: 'Xtrackers DAX UCITS', pieces: 5, amount: 836.40 },
  { date: '2025-12-20', type: 'Dividende', security: 'Vanguard FTSE All-World', pieces: null, amount: 34.80 },
];

export const DEMO_TAX_REPORT = {
  year: 2025,
  capitalGains: 1842.30,
  abgeltungsteuer: 460.58,
  soli: 25.33,
  kirchensteuer: 0,
  freistellungsauftrag: 1000,
  genutzt: 1000,
};

/** Generate 12-month performance data */
export function generatePerformanceData() {
  const months = ['Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez', 'Jan', 'Feb'];
  const values = [25000, 25400, 24800, 26100, 26800, 27200, 26500, 27800, 28300, 28900, 29100, 29431];
  return months.map((m, i) => ({ month: m, value: values[i] }));
}

/**
 * @param personId — optional person-scoped depot status.
 *   Demo: primary person gets 'active', others get 'none'.
 * @param isPrimary — hint: is this the primary household person?
 */
export function useDemoDepot(personId?: string, isPrimary?: boolean) {
  const key = lsKey(personId);

  const [status, setStatusState] = useState<DepotStatus>(() => {
    const stored = localStorage.getItem(key) as DepotStatus | null;
    if (stored) return stored;
    // Default: primary person has active depot, others none
    return isPrimary ? 'active' : 'none';
  });

  const setStatus = useCallback((s: DepotStatus) => {
    localStorage.setItem(key, s);
    setStatusState(s);
  }, [key]);

  const resetDepot = useCallback(() => {
    // Clear all depot keys
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(LS_KEY_PREFIX) || k === 'depot_onboarding_status') {
        localStorage.removeItem(k);
      }
    });
    setStatusState('none');
  }, []);

  const totalValue = DEMO_POSITIONS.reduce((s, p) => s + p.value, 0);
  const dailyChange = 1.2;

  return { status, setStatus, resetDepot, totalValue, dailyChange };
}
