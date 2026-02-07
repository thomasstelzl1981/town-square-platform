/**
 * useWidgetOrder — Manages persistent widget order for Dashboard
 * 
 * Phase 1: localStorage persistence
 * Phase 2: Database sync (future)
 */

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'dashboard-widget-order';

export function useWidgetOrder(defaultWidgetIds: string[]) {
  const [order, setOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        // Merge logic: Keep saved order for existing widgets, add new ones at end
        const validSaved = parsed.filter((id) => defaultWidgetIds.includes(id));
        const newIds = defaultWidgetIds.filter((id) => !parsed.includes(id));
        return [...validSaved, ...newIds];
      }
    } catch (e) {
      console.warn('Failed to load widget order from localStorage:', e);
    }
    return defaultWidgetIds;
  });

  // Sync with defaultWidgetIds when they change (e.g., new widget added by Armstrong)
  useEffect(() => {
    setOrder((currentOrder) => {
      const currentSet = new Set(currentOrder);
      const defaultSet = new Set(defaultWidgetIds);
      
      // Remove widgets that no longer exist
      const validOrder = currentOrder.filter((id) => defaultSet.has(id));
      
      // Add new widgets that aren't in current order
      const newIds = defaultWidgetIds.filter((id) => !currentSet.has(id));
      
      if (newIds.length > 0 || validOrder.length !== currentOrder.length) {
        return [...validOrder, ...newIds];
      }
      
      return currentOrder;
    });
  }, [defaultWidgetIds]);

  const updateOrder = useCallback((newOrder: string[]) => {
    setOrder(newOrder);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
    } catch (e) {
      console.warn('Failed to save widget order to localStorage:', e);
    }
  }, []);

  const resetOrder = useCallback(() => {
    setOrder(defaultWidgetIds);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to reset widget order:', e);
    }
  }, [defaultWidgetIds]);

  return { 
    order, 
    updateOrder, 
    resetOrder 
  };
}
