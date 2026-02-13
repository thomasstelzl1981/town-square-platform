/**
 * useDemoLocalEntity — Generic guard/badge hook for Zone-2-only Golden Path processes
 * 
 * Usage:
 *   const { isDemoEntity, showDemo, DemoBadge } = useDemoLocalEntity('GP-SANIERUNG', entityId);
 * 
 * - isDemoEntity: true if the current entityId matches '__demo__'
 * - showDemo: true if the toggle for the process is enabled
 * - DemoBadge: React component rendering a smaragdgrünes "DEMO" badge
 * - guardRedirect: if toggle is OFF and entityId is '__demo__', returns the redirect path
 * 
 * @see src/manifests/demoDataManifest.ts
 */

import { useMemo, type ReactNode } from 'react';
import React from 'react';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { getProcessById } from '@/manifests/goldenPathProcesses';
import { Badge } from '@/components/ui/badge';

const DEMO_ENTITY_ID = '__demo__';

export function isDemoEntityId(entityId: string | null | undefined): boolean {
  return entityId === DEMO_ENTITY_ID || (typeof entityId === 'string' && entityId.startsWith('demo-'));
}

interface UseDemoLocalEntityResult {
  /** Whether the current entity is a demo entity */
  isDemoEntity: boolean;
  /** Whether the demo toggle for this process is enabled */
  showDemo: boolean;
  /** If toggle is OFF and entity is demo → redirect path; otherwise null */
  guardRedirect: string | null;
  /** Demo badge component (renders nothing if not a demo entity) */
  DemoBadge: () => ReactNode;
  /** Block DB mutations for demo entities */
  blockMutation: boolean;
}

export function useDemoLocalEntity(
  processId: string,
  entityId: string | null | undefined
): UseDemoLocalEntityResult {
  const { isEnabled } = useDemoToggles();
  const showDemo = isEnabled(processId);
  const isDemo = isDemoEntityId(entityId);

  const guardRedirect = useMemo(() => {
    if (isDemo && !showDemo) {
      const process = getProcessById(processId);
      return process?.tilePath ?? null;
    }
    return null;
  }, [isDemo, showDemo, processId]);

  const DemoBadge = useMemo(() => {
    return function DemoBadgeComponent(): ReactNode {
      if (!isDemo) return null;
      return React.createElement(Badge, {
        variant: 'outline' as const,
        className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs font-semibold',
        children: 'DEMO',
      });
    };
  }, [isDemo]);

  return {
    isDemoEntity: isDemo,
    showDemo,
    guardRedirect,
    DemoBadge,
    blockMutation: isDemo,
  };
}
