/**
 * useDemoToggles — Hook für Golden Path Demo-Daten-Steuerung
 * 
 * Persistiert Toggle-Zustände via localStorage.
 * Module konsumieren diesen Hook, um zu entscheiden ob das Demo-Widget gerendert wird.
 */

import { useState, useCallback, useEffect } from 'react';
import { GOLDEN_PATH_PROCESSES } from '@/manifests/goldenPathProcesses';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY_PREFIX = 'gp_demo_toggles';

type DemoToggles = Record<string, boolean>;

/**
 * Build tenant-scoped storage key.
 * Falls back to generic key if no tenant available yet.
 */
function getStorageKey(): string {
  // Try to extract tenant_id from cached session to scope toggles per tenant
  try {
    const sessionStr = localStorage.getItem('sb-ktpvilzjtcaxyuufocrs-auth-token');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      const userId = session?.currentSession?.user?.id || session?.user?.id;
      if (userId) return `${STORAGE_KEY_PREFIX}_${userId}`;
    }
  } catch {
    // ignore
  }
  return STORAGE_KEY_PREFIX;
}

function loadToggles(): DemoToggles {
  try {
    const key = getStorageKey();
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    // Migrate from old unscoped key if exists
    const oldRaw = localStorage.getItem('gp_demo_toggles');
    if (oldRaw) {
      const parsed = JSON.parse(oldRaw);
      localStorage.setItem(key, oldRaw); // migrate
      return parsed;
    }
  } catch {
    // ignore
  }
  // Default: alle Demos an
  const defaults: DemoToggles = {};
  GOLDEN_PATH_PROCESSES.forEach(p => {
    defaults[p.id] = true;
  });
  return defaults;
}

function saveToggles(toggles: DemoToggles) {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(toggles));
  } catch {
    // ignore
  }
}

export function useDemoToggles() {
  const [toggles, setToggles] = useState<DemoToggles>(loadToggles);

  useEffect(() => {
    saveToggles(toggles);
  }, [toggles]);

  const isEnabled = useCallback(
    (processId: string) => toggles[processId] ?? true,
    [toggles]
  );

  const toggle = useCallback((processId: string) => {
    setToggles(prev => ({ ...prev, [processId]: !prev[processId] }));
  }, []);

  const toggleAll = useCallback((on: boolean) => {
    setToggles(prev => {
      const next: DemoToggles = {};
      Object.keys(prev).forEach(k => { next[k] = on; });
      // Ensure all processes are covered
      GOLDEN_PATH_PROCESSES.forEach(p => { next[p.id] = on; });
      return next;
    });
  }, []);

  const allEnabled = Object.values(toggles).every(Boolean);
  const noneEnabled = Object.values(toggles).every(v => !v);

  return { isEnabled, toggle, toggleAll, toggles, allEnabled, noneEnabled };
}
