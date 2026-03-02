/**
 * useSLCEventRecorder — Records lifecycle events into sales_lifecycle_events
 * and auto-advances the case phase based on SLC_EVENT_PHASE_MAP.
 * 
 * This is the SINGLE entry point for all SLC event recording.
 * Components/hooks call recordEvent() — this hook handles:
 * 1. Insert into sales_lifecycle_events
 * 2. Update sales_cases.current_phase (if event triggers transition)
 * 3. Invalidate relevant queries
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SLC_EVENT_PHASE_MAP } from '@/engines/slc/spec';
import { isValidTransition } from '@/engines/slc/engine';
import type { SLCEventType, SLCEventSeverity, SLCPhase } from '@/engines/slc/spec';

export interface RecordSLCEventInput {
  caseId: string;
  eventType: SLCEventType;
  severity?: SLCEventSeverity;
  currentPhase: SLCPhase;
  tenantId: string;
  payload?: Record<string, unknown>;
}

export function useSLCEventRecorder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async (input: RecordSLCEventInput) => {
      const targetPhase = SLC_EVENT_PHASE_MAP[input.eventType];
      const phaseAfter = targetPhase && isValidTransition(input.currentPhase, targetPhase)
        ? targetPhase
        : null;

      // 1. Insert event
      const { error: eventError } = await supabase
        .from('sales_lifecycle_events')
        .insert({
          case_id: input.caseId,
          event_type: input.eventType as string,
          severity: input.severity || 'info',
          phase_before: input.currentPhase as any,
          phase_after: (phaseAfter || input.currentPhase) as any,
          actor_id: user?.id || null,
          payload: (input.payload || {}) as any,
          tenant_id: input.tenantId,
        });

      if (eventError) throw eventError;

      // 2. Advance phase if valid transition
      if (phaseAfter) {
        const { error: caseError } = await supabase
          .from('sales_cases')
          .update({ current_phase: phaseAfter as any, updated_at: new Date().toISOString() })
          .eq('id', input.caseId);

        if (caseError) throw caseError;
      }

      return { phaseAfter: phaseAfter || input.currentPhase };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-desk-cases'] });
      queryClient.invalidateQueries({ queryKey: ['sales-desk-recent-events'] });
    },
  });

  return {
    recordEvent: mutation.mutateAsync,
    isRecording: mutation.isPending,
  };
}

/**
 * Helper: Find or create a sales case for a listing.
 * Used when recording events for listings that may not have a case yet.
 */
export async function findOrCreateCase(opts: {
  listingId: string;
  propertyId?: string;
  projectId?: string;
  assetType: 'property_unit' | 'project_unit';
  assetId: string;
  tenantId: string;
  userId: string;
}): Promise<{ id: string; current_phase: SLCPhase }> {
  // Try to find existing open case
  const { data: existing } = await supabase
    .from('sales_cases')
    .select('id, current_phase')
    .eq('listing_id', opts.listingId)
    .is('closed_at', null)
    .maybeSingle();

  if (existing) return existing as { id: string; current_phase: SLCPhase };

  // Create new case
  const { data: created, error } = await supabase
    .from('sales_cases')
    .insert({
      asset_type: opts.assetType,
      asset_id: opts.assetId,
      property_id: opts.propertyId || null,
      project_id: opts.projectId || null,
      listing_id: opts.listingId,
      current_phase: 'mandate_active' as SLCPhase,
      tenant_id: opts.tenantId,
    })
    .select('id, current_phase')
    .single();

  if (error) throw error;
  return created as { id: string; current_phase: SLCPhase };
}
