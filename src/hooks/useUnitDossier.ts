import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { UnitDossierData, DocumentStatus } from '@/types/immobilienakte';

// Extended lease interface for multi-lease support
export interface LeaseWithContact {
  id: string;
  status: string;
  rent_cold_eur: number | null;
  nk_advance_eur: number | null;
  heating_advance_eur: number | null;
  start_date: string | null;
  end_date: string | null;
  tenant_contact_id: string | null;
  payment_due_day: number | null;
  deposit_amount_eur: number | null;
  deposit_status: string | null;
  rent_model: string | null;
  next_rent_adjustment_earliest_date: string | null;
  lease_type?: string;
  contacts: {
    first_name: string;
    last_name: string;
    company: string | null;
  } | null;
}

/**
 * Hook to load all data required for the Immobilienakte (Unit Dossier View).
 * Aggregates data from: units, properties, leases (MULTI!), loans, nk_periods, storage_nodes/documents
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
            heating_type,
            description
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

      // 2. Load ALL Leases for this unit (MULTI-LEASE SUPPORT)
      const { data: leasesData } = await supabase
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
        .order('status', { ascending: true }) // 'active' before 'ended'
        .order('start_date', { ascending: false });

      // Sort: active leases first, then by start_date desc
      const allLeases: LeaseWithContact[] = (leasesData || []).map(l => ({
        ...l,
        contacts: l.contacts as any,
      }));
      
      const activeLeases = allLeases.filter(l => l.status === 'active');
      const historicalLeases = allLeases.filter(l => l.status !== 'active');
      const sortedLeases = [...activeLeases, ...historicalLeases];
      
      // Primary lease for display (first active or first historical)
      const primaryLease = sortedLeases[0] || null;

      // Calculate sums for active leases (for multi-lease units like TG, WG, etc.)
      const totalMonthlyRent = activeLeases.reduce((sum, l) => sum + (l.rent_cold_eur || 0), 0);
      const totalNkAdvance = activeLeases.reduce((sum, l) => sum + (l.nk_advance_eur || 0), 0);
      const totalHeatingAdvance = activeLeases.reduce((sum, l) => sum + (l.heating_advance_eur || 0), 0);

      // 3. Load Loan for this unit or property
      const { data: loanData } = await supabase
        .from('loans')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .or(`unit_id.eq.${unitId},property_id.eq.${property.id}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

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
        .maybeSingle();

      // 5. Load Documents from storage_nodes for this unit/property
      const { data: storageNodes } = await supabase
        .from('storage_nodes')
        .select('id, name, doc_type_hint, node_type')
        .eq('tenant_id', activeTenantId)
        .or(`unit_id.eq.${unitId},property_id.eq.${property.id}`)
        .eq('node_type', 'folder');

      // 6. Load document_links with documents for status calculation
      const { data: documentLinks } = await supabase
        .from('document_links')
        .select(`
          id,
          document_id,
          node_id,
          link_status,
          object_type,
          object_id,
          documents (
            id,
            name,
            doc_type,
            review_state
          )
        `)
        .eq('tenant_id', activeTenantId)
        .or(`unit_id.eq.${unitId},object_id.eq.${property.id},object_id.eq.${unitId}`);

      // Build document status list based on document_links (SSOT)
      const docTypes = [
        { docType: 'DOC_PURCHASE_CONTRACT', label: 'Kaufvertrag' },
        { docType: 'DOC_LEASE_CONTRACT', label: 'Mietvertrag' },
        { docType: 'DOC_LAND_REGISTER', label: 'Grundbuchauszug' },
        { docType: 'DOC_ENERGY_CERT', label: 'Energieausweis' },
        { docType: 'DOC_FLOORPLAN', label: 'Grundriss' },
        { docType: 'DOC_DIVISION_DECLARATION', label: 'Teilungserklärung' },
        { docType: 'DOC_INSURANCE_BUILDING', label: 'Gebäudeversicherung' },
        { docType: 'DOC_WEG_ANNUAL_STATEMENT', label: 'WEG-Abrechnung' },
        { docType: 'DOC_WEG_BUDGET_PLAN', label: 'Wirtschaftsplan' },
        { docType: 'DOC_NK_STATEMENT', label: 'NK-Abrechnung' },
        { docType: 'DOC_LOAN_BUCKET', label: 'Darlehensunterlagen' },
      ];

      const documents: DocumentStatus[] = docTypes.map(dt => {
        // Check document_links first (SSOT)
        const linkedDoc = documentLinks?.find(dl => {
          const doc = dl.documents as any;
          return doc?.doc_type === dt.docType;
        });
        
        if (linkedDoc) {
          const doc = linkedDoc.documents as any;
          const linkStatus = linkedDoc.link_status;
          
          // Status priority: link_status > review_state
          let status: 'complete' | 'review' | 'missing' = 'review';
          if (linkStatus === 'accepted' || linkStatus === 'current') {
            status = 'complete';
          } else if (doc?.review_state === 'AUTO_ACCEPTED') {
            status = 'complete';
          } else if (linkStatus === 'pending' || linkStatus === 'needs_review') {
            status = 'review';
          }
          
          return {
            docType: dt.docType,
            label: dt.label,
            status,
            path: doc?.id,
          };
        }
        
        // Check if folder exists with doc_type_hint
        const folderExists = storageNodes?.some(n => n.doc_type_hint === dt.docType);
        return {
          docType: dt.docType,
          label: dt.label,
          status: 'missing' as const,
        };
      });

      // Determine tenancy status
      let tenancyStatus: 'ACTIVE' | 'VACANT' | 'TERMINATING' | 'ENDED' = 'VACANT';
      if (activeLeases.length > 0) {
        const hasTerminating = activeLeases.some(l => l.end_date && new Date(l.end_date) > new Date());
        tenancyStatus = hasTerminating ? 'TERMINATING' : 'ACTIVE';
      } else if (historicalLeases.length > 0) {
        tenancyStatus = 'ENDED';
      }

      // Calculate Investment KPIs using multi-lease sums
      const purchasePrice = property.purchase_price || property.market_value || 0;
      const annualRent = (totalMonthlyRent || unitData.current_monthly_rent || 0) * 12;
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

        // Block B: Address & Beschreibung
        street: property.address,
        houseNumber: (property as any).address_house_no,
        postalCode: property.postal_code || '',
        city: property.city,
        locationNotes: (property as any).location_notes,
        description: property.description,
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

        // Block E: Investment KPIs (uses multi-lease sums)
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

        // Block F: Tenancy (Primary lease for display, but sums reflect all active)
        leaseId: primaryLease?.id,
        tenantContactId: primaryLease?.tenant_contact_id,
        tenantName: primaryLease?.contacts 
          ? `${primaryLease.contacts.first_name} ${primaryLease.contacts.last_name}`.trim()
          : undefined,
        tenancyStatus,
        leaseType: (primaryLease?.lease_type as 'unbefristet' | 'befristet' | 'staffel' | 'index' | 'gewerbe') || 'unbefristet',
        startDate: primaryLease?.start_date,
        endDate: primaryLease?.end_date,
        // Use sums for rent values when multiple leases exist
        rentColdEur: totalMonthlyRent || unitData.current_monthly_rent,
        nkAdvanceEur: totalNkAdvance || unitData.ancillary_costs,
        heatingAdvanceEur: totalHeatingAdvance,
        rentWarmEur: (totalMonthlyRent || 0) + (totalNkAdvance || 0) + (totalHeatingAdvance || 0),
        paymentDueDay: primaryLease?.payment_due_day,
        depositAmountEur: primaryLease?.deposit_amount_eur,
        depositStatus: (primaryLease?.deposit_status as 'PAID' | 'OPEN' | 'PARTIAL') || 'OPEN',
        rentModel: (primaryLease?.rent_model as 'FIX' | 'INDEX' | 'STAFFEL') || 'FIX',
        nextRentAdjustmentDate: primaryLease?.next_rent_adjustment_earliest_date,

        // Multi-lease metadata (NEW)
        leasesCount: allLeases.length,
        activeLeasesCount: activeLeases.length,
        allLeases: sortedLeases,

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
        .maybeSingle();

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
