/**
 * Client-side Data Event Ledger hook.
 * Calls the gatekeeping RPC log_data_event() — SECURITY DEFINER.
 * Fire-and-forget: never blocks UI.
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LogEventParams {
  tenantId?: string;
  zone?: 'Z1' | 'Z2' | 'Z3' | 'EXTERN';
  eventType: string;
  direction: 'ingress' | 'egress' | 'mutate' | 'delete';
  source?: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
}

export function useDataEventLedger() {
  const { activeTenantId } = useAuth();

  const logEvent = useCallback(async (params: LogEventParams) => {
    try {
      await supabase.rpc('log_data_event' as any, {
        p_tenant_id: params.tenantId || activeTenantId || null,
        p_zone: params.zone || 'Z2',
        p_event_type: params.eventType,
        p_direction: params.direction,
        p_source: params.source || 'ui',
        p_entity_type: params.entityType || null,
        p_entity_id: params.entityId || null,
        p_payload: params.payload || {},
      });
    } catch (err) {
      console.warn('[LEDGER] Failed to log event:', err);
    }
  }, [activeTenantId]);

  return { logEvent };
}
