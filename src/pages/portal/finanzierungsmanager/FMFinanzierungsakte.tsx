/**
 * FM Finanzierungsakte — Empty fillable form for creating a new finance case
 * Orchestrator: delegates Kaufy search to AkteKaufySearch sub-component
 */
import * as React from 'react';
import { useState, useRef, useCallback } from 'react';
import type { CalcData } from '@/components/finanzierung/FinanceCalculatorCard';
import HouseholdCalculationCard from '@/components/finanzierung/HouseholdCalculationCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { User, Save, Banknote, LayoutList, LayoutPanelLeft, Plus } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { AkteKaufySearch } from '@/components/finanzierungsmanager/akte';
import FinanceOfferCard from '@/components/finanzierung/FinanceOfferCard';
import AmortizationScheduleCard from '@/components/finanzierung/AmortizationScheduleCard';
import { toast } from 'sonner';
import FinanceCalculatorCard from '@/components/finanzierung/FinanceCalculatorCard';
import {
  PersonSection, EmploymentSection, BankSection, IncomeSection,
  ExpensesSection, AssetsSection, DualHeader, SectionHeaderRow,
  createEmptyApplicantFormData,
  type ApplicantFormData,
} from '@/components/finanzierung/ApplicantPersonFields';
import { Table, TableBody } from '@/components/ui/table';
import FinanceObjectCard, { type ObjectFormData, type FinanceObjectCardHandle } from '@/components/finanzierung/FinanceObjectCard';
import FinanceRequestCard, { type FinanceRequestCardHandle } from '@/components/finanzierung/FinanceRequestCard';
import PropertyAssetsCard, { type PropertyAsset } from '@/components/finanzierung/PropertyAssetsCard';
import GenerateCaseCard from '@/components/finanzierung/GenerateCaseCard';
import { FinanceConsentBlock } from '@/components/finanzierung/FinanceConsentBlock';
import MagicIntakeCard, { type MagicIntakeResult } from '@/components/finanzierung/MagicIntakeCard';

/** Simple label-value row for the top summary */
function TR({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <TableRow>
      <TableCell className="text-xs text-muted-foreground py-1.5 px-3 w-[180px] border-r">{label}</TableCell>
      <TableCell className="text-sm py-1.5 px-3">{children}</TableCell>
    </TableRow>
  );
}

export default function FMFinanzierungsakte() {
  const [consentData, setConsentData] = useState(false);
  const [consentCommission, setConsentCommission] = useState(false);
  const [consentDsgvo, setConsentDsgvo] = useState(false);

  const [formData, setFormData] = useState<ApplicantFormData>(createEmptyApplicantFormData());
  const [coFormData, setCoFormData] = useState<ApplicantFormData>(createEmptyApplicantFormData());
  const handleChange = (field: string, value: unknown) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleCoChange = (field: string, value: unknown) => setCoFormData(prev => ({ ...prev, [field]: value }));
  const dualProps = { formData, coFormData, onChange: handleChange, onCoChange: handleCoChange, readOnly: false };

  const [externalObjectData, setExternalObjectData] = useState<Partial<ObjectFormData> | undefined>();
  const [externalPurchasePrice, setExternalPurchasePrice] = useState<string | undefined>();
  const [calculatorBedarf, setCalculatorBedarf] = useState(0);
  const [calculatorPurchasePrice, setCalculatorPurchasePrice] = useState(0);
  const [calcData, setCalcData] = useState<CalcData | null>(null);
  const [showAmortization, setShowAmortization] = useState(false);
  const [eckdatenUsage, setEckdatenUsage] = useState('');
  const [eckdatenRentalIncome, setEckdatenRentalIncome] = useState(0);
  const [propertyAssets, setPropertyAssets] = useState<PropertyAsset[]>([]);
  const [magicIntakeResult, setMagicIntakeResult] = useState<MagicIntakeResult | null>(null);
  const [splitView, setSplitView] = useState(false);

  const objectCardRef = useRef<FinanceObjectCardHandle>(null);
  const requestCardRef = useRef<FinanceRequestCardHandle>(null);
  const generateCaseRef = useRef<HTMLDivElement>(null);

  const handleKaufyAdopt = useCallback((objData: Partial<ObjectFormData>, price: string) => {
    setExternalObjectData(objData);
    setExternalPurchasePrice(price);
  }, []);

  const handleCalculate = (bedarf: number) => {
    setCalculatorBedarf(bedarf);
    setCalculatorPurchasePrice(Number(externalPurchasePrice) || 0);
  };

  const handleTransferToApplication = React.useCallback(() => { toast.success('Eckdaten wurden in den Finanzierungsantrag übernommen'); }, []);

  const handleMagicIntakeCreated = (result: MagicIntakeResult) => {
    setMagicIntakeResult(result);
    setFormData(prev => ({ ...prev, first_name: result.firstName, last_name: result.lastName, email: result.email }));
  };

  const handleFloatingSave = () => { objectCardRef.current?.save(); requestCardRef.current?.save(); toast.success('Daten zwischengespeichert'); };

  const handlePropertyAssetsChange = (updated: PropertyAsset[]) => {
    setPropertyAssets(updated);
    const totalRent = updated.reduce((s, p) => s + (p.net_rent_monthly || 0), 0);
    if (formData.has_rental_properties) handleChange('rental_income_monthly', totalRent > 0 ? totalRent : null);
  };

  const objectData = { address: externalObjectData?.city ?? undefined, type: externalObjectData?.objectType, livingArea: externalObjectData?.livingArea, yearBuilt: externalObjectData?.yearBuilt, purchasePrice: externalPurchasePrice ? Number(externalPurchasePrice) : undefined };
  const financeData = { loanAmount: calculatorBedarf || undefined, equityAmount: undefined, purpose: eckdatenUsage || 'kauf' };

  // ── Shared blocks ──
  const renderIntakeRow = () => (
    <div className="grid grid-cols-1 gap-4">
      <MagicIntakeCard onCaseCreated={handleMagicIntakeCreated} />
      <AkteKaufySearch onAdopt={handleKaufyAdopt} />
    </div>
  );

  const renderGenerateCase = (withInitial: boolean) => (
    <div ref={generateCaseRef}>
      <GenerateCaseCard formData={formData} coFormData={coFormData} propertyAssets={propertyAssets} objectData={objectData} financeData={financeData}
        {...(withInitial && magicIntakeResult ? { initialCreatedState: { requestId: magicIntakeResult.requestId, publicId: magicIntakeResult.publicId } } : {})}
      />
    </div>
  );

  const renderFinanceCards = () => (
    <>
      <FinanceRequestCard ref={requestCardRef} storageKey="mod11-akte" externalPurchasePrice={externalPurchasePrice} showCalculator onCalculate={handleCalculate} hideFooter showObjectFields title="Eckdaten" onDataChange={({ usage, rentalIncome }) => { setEckdatenUsage(usage); setEckdatenRentalIncome(rentalIncome); }} />
      <FinanceCalculatorCard finanzierungsbedarf={calculatorBedarf} purchasePrice={calculatorPurchasePrice} onCalcUpdate={setCalcData} />
      <FinanceOfferCard calcData={calcData} onTransferToApplication={handleTransferToApplication} onShowAmortization={() => setShowAmortization(prev => !prev)} showAmortizationActive={showAmortization} />
      {showAmortization && calcData && calcData.loanAmount > 0 && calcData.interestRate > 0 && <AmortizationScheduleCard calcData={calcData} />}
    </>
  );

  const renderSelbstauskunft = () => (
    <>
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2.5 border-b bg-muted/20"><h3 className="text-base font-semibold flex items-center gap-2"><User className="h-4 w-4" /> Selbstauskunft</h3><p className="text-xs text-muted-foreground mt-0.5">Persönliche Daten, Beschäftigung und Bankverbindung der Antragsteller</p></div>
          <div className="p-4 space-y-0 overflow-x-auto"><div className="min-w-[600px]"><Table><DualHeader /><TableBody /></Table><PersonSection {...dualProps} hideHeader /><EmploymentSection {...dualProps} hideHeader /><BankSection {...dualProps} hideHeader /></div></div>
        </CardContent>
      </Card>
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2.5 border-b bg-muted/20"><h3 className="text-base font-semibold flex items-center gap-2"><Banknote className="h-4 w-4" /> Einnahmen, Ausgaben & Vermögen</h3><p className="text-xs text-muted-foreground mt-0.5">Monatliche Einnahmen/Ausgaben und Vermögenswerte der Antragsteller</p></div>
          <div className="p-4 space-y-0 overflow-x-auto"><div className="min-w-[600px]"><Table><DualHeader /><TableBody /></Table><IncomeSection {...dualProps} hideHeader /><ExpensesSection {...dualProps} hideHeader /><div className="pt-4"><Table><TableBody><SectionHeaderRow title="Vermögen und Verbindlichkeiten" /></TableBody></Table></div><AssetsSection {...dualProps} hideHeader /></div></div>
        </CardContent>
      </Card>
      {(formData.has_rental_properties || coFormData.has_rental_properties) && <PropertyAssetsCard properties={propertyAssets} onChange={handlePropertyAssetsChange} />}
    </>
  );

  const renderConsent = () => (
    <>
      <FinanceConsentBlock consentData={consentData} consentCommission={consentCommission} consentDsgvo={consentDsgvo} onConsentDataChange={setConsentData} onConsentCommissionChange={setConsentCommission} onConsentDsgvoChange={setConsentDsgvo} />
      {renderGenerateCase(false)}
    </>
  );

  return (
    <PageShell fullWidth={splitView}>
      <ModulePageHeader
        title="Finanzierungsakte"
        description="Neue Akte manuell befüllen und erstellen"
        actions={
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1 border rounded-lg p-0.5">
              <Button variant={!splitView ? 'default' : 'ghost'} size="sm" className="h-7 gap-1.5 text-xs rounded-md" onClick={() => setSplitView(false)}><LayoutList className="h-3.5 w-3.5" /> Standard</Button>
              <Button variant={splitView ? 'default' : 'ghost'} size="sm" className="h-7 gap-1.5 text-xs rounded-md" onClick={() => setSplitView(true)}><LayoutPanelLeft className="h-3.5 w-3.5" /> Split-View</Button>
            </div>
            <Button variant="glass" size="icon-round" onClick={() => { setFormData(createEmptyApplicantFormData()); setCoFormData(createEmptyApplicantFormData()); setMagicIntakeResult(null); toast.success('Neue leere Akte erstellt'); }}><Plus className="h-4 w-4" /></Button>
          </div>
        }
      />

      {splitView ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: 'calc(100vh - 220px)' }}>
          <div className="overflow-y-auto pr-2 space-y-4">
            {renderIntakeRow()}
            {magicIntakeResult && renderGenerateCase(true)}
            {renderFinanceCards()}
            <HouseholdCalculationCard formData={formData} coFormData={coFormData} calcData={calcData} usage={eckdatenUsage} rentalIncome={eckdatenRentalIncome} livingArea={Number(externalObjectData?.livingArea) || 0} propertyAssets={propertyAssets} />
            {!magicIntakeResult && renderConsent()}
          </div>
          <div className="overflow-y-auto pr-2 space-y-4">{renderSelbstauskunft()}</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MagicIntakeCard onCaseCreated={handleMagicIntakeCreated} />
            <AkteKaufySearch onAdopt={handleKaufyAdopt} />
          </div>
          {magicIntakeResult && renderGenerateCase(true)}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FinanceRequestCard ref={requestCardRef} storageKey="mod11-akte" externalPurchasePrice={externalPurchasePrice} showCalculator onCalculate={handleCalculate} hideFooter showObjectFields title="Eckdaten" onDataChange={({ usage, rentalIncome }) => { setEckdatenUsage(usage); setEckdatenRentalIncome(rentalIncome); }} />
            <FinanceCalculatorCard finanzierungsbedarf={calculatorBedarf} purchasePrice={calculatorPurchasePrice} onCalcUpdate={setCalcData} />
          </div>
          <FinanceOfferCard calcData={calcData} onTransferToApplication={handleTransferToApplication} onShowAmortization={() => setShowAmortization(prev => !prev)} showAmortizationActive={showAmortization} />
          {showAmortization && calcData && calcData.loanAmount > 0 && calcData.interestRate > 0 && <AmortizationScheduleCard calcData={calcData} />}
          <div><h2 className="text-2xl font-bold tracking-tight uppercase">Finanzierungsantrag</h2><p className="text-sm text-muted-foreground mt-1">Detaillierte Angaben für die Bankeinreichung</p></div>
          {renderSelbstauskunft()}
          <div><h2 className="text-2xl font-bold tracking-tight uppercase">Finanzierungsobjekt</h2><p className="text-sm text-muted-foreground mt-1">Hier erfassen Sie Ihr Finanzierungsobjekt.</p></div>
          <FinanceObjectCard ref={objectCardRef} storageKey="mod11-akte" externalData={externalObjectData} hideFooter />
          <div><h2 className="text-2xl font-bold tracking-tight uppercase">Kapitaldienstfähigkeit</h2><p className="text-sm text-muted-foreground mt-1">Simulation der monatlichen Einnahmen und Ausgaben nach Abschluss der neuen Finanzierung</p></div>
          <HouseholdCalculationCard formData={formData} coFormData={coFormData} calcData={calcData} usage={eckdatenUsage} rentalIncome={eckdatenRentalIncome} livingArea={Number(externalObjectData?.livingArea) || 0} propertyAssets={propertyAssets} />
          {!magicIntakeResult && renderConsent()}
        </>
      )}

      <div className="h-20" />
      <Button onClick={handleFloatingSave} variant="glass" className="fixed bottom-6 right-6 z-50 shadow-lg gap-2"><Save className="h-4 w-4" /> Zwischenspeichern</Button>
    </PageShell>
  );
}
