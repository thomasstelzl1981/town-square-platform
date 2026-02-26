/**
 * InvestmentExposePage — MOD-08 Investment-Suche Exposé
 * 
 * Thin wrapper around InvestmentExposeView (SSOT).
 * Specific: back-link to /portal/investments/suche, URL params auto-calc, top-20 sticky.
 */
import { useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { InvestmentExposeView } from '@/components/investment';
import { useExposeListing } from '@/hooks/useExposeListing';

export default function InvestmentExposePage() {
  const { publicId } = useParams<{ publicId: string }>();
  const [urlParams] = useSearchParams();

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

  // Preserve search params in back-link so user returns to their results
  const backTo = useMemo(() => {
    const preserved = new URLSearchParams();
    for (const key of ['zvE', 'equity', 'status', 'kirchensteuer', 'searched']) {
      const val = urlParams.get(key);
      if (val) preserved.set(key, val);
    }
    const qs = preserved.toString();
    return `/portal/investments/suche${qs ? `?${qs}` : ''}`;
  }, [urlParams]);

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
        to: backTo,
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
