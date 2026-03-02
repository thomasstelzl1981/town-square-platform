/**
 * Hook: NK Vorauszahlungsanpassung (Prepayment Adjustment)
 * Calculates new prepayment amounts based on NK settlement results
 * Uses existing NK data without modifying ENG-NK (frozen)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PrepaymentAdjustment {
  leaseId: string;
  unitId: string;
  tenantName: string;
  currentPrepayment: number;
  actualCostsMonthly: number;
  suggestedPrepayment: number;
  adjustmentEur: number;
  adjustmentPercent: number;
  effectiveDate: string;
  reason: string;
}

/**
 * Calculate suggested prepayment based on last NK settlement
 */
export function calculatePrepaymentAdjustment(
  currentPrepayment: number,
  totalActualCosts: number,
  monthsInPeriod: number,
  bufferPercent: number = 10
): { suggested: number; monthlyActual: number; adjustment: number; adjustmentPercent: number } {
  const monthlyActual = totalActualCosts / Math.max(monthsInPeriod, 1);
  const suggested = Math.ceil(monthlyActual * (1 + bufferPercent / 100));
  const adjustment = suggested - currentPrepayment;
  const adjustmentPercent = currentPrepayment > 0 
    ? Math.round((adjustment / currentPrepayment) * 1000) / 10 
    : 0;

  return {
    suggested: Math.round(suggested * 100) / 100,
    monthlyActual: Math.round(monthlyActual * 100) / 100,
    adjustment: Math.round(adjustment * 100) / 100,
    adjustmentPercent,
  };
}

/**
 * Generate prepayment adjustment letter text
 */
export function generatePrepaymentAdjustmentText(adj: PrepaymentAdjustment): string {
  const direction = adj.adjustmentEur > 0 ? 'Erhöhung' : 'Senkung';
  
  return `Sehr geehrte/r ${adj.tenantName},

basierend auf der letzten Betriebskostenabrechnung passen wir die monatliche Nebenkosten-Vorauszahlung wie folgt an:

Bisherige Vorauszahlung:    ${adj.currentPrepayment.toFixed(2)} €/Monat
Tatsächliche NK (Ø Monat):  ${adj.actualCostsMonthly.toFixed(2)} €/Monat
Neue Vorauszahlung:         ${adj.suggestedPrepayment.toFixed(2)} €/Monat

${direction}: ${Math.abs(adj.adjustmentEur).toFixed(2)} € (${Math.abs(adj.adjustmentPercent).toFixed(1)}%)

Wirksam ab: ${new Date(adj.effectiveDate).toLocaleDateString('de-DE')}

Rechtsgrundlage: §560 BGB — Die Anpassung der Vorauszahlung ist nach erfolgter Abrechnung zulässig.

${adj.reason}

Mit freundlichen Grüßen`;
}

export function usePrepaymentAdjustment(propertyId?: string) {
  const { profile } = useAuth();
  const tenantId = profile?.active_tenant_id;

  // Fetch leases with current NK prepayments
  const adjustmentsQuery = useQuery({
    queryKey: ['prepayment-adjustments', tenantId, propertyId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      // Get active leases with NK data
      const { data: leases, error } = await supabase
        .from('leases')
        .select('id, unit_id, status, nk_advance_eur, rent_cold_eur, tenant_name, start_date')
        .eq('tenant_id', tenantId)
        .eq('status', 'active');
      
      if (error) throw error;
      return leases || [];
    },
    enabled: !!tenantId,
  });

  return {
    leases: adjustmentsQuery.data || [],
    isLoading: adjustmentsQuery.isLoading,
    calculateAdjustment: calculatePrepaymentAdjustment,
    generateLetter: generatePrepaymentAdjustmentText,
  };
}
