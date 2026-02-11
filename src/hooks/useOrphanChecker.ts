/**
 * Orphan Checker Hook — calls check_data_orphans RPC
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OrphanCheckResult {
  extractions_without_document: number;
  chunks_without_document: number;
  links_without_document: number;
}

export function useOrphanChecker(tenantId: string | null) {
  const [result, setResult] = useState<OrphanCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    if (!tenantId) return;
    setIsChecking(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('check_data_orphans' as any, { p_tenant_id: tenantId });
      if (rpcError) throw rpcError;
      setResult(data as OrphanCheckResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Orphan-Check fehlgeschlagen');
    } finally {
      setIsChecking(false);
    }
  }, [tenantId]);

  const hasOrphans = result ? Object.values(result).some(v => v > 0) : false;

  return { result, isChecking, error, hasOrphans, runCheck };
}
