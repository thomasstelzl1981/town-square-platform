/**
 * ProjectLandingExpose — Einheit-Detail für Zone 3 Projekt-Landingpages
 * Konsolidiert auf InvestmentExposeView (SSOT) via useProjectUnitExpose
 * + KaufyFinanceRequestSheet für Finanzierungsanfragen
 */
import { useParams, Link } from 'react-router-dom';
import { useState, useMemo, lazy, Suspense } from 'react';
import { Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvestmentExposeView } from '@/components/investment/InvestmentExposeView';
import { useProjectUnitExpose } from '@/hooks/useProjectUnitExpose';
import type { KaufyListingData, KaufyEngineParams } from '@/components/zone3/KaufyFinanceRequestSheet';

const KaufyFinanceRequestSheet = lazy(() => import('@/components/zone3/KaufyFinanceRequestSheet'));

export default function ProjectLandingExpose() {
  const { slug, unitId } = useParams<{ slug: string; unitId: string }>();
  const [showFinanceRequest, setShowFinanceRequest] = useState(false);

  const {
    listing,
    isLoading,
    params,
    setParams,
    calcResult,
    isCalculating,
    grossYield,
  } = useProjectUnitExpose({
    unitId,
    autoCalculate: true,
  });

  // Adapter for KaufyFinanceRequestSheet
  const kaufyListingData: KaufyListingData | null = useMemo(() => {
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

  const kaufyEngineParams: KaufyEngineParams | null = useMemo(() => {
    if (!calcResult || !listing) return null;
    const annuity = (calcResult.summary.yearlyInterest + calcResult.summary.yearlyRepayment) / 12;
    return {
      equity: params.equity,
      interestRate: calcResult.summary.interestRate,
      repaymentRate: params.repaymentRate,
      monthlyRate: annuity,
      loanAmount: calcResult.summary.loanAmount,
      purchasePrice: listing.asking_price,
      totalCosts: calcResult.summary.totalInvestment || listing.asking_price,
    };
  }, [calcResult, listing, params]);

  const financeButton = kaufyListingData && kaufyEngineParams ? (
    <Button
      onClick={() => setShowFinanceRequest(true)}
      className="w-full h-12 rounded-lg bg-gradient-to-r from-[hsl(160,55%,35%)] to-[hsl(160,60%,42%)] hover:from-[hsl(160,55%,30%)] hover:to-[hsl(160,60%,37%)] text-white text-base gap-2"
    >
      <Banknote className="h-5 w-5" />
      Finanzierung beantragen
    </Button>
  ) : null;

  return (
    <InvestmentExposeView
      listing={listing}
      isLoading={isLoading}
      calcResult={calcResult}
      isCalculating={isCalculating}
      params={params}
      onParamsChange={setParams}
      grossYield={grossYield}
      backLink={{
        to: `/website/projekt/${slug}`,
        label: 'Zurück zur Übersicht',
      }}
      showDocuments={false}
      showFavorite={false}
      headerClassName="bg-white"
      textColors={{
        title: 'text-[hsl(220,20%,10%)]',
        subtitle: 'text-[hsl(215,16%,47%)]',
        price: 'text-[hsl(210,80%,55%)]',
        factsBg: 'bg-[hsl(210,40%,96%)]',
        factsLabel: 'text-[hsl(215,16%,47%)]',
      }}
      calculatorExtras={
        <div className="space-y-3">
          {financeButton}
          <Link to={`/website/projekt/${slug}/beratung`}>
            <Button variant="outline" className="w-full h-12 rounded-lg text-base">
              Beratungsgespräch vereinbaren
            </Button>
          </Link>
        </div>
      }
      mobileBottomBar={
        kaufyListingData && kaufyEngineParams ? (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-border z-50">
            {financeButton}
          </div>
        ) : null
      }
      afterContent={
        kaufyListingData && kaufyEngineParams ? (
          <Suspense fallback={null}>
            <KaufyFinanceRequestSheet
              open={showFinanceRequest}
              onClose={() => setShowFinanceRequest(false)}
              listing={kaufyListingData}
              engineParams={kaufyEngineParams}
            />
          </Suspense>
        ) : null
      }
    />
  );
}
