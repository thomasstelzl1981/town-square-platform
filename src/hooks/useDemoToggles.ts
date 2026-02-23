/**
 * useDemoToggles — Hook für Golden Path Demo-Daten-Steuerung
 * 
 * Persistiert Toggle-Zustände via localStorage.
 * Toggle ON → seedDemoData (aus CSVs in DB schreiben)
 * Toggle OFF → cleanupDemoData (alle registrierten Entities löschen)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { GOLDEN_PATH_PROCESSES } from '@/manifests/goldenPathProcesses';
import { supabase } from '@/integrations/supabase/client';
import { seedDemoData, SeedProgressInfo } from '@/hooks/useDemoSeedEngine';
import { cleanupDemoData } from '@/hooks/useDemoCleanup';

const STORAGE_KEY_PREFIX = 'gp_demo_toggles';

type DemoToggles = Record<string, boolean>;

/**
 * Build tenant-scoped storage key.
 * Falls back to generic key if no tenant available yet.
 */
function getStorageKey(): string {
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
    const oldRaw = localStorage.getItem('gp_demo_toggles');
    if (oldRaw) {
      const parsed = JSON.parse(oldRaw);
      localStorage.setItem(key, oldRaw);
      return parsed;
    }
  } catch {
    // ignore
  }
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
  const [isSeedingOrCleaning, setIsSeedingOrCleaning] = useState(false);
  const [pendingAction, setPendingAction] = useState<'seeding' | 'cleaning' | null>(null);
  const [seedProgress, setSeedProgress] = useState<SeedProgressInfo | null>(null);
  const seedLockRef = useRef(false);

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

  /** Get tenant ID from current session */
  const getTenantId = useCallback(async (): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('active_tenant_id')
        .eq('id', user.id)
        .single();
      return profile?.active_tenant_id ?? null;
    } catch {
      return null;
    }
  }, []);

  const toggleAll = useCallback(async (on: boolean) => {
    // Prevent concurrent seed/cleanup operations
    if (seedLockRef.current) return;
    seedLockRef.current = true;
    setIsSeedingOrCleaning(true);
    setPendingAction(on ? 'seeding' : 'cleaning');

    try {
      const tenantId = await getTenantId();

      if (tenantId) {
      if (on) {
          // Always run cleanup first, then seed fresh — avoids partial state from previous failures
          await cleanupDemoData(tenantId);
          const result = await seedDemoData(tenantId, undefined, (info) => setSeedProgress(info));
          if (!result.success) {
            const { toast } = await import('sonner');
            const firstErrors = result.errors.slice(0, 3).join('\n');
            toast.error(`Seed-Fehler: ${result.errors.length} Entitäten fehlgeschlagen`, {
              description: firstErrors,
              duration: 10000,
            });
            console.error('[DemoToggles] Seed errors:', result.errors);
          }
        } else {
          // Cleanup all registered demo entities
          await cleanupDemoData(tenantId);
        }
      }

      setToggles(() => {
        const next: DemoToggles = {};
        GOLDEN_PATH_PROCESSES.forEach(p => { next[p.id] = on; });
        return next;
      });
    } catch (err) {
      console.error('[DemoToggles] toggleAll error:', err);
    } finally {
      seedLockRef.current = false;
      setIsSeedingOrCleaning(false);
      setPendingAction(null);
      setSeedProgress(null);
    }
  }, [getTenantId]);

  const allEnabled = Object.values(toggles).every(Boolean);
  const noneEnabled = Object.values(toggles).every(v => !v);

  return { isEnabled, toggle, toggleAll, toggles, allEnabled, noneEnabled, isSeedingOrCleaning, pendingAction, seedProgress };
}
