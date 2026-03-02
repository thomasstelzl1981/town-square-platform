/**
 * useVVSteuerData — Data hook for V+V Anlage V
 * Loads landlord_contexts, properties, leases (via units), property_accounting, nk data, vv_annual_data
 * Provides save/confirm mutations
 * 
 * Supports Override-Pattern (Selbstauskunft):
 * Auto-calculated values can be overridden via override_* columns in vv_annual_data.
 * Override = NULL → use auto-calculated value. Override != NULL → use override.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { VVAnnualManualData, VVPropertyTaxData, VVAfaStammdaten, VVIncomeAggregated, VVFinancingAggregated, VVNKAggregated } from '@/engines/vvSteuer/spec';
import { toast } from 'sonner';

/** Override values for auto-calculated fields */
export interface VVOverrides {
  overrideLoanInterest: number | null;
  overrideColdRent: number | null;
  overrideNkAdvance: number | null;
  overrideNkNachzahlung: number | null;
  overrideGrundsteuer: number | null;
  overrideNonRecoverable: number | null;
}

/** Expense aggregation from property_expenses */
export interface VVExpenseAggregation {
  costMaintenance: number;
  costInsuranceNonRecoverable: number;
  costManagementFee: number;
  costLegalAdvisory: number;
  costTravel: number;
  costBankFees: number;
  costOther: number;
}

/** Extended tax data with overrides and expense suggestions */
export interface VVPropertyTaxDataExtended extends VVPropertyTaxData {
  overrides: VVOverrides;
  expenseAggregation: VVExpenseAggregation;
  autoValues: {
    loanInterest: number;
    coldRent: number;
    nkAdvance: number;
    nkNachzahlung: number;
    grundsteuer: number;
    nonRecoverable: number;
  };
}

const DEFAULT_MANUAL_DATA: Omit<VVAnnualManualData, 'propertyId' | 'taxYear'> = {
  incomeOther: 0, incomeInsurancePayout: 0,
  costDisagio: 0, costFinancingFees: 0,
  costMaintenance: 0, costManagementFee: 0, costLegalAdvisory: 0,
  costInsuranceNonRecoverable: 0, costTravel: 0, costBankFees: 0, costOther: 0,
  vacancyDays: 0, vacancyIntentConfirmed: true, relativeRental: false,
  heritageAfaAmount: 0, specialAfaAmount: 0,
  confirmed: false, status: 'draft', notes: '',
};

const DEFAULT_OVERRIDES: VVOverrides = {
  overrideLoanInterest: null,
  overrideColdRent: null,
  overrideNkAdvance: null,
  overrideNkNachzahlung: null,
  overrideGrundsteuer: null,
  overrideNonRecoverable: null,
};

export function useVVSteuerData(taxYear: number) {
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();
  const queryKey = ['vv-steuer', activeTenantId, taxYear];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!activeTenantId) return null;

      // Parallel fetch all data sources
      const [ctxRes, propsRes, accountingRes, annualRes, expensesRes] = await Promise.all([
        supabase.from('landlord_contexts').select('id, name, context_type, tax_number').eq('tenant_id', activeTenantId),
        supabase.from('properties').select('id, code, address, address_house_no, city, postal_code, property_type, year_built, purchase_price, acquisition_costs, landlord_context_id, rental_managed, is_demo, tax_reference_number, ownership_share_percent').eq('tenant_id', activeTenantId).eq('rental_managed', true),
        (supabase as any).from('property_accounting').select('property_id, building_share_percent, land_share_percent, afa_rate_percent, afa_start_date, afa_method, modernization_costs_eur, modernization_year, afa_model, ak_ground, ak_building, ak_ancillary, book_value_eur, book_value_date, cumulative_afa, sonder_afa_annual, denkmal_afa_annual').eq('tenant_id', activeTenantId),
        (supabase as any).from('vv_annual_data').select('*').eq('tenant_id', activeTenantId).eq('tax_year', taxYear),
        (supabase as any).from('property_expenses').select('property_id, category, amount, tax_deductible').eq('tenant_id', activeTenantId).gte('expense_date', `${taxYear}-01-01`).lte('expense_date', `${taxYear}-12-31`),
      ]);

      // Get property IDs for sub-queries
      const propertyIds = (propsRes.data || []).map((p: any) => p.id);
      if (propertyIds.length === 0) return { contexts: ctxRes.data || [], properties: [], accounting: [], annual: [], units: [], leases: [], financing: [], nkPeriods: [], nkItems: [], expenses: [] };

      const [unitsRes, financingRes, nkPeriodsRes] = await Promise.all([
        supabase.from('units').select('id, property_id, area_sqm').eq('tenant_id', activeTenantId).in('property_id', propertyIds),
        (supabase as any).from('property_financing').select('property_id, annual_interest, current_balance, interest_rate, is_active').eq('tenant_id', activeTenantId).in('property_id', propertyIds),
        (supabase as any).from('nk_periods').select('id, property_id, period_start, period_end')
          .eq('tenant_id', activeTenantId)
          .in('property_id', propertyIds)
          .gte('period_start', `${taxYear}-01-01`)
          .lte('period_end', `${taxYear}-12-31`),
      ]);

      const units = unitsRes.data || [];
      const unitIds = units.map((u: any) => u.id);

      let leases: any[] = [];
      if (unitIds.length > 0) {
        const { data: leaseData } = await supabase.from('leases')
          .select('id, unit_id, rent_cold_eur, nk_advance_eur, status')
          .eq('tenant_id', activeTenantId)
          .eq('status', 'active')
          .in('unit_id', unitIds);
        leases = leaseData || [];
      }

      const periodIds = (nkPeriodsRes.data || []).map((p: any) => p.id);
      let nkItems: any[] = [];
      let nkSettlements: any[] = [];
      if (periodIds.length > 0) {
        const [itemsRes, settlementsRes] = await Promise.all([
          (supabase as any).from('nk_cost_items').select('nk_period_id, category_code, amount_total_house, is_apportionable').in('nk_period_id', periodIds),
          (supabase as any).from('nk_tenant_settlements').select('nk_period_id, saldo_eur').in('nk_period_id', periodIds),
        ]);
        nkItems = itemsRes.data || [];
        nkSettlements = settlementsRes.data || [];
      }

      return {
        contexts: ctxRes.data || [],
        properties: propsRes.data || [],
        accounting: accountingRes.data || [],
        annual: annualRes.data || [],
        units,
        leases,
        financing: financingRes.data || [],
        nkPeriods: nkPeriodsRes.data || [],
        nkItems,
        nkSettlements,
        expenses: expensesRes.data || [],
      };
    },
    enabled: !!activeTenantId,
  });

  // Group properties by context
  const contexts = (data?.contexts || []).map((ctx: any) => {
    const ctxProperties = (data?.properties || []).filter((p: any) => p.landlord_context_id === ctx.id);
    const annualEntries = (data?.annual || []).filter((a: any) => ctxProperties.some((p: any) => p.id === a.property_id));
    const allConfirmed = ctxProperties.length > 0 && ctxProperties.every((p: any) => {
      const entry = annualEntries.find((a: any) => a.property_id === p.id);
      return entry?.confirmed === true;
    });

    return {
      ...ctx,
      properties: ctxProperties,
      propertyCount: ctxProperties.length,
      allConfirmed,
      confirmedCount: annualEntries.filter((a: any) => a.confirmed).length,
    };
  }).filter((ctx: any) => ctx.propertyCount > 0);

  // Build full property tax data for a given property (with overrides)
  function buildPropertyTaxData(propertyId: string): VVPropertyTaxDataExtended | null {
    const prop = (data?.properties || []).find((p: any) => p.id === propertyId);
    if (!prop) return null;

    const accounting = (data?.accounting || []).find((a: any) => a.property_id === propertyId);
    const annualEntry = (data?.annual || []).find((a: any) => a.property_id === propertyId);

    // AfA
    const afa: VVAfaStammdaten = {
      buildingSharePercent: accounting?.building_share_percent ?? 70,
      landSharePercent: accounting?.land_share_percent ?? 30,
      afaRatePercent: accounting?.afa_rate_percent ?? 2,
      afaStartDate: accounting?.afa_start_date ?? null,
      afaMethod: accounting?.afa_method ?? 'linear',
      modernizationCostsEur: accounting?.modernization_costs_eur ?? 0,
      modernizationYear: accounting?.modernization_year ?? null,
      afaModel: (accounting as any)?.afa_model ?? '7_4_2b',
      akGround: (accounting as any)?.ak_ground ?? 0,
      akBuilding: (accounting as any)?.ak_building ?? 0,
      akAncillary: (accounting as any)?.ak_ancillary ?? 0,
      sonderAfaAnnual: (accounting as any)?.sonder_afa_annual ?? 0,
      denkmalAfaAnnual: (accounting as any)?.denkmal_afa_annual ?? 0,
      bookValueEur: accounting?.book_value_eur ?? 0,
      cumulativeAfa: (accounting as any)?.cumulative_afa ?? 0,
    };

    // Income aggregation — join leases via units
    const propUnits = (data?.units || []).filter((u: any) => u.property_id === propertyId);
    const propUnitIds = propUnits.map((u: any) => u.id);
    const propLeases = (data?.leases || []).filter((l: any) => propUnitIds.includes(l.unit_id));
    
    // NK-Nachzahlung aus nk_tenant_settlements
    const propPeriodIds = (data?.nkPeriods || [])
      .filter((p: any) => p.property_id === propertyId)
      .map((p: any) => p.id);
    const nkSettlements = (data?.nkSettlements || [])
      .filter((s: any) => propPeriodIds.includes(s.nk_period_id));
    const nkNachzahlungTotal = nkSettlements.reduce((s: number, st: any) => {
      const saldo = (st.saldo_eur || 0);
      return saldo > 0 ? s + saldo : s;
    }, 0);

    // Auto-calculated values (before overrides)
    const autoColdRent = propLeases.reduce((s: number, l: any) => s + (l.rent_cold_eur || 0) * 12, 0);
    const autoNkAdvance = propLeases.reduce((s: number, l: any) => s + (l.nk_advance_eur || 0) * 12, 0);
    const autoNkNachzahlung = nkNachzahlungTotal;

    // Financing auto-calculation
    const propFinancing = (data?.financing || []).filter((f: any) => f.property_id === propertyId && f.is_active !== false);
    const autoLoanInterest = propFinancing.reduce((s: number, f: any) => {
      if (f.annual_interest && f.annual_interest > 0) return s + f.annual_interest;
      if (f.current_balance && f.interest_rate) return s + (f.current_balance * f.interest_rate / 100);
      return s;
    }, 0);

    // NK aggregation
    const propPeriods = (data?.nkPeriods || []).filter((p: any) => p.property_id === propertyId);
    const periodIds = propPeriods.map((p: any) => p.id);
    const propNKItems = (data?.nkItems || []).filter((i: any) => periodIds.includes(i.nk_period_id));
    const autoGrundsteuer = propNKItems.filter((i: any) => i.category_code === 'grundsteuer').reduce((s: number, i: any) => s + (i.amount_total_house || 0), 0);
    const autoNonRecoverable = propNKItems.filter((i: any) => i.is_apportionable === false).reduce((s: number, i: any) => s + (i.amount_total_house || 0), 0);

    // Load overrides from vv_annual_data
    const overrides: VVOverrides = {
      overrideLoanInterest: annualEntry?.override_loan_interest ?? null,
      overrideColdRent: annualEntry?.override_cold_rent ?? null,
      overrideNkAdvance: annualEntry?.override_nk_advance ?? null,
      overrideNkNachzahlung: annualEntry?.override_nk_nachzahlung ?? null,
      overrideGrundsteuer: annualEntry?.override_grundsteuer ?? null,
      overrideNonRecoverable: annualEntry?.override_non_recoverable ?? null,
    };

    // Resolved values: override wins over auto
    const incomeAggregated: VVIncomeAggregated = {
      coldRentAnnual: overrides.overrideColdRent ?? autoColdRent,
      nkAdvanceAnnual: overrides.overrideNkAdvance ?? autoNkAdvance,
      nkNachzahlung: overrides.overrideNkNachzahlung ?? autoNkNachzahlung,
    };

    const financingAggregated: VVFinancingAggregated = {
      loanInterestAnnual: overrides.overrideLoanInterest ?? autoLoanInterest,
    };

    const nkAggregated: VVNKAggregated = {
      grundsteuer: overrides.overrideGrundsteuer ?? autoGrundsteuer,
      nonRecoverableCosts: overrides.overrideNonRecoverable ?? autoNonRecoverable,
    };

    // Manual data
    const manualData: VVAnnualManualData = annualEntry ? {
      id: annualEntry.id,
      propertyId,
      taxYear,
      incomeOther: annualEntry.income_other ?? 0,
      incomeInsurancePayout: annualEntry.income_insurance_payout ?? 0,
      costDisagio: annualEntry.cost_disagio ?? 0,
      costFinancingFees: annualEntry.cost_financing_fees ?? 0,
      costMaintenance: annualEntry.cost_maintenance ?? 0,
      costManagementFee: annualEntry.cost_management_fee ?? 0,
      costLegalAdvisory: annualEntry.cost_legal_advisory ?? 0,
      costInsuranceNonRecoverable: annualEntry.cost_insurance_non_recoverable ?? 0,
      costTravel: annualEntry.cost_travel ?? 0,
      costBankFees: annualEntry.cost_bank_fees ?? 0,
      costOther: annualEntry.cost_other ?? 0,
      vacancyDays: annualEntry.vacancy_days ?? 0,
      vacancyIntentConfirmed: annualEntry.vacancy_intent_confirmed ?? true,
      relativeRental: annualEntry.relative_rental ?? false,
      heritageAfaAmount: annualEntry.heritage_afa_amount ?? 0,
      specialAfaAmount: annualEntry.special_afa_amount ?? 0,
      confirmed: annualEntry.confirmed ?? false,
      status: annualEntry.status ?? 'draft',
      notes: annualEntry.notes ?? '',
    } : {
      ...DEFAULT_MANUAL_DATA,
      propertyId,
      taxYear,
    };

    // Expense aggregation from property_expenses
    const propExpenses = (data?.expenses || []).filter((e: any) => e.property_id === propertyId && e.tax_deductible);
    const categoryMap: Record<string, keyof VVExpenseAggregation> = {
      instandhaltung: 'costMaintenance', handwerker: 'costMaintenance',
      versicherung: 'costInsuranceNonRecoverable', verwalterkosten: 'costManagementFee',
      rechtsberatung: 'costLegalAdvisory', fahrtkosten: 'costTravel',
      bankgebuehren: 'costBankFees', weg_hausgeld: 'costOther',
      grundsteuer: 'costOther', sonstige: 'costOther',
    };
    const expenseAggregation: VVExpenseAggregation = {
      costMaintenance: 0, costInsuranceNonRecoverable: 0, costManagementFee: 0,
      costLegalAdvisory: 0, costTravel: 0, costBankFees: 0, costOther: 0,
    };
    for (const exp of propExpenses) {
      const field = categoryMap[exp.category] || 'costOther';
      expenseAggregation[field] = (expenseAggregation[field] || 0) + (exp.amount || 0);
    }

    return {
      propertyId,
      propertyName: prop.code || prop.address,
      propertyType: prop.property_type || 'ETW',
      address: `${prop.address} ${prop.address_house_no || ''}`.trim(),
      city: prop.city,
      postalCode: prop.postal_code || '',
      yearBuilt: prop.year_built,
      purchasePrice: prop.purchase_price || 0,
      acquisitionCosts: prop.acquisition_costs || 0,
      taxReferenceNumber: prop.tax_reference_number || '',
      ownershipSharePercent: prop.ownership_share_percent ?? 100,
      areaSqm: propUnits.reduce((s: number, u: any) => s + (u.area_sqm || 0), 0) || 0,
      afa,
      incomeAggregated,
      financingAggregated,
      nkAggregated,
      manualData,
      overrides,
      expenseAggregation,
      autoValues: {
        loanInterest: autoLoanInterest,
        coldRent: autoColdRent,
        nkAdvance: autoNkAdvance,
        nkNachzahlung: autoNkNachzahlung,
        grundsteuer: autoGrundsteuer,
        nonRecoverable: autoNonRecoverable,
      },
    };
  }

  // Save mutation — now includes override columns
  const saveMutation = useMutation({
    mutationFn: async (params: { 
      propertyId: string; 
      data: Partial<VVAnnualManualData>; 
      overrides?: Partial<VVOverrides>;
      taxRefNumber?: string; 
      ownershipPercent?: number;
    }) => {
      if (!activeTenantId) throw new Error('No tenant');

      const existing = (data?.annual || []).find((a: any) => a.property_id === params.propertyId);

      const dbData: any = {
        tenant_id: activeTenantId,
        property_id: params.propertyId,
        tax_year: taxYear,
        income_other: params.data.incomeOther ?? 0,
        income_insurance_payout: params.data.incomeInsurancePayout ?? 0,
        cost_disagio: params.data.costDisagio ?? 0,
        cost_financing_fees: params.data.costFinancingFees ?? 0,
        cost_maintenance: params.data.costMaintenance ?? 0,
        cost_management_fee: params.data.costManagementFee ?? 0,
        cost_legal_advisory: params.data.costLegalAdvisory ?? 0,
        cost_insurance_non_recoverable: params.data.costInsuranceNonRecoverable ?? 0,
        cost_travel: params.data.costTravel ?? 0,
        cost_bank_fees: params.data.costBankFees ?? 0,
        cost_other: params.data.costOther ?? 0,
        vacancy_days: params.data.vacancyDays ?? 0,
        vacancy_intent_confirmed: params.data.vacancyIntentConfirmed ?? true,
        relative_rental: params.data.relativeRental ?? false,
        heritage_afa_amount: params.data.heritageAfaAmount ?? 0,
        special_afa_amount: params.data.specialAfaAmount ?? 0,
        confirmed: params.data.confirmed ?? false,
        status: params.data.confirmed ? 'confirmed' : 'draft',
        notes: params.data.notes ?? '',
      };

      // Add override columns
      if (params.overrides) {
        dbData.override_loan_interest = params.overrides.overrideLoanInterest ?? null;
        dbData.override_cold_rent = params.overrides.overrideColdRent ?? null;
        dbData.override_nk_advance = params.overrides.overrideNkAdvance ?? null;
        dbData.override_nk_nachzahlung = params.overrides.overrideNkNachzahlung ?? null;
        dbData.override_grundsteuer = params.overrides.overrideGrundsteuer ?? null;
        dbData.override_non_recoverable = params.overrides.overrideNonRecoverable ?? null;
      }

      if (existing) {
        const { error } = await (supabase as any).from('vv_annual_data').update(dbData).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('vv_annual_data').insert(dbData);
        if (error) throw error;
      }

      // Update property-level fields if provided
      if (params.taxRefNumber !== undefined || params.ownershipPercent !== undefined) {
        const propUpdate: any = {};
        if (params.taxRefNumber !== undefined) propUpdate.tax_reference_number = params.taxRefNumber;
        if (params.ownershipPercent !== undefined) propUpdate.ownership_share_percent = params.ownershipPercent;
        await supabase.from('properties').update(propUpdate).eq('id', params.propertyId);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success('Daten gespeichert');
    },
    onError: (err: any) => {
      toast.error('Fehler beim Speichern: ' + err.message);
    },
  });

  return {
    contexts,
    isLoading,
    buildPropertyTaxData,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}
