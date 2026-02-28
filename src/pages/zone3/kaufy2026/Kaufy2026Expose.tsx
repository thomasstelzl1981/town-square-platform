/**
 * Kaufy2026Expose — Zone 3 Investment Exposé
 * 
 * Thin wrapper around InvestmentExposeView (SSOT).
 * Specific: navigate(-1) back, Kaufy-branded colors, sale_price_fixed,
 * "Finanzierung beantragen" CTA, top-24 sticky.
 */
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InvestmentExposeView } from '@/components/investment';
import { useExposeListing } from '@/hooks/useExposeListing';
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import KaufyFinanceRequestSheet, { type KaufyListingData, type KaufyEngineParams } from '@/components/zone3/KaufyFinanceRequestSheet';

export default function Kaufy2026Expose() {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
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
  } = useExposeListing({
    publicId,
    useUrlParams: true,
    queryKeyPrefix: 'kaufy2026-listing',
    useSalePriceFixed: true,
  });

  const toggleFavorite = useCallback(() => setIsFavorite(prev => !prev), [setIsFavorite]);

  // Kaufy-specific "not found" content
  const notFoundContent = (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md space-y-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center">
          <MapPin className="w-7 h-7 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">Objekt nicht verfügbar</h2>
        <p className="text-muted-foreground text-sm">
          Dieses Objekt ist nicht mehr verfügbar oder wurde deaktiviert.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/website/kaufy">
            <Button>Weitere Objekte entdecken</Button>
          </Link>
          <Link to="/website/kaufy/verkaeufer">
            <Button variant="outline">Sie sind Verkäufer? Projekt einstellen</Button>
          </Link>
        </div>
      </div>
    </div>
  );

  // Kaufy CTA button for calculator sidebar
  const calculatorExtras = (
    <Button
      onClick={() => setShowFinanceRequest(true)}
      className="w-full"
      size="lg"
      style={{ background: 'linear-gradient(135deg, hsl(165 70% 36%) 0%, hsl(158 64% 52%) 100%)' }}
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
        className="w-full"
        size="lg"
        style={{ background: 'linear-gradient(135deg, hsl(165 70% 36%) 0%, hsl(158 64% 52%) 100%)' }}
      >
        <Send className="w-4 h-4 mr-2" />
        Finanzierung beantragen
      </Button>
    </div>
  );

  // Finance Request Sheet
  const afterContent = listing ? (
    <KaufyFinanceRequestSheet
      open={showFinanceRequest}
      onClose={() => setShowFinanceRequest(false)}
      listing={listing as unknown as KaufyListingData}
      engineParams={{
        equity: params.equity,
        interestRate: calcResult?.summary?.interestRate ?? 3.5,
        repaymentRate: params.repaymentRate ?? 2,
        monthlyRate: calcResult?.summary?.monthlyBurden ?? 0,
        loanAmount: calcResult?.summary?.loanAmount ?? (listing.asking_price - params.equity),
        purchasePrice: listing.asking_price,
        totalCosts: calcResult?.summary?.totalInvestment ?? listing.asking_price,
      }}
    />
  ) : null;

  return (
    <>
    <SEOHead
      brand="kaufy"
      page={{
        title: listing ? `${listing.title} — Exposé` : 'Immobilien-Exposé',
        description: listing ? `Kapitalanlage: ${listing.title}. Detaillierte Renditeberechnung, Steueroptimierung und Finanzierungsanfrage.` : 'Detailliertes Immobilien-Exposé mit KI-Renditeberechnung.',
        path: `/immobilien/${publicId || ''}`,
        noIndex: !listing,
      }}
    />
    <InvestmentExposeView
      listing={listing ?? null}
      isLoading={isLoading}
      calcResult={calcResult}
      isCalculating={isCalculating}
      params={params}
      onParamsChange={setParams}
      grossYield={grossYield}
      backLink={{
        to: '/website/kaufy',
        label: 'Zurück zur Suche',
        useNavigateBack: true,
        onNavigateBack: () => navigate(-1),
      }}
      stickyTopClass="top-24"
      showDocuments={true}
      showFavorite={true}
      isFavorite={isFavorite}
      onToggleFavorite={toggleFavorite}
      headerClassName="bg-white"
      textColors={{
        title: 'text-[hsl(220,20%,10%)]',
        subtitle: 'text-[hsl(215,16%,47%)]',
        price: 'text-[hsl(210,80%,55%)]',
        factsBg: 'bg-[hsl(210,30%,97%)]',
        factsLabel: 'text-[hsl(215,16%,47%)]',
      }}
      calculatorExtras={calculatorExtras}
      mobileBottomBar={mobileBottomBar}
      afterContent={afterContent}
      notFoundContent={notFoundContent}
    />
    </>
  );
}
