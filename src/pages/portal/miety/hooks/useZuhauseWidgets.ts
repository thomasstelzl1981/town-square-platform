/**
 * useZuhauseWidgets — Manages widget list + order for Zuhause page
 * 
 * Builds dynamic widget IDs from DB data (homes, cameras, contracts)
 * and persists user-chosen order in localStorage.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useHomesQuery } from '../shared/useHomesQuery';
import { useCameras } from '@/hooks/useCameras';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'zuhause-widget-order';
const HIDDEN_KEY = 'zuhause-hidden-widgets';

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
  const { activeTenantId } = useAuth();
  const { data: homes = [] } = useHomesQuery();
  const { camerasQuery } = useCameras();
  const cameras = camerasQuery.data ?? [];

  const { data: contracts = [] } = useQuery({
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

  // Build all possible widgets from DB data
  const allWidgets = useMemo<ZuhauseWidgetDef[]>(() => {
    const widgets: ZuhauseWidgetDef[] = [];

    // Per home: address + streetview + satellite
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

    // Per camera
    cameras.forEach((cam) => {
      widgets.push({
        id: `camera-${cam.id}`,
        type: 'camera',
        label: cam.name,
        entityId: cam.id,
        meta: cam as unknown as Record<string, unknown>,
      });
    });

    // Service widgets (static)
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

    // Per contract
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

  // Hidden widgets (user removed)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(HIDDEN_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  // Order persistence
  const [order, setOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        const valid = parsed.filter(id => allWidgetIds.includes(id));
        const newIds = allWidgetIds.filter(id => !parsed.includes(id));
        return [...valid, ...newIds];
      }
    } catch { /* ignore */ }
    return allWidgetIds;
  });

  // Sync when allWidgetIds changes
  useEffect(() => {
    setOrder(current => {
      const currentSet = new Set(current);
      const defaultSet = new Set(allWidgetIds);
      const valid = current.filter(id => defaultSet.has(id));
      const newIds = allWidgetIds.filter(id => !currentSet.has(id));
      if (newIds.length > 0 || valid.length !== current.length) {
        const updated = [...valid, ...newIds];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      }
      return current;
    });
  }, [allWidgetIds]);

  const updateOrder = useCallback((newOrder: string[]) => {
    setOrder(newOrder);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder)); } catch { /* ignore */ }
  }, []);

  const hideWidget = useCallback((id: string) => {
    setHiddenIds(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(HIDDEN_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const showWidget = useCallback((id: string) => {
    setHiddenIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      localStorage.setItem(HIDDEN_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  // Visible = ordered + not hidden
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
  };
}
