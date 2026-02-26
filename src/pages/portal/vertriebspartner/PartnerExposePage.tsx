/**
 * PartnerExposePage — MOD-09 Beratung Exposé (Blind-to-Customer: keine Provision)
 * 
 * Thin wrapper around InvestmentExposeView (SSOT).
 * Specific: back-link to /portal/vertriebspartner/beratung, URL params auto-calc, top-20 sticky.
 */
import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { InvestmentExposeView } from '@/components/investment';
import { useExposeListing } from '@/hooks/useExposeListing';

export default function PartnerExposePage() {
  const { publicId } = useParams<{ publicId: string }>();

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
    queryKeyPrefix: 'partner-expose',
  });

  const toggleFavorite = useCallback(() => setIsFavorite(prev => !prev), [setIsFavorite]);

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
    />
  );
}
