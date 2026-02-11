/**
 * Demo/Musterdaten for MOD-13 Projekte
 * Shown when no real projects exist. Purely UI — never persisted.
 * @demo-data Registered in src/config/demoDataRegistry.ts
 */
import type { ProjectPortfolioRow } from '@/types/projekte';

// ── Helper ──────────────────────────────────────────────────────────────
/** @deprecated Use DEMO_PROJECT directly — demo is always visible */
export const isDemoMode = (portfolioRows: any[]) => portfolioRows.length === 0;

/** Check if a given project ID is the demo project */
export const isDemoProject = (projectId: string | undefined | null) => projectId === DEMO_PROJECT_ID;

export const DEMO_PROJECT_ID = 'demo-project-001';

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
export interface DemoUnit {
  id: string;
  public_id: string;
  unit_number: string;
  rooms: number;
  floor: number;
  area_sqm: number;
  list_price: number;
  rent_monthly: number;
  annual_net_rent: number;
  non_recoverable_costs: number;
  yield_percent: number;
  price_per_sqm: number;
  provision_eur: number;
  parking_price: number;
  status: 'available' | 'reserved' | 'notary' | 'sold';
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

// Slight yield variation per unit type to make demo realistic
const YIELD_OFFSETS: Record<number, number> = { 1: 0.004, 2: 0.002, 3: -0.001, 4: -0.003 };
// Non-recoverable costs vary by size
const NK_PER_SQM = 0.30; // ~0.30 EUR/m² monthly

function buildDemoUnits(): DemoUnit[] {
  const units: DemoUnit[] = [];
  let idx = 0;

  for (const tmpl of UNIT_TEMPLATES) {
    for (let i = 0; i < tmpl.count; i++) {
      idx++;
      const areaShare = tmpl.area / totalArea;
      const listPrice = Math.round(TOTAL_SALE * areaShare);
      const purchaseShare = Math.round(TOTAL_PURCHASE * areaShare);
      const yieldRate = YIELD_RATE + (YIELD_OFFSETS[tmpl.rooms] || 0);
      const rentMonthly = Math.round((purchaseShare * yieldRate) / 12);
      const annualNetRent = rentMonthly * 12;
      const nonRecoverableCosts = Math.round(tmpl.area * NK_PER_SQM);
      const yieldPercent = Math.round((annualNetRent / listPrice) * 10000) / 100;
      const pricePerSqm = Math.round(listPrice / tmpl.area);
      const provisionEur = Math.round(listPrice * COMMISSION_RATE);
      const floor = Math.min(Math.ceil(idx / 4), 6);

      units.push({
        id: `demo-unit-${String(idx).padStart(3, '0')}`,
        public_id: `SOT-BE-DEMO${String(idx).padStart(4, '0')}`,
        unit_number: `WE-${String(idx).padStart(3, '0')}`,
        rooms: tmpl.rooms,
        floor,
        area_sqm: tmpl.area,
        list_price: listPrice,
        rent_monthly: rentMonthly,
        annual_net_rent: annualNetRent,
        non_recoverable_costs: nonRecoverableCosts,
        yield_percent: yieldPercent,
        price_per_sqm: pricePerSqm,
        provision_eur: provisionEur,
        parking_price: 20_000,
        status: 'available',
      });
    }
  }
  return units;
}

export const DEMO_UNITS: DemoUnit[] = buildDemoUnits();

// ── Demo Unit Detail (for Expose) ───────────────────────────────────────
export const DEMO_UNIT_DETAIL = {
  title: '2-Zimmer-Wohnung, 1. OG links',
  description:
    'Helle und moderne 2-Zimmer-Wohnung im 1. Obergeschoss mit Blick auf den Stadtpark. ' +
    'Die Wohnung verfügt über einen offenen Wohn-/Essbereich mit Zugang zum Balkon, ein separates Schlafzimmer ' +
    'sowie ein gefliestes Tageslichtbad. Hochwertige Ausstattung mit Eichenparkett und Fußbodenheizung.',
  year_built: 1998,
  renovation_year: 2021,
  heating_type: 'Zentralheizung (Gas)',
  energy_class: 'B',
  address: 'Am Stadtpark 12',
  city: 'München',
  postal_code: '80331',
};

// ── Demo Project Description (ImmoScout-style) ─────────────────────────
export const DEMO_PROJECT_DESCRIPTION = {
  headline: 'Residenz am Stadtpark',
  address: 'Am Stadtpark 12',
  city: 'München',
  postal_code: '80331',
  description: [
    'Die „Residenz am Stadtpark" ist ein gepflegtes Mehrfamilienhaus in bevorzugter Innenstadtlage Münchens, nur wenige Gehminuten vom Englischen Garten entfernt. Das 1998 errichtete und 2021 umfassend sanierte Wohngebäude bietet 24 moderne Wohneinheiten in ruhiger und dennoch zentraler Lage.',
    'Die Ausstattung umfasst Eichenparkett, Fußbodenheizung, elektrische Rollläden sowie bodentiefe Fenster mit Dreifachverglasung. Alle Wohnungen verfügen über Balkone oder Terrassen mit Blick auf den angrenzenden Stadtpark. Die Bäder sind mit hochwertiger Sanitärkeramik und bodengleichen Duschen ausgestattet.',
    'Das Gesamtkonzept richtet sich an Kapitalanleger, die eine nachhaltige Rendite in einer der gefragtesten Lagen Münchens suchen. Die vollständige energetische Sanierung (KfW 70) gewährleistet niedrige Nebenkosten und langfristigen Werterhalt.',
  ],
  total_units: 24,
  total_parking_spaces: 24,
  total_living_area: 1_540,
  year_built: 1998,
  renovation_year: 2021,
  heating_type: 'Zentralheizung (Gas)',
  energy_class: 'B',
  total_sale_price: 7_200_000,
  images_count: 4,
};

// ── Demo Project Images ─────────────────────────────────────────────────
export interface DemoProjectImage {
  label: string;
  importKey: 'exterior' | 'livingroom' | 'kitchen' | 'bathroom';
}

export const DEMO_PROJECT_IMAGES: DemoProjectImage[] = [
  { label: 'Außenansicht', importKey: 'exterior' },
  { label: 'Wohnzimmer', importKey: 'livingroom' },
  { label: 'Küche', importKey: 'kitchen' },
  { label: 'Badezimmer', importKey: 'bathroom' },
];

// ── Demo Developer Context (Projektgesellschaft) ────────────────────────
export interface DeveloperContext {
  name: string;
  legal_form: string;
  hrb_number: string;
  ust_id: string;
  managing_director: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
}

export const DEMO_DEVELOPER_CONTEXT: DeveloperContext = {
  name: 'Stadtpark Wohnen GmbH',
  legal_form: 'GmbH',
  hrb_number: 'HRB 287451 · AG München',
  ust_id: 'DE318294756',
  managing_director: 'Thomas Stelzl',
  street: 'Leopoldstraße',
  house_number: '42',
  postal_code: '80802',
  city: 'München',
};

// ── Demo Portfolio Row (for table) ──────────────────────────────────────
// Re-export as array for direct table consumption
export const DEMO_PORTFOLIO_ROWS: ProjectPortfolioRow[] = [DEMO_PROJECT];
