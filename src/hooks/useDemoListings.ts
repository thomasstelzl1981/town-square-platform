/**
 * useDemoListings — Central hook for synthetic demo listing data
 * 
 * Provides polymorphic demo listing shapes for all zones:
 * - salesDeskListings → Zone 1 Sales Desk (GP-PORTFOLIO + GP-PROJEKT)
 * - kaufyListings → Zone 3 Kaufy Website (GP-PORTFOLIO + GP-PROJEKT)
 * - partnerKatalog → MOD-09 Partner Katalog (GP-PORTFOLIO + GP-PROJEKT)
 * - projectListings → Zone 2 Projekte Dashboard (GP-PROJEKT)
 * 
 * All data is purely client-side and disappears when toggles are off.
 * 
 * @see src/manifests/demoDataManifest.ts
 */

import { useMemo } from 'react';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { DEMO_PROPERTY_IDS, DEMO_PROJECT_IDS, DEV_TENANT_UUID } from '@/config/tenantConstants';
import type { SalesDeskListing } from '@/hooks/useSalesDeskListings';
import demoBerlinImg from '@/assets/demo/demo-berlin.jpg';
import demoMunichImg from '@/assets/demo/demo-munich.jpg';
import demoHamburgImg from '@/assets/demo/demo-hamburg.jpg';

const DEMO_IMAGES: Record<string, string> = {
  'BER-01': demoBerlinImg,
  'MUC-01': demoMunichImg,
  'HH-01': demoHamburgImg,
};

// ============================================================================
// Base demo property data
// ============================================================================

interface DemoPropertyBase {
  propertyId: string;
  code: string;
  title: string;
  address: string;
  city: string;
  postalCode: string;
  propertyType: string;
  askingPrice: number;
  commissionRate: number;
  totalAreaSqm: number;
  annualIncome: number;
  monthlyRent: number;
  unitCount: number;
}

const DEMO_PROPERTIES: DemoPropertyBase[] = [
  {
    propertyId: DEMO_PROPERTY_IDS[0],
    code: 'BER-01',
    title: 'Altbau Berlin-Mitte',
    address: 'Schadowstr.',
    city: 'Berlin',
    postalCode: '10117',
    propertyType: 'ETW',
    askingPrice: 280000,
    commissionRate: 7.0,
    totalAreaSqm: 85,
    annualIncome: 13800,
    monthlyRent: 1150,
    unitCount: 1,
  },
  {
    propertyId: DEMO_PROPERTY_IDS[1],
    code: 'MUC-01',
    title: 'Wohnung Schwabing',
    address: 'Leopoldstr.',
    city: 'München',
    postalCode: '80802',
    propertyType: 'ETW',
    askingPrice: 420000,
    commissionRate: 6.0,
    totalAreaSqm: 72,
    annualIncome: 18960,
    monthlyRent: 1580,
    unitCount: 1,
  },
  {
    propertyId: DEMO_PROPERTY_IDS[2],
    code: 'HH-01',
    title: 'Wohnung Eimsbüttel',
    address: 'Osterstr.',
    city: 'Hamburg',
    postalCode: '20259',
    propertyType: 'ETW',
    askingPrice: 175000,
    commissionRate: 7.5,
    totalAreaSqm: 45,
    annualIncome: 9000,
    monthlyRent: 750,
    unitCount: 1,
  },
];

// ============================================================================
// Demo listing ID prefix (to identify demo entries without DB collision)
// ============================================================================

const DEMO_LISTING_PREFIX = 'demo-listing-';
export const isDemoListingId = (id: string) => id.startsWith(DEMO_LISTING_PREFIX);

// ============================================================================
// Shape: SalesDeskListing (Zone 1)
// ============================================================================

function toSalesDeskListing(p: DemoPropertyBase): SalesDeskListing {
  return {
    id: `${DEMO_LISTING_PREFIX}${p.propertyId}`,
    title: p.title,
    status: 'active',
    asking_price: p.askingPrice,
    commission_rate: p.commissionRate,
    partner_visibility: 'network',
    is_blocked: false,
    created_at: '2025-01-15T10:00:00.000Z',
    property: {
      id: p.propertyId,
      code: p.code,
      address: p.address,
      city: p.city,
    },
    unit: null,
    publications: [
      { channel: 'partner_network', status: 'active' },
      { channel: 'kaufy', status: 'active' },
    ],
    tenant: {
      id: DEV_TENANT_UUID,
      name: 'Demo-Eigentümer',
    },
  };
}

// ============================================================================
// Shape: KaufyListing (Zone 3)
// ============================================================================

export interface DemoKaufyListing {
  listing_id: string;
  public_id: string;
  property_id: string;
  title: string;
  asking_price: number;
  property_type: string;
  address: string;
  city: string;
  postal_code: string | null;
  total_area_sqm: number | null;
  unit_count: number;
  monthly_rent_total: number;
  hero_image_path?: string | null;
  isDemo?: boolean;
}

function toKaufyListing(p: DemoPropertyBase): DemoKaufyListing {
  return {
    listing_id: `${DEMO_LISTING_PREFIX}${p.propertyId}`,
    public_id: `DEMO-${p.code}`,
    property_id: p.propertyId,
    title: p.title,
    asking_price: p.askingPrice,
    property_type: p.propertyType,
    address: p.address,
    city: p.city,
    postal_code: p.postalCode,
    total_area_sqm: p.totalAreaSqm,
    unit_count: p.unitCount,
    monthly_rent_total: p.monthlyRent,
    hero_image_path: DEMO_IMAGES[p.code] || null,
    isDemo: true,
  };
}

// ============================================================================
// Shape: PartnerKatalogListing (MOD-09)
// ============================================================================

export interface DemoPartnerListing {
  id: string;
  public_id: string | null;
  title: string;
  asking_price: number | null;
  commission_rate: number | null;
  status: string;
  property_address: string;
  property_city: string;
  property_type: string | null;
  total_area_sqm: number | null;
  kaufy_active: boolean;
  gross_yield: number | null;
  isDemo?: boolean;
}

function toPartnerListing(p: DemoPropertyBase): DemoPartnerListing {
  return {
    id: `${DEMO_LISTING_PREFIX}${p.propertyId}`,
    public_id: `DEMO-${p.code}`,
    title: p.title,
    asking_price: p.askingPrice,
    commission_rate: p.commissionRate,
    status: 'active',
    property_address: p.address,
    property_city: p.city,
    property_type: p.propertyType,
    total_area_sqm: p.totalAreaSqm,
    kaufy_active: true,
    gross_yield: p.askingPrice > 0 ? (p.annualIncome / p.askingPrice) * 100 : null,
    isDemo: true,
  };
}

// ============================================================================
// Shape: ImmobilienVertriebsauftrag (Zone 1 mandate card)
// ============================================================================

export interface DemoMandateListing {
  id: string;
  status: string;
  commission_rate: number;
  created_at: string;
  properties: { address: string; city: string };
  tenant: { name: string };
  isDemo: boolean;
}

function toMandateListing(p: DemoPropertyBase): DemoMandateListing {
  return {
    id: `${DEMO_LISTING_PREFIX}${p.propertyId}`,
    status: 'active',
    commission_rate: p.commissionRate,
    created_at: '2025-01-15T10:00:00.000Z',
    properties: { address: p.address, city: p.city },
    tenant: { name: 'Demo-Eigentümer' },
    isDemo: true,
  };
}

// ============================================================================
// Shape: ProjectListing (Zone 2 — Projekte Dashboard, GP-PROJEKT)
// ============================================================================

export interface DemoProjectListing {
  id: string;
  publicId: string;
  name: string;
  city: string;
  address: string;
  unitsTotal: number;
  unitsSold: number;
  status: string;
  developer: string;
  priceRange: string;
  createdAt: string;
  isDemo: boolean;
}

const DEMO_PROJECT_BASE: DemoProjectListing = {
  id: DEMO_PROJECT_IDS[0],
  publicId: 'SOT-BT-DEMO',
  name: 'Residenz am Stadtpark',
  city: 'München',
  address: 'Nymphenburger Str. 120, 80636 München',
  unitsTotal: 24,
  unitsSold: 8,
  status: 'approved',
  developer: 'Demo Bauträger GmbH',
  priceRange: '285.000 – 720.000 €',
  createdAt: '2025-01-10T10:00:00.000Z',
  isDemo: true,
};

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Deduplication helper: filters out demo items whose key already exists in DB items.
 * DB items always take priority.
 */
export function deduplicateByField<T>(
  demoItems: T[],
  dbItems: T[],
  keyFn: (item: T) => string
): T[] {
  const dbKeys = new Set(dbItems.map(keyFn));
  const uniqueDemo = demoItems.filter(d => !dbKeys.has(keyFn(d)));
  return [...uniqueDemo, ...dbItems];
}

export function useDemoListings() {
  const { isEnabled } = useDemoToggles();
  const portfolioActive = isEnabled('GP-PORTFOLIO');
  const projektActive = isEnabled('GP-PROJEKT');
  const active = portfolioActive; // backward compat

  const salesDeskListings = useMemo<SalesDeskListing[]>(() => {
    const items: SalesDeskListing[] = [];
    if (portfolioActive) items.push(...DEMO_PROPERTIES.map(toSalesDeskListing));
    if (projektActive) {
      items.push({
        id: `${DEMO_LISTING_PREFIX}${DEMO_PROJECT_IDS[0]}`,
        title: DEMO_PROJECT_BASE.name,
        status: 'active',
        asking_price: 450000,
        commission_rate: 3.57,
        partner_visibility: 'network',
        is_blocked: false,
        created_at: DEMO_PROJECT_BASE.createdAt,
        property: {
          id: DEMO_PROJECT_IDS[0],
          code: 'SOT-BT-DEMO',
          address: DEMO_PROJECT_BASE.address,
          city: DEMO_PROJECT_BASE.city,
        },
        unit: null,
        publications: [
          { channel: 'partner_network', status: 'active' },
          { channel: 'kaufy', status: 'active' },
        ],
        tenant: { id: DEV_TENANT_UUID, name: 'Demo Bauträger GmbH' },
      });
    }
    return items;
  }, [portfolioActive, projektActive]);

  const kaufyListings = useMemo<DemoKaufyListing[]>(() => {
    const items: DemoKaufyListing[] = [];
    if (portfolioActive) items.push(...DEMO_PROPERTIES.map(toKaufyListing));
    if (projektActive) {
      items.push({
        listing_id: `${DEMO_LISTING_PREFIX}${DEMO_PROJECT_IDS[0]}`,
        public_id: 'SOT-BT-DEMO',
        property_id: DEMO_PROJECT_IDS[0],
        title: DEMO_PROJECT_BASE.name,
        asking_price: 450000,
        property_type: 'new_construction',
        address: DEMO_PROJECT_BASE.address,
        city: DEMO_PROJECT_BASE.city,
        postal_code: '80636',
        total_area_sqm: 85,
        unit_count: 24,
        monthly_rent_total: 0,
        hero_image_path: null,
        isDemo: true,
      });
    }
    return items;
  }, [portfolioActive, projektActive]);

  const partnerKatalog = useMemo<DemoPartnerListing[]>(() => {
    const items: DemoPartnerListing[] = [];
    if (portfolioActive) items.push(...DEMO_PROPERTIES.map(toPartnerListing));
    if (projektActive) {
      items.push({
        id: `${DEMO_LISTING_PREFIX}${DEMO_PROJECT_IDS[0]}`,
        public_id: 'SOT-BT-DEMO',
        title: DEMO_PROJECT_BASE.name,
        asking_price: 450000,
        commission_rate: 3.57,
        status: 'active',
        property_address: DEMO_PROJECT_BASE.address,
        property_city: DEMO_PROJECT_BASE.city,
        property_type: 'new_construction',
        total_area_sqm: 85,
        kaufy_active: true,
        gross_yield: null,
        isDemo: true,
      });
    }
    return items;
  }, [portfolioActive, projektActive]);

  const mandateListings = useMemo<DemoMandateListing[]>(
    () => portfolioActive ? DEMO_PROPERTIES.map(toMandateListing) : [],
    [portfolioActive]
  );

  const projectListings = useMemo<DemoProjectListing[]>(
    () => projektActive ? [DEMO_PROJECT_BASE] : [],
    [projektActive]
  );

  return {
    active,
    portfolioActive,
    projektActive,
    salesDeskListings,
    kaufyListings,
    partnerKatalog,
    mandateListings,
    projectListings,
    /** Raw demo property data for detail pages */
    demoProperties: portfolioActive ? DEMO_PROPERTIES : [],
  };
}
