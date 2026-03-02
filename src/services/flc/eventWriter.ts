/**
 * FLC Central Event Writer — Client-side helper
 * 
 * Used by hooks and components to write finance_lifecycle_events.
 * Edge functions use their own direct inserts for service_role access.
 * 
 * Only persistence + idempotency. NO business logic.
 * 
 * v1.1.0: Added `phase` field support for stuck-clock (Fix #2)
 */

import { supabase } from '@/integrations/supabase/client';
import type { FLCEventType, FLCPhase } from '@/engines/flc/spec';
import { FLC_EVENT_PHASE_MAP } from '@/engines/flc/spec';

export interface WriteFinanceEventParams {
  finance_request_id: string;
  finance_mandate_id?: string | null;
  future_room_case_id?: string | null;
  event_type: string;
  phase?: string | null;
  actor_id?: string | null;
  actor_type?: 'user' | 'system' | 'cron';
  event_source?: string | null;
  idempotency_key?: string | null;
  correlation_key?: string | null;
  metadata?: Record<string, unknown>;
}

export interface WriteFinanceEventResult {
  success: boolean;
  event_id?: string;
  created_at?: string;
  error?: string;
  duplicate?: boolean;
}

/**
 * Writes a single finance lifecycle event with idempotency support.
 * If idempotency_key is provided and already exists, the insert is silently skipped.
 * 
 * Fix #2: Automatically derives `phase` from event_type via FLC_EVENT_PHASE_MAP
 *         if not explicitly provided. This enables stuck-clock queries.
 */
export async function writeFinanceEvent(params: WriteFinanceEventParams): Promise<WriteFinanceEventResult> {
  try {
    // Auto-derive phase from event type if not explicitly set
    const derivedPhase = params.phase ??
      FLC_EVENT_PHASE_MAP[params.event_type as FLCEventType] ??
      null;

    const { data, error } = await supabase
      .from('finance_lifecycle_events' as any)
      .insert({
        finance_request_id: params.finance_request_id,
        finance_mandate_id: params.finance_mandate_id || null,
        future_room_case_id: params.future_room_case_id || null,
        event_type: params.event_type,
        phase: derivedPhase,
        actor_id: params.actor_id || null,
        actor_type: params.actor_type || 'user',
        event_source: params.event_source || null,
        idempotency_key: params.idempotency_key || null,
        correlation_key: params.correlation_key || null,
        metadata: params.metadata || {},
      } as any)
      .select('id, created_at')
      .single();

    if (error) {
      // Unique constraint violation on idempotency_key = duplicate, not an error
      if (error.code === '23505' && params.idempotency_key) {
        return { success: true, duplicate: true };
      }
      return { success: false, error: error.message };
    }

    return {
      success: true,
      event_id: (data as any)?.id,
      created_at: (data as any)?.created_at,
    };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Writes multiple events in a batch. Best-effort: individual failures don't block others.
 */
export async function writeFinanceEventsBatch(events: WriteFinanceEventParams[]): Promise<WriteFinanceEventResult[]> {
  return Promise.all(events.map(writeFinanceEvent));
}
