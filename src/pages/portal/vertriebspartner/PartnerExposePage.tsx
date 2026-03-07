/**
 * PartnerExposePage — MOD-09 Beratung Exposé (Blind-to-Customer: keine Provision)
 * 
 * Thin wrapper around InvestmentExposeView (SSOT).
 * Specific: back-link to /portal/vertriebspartner/beratung, URL params auto-calc, top-20 sticky.
 * Includes FinanceRequestSheet for partner advisors.
 */
import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvestmentExposeView } from '@/components/investment';
import { useExposeListing } from '@/hooks/useExposeListing';
import FinanceRequestSheet, { type FinanceListingData, type FinanceEngineParams } from '@/components/shared/finance/FinanceRequestSheet';

export default function PartnerExposePage() {
  const { publicId } = useParams<{ publicId: string }>();
  const [showFinanceRequest, setShowFinanceRequest] = useState(false);

  const {
    listing,
    isLoading,
    calcResult,
    isCalculating,
    params,
    setParams,
    grossYield,
    isFavorite,
    setIsFavorite,
    accountingLocked,
  } = useExposeListing({
    publicId,
    useUrlParams: true,
    queryKeyPrefix: 'partner-expose',
  });

  const toggleFavorite = useCallback(() => setIsFavorite(prev => !prev), [setIsFavorite]);

  // Adapter for FinanceRequestSheet
  const financeListingData: FinanceListingData | null = useMemo(() => {
    if (!listing) return null;
    return {
      id: listing.id,
      public_id: listing.public_id,
      property_id: listing.property_id,
      title: listing.title,
      asking_price: listing.asking_price,
      property_type: listing.property_type,
      address: listing.address,
      city: listing.city,
      postal_code: listing.postal_code,
      total_area_sqm: listing.total_area_sqm,
      year_built: listing.year_built,
      monthly_rent: listing.monthly_rent,
    };
  }, [listing]);

  const financeEngineParams: FinanceEngineParams | null = useMemo(() => {
    if (!listing) return null;
    return {
      equity: params.equity,
      interestRate: calcResult?.summary?.interestRate ?? 3.5,
      repaymentRate: params.repaymentRate ?? 2,
      monthlyRate: calcResult?.summary?.monthlyBurden ?? 0,
      loanAmount: calcResult?.summary?.loanAmount ?? (listing.asking_price - params.equity),
      purchasePrice: listing.asking_price,
      totalCosts: calcResult?.summary?.totalInvestment ?? listing.asking_price,
    };
  }, [listing, params, calcResult]);

  // CTA button for calculator sidebar
  const calculatorExtras = (
    <Button
      onClick={() => setShowFinanceRequest(true)}
      className="w-full bg-primary hover:bg-primary/90"
      size="lg"
    >
      <Send className="w-4 h-4 mr-2" />
      Finanzierung beantragen
    </Button>
  );

  // Mobile bottom bar
  const mobileBottomBar = (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t z-20">
      <Button
        onClick={() => setShowFinanceRequest(true)}
        className="w-full bg-primary hover:bg-primary/90"
        size="lg"
      >
        <Send className="w-4 h-4 mr-2" />
        Finanzierung beantragen
      </Button>
    </div>
  );

  // Finance Request Sheet (after content)
  const afterContent = financeListingData && financeEngineParams ? (
    <FinanceRequestSheet
      open={showFinanceRequest}
      onClose={() => setShowFinanceRequest(false)}
      listing={financeListingData}
      engineParams={financeEngineParams}
      source="z2_partner_expose"
    />
  ) : null;

  return (
    <InvestmentExposeView
      listing={listing ?? null}
      isLoading={isLoading}
      calcResult={calcResult}
      isCalculating={isCalculating}
      params={params}
      onParamsChange={setParams}
      grossYield={grossYield}
      backLink={{
        to: '/portal/vertriebspartner/beratung',
        label: 'Zurück zur Beratung',
      }}
      stickyTopClass="top-20"
      showDocuments={true}
      showFavorite={true}
      isFavorite={isFavorite}
      onToggleFavorite={toggleFavorite}
      accountingLocked={accountingLocked}
      calculatorExtras={calculatorExtras}
      mobileBottomBar={mobileBottomBar}
      afterContent={afterContent}
    />
  );
}
