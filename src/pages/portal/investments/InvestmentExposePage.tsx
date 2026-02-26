/**
 * InvestmentExposePage — MOD-08 Investment-Suche Exposé
 * 
 * Thin wrapper around InvestmentExposeView (SSOT).
 * Specific: back-link to /portal/investments/suche, URL params auto-calc, top-20 sticky.
 */
import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { InvestmentExposeView } from '@/components/investment';
import { useExposeListing } from '@/hooks/useExposeListing';

export default function InvestmentExposePage() {
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
    queryKeyPrefix: 'investment-listing',
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
        to: '/portal/investments/suche',
        label: 'Zurück zur Suche',
      }}
      stickyTopClass="top-20"
      showDocuments={true}
      showFavorite={true}
      isFavorite={isFavorite}
      onToggleFavorite={toggleFavorite}
    />
  );
}
