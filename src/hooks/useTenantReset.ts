/**
 * Tenant Reset Hook — calls reset_sandbox_tenant RPC + storage reset edge function
 * Logs tenant.reset.started / tenant.reset.completed to data_event_ledger via RPC.
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ResetResult {
  success: boolean;
  total_deleted: number;
  details: Record<string, number>;
}

export function useTenantReset(tenantId: string | null) {
  const [isResetting, setIsResetting] = useState(false);
  const [result, setResult] = useState<ResetResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const logLedgerEvent = async (eventType: string, payload: Record<string, unknown>) => {
    try {
      await supabase.rpc('log_data_event' as any, {
        p_tenant_id: tenantId,
        p_zone: 'Z1',
        p_event_type: eventType,
        p_direction: 'delete',
        p_source: 'ui',
        p_entity_type: 'tenant',
        p_entity_id: tenantId,
        p_payload: payload,
      });
    } catch (err) {
      console.warn('[LEDGER] Failed to log reset event:', err);
    }
  };

  const resetTenant = useCallback(async () => {
    if (!tenantId) return;
    setIsResetting(true);
    setError(null);
    const startMs = Date.now();
    const correlationId = crypto.randomUUID();

    try {
      // Log: reset started
      await logLedgerEvent('tenant.reset.started', {
        tenant_id: tenantId,
        triggered_by: 'admin_ui',
      });

      // Phase 1: DB reset
      const { data, error: rpcError } = await supabase.rpc('reset_sandbox_tenant' as any, { p_tenant_id: tenantId });
      if (rpcError) throw rpcError;
      setResult(data as ResetResult);

      // Phase 2: Storage reset (edge function)
      let storageDeleted: Record<string, number> = {};
      try {
        const { data: storageData } = await supabase.functions.invoke('sot-tenant-storage-reset', {
          body: { tenant_id: tenantId, confirm: true },
        });
        storageDeleted = storageData?.deleted || {};
      } catch (storageErr) {
        console.warn('[TenantReset] Storage reset skipped:', storageErr);
      }

      // Log: reset completed
      await logLedgerEvent('tenant.reset.completed', {
        tenant_id: tenantId,
        reason: 'admin_reset',
        correlation_id: correlationId,
        tables_deleted: data || {},
        storage_deleted: storageDeleted,
        duration_ms: Date.now() - startMs,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset fehlgeschlagen');
    } finally {
      setIsResetting(false);
    }
  }, [tenantId]);

  return { resetTenant, isResetting, result, error };
}
