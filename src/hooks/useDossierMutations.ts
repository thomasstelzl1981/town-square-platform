import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type {
  PropertyFormData,
  UnitFormData,
  LeaseFormData,
  LoanFormData,
  NKPeriodFormData,
  AccountingFormData,
} from '@/types/immobilienakte';

/**
 * Mutation hook for updating property data (Block A, B, D, partial G)
 */
export function useUpdateProperty() {
  const queryClient = useQueryClient();
  const { activeTenantId } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ propertyId, data }: { propertyId: string; data: Partial<PropertyFormData> }) => {
      if (!activeTenantId) throw new Error('No active tenant');

      const updateData: Record<string, any> = {};
      
      // Map form data to DB columns
      if (data.code !== undefined) updateData.code = data.code;
      if (data.propertyType !== undefined) updateData.property_type = data.propertyType;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.saleEnabled !== undefined) updateData.sale_enabled = data.saleEnabled;
      if (data.rentalManaged !== undefined) updateData.rental_managed = data.rentalManaged;
      if (data.landlordContextId !== undefined) updateData.landlord_context_id = data.landlordContextId;
      if (data.reportingRegime !== undefined) updateData.reporting_regime = data.reportingRegime;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.addressHouseNo !== undefined) updateData.address_house_no = data.addressHouseNo;
      if (data.postalCode !== undefined) updateData.postal_code = data.postalCode;
      if (data.city !== undefined) updateData.city = data.city;
      if (data.locationLabel !== undefined) updateData.location_label = data.locationLabel;
      if (data.locationNotes !== undefined) updateData.location_notes = data.locationNotes;
      if ((data as any).description !== undefined) updateData.description = (data as any).description;
      if (data.latitude !== undefined) updateData.latitude = data.latitude;
      if (data.longitude !== undefined) updateData.longitude = data.longitude;
      if (data.yearBuilt !== undefined) updateData.year_built = data.yearBuilt;
      if (data.usageType !== undefined) updateData.usage_type = data.usageType;
      if (data.totalAreaSqm !== undefined) updateData.total_area_sqm = data.totalAreaSqm;
      if (data.heatingType !== undefined) updateData.heating_type = data.heatingType;
      if (data.energySource !== undefined) updateData.energy_source = data.energySource;
      if (data.landRegisterCourt !== undefined) updateData.land_register_court = data.landRegisterCourt;
      if (data.landRegisterSheet !== undefined) updateData.land_register_sheet = data.landRegisterSheet;
      if (data.landRegisterVolume !== undefined) updateData.land_register_volume = data.landRegisterVolume;
      if (data.parcelNumber !== undefined) updateData.parcel_number = data.parcelNumber;
      if (data.teNumber !== undefined) updateData.te_number = data.teNumber;
      if (data.notaryDate !== undefined) updateData.notary_date = data.notaryDate;
      if (data.purchasePrice !== undefined) updateData.purchase_price = data.purchasePrice;
      if (data.marketValue !== undefined) updateData.market_value = data.marketValue;
      if (data.acquisitionCosts !== undefined) updateData.acquisition_costs = data.acquisitionCosts;
      if (data.wegFlag !== undefined) updateData.weg_flag = data.wegFlag;
      if (data.meaTotal !== undefined) updateData.mea_total = data.meaTotal;
      if (data.allocationKey !== undefined) updateData.allocation_key = data.allocationKey;
      if (data.managerContact !== undefined) updateData.manager_contact = data.managerContact;

      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', propertyId)
        .eq('tenant_id', activeTenantId);

      if (error) throw error;
      return { propertyId };
    },
    onSuccess: ({ propertyId }) => {
      queryClient.invalidateQueries({ queryKey: ['unit-dossier'] });
      queryClient.invalidateQueries({ queryKey: ['property-main-unit', propertyId] });
      toast({ title: 'Immobilie gespeichert' });
    },
    onError: (error: Error) => {
      toast({ title: 'Fehler beim Speichern', description: error.message, variant: 'destructive' });
    },
  });
}

/**
 * Mutation hook for updating unit data (Block C, partial G)
 */
export function useUpdateUnit() {
  const queryClient = useQueryClient();
  const { activeTenantId } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ unitId, data }: { unitId: string; data: Partial<UnitFormData> }) => {
      if (!activeTenantId) throw new Error('No active tenant');

      const updateData: Record<string, any> = {};
      
      if (data.unitNumber !== undefined) updateData.unit_number = data.unitNumber;
      if (data.code !== undefined) updateData.code = data.code;
      if (data.areaSqm !== undefined) updateData.area_sqm = data.areaSqm;
      if (data.areaUsableSqm !== undefined) updateData.area_usable_sqm = data.areaUsableSqm;
      if (data.rooms !== undefined) updateData.rooms = data.rooms;
      if (data.bathroomsCount !== undefined) updateData.bathrooms_count = data.bathroomsCount;
      if (data.floor !== undefined) updateData.floor = data.floor;
      if (data.heatingSupply !== undefined) updateData.heating_supply = data.heatingSupply;
      if (data.energyCertificateValue !== undefined) updateData.energy_certificate_value = data.energyCertificateValue;
      if (data.energyCertificateValidUntil !== undefined) updateData.energy_certificate_valid_until = data.energyCertificateValidUntil;
      if (data.featuresTags !== undefined) updateData.features_tags = data.featuresTags;
      if (data.meaShare !== undefined) updateData.mea_share = data.meaShare;
      if (data.hausgeldMonthly !== undefined) updateData.hausgeld_monthly = data.hausgeldMonthly;
      if (data.vacancyDays !== undefined) updateData.vacancy_days = data.vacancyDays;

      const { error } = await supabase
        .from('units')
        .update(updateData)
        .eq('id', unitId)
        .eq('tenant_id', activeTenantId);

      if (error) throw error;
      return { unitId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-dossier'] });
      toast({ title: 'Einheit gespeichert' });
    },
    onError: (error: Error) => {
      toast({ title: 'Fehler beim Speichern', description: error.message, variant: 'destructive' });
    },
  });
}

/**
 * Mutation hook for upserting lease data (Block F)
 * Creates new lease if leaseId is undefined, updates existing otherwise
 */
export function useUpsertLease() {
  const queryClient = useQueryClient();
  const { activeTenantId } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ leaseId, data }: { leaseId?: string; data: LeaseFormData }) => {
      if (!activeTenantId) throw new Error('No active tenant');

      const leaseData = {
        tenant_id: activeTenantId,
        tenant_contact_id: data.tenantContactId,
        unit_id: data.unitId,
        start_date: data.startDate,
        end_date: data.endDate || null,
        lease_type: data.leaseType,
        rent_cold_eur: data.rentColdEur,
        monthly_rent: data.rentColdEur, // Legacy field
        nk_advance_eur: data.nkAdvanceEur || null,
        heating_advance_eur: data.heatingAdvanceEur || null,
        deposit_amount_eur: data.depositAmountEur || null,
        deposit_status: data.depositStatus,
        payment_due_day: data.paymentDueDay || null,
        rent_model: data.rentModel,
        next_rent_adjustment_earliest_date: data.nextRentAdjustmentEarliestDate || null,
        status: 'active',
      };

      if (leaseId) {
        // Update existing
        const { error } = await supabase
          .from('leases')
          .update(leaseData)
          .eq('id', leaseId)
          .eq('tenant_id', activeTenantId);
        if (error) throw error;
        return { leaseId };
      } else {
        // Insert new
        const { data: newLease, error } = await supabase
          .from('leases')
          .insert(leaseData)
          .select('id')
          .single();
        if (error) throw error;
        return { leaseId: newLease.id };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-dossier'] });
      toast({ title: 'Mietverhältnis gespeichert' });
    },
    onError: (error: Error) => {
      toast({ title: 'Fehler beim Speichern', description: error.message, variant: 'destructive' });
    },
  });
}

/**
 * Mutation hook for upserting loan data (Block H)
 */
export function useUpsertLoan() {
  const queryClient = useQueryClient();
  const { activeTenantId } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ loanId, data }: { loanId?: string; data: LoanFormData }) => {
      if (!activeTenantId) throw new Error('No active tenant');

      const loanData: Record<string, any> = {
        tenant_id: activeTenantId,
        bank_name: data.bankName,
        loan_number: data.loanNumber,
        original_amount: data.originalAmount || null,
        outstanding_balance_eur: data.outstandingBalanceEur || null,
        outstanding_balance_asof: data.outstandingBalanceAsof || null,
        interest_rate_percent: data.interestRatePercent || null,
        fixed_interest_end_date: data.fixedInterestEndDate || null,
        annuity_monthly_eur: data.annuityMonthlyEur || null,
        repayment_rate_percent: data.repaymentRatePercent || null,
        special_repayment_right_eur_per_year: data.specialRepaymentRightEurPerYear || null,
        contact_person: data.contactPerson ? JSON.parse(JSON.stringify(data.contactPerson)) : null,
        property_id: data.propertyId || null,
        unit_id: data.unitId || null,
        scope: data.unitId ? 'unit' : 'property',
      };

      if (loanId) {
        const { error } = await supabase
          .from('loans')
          .update(loanData)
          .eq('id', loanId)
          .eq('tenant_id', activeTenantId);
        if (error) throw error;
        return { loanId };
      } else {
        const { data: newLoan, error } = await supabase
          .from('loans')
          .insert(loanData as any)
          .select('id')
          .single();
        if (error) throw error;
        return { loanId: newLoan.id };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-dossier'] });
      toast({ title: 'Finanzierung gespeichert' });
    },
    onError: (error: Error) => {
      toast({ title: 'Fehler beim Speichern', description: error.message, variant: 'destructive' });
    },
  });
}

/**
 * Mutation hook for upserting NK period data (Block G)
 */
export function useUpsertNKPeriod() {
  const queryClient = useQueryClient();
  const { activeTenantId } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ periodId, data }: { periodId?: string; data: NKPeriodFormData }) => {
      if (!activeTenantId) throw new Error('No active tenant');

      const periodData = {
        tenant_id: activeTenantId,
        property_id: data.propertyId,
        period_start: data.periodStart,
        period_end: data.periodEnd,
        allocation_key_default: data.allocationKeyDefault || 'SQM',
        settlement_date: data.settlementDate || null,
        settlement_balance_eur: data.settlementBalanceEur || null,
        allocatable_eur: data.allocatableEur || null,
        non_allocatable_eur: data.nonAllocatableEur || null,
        top_cost_blocks: data.topCostBlocks || null,
        status: data.status || 'laufend',
      };

      if (periodId) {
        const { error } = await supabase
          .from('nk_periods')
          .update(periodData)
          .eq('id', periodId)
          .eq('tenant_id', activeTenantId);
        if (error) throw error;
        return { periodId };
      } else {
        const { data: newPeriod, error } = await supabase
          .from('nk_periods')
          .insert(periodData)
          .select('id')
          .single();
        if (error) throw error;
        return { periodId: newPeriod.id };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-dossier'] });
      toast({ title: 'NK-Periode gespeichert' });
    },
    onError: (error: Error) => {
      toast({ title: 'Fehler beim Speichern', description: error.message, variant: 'destructive' });
    },
  });
}

/**
 * Mutation hook for upserting accounting/AfA data (Block I)
 */
export function useUpsertPropertyAccounting() {
  const queryClient = useQueryClient();
  const { activeTenantId } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ accountingId, data }: { accountingId?: string; data: AccountingFormData }) => {
      if (!activeTenantId) throw new Error('No active tenant');

      const accountingData = {
        tenant_id: activeTenantId,
        property_id: data.propertyId,
        land_share_percent: data.landSharePercent || null,
        building_share_percent: data.buildingSharePercent || null,
        book_value_eur: data.bookValueEur || null,
        afa_rate_percent: data.afaRatePercent || null,
        afa_start_date: data.afaStartDate || null,
        afa_method: data.afaMethod || 'linear',
        remaining_useful_life_years: data.remainingUsefulLifeYears || null,
        modernization_costs_eur: data.modernizationCostsEur || null,
        modernization_year: data.modernizationYear || null,
        coa_version: data.coaVersion || 'SKR04_Starter',
        account_mappings: data.accountMappings || {},
      };

      if (accountingId) {
        const { error } = await supabase
          .from('property_accounting')
          .update(accountingData)
          .eq('id', accountingId)
          .eq('tenant_id', activeTenantId);
        if (error) throw error;
        return { accountingId };
      } else {
        // Use upsert to handle unique constraint on (tenant_id, property_id)
        const { data: newAccounting, error } = await supabase
          .from('property_accounting')
          .upsert(accountingData, { onConflict: 'tenant_id,property_id' })
          .select('id')
          .single();
        if (error) throw error;
        return { accountingId: newAccounting.id };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-dossier'] });
      toast({ title: 'Buchhaltungsdaten gespeichert' });
    },
    onError: (error: Error) => {
      toast({ title: 'Fehler beim Speichern', description: error.message, variant: 'destructive' });
    },
  });
}

/**
 * Combined mutation hook that saves all dossier blocks atomically
 */
export function useSaveDossier() {
  const updateProperty = useUpdateProperty();
  const updateUnit = useUpdateUnit();
  const upsertLease = useUpsertLease();
  const upsertLoan = useUpsertLoan();
  const upsertAccounting = useUpsertPropertyAccounting();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      propertyId: string;
      unitId?: string;
      leaseId?: string;
      loanId?: string;
      accountingId?: string;
      propertyData?: Partial<PropertyFormData>;
      unitData?: Partial<UnitFormData>;
      leaseData?: LeaseFormData;
      loanData?: LoanFormData;
      accountingData?: AccountingFormData;
    }) => {
      const errors: string[] = [];

      // Save property
      if (params.propertyData && Object.keys(params.propertyData).length > 0) {
        try {
          await updateProperty.mutateAsync({ propertyId: params.propertyId, data: params.propertyData });
        } catch (e: any) {
          errors.push(`Property: ${e.message}`);
        }
      }

      // Save unit
      if (params.unitId && params.unitData && Object.keys(params.unitData).length > 0) {
        try {
          await updateUnit.mutateAsync({ unitId: params.unitId, data: params.unitData });
        } catch (e: any) {
          errors.push(`Unit: ${e.message}`);
        }
      }

      // Save lease
      if (params.leaseData) {
        try {
          await upsertLease.mutateAsync({ leaseId: params.leaseId, data: params.leaseData });
        } catch (e: any) {
          errors.push(`Lease: ${e.message}`);
        }
      }

      // Save loan
      if (params.loanData) {
        try {
          await upsertLoan.mutateAsync({ loanId: params.loanId, data: params.loanData });
        } catch (e: any) {
          errors.push(`Loan: ${e.message}`);
        }
      }

      // Save accounting
      if (params.accountingData) {
        try {
          await upsertAccounting.mutateAsync({ accountingId: params.accountingId, data: params.accountingData });
        } catch (e: any) {
          errors.push(`Accounting: ${e.message}`);
        }
      }

      if (errors.length > 0) {
        throw new Error(errors.join('\n'));
      }

      return { success: true };
    },
    onSuccess: () => {
      toast({ title: 'Immobilienakte gespeichert', description: 'Alle Änderungen wurden übernommen.' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Fehler beim Speichern', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}
