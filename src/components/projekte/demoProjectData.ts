/**
 * Demo/Musterdaten for MOD-13 Projekte
 * Shown when no real projects exist. Purely UI — never persisted.
 */
import type { ProjectPortfolioRow } from '@/types/projekte';

// ── Helper ──────────────────────────────────────────────────────────────
export const isDemoMode = (portfolioRows: any[]) => portfolioRows.length === 0;

// ── Demo Project ────────────────────────────────────────────────────────
export const DEMO_PROJECT: ProjectPortfolioRow = {
  id: 'demo-project-001',
  project_code: 'SOT-BT-0001',
  name: 'Residenz am Stadtpark',
  city: 'München',
  postal_code: '80331',
  project_type: 'aufteilung',
  status: 'in_distribution',
  total_units_count: 24,
  units_available: 24,
  units_reserved: 0,
  units_sold: 0,
  purchase_price: 4_800_000,
  total_sale_target: 7_200_000,
  sale_revenue_actual: 0,
  profit_margin_percent: 20,
  progress_percent: 0,
  kaufy_listed: false,
  kaufy_featured: false,
  landingpage_enabled: false,
};

// ── Demo Calculation KPIs ───────────────────────────────────────────────
export const DEMO_CALC = {
  mietrendite: 4.0,          // %
  erwerbsnebenkosten: 2.0,   // %
  gebaeudeanteil: 80,        // %
  provision: 10,             // %
  zielmarge: 20,             // %
  avgPricePerUnit: 300_000,  // EUR
};

// ── 24 Demo Units ───────────────────────────────────────────────────────
interface DemoUnit {
  id: string;
  unit_number: string;
  rooms: number;
  floor: number;
  area_sqm: number;
  list_price: number;
  rent_monthly: number;
  provision_eur: number;
  status: 'available';
}

const UNIT_TEMPLATES: Array<{ rooms: number; area: number; count: number }> = [
  { rooms: 1, area: 30, count: 4 },
  { rooms: 2, area: 55, count: 8 },
  { rooms: 3, area: 75, count: 8 },
  { rooms: 4, area: 95, count: 4 },
];

// Total area for proportional price distribution
const totalArea = UNIT_TEMPLATES.reduce((s, t) => s + t.area * t.count, 0); // 1540 m²
const TOTAL_PURCHASE = 4_800_000;
const TOTAL_SALE = 7_200_000;
const COMMISSION_RATE = 0.10;
const YIELD_RATE = 0.04;

function buildDemoUnits(): DemoUnit[] {
  const units: DemoUnit[] = [];
  let idx = 0;

  for (const tmpl of UNIT_TEMPLATES) {
    for (let i = 0; i < tmpl.count; i++) {
      idx++;
      const areaShare = tmpl.area / totalArea;
      const listPrice = Math.round(TOTAL_SALE * areaShare);
      const purchaseShare = Math.round(TOTAL_PURCHASE * areaShare);
      const rentMonthly = Math.round((purchaseShare * YIELD_RATE) / 12);
      const provisionEur = Math.round(listPrice * COMMISSION_RATE);
      const floor = Math.min(Math.ceil(idx / 4), 6);

      units.push({
        id: `demo-unit-${String(idx).padStart(3, '0')}`,
        unit_number: `WE-${String(idx).padStart(3, '0')}`,
        rooms: tmpl.rooms,
        floor,
        area_sqm: tmpl.area,
        list_price: listPrice,
        rent_monthly: rentMonthly,
        provision_eur: provisionEur,
        status: 'available',
      });
    }
  }
  return units;
}

export const DEMO_UNITS: DemoUnit[] = buildDemoUnits();

// ── Demo Portfolio Row (for table) ──────────────────────────────────────
// Re-export as array for direct table consumption
export const DEMO_PORTFOLIO_ROWS: ProjectPortfolioRow[] = [DEMO_PROJECT];
