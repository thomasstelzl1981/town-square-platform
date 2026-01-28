import { DossierHeader } from './DossierHeader';
import { IdentityBlock } from './IdentityBlock';
import { CoreDataBlock } from './CoreDataBlock';
import { TenancyBlock } from './TenancyBlock';
import { NKWEGBlock } from './NKWEGBlock';
import { InvestmentKPIBlock } from './InvestmentKPIBlock';
import { FinancingBlock } from './FinancingBlock';
import { LegalBlock } from './LegalBlock';
import { DocumentChecklist } from './DocumentChecklist';

interface UnitDossierData {
  // Header
  unitCode: string;
  address: string;
  locationLabel?: string;
  status: 'VERMIETET' | 'LEERSTAND' | 'IN_NEUVERMIETUNG';
  asofDate?: string;
  dataQuality: 'OK' | 'PRUEFEN';
  
  // Identity
  propertyType?: string;
  buildYear?: number;
  wegFlag?: boolean;
  meaOrTeNo?: string;
  
  // Core Data
  areaLivingSqm: number;
  roomsCount?: number;
  bathroomsCount?: number;
  heatingType?: string;
  energySource?: string;
  energyCertificateValue?: number;
  energyCertificateValidUntil?: string;
  featuresTags?: string[];
  
  // Tenancy
  tenancyStatus: 'ACTIVE' | 'VACANT' | 'TERMINATING' | 'ENDED';
  startDate?: string;
  rentColdEur?: number;
  nkAdvanceEur?: number;
  heatingAdvanceEur?: number;
  rentWarmEur?: number;
  paymentDueDay?: number;
  depositAmountEur?: number;
  depositStatus?: 'PAID' | 'OPEN' | 'PARTIAL';
  rentModel?: 'FIX' | 'INDEX' | 'STAFFEL';
  nextRentAdjustmentDate?: string;
  
  // NK/WEG
  periodCurrent?: string;
  allocationKeyDefault?: 'SQM' | 'PERSONS' | 'MEA' | 'CONSUMPTION' | 'UNITS';
  lastSettlementDate?: string;
  lastSettlementBalanceEur?: number;
  hausgeldMonthlyEur?: number;
  allocatablePaEur?: number;
  nonAllocatablePaEur?: number;
  topCostBlocks?: Record<string, number>;
  
  // Investment
  purchasePriceEur?: number;
  purchaseCostsEur?: number;
  valuationEur?: number;
  netColdRentPaEur?: number;
  nonAllocCostsPaEur?: number;
  cashflowPreTaxMonthlyEur?: number;
  grossYieldPercent?: number;
  netYieldPercent?: number;
  
  // Financing
  bankName?: string;
  loanNumber?: string;
  outstandingBalanceEur?: number;
  outstandingBalanceAsof?: string;
  interestRatePercent?: number;
  fixedInterestEndDate?: string;
  annuityMonthlyEur?: number;
  specialRepaymentRight?: { enabled: boolean; amountEur?: number };
  contactPerson?: { name?: string; phone?: string; email?: string };
  
  // Legal
  landRegisterShort?: string;
  managerContact?: { name?: string; phone?: string; email?: string };
  
  // Documents
  documents?: Array<{
    docType: string;
    label: string;
    status: 'complete' | 'missing' | 'review';
    path?: string;
  }>;
}

interface UnitDossierViewProps {
  data: UnitDossierData;
}

export function UnitDossierView({ data }: UnitDossierViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <DossierHeader
        unitCode={data.unitCode}
        address={data.address}
        locationLabel={data.locationLabel}
        status={data.status}
        asofDate={data.asofDate}
        dataQuality={data.dataQuality}
      />

      {/* Main Grid: Left (Core) + Right (KPIs & Docs) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Core Data */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IdentityBlock
              unitCode={data.unitCode}
              propertyType={data.propertyType}
              buildYear={data.buildYear}
              wegFlag={data.wegFlag}
              meaOrTeNo={data.meaOrTeNo}
            />
            <CoreDataBlock
              areaLivingSqm={data.areaLivingSqm}
              roomsCount={data.roomsCount}
              bathroomsCount={data.bathroomsCount}
              heatingType={data.heatingType}
              energySource={data.energySource}
              energyCertificateValue={data.energyCertificateValue}
              energyCertificateValidUntil={data.energyCertificateValidUntil}
              featuresTags={data.featuresTags}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TenancyBlock
              status={data.tenancyStatus}
              startDate={data.startDate}
              rentColdEur={data.rentColdEur}
              nkAdvanceEur={data.nkAdvanceEur}
              heatingAdvanceEur={data.heatingAdvanceEur}
              rentWarmEur={data.rentWarmEur}
              paymentDueDay={data.paymentDueDay}
              depositAmountEur={data.depositAmountEur}
              depositStatus={data.depositStatus}
              rentModel={data.rentModel}
              nextRentAdjustmentDate={data.nextRentAdjustmentDate}
            />
            <NKWEGBlock
              periodCurrent={data.periodCurrent}
              allocationKeyDefault={data.allocationKeyDefault}
              lastSettlementDate={data.lastSettlementDate}
              lastSettlementBalanceEur={data.lastSettlementBalanceEur}
              hausgeldMonthlyEur={data.hausgeldMonthlyEur}
              allocatablePaEur={data.allocatablePaEur}
              nonAllocatablePaEur={data.nonAllocatablePaEur}
              topCostBlocks={data.topCostBlocks}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FinancingBlock
              bankName={data.bankName}
              loanNumber={data.loanNumber}
              outstandingBalanceEur={data.outstandingBalanceEur}
              outstandingBalanceAsof={data.outstandingBalanceAsof}
              interestRatePercent={data.interestRatePercent}
              fixedInterestEndDate={data.fixedInterestEndDate}
              annuityMonthlyEur={data.annuityMonthlyEur}
              specialRepaymentRight={data.specialRepaymentRight}
              contactPerson={data.contactPerson}
            />
            <LegalBlock
              landRegisterShort={data.landRegisterShort}
              wegFlag={data.wegFlag}
              meaOrTeNo={data.meaOrTeNo}
              managerContact={data.managerContact}
            />
          </div>
        </div>

        {/* Right Column: KPIs & Documents */}
        <div className="space-y-4">
          <InvestmentKPIBlock
            purchasePriceEur={data.purchasePriceEur}
            purchaseCostsEur={data.purchaseCostsEur}
            valuationEur={data.valuationEur}
            netColdRentPaEur={data.netColdRentPaEur}
            nonAllocCostsPaEur={data.nonAllocCostsPaEur}
            cashflowPreTaxMonthlyEur={data.cashflowPreTaxMonthlyEur}
            grossYieldPercent={data.grossYieldPercent}
            netYieldPercent={data.netYieldPercent}
          />
          <DocumentChecklist documents={data.documents} />
        </div>
      </div>
    </div>
  );
}
