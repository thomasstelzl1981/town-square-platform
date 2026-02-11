/**
 * GoldenPathGuard V1.0 — Generischer Route-Guard
 * 
 * Manifest-getrieben, kein MOD-spezifischer Code.
 * Prueft via Engine + Context Resolver ob die aktuelle Route betreten werden darf.
 * Bei Fehlschlag: Redirect + Toast.
 */

import React, { useEffect } from 'react';
import { Navigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useGoldenPath } from './useGoldenPath';
import { getGoldenPath } from './engine';

interface GoldenPathGuardProps {
  /** Modul-Code, z.B. 'MOD-04' */
  moduleCode: string;
  /** URL-Param Name fuer die Entity-ID, z.B. 'id' */
  entityIdParam?: string;
  children: React.ReactNode;
}

export function GoldenPathGuard({
  moduleCode,
  entityIdParam,
  children,
}: GoldenPathGuardProps) {
  const params = useParams();
  const location = useLocation();
  const { activeTenantId } = useAuth();

  const entityId = entityIdParam ? params[entityIdParam] : undefined;

  const { checkRoute, isLoading, flags } = useGoldenPath(moduleCode, {
    tenantId: activeTenantId ?? undefined,
    entityId,
    enabled: !!activeTenantId,
  });

  const gp = getGoldenPath(moduleCode);

  // Normalisiere aktuelle Route gegen GP routePatterns
  const currentPath = location.pathname;

  // Finde passenden Step routePattern
  const matchingPattern = gp?.steps
    .filter((s) => s.routePattern)
    .find((s) => {
      const pattern = s.routePattern!;
      // Einfacher Pattern-Match: ersetze :param durch aktuelle Werte
      const regex = new RegExp(
        '^' + pattern.replace(/:[a-zA-Z]+/g, '[^/]+') + '$'
      );
      return regex.test(currentPath);
    })?.routePattern;

  const result = matchingPattern ? checkRoute(matchingPattern) : { allowed: true as const };

  const shouldRedirect = !isLoading && !result.allowed;
  const redirectTo = !result.allowed ? (result.redirectTo ?? gp?.failure_redirect ?? '/portal') : undefined;

  useEffect(() => {
    if (shouldRedirect && result && !result.allowed && result.message) {
      toast.error('Zugriff nicht möglich', {
        description: result.message,
      });
    }
  }, [shouldRedirect, result]);

  if (isLoading) {
    return null;
  }

  if (shouldRedirect && redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
