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

        // Block A: Identity (NEW required fields)
        propertyId: property.id,
        unitId: unitData.id,
        tenantId: property.tenant_id,
        publicId: property.public_id || unitData.public_id,
        propertyType: property.property_type,
        category: ((property as any).category as 'einzelobjekt' | 'globalobjekt') || 'einzelobjekt',
        propertyStatus: (property.status as any) || 'aktiv',
        saleEnabled: (property as any).sale_enabled || false,
        rentalManaged: (property as any).rental_managed || false,
        vermieterKontextId: (property as any).landlord_context_id,
        reportingRegime: ((property as any).reporting_regime as 'VuV' | 'SuSa_BWA') || 'VuV',

        // Block B: Address
        street: property.address,
        houseNumber: (property as any).address_house_no,
        postalCode: property.postal_code || '',
        city: property.city,
        locationNotes: (property as any).location_notes,
        latitude: (property as any).latitude,
        longitude: (property as any).longitude,

        // Block C: Building
        buildYear: property.year_built,
        usageType: ((property as any).usage_type as 'wohnen' | 'gewerbe' | 'mischnutzung') || 'wohnen',
        areaLivingSqm: unitData.area_sqm || property.total_area_sqm || 0,
        areaUsableSqm: (unitData as any).area_usable_sqm,
        roomsCount: unitData.rooms,
        bathroomsCount: unitData.bathrooms_count,
        floor: unitData.floor,
        unitNumber: unitData.unit_number,
        heatingType: property.heating_type || unitData.heating_supply,
        energySource: property.energy_source,
        energyCertType: unitData.energy_certificate_type,
        energyCertValue: unitData.energy_certificate_value,
        energyCertValidUntil: unitData.energy_certificate_valid_until,
        featuresTags: unitData.features_tags as string[] || [],

        // Block D: Legal
        landRegisterCourt: property.land_register_court,
        landRegisterOf: (property.land_register_refs as any)?.of,
        landRegisterSheet: property.land_register_sheet,
        landRegisterVolume: property.land_register_volume,
        parcelNumber: property.parcel_number,
        teNumber: (property as any).te_number || property.unit_ownership_nr,
        purchaseDate: property.notary_date,
        purchasePrice: property.purchase_price,
        marketValue: property.market_value,
        acquisitionCosts: (property as any).acquisition_costs,
        wegFlag: property.weg_flag || false,
        meaOrTeNo: (property.land_register_refs as any)?.te_no || property.unit_ownership_nr,

        // Block E: Investment KPIs
        annualIncome: annualRent,
        grossYieldPercent: grossYield,
        netYieldPercent: netYield,
        cashflowMonthly: (annualRent - nonAllocCosts - (loanData?.annuity_monthly_eur || 0) * 12) / 12,
        vacancyDays: (unitData as any).vacancy_days || 0,
        // Legacy fields
        purchasePriceEur: property.purchase_price,
        purchaseCostsEur: (property as any).acquisition_costs,
        valuationEur: property.market_value,
        netColdRentPaEur: annualRent,
        nonAllocCostsPaEur: nonAllocCosts,
        cashflowPreTaxMonthlyEur: (annualRent - nonAllocCosts - (loanData?.annuity_monthly_eur || 0) * 12) / 12,

        // Block F: Tenancy
        leaseId: leaseData?.id,
        tenantContactId: leaseData?.tenant_contact_id,
        tenantName: leaseData?.contacts 
          ? `${(leaseData.contacts as any).first_name} ${(leaseData.contacts as any).last_name}`.trim()
          : undefined,
        tenancyStatus,
        leaseType: ((leaseData as any)?.lease_type as 'unbefristet' | 'befristet' | 'staffel' | 'index' | 'gewerbe') || 'unbefristet',
        startDate: leaseData?.start_date,
        endDate: leaseData?.end_date,
        rentColdEur: leaseData?.rent_cold_eur || unitData.current_monthly_rent,
        nkAdvanceEur: leaseData?.nk_advance_eur || unitData.ancillary_costs,
        heatingAdvanceEur: leaseData?.heating_advance_eur,
        rentWarmEur: (leaseData?.rent_cold_eur || 0) + (leaseData?.nk_advance_eur || 0) + (leaseData?.heating_advance_eur || 0),
        paymentDueDay: leaseData?.payment_due_day,
        depositAmountEur: leaseData?.deposit_amount_eur,
        depositStatus: (leaseData?.deposit_status as 'PAID' | 'OPEN' | 'PARTIAL') || 'OPEN',
        rentModel: (leaseData?.rent_model as 'FIX' | 'INDEX' | 'STAFFEL') || 'FIX',
        nextRentAdjustmentDate: leaseData?.next_rent_adjustment_earliest_date,

        // Block G: WEG/NK
        meaShare: (unitData as any).mea_share,
        meaTotal: property.mea_total,
        hausgeldMonthlyEur: (unitData as any).hausgeld_monthly,
        allocationKeyDefault: ((property as any).allocation_key as 'SQM' | 'PERSONS' | 'MEA' | 'CONSUMPTION' | 'UNITS') || 'SQM',
        managerContactId: (property as any).manager_contact_id,
        managerContact: property.manager_contact as any,
        periodCurrent: nkPeriodData ? `${new Date(nkPeriodData.period_start).getFullYear()}` : undefined,
        lastSettlementDate: nkPeriodData?.settlement_date,
        lastSettlementBalanceEur: nkPeriodData?.settlement_balance_eur,
        allocatablePaEur: (nkPeriodData as any)?.allocatable_eur,
        nonAllocatablePaEur: (nkPeriodData as any)?.non_allocatable_eur,
        topCostBlocks: nkPeriodData?.top_cost_blocks as Record<string, number>,

        // Block H: Financing
        loanId: loanData?.id,
        bankName: loanData?.bank_name,
        loanNumber: loanData?.loan_number,
        originalAmountEur: (loanData as any)?.original_amount,
        outstandingBalanceEur: loanData?.outstanding_balance_eur,
        outstandingBalanceAsof: loanData?.outstanding_balance_asof,
        interestRatePercent: loanData?.interest_rate_percent,
        fixedInterestEndDate: loanData?.fixed_interest_end_date,
        annuityMonthlyEur: loanData?.annuity_monthly_eur,
        repaymentRatePercent: loanData?.repayment_rate_percent,
        specialRepaymentRight: loanData?.special_repayment_right_eur_per_year 
          ? { enabled: true, amountEur: loanData.special_repayment_right_eur_per_year }
          : undefined,
        loanContactPerson: loanData?.contact_person as any,
        contactPerson: loanData?.contact_person as any,

        // Block I: Accounting (will be loaded separately or empty defaults)
        afaMethod: 'linear',
        coaVersion: 'SKR04_Starter',

        // Block J: Documents
        documents,

        // Legacy fields
        landRegisterShort: (property.land_register_refs as any)?.short,
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
