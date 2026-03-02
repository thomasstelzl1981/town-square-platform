/**
 * useSalesSettlement — Hook for creating and managing settlement records
 * Uses ENG-PROVISION for calculations and central useSLCEventRecorder for SLC events (SSOT).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { calcCommission, calcPlatformShare, calcPartnerShare } from '@/engines/provision/engine';
import { PROVISION_DEFAULTS } from '@/engines/provision/spec';
import { useSLCEventRecorder } from './useSLCEventRecorder';
import type { SLCPhase } from '@/engines/slc/spec';
export interface SettlementCalcInput {
  caseId: string;
  reservationId?: string;
  dealValue: number;
  buyerCommissionPercent?: number;
  sellerCommissionPercent?: number;
  partnerOrgId?: string;
  partnerSharePercent?: number;
  tenantId: string;
}

export function useSalesSettlements(caseId?: string) {
  const { profile } = useAuth();
  const tenantId = profile?.active_tenant_id;

  return useQuery({
    queryKey: ['sales-settlements', caseId],
    enabled: !!tenantId,
    queryFn: async () => {
      let query = supabase
        .from('sales_settlements')
        .select(`
          *,
          partner_org:organizations!sales_settlements_partner_org_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (caseId) query = query.eq('case_id', caseId);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAllSettlements() {
  return useQuery({
    queryKey: ['sales-settlements-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_settlements')
        .select(`
          *,
          partner_org:organizations!sales_settlements_partner_org_id_fkey(name),
          case:sales_cases!sales_settlements_case_id_fkey(
            id, current_phase, asset_type,
            property:properties(address, city),
            tenant:organizations!sales_cases_tenant_id_fkey(name)
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateSettlement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { recordEvent } = useSLCEventRecorder();

  return useMutation({
    mutationFn: async (input: SettlementCalcInput) => {
      // 1. Calculate commission via ENG-PROVISION
      const commission = calcCommission({
        dealValue: input.dealValue,
        buyerCommissionPercent: input.buyerCommissionPercent ?? PROVISION_DEFAULTS.buyerCommissionPercent,
        sellerCommissionPercent: input.sellerCommissionPercent ?? PROVISION_DEFAULTS.sellerCommissionPercent,
      });

      // 2. Calculate platform share (25%)
      const platformResult = calcPlatformShare({
        grossCommission: commission.total.brutto,
      });

      // 3. Calculate partner split if applicable
      let partnerData: Record<string, unknown> = {};
      if (input.partnerOrgId && input.partnerSharePercent) {
        const partnerResult = calcPartnerShare({
          commissionNetto: commission.total.netto,
          partnerSharePercent: input.partnerSharePercent,
        });
        partnerData = {
          partner_org_id: input.partnerOrgId,
          partner_share_pct: input.partnerSharePercent,
          partner_share_amount: partnerResult.partnerAmount,
          house_share_amount: partnerResult.houseAmount,
        };
      }

      // 4. Insert settlement
      const { data, error } = await supabase
        .from('sales_settlements')
        .insert({
          case_id: input.caseId,
          reservation_id: input.reservationId || null,
          deal_value: input.dealValue,
          buyer_commission_netto: commission.buyer.netto,
          seller_commission_netto: commission.seller.netto,
          total_commission_netto: commission.total.netto,
          total_commission_brutto: commission.total.brutto,
          vat_amount: commission.total.vat,
          platform_share_pct: PROVISION_DEFAULTS.platformSharePct,
          platform_share_amount: platformResult.platformShare,
          manager_netto_amount: platformResult.managerNetto,
          ...partnerData,
          status: 'calculated',
          calculated_at: new Date().toISOString(),
          tenant_id: input.tenantId,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // 5. Record SLC event via central recorder
      try {
        const { data: caseData } = await supabase
          .from('sales_cases')
          .select('current_phase')
          .eq('id', input.caseId)
          .single();

        if (caseData) {
          await recordEvent({
            caseId: input.caseId,
            eventType: 'deal.commission_calculated',
            currentPhase: caseData.current_phase as SLCPhase,
            tenantId: input.tenantId,
            payload: {
              settlement_id: data.id,
              deal_value: input.dealValue,
              total_commission: commission.total.brutto,
              platform_share: platformResult.platformShare,
            },
          });
        }
      } catch (e) {
        console.warn('[SLC] Commission event recording failed:', e);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-settlements'] });
      queryClient.invalidateQueries({ queryKey: ['sales-settlements-all'] });
      queryClient.invalidateQueries({ queryKey: ['sales-desk-cases'] });
      queryClient.invalidateQueries({ queryKey: ['sales-desk-recent-events'] });
      toast.success('Abrechnung erstellt');
    },
    onError: (err: Error) => toast.error('Fehler: ' + err.message),
  });
}

export function useApproveSettlement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { recordEvent } = useSLCEventRecorder();

  return useMutation({
    mutationFn: async ({ settlementId, caseId, tenantId }: { settlementId: string; caseId: string; tenantId: string }) => {
      const { error } = await supabase
        .from('sales_settlements')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq('id', settlementId);

      if (error) throw error;

      // Record SLC event via central recorder
      try {
        const { data: caseData } = await supabase
          .from('sales_cases').select('current_phase').eq('id', caseId).single();
        if (caseData) {
          await recordEvent({
            caseId,
            eventType: 'deal.platform_share_settled',
            currentPhase: caseData.current_phase as SLCPhase,
            tenantId,
            payload: { settlement_id: settlementId },
          });
        }
      } catch (e) {
        console.warn('[SLC] Settlement event recording failed:', e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-settlements'] });
      queryClient.invalidateQueries({ queryKey: ['sales-settlements-all'] });
      queryClient.invalidateQueries({ queryKey: ['sales-desk-cases'] });
      toast.success('Abrechnung freigegeben');
    },
    onError: (err: Error) => toast.error('Fehler: ' + err.message),
  });
}
