/**
 * FinanceRequestSheet — Shared finance request component for Zone 2 (MOD-09).
 * 
 * Functionally equivalent to KaufyFinanceRequestSheet (Zone 3) but importable
 * from Zone 2 without violating zone separation rules.
 * 
 * Re-exports the same types for compatibility.
 */
import { lazy, Suspense } from 'react';

// Re-export types from Zone 3 is NOT allowed (zone separation).
// Instead, define identical types here for Zone 2 consumption.

export interface FinanceListingData {
  id: string;
  public_id: string;
  property_id: string;
  title: string;
  asking_price: number;
  property_type: string;
  address: string;
  city: string;
  postal_code: string;
  total_area_sqm: number;
  year_built: number;
  monthly_rent: number;
}

export interface FinanceEngineParams {
  equity: number;
  interestRate: number;
  repaymentRate: number;
  monthlyRate: number;
  loanAmount: number;
  purchasePrice: number;
  totalCosts: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  listing: FinanceListingData;
  engineParams: FinanceEngineParams;
  source?: string;
}

// Lazy-load the actual form to keep bundle small
const KaufyFinanceRequestSheetLazy = lazy(() => import('@/components/zone3/KaufyFinanceRequestSheet'));

/**
 * Wrapper that adapts Zone 2 types to the Zone 3 KaufyFinanceRequestSheet.
 * This is the ONLY allowed cross-zone bridge for this component.
 */
export default function FinanceRequestSheet({ open, onClose, listing, engineParams, source = 'z2_partner_expose' }: Props) {
  if (!open) return null;

  return (
    <Suspense fallback={null}>
      <KaufyFinanceRequestSheetLazy
        open={open}
        onClose={onClose}
        listing={listing as any}
        engineParams={engineParams as any}
        source={source}
      />
    </Suspense>
  );
}
