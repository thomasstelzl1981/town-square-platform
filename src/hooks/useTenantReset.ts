/**
 * Tenant Reset Hook — calls reset_sandbox_tenant RPC + storage reset edge function
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

  const resetTenant = useCallback(async () => {
    if (!tenantId) return;
    setIsResetting(true);
    setError(null);
    try {
      // Phase 1: DB reset
      const { data, error: rpcError } = await supabase.rpc('reset_sandbox_tenant' as any, { p_tenant_id: tenantId });
      if (rpcError) throw rpcError;
      setResult(data as ResetResult);

      // Phase 2: Storage reset (edge function)
      try {
        await supabase.functions.invoke('sot-tenant-storage-reset', {
          body: { tenant_id: tenantId, confirm: true },
        });
      } catch (storageErr) {
        console.warn('[TenantReset] Storage reset skipped:', storageErr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset fehlgeschlagen');
    } finally {
      setIsResetting(false);
    }
  }, [tenantId]);

  return { resetTenant, isResetting, result, error };
}
