/**
 * useZuhauseWidgets — Manages widget list + order for Zuhause page
 * 
 * Builds dynamic widget IDs from DB data (homes, cameras, contracts)
 * and persists user-chosen order in localStorage (user-scoped).
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useHomesQuery } from '../shared/useHomesQuery';
import { useCameras } from '@/hooks/useCameras';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function storageKey(base: string, userId: string | undefined) {
  return userId ? `${base}-${userId}` : base;
}

export type ZuhauseWidgetType =
  | 'home-address'
  | 'home-streetview'
  | 'home-satellite'
  | 'camera'
  | 'service'
  | 'contract';

export interface ZuhauseWidgetDef {
  id: string;
  type: ZuhauseWidgetType;
  label: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}

export function useZuhauseWidgets() {
  const { user, activeTenantId } = useAuth();
  const userId = user?.id;

  const { data: homes = [], isLoading: homesLoading } = useHomesQuery();
  const { camerasQuery } = useCameras();
  const cameras = camerasQuery.data ?? [];
  const camerasLoading = camerasQuery.isLoading;

  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['miety-contracts-all', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('miety_contracts')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const dataReady = !homesLoading && !camerasLoading && !contractsLoading;

  // Track whether we've done the initial hydration from localStorage
  const hydratedRef = useRef(false);

  // Build all possible widgets from DB data
  const allWidgets = useMemo<ZuhauseWidgetDef[]>(() => {
    const widgets: ZuhauseWidgetDef[] = [];

    homes.forEach((home) => {
      widgets.push({
        id: `home-address-${home.id}`,
        type: 'home-address',
        label: home.name || 'Mein Objekt',
        entityId: home.id,
        meta: home,
      });
      widgets.push({
        id: `home-streetview-${home.id}`,
        type: 'home-streetview',
        label: 'Street View',
        entityId: home.id,
        meta: home,
      });
      widgets.push({
        id: `home-satellite-${home.id}`,
        type: 'home-satellite',
        label: 'Satellit',
        entityId: home.id,
        meta: home,
      });
    });

    cameras.forEach((cam) => {
      widgets.push({
        id: `camera-${cam.id}`,
        type: 'camera',
        label: cam.name,
        entityId: cam.id,
        meta: cam as unknown as Record<string, unknown>,
      });
    });

    widgets.push({
      id: 'service-myhammer',
      type: 'service',
      label: 'MyHammer',
      meta: { serviceId: 'myhammer' },
    });
    widgets.push({
      id: 'service-betreut',
      type: 'service',
      label: 'Betreut.de',
      meta: { serviceId: 'betreut' },
    });

    contracts.forEach((contract: any) => {
      widgets.push({
        id: `contract-${contract.id}`,
        type: 'contract',
        label: contract.provider_name || contract.category || 'Vertrag',
        entityId: contract.id,
        meta: contract,
      });
    });

    return widgets;
  }, [homes, cameras, contracts]);

  const allWidgetIds = useMemo(() => allWidgets.map(w => w.id), [allWidgets]);

  // ── Hidden widgets (user-scoped) ──
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  // ── Order state ──
  const [order, setOrder] = useState<string[]>([]);

  // Hydrate from localStorage once data is ready + userId is known
  useEffect(() => {
    if (!dataReady || !userId) return;
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    // Hydrate hidden
    try {
      const savedHidden = localStorage.getItem(storageKey('zuhause-hidden-widgets', userId));
      if (savedHidden) {
        const parsed = JSON.parse(savedHidden) as string[];
        // Only keep IDs that still exist
        setHiddenIds(new Set(parsed.filter(id => allWidgetIds.includes(id))));
      }
    } catch { /* ignore */ }

    // Hydrate order
    try {
      const savedOrder = localStorage.getItem(storageKey('zuhause-widget-order', userId));
      if (savedOrder) {
        const parsed = JSON.parse(savedOrder) as string[];
        // Keep only IDs that exist in current allWidgetIds
        const valid = parsed.filter(id => allWidgetIds.includes(id));
        // Append any new IDs not in saved order
        const newIds = allWidgetIds.filter(id => !parsed.includes(id));
        setOrder([...valid, ...newIds]);
        return;
      }
    } catch { /* ignore */ }

    // No saved order → use default
    setOrder(allWidgetIds);
  }, [dataReady, userId, allWidgetIds]);

  // Sync when allWidgetIds changes AFTER initial hydration (e.g. new camera added)
  useEffect(() => {
    if (!hydratedRef.current) return;

    setOrder(current => {
      if (current.length === 0) return allWidgetIds;

      const currentSet = new Set(current);
      const validSet = new Set(allWidgetIds);

      // Remove IDs that no longer exist, keep user order
      const valid = current.filter(id => validSet.has(id));
      // Append genuinely new IDs
      const newIds = allWidgetIds.filter(id => !currentSet.has(id));

      if (newIds.length > 0 || valid.length !== current.length) {
        const updated = [...valid, ...newIds];
        if (userId) {
          localStorage.setItem(storageKey('zuhause-widget-order', userId), JSON.stringify(updated));
        }
        return updated;
      }
      return current;
    });
  }, [allWidgetIds, userId]);

  // Reset hydration flag when user changes
  useEffect(() => {
    hydratedRef.current = false;
    setOrder([]);
    setHiddenIds(new Set());
  }, [userId]);

  const updateOrder = useCallback((newOrder: string[]) => {
    setOrder(newOrder);
    if (userId) {
      try { localStorage.setItem(storageKey('zuhause-widget-order', userId), JSON.stringify(newOrder)); } catch { /* ignore */ }
    }
  }, [userId]);

  const hideWidget = useCallback((id: string) => {
    setHiddenIds(prev => {
      const next = new Set(prev);
      next.add(id);
      if (userId) localStorage.setItem(storageKey('zuhause-hidden-widgets', userId), JSON.stringify([...next]));
      return next;
    });
  }, [userId]);

  const showWidget = useCallback((id: string) => {
    setHiddenIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      if (userId) localStorage.setItem(storageKey('zuhause-hidden-widgets', userId), JSON.stringify([...next]));
      return next;
    });
  }, [userId]);

  const visibleWidgetIds = useMemo(
    () => order.filter(id => !hiddenIds.has(id)),
    [order, hiddenIds]
  );

  const getWidget = useCallback(
    (id: string) => allWidgets.find(w => w.id === id),
    [allWidgets]
  );

  return {
    allWidgets,
    visibleWidgetIds,
    order,
    updateOrder,
    hideWidget,
    showWidget,
    hiddenIds,
    getWidget,
    homes,
    cameras,
    contracts,
    isLoading: !dataReady,
  };
}
