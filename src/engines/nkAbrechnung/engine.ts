/**
 * NK-Abrechnung Engine — Orchestrierung
 * 
 * Liest nk_cost_items + Lease-Daten, berechnet die Abrechnungsmatrix
 * und schreibt das Ergebnis in nk_tenant_settlements.
 */

import {
  NKSettlementMatrix,
  NKSettlementSummary,
  NKMatrixRow,
  NKCostItem,
  NKCostCategory,
  AllocationKeyType,
  APPORTIONABLE_CATEGORIES,
} from './spec';
import { allocateCostItem, calculateLeaseDaysInPeriod, calculateProratedPrepayments } from './allocationLogic';
import { supabase } from '@/integrations/supabase/client';

interface CalculateInput {
  propertyId: string;
  unitId: string;
  leaseId: string;
  tenantId: string;
  year: number;
}

interface LeaseData {
  id: string;
  rent_cold_eur: number;
  nk_advance_eur: number;
  heating_advance_eur: number;
  start_date: string;
  end_date: string | null;
  tenant_contact_id: string | null;
}

interface UnitData {
  id: string;
  area_sqm: number | null;
  mea_share: number | null;
  unit_number: string;
}

/**
 * Berechnet die NK-Abrechnung fuer ein Lease in einer Periode.
 */
export async function calculateSettlement(
  input: CalculateInput
): Promise<NKSettlementMatrix> {
  const periodStart = `${input.year}-01-01`;
  const periodEnd = `${input.year}-12-31`;

  // 1. Lease laden
  const { data: lease } = await supabase
    .from('leases')
    .select('*')
    .eq('id', input.leaseId)
    .eq('tenant_id', input.tenantId)
    .single() as { data: LeaseData | null; error: any };

  if (!lease) throw new Error('Mietvertrag nicht gefunden');

  // 2. Unit laden
  const { data: unit } = await supabase
    .from('units')
    .select('*')
    .eq('id', input.unitId)
    .eq('tenant_id', input.tenantId)
    .single() as { data: UnitData | null; error: any };

  if (!unit) throw new Error('Einheit nicht gefunden');

  // 3. Property laden (fuer Gesamtwerte)
  const { data: property } = await supabase
    .from('properties')
    .select('address, city, total_area_sqm, mea_total')
    .eq('id', input.propertyId)
    .eq('tenant_id', input.tenantId)
    .single() as any;

  if (!property) throw new Error('Immobilie nicht gefunden');

  // 4. Kontaktname laden
  let tenantName = 'Mieter';
  if (lease.tenant_contact_id) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('first_name, last_name, company')
      .eq('id', lease.tenant_contact_id)
      .single();
    if (contact) {
      tenantName = contact.company || `${contact.last_name || ''}, ${contact.first_name || ''}`.trim();
    }
  }

  // 5. NK-Periode finden oder erstellen
  const { data: existingPeriod } = await supabase
    .from('nk_periods')
    .select('id')
    .eq('property_id', input.propertyId)
    .eq('tenant_id', input.tenantId)
    .gte('period_end', periodStart)
    .lte('period_start', periodEnd)
    .maybeSingle() as any;

  const nkPeriodId = existingPeriod?.id;

  // 6. Cost Items laden (aus nk_cost_items)
  let costItems: NKCostItem[] = [];
  if (nkPeriodId) {
    const { data: items } = await supabase
      .from('nk_cost_items' as any)
      .select('*')
      .eq('nk_period_id', nkPeriodId)
      .eq('tenant_id', input.tenantId)
      .order('sort_order', { ascending: true }) as any;

    costItems = (items || []).map((item: any) => ({
      id: item.id,
      nkPeriodId: item.nk_period_id,
      categoryCode: item.category_code as NKCostCategory,
      labelRaw: item.label_raw,
      labelDisplay: item.label_display,
      amountTotalHouse: Number(item.amount_total_house),
      amountUnit: item.amount_unit ? Number(item.amount_unit) : null,
      keyType: item.key_type as AllocationKeyType,
      keyBasisUnit: item.key_basis_unit ? Number(item.key_basis_unit) : null,
      keyBasisTotal: item.key_basis_total ? Number(item.key_basis_total) : null,
      isApportionable: item.is_apportionable,
      reasonCode: item.reason_code,
      mappingConfidence: item.mapping_confidence,
      mappingSource: item.mapping_source,
      sourceDocumentId: item.source_document_id,
      sortOrder: item.sort_order,
    }));
  }

  // 7. Unterjaehrigkeit berechnen
  const periodInfo = {
    periodStart,
    periodEnd,
    leaseStart: lease.start_date,
    leaseEnd: lease.end_date,
  };
  const { leaseDays, totalDays, ratio } = calculateLeaseDaysInPeriod(periodInfo);

  // 8. Allocation berechnen
  const totalAreaSqm = property.total_area_sqm || 0;
  const totalMea = property.mea_total || 1000;
  const unitAreaSqm = unit.area_sqm || 0;
  const unitMea = unit.mea_share || 0;

  const warnings: string[] = [];
  const lowConfidenceItems: string[] = [];

  const rows: NKMatrixRow[] = costItems.map((item) => {
    if (item.mappingConfidence < 70) {
      lowConfidenceItems.push(`${item.labelDisplay} (${item.mappingConfidence}%)`);
    }

    return allocateCostItem(
      {
        costItem: item,
        unitAreaSqm,
        totalAreaSqm,
        unitMea,
        totalMea,
        unitPersons: 2, // TODO: aus Lease/Unit holen
        totalPersons: 10, // TODO: Gesamtpersonen aus Property
        totalUnits: 1, // TODO: Gesamteinheiten
      },
      periodInfo
    );
  });

  // 9. Validierungen
  if (unitAreaSqm <= 0) warnings.push('Wohnfläche der Einheit ist 0 m²');
  if (unitMea <= 0) warnings.push('MEA-Anteil der Einheit ist 0');
  if (costItems.length === 0) warnings.push('Keine Kostenpositionen vorhanden');

  // 10. Summary berechnen
  const totalApportionable = rows
    .filter((r) => r.isApportionable)
    .reduce((sum, r) => sum + r.shareUnit, 0);

  const totalHeating = rows
    .filter((r) => r.categoryCode === NKCostCategory.HEIZUNG || r.categoryCode === NKCostCategory.WARMWASSER)
    .reduce((sum, r) => sum + r.shareUnit, 0);

  const { prepaidNK, prepaidHeating } = calculateProratedPrepayments(
    lease.nk_advance_eur || 0,
    lease.heating_advance_eur || 0,
    periodInfo
  );

  const totalPrepaid = prepaidNK + prepaidHeating;
  const totalCostsTenant = totalApportionable;
  const balance = Math.round((totalCostsTenant - totalPrepaid) * 100) / 100;

  const summary: NKSettlementSummary = {
    totalApportionable: Math.round(totalApportionable * 100) / 100,
    totalHeating: Math.round(totalHeating * 100) / 100,
    totalCostsTenant: Math.round(totalCostsTenant * 100) / 100,
    prepaidNK,
    prepaidHeating,
    totalPrepaid,
    balance,
  };

  return {
    header: {
      propertyId: input.propertyId,
      propertyName: `${property.address}, ${property.city}`,
      unitId: input.unitId,
      unitLabel: `${unit.unit_number}, ${unitAreaSqm} m²`,
      leaseId: input.leaseId,
      tenantName,
      periodStart,
      periodEnd,
      leasePeriodStart: lease.start_date > periodStart ? lease.start_date : periodStart,
      leasePeriodEnd: lease.end_date && lease.end_date < periodEnd ? lease.end_date : periodEnd,
      daysRatio: `${leaseDays}/${totalDays}`,
      leaseDaysInPeriod: leaseDays,
      totalDaysInPeriod: totalDays,
    },
    rows,
    summary,
    validation: {
      warnings,
      missingDocs: [],
      lowConfidenceItems,
    },
  };
}
