import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================
export type InboundStatus = 'pending' | 'matched' | 'rejected' | 'accepted' | 'archived';
export type MatchConfidence = 'none' | 'low' | 'medium' | 'high' | 'exact';

export interface ServiceCaseInbound {
  id: string;
  tenant_id: string;
  service_case_id: string | null;
  sender_email: string;
  sender_name: string | null;
  sender_phone: string | null;
  sender_company: string | null;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  received_at: string;
  attachments: Record<string, unknown>[];
  matched_tender_id: string | null;
  match_confidence: MatchConfidence;
  match_method: string | null;
  offer_amount_cents: number | null;
  offer_valid_until: string | null;
  offer_notes: string | null;
  status: InboundStatus;
  processed_at: string | null;
  processed_by: string | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  // Joined data
  service_case?: {
    id: string;
    title: string;
    tender_id: string | null;
    category: string;
  } | null;
}

export interface ServiceCaseProvider {
  id: string;
  tenant_id: string;
  service_case_id: string;
  provider_name: string;
  provider_email: string | null;
  provider_phone: string | null;
  provider_address: string | null;
  provider_website: string | null;
  place_id: string | null;
  email_sent_at: string | null;
  email_subject: string | null;
  email_status: string;
  response_received: boolean;
  response_inbound_id: string | null;
  offer_amount_cents: number | null;
  offer_valid_until: string | null;
  offer_notes: string | null;
  is_awarded: boolean;
  awarded_at: string | null;
  award_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Hooks: Inbound
// ============================================================================

/**
 * Fetch all unassigned inbound messages
 */
export function useUnassignedInbound() {
  const { activeTenantId } = useAuth();
  
  return useQuery({
    queryKey: ['service_case_inbound', 'unassigned', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      
      const { data, error } = await supabase
        .from('service_case_inbound')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .is('service_case_id', null)
        .eq('status', 'pending')
        .order('received_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as ServiceCaseInbound[];
    },
    enabled: !!activeTenantId,
  });
}

/**
 * Fetch inbound messages for a specific service case
 */
export function useServiceCaseInbound(serviceCaseId: string | undefined) {
  const { activeTenantId } = useAuth();
  
  return useQuery({
    queryKey: ['service_case_inbound', serviceCaseId],
    queryFn: async () => {
      if (!serviceCaseId) return [];
      
      const { data, error } = await supabase
        .from('service_case_inbound')
        .select('*')
        .eq('service_case_id', serviceCaseId)
        .order('received_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as ServiceCaseInbound[];
    },
    enabled: !!serviceCaseId && !!activeTenantId,
  });
}

/**
 * Assign an inbound message to a service case
 */
export function useAssignInbound() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ inboundId, serviceCaseId }: { inboundId: string; serviceCaseId: string }) => {
      const { data, error } = await supabase
        .from('service_case_inbound')
        .update({
          service_case_id: serviceCaseId,
          status: 'matched',
          match_method: 'manual',
          match_confidence: 'exact',
          processed_at: new Date().toISOString(),
        })
        .eq('id', inboundId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_case_inbound'] });
      toast.success('E-Mail zugeordnet');
    },
    onError: (error) => {
      console.error('Error assigning inbound:', error);
      toast.error('Fehler beim Zuordnen');
    },
  });
}

/**
 * Update inbound offer details
 */
export function useUpdateInboundOffer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      inboundId, 
      offer_amount_cents, 
      offer_valid_until, 
      offer_notes 
    }: { 
      inboundId: string; 
      offer_amount_cents?: number; 
      offer_valid_until?: string; 
      offer_notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('service_case_inbound')
        .update({
          offer_amount_cents,
          offer_valid_until,
          offer_notes,
        })
        .eq('id', inboundId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_case_inbound'] });
    },
  });
}

// ============================================================================
// Hooks: Providers
// ============================================================================

/**
 * Fetch providers for a service case
 */
export function useServiceCaseProviders(serviceCaseId: string | undefined) {
  const { activeTenantId } = useAuth();
  
  return useQuery({
    queryKey: ['service_case_providers', serviceCaseId],
    queryFn: async () => {
      if (!serviceCaseId) return [];
      
      const { data, error } = await supabase
        .from('service_case_providers')
        .select('*')
        .eq('service_case_id', serviceCaseId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as unknown as ServiceCaseProvider[];
    },
    enabled: !!serviceCaseId && !!activeTenantId,
  });
}

/**
 * Award a provider
 */
export function useAwardProvider() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      providerId, 
      serviceCaseId,
      awardNotes 
    }: { 
      providerId: string; 
      serviceCaseId: string;
      awardNotes?: string;
    }) => {
      // Reset any existing awards for this case
      await supabase
        .from('service_case_providers')
        .update({ is_awarded: false, awarded_at: null })
        .eq('service_case_id', serviceCaseId);
      
      // Set the new award
      const { data, error } = await supabase
        .from('service_case_providers')
        .update({
          is_awarded: true,
          awarded_at: new Date().toISOString(),
          award_notes: awardNotes || null,
        })
        .eq('id', providerId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update service case status to awarded
      await supabase
        .from('service_cases')
        .update({ status: 'awarded' })
        .eq('id', serviceCaseId);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_case_providers'] });
      queryClient.invalidateQueries({ queryKey: ['service_cases'] });
      toast.success('Auftrag vergeben');
    },
    onError: (error) => {
      console.error('Error awarding provider:', error);
      toast.error('Fehler bei der Vergabe');
    },
  });
}
