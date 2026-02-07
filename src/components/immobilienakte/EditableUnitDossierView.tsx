import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Save, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DossierHeader } from './DossierHeader';
import { InvestmentKPIBlock } from './InvestmentKPIBlock';
import { DocumentChecklist } from './DocumentChecklist';
import {
  EditableIdentityBlock,
  EditableAddressBlock,
  EditableBuildingBlock,
  TenancySummaryBlock,
  EditableFinancingBlock,
  EditableLegalBlock,
  EditableWEGBlock,
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
    <div className="space-y-6 relative pb-20">
      {/* Header */}
      <DossierHeader
        unitCode={formData.unitCode}
        address={formData.address}
        locationLabel={formData.locationLabel}
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

      {/* Main Grid: Left (Core Blocks) + Right (KPIs & Docs) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Editable Blocks */}
        <div className="lg:col-span-2 space-y-4">
          {/* Block A: Identity */}
          <EditableIdentityBlock
            unitCode={formData.unitCode}
            propertyType={formData.propertyType}
            status={formData.propertyStatus}
            saleEnabled={formData.saleEnabled}
            rentalManaged={formData.rentalManaged}
            reportingRegime={formData.reportingRegime}
            buildYear={formData.buildYear}
            wegFlag={formData.wegFlag}
            onFieldChange={handleFieldChange}
          />

          {/* Block B: Lage & Beschreibung */}
          <EditableAddressBlock
            street={formData.street}
            houseNumber={formData.houseNumber}
            postalCode={formData.postalCode}
            city={formData.city}
            locationLabel={formData.locationLabel}
            description={formData.description}
            latitude={formData.latitude}
            longitude={formData.longitude}
            propertyType={formData.propertyType}
            buildYear={formData.buildYear}
            totalAreaSqm={formData.areaLivingSqm}
            heatingType={formData.heatingType}
            energySource={formData.energySource}
            onFieldChange={handleFieldChange}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Block C: Building */}
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

            {/* Block D: Legal */}
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Block F: Tenancy Summary */}
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

            {/* Block G: WEG/NK */}
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

          {/* Block H: Financing */}
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

        {/* Right Column: KPIs & Documents (Read-only) */}
        <div className="space-y-4">
          {/* Block E: Investment KPIs */}
          <InvestmentKPIBlock
            purchasePriceEur={formData.purchasePriceEur}
            purchaseCostsEur={formData.purchaseCostsEur}
            valuationEur={formData.valuationEur}
            netColdRentPaEur={formData.netColdRentPaEur}
            nonAllocCostsPaEur={formData.nonAllocCostsPaEur}
            cashflowPreTaxMonthlyEur={formData.cashflowPreTaxMonthlyEur}
            grossYieldPercent={formData.grossYieldPercent}
            netYieldPercent={formData.netYieldPercent}
          />

          {/* Block J: Documents */}
          <DocumentChecklist documents={formData.documents} />

          {/* Multi-Lease Info if applicable */}
          {(formData as any).leasesCount > 1 && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    Diese Einheit hat {(formData as any).leasesCount} aktive Mietverträge.
                    Die angezeigten Werte sind Summen aller Verträge.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
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
