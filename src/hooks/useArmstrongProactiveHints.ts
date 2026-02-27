/**
 * useArmstrongProactiveHints — Cross-module proactive Armstrong messages
 * 
 * Listens for custom events dispatched by module pages and surfaces
 * proactive Armstrong hints to the user. Generalizes the pattern from
 * MOD-13 (useIntakeListener) to all modules.
 * 
 * Usage in module pages:
 *   window.dispatchEvent(new CustomEvent('armstrong:proactive', {
 *     detail: { module: 'MOD-04', hint: 'Ich sehe, dass noch 5 Felder fehlen...' }
 *   }));
 */
import { useState, useEffect, useCallback } from 'react';

export interface ProactiveHint {
  id: string;
  module: string;
  hint: string;
  timestamp: Date;
  dismissed: boolean;
}

export function useArmstrongProactiveHints() {
  const [hints, setHints] = useState<ProactiveHint[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.hint || !detail?.module) return;

      const newHint: ProactiveHint = {
        id: crypto.randomUUID(),
        module: detail.module,
        hint: detail.hint,
        timestamp: new Date(),
        dismissed: false,
      };

      setHints(prev => [...prev.slice(-4), newHint]); // Keep max 5
    };

    window.addEventListener('armstrong:proactive', handler);
    return () => window.removeEventListener('armstrong:proactive', handler);
  }, []);

  const dismissHint = useCallback((id: string) => {
    setHints(prev => prev.map(h => h.id === id ? { ...h, dismissed: true } : h));
  }, []);

  const dismissAll = useCallback(() => {
    setHints(prev => prev.map(h => ({ ...h, dismissed: true })));
  }, []);

  const activeHints = hints.filter(h => !h.dismissed);
  const latestHint = activeHints[activeHints.length - 1] || null;

  return { hints: activeHints, latestHint, dismissHint, dismissAll };
}
