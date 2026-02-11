/**
 * React Hook: useGoldenPath V1.0
 * 
 * Generischer Hook — nutzt Context Resolver Registry.
 * Kein MOD-04-spezifischer Code mehr.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { GoldenPathContext, StepEvaluation, GoldenPathStep } from '@/manifests/goldenPaths/types';
import {
  getGoldenPath,
  evaluateGoldenPath,
  canEnterRoute,
  canRunAction,
  nextStep,
  isCompleted as gpIsCompleted,
} from './engine';
import { getContextResolver } from './contextResolvers';

interface UseGoldenPathOptions {
  tenantId?: string;
  entityId?: string;
  enabled?: boolean;
  /** @deprecated Verwende entityId statt propertyId */
  propertyId?: string;
}

interface UseGoldenPathResult {
  /** Alle Step-Evaluationen */
  evaluations: StepEvaluation[];
  /** Naechster offener Step */
  next: GoldenPathStep | undefined;
  /** Route-Guard Check */
  checkRoute: (routePattern: string) => ReturnType<typeof canEnterRoute>;
  /** Action-Guard Check */
  checkAction: (actionId: string) => ReturnType<typeof canRunAction>;
  /** Ist der GP abgeschlossen (success_state erreicht) */
  isCompleted: boolean;
  /** Lade-Status */
  isLoading: boolean;
  /** Context-Flags (fuer Debugging) */
  flags: Record<string, boolean>;
}

export function useGoldenPath(
  moduleCode: string,
  options: UseGoldenPathOptions = {}
): UseGoldenPathResult {
  const {
    tenantId,
    entityId: entityIdProp,
    propertyId,
    enabled = true,
  } = options;

  // Backwards compat: propertyId → entityId
  const entityId = entityIdProp ?? propertyId;

  const gp = getGoldenPath(moduleCode);
  const resolver = getContextResolver(moduleCode);

  const { data: flags = {}, isLoading } = useQuery({
    queryKey: ['golden-path-context', moduleCode, entityId, tenantId],
    queryFn: async (): Promise<Record<string, boolean>> => {
      if (!resolver) {
        console.warn(`[GoldenPath] No context resolver for module: ${moduleCode}`);
        return {};
      }
      return resolver({ tenantId, entityId });
    },
    enabled: enabled && !!resolver,
    staleTime: 30_000,
  });

  const ctx: GoldenPathContext = useMemo(
    () => ({ entityId, tenantId, propertyId: entityId, flags }),
    [entityId, tenantId, flags]
  );

  const evaluations = useMemo(() => {
    if (!gp) return [];
    return evaluateGoldenPath(gp, ctx);
  }, [gp, ctx]);

  const nextStepResult = useMemo(() => {
    if (!gp) return undefined;
    return nextStep(gp, ctx);
  }, [gp, ctx]);

  const completed = useMemo(() => {
    if (!gp) return false;
    return gpIsCompleted(gp, ctx);
  }, [gp, ctx]);

  const checkRoute = useMemo(() => {
    return (routePattern: string) => {
      if (!gp) return { allowed: true as const };
      return canEnterRoute(gp, routePattern, ctx);
    };
  }, [gp, ctx]);

  const checkAction = useMemo(() => {
    return (actionId: string) => {
      if (!gp) return { allowed: true as const };
      return canRunAction(gp, actionId, ctx);
    };
  }, [gp, ctx]);

  return {
    evaluations,
    next: nextStepResult,
    checkRoute,
    checkAction,
    isCompleted: completed,
    isLoading,
    flags,
  };
}
