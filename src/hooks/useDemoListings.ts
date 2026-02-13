/**
 * useDemoListings — Central hook for synthetic demo listing data
 * 
 * Provides polymorphic demo listing shapes for all zones:
 * - salesDeskListings → Zone 1 Sales Desk
 * - kaufyListings → Zone 3 Kaufy Website
 * - partnerKatalog → MOD-09 Partner Katalog
 * 
 * All data is purely client-side and disappears when GP-PORTFOLIO toggle is off.
 */

import { useMemo } from 'react';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { DEMO_PROPERTY_IDS, DEV_TENANT_UUID } from '@/config/tenantConstants';
import type { SalesDeskListing } from '@/hooks/useSalesDeskListings';

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
    title: 'Altbauperle Prenzlauer Berg',
    address: 'Prenzlauer Allee 88',
    city: 'Berlin',
    postalCode: '10405',
    propertyType: 'multi_family',
    askingPrice: 850000,
    commissionRate: 7.0,
    totalAreaSqm: 320,
    annualIncome: 42000,
    monthlyRent: 3500,
    unitCount: 4,
  },
  {
    propertyId: DEMO_PROPERTY_IDS[1],
    code: 'MUC-01',
    title: 'Gartenhaus Schwabing',
    address: 'Leopoldstraße 42',
    city: 'München',
    postalCode: '80802',
    propertyType: 'apartment',
    askingPrice: 520000,
    commissionRate: 6.0,
    totalAreaSqm: 95,
    annualIncome: 18000,
    monthlyRent: 1500,
    unitCount: 1,
  },
  {
    propertyId: DEMO_PROPERTY_IDS[2],
    code: 'HH-01',
    title: 'Hafenblick Altona',
    address: 'Große Elbstraße 15',
    city: 'Hamburg',
    postalCode: '22767',
    propertyType: 'multi_family',
    askingPrice: 1200000,
    commissionRate: 7.5,
    totalAreaSqm: 480,
    annualIncome: 60000,
    monthlyRent: 5000,
    unitCount: 6,
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
    title: p.title,
    asking_price: p.askingPrice,
    property_type: p.propertyType,
    address: p.address,
    city: p.city,
    postal_code: p.postalCode,
    total_area_sqm: p.totalAreaSqm,
    unit_count: p.unitCount,
    monthly_rent_total: p.monthlyRent,
    hero_image_path: null,
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
// Main Hook
// ============================================================================

export function useDemoListings() {
  const { isEnabled } = useDemoToggles();
  const active = isEnabled('GP-PORTFOLIO');

  const salesDeskListings = useMemo<SalesDeskListing[]>(
    () => active ? DEMO_PROPERTIES.map(toSalesDeskListing) : [],
    [active]
  );

  const kaufyListings = useMemo<DemoKaufyListing[]>(
    () => active ? DEMO_PROPERTIES.map(toKaufyListing) : [],
    [active]
  );

  const partnerKatalog = useMemo<DemoPartnerListing[]>(
    () => active ? DEMO_PROPERTIES.map(toPartnerListing) : [],
    [active]
  );

  const mandateListings = useMemo<DemoMandateListing[]>(
    () => active ? DEMO_PROPERTIES.map(toMandateListing) : [],
    [active]
  );

  return {
    active,
    salesDeskListings,
    kaufyListings,
    partnerKatalog,
    mandateListings,
    /** Raw demo property data for detail pages */
    demoProperties: active ? DEMO_PROPERTIES : [],
  };
}
