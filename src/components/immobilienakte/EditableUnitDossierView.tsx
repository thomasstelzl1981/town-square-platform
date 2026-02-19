import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Save, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DossierHeader } from './DossierHeader';
import { DocumentChecklist } from './DocumentChecklist';
import {
  EditableIdentityBlock,
  EditableAddressBlock,
  EditableBuildingBlock,
  TenancySummaryBlock,
  EditableFinancingBlock,
  EditableLegalBlock,
  EditableWEGBlock,
  EditableAfaBlock,
} from './editable';
import { useDossierForm } from '@/hooks/useDossierForm';
import { useSaveDossier } from '@/hooks/useDossierMutations';
import type { UnitDossierData } from '@/types/immobilienakte';

interface EditableUnitDossierViewProps {
  data: UnitDossierData;
}

export function EditableUnitDossierView({ data }: EditableUnitDossierViewProps) {
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const {
    data: formData,
    isDirty,
    updateField,
    reset,
    getPropertyChanges,
    getUnitChanges,
    getLeaseChanges,
    getLoanChanges,
    getAccountingChanges,
  } = useDossierForm(data);

  const saveDossier = useSaveDossier();

  const handleFieldChange = useCallback((field: string, value: any) => {
    updateField(field as keyof UnitDossierData, value);
    setSaveSuccess(false);
  }, [updateField]);

  const handleSave = async () => {
    if (!formData) return;

    const propertyData = getPropertyChanges();
    const unitData = getUnitChanges();
    const leaseData = getLeaseChanges();
    const loanData = getLoanChanges();
    const accountingData = getAccountingChanges();

    try {
      await saveDossier.mutateAsync({
        propertyId: formData.propertyId,
        unitId: formData.unitId,
        leaseId: formData.leaseId,
        loanId: formData.loanId,
        accountingId: formData.accountingId,
        propertyData: propertyData || undefined,
        unitData: unitData || undefined,
        leaseData: leaseData || undefined,
        loanData: loanData || undefined,
        accountingData: accountingData || undefined,
      });
      
      reset();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  if (!formData) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <p>Keine Daten verfügbar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative pb-20">
      {/* Header */}
      <DossierHeader
        unitCode={formData.unitCode}
        status={formData.status}
        asofDate={formData.asofDate}
        dataQuality={formData.dataQuality}
      />

      {/* Dirty/Success Indicator */}
      {isDirty && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Sie haben ungespeicherte Änderungen. Klicken Sie auf "Speichern", um diese zu übernehmen.
          </AlertDescription>
        </Alert>
      )}

      {saveSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Alle Änderungen wurden erfolgreich gespeichert.
          </AlertDescription>
        </Alert>
      )}

      {/* ROW 1: 2 compact tiles — Identity (with address) | Building */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EditableIdentityBlock
          unitCode={formData.unitCode}
          propertyType={formData.propertyType}
          status={formData.propertyStatus}
          saleEnabled={formData.saleEnabled}
          rentalManaged={formData.rentalManaged}
          reportingRegime={formData.reportingRegime}
          buildYear={formData.buildYear}
          wegFlag={formData.wegFlag}
          street={formData.street}
          houseNumber={formData.houseNumber}
          postalCode={formData.postalCode}
          city={formData.city}
          unitNumber={formData.unitNumber}
          onFieldChange={handleFieldChange}
        />

        <EditableBuildingBlock
          usageType={formData.usageType}
          areaLivingSqm={formData.areaLivingSqm}
          areaUsableSqm={formData.areaUsableSqm}
          roomsCount={formData.roomsCount}
          bathroomsCount={formData.bathroomsCount}
          floor={formData.floor}
          unitNumber={formData.unitNumber}
          heatingType={formData.heatingType}
          energySource={formData.energySource}
          energyCertType={formData.energyCertType}
          energyCertValue={formData.energyCertValue}
          energyCertValidUntil={formData.energyCertValidUntil}
          featuresTags={formData.featuresTags}
          onFieldChange={handleFieldChange}
        />
      </div>

      {/* ROW 2: 2 columns — Legal | AfA & Steuer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EditableLegalBlock
          landRegisterCourt={formData.landRegisterCourt}
          landRegisterOf={formData.landRegisterOf}
          landRegisterSheet={formData.landRegisterSheet}
          landRegisterVolume={formData.landRegisterVolume}
          parcelNumber={formData.parcelNumber}
          teNumber={formData.teNumber}
          purchaseDate={formData.purchaseDate}
          purchasePrice={formData.purchasePrice}
          marketValue={formData.marketValue}
          acquisitionCosts={formData.acquisitionCosts}
          onFieldChange={handleFieldChange}
        />

        <EditableAfaBlock
          akGround={formData.akGround}
          akBuilding={formData.akBuilding}
          akAncillary={formData.akAncillary}
          landSharePercent={formData.landSharePercent}
          buildingSharePercent={formData.buildingSharePercent}
          afaModel={formData.afaModel}
          afaRatePercent={formData.afaRatePercent}
          afaStartDate={formData.afaStartDate}
          afaMethod={formData.afaMethod}
          remainingUsefulLifeYears={formData.remainingUsefulLifeYears}
          bookValueEur={formData.bookValueEur}
          bookValueDate={formData.bookValueDate}
          cumulativeAfa={formData.cumulativeAfa}
          sonderAfaAnnual={formData.sonderAfaAnnual}
          denkmalAfaAnnual={formData.denkmalAfaAnnual}
          modernizationCostsEur={formData.modernizationCostsEur}
          modernizationYear={formData.modernizationYear}
          onFieldChange={handleFieldChange}
        />
      </div>

      {/* ROW 3: 2 columns — Financing | WEG */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EditableFinancingBlock
          bankName={formData.bankName}
          loanNumber={formData.loanNumber}
          originalAmountEur={formData.originalAmountEur}
          outstandingBalanceEur={formData.outstandingBalanceEur}
          outstandingBalanceAsof={formData.outstandingBalanceAsof}
          interestRatePercent={formData.interestRatePercent}
          fixedInterestEndDate={formData.fixedInterestEndDate}
          annuityMonthlyEur={formData.annuityMonthlyEur}
          repaymentRatePercent={formData.repaymentRatePercent}
          specialRepaymentRight={formData.specialRepaymentRight}
          contactPerson={formData.loanContactPerson}
          onFieldChange={handleFieldChange}
        />
      </div>

      {/* ROW 3: 2 columns — Tenancy | WEG */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TenancySummaryBlock
          tenancyStatus={formData.tenancyStatus}
          activeLeasesCount={formData.activeLeasesCount || (formData.tenancyStatus === 'ACTIVE' ? 1 : 0)}
          totalRentWarmEur={
            (formData.rentColdEur || 0) + 
            (formData.nkAdvanceEur || 0) + 
            (formData.heatingAdvanceEur || 0)
          }
          tenantName={formData.tenantName}
          tenantSince={formData.startDate}
        />

        <EditableWEGBlock
          wegFlag={formData.wegFlag}
          meaShare={formData.meaShare}
          meaTotal={formData.meaTotal}
          hausgeldMonthlyEur={formData.hausgeldMonthlyEur}
          allocationKeyDefault={formData.allocationKeyDefault}
          periodCurrent={formData.periodCurrent}
          lastSettlementDate={formData.lastSettlementDate}
          lastSettlementBalanceEur={formData.lastSettlementBalanceEur}
          allocatablePaEur={formData.allocatablePaEur}
          nonAllocatablePaEur={formData.nonAllocatablePaEur}
          onFieldChange={handleFieldChange}
        />
      </div>

      {/* ROW 4: 2 columns — Lage & Beschreibung | Dokumente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EditableAddressBlock
          street={formData.street}
          houseNumber={formData.houseNumber}
          postalCode={formData.postalCode}
          city={formData.city}
          locationLabel={formData.locationLabel}
          description={formData.description}
          propertyType={formData.propertyType}
          buildYear={formData.buildYear}
          totalAreaSqm={formData.areaLivingSqm}
          heatingType={formData.heatingType}
          energySource={formData.energySource}
          onFieldChange={handleFieldChange}
        />

        <DocumentChecklist documents={formData.documents} />
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-4 z-50">
        <div className="container mx-auto flex items-center justify-between max-w-7xl">
          <div className="text-sm text-muted-foreground">
            {isDirty ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Ungespeicherte Änderungen
              </span>
            ) : saveSuccess ? (
              <span className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Gespeichert
              </span>
            ) : (
              <span>Immobilienakte (SSOT)</span>
            )}
          </div>
          <div className="flex gap-2">
            {isDirty && (
              <Button variant="ghost" onClick={reset}>
                Verwerfen
              </Button>
            )}
            <Button 
              onClick={handleSave} 
              disabled={!isDirty || saveDossier.isPending}
            >
              {saveDossier.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Speichern
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
