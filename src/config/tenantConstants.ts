/**
 * Tenant Constants — Single Source of Truth
 * 
 * All dev-tenant UUIDs, mock objects, and related constants.
 * No other file should define these values inline.
 * 
 * @see spec/current/08_data_provenance/GOLDEN_TENANT_CONTRACT.md
 */

import type { Tables } from '@/integrations/supabase/types';

type Membership = Tables<'memberships'>;
type Profile = Tables<'profiles'>;
type Organization = Tables<'organizations'>;

// ============================================================================
// DEV TENANT UUID — the single canonical reference
// ============================================================================

/** Fixed Dev-Tenant UUID — MUST match the seeded internal organization */
export const DEV_TENANT_UUID = 'a0000000-0000-4000-a000-000000000001';

// ============================================================================
// Feature Flag: VITE_FORCE_DEV_TENANT
// ============================================================================

/**
 * Returns true only when the explicit feature flag is set.
 * Without this flag, normal auth flow is used even in DEV mode.
 */
export const isDevelopmentEnvironment = (): boolean => {
  return import.meta.env.VITE_FORCE_DEV_TENANT === 'true';
};

// ============================================================================
// Mock Objects — used only when isDevelopmentEnvironment() === true
// ============================================================================

export const DEV_MOCK_ORG: Organization = {
  id: DEV_TENANT_UUID,
  name: 'System of a Town',
  slug: 'system-of-a-town',
  public_id: 'SOT-T-INTERNAL01',
  org_type: 'internal',
  parent_id: null,
  materialized_path: '/',
  depth: 0,
  parent_access_blocked: false,
  settings: {},
  storage_plan_id: '00000000-0000-0000-0000-000000000001',
  storage_quota_bytes: 5368709120,
  ai_extraction_enabled: false,
  tenant_mode: 'sandbox',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

export const DEV_MOCK_MEMBERSHIP: Membership = {
  id: 'dev-membership-internal',
  user_id: 'dev-user',
  tenant_id: DEV_TENANT_UUID,
  role: 'platform_admin',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

export const DEV_MOCK_PROFILE: Profile = {
  id: 'dev-user',
  display_name: 'System of a Town',
  email: 'admin@systemofatown.de',
  avatar_url: null,
  active_tenant_id: DEV_TENANT_UUID,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  first_name: null,
  last_name: null,
  street: null,
  house_number: null,
  postal_code: null,
  city: null,
  country: null,
  tax_id: null,
  tax_number: null,
  is_business: null,
  person_mode: null,
  spouse_profile_id: null,
  phone_landline: null,
  phone_mobile: null,
  phone_whatsapp: null,
  email_signature: null,
  letterhead_logo_url: null,
  letterhead_company_line: null,
  letterhead_extra_line: null,
  letterhead_bank_name: null,
  letterhead_iban: null,
  letterhead_bic: null,
  letterhead_website: null,
  deleted_at: null,
};
