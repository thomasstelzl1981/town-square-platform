/**
 * PrivatkreditTab — Full inline flow for consumer loan (API-ready for Europace)
 * 
 * Single scrollable page: Employment Gate → Calculator → Application → Documents → Submit
 */
import { useState, useCallback } from 'react';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { EmploymentGate } from '@/components/privatkredit/EmploymentGate';
import { LoanCalculator } from '@/components/privatkredit/LoanCalculator';
import { ApplicationPreview } from '@/components/privatkredit/ApplicationPreview';
import { DocumentChecklist } from '@/components/privatkredit/DocumentChecklist';
import { SubmitSection } from '@/components/privatkredit/SubmitSection';
import { Separator } from '@/components/ui/separator';
import type { MockOffer } from '@/hooks/useConsumerLoan';

export default function PrivatkreditTab() {
  const [employmentStatus, setEmploymentStatus] = useState('employed');
  const [amount, setAmount] = useState(0);
  const [term, setTerm] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState<MockOffer | null>(null);
  const [consentData, setConsentData] = useState(false);
  const [consentCredit, setConsentCredit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isSelfEmployed = employmentStatus === 'self_employed';

  const handleSelectOffer = useCallback((offer: MockOffer) => {
    setSelectedOffer(offer);
  }, []);

  const canSubmit =
    !isSelfEmployed &&
    amount >= 1000 &&
    term >= 6 &&
    !!selectedOffer &&
    consentData &&
    consentCredit;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1500));
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-2">
      <ModulePageHeader
        title="Privatkredit"
        description="Kredit beantragen — powered by Europace"
      />

      <div className="space-y-8">
        {/* 1. Employment Gate */}
        <EmploymentGate value={employmentStatus} onChange={setEmploymentStatus} />

        <Separator />

        {/* 2. Loan Calculator */}
        <LoanCalculator
          disabled={isSelfEmployed}
          amount={amount}
          term={term}
          onAmountChange={setAmount}
          onTermChange={setTerm}
          selectedOfferId={selectedOffer?.id ?? null}
          onSelectOffer={handleSelectOffer}
        />

        <Separator />

        {/* 3. Application Preview (from Selbstauskunft) */}
        <ApplicationPreview disabled={isSelfEmployed} />

        <Separator />

        {/* 4. Document Checklist */}
        <DocumentChecklist disabled={isSelfEmployed} />

        <Separator />

        {/* 5. Submit Section */}
        <SubmitSection
          disabled={isSelfEmployed}
          consentDataCorrect={consentData}
          consentCreditCheck={consentCredit}
          onConsentDataCorrect={setConsentData}
          onConsentCreditCheck={setConsentCredit}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          isSubmitted={isSubmitted}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
