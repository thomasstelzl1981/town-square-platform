/**
 * Hook for managing Project Reservations (MOD-13 PROJEKTE)
 * 
 * BRIDGE: Delegates to useSalesReservations with projectId filter.
 * This file exists for backward compatibility. New code should use useSalesReservations directly.
 */

import { useSalesReservations } from './useSalesReservations';
import type { CreateSalesReservationInput, SalesReservationStatus } from './useSalesReservations';

// Re-export types for backward compatibility
export type { SalesReservationStatus as ReservationStatus };

export function useProjectReservations(projectId: string | undefined) {
  return useSalesReservations({ projectId });
}

export type { CreateSalesReservationInput as CreateReservationInput };
