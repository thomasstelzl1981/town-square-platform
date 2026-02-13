/**
 * useDemoToggles — Hook für Golden Path Demo-Daten-Steuerung
 * 
 * Persistiert Toggle-Zustände via localStorage.
 * Module konsumieren diesen Hook, um zu entscheiden ob das Demo-Widget gerendert wird.
 */

import { useState, useCallback, useEffect } from 'react';
import { GOLDEN_PATH_PROCESSES } from '@/manifests/goldenPathProcesses';

const STORAGE_KEY = 'gp_demo_toggles';

type DemoToggles = Record<string, boolean>;

function loadToggles(): DemoToggles {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toggles));
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
