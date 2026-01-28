import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { UnitDossierData, DocumentStatus } from '@/types/immobilienakte';

/**
 * Hook to load all data required for the Immobilienakte (Unit Dossier View).
 * Aggregates data from: units, properties, leases, loans, nk_periods, storage_nodes/documents
 */
export function useUnitDossier(unitId: string | undefined) {
  const { activeTenantId } = useAuth();

  return useQuery({
    queryKey: ['unit-dossier', unitId, activeTenantId],
    queryFn: async (): Promise<UnitDossierData | null> => {
      if (!unitId || !activeTenantId) return null;

      // 1. Load Unit + Property (JOIN)
      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .select(`
          *,
          properties!inner (
            id,
            tenant_id,
            code,
            address,
            city,
            postal_code,
            property_type,
            year_built,
            market_value,
            purchase_price,
            weg_flag,
            land_register_refs,
            manager_contact,
            total_area_sqm,
            energy_source,
            heating_type
          )
        `)
        .eq('id', unitId)
        .eq('tenant_id', activeTenantId)
        .single();

      if (unitError || !unitData) {
        console.error('Unit not found:', unitError);
        return null;
      }

      const property = unitData.properties as any;

      // 2. Load active Lease for this unit
      const { data: leaseData } = await supabase
        .from('leases')
        .select(`
          *,
          contacts!leases_contact_fk (
            first_name,
            last_name,
            company
          )
        `)
        .eq('unit_id', unitId)
        .eq('tenant_id', activeTenantId)
        .eq('status', 'active')
        .single();

      // 3. Load Loan for this unit or property
      const { data: loanData } = await supabase
        .from('loans')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .or(`unit_id.eq.${unitId},property_id.eq.${property.id}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // 4. Load NK Period for this property (current year)
      const currentYear = new Date().getFullYear();
      const { data: nkPeriodData } = await supabase
        .from('nk_periods')
        .select('*')
        .eq('property_id', property.id)
        .eq('tenant_id', activeTenantId)
        .gte('period_end', `${currentYear}-01-01`)
        .order('period_start', { ascending: false })
        .limit(1)
        .single();

      // 5. Load Documents from storage_nodes for this unit/property
      const { data: storageNodes } = await supabase
        .from('storage_nodes')
        .select('id, name, doc_type_hint, node_type')
        .eq('tenant_id', activeTenantId)
        .or(`unit_id.eq.${unitId},property_id.eq.${property.id}`)
        .eq('node_type', 'folder');

      const { data: documentLinks } = await supabase
        .from('document_links')
        .select(`
          id,
          document_id,
          node_id,
          documents (
            id,
            name,
            doc_type,
            review_state
          )
        `)
        .eq('tenant_id', activeTenantId)
        .or(`unit_id.eq.${unitId},object_id.eq.${property.id}`);

      // Build document status list
      const docTypes = [
        { docType: 'DOC_PURCHASE_CONTRACT', label: 'Kaufvertrag' },
        { docType: 'DOC_LEASE_CONTRACT', label: 'Mietvertrag' },
        { docType: 'DOC_LAND_REGISTER', label: 'Grundbuchauszug' },
        { docType: 'DOC_ENERGY_CERT', label: 'Energieausweis' },
        { docType: 'DOC_FLOORPLAN', label: 'Grundriss' },
        { docType: 'DOC_DIVISION_DECLARATION', label: 'Teilungserklärung' },
        { docType: 'DOC_INSURANCE_BUILDING', label: 'Gebäudeversicherung' },
        { docType: 'DOC_WEG_ANNUAL_STATEMENT', label: 'WEG-Abrechnung' },
      ];

      const documents: DocumentStatus[] = docTypes.map(dt => {
        const found = documentLinks?.find(dl => {
          const doc = dl.documents as any;
          return doc?.doc_type === dt.docType;
        });
        
        if (found) {
          const doc = found.documents as any;
          return {
            docType: dt.docType,
            label: dt.label,
            status: doc.review_state === 'AUTO_ACCEPTED' ? 'complete' : 'review',
            path: doc.id,
          };
        }
        
        // Check if folder exists with doc_type_hint
        const folderExists = storageNodes?.some(n => n.doc_type_hint === dt.docType);
        return {
          docType: dt.docType,
          label: dt.label,
          status: folderExists ? 'missing' : 'missing',
        };
      });

      // Determine tenancy status
      let tenancyStatus: 'ACTIVE' | 'VACANT' | 'TERMINATING' | 'ENDED' = 'VACANT';
      if (leaseData) {
        if (leaseData.status === 'active') tenancyStatus = 'ACTIVE';
        else if (leaseData.end_date) tenancyStatus = 'TERMINATING';
        else tenancyStatus = 'ENDED';
      }

      // Calculate Investment KPIs
      const purchasePrice = property.purchase_price || property.market_value || 0;
      const annualRent = (leaseData?.rent_cold_eur || unitData.current_monthly_rent || 0) * 12;
      const grossYield = purchasePrice > 0 ? (annualRent / purchasePrice) * 100 : 0;
      const nonAllocCosts = (nkPeriodData?.top_cost_blocks as any)?.non_allocatable || 0;
      const netRent = annualRent - nonAllocCosts;
      const netYield = purchasePrice > 0 ? (netRent / purchasePrice) * 100 : 0;

      // Build the dossier data
      const dossierData: UnitDossierData = {
        // Header
        unitCode: unitData.code || unitData.unit_number || property.code || 'MAIN',
        address: `${property.address}, ${property.postal_code || ''} ${property.city}`.trim(),
        locationLabel: property.city,
        status: tenancyStatus === 'ACTIVE' ? 'VERMIETET' : tenancyStatus === 'VACANT' ? 'LEERSTAND' : 'IN_NEUVERMIETUNG',
        asofDate: unitData.dossier_asof_date || new Date().toISOString().split('T')[0],
        dataQuality: (unitData.dossier_data_quality as 'OK' | 'PRUEFEN') || 'PRUEFEN',

        // Identity
        propertyType: property.property_type,
        buildYear: property.year_built,
        wegFlag: property.weg_flag,
        meaOrTeNo: property.land_register_refs?.te_no,

        // Core Data
        areaLivingSqm: unitData.area_sqm || property.total_area_sqm || 0,
        roomsCount: (unitData as any).rooms_count,
        bathroomsCount: unitData.bathrooms_count,
        heatingType: property.heating_type || unitData.heating_supply,
        energySource: property.energy_source,
        energyCertificateValue: unitData.energy_certificate_value,
        energyCertificateValidUntil: unitData.energy_certificate_valid_until,
        featuresTags: unitData.features_tags as string[] || [],

        // Tenancy
        tenancyStatus,
        startDate: leaseData?.start_date,
        rentColdEur: leaseData?.rent_cold_eur || unitData.current_monthly_rent,
        nkAdvanceEur: leaseData?.nk_advance_eur || unitData.ancillary_costs,
        heatingAdvanceEur: leaseData?.heating_advance_eur,
        rentWarmEur: 
          (leaseData?.rent_cold_eur || 0) + (leaseData?.nk_advance_eur || 0) + (leaseData?.heating_advance_eur || 0),
        paymentDueDay: leaseData?.payment_due_day,
        depositAmountEur: leaseData?.deposit_amount_eur,
        depositStatus: (leaseData?.deposit_status as 'PAID' | 'OPEN' | 'PARTIAL') || 'OPEN',
        rentModel: (leaseData?.rent_model as 'FIX' | 'INDEX' | 'STAFFEL') || 'FIX',
        nextRentAdjustmentDate: leaseData?.next_rent_adjustment_earliest_date,

        // NK/WEG
        periodCurrent: nkPeriodData ? 
          `${new Date(nkPeriodData.period_start).getFullYear()}` : 
          undefined,
        allocationKeyDefault: (nkPeriodData?.allocation_key_default as any) || 'SQM',
        lastSettlementDate: nkPeriodData?.settlement_date,
        lastSettlementBalanceEur: nkPeriodData?.settlement_balance_eur,
        topCostBlocks: nkPeriodData?.top_cost_blocks as Record<string, number>,

        // Investment KPIs
        purchasePriceEur: property.purchase_price,
        valuationEur: property.market_value,
        netColdRentPaEur: annualRent,
        nonAllocCostsPaEur: nonAllocCosts,
        grossYieldPercent: grossYield,
        netYieldPercent: netYield,

        // Financing
        bankName: loanData?.bank_name,
        loanNumber: loanData?.loan_number,
        outstandingBalanceEur: loanData?.outstanding_balance_eur,
        outstandingBalanceAsof: loanData?.outstanding_balance_asof,
        interestRatePercent: loanData?.interest_rate_percent,
        fixedInterestEndDate: loanData?.fixed_interest_end_date,
        annuityMonthlyEur: loanData?.annuity_monthly_eur,
        specialRepaymentRight: loanData?.special_repayment_right_eur_per_year 
          ? { enabled: true, amountEur: loanData.special_repayment_right_eur_per_year }
          : undefined,
        contactPerson: loanData?.contact_person as any,

        // Legal
        landRegisterShort: property.land_register_refs?.short,
        managerContact: property.manager_contact as any,

        // Documents
        documents,
      };

      return dossierData;
    },
    enabled: !!unitId && !!activeTenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to load dossier data by property ID (for single-unit properties).
 * Automatically finds the MAIN unit and loads its dossier.
 */
export function usePropertyDossier(propertyId: string | undefined) {
  const { activeTenantId } = useAuth();

  // First, get the primary unit for this property
  const { data: unitData, isLoading: unitLoading } = useQuery({
    queryKey: ['property-main-unit', propertyId, activeTenantId],
    queryFn: async () => {
      if (!propertyId || !activeTenantId) return null;

      const { data, error } = await supabase
        .from('units')
        .select('id')
        .eq('property_id', propertyId)
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (error) {
        console.error('No unit found for property:', error);
        return null;
      }

      return data;
    },
    enabled: !!propertyId && !!activeTenantId,
  });

  // Then load the dossier for that unit
  const dossierQuery = useUnitDossier(unitData?.id);

  return {
    ...dossierQuery,
    isLoading: unitLoading || dossierQuery.isLoading,
  };
}
