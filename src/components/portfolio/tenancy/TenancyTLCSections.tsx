/**
 * TenancyTLCSections — TLC (Tenancy Lifecycle) section groups for active leases
 */
import { SectionCard } from '@/components/shared/SectionCard';
import { DESIGN } from '@/config/designManifest';
import { ClipboardList, FileText, Euro, Building2, BarChart3 } from 'lucide-react';
import { TLCEventsSection } from '../tlc/TLCEventsSection';
import { TLCTasksSection } from '../tlc/TLCTasksSection';
import { TLCDeadlinesSection } from '../tlc/TLCDeadlinesSection';
import { TLCMeterSection } from '../tlc/TLCMeterSection';
import { TLCHandoverSection } from '../tlc/TLCHandoverSection';
import { TLCDefectSection } from '../tlc/TLCDefectSection';
import { TLCApplicantSection } from '../tlc/TLCApplicantSection';
import { TLCContractSection } from '../tlc/TLCContractSection';
import { TLCPaymentPlanSection } from '../tlc/TLCPaymentPlanSection';
import { TLCRentReductionSection } from '../tlc/TLCRentReductionSection';
import { TLCCommunicationSection } from '../tlc/TLCCommunicationSection';
import { TLCPrepaymentSection } from '../tlc/TLCPrepaymentSection';
import { TLCInvoiceSection } from '../tlc/TLCInvoiceSection';
import { TLCServiceProviderSection } from '../tlc/TLCServiceProviderSection';
import { TLCInsuranceSection } from '../tlc/TLCInsuranceSection';
import { TLCReportSection } from '../tlc/TLCReportSection';
import { TLCThreeYearCheckSection } from '../tlc/TLCThreeYearCheckSection';
import { TLCRentalListingSection } from '../tlc/TLCRentalListingSection';
import type { LeaseWithContact } from './tenancyTypes';

interface TenancyTLCSectionsProps {
  activeLeases: LeaseWithContact[];
  propertyId: string;
  tenantId: string;
  unitId: string;
  orgName: string;
  propertyAddress: string;
  propertyCity: string;
  propertyPostalCode: string;
  unitDescription: string;
  unitAreaSqm: number;
  unitRooms: number;
  propertyYearBuilt?: number;
  // TLC hook data
  events: any[];
  tasks: any[];
  resolveEvent: (id: string) => void;
  updateTaskStatus: (id: string, status: string) => void;
  deadlines: any[];
  completeDeadline: (id: string) => void;
  dismissDeadline: (id: string) => void;
  readings: any[];
  metersLoading: boolean;
  fetchReadings: () => void;
}

export function TenancyTLCSections({
  activeLeases, propertyId, tenantId, unitId,
  orgName, propertyAddress, propertyCity, propertyPostalCode,
  unitDescription, unitAreaSqm, unitRooms, propertyYearBuilt,
  events, tasks, resolveEvent, updateTaskStatus,
  deadlines, completeDeadline, dismissDeadline,
  readings, metersLoading, fetchReadings,
}: TenancyTLCSectionsProps) {
  return (
    <div className={`${DESIGN.SPACING.SECTION} pt-4 border-t`}>
      {/* Kernfunktionen */}
      <SectionCard icon={ClipboardList} title="Kernfunktionen" description="Lifecycle-Events, Aufgaben & Fristen">
        <div className={DESIGN.SPACING.COMPACT}>
          <TLCEventsSection events={events} onResolve={resolveEvent} />
          <TLCTasksSection tasks={tasks} onUpdateStatus={updateTaskStatus} />
          <TLCDeadlinesSection
            deadlines={deadlines as any}
            onComplete={completeDeadline}
            onDismiss={dismissDeadline}
          />
          <TLCMeterSection readings={readings} loading={metersLoading} onFetch={fetchReadings} />
        </div>
      </SectionCard>

      {/* Per-Lease Workflow Sections */}
      {activeLeases.map((lease) => {
        const tName = lease.tenant_contact ? `${lease.tenant_contact.first_name} ${lease.tenant_contact.last_name}` : 'Mieter';
        return (
          <div key={lease.id} className="space-y-1">
            {activeLeases.length > 1 && (
              <p className="text-[11px] font-semibold text-muted-foreground px-1 pt-2 border-t">
                Vertrag: {tName}
              </p>
            )}

            <SectionCard icon={FileText} title="Vertrag & Übergabe" description="Inserate, Verträge, Übergaben, Bewerber">
              <div className={DESIGN.SPACING.COMPACT}>
                <TLCRentalListingSection
                  unitId={unitId} propertyId={propertyId} tenantId={tenantId}
                  coldRent={lease.rent_cold_eur || 0} warmRent={lease.monthly_rent || 0}
                  propertyAddress={propertyAddress} propertyCity={propertyCity}
                  postalCode={propertyPostalCode} areaSqm={unitAreaSqm}
                  rooms={unitRooms} yearBuilt={propertyYearBuilt}
                />
                <TLCContractSection
                  leaseData={lease.rent_cold_eur ? {
                    landlordName: orgName || 'Eigentümer',
                    landlordAddress: propertyAddress,
                    tenantName: tName,
                    propertyAddress,
                    unitDescription,
                    areaSqm: unitAreaSqm,
                    roomCount: unitRooms,
                    rentColdEur: lease.rent_cold_eur || 0,
                    nkAdvanceEur: lease.nk_advance_eur || 0,
                    depositEur: lease.deposit_amount_eur || 0,
                    startDate: lease.start_date,
                    endDate: lease.end_date || undefined,
                    noticePeriodMonths: 3,
                    rentModel: (lease.rent_model as 'FIX' | 'INDEX' | 'STAFFEL') || 'FIX',
                  } : undefined}
                  contactId={lease.tenant_contact?.id}
                />
                <TLCHandoverSection leaseId={lease.id} unitId={unitId} tenantId={tenantId} tenantName={tName} />
                <TLCApplicantSection unitId={unitId} />
              </div>
            </SectionCard>

            <SectionCard icon={Euro} title="Finanzen" description="Zahlungspläne, Minderungen, NK-Prüfungen">
              <div className={DESIGN.SPACING.COMPACT}>
                <TLCPaymentPlanSection leaseId={lease.id} unitId={unitId} />
                <TLCRentReductionSection leaseId={lease.id} unitId={unitId} />
                <TLCPrepaymentSection
                  propertyId={propertyId} leaseId={lease.id}
                  currentNkAdvance={lease.nk_advance_eur || 0} tenantName={tName} unitId={unitId}
                />
                <TLCThreeYearCheckSection
                  leaseId={lease.id} unitId={unitId} propertyId={propertyId}
                  tenantId={tenantId} rentColdEur={lease.rent_cold_eur || 0}
                  startDate={lease.start_date} endDate={lease.end_date}
                />
                <TLCInvoiceSection propertyId={propertyId} />
              </div>
            </SectionCard>

            <SectionCard icon={Building2} title="Verwaltung" description="Kommunikation, Mängel, Dienstleister">
              <div className={DESIGN.SPACING.COMPACT}>
                <TLCCommunicationSection
                  leaseId={lease.id} unitId={unitId} propertyId={propertyId}
                  tenantEmail={lease.tenant_contact?.email || undefined} tenantName={tName}
                />
                <TLCDefectSection tenantId={tenantId} leaseId={lease.id} propertyId={propertyId} />
                <TLCServiceProviderSection propertyId={propertyId} />
                <TLCInsuranceSection propertyId={propertyId} />
              </div>
            </SectionCard>
          </div>
        );
      })}

      {activeLeases.length === 0 && <TLCApplicantSection unitId={unitId} />}
      
      <SectionCard icon={BarChart3} title="Portfolio-Report" description="Kennzahlen & CSV-Export">
        <TLCReportSection propertyId={propertyId} />
      </SectionCard>
    </div>
  );
}
