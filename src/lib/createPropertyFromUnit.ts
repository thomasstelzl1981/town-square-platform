/**
 * Shared Helper: Create a complete Property record from a dev_project_unit
 * 
 * Used by:
 * - CreatePropertyFromUnits.tsx (Bulk creation from project detail page)
 * - SalesApprovalSection.tsx (On-demand creation during Vertriebsauftrag activation)
 * 
 * Creates:
 * 1. properties record (with ALL financial + energy fields)
 * 2. DMS folder structure (8 standard folders)
 * 3. property_accounting record (AfA, Gebäudeanteil)
 * 4. Links unit.property_id → property.id
 */

import { supabase } from '@/integrations/supabase/client';

export interface ProjectContext {
  projectId: string;
  projectName: string;
  projectAddress: string;
  projectCity: string;
  projectPostalCode?: string;
  projectYearBuilt?: number;
  projectData?: {
    full_description?: string;
    location_description?: string;
    features?: string[];
    energy_cert_type?: string;
    energy_cert_value?: number;
    energy_class?: string;
    heating_type?: string;
    energy_source?: string;
    renovation_year?: number;
    parking_type?: string;
    afa_rate_percent?: number;
    afa_model?: string;
    land_share_percent?: number;
    project_type?: string;
  };
}

export interface UnitData {
  id: string;
  unit_number: string;
  area_sqm?: number | null;
  list_price?: number | null;
  rent_net?: number | null;
  current_rent?: number | null;
  hausgeld?: number | null;
  rooms?: number | null;
  floor?: string | number | null;
  unit_id?: string | null;
  weg?: string | null;
}

export interface CreatePropertyResult {
  propertyId: string;
  success: true;
}

export interface CreatePropertyError {
  success: false;
  error: string;
}

// Standard DMS folder structure for a property (MOD-04 pattern)
const PROPERTY_DMS_FOLDERS = [
  '01_expose',
  '02_grundrisse',
  '03_fotos',
  '04_mietvertrag',
  '05_hausgeld',
  '06_protokolle',
  '07_versicherung',
  '99_sonstiges',
];

/**
 * Creates a complete property record from a project unit with all required fields
 * for downstream consumers (InvestmentExposeView, MOD-08, MOD-09, Zone 3).
 */
export async function createPropertyFromUnit(
  tenantId: string,
  unit: UnitData,
  context: ProjectContext,
): Promise<CreatePropertyResult | CreatePropertyError> {
  try {
    // Calculate annual_income from rent
    const monthlyRent = unit.rent_net || unit.current_rent || 0;
    const annualIncome = monthlyRent * 12;
    const monthlyHausgeld = unit.hausgeld || 0;

    // 1. Create property record with ALL fields needed for exposé rendering
    const publicId = `SOT-I-${unit.unit_number.replace(/[^a-zA-Z0-9-]/g, '')}`;
    const { data: newProperty, error: propError } = await supabase
      .from('properties')
      .insert({
        tenant_id: tenantId,
        public_id: publicId,
        code: unit.unit_number,
        address: context.projectAddress,
        city: context.projectCity,
        postal_code: context.projectPostalCode || null,
        property_type: 'wohnung',
        usage_type: 'wohnen',
        status: 'active',
        is_demo: false,
        // Area & Structure
        total_area_sqm: unit.area_sqm || null,
        rooms: unit.rooms || null,
        floor: unit.floor != null ? String(unit.floor) : null,
        units_count: 1,
        // Financial
        purchase_price: unit.list_price || null,
        annual_income: annualIncome > 0 ? annualIncome : null,
        hausgeld_monthly: monthlyHausgeld > 0 ? monthlyHausgeld : null,
        // Construction & Energy
        year_built: context.projectYearBuilt || null,
        description: context.projectData?.full_description || null,
        heating_type: context.projectData?.heating_type || null,
        energy_source: context.projectData?.energy_source || null,
        energy_cert_type: context.projectData?.energy_cert_type || null,
        energy_class: context.projectData?.energy_class || null,
        renovation_year: context.projectData?.renovation_year || null,
      })
      .select('id')
      .single();

    if (propError || !newProperty) {
      return { success: false, error: propError?.message || 'Property creation failed' };
    }

    // 2. Link property back to dev_project_unit
    await supabase
      .from('dev_project_units')
      .update({ property_id: newProperty.id })
      .eq('id', unit.id);

    // 3. Create DMS folder structure (MOD-04 pattern)
    const { data: rootFolder } = await supabase
      .from('storage_nodes')
      .insert({
        tenant_id: tenantId,
        name: `${unit.unit_number} — ${context.projectName}`,
        node_type: 'folder',
        module_code: 'MOD-04',
        entity_id: newProperty.id,
        parent_id: null,
      })
      .select('id')
      .single();

    if (rootFolder) {
      const folderInserts = PROPERTY_DMS_FOLDERS.map(name => ({
        tenant_id: tenantId,
        name,
        node_type: 'folder' as const,
        module_code: 'MOD-04',
        entity_id: newProperty.id,
        parent_id: rootFolder.id,
      }));
      await supabase.from('storage_nodes').insert(folderInserts);
    }

    // 4. Create property_accounting record with project-level defaults
    const landSharePct = context.projectData?.land_share_percent ?? 20.0;
    await supabase
      .from('property_accounting')
      .insert({
        tenant_id: tenantId,
        property_id: newProperty.id,
        afa_method: 'linear',
        afa_model: context.projectData?.afa_model ?? 'linear',
        afa_rate_percent: context.projectData?.afa_rate_percent ?? 2.0,
        afa_start_date: new Date().toISOString().slice(0, 10),
        land_share_percent: landSharePct,
        building_share_percent: 100 - landSharePct,
        coa_version: 'SKR04_Starter',
      } as any);

    return { success: true, propertyId: newProperty.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
