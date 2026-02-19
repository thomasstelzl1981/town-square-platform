import { useState, useCallback, useMemo } from 'react';
import type { UnitDossierData, PropertyFormData, UnitFormData, LeaseFormData, LoanFormData, AccountingFormData } from '@/types/immobilienakte';

/**
 * Hook to manage the editable state of a dossier form
 * Tracks changes per block and provides dirty tracking
 */
export function useDossierForm(initialData: UnitDossierData | null) {
  // Track which fields have been modified
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  
  // Local form state (initialized from dossier data)
  const [formState, setFormState] = useState<Partial<UnitDossierData>>({});

  // Compute merged data (initial + local changes)
  const mergedData = useMemo(() => {
    if (!initialData) return null;
    return { ...initialData, ...formState };
  }, [initialData, formState]);

  // Update a single field
  const updateField = useCallback(<K extends keyof UnitDossierData>(
    field: K, 
    value: UnitDossierData[K]
  ) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    setDirtyFields(prev => new Set(prev).add(field));
  }, []);

  // Update multiple fields at once
  const updateFields = useCallback((updates: Partial<UnitDossierData>) => {
    setFormState(prev => ({ ...prev, ...updates }));
    setDirtyFields(prev => {
      const newSet = new Set(prev);
      Object.keys(updates).forEach(key => newSet.add(key));
      return newSet;
    });
  }, []);

  // Reset form to initial state
  const reset = useCallback(() => {
    setFormState({});
    setDirtyFields(new Set());
  }, []);

  // Check if form has unsaved changes
  const isDirty = dirtyFields.size > 0;

  // Extract property-specific changes for mutation
  const getPropertyChanges = useCallback((): Partial<PropertyFormData> | null => {
    if (!mergedData || dirtyFields.size === 0) return null;
    
    const propertyFields = [
      'propertyType', 'category', 'propertyStatus', 'saleEnabled', 'rentalManaged',
      'vermieterKontextId', 'reportingRegime', 'street', 'houseNumber', 'postalCode',
      'city', 'locationLabel', 'locationNotes', 'description', 'latitude', 'longitude', 'buildYear',
      'usageType', 'heatingType', 'energySource', 'landRegisterCourt', 'landRegisterSheet',
      'landRegisterVolume', 'parcelNumber', 'teNumber', 'purchaseDate', 'purchasePrice',
      'marketValue', 'acquisitionCosts', 'wegFlag', 'meaTotal', 'allocationKeyDefault'
    ];
    
    const changes: Partial<PropertyFormData> = {};
    let hasChanges = false;
    
    propertyFields.forEach(field => {
      if (dirtyFields.has(field)) {
        (changes as any)[field] = (mergedData as any)[field];
        hasChanges = true;
      }
    });
    
    // Map to DB field names
    if (hasChanges) {
      const mapped: Partial<PropertyFormData> = {};
      if (changes.propertyType !== undefined) mapped.propertyType = changes.propertyType;
      if (changes.category !== undefined) mapped.category = changes.category as any;
      if ((changes as any).propertyStatus !== undefined) mapped.status = (changes as any).propertyStatus;
      if (changes.saleEnabled !== undefined) mapped.saleEnabled = changes.saleEnabled;
      if (changes.rentalManaged !== undefined) mapped.rentalManaged = changes.rentalManaged;
      if ((changes as any).vermieterKontextId !== undefined) mapped.landlordContextId = (changes as any).vermieterKontextId;
      if (changes.reportingRegime !== undefined) mapped.reportingRegime = changes.reportingRegime as any;
      if ((changes as any).street !== undefined) mapped.address = (changes as any).street;
      if ((changes as any).houseNumber !== undefined) mapped.addressHouseNo = (changes as any).houseNumber;
      if (changes.postalCode !== undefined) mapped.postalCode = changes.postalCode;
      if (changes.city !== undefined) mapped.city = changes.city;
      if (changes.locationLabel !== undefined) mapped.locationLabel = changes.locationLabel;
      if (changes.locationNotes !== undefined) mapped.locationNotes = changes.locationNotes;
      if ((changes as any).description !== undefined) (mapped as any).description = (changes as any).description;
      if (changes.latitude !== undefined) mapped.latitude = changes.latitude;
      if (changes.longitude !== undefined) mapped.longitude = changes.longitude;
      if ((changes as any).buildYear !== undefined) mapped.yearBuilt = (changes as any).buildYear;
      if (changes.usageType !== undefined) mapped.usageType = changes.usageType;
      if (changes.heatingType !== undefined) mapped.heatingType = changes.heatingType;
      if (changes.energySource !== undefined) mapped.energySource = changes.energySource;
      if (changes.landRegisterCourt !== undefined) mapped.landRegisterCourt = changes.landRegisterCourt;
      if (changes.landRegisterSheet !== undefined) mapped.landRegisterSheet = changes.landRegisterSheet;
      if (changes.landRegisterVolume !== undefined) mapped.landRegisterVolume = changes.landRegisterVolume;
      if (changes.parcelNumber !== undefined) mapped.parcelNumber = changes.parcelNumber;
      if (changes.teNumber !== undefined) mapped.teNumber = changes.teNumber;
      if ((changes as any).purchaseDate !== undefined) mapped.notaryDate = (changes as any).purchaseDate;
      if (changes.purchasePrice !== undefined) mapped.purchasePrice = changes.purchasePrice;
      if (changes.marketValue !== undefined) mapped.marketValue = changes.marketValue;
      if (changes.acquisitionCosts !== undefined) mapped.acquisitionCosts = changes.acquisitionCosts;
      if (changes.wegFlag !== undefined) mapped.wegFlag = changes.wegFlag;
      if (changes.meaTotal !== undefined) mapped.meaTotal = changes.meaTotal;
      if ((changes as any).allocationKeyDefault !== undefined) mapped.allocationKey = (changes as any).allocationKeyDefault;
      return mapped;
    }
    
    return null;
  }, [mergedData, dirtyFields]);

  // Extract unit-specific changes for mutation
  const getUnitChanges = useCallback((): Partial<UnitFormData> | null => {
    if (!mergedData || dirtyFields.size === 0) return null;
    
    const unitFields = [
      'unitNumber', 'areaLivingSqm', 'areaUsableSqm', 'roomsCount', 'bathroomsCount',
      'floor', 'featuresTags', 'meaShare', 'hausgeldMonthlyEur', 'vacancyDays',
      'energyCertValue', 'energyCertValidUntil'
    ];
    
    const changes: Partial<UnitFormData> = {};
    let hasChanges = false;
    
    unitFields.forEach(field => {
      if (dirtyFields.has(field)) {
        hasChanges = true;
        if (field === 'areaLivingSqm') changes.areaSqm = (mergedData as any).areaLivingSqm;
        else if (field === 'roomsCount') changes.rooms = (mergedData as any).roomsCount;
        else if (field === 'hausgeldMonthlyEur') changes.hausgeldMonthly = (mergedData as any).hausgeldMonthlyEur;
        else if (field === 'energyCertValue') changes.energyCertificateValue = (mergedData as any).energyCertValue;
        else if (field === 'energyCertValidUntil') changes.energyCertificateValidUntil = (mergedData as any).energyCertValidUntil;
        else (changes as any)[field] = (mergedData as any)[field];
      }
    });
    
    return hasChanges ? changes : null;
  }, [mergedData, dirtyFields]);

  // Extract lease-specific changes for mutation
  const getLeaseChanges = useCallback((): LeaseFormData | null => {
    if (!mergedData || !mergedData.unitId) return null;
    
    const leaseFields = [
      'tenantContactId', 'leaseType', 'startDate', 'endDate', 'rentColdEur',
      'nkAdvanceEur', 'heatingAdvanceEur', 'depositAmountEur', 'depositStatus',
      'paymentDueDay', 'rentModel', 'nextRentAdjustmentDate'
    ];
    
    const hasLeaseChanges = leaseFields.some(f => dirtyFields.has(f));
    if (!hasLeaseChanges) return null;
    
    return {
      tenantContactId: mergedData.tenantContactId || '',
      unitId: mergedData.unitId,
      startDate: mergedData.startDate || new Date().toISOString().split('T')[0],
      endDate: mergedData.endDate,
      leaseType: mergedData.leaseType,
      rentColdEur: mergedData.rentColdEur || 0,
      nkAdvanceEur: mergedData.nkAdvanceEur,
      heatingAdvanceEur: mergedData.heatingAdvanceEur,
      depositAmountEur: mergedData.depositAmountEur,
      depositStatus: mergedData.depositStatus,
      paymentDueDay: mergedData.paymentDueDay,
      rentModel: mergedData.rentModel,
      nextRentAdjustmentEarliestDate: mergedData.nextRentAdjustmentDate,
    };
  }, [mergedData, dirtyFields]);

  // Extract loan-specific changes for mutation
  const getLoanChanges = useCallback((): LoanFormData | null => {
    if (!mergedData) return null;
    
    const loanFields = [
      'bankName', 'loanNumber', 'originalAmountEur', 'outstandingBalanceEur',
      'outstandingBalanceAsof', 'interestRatePercent', 'fixedInterestEndDate',
      'annuityMonthlyEur', 'repaymentRatePercent'
    ];
    
    const hasLoanChanges = loanFields.some(f => dirtyFields.has(f));
    if (!hasLoanChanges) return null;
    
    return {
      bankName: mergedData.bankName || '',
      loanNumber: mergedData.loanNumber || '',
      originalAmount: mergedData.originalAmountEur,
      outstandingBalanceEur: mergedData.outstandingBalanceEur,
      outstandingBalanceAsof: mergedData.outstandingBalanceAsof,
      interestRatePercent: mergedData.interestRatePercent,
      fixedInterestEndDate: mergedData.fixedInterestEndDate,
      annuityMonthlyEur: mergedData.annuityMonthlyEur,
      repaymentRatePercent: mergedData.repaymentRatePercent,
      propertyId: mergedData.propertyId,
      unitId: mergedData.unitId,
    };
  }, [mergedData, dirtyFields]);

  // Extract accounting-specific changes for mutation
  const getAccountingChanges = useCallback((): AccountingFormData | null => {
    if (!mergedData) return null;
    
    const accountingFields = [
      'landSharePercent', 'buildingSharePercent', 'bookValueEur', 'afaRatePercent',
      'afaStartDate', 'afaMethod', 'remainingUsefulLifeYears', 'modernizationCostsEur',
      'modernizationYear', 'coaVersion', 'accountMappings',
      'afaModel', 'akGround', 'akBuilding', 'akAncillary', 'bookValueDate',
      'cumulativeAfa', 'sonderAfaAnnual', 'denkmalAfaAnnual'
    ];
    
    const hasAccountingChanges = accountingFields.some(f => dirtyFields.has(f));
    if (!hasAccountingChanges) return null;
    
    return {
      propertyId: mergedData.propertyId,
      landSharePercent: mergedData.landSharePercent,
      buildingSharePercent: mergedData.buildingSharePercent,
      bookValueEur: mergedData.bookValueEur,
      afaRatePercent: mergedData.afaRatePercent,
      afaStartDate: mergedData.afaStartDate,
      afaMethod: mergedData.afaMethod,
      remainingUsefulLifeYears: mergedData.remainingUsefulLifeYears,
      modernizationCostsEur: mergedData.modernizationCostsEur,
      modernizationYear: mergedData.modernizationYear,
      coaVersion: mergedData.coaVersion,
      accountMappings: mergedData.accountMappings,
      afaModel: mergedData.afaModel,
      akGround: mergedData.akGround,
      akBuilding: mergedData.akBuilding,
      akAncillary: mergedData.akAncillary,
      bookValueDate: mergedData.bookValueDate,
      cumulativeAfa: mergedData.cumulativeAfa,
      sonderAfaAnnual: mergedData.sonderAfaAnnual,
      denkmalAfaAnnual: mergedData.denkmalAfaAnnual,
    };
  }, [mergedData, dirtyFields]);

  return {
    data: mergedData,
    isDirty,
    dirtyFields,
    updateField,
    updateFields,
    reset,
    getPropertyChanges,
    getUnitChanges,
    getLeaseChanges,
    getLoanChanges,
    getAccountingChanges,
  };
}
