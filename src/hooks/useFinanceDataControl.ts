/**
 * useFinanceDataControl — Hook for FDC Control Tab
 * 
 * Loads registry, links, actions + SSOT snapshot.
 * Runs integrity engine client-side. Provides action resolution handlers.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { computeFinanceIntegrity } from '@/engines/fdc/engine';
import { loadFDCSnapshot } from '@/services/fdc/snapshotLoader';
import { useDataEventLedger } from '@/hooks/useDataEventLedger';
import { FDC_LEDGER_EVENTS } from '@/engines/fdc/conventions';
import type {
  FDCRegistryEntry,
  FDCLink,
  FDCRepairAction,
  FDCIntegrityResult,
} from '@/engines/fdc/spec';

export function useFinanceDataControl() {
  const { activeTenantId, user } = useAuth();
  const { logEvent } = useDataEventLedger();

  const [registry, setRegistry] = useState<FDCRegistryEntry[]>([]);
  const [links, setLinks] = useState<FDCLink[]>([]);
  const [actions, setActions] = useState<FDCRepairAction[]>([]);
  const [integrityResult, setIntegrityResult] = useState<FDCIntegrityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!activeTenantId) return;
    setLoading(true);
    setError(null);

    try {
      const [registryRes, linksRes, actionsRes, snapshot] = await Promise.all([
        supabase.from('finance_data_registry').select('*').eq('tenant_id', activeTenantId).eq('status', 'active'),
        supabase.from('finance_entity_links').select('*').eq('tenant_id', activeTenantId),
        supabase.from('finance_repair_actions').select('*').eq('tenant_id', activeTenantId).eq('status', 'open'),
        loadFDCSnapshot(activeTenantId),
      ]);

      if (registryRes.error) throw registryRes.error;
      if (linksRes.error) throw linksRes.error;
      if (actionsRes.error) throw actionsRes.error;

      const reg = (registryRes.data || []) as unknown as FDCRegistryEntry[];
      const lnk = (linksRes.data || []) as unknown as FDCLink[];
      const acts = (actionsRes.data || []) as unknown as FDCRepairAction[];

      setRegistry(reg);
      setLinks(lnk);
      setActions(acts);

      // Run integrity engine
      const result = computeFinanceIntegrity(activeTenantId, snapshot, reg, lnk, new Date());
      setIntegrityResult(result);
    } catch (err: any) {
      console.error('[FDC] Failed to load control data:', err);
      setError(err.message || 'Fehler beim Laden der Kontrolldaten');
    } finally {
      setLoading(false);
    }
  }, [activeTenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Action Resolution Handlers ─────────────────────────────
  const resolveAction = useCallback(async (actionId: string, metadata?: Record<string, unknown>) => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('finance_repair_actions')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
        metadata: metadata || {},
      } as any)
      .eq('id', actionId);

    if (!error) {
      logEvent({
        tenantId: activeTenantId || undefined,
        zone: 'Z2',
        eventType: FDC_LEDGER_EVENTS.ACTION_RESOLVED,
        direction: 'mutate',
        source: 'mod18:control_tab',
        entityType: 'finance_repair_action',
        entityId: actionId,
      });
      await loadData();
    }
    return error;
  }, [user?.id, activeTenantId, logEvent, loadData]);

  const suppressAction = useCallback(async (actionId: string) => {
    const { error } = await supabase
      .from('finance_repair_actions')
      .update({
        status: 'suppressed',
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id || null,
      } as any)
      .eq('id', actionId);

    if (!error) {
      logEvent({
        tenantId: activeTenantId || undefined,
        zone: 'Z2',
        eventType: FDC_LEDGER_EVENTS.ACTION_UPDATED,
        direction: 'mutate',
        source: 'mod18:control_tab',
        entityType: 'finance_repair_action',
        entityId: actionId,
      });
      await loadData();
    }
    return error;
  }, [user?.id, activeTenantId, logEvent, loadData]);

  const createLink = useCallback(async (
    fromType: string, fromId: string,
    toType: string, toId: string,
    linkType: string
  ) => {
    if (!activeTenantId) return;
    const { error } = await supabase
      .from('finance_entity_links')
      .insert({
        tenant_id: activeTenantId,
        from_type: fromType,
        from_id: fromId,
        to_type: toType,
        to_id: toId,
        link_type: linkType,
        created_by: user?.id || null,
      } as any);

    if (!error) {
      logEvent({
        tenantId: activeTenantId,
        zone: 'Z2',
        eventType: FDC_LEDGER_EVENTS.LINK_CREATED,
        direction: 'mutate',
        source: 'mod18:control_tab',
        entityType: 'finance_entity_link',
        payload: { from_type: fromType, from_id: fromId, to_type: toType, to_id: toId, link_type: linkType },
      });
      await loadData();
    }
    return error;
  }, [activeTenantId, user?.id, logEvent, loadData]);

  // Group actions by severity for UI
  const groupedActions = useMemo(() => {
    const groups = { block: [] as FDCRepairAction[], warn: [] as FDCRepairAction[], info: [] as FDCRepairAction[] };
    for (const action of actions) {
      const sev = action.severity as keyof typeof groups;
      if (groups[sev]) groups[sev].push(action);
      else groups.info.push(action);
    }
    return groups;
  }, [actions]);

  return {
    registry,
    links,
    actions,
    groupedActions,
    integrityResult,
    loading,
    error,
    resolveAction,
    suppressAction,
    createLink,
    refresh: loadData,
  };
}
