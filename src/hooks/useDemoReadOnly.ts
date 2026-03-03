/**
 * useDemoReadOnly — Frontend guard for demo tenant
 * 
 * Returns isReadOnly=true when the current session is a demo session.
 * Components should use this to disable create/edit/delete actions.
 * 
 * Backend enforcement: RESTRICTIVE RLS policy on tenant_mode='demo'
 * prevents any writes even if the frontend guard is bypassed.
 */

import { useCallback } from 'react';
import { isDemoSession } from '@/config/demoAccountConfig';
import { toast } from 'sonner';

export function useDemoReadOnly() {
  const isReadOnly = isDemoSession();

  const showReadOnlyHint = useCallback(() => {
    toast.info('Demo-Modus: Änderungen können nicht gespeichert werden.', {
      description: 'Erstellen Sie einen eigenen Account, um alle Funktionen zu nutzen.',
      duration: 4000,
    });
  }, []);

  /** Wrap a mutation handler — blocks execution in demo mode with toast */
  const guardAction = useCallback(<T extends (...args: any[]) => any>(fn: T): T => {
    if (!isReadOnly) return fn;
    return ((...args: any[]) => {
      showReadOnlyHint();
      return undefined;
    }) as unknown as T;
  }, [isReadOnly, showReadOnlyHint]);

  return { isReadOnly, showReadOnlyHint, guardAction };
}
